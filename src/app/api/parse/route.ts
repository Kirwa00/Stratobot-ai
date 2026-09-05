import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BLOCKS, BLOCK_MAP } from "@/lib/blocks";
import { buildReadback } from "@/lib/readback";
import type { BlockInstance, UnmappedClause } from "@/lib/types";

// Real path for Workstream B's "Trader prompt -> LLM -> Blueprint JSON" step
// (Engineering Plan v1.2 §3). The block library below is the single source
// of truth: it drives the tool schema sent to the model and validates/
// clamps whatever the model returns, so a bad or hallucinated response can
// never produce a block or param the rest of the app doesn't understand.
// The client (see lib/store.tsx) falls back to the local keyword parser
// (lib/parser.ts) whenever this route reports `fallback: true` or fails
// outright, so the product flow never hard-depends on the API being up.

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5";
const TOOL_NAME = "extract_strategy_blocks";

interface RawBlock {
  blockId?: string;
  params?: Record<string, string | number>;
  confidence?: number;
}

function describeParam(p: (typeof BLOCKS)[number]["params"][number]): string {
  if (p.type === "select") {
    return `${p.key} (one of: ${p.options!.map((o) => o.value).join(", ")}; default "${p.default}")`;
  }
  if (p.type === "number") {
    return `${p.key} (number${p.unit ? `, ${p.unit}` : ""}, ${p.min}-${p.max}, default ${p.default})`;
  }
  return `${p.key} (text, default "${p.default}")`;
}

function buildBlockCatalog(): string {
  return BLOCKS.map((b) => {
    const params = b.params.map(describeParam).join("; ");
    return `- ${b.id} (${b.role}): ${b.description}${params ? ` Params: ${params}` : ""}`;
  }).join("\n");
}

function buildTool() {
  const blockIds = BLOCKS.map((b) => b.id);
  return {
    name: TOOL_NAME,
    description:
      "Extract structured trading-strategy blocks, and any leftover clauses that don't map to a block, from a trader's free-text strategy description.",
    input_schema: {
      type: "object" as const,
      properties: {
        blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              blockId: { type: "string", enum: blockIds },
              params: {
                type: "object",
                description: "Only the param keys defined for this blockId in the catalog.",
              },
              confidence: {
                type: "number",
                description: "0-1. Use 0.85-1 when the trader stated the params explicitly, 0.5-0.7 when you had to guess a default.",
              },
            },
            required: ["blockId", "params", "confidence"],
          },
        },
        unmapped: {
          type: "array",
          description: "Exact clause text for anything that doesn't match a block in the catalog.",
          items: {
            type: "object",
            properties: { text: { type: "string" } },
            required: ["text"],
          },
        },
      },
      required: ["blocks", "unmapped"],
    },
  };
}

/** Validate + coerce whatever the model returned against the block library, so a
 *  hallucinated id or out-of-range param can never reach the rest of the app. */
function normalizeBlocks(raw: RawBlock[]): BlockInstance[] {
  const out: BlockInstance[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const def = item.blockId ? BLOCK_MAP[item.blockId] : undefined;
    if (!def || seen.has(def.id)) continue; // unknown id, or keep only the first mention
    seen.add(def.id);

    const params: Record<string, string | number> = {};
    for (const p of def.params) {
      const val = item.params?.[p.key];
      if (p.type === "select") {
        const valid = p.options?.some((o) => o.value === val);
        params[p.key] = valid ? (val as string) : p.default;
      } else if (p.type === "number") {
        const n = typeof val === "number" ? val : Number(val);
        params[p.key] = Number.isFinite(n)
          ? Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, n))
          : p.default;
      } else {
        params[p.key] = typeof val === "string" && val ? val : p.default;
      }
    }

    const confidence =
      typeof item.confidence === "number" && Number.isFinite(item.confidence)
        ? Math.min(1, Math.max(0, item.confidence))
        : 0.7;

    out.push({
      instanceId: `${def.id}-${crypto.randomUUID().slice(0, 8)}`,
      blockId: def.id,
      params,
      confidence,
    });
  }

  return out;
}

export async function POST(req: NextRequest) {
  let prompt: unknown;
  try {
    ({ prompt } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ fallback: true, reason: "no_api_key" });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    const fewShotExamples = `
Example 1:
User: "London killzone, sweep PDH, enter on 50% retrace, trail stop 30 pips"
Assistant: {
  "blocks": [
    {"blockId": "killzone", "params": {"session": "London"}, "confidence": 0.95},
    {"blockId": "sweep", "params": {"of": "Previous Day High"}, "confidence": 0.92},
    {"blockId": "fib50", "params": {"level": "50%"}, "confidence": 0.88},
    {"blockId": "trailing_stop", "params": {"distance": 30}, "confidence": 0.95}
  ],
  "unmapped": []
}

Example 2:
User: "Wait for bullish order block in New York, enter on engulfing candle, trail stop 25 pips"
Assistant: {
  "blocks": [
    {"blockId": "killzone", "params": {"session": "New York"}, "confidence": 0.90},
    {"blockId": "ob", "params": {"lookback": 10}, "confidence": 0.85},
    {"blockId": "engulfing", "params": {"direction": "Bullish"}, "confidence": 0.92},
    {"blockId": "trailing_stop", "params": {"distance": 25}, "confidence": 0.95}
  ],
  "unmapped": []
}

Example 3:
User: "9/21 EMA cross when ATR is above average, trail stop 20 pips, close before NFP news"
Assistant: {
  "blocks": [
    {"blockId": "ma_cross", "params": {"fast": 9, "slow": 21, "type": "EMA"}, "confidence": 0.94},
    {"blockId": "atr", "params": {"period": 14, "condition": "Above average"}, "confidence": 0.88},
    {"blockId": "trailing_stop", "params": {"distance": 20}, "confidence": 0.95}
  ],
  "unmapped": [{"text": "close before NFP news"}]
}
`;

    const system = `You are an expert trading strategy parser that converts a retail trader's free-text description into a structured set of blocks from a fixed block library. Your goal is to accurately map trading concepts to the available blocks while preserving the trader's intent.

CRITICAL RULES:
1. Only use block IDs from the library below — never invent one
2. If part of the description doesn't correspond to any block, put its EXACT text into "unmapped" rather than forcing a bad match
3. A strategy typically needs multiple blocks (timing/entry/filter/exit) — extract every applicable block
4. Set confidence scores: 0.85-1.0 for explicit parameter mentions, 0.5-0.7 when you use defaults
5. Pay special attention to trader slang and ICT terminology (killzone, sweep, FVG, order block, etc.)
6. Be conservative — if unsure, prefer leaving something unmapped over making an incorrect mapping

TRADING TERMINOLOGY MAPPING:
- "killzone", "session", "London", "NY", "Asia" → killzone block
- "sweep", "liquidity grab", "take out" → sweep block  
- "FVG", "fair value gap", "imbalance" → fvg block
- "order block", "OB" → ob block
- "engulfing" → engulfing block
- "fib", "retrace", "50%" → fib50 block
- "trailing stop", "trail" → trailing_stop block
- "ATR", "volatility" → atr block
- "RSI", "overbought", "oversold" → rsi block
- "MA cross", "EMA cross", "SMA cross" → ma_cross block

Block library:\n${buildBlockCatalog()}

${fewShotExamples}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: prompt }],
      tools: [buildTool()],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolUse = response.content.find(
      (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
    );
    if (!toolUse) return NextResponse.json({ fallback: true, reason: "no_tool_use" });

    const raw = toolUse.input as { blocks?: RawBlock[]; unmapped?: UnmappedClause[] };
    const blocks = normalizeBlocks(raw.blocks ?? []);
    const unmapped = (raw.unmapped ?? []).filter(
      (u): u is UnmappedClause => typeof u?.text === "string" && u.text.trim().length > 0
    );

    return NextResponse.json({ blocks, unmapped, readback: buildReadback(blocks) });
  } catch (err) {
    console.error("[/api/parse] LLM parse failed, client will fall back to local parser", err);
    return NextResponse.json({ fallback: true, reason: "error" });
  }
}

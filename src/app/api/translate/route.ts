import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeRules } from "@/lib/rules/describe";
import { MAX_PROMPT_CHARS } from "@/lib/rules/translate";
import { translateStrategy } from "@/lib/rules/translate-server";

// Trader description -> rule language (Phase 3). The model's output is
// untrusted: it is validated strictly, one repair attempt gets the validation
// errors back, and anything still invalid falls back to the block parser
// (/api/parse), exactly like a missing API key or an outage. The readback the
// trader confirms is generated from the validated rules.

export const runtime = "nodejs";
export const maxDuration = 120;

// Best-effort abuse guard. Per server instance only, so it caps bursts, not totals.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  let body: { prompt?: unknown; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { prompt, answers } = body;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ fallback: true, reason: "prompt_too_long" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ fallback: true, reason: "no_api_key" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ fallback: true, reason: "rate_limited" });

  try {
    const result = await translateStrategy(new Anthropic({ apiKey }), prompt, answers);
    if (!result.ok) {
      if (result.errors) console.error("[/api/translate] rules still invalid after repair", result.errors.slice(0, 10));
      return NextResponse.json({ fallback: true, reason: result.reason });
    }
    const t = result.translation;
    return NextResponse.json({
      status: t.status,
      rules: t.rules,
      readback: t.rules ? describeRules(t.rules) : null,
      warnings: t.warnings,
      questions: t.questions,
      assumptions: t.assumptions,
      unmapped: t.unmapped,
    });
  } catch (err) {
    console.error("[/api/translate] translation failed, client will fall back", err);
    return NextResponse.json({ fallback: true, reason: "error" });
  }
}

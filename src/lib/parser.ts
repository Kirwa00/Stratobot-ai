import { BLOCKS } from "./blocks";
import { buildReadback } from "./readback";
import type { BlockInstance, UnmappedClause } from "./types";

// Deterministic keyword/heuristic matcher for Workstream B's "Trader prompt ->
// Blueprint JSON" step (Engineering Plan v1.2 §3). The real path is the
// /api/parse LLM route (src/app/api/parse/route.ts); the store calls this as
// its fallback whenever that route is unavailable (no API key, network
// error) so the full product flow (Describe -> Readback -> Adjust ->
// Simulate -> Download) still works end-to-end offline.

let uid = 0;
function nextId(prefix: string) {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid}`;
}

const SESSION_WORDS: Record<string, string> = {
  london: "London",
  "new york": "New York",
  ny: "New York",
  asia: "Asia",
  asian: "Asia",
  tokyo: "Asia",
  overlap: "London/NY Overlap",
};

function extractSession(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [word, value] of Object.entries(SESSION_WORDS)) {
    if (lower.includes(word)) return value;
  }
  return undefined;
}

function extractNumber(text: string): number | undefined {
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

function extractPercent(text: string): string | undefined {
  const match = text.match(/(38\.2|61\.8|50)\s*%/);
  if (match) return `${match[1]}%`;
  if (/\bfib\b|\bfibonacci\b|retrace/i.test(text)) return "50%";
  return undefined;
}

/** Bull/bear direction, shared by every block whose only param is a side. */
function extractDirection(text: string): "Bullish" | "Bearish" | undefined {
  if (/bear|short|sell|down/i.test(text)) return "Bearish";
  if (/bull|long|buy|up/i.test(text)) return "Bullish";
  return undefined;
}

const DIRECTION_BLOCK_IDS = new Set([
  "fvg",
  "engulfing",
  "macd",
  "bos",
  "breakout",
  "pin_bar",
  "divergence",
]);

const RATIO_RE = /([0-9]+)\s*:\s*([0-9]+)/;

interface ParseResult {
  blocks: BlockInstance[];
  unmapped: UnmappedClause[];
  readback: string;
}

/** Split a free-text strategy description into rough clauses. */
function splitClauses(input: string): string[] {
  return input
    .replace(/\bthen\b/gi, ",")
    .split(/[,.;]|(?:\band\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

const CONNECTIVE_ONLY = /^(so|then|also|too|next|finally|first|now)$/i;

export function parsePrompt(input: string): ParseResult {
  const clauses = splitClauses(input);
  const blocks: BlockInstance[] = [];
  const unmapped: UnmappedClause[] = [];
  const usedBlockIds = new Set<string>();

  for (const clause of clauses) {
    if (CONNECTIVE_ONLY.test(clause)) continue;
    const lower = clause.toLowerCase();

    const matched = BLOCKS.find((b) =>
      b.keywords.some((kw) => lower.includes(kw))
    );

    if (!matched) {
      unmapped.push({ text: clause });
      continue;
    }
    if (usedBlockIds.has(matched.id)) continue; // keep the first mention
    usedBlockIds.add(matched.id);

    const params: Record<string, string | number> = {};
    let hadExplicitParam = false;

    for (const p of matched.params) {
      if (matched.id === "killzone" && p.key === "session") {
        const s = extractSession(clause);
        if (s) {
          params.session = s;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "fib50" && p.key === "level") {
        const pct = extractPercent(clause);
        if (pct) {
          params.level = pct;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "trailing_stop" && p.key === "distance") {
        const n = extractNumber(clause);
        if (n !== undefined) {
          params.distance = n;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "sweep" && p.key === "of") {
        if (/low/i.test(clause)) {
          params.of = /session/i.test(clause) ? "Session Low" : "Previous Day Low";
          hadExplicitParam = true;
          continue;
        }
        if (/high/i.test(clause) || /pdh/i.test(clause)) {
          params.of = /session/i.test(clause) ? "Session High" : "Previous Day High";
          hadExplicitParam = true;
          continue;
        }
      }
      if (DIRECTION_BLOCK_IDS.has(matched.id) && p.key === "direction") {
        const dir = extractDirection(clause);
        if (dir) {
          params.direction = dir;
          hadExplicitParam = true;
          continue;
        }
      }
      if (
        (matched.id === "stop_loss" || matched.id === "take_profit") &&
        p.key === "distance"
      ) {
        const n = extractNumber(clause);
        if (n !== undefined) {
          params.distance = n;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "break_even" && p.key === "trigger") {
        const n = extractNumber(clause);
        if (n !== undefined) {
          params.trigger = n;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "position_size" && p.key === "size") {
        const n = extractNumber(clause);
        if (n !== undefined) {
          params.size = n;
          hadExplicitParam = true;
          continue;
        }
      }
      if (
        (matched.id === "risk_per_trade" || matched.id === "max_daily_loss") &&
        p.key === "percent"
      ) {
        const n = extractNumber(clause);
        if (n !== undefined) {
          params.percent = n;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "risk_reward" && p.key === "ratio") {
        const m = clause.match(RATIO_RE);
        if (m) {
          params.ratio = `${m[1]}:${m[2]}`;
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "rsi" && p.key === "condition") {
        if (/overbought/i.test(clause)) {
          params.condition = "Overbought (>70)";
          hadExplicitParam = true;
          continue;
        }
        if (/oversold/i.test(clause)) {
          params.condition = "Oversold (<30)";
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "bollinger" && p.key === "touch") {
        if (/upper/i.test(clause)) {
          params.touch = "Upper band";
          hadExplicitParam = true;
          continue;
        }
        if (/lower/i.test(clause)) {
          params.touch = "Lower band";
          hadExplicitParam = true;
          continue;
        }
        if (/squeeze/i.test(clause)) {
          params.touch = "Squeeze";
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "support_resistance" && p.key === "side") {
        if (/resistance/i.test(clause)) {
          params.side = "Resistance";
          hadExplicitParam = true;
          continue;
        }
        if (/support/i.test(clause)) {
          params.side = "Support";
          hadExplicitParam = true;
          continue;
        }
      }
      if (matched.id === "htf_confirmation" && p.key === "timeframe") {
        if (/weekly/i.test(clause)) {
          params.timeframe = "Weekly";
          hadExplicitParam = true;
          continue;
        }
        if (/daily/i.test(clause)) {
          params.timeframe = "Daily";
          hadExplicitParam = true;
          continue;
        }
        if (/4\s*h/i.test(clause)) {
          params.timeframe = "4H";
          hadExplicitParam = true;
          continue;
        }
      }
      params[p.key] = p.default;
    }

    blocks.push({
      instanceId: nextId(matched.id),
      blockId: matched.id,
      params,
      confidence: hadExplicitParam ? 0.94 : 0.6,
    });
  }

  return {
    blocks,
    unmapped,
    readback: buildReadback(blocks),
  };
}

export function newStrategyName(): string {
  const names = ["Session Sweep", "Fib Retrace", "Trend Cross", "Structure Break", "Gap Fill"];
  return names[Math.floor(Math.random() * names.length)];
}

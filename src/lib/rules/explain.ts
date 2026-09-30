import { describeCondition, describeValue } from "./describe";
import type { Interpreter } from "./interpret";
import type { CloseReason } from "./execute";
import type { Condition, RuleStrategy, Value } from "./types";

// "Why did this trade happen?" for the logic check: the top-level rules that
// held at the decision, with the values the bot saw, and how the trade ended.
// Everything comes from the interpreter's own evaluation, so an explanation
// can't disagree with the trade it explains.

/** Indicators (RSI 28.41) get 2 decimals; prices and small quantities (1.10234, MACD 0.00012) get 5. */
export function formatNumber(x: number): string {
  if (!Number.isFinite(x)) return "n/a";
  return Math.abs(x) >= 10 ? x.toFixed(2) : x.toFixed(5);
}

function operands(c: Condition): Value[] {
  if (c.kind === "compare" || c.kind === "cross" || c.kind === "near") return [c.a, c.b].filter((v) => v.kind !== "const" && v.kind !== "pips");
  return [];
}

/** Never expected: an entry only happens when every listed rule held. Tests assert it never appears. */
export const NOT_MET = "[not met at this bar]";

function label(v: Value): string {
  if (v.kind === "price" && !v.tf && !v.shift) return v.field;
  return describeValue(v).replace(/^the /, "");
}

function withValues(interp: Interpreter, c: Condition, t: number): string {
  const text = describeCondition(c);
  const shown = operands(c).map((v) => `${label(v)} ${formatNumber(interp.value(v, t, 0))}`);
  const held = interp.condition(c, t, 0) ? "" : ` ${NOT_MET}`;
  return (shown.length ? `${text} (${shown.join(" vs ")})` : text) + held;
}

/** The rules behind an entry decided at bar t, in the order the trader wrote them. */
export function explainEntry(interp: Interpreter, s: RuleStrategy, t: number, dir: 1 | -1): string[] {
  const side = dir > 0 ? s.long : s.short;
  const lines = [...s.filters, ...(side ?? [])].map((c) => withValues(interp, c, t));
  if (!side) lines.push(`No rule picks a direction; this ${dir > 0 ? "buy" : "sell"} comes from the bot's direction input.`);
  const pending = dir > 0 ? s.entry?.long : s.entry?.short;
  if (pending) lines.push(`Placed a ${dir > 0 ? "buy" : "sell"} ${pending.type} order at ${formatNumber(interp.value(pending.at, t, 0))}.`);
  return lines;
}

export function explainExit(reason: CloseReason, price: number, stopMoved: boolean, s: RuleStrategy): string {
  switch (reason) {
    case "tp":
      return `Take profit hit at ${formatNumber(price)}.`;
    case "sl":
      return stopMoved
        ? `Stop hit at ${formatNumber(price)} after it had moved (break-even or trailing).`
        : `Stop loss hit at ${formatNumber(price)}.`;
    case "time":
      return `Closed at ${formatNumber(price)} after ${s.exits.closeAfterBars} candles.`;
    case "opposite":
      return `Closed at ${formatNumber(price)} because the opposite signal fired.`;
  }
}

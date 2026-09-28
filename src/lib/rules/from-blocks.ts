import { getBlock } from "../blocks";
import type { BlockInstance, ParamDef } from "../types";
import type { Condition, RuleStrategy, Side, Value } from "./types";

// Translates the block builder's strategies into the rule language. Each block
// keeps its existing meaning, evaluated on closed bars. A directional block
// contributes a buy condition and/or a sell condition; a block with only one
// side (e.g. "Previous Day High" sweep = sell) makes the other side impossible.
// The strategy buys only when every directional block's buy condition holds,
// which is the same agreement rule the block-template composer used.

type Contribution =
  | { filter: Condition }
  | { long: Condition | null; short: Condition | null }
  | null;

const close0: Value = { kind: "price", field: "close" };
const d1 = (field: "high" | "low"): Value => ({ kind: "price", field, tf: "D1" });
const sides = (make: (side: Side) => Condition, direction: string) => ({
  long: direction === "Bearish" ? null : make("bullish"),
  short: direction === "Bullish" ? null : make("bearish"),
});

function param(block: BlockInstance, key: string): string | number {
  const def = getBlock(block.blockId)!.params.find((p) => p.key === key) as ParamDef;
  const raw = block.params?.[key];
  if (def.type === "number") {
    const n = Number(raw);
    if (raw === undefined || raw === "" || !Number.isFinite(n)) return def.default;
    return Math.min(def.max ?? Infinity, Math.max(def.min ?? -Infinity, n));
  }
  if (def.type === "select") return def.options?.some((o) => o.value === raw) ? String(raw) : def.default;
  return typeof raw === "string" && raw ? raw : def.default;
}

function contribute(b: BlockInstance): Contribution {
  const p = (key: string) => param(b, key);
  const num = (key: string) => Number(p(key));
  switch (b.blockId) {
    case "killzone": {
      const name = ({ London: "london", "New York": "new_york", Asia: "asia", "London/NY Overlap": "london_ny_overlap" } as const)[
        p("session") as "London"
      ];
      return name ? { filter: { kind: "session", name } } : null;
    }
    case "sweep": {
      const ofHigh = p("of") === "Previous Day High" || p("of") === "Session High";
      return ofHigh
        ? { long: null, short: { kind: "compare", a: { kind: "price", field: "high" }, op: "gt", b: d1("high") } }
        : { long: { kind: "compare", a: { kind: "price", field: "low" }, op: "lt", b: d1("low") }, short: null };
    }
    case "pdh": {
      const high: Condition = { kind: "compare", a: close0, op: "gte", b: d1("high") };
      const low: Condition = { kind: "compare", a: close0, op: "lte", b: d1("low") };
      const side = p("side");
      return { filter: side === "High" ? high : side === "Low" ? low : { kind: "any", of: [high, low] } };
    }
    case "fvg":
      return sides((side) => ({ kind: "pattern", pattern: "fvg", side, minPips: num("minSize") }), String(p("direction")));
    case "ob":
      return sides((side) => ({ kind: "pattern", pattern: "order_block", side, lookback: num("lookback") }), "Either");
    case "ma_cross": {
      const method = p("type") === "SMA" ? "sma" : "ema";
      const fast: Value = { kind: "ma", method, period: num("fast") };
      const slow: Value = { kind: "ma", method, period: num("slow") };
      return {
        long: { kind: "cross", a: fast, dir: "above", b: slow },
        short: { kind: "cross", a: fast, dir: "below", b: slow },
      };
    }
    case "engulfing":
      return sides((side) => ({ kind: "pattern", pattern: "engulfing", side }), String(p("direction")));
    case "pin_bar":
      return sides((side) => ({ kind: "pattern", pattern: "pin_bar", side }), String(p("direction")));
    case "fib50": {
      const level = { "38.2%": 0.382, "61.8%": 0.618 }[String(p("level"))] ?? 0.5;
      const hi: Value = { kind: "highest", bars: 10 };
      const lo: Value = { kind: "lowest", bars: 10 };
      const fibPrice: Value = {
        kind: "arith",
        op: "sub",
        a: hi,
        b: { kind: "arith", op: "mul", a: { kind: "arith", op: "sub", a: hi, b: lo }, b: { kind: "const", value: level } },
      };
      return { filter: { kind: "near", a: close0, b: fibPrice, pips: 10 } };
    }
    case "atr": {
      const period = num("period");
      return {
        filter: {
          kind: "compare",
          a: { kind: "atr", period },
          op: p("condition") === "Below average" ? "lt" : "gt",
          b: { kind: "atr", period: period * 3 },
        },
      };
    }
    case "rsi": {
      const rsi: Value = { kind: "rsi", period: num("period") };
      return p("condition") === "Overbought (>70)"
        ? { long: null, short: { kind: "compare", a: rsi, op: "gt", b: { kind: "const", value: 70 } } }
        : { long: { kind: "compare", a: rsi, op: "lt", b: { kind: "const", value: 30 } }, short: null };
    }
    case "macd": {
      const main: Value = { kind: "macd", fast: 12, slow: 26, signal: 9, line: "main" };
      const signal: Value = { kind: "macd", fast: 12, slow: 26, signal: 9, line: "signal" };
      return sides(
        (side) => ({ kind: "cross", a: main, dir: side === "bullish" ? "above" : "below", b: signal }),
        String(p("direction"))
      );
    }
    case "bollinger": {
      const band = (line: "upper" | "lower", shift = 0): Value => ({ kind: "bands", period: 20, deviation: 2, line, shift });
      const touch = p("touch");
      if (touch === "Upper band") return { long: null, short: { kind: "compare", a: close0, op: "gte", b: band("upper") } };
      if (touch === "Lower band") return { long: { kind: "compare", a: close0, op: "lte", b: band("lower") }, short: null };
      const width = (shift: number): Value => ({ kind: "arith", op: "sub", a: band("upper", shift), b: band("lower", shift) });
      return {
        filter: {
          kind: "compare",
          a: width(0),
          op: "lt",
          b: { kind: "arith", op: "mul", a: width(10), b: { kind: "const", value: 0.7 } },
        },
      };
    }
    case "vwap": {
      const vwap: Value = { kind: "vwap" };
      const cond = p("condition");
      if (cond === "Price above VWAP") return { long: { kind: "compare", a: close0, op: "gt", b: vwap }, short: null };
      if (cond === "Price below VWAP") return { long: null, short: { kind: "compare", a: close0, op: "lt", b: vwap } };
      return {
        long: { kind: "cross", a: close0, dir: "above", b: vwap },
        short: { kind: "cross", a: close0, dir: "below", b: vwap },
      };
    }
    case "support_resistance": {
      const atSupport: Condition = { kind: "near", a: close0, b: { kind: "lowest", bars: 20 }, pips: 10 };
      const atResistance: Condition = { kind: "near", a: close0, b: { kind: "highest", bars: 20 }, pips: 10 };
      const side = p("side");
      return { long: side === "Resistance" ? null : atSupport, short: side === "Support" ? null : atResistance };
    }
    case "bos":
    case "breakout": {
      const bars = b.blockId === "bos" ? 10 : 20;
      return sides(
        (side) =>
          side === "bullish"
            ? { kind: "compare", a: close0, op: "gt", b: { kind: "highest", bars, shift: 1 } }
            : { kind: "compare", a: close0, op: "lt", b: { kind: "lowest", bars, shift: 1 } },
        String(p("direction"))
      );
    }
    case "divergence": {
      const rsi = (shift: number): Value => ({ kind: "rsi", period: 14, shift });
      const closeAt = (shift: number): Value => ({ kind: "price", field: "close", shift });
      return sides(
        (side) => ({
          kind: "all",
          of:
            side === "bullish"
              ? [
                  { kind: "compare", a: closeAt(0), op: "lt", b: closeAt(5) },
                  { kind: "compare", a: rsi(0), op: "gt", b: rsi(5) },
                ]
              : [
                  { kind: "compare", a: closeAt(0), op: "gt", b: closeAt(5) },
                  { kind: "compare", a: rsi(0), op: "lt", b: rsi(5) },
                ],
        }),
        String(p("direction"))
      );
    }
    case "htf_confirmation": {
      const tf = ({ Daily: "D1", Weekly: "W1" } as const)[String(p("timeframe")) as "Daily"] ?? "H4";
      const price: Value = { kind: "price", field: "close", tf };
      const ma: Value = { kind: "ma", method: "sma", period: 20, tf };
      return {
        long: { kind: "compare", a: price, op: "gt", b: ma },
        short: { kind: "compare", a: price, op: "lt", b: ma },
      };
    }
    default:
      return null; // exits, sizing and guards are handled in blocksToRules()
  }
}

export function blocksToRules(blocks: BlockInstance[]): RuleStrategy {
  const s: RuleStrategy = { version: 1, timeframe: "chart", filters: [], long: [], short: [], exits: {}, sizing: {}, guards: {} };
  let directional = 0;
  const firstNum = (id: string, key: string) => {
    const b = blocks.find((x) => x.blockId === id && getBlock(x.blockId));
    return b ? Number(param(b, key)) : undefined;
  };

  for (const b of blocks) {
    if (!getBlock(b.blockId)) continue;
    const c = contribute(b);
    if (!c) continue;
    if ("filter" in c) {
      s.filters.push(c.filter);
      continue;
    }
    directional++;
    s.long = s.long && c.long ? [...s.long, c.long] : null;
    s.short = s.short && c.short ? [...s.short, c.short] : null;
  }
  if (directional === 0) {
    s.long = null;
    s.short = null;
    s.directionFromInput = true;
  }

  s.exits = {
    stopLossPips: firstNum("stop_loss", "distance"),
    takeProfitPips: firstNum("take_profit", "distance"),
    trailingPips: firstNum("trailing_stop", "distance"),
    breakEvenPips: firstNum("break_even", "trigger"),
  };
  s.sizing = { fixedLots: firstNum("position_size", "size"), riskPercent: firstNum("risk_per_trade", "percent") };

  const rr = blocks.find((x) => x.blockId === "risk_reward");
  const news = blocks.find((x) => x.blockId === "news_filter");
  s.guards = {
    maxDailyLossPercent: firstNum("max_daily_loss", "percent"),
    minRewardRisk: rr ? ({ "1:1": 1, "1:3": 3, "2:1": 0.5 }[String(param(rr, "ratio"))] ?? 2) : undefined,
    news: news ? (param(news, "mode") === "Avoid all news" ? "all" : "high") : undefined,
  };
  return s;
}

/** Directional rules exist but can never agree (e.g. a buy-only rule plus a sell-only rule), so it never trades. */
export function hasContradictoryDirections(s: RuleStrategy): boolean {
  return s.long === null && s.short === null && !s.directionFromInput;
}

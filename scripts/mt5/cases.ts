import { BLOCKS } from "../../src/lib/blocks";
import { blocksToRules } from "../../src/lib/rules/from-blocks";
import type { Condition, RuleStrategy, Value } from "../../src/lib/rules/types";
import type { BlockInstance } from "../../src/lib/types";

// Strategies the MT5 differential test runs. Block cases cover every builder
// block and its param variants; rule cases exercise rule-language nodes that
// have no block yet. Each case should make both sides trade on real bars, so a
// PASS can't come from a rule that never fires.

function inst(blockId: string, params: Record<string, string | number> = {}): BlockInstance {
  const def = BLOCKS.find((b) => b.id === blockId);
  if (!def) throw new Error(`unknown block ${blockId}`);
  const p: Record<string, string | number> = {};
  for (const d of def.params) p[d.key] = d.default;
  return { instanceId: blockId, blockId, params: { ...p, ...params }, confidence: 1 };
}

const BLOCK_CASES: Record<string, BlockInstance[]> = {
  ...Object.fromEntries(BLOCKS.filter((b) => b.role !== "exit").map((b) => [`single_${b.id}`, [inst(b.id)]])),
  sweep_low: [inst("sweep", { of: "Previous Day Low" })],
  rsi_overbought: [inst("rsi", { condition: "Overbought (>70)" })],
  bollinger_upper: [inst("bollinger", { touch: "Upper band" })],
  bollinger_squeeze: [inst("bollinger", { touch: "Squeeze" })],
  vwap_reclaim: [inst("vwap", { condition: "VWAP reclaim" })],
  htf_daily: [inst("htf_confirmation", { timeframe: "Daily" })],
  htf_weekly: [inst("htf_confirmation", { timeframe: "Weekly" })],
  pdh_both_fib618: [inst("pdh", { side: "Both" }), inst("fib50", { level: "61.8%" })],
  sma_cross: [inst("ma_cross", { type: "SMA", fast: 10, slow: 30 })],
  duplicate_ma_cross: [inst("ma_cross", { fast: 9, slow: 21 }), inst("ma_cross", { fast: 50, slow: 200 })],
  homepage_example: [inst("killzone"), inst("sweep"), inst("fib50"), inst("trailing_stop")],
  ny_engulfing_htf: [inst("killzone", { session: "New York" }), inst("engulfing"), inst("htf_confirmation")],
  trade_sl_tp: [inst("ma_cross"), inst("stop_loss", { distance: 15 }), inst("take_profit", { distance: 25 })],
  trade_trail_be: [inst("ma_cross"), inst("stop_loss", { distance: 20 }), inst("trailing_stop", { distance: 10 }), inst("break_even", { trigger: 8 })],
};

const close: Value = { kind: "price", field: "close" };
const num = (value: number): Value => ({ kind: "const", value });
const cmp = (a: Value, op: "gt" | "lt" | "gte" | "lte", b: Value): Condition => ({ kind: "compare", a, op, b });
const crossUp = (a: Value, b: Value): Condition => ({ kind: "cross", a, dir: "above", b });
const crossDown = (a: Value, b: Value): Condition => ({ kind: "cross", a, dir: "below", b });
const mid = (a: Value, b: Value): Value => ({ kind: "arith", op: "div", a: { kind: "arith", op: "add", a, b }, b: num(2) });
const donchianMid = (bars: number, shift = 0): Value =>
  mid({ kind: "highest", bars, shift }, { kind: "lowest", bars, shift });

function rules(parts: Partial<RuleStrategy>): RuleStrategy {
  return { version: 1, timeframe: "chart", filters: [], long: null, short: null, exits: {}, sizing: {}, guards: {}, ...parts };
}

const stochMain: Value = { kind: "stochastic", k: 5, d: 3, slowing: 3, line: "main" };
const stochSignal: Value = { ...stochMain, line: "signal" } as Value;
const cci: Value = { kind: "cci", period: 20 };
const adxLine = (line: "adx" | "plus_di" | "minus_di"): Value => ({ kind: "adx", period: 14, line });
const sar: Value = { kind: "sar", step: 0.02, max: 0.2 };
const ao: Value = {
  kind: "arith",
  op: "sub",
  a: { kind: "ma", method: "sma", period: 5, field: "median" },
  b: { kind: "ma", method: "sma", period: 34, field: "median" },
};
const tenkan = donchianMid(9);
const kijun = donchianMid(26);
const senkouA = mid(donchianMid(9, 26), donchianMid(26, 26));
const htfStoch: Value = { kind: "stochastic", k: 14, d: 3, slowing: 3, line: "main", tf: "H1" };
const lwmaWeighted: Value = { kind: "ma", method: "lwma", period: 20, field: "weighted" };
const smmaTypical: Value = { kind: "ma", method: "smma", period: 20, field: "typical" };

const RULE_CASES: Record<string, RuleStrategy> = {
  rule_stochastic: rules({
    long: [crossUp(stochMain, stochSignal), cmp(stochMain, "lt", num(30))],
    short: [crossDown(stochMain, stochSignal), cmp(stochMain, "gt", num(70))],
  }),
  rule_cci: rules({ long: [crossUp(cci, num(-100))], short: [crossDown(cci, num(100))] }),
  rule_adx_di: rules({
    filters: [cmp(adxLine("adx"), "gt", num(25))],
    long: [cmp(adxLine("plus_di"), "gt", adxLine("minus_di"))],
    short: [cmp(adxLine("plus_di"), "lt", adxLine("minus_di"))],
  }),
  rule_sar: rules({ long: [crossUp(close, sar)], short: [crossDown(close, sar)] }),
  rule_momentum_wpr: rules({
    long: [cmp({ kind: "momentum", period: 10 }, "gt", num(100)), cmp({ kind: "wpr", period: 14 }, "lt", num(-80))],
    short: [cmp({ kind: "momentum", period: 10 }, "lt", num(100)), cmp({ kind: "wpr", period: 14 }, "gt", num(-20))],
  }),
  rule_envelopes: rules({
    long: [cmp(close, "lte", { kind: "envelopes", period: 20, method: "ema", deviation: 0.1, line: "lower" })],
    short: [cmp(close, "gte", { kind: "envelopes", period: 20, method: "ema", deviation: 0.1, line: "upper" })],
  }),
  rule_stddev_demarker: rules({
    filters: [cmp({ kind: "stddev", period: 20 }, "gt", { kind: "pips", value: 3 })],
    long: [cmp({ kind: "demarker", period: 14 }, "lt", num(0.3))],
    short: [cmp({ kind: "demarker", period: 14 }, "gt", num(0.7))],
  }),
  rule_awesome_oscillator: rules({ long: [crossUp(ao, num(0))], short: [crossDown(ao, num(0))] }),
  rule_ichimoku: rules({
    long: [crossUp(tenkan, kijun), cmp(close, "gt", senkouA)],
    short: [crossDown(tenkan, kijun), cmp(close, "lt", senkouA)],
  }),
  rule_htf_stochastic: rules({ long: [cmp(htfStoch, "lt", num(20))], short: [cmp(htfStoch, "gt", num(80))] }),
  rule_swing_candle: rules({
    filters: [cmp({ kind: "candle", measure: "body" }, "gt", { kind: "pips", value: 3 })],
    long: [cmp(close, "gt", { kind: "swing", side: "high", strength: 2, lookback: 30 })],
    short: [cmp(close, "lt", { kind: "swing", side: "low", strength: 2, lookback: 30 })],
  }),
  rule_asian_range_breakout: rules({
    filters: [{ kind: "time_window", fromHour: 7, toHour: 11 }, { kind: "weekday", days: [1, 2, 3, 4, 5] }],
    long: [cmp(close, "gt", { kind: "session_range", session: "asia", side: "high" })],
    short: [cmp(close, "lt", { kind: "session_range", session: "asia", side: "low" })],
  }),
  rule_patterns_fields: rules({
    filters: [{ kind: "not", of: { kind: "pattern", pattern: "doji" } }],
    long: [
      {
        kind: "any",
        of: [
          { kind: "pattern", pattern: "three_in_row", side: "bullish" },
          { kind: "pattern", pattern: "star", side: "bullish" },
          { kind: "all", of: [{ kind: "pattern", pattern: "outside_bar" }, cmp(lwmaWeighted, "gt", smmaTypical)] },
        ],
      },
    ],
    short: [
      {
        kind: "any",
        of: [
          { kind: "pattern", pattern: "three_in_row", side: "bearish" },
          { kind: "pattern", pattern: "star", side: "bearish" },
          { kind: "all", of: [{ kind: "pattern", pattern: "inside_bar" }, cmp(lwmaWeighted, "lt", smmaTypical)] },
        ],
      },
    ],
  }),
};

const fast: Value = { kind: "ma", method: "ema", period: 9 };
const slow: Value = { kind: "ma", method: "ema", period: 21 };
const maLong = [crossUp(fast, slow)];
const maShort = [crossDown(fast, slow)];
const pipsV = (value: number): Value => ({ kind: "pips", value });
const swingHigh: Value = { kind: "swing", side: "high", strength: 2, lookback: 30 };
const swingLow: Value = { kind: "swing", side: "low", strength: 2, lookback: 30 };
const lastHigh: Value = { kind: "price", field: "high" };
const lastLow: Value = { kind: "price", field: "low" };

const TRADE_CASES: Record<string, RuleStrategy> = {
  trade_atr_rr: rules({
    long: maLong,
    short: maShort,
    exits: { stopLoss: { kind: "atr", multiple: 1.5, period: 14 }, takeProfit: { kind: "rr", multiple: 2 } },
  }),
  trade_level_stop_risk: rules({
    long: [cmp(close, "gt", swingHigh)],
    short: [cmp(close, "lt", swingLow)],
    exits: { stopLoss: { kind: "level", at: swingLow }, takeProfit: { kind: "pips", pips: 30 } },
    sizing: { riskPercent: 1 },
  }),
  trade_level_sides: rules({
    long: [{ kind: "cross", a: close, dir: "above", b: { kind: "ma", method: "ema", period: 21 } }],
    short: [{ kind: "cross", a: close, dir: "below", b: { kind: "ma", method: "ema", period: 21 } }],
    exits: {
      stopLoss: { kind: "level", at: swingLow, atShort: swingHigh },
      takeProfit: { kind: "level", at: { kind: "highest", bars: 50 }, atShort: { kind: "lowest", bars: 50 } },
    },
    sizing: { riskPercent: 1 },
  }),
  trade_limit_pullback: rules({
    long: maLong,
    short: maShort,
    entry: {
      long: { type: "limit", at: { kind: "arith", op: "sub", a: close, b: pipsV(5) }, expiresBars: 4 },
      short: { type: "limit", at: { kind: "arith", op: "add", a: close, b: pipsV(5) }, expiresBars: 4 },
    },
    exits: { stopLoss: { kind: "pips", pips: 15 }, takeProfit: { kind: "rr", multiple: 1.5 } },
  }),
  trade_inside_bar_breakout: rules({
    filters: [{ kind: "pattern", pattern: "inside_bar" }],
    long: [cmp(close, "gt", { kind: "ma", method: "sma", period: 50 })],
    short: [cmp(close, "lt", { kind: "ma", method: "sma", period: 50 })],
    entry: {
      long: { type: "stop", at: { kind: "arith", op: "add", a: lastHigh, b: pipsV(1) }, expiresBars: 3 },
      short: { type: "stop", at: { kind: "arith", op: "sub", a: lastLow, b: pipsV(1) }, expiresBars: 3 },
    },
    exits: { stopLoss: { kind: "pips", pips: 12 }, takeProfit: { kind: "rr", multiple: 2 } },
  }),
  trade_time_and_opposite: rules({
    long: maLong,
    short: maShort,
    exits: { closeAfterBars: 12, closeOnOpposite: true },
    sizing: { riskMoney: 50 },
  }),
  trade_partial_trail_atr: rules({
    long: maLong,
    short: maShort,
    exits: {
      stopLoss: { kind: "pips", pips: 20 },
      trailing: { kind: "atr", multiple: 1, period: 14 },
      breakEvenPips: 10,
      partial: { atR: 1, fraction: 0.5 },
    },
    sizing: { fixedLots: 0.2 },
  }),
  trade_daily_limit_spread: rules({
    long: [{ kind: "pattern", pattern: "engulfing", side: "bullish" }],
    short: [{ kind: "pattern", pattern: "engulfing", side: "bearish" }],
    exits: { stopLoss: { kind: "pips", pips: 10 }, takeProfit: { kind: "pips", pips: 10 } },
    guards: { maxTradesPerDay: 2, maxSpreadPips: 1 },
  }),
};

export const CASES: Record<string, RuleStrategy> = {
  ...TRADE_CASES,
  ...Object.fromEntries(Object.entries(BLOCK_CASES).map(([name, blocks]) => [name, blocksToRules(blocks)])),
  ...RULE_CASES,
};

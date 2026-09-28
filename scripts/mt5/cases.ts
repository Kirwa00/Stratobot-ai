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

export const CASES: Record<string, RuleStrategy> = {
  ...Object.fromEntries(Object.entries(BLOCK_CASES).map(([name, blocks]) => [name, blocksToRules(blocks)])),
  ...RULE_CASES,
};

import type { Answer } from "../../src/lib/rules/translate";
import type { Condition, RuleStrategy, Timeframe, Value } from "../../src/lib/rules/types";

// Translation benchmark corpus: trader descriptions with the rules a careful
// human would write for them. run.ts scores the AI translator by behaviour
// (same signals, same trades on synthetic markets), not by JSON shape, so any
// equivalent formulation counts as correct.

export interface BenchCase {
  id: string;
  prompt: string;
  /** Expected rules, or null when the right answer is "not a strategy". */
  expect: RuleStrategy | null;
  /** The translator should ask before building; these answers are sent on the second round. */
  answers?: Answer[];
  /** Case-insensitive substrings that must each appear in some unmapped clause. */
  unmapped?: string[];
}

const close: Value = { kind: "price", field: "close" };
const open: Value = { kind: "price", field: "open" };
const high: Value = { kind: "price", field: "high" };
const low: Value = { kind: "price", field: "low" };
const ema = (period: number, tf?: Timeframe): Value => ({ kind: "ma", method: "ema", period, ...(tf ? { tf } : {}) });
const sma = (period: number): Value => ({ kind: "ma", method: "sma", period });
const rsi = (period: number): Value => ({ kind: "rsi", period });
const c = (value: number): Value => ({ kind: "const", value });
const pips = (value: number): Value => ({ kind: "pips", value });
const d1 = (field: "high" | "low" | "close" | "open" | "typical"): Value => ({ kind: "price", field, tf: "D1" });
const add = (a: Value, b: Value): Value => ({ kind: "arith", op: "add", a, b });
const sub = (a: Value, b: Value): Value => ({ kind: "arith", op: "sub", a, b });
const mul = (a: Value, b: Value): Value => ({ kind: "arith", op: "mul", a, b });
const div = (a: Value, b: Value): Value => ({ kind: "arith", op: "div", a, b });
const gt = (a: Value, b: Value): Condition => ({ kind: "compare", a, op: "gt", b });
const lt = (a: Value, b: Value): Condition => ({ kind: "compare", a, op: "lt", b });
const above = (a: Value, b: Value): Condition => ({ kind: "cross", a, dir: "above", b });
const below = (a: Value, b: Value): Condition => ({ kind: "cross", a, dir: "below", b });
const swingHigh: Value = { kind: "swing", side: "high", strength: 2, lookback: 50 };
const swingLow: Value = { kind: "swing", side: "low", strength: 2, lookback: 50 };
const mid = (bars: number, shift = 0): Value =>
  div(add({ kind: "highest", bars, ...(shift ? { shift } : {}) }, { kind: "lowest", bars, ...(shift ? { shift } : {}) }), c(2));

function rules(parts: Partial<RuleStrategy>): RuleStrategy {
  return { version: 1, timeframe: "chart", filters: [], long: null, short: null, exits: {}, sizing: {}, guards: {}, ...parts };
}

const tenkan = mid(9);
const kijun = mid(26);
const spanA26 = div(add(mid(9, 26), mid(26, 26)), c(2));
const spanB26 = mid(52, 26);
const pivot = d1("typical");

export const CORPUS: BenchCase[] = [
  {
    id: "golden_cross_daily",
    prompt: "Daily chart: buy on a golden cross, sell on a death cross. 100 pip stop, 300 pip target.",
    expect: rules({
      timeframe: "D1",
      long: [above(sma(50), sma(200))],
      short: [below(sma(50), sma(200))],
      exits: { stopLoss: { kind: "pips", pips: 100 }, takeProfit: { kind: "pips", pips: 300 } },
    }),
  },
  {
    id: "rsi_cross_levels",
    prompt: "Buy when RSI(14) crosses below 30, sell when it crosses above 70. Stop 25 pips, target 50 pips.",
    expect: rules({
      long: [below(rsi(14), c(30))],
      short: [above(rsi(14), c(70))],
      exits: { stopLoss: { kind: "pips", pips: 25 }, takeProfit: { kind: "pips", pips: 50 } },
    }),
  },
  {
    id: "bollinger_fade_time_exit",
    prompt:
      "H1. Sell when a candle closes above the upper Bollinger Band and buy when one closes below the lower band. Close the trade after 10 candles. Stop loss 1.5x ATR.",
    expect: rules({
      timeframe: "H1",
      long: [lt(close, { kind: "bands", period: 20, deviation: 2, line: "lower" })],
      short: [gt(close, { kind: "bands", period: 20, deviation: 2, line: "upper" })],
      exits: { stopLoss: { kind: "atr", multiple: 1.5, period: 14 }, closeAfterBars: 10 },
    }),
  },
  {
    id: "macd_with_ema_filter",
    prompt:
      "4 hour chart. Buy when the MACD line crosses above the signal line while price is above the 50 EMA; sell on the reverse. Standard MACD settings. Risk 2% per trade, stop 40 pips, target 2R.",
    expect: rules({
      timeframe: "H4",
      long: [
        above({ kind: "macd", fast: 12, slow: 26, signal: 9, line: "main" }, { kind: "macd", fast: 12, slow: 26, signal: 9, line: "signal" }),
        gt(close, ema(50)),
      ],
      short: [
        below({ kind: "macd", fast: 12, slow: 26, signal: 9, line: "main" }, { kind: "macd", fast: 12, slow: 26, signal: 9, line: "signal" }),
        lt(close, ema(50)),
      ],
      exits: { stopLoss: { kind: "pips", pips: 40 }, takeProfit: { kind: "rr", multiple: 2 } },
      sizing: { riskPercent: 2 },
    }),
  },
  {
    id: "stochastic_zones",
    prompt:
      "Buy when Stochastic (14,3,3) %K crosses above %D while below 20; sell when %K crosses below %D while above 80. Trailing stop 15 pips, no fixed target.",
    expect: rules({
      long: [
        above({ kind: "stochastic", k: 14, d: 3, slowing: 3, line: "main" }, { kind: "stochastic", k: 14, d: 3, slowing: 3, line: "signal" }),
        lt({ kind: "stochastic", k: 14, d: 3, slowing: 3, line: "main" }, c(20)),
      ],
      short: [
        below({ kind: "stochastic", k: 14, d: 3, slowing: 3, line: "main" }, { kind: "stochastic", k: 14, d: 3, slowing: 3, line: "signal" }),
        gt({ kind: "stochastic", k: 14, d: 3, slowing: 3, line: "main" }, c(80)),
      ],
      exits: { trailing: { kind: "pips", pips: 15 } },
    }),
  },
  {
    id: "adx_di_cross",
    prompt: "Only trade when ADX(14) is above 25. Buy when +DI crosses above -DI, sell when -DI crosses above +DI. Stop 30 pips, TP 60.",
    expect: rules({
      filters: [gt({ kind: "adx", period: 14, line: "adx" }, c(25))],
      long: [above({ kind: "adx", period: 14, line: "plus_di" }, { kind: "adx", period: 14, line: "minus_di" })],
      short: [above({ kind: "adx", period: 14, line: "minus_di" }, { kind: "adx", period: 14, line: "plus_di" })],
      exits: { stopLoss: { kind: "pips", pips: 30 }, takeProfit: { kind: "pips", pips: 60 } },
    }),
  },
  {
    id: "engulfing_swing_stops",
    prompt:
      "On the 1 hour, buy on a bullish engulfing candle when price is above the 200 EMA, sell on a bearish engulfing below it. Stop below the last swing low for buys and above the last swing high for sells, target 2R.",
    expect: rules({
      timeframe: "H1",
      long: [{ kind: "pattern", pattern: "engulfing", side: "bullish" }, gt(close, ema(200))],
      short: [{ kind: "pattern", pattern: "engulfing", side: "bearish" }, lt(close, ema(200))],
      exits: { stopLoss: { kind: "level", at: swingLow, atShort: swingHigh }, takeProfit: { kind: "rr", multiple: 2 } },
    }),
  },
  {
    id: "inside_bar_pending",
    prompt:
      "Daily inside bar: if the inside bar closes bullish, place a buy stop at its high; if it closes bearish, a sell stop at its low. Cancel after 2 days. Stop 50 pips, target 100.",
    expect: rules({
      timeframe: "D1",
      filters: [{ kind: "pattern", pattern: "inside_bar" }],
      long: [gt(close, open)],
      short: [lt(close, open)],
      entry: { long: { type: "stop", at: high, expiresBars: 2 }, short: { type: "stop", at: low, expiresBars: 2 } },
      exits: { stopLoss: { kind: "pips", pips: 50 }, takeProfit: { kind: "pips", pips: 100 } },
    }),
  },
  {
    id: "vwap_time_window",
    prompt:
      "Only trade between 13:00 and 16:00 GMT, Tuesday to Thursday. Buy when price crosses above VWAP, sell when it crosses below. Stop 10 pips, target 20.",
    expect: rules({
      filters: [
        { kind: "time_window", fromHour: 13, toHour: 16 },
        { kind: "weekday", days: [2, 3, 4] },
      ],
      long: [above(close, { kind: "vwap" })],
      short: [below(close, { kind: "vwap" })],
      exits: { stopLoss: { kind: "pips", pips: 10 }, takeProfit: { kind: "pips", pips: 20 } },
    }),
  },
  {
    id: "fvg_ny_session",
    prompt:
      "M5, New York session only. Buy when a bullish fair value gap of at least 3 pips forms while price is above the 1-hour 50 EMA; sell on a bearish FVG while price is below it. Stop 8 pips, 3R target.",
    expect: rules({
      timeframe: "M5",
      filters: [{ kind: "session", name: "new_york" }],
      long: [{ kind: "pattern", pattern: "fvg", side: "bullish", minPips: 3 }, gt(close, ema(50, "H1"))],
      short: [{ kind: "pattern", pattern: "fvg", side: "bearish", minPips: 3 }, lt(close, ema(50, "H1"))],
      exits: { stopLoss: { kind: "pips", pips: 8 }, takeProfit: { kind: "rr", multiple: 3 } },
    }),
  },
  {
    id: "pivot_pin_bars",
    prompt:
      "Buy when price is within 5 pips of the daily pivot point and the candle is a bullish pin bar. Sell when price is within 5 pips of R1 on a bearish pin bar. TP 20, SL 15.",
    expect: rules({
      long: [{ kind: "near", a: close, b: pivot, pips: 5 }, { kind: "pattern", pattern: "pin_bar", side: "bullish" }],
      short: [{ kind: "near", a: close, b: sub(mul(c(2), pivot), d1("low")), pips: 5 }, { kind: "pattern", pattern: "pin_bar", side: "bearish" }],
      exits: { stopLoss: { kind: "pips", pips: 15 }, takeProfit: { kind: "pips", pips: 20 } },
    }),
  },
  {
    id: "turtle_breakout",
    prompt:
      "Turtle-style on the daily: buy when price closes above the highest high of the previous 20 days, sell when it closes below the lowest low of the previous 20 days. Stop 2x ATR(20). Close on the opposite signal.",
    expect: rules({
      timeframe: "D1",
      long: [gt(close, { kind: "highest", bars: 20, shift: 1 })],
      short: [lt(close, { kind: "lowest", bars: 20, shift: 1 })],
      exits: { stopLoss: { kind: "atr", multiple: 2, period: 20 }, closeOnOpposite: true },
    }),
  },
  {
    id: "buys_only_asks_mirror",
    prompt: "Buy when the 20 EMA crosses above the 50 EMA on H1. Stop 30 pips, target 60.",
    answers: [{ question: "Should the bot also sell on the mirror-image setup?", answer: "No, buys only" }],
    expect: rules({
      timeframe: "H1",
      long: [above(ema(20), ema(50))],
      short: null,
      exits: { stopLoss: { kind: "pips", pips: 30 }, takeProfit: { kind: "pips", pips: 60 } },
    }),
  },
  {
    id: "no_exits_asks",
    prompt: "Buy when RSI(14) crosses above 50 and sell when it crosses below 50.",
    answers: [{ question: "How should trades close?", answer: "Close when the opposite signal fires" }],
    expect: rules({
      long: [above(rsi(14), c(50))],
      short: [below(rsi(14), c(50))],
      exits: { closeOnOpposite: true },
    }),
  },
  {
    id: "martingale_unmapped",
    prompt: "Buy when price crosses above the 100 SMA and sell when it crosses below. Stop 20 pips, target 40. After a loss, double the lot size.",
    unmapped: ["double"],
    expect: rules({
      long: [above(close, sma(100))],
      short: [below(close, sma(100))],
      exits: { stopLoss: { kind: "pips", pips: 20 }, takeProfit: { kind: "pips", pips: 40 } },
    }),
  },
  {
    id: "divergence_unmapped",
    prompt:
      "Sell when RSI(14) is above 70 and there is bearish divergence, buy when RSI is below 30 with bullish divergence. Stop 20, target 40.",
    unmapped: ["divergence"],
    expect: rules({
      long: [lt(rsi(14), c(30))],
      short: [gt(rsi(14), c(70))],
      exits: { stopLoss: { kind: "pips", pips: 20 }, takeProfit: { kind: "pips", pips: 40 } },
    }),
  },
  {
    id: "not_a_strategy",
    prompt: "What's the best laptop for trading?",
    expect: null,
  },
  {
    id: "risk_and_guards",
    prompt:
      "Trade the 9/21 EMA crossover both ways on the 15 minute chart. Risk $50 per trade with a 15 pip stop and 30 pip target. Max 3 trades a day, stop for the day after losing 2%, skip entries when the spread is above 2 pips, and avoid high-impact news.",
    expect: rules({
      timeframe: "M15",
      long: [above(ema(9), ema(21))],
      short: [below(ema(9), ema(21))],
      exits: { stopLoss: { kind: "pips", pips: 15 }, takeProfit: { kind: "pips", pips: 30 } },
      sizing: { riskMoney: 50 },
      guards: { maxTradesPerDay: 3, maxDailyLossPercent: 2, maxSpreadPips: 2, news: "high" },
    }),
  },
  {
    id: "pdh_breakout_managed",
    prompt:
      "H1: buy on the first candle that closes above the previous day's high, sell on the first that closes below the previous day's low. Stop 20 pips. Move to break even after 20 pips, close half at 1R and trail the rest by 15 pips.",
    expect: rules({
      timeframe: "H1",
      long: [above(close, d1("high"))],
      short: [below(close, d1("low"))],
      exits: {
        stopLoss: { kind: "pips", pips: 20 },
        breakEvenPips: 20,
        partial: { atR: 1, fraction: 0.5 },
        trailing: { kind: "pips", pips: 15 },
      },
    }),
  },
  {
    id: "h4_trend_m15_entry",
    prompt:
      "M15 entries. Only buy when the 4-hour 50 EMA is above the 4-hour 200 EMA, only sell when it's below. Enter a buy when RSI(14) crosses back above 30, a sell when it crosses back below 70. Stop 20, TP 40.",
    expect: rules({
      timeframe: "M15",
      long: [gt(ema(50, "H4"), ema(200, "H4")), above(rsi(14), c(30))],
      short: [lt(ema(50, "H4"), ema(200, "H4")), below(rsi(14), c(70))],
      exits: { stopLoss: { kind: "pips", pips: 20 }, takeProfit: { kind: "pips", pips: 40 } },
    }),
  },
  {
    id: "sweep_then_engulfing",
    prompt:
      "H1. Wait for a sweep of the previous day's low (a candle trades below it and closes back above it), then buy if a bullish engulfing candle appears within 5 candles. Mirror it for sells at the previous day's high. SL 15, TP 45.",
    expect: rules({
      timeframe: "H1",
      long: [
        { kind: "within", bars: 5, of: { kind: "all", of: [lt(low, d1("low")), gt(close, d1("low"))] } },
        { kind: "pattern", pattern: "engulfing", side: "bullish" },
      ],
      short: [
        { kind: "within", bars: 5, of: { kind: "all", of: [gt(high, d1("high")), lt(close, d1("high"))] } },
        { kind: "pattern", pattern: "engulfing", side: "bearish" },
      ],
      exits: { stopLoss: { kind: "pips", pips: 15 }, takeProfit: { kind: "pips", pips: 45 } },
    }),
  },
  {
    id: "ichimoku_cloud",
    prompt:
      "H4. Buy when price closes above the Ichimoku cloud and the Tenkan crosses above the Kijun; sell when price is below the cloud and the Tenkan crosses below the Kijun. Default settings. SL 50, TP 100.",
    expect: rules({
      timeframe: "H4",
      long: [gt(close, spanA26), gt(close, spanB26), above(tenkan, kijun)],
      short: [lt(close, spanA26), lt(close, spanB26), below(tenkan, kijun)],
      exits: { stopLoss: { kind: "pips", pips: 50 }, takeProfit: { kind: "pips", pips: 100 } },
    }),
  },
  {
    id: "rsi2_pullback_limit",
    prompt:
      "Daily. When price is above the 200 SMA and RSI(2) is below 10, place a buy limit 10 pips below the close, cancelled after 3 days. When price is below the 200 SMA and RSI(2) is above 90, a sell limit 10 pips above the close. Stop 20, target 20.",
    expect: rules({
      timeframe: "D1",
      long: [gt(close, sma(200)), lt(rsi(2), c(10))],
      short: [lt(close, sma(200)), gt(rsi(2), c(90))],
      entry: {
        long: { type: "limit", at: sub(close, pips(10)), expiresBars: 3 },
        short: { type: "limit", at: add(close, pips(10)), expiresBars: 3 },
      },
      exits: { stopLoss: { kind: "pips", pips: 20 }, takeProfit: { kind: "pips", pips: 20 } },
    }),
  },
  {
    id: "monday_asia_breakout_buys",
    prompt:
      "Buys only, M30. On Mondays between 07:00 and 10:00 GMT, buy if the last candle closed above the Asian session high. Stop 15 pips, take profit 30.",
    expect: rules({
      timeframe: "M30",
      filters: [
        { kind: "weekday", days: [1] },
        { kind: "time_window", fromHour: 7, toHour: 10 },
      ],
      long: [gt(close, { kind: "session_range", session: "asia", side: "high" })],
      short: null,
      exits: { stopLoss: { kind: "pips", pips: 15 }, takeProfit: { kind: "pips", pips: 30 } },
    }),
  },
  {
    id: "fib_618_limit",
    prompt:
      "Buys only on H1. While price is above the 200 EMA, place a buy limit at the 61.8% retracement of the last swing (swing low to swing high), expiring after 10 candles. Stop 10 pips below the swing low, target the swing high.",
    expect: rules({
      timeframe: "H1",
      long: [gt(close, ema(200))],
      short: null,
      entry: { long: { type: "limit", at: sub(swingHigh, mul(c(0.618), sub(swingHigh, swingLow))), expiresBars: 10 } },
      exits: { stopLoss: { kind: "level", at: sub(swingLow, pips(10)) }, takeProfit: { kind: "level", at: swingHigh } },
    }),
  },
];

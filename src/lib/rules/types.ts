// StratoBot rule language, version 1.
//
// A strategy is filters + long/short entry conditions + exits + sizing + guards.
// The MQL5 compiler (compile-mql5.ts) and the TypeScript interpreter
// (interpret.ts) both implement exactly these semantics, and the MT5
// differential test (scripts/mt5) checks that they agree node by node:
//
// - Decisions happen once per new bar of `timeframe`, using closed bars only.
// - A value's `shift` counts closed bars back on its own timeframe:
//   shift 0 = the most recently closed bar at decision time.
// - Every node is evaluated at an offset k (normally 0). `cross` also looks at
//   k+1, and `within` looks at k..k+bars-1; the offset adds to every shift below it.
// - Time-based conditions use the decision time for offset k: the open time of
//   the bar that opened k bars ago, converted to GMT with the broker's offset.
// - A value that can't be computed (not enough history) makes any condition
//   using it false.

export type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1";
export type Field = "open" | "high" | "low" | "close";
export type Side = "bullish" | "bearish";

interface Series {
  /** Omitted = the strategy's own timeframe. */
  tf?: Timeframe;
  shift?: number;
}

export type Value =
  | { kind: "const"; value: number }
  | { kind: "pips"; value: number }
  | ({ kind: "price"; field: Field } & Series)
  | ({ kind: "ma"; method: "sma" | "ema" | "smma" | "lwma"; period: number; field?: Field } & Series)
  | ({ kind: "rsi"; period: number } & Series)
  | ({ kind: "atr"; period: number } & Series)
  | ({ kind: "macd"; fast: number; slow: number; signal: number; line: "main" | "signal" } & Series)
  | ({ kind: "bands"; period: number; deviation: number; line: "middle" | "upper" | "lower" } & Series)
  /** Highest high / lowest low over `bars` bars starting at `shift`. */
  | ({ kind: "highest" | "lowest"; bars: number } & Series)
  /** Tick-volume-weighted average price since the start of the bar's trading day (strategy timeframe only). */
  | { kind: "vwap"; shift?: number }
  | { kind: "arith"; op: "add" | "sub" | "mul" | "div"; a: Value; b: Value };

export type Pattern =
  | { pattern: "engulfing"; side: Side }
  | { pattern: "pin_bar"; side: Side }
  /** Gap between the newest candle's wick and the wick two candles older. */
  | { pattern: "fvg"; side: Side; minPips: number }
  /** First candle in `lookback` whose body is >1.5x the one before it; price back inside that earlier candle. */
  | { pattern: "order_block"; side: Side; lookback: number };

export type Session = "london" | "new_york" | "asia" | "london_ny_overlap";

export type Condition =
  | { kind: "compare"; a: Value; op: "gt" | "lt" | "gte" | "lte"; b: Value }
  /** a was <= b (above) / >= b (below) one bar earlier, and is strictly past it now. */
  | { kind: "cross"; a: Value; dir: "above" | "below"; b: Value }
  | { kind: "near"; a: Value; b: Value; pips: number }
  | ({ kind: "pattern" } & Pattern & Series)
  | { kind: "session"; name: Session }
  | { kind: "all"; of: Condition[] }
  | { kind: "any"; of: Condition[] }
  | { kind: "not"; of: Condition }
  /** True if `of` held at any of the last `bars` decision points (including this one). */
  | { kind: "within"; bars: number; of: Condition };

export interface RuleStrategy {
  version: 1;
  /** "chart" = whatever chart / tester timeframe the EA runs on. */
  timeframe: Timeframe | "chart";
  /** All must hold before either side can enter. */
  filters: Condition[];
  /** All must hold to buy. null = this strategy never buys. */
  long: Condition[] | null;
  /** All must hold to sell. null = this strategy never sells. */
  short: Condition[] | null;
  /** No rule decides buy vs. sell; the EA takes direction from a trader-set input
   *  whenever the filters pass. Only valid when long and short are both null. */
  directionFromInput?: boolean;
  exits: {
    stopLossPips?: number;
    takeProfitPips?: number;
    trailingPips?: number;
    breakEvenPips?: number;
  };
  sizing: {
    /** Fixed lots; when riskPercent also applies, this is the cap. */
    fixedLots?: number;
    /** % of balance lost if the stop loss is hit. Needs stopLossPips. */
    riskPercent?: number;
  };
  guards: {
    maxDailyLossPercent?: number;
    news?: "high" | "all";
    /** Minimum take-profit / stop-loss ratio. */
    minRewardRisk?: number;
  };
}

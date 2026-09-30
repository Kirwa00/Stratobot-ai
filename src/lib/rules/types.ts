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
/** median = (H+L)/2, typical = (H+L+C)/3, weighted = (H+L+2C)/4, as MT5's applied prices. */
export type Field = "open" | "high" | "low" | "close" | "median" | "typical" | "weighted";
export type Side = "bullish" | "bearish";
export type MaMethod = "sma" | "ema" | "smma" | "lwma";

interface Series {
  /** Omitted = the strategy's own timeframe. */
  tf?: Timeframe;
  shift?: number;
}

export type Value =
  | { kind: "const"; value: number }
  | { kind: "pips"; value: number }
  | ({ kind: "price"; field: Field } & Series)
  | ({ kind: "ma"; method: MaMethod; period: number; field?: Field } & Series)
  | ({ kind: "rsi"; period: number } & Series)
  | ({ kind: "atr"; period: number } & Series)
  | ({ kind: "macd"; fast: number; slow: number; signal: number; line: "main" | "signal" } & Series)
  | ({ kind: "bands"; period: number; deviation: number; line: "middle" | "upper" | "lower" } & Series)
  /** %K main line, or its SMA signal line (MT5 iStochastic, low/high price field). */
  | ({ kind: "stochastic"; k: number; d: number; slowing: number; line: "main" | "signal" } & Series)
  /** Default field: typical price. */
  | ({ kind: "cci"; period: number; field?: Field } & Series)
  | ({ kind: "adx"; period: number; line: "adx" | "plus_di" | "minus_di" } & Series)
  | ({ kind: "sar"; step: number; max: number } & Series)
  /** close / close[period bars ago] * 100. */
  | ({ kind: "momentum"; period: number; field?: Field } & Series)
  /** Williams %R, 0 to -100. */
  | ({ kind: "wpr"; period: number } & Series)
  /** Moving average +/- deviation percent. */
  | ({ kind: "envelopes"; period: number; method: MaMethod; deviation: number; line: "upper" | "lower"; field?: Field } & Series)
  | ({ kind: "stddev"; period: number; field?: Field } & Series)
  | ({ kind: "demarker"; period: number } & Series)
  /** Highest high / lowest low over `bars` bars starting at `shift`. */
  | ({ kind: "highest" | "lowest"; bars: number } & Series)
  /** Size of one candle: body, full range, or a wick. */
  | ({ kind: "candle"; measure: "body" | "range" | "upper_wick" | "lower_wick" } & Series)
  /** Most recent confirmed swing high/low: a bar beyond its `strength` neighbours on each side, within `lookback` bars. */
  | ({ kind: "swing"; side: "high" | "low"; strength: number; lookback: number } & Series)
  /** High/low of the most recent run of bars inside a session (in progress or just finished), strategy timeframe. */
  | { kind: "session_range"; session: Session; side: "high" | "low"; shift?: number }
  /** Tick-volume-weighted average price since the start of the bar's trading day (strategy timeframe only). */
  | { kind: "vwap"; shift?: number }
  | { kind: "arith"; op: "add" | "sub" | "mul" | "div"; a: Value; b: Value };

export type Pattern =
  | { pattern: "engulfing"; side: Side }
  | { pattern: "pin_bar"; side: Side }
  /** Gap between the newest candle's wick and the wick two candles older. */
  | { pattern: "fvg"; side: Side; minPips: number }
  /** First candle in `lookback` whose body is >1.5x the one before it; price back inside that earlier candle. */
  | { pattern: "order_block"; side: Side; lookback: number }
  /** Range fully inside the previous candle's range. */
  | { pattern: "inside_bar" }
  /** Range fully covers the previous candle's range. */
  | { pattern: "outside_bar" }
  /** Body at most 10% of the range. */
  | { pattern: "doji" }
  /** Three same-direction candles, each closing beyond the last (three soldiers / three crows). */
  | { pattern: "three_in_row"; side: Side }
  /** Morning (bullish) / evening (bearish) star. */
  | { pattern: "star"; side: Side };

export type Session = "london" | "new_york" | "asia" | "london_ny_overlap";

export type Condition =
  | { kind: "compare"; a: Value; op: "gt" | "lt" | "gte" | "lte"; b: Value }
  /** a was <= b (above) / >= b (below) one bar earlier, and is strictly past it now. */
  | { kind: "cross"; a: Value; dir: "above" | "below"; b: Value }
  | { kind: "near"; a: Value; b: Value; pips: number }
  | ({ kind: "pattern" } & Pattern & Series)
  | { kind: "session"; name: Session }
  /** GMT hour window [fromHour, toHour); wraps past midnight when fromHour > toHour. */
  | { kind: "time_window"; fromHour: number; toHour: number }
  /** GMT weekday of the decision, 0 = Sunday. */
  | { kind: "weekday"; days: number[] }
  | { kind: "all"; of: Condition[] }
  | { kind: "any"; of: Condition[] }
  | { kind: "not"; of: Condition }
  /** True if `of` held at any of the last `bars` decision points (including this one). */
  | { kind: "within"; bars: number; of: Condition };

/** Distance from the entry price to a stop, or the stop's price itself. */
export type StopSpec =
  | { kind: "pips"; pips: number }
  /** multiple x ATR(period) of the last closed bar at the decision. */
  | { kind: "atr"; multiple: number; period: number }
  /** An absolute price from a rule value (e.g. the last swing low), read at the decision.
   *  If it's on the wrong side of the entry, the trade is skipped. */
  | { kind: "level"; at: Value };

export type TargetSpec = StopSpec | { kind: "rr"; multiple: number };

export type TrailSpec = { kind: "pips"; pips: number } | { kind: "atr"; multiple: number; period: number };

/** Instead of entering at market: a pending order at a rule-defined price. */
export interface PendingEntry {
  /** limit = better than current price (pullback); stop = beyond it (breakout). */
  type: "limit" | "stop";
  at: Value;
  /** Cancel if not filled after this many bars. */
  expiresBars: number;
}

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
  /** Per side; omitted = enter at market on the decision bar. */
  entry?: { long?: PendingEntry; short?: PendingEntry };
  exits: {
    stopLoss?: StopSpec;
    takeProfit?: TargetSpec;
    trailing?: TrailSpec;
    /** Move the stop to the entry price once this far in profit. */
    breakEvenPips?: number;
    /** Close at market on the open of the Nth bar after entry. */
    closeAfterBars?: number;
    /** Close when the opposite side's entry signal fires (it may then enter that way). */
    closeOnOpposite?: boolean;
    /** Close `fraction` of the position once profit reaches `atR` x the initial stop distance. */
    partial?: { atR: number; fraction: number };
  };
  sizing: {
    /** Fixed lots; when risk sizing also applies, this is the cap. */
    fixedLots?: number;
    /** % of balance lost if the stop loss is hit. Needs a stop loss. */
    riskPercent?: number;
    /** Account-currency amount lost if the stop loss is hit. Needs a stop loss. */
    riskMoney?: number;
  };
  guards: {
    maxDailyLossPercent?: number;
    news?: "high" | "all";
    /** Minimum take-profit / stop-loss distance ratio. */
    minRewardRisk?: number;
    /** Entries (fills) per server day. */
    maxTradesPerDay?: number;
    /** Skip entries while the spread is wider than this. */
    maxSpreadPips?: number;
  };
}

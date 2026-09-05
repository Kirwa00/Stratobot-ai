import type { BlockDef } from "./types";

// The 10-block library from Engineering Plan v1.2 §2 (Workstream A).
// Every block here is the "hand-written, pre-compiled, individually tested"
// template unit in the real system. In this app they drive the mock
// parser, the Adjust screen's picker, and the Strategy Strip.

export const BLOCKS: BlockDef[] = [
  {
    id: "killzone",
    label: "Killzone",
    role: "filter",
    category: "Timing",
    icon: "schedule",
    description: "Only trade during a specific market session.",
    keywords: ["killzone", "session", "london", "new york", "ny session", "asia", "asian", "tokyo", "overlap"],
    params: [
      {
        key: "session",
        label: "Session",
        type: "select",
        default: "London",
        options: [
          { value: "London", label: "London" },
          { value: "New York", label: "New York" },
          { value: "Asia", label: "Asia" },
          { value: "London/NY Overlap", label: "London/NY Overlap" },
        ],
      },
    ],
  },
  {
    id: "sweep",
    label: "Sweep",
    role: "entry",
    category: "Structure",
    icon: "waves",
    description: "Waits for price to take out a previous high or low.",
    keywords: ["sweep", "swept", "liquidity", "stop hunt", "take out", "grab"],
    params: [
      {
        key: "of",
        label: "Sweeps",
        type: "select",
        default: "Previous Day High",
        options: [
          { value: "Previous Day High", label: "Previous Day High (PDH)" },
          { value: "Previous Day Low", label: "Previous Day Low (PDL)" },
          { value: "Session High", label: "Session High" },
          { value: "Session Low", label: "Session Low" },
        ],
      },
    ],
  },
  {
    id: "pdh",
    label: "Prior Day Level",
    role: "entry",
    category: "Levels",
    icon: "horizontal_rule",
    description: "Marks yesterday's high and low as key reference levels.",
    keywords: ["previous day", "prior day", "pdh", "pdl", "yesterday's high", "yesterday's low"],
    params: [
      {
        key: "side",
        label: "Level",
        type: "select",
        default: "Both",
        options: [
          { value: "High", label: "High only" },
          { value: "Low", label: "Low only" },
          { value: "Both", label: "Both" },
        ],
      },
    ],
  },
  {
    id: "fvg",
    label: "Fair Value Gap",
    role: "entry",
    category: "Structure",
    icon: "space_bar",
    description: "Looks for a price imbalance left by a strong move.",
    keywords: ["fair value gap", "fvg", "imbalance", "gap"],
    params: [
      { key: "minSize", label: "Minimum size", type: "number", default: 5, unit: "pips", min: 1, max: 50, step: 1 },
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "ob",
    label: "Order Block",
    role: "entry",
    category: "Structure",
    icon: "view_agenda",
    description: "Finds the last opposite candle before a strong move.",
    keywords: ["order block", "ob ", " ob,", "orderblock"],
    params: [
      { key: "lookback", label: "Lookback", type: "number", default: 10, unit: "candles", min: 3, max: 50, step: 1 },
    ],
  },
  {
    id: "atr",
    label: "ATR Filter",
    role: "filter",
    category: "Volatility",
    icon: "monitoring",
    description: "Only trades when volatility is above or below a threshold.",
    keywords: ["atr", "volatility", "average true range"],
    params: [
      { key: "period", label: "Period", type: "number", default: 14, min: 2, max: 50, step: 1 },
      {
        key: "condition",
        label: "Condition",
        type: "select",
        default: "Above average",
        options: [
          { value: "Above average", label: "Above average" },
          { value: "Below average", label: "Below average" },
        ],
      },
    ],
  },
  {
    id: "ma_cross",
    label: "MA Cross",
    role: "entry",
    category: "Structure",
    icon: "ssid_chart",
    description: "Enters when a fast average crosses a slow one.",
    keywords: ["moving average", "ma cross", "ema cross", "sma cross", "crossover", "cross above", "cross below"],
    params: [
      { key: "fast", label: "Fast period", type: "number", default: 9, min: 1, max: 100, step: 1 },
      { key: "slow", label: "Slow period", type: "number", default: 21, min: 2, max: 200, step: 1 },
      {
        key: "type",
        label: "Type",
        type: "select",
        default: "EMA",
        options: [
          { value: "EMA", label: "EMA" },
          { value: "SMA", label: "SMA" },
        ],
      },
    ],
  },
  {
    id: "engulfing",
    label: "Engulfing Candle",
    role: "entry",
    category: "Structure",
    icon: "candlestick_chart",
    description: "Waits for a candle that fully engulfs the previous one.",
    keywords: ["engulf", "engulfing"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "fib50",
    label: "Fib 50% Retrace",
    role: "entry",
    category: "Levels",
    icon: "percent",
    description: "Enters on a percentage pullback of the recent move.",
    keywords: ["fib", "fibonacci", "retrace", "retracement", "50%", "pullback"],
    params: [
      {
        key: "level",
        label: "Retrace level",
        type: "select",
        default: "50%",
        options: [
          { value: "38.2%", label: "38.2%" },
          { value: "50%", label: "50%" },
          { value: "61.8%", label: "61.8%" },
        ],
      },
    ],
  },
  {
    id: "trailing_stop",
    label: "Trailing Stop",
    role: "exit",
    category: "Exits",
    icon: "trending_down",
    description: "Trails your stop loss behind price by a fixed distance.",
    keywords: ["trailing stop", "trail", "trailing"],
    params: [
      { key: "distance", label: "Distance", type: "number", default: 30, unit: "pips", min: 5, max: 200, step: 1 },
    ],
  },
  {
    id: "rsi",
    label: "RSI Filter",
    role: "filter",
    category: "Indicators",
    icon: "speed",
    description: "Only trades when RSI is overbought or oversold.",
    keywords: ["rsi", "relative strength", "overbought", "oversold"],
    params: [
      { key: "period", label: "Period", type: "number", default: 14, min: 2, max: 50, step: 1 },
      {
        key: "condition",
        label: "Condition",
        type: "select",
        default: "Oversold (<30)",
        options: [
          { value: "Overbought (>70)", label: "Overbought (>70)" },
          { value: "Oversold (<30)", label: "Oversold (<30)" },
        ],
      },
    ],
  },
  {
    id: "macd",
    label: "MACD Cross",
    role: "entry",
    category: "Indicators",
    icon: "ssid_chart",
    description: "Enters on a MACD signal line crossover.",
    keywords: ["macd", "moving average convergence", "macd cross", "macd crossover"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "bollinger",
    label: "Bollinger Band",
    role: "entry",
    category: "Indicators",
    icon: "waves",
    description: "Reacts to price touching or squeezing the Bollinger Bands.",
    keywords: ["bollinger", "bollinger band", "bb squeeze", "upper band", "lower band", "band squeeze"],
    params: [
      {
        key: "touch",
        label: "Reaction",
        type: "select",
        default: "Lower band",
        options: [
          { value: "Upper band", label: "Upper band" },
          { value: "Lower band", label: "Lower band" },
          { value: "Squeeze", label: "Squeeze (low volatility)" },
        ],
      },
    ],
  },
  {
    id: "vwap",
    label: "VWAP",
    role: "filter",
    category: "Levels",
    icon: "horizontal_rule",
    description: "Filters or enters based on price vs. the volume-weighted average price.",
    keywords: ["vwap", "volume weighted", "volume-weighted average price"],
    params: [
      {
        key: "condition",
        label: "Condition",
        type: "select",
        default: "Price above VWAP",
        options: [
          { value: "Price above VWAP", label: "Price above VWAP" },
          { value: "Price below VWAP", label: "Price below VWAP" },
          { value: "VWAP reclaim", label: "VWAP reclaim" },
        ],
      },
    ],
  },
  {
    id: "support_resistance",
    label: "Support / Resistance",
    role: "entry",
    category: "Levels",
    icon: "horizontal_rule",
    description: "Reacts to price at a horizontal support or resistance level.",
    keywords: ["support", "resistance", "key level", "s/r", "supply zone", "demand zone"],
    params: [
      {
        key: "side",
        label: "Level",
        type: "select",
        default: "Either",
        options: [
          { value: "Support", label: "Support" },
          { value: "Resistance", label: "Resistance" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "bos",
    label: "Break of Structure",
    role: "entry",
    category: "Structure",
    icon: "timeline",
    description: "Enters on a break of market structure or change of character.",
    keywords: ["break of structure", "bos", "choch", "change of character", "structure shift", "structure break"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "breakout",
    label: "Breakout",
    role: "entry",
    category: "Structure",
    icon: "open_in_full",
    description: "Enters when price breaks out of a range or consolidation.",
    keywords: ["breakout", "break out", "range break", "box break", "consolidation break"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "pin_bar",
    label: "Pin Bar",
    role: "entry",
    category: "Structure",
    icon: "candlestick_chart",
    description: "Waits for a rejection candle (pin bar, hammer, shooting star).",
    keywords: ["pin bar", "hammer", "shooting star", "rejection candle", "wick rejection"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "divergence",
    label: "Divergence",
    role: "entry",
    category: "Structure",
    icon: "call_split",
    description: "Enters on price/indicator divergence.",
    keywords: ["divergence", "rsi divergence", "bullish divergence", "bearish divergence", "hidden divergence"],
    params: [
      {
        key: "direction",
        label: "Direction",
        type: "select",
        default: "Either",
        options: [
          { value: "Bullish", label: "Bullish" },
          { value: "Bearish", label: "Bearish" },
          { value: "Either", label: "Either" },
        ],
      },
    ],
  },
  {
    id: "stop_loss",
    label: "Stop Loss",
    role: "exit",
    category: "Exits",
    icon: "trending_down",
    description: "Sets a fixed stop loss distance from entry.",
    keywords: ["stop loss", "stop-loss", " sl ", "hard stop"],
    params: [
      { key: "distance", label: "Distance", type: "number", default: 20, unit: "pips", min: 1, max: 500, step: 1 },
    ],
  },
  {
    id: "take_profit",
    label: "Take Profit",
    role: "exit",
    category: "Exits",
    icon: "trending_up",
    description: "Sets a fixed take-profit target from entry.",
    keywords: ["take profit", "take-profit", " tp ", "profit target"],
    params: [
      { key: "distance", label: "Distance", type: "number", default: 40, unit: "pips", min: 1, max: 1000, step: 1 },
    ],
  },
  {
    id: "break_even",
    label: "Break Even",
    role: "exit",
    category: "Exits",
    icon: "balance",
    description: "Moves the stop to entry once price moves far enough in your favor.",
    keywords: ["break even", "breakeven", "move stop to entry", "risk free trade"],
    params: [
      { key: "trigger", label: "Trigger", type: "number", default: 20, unit: "pips", min: 1, max: 200, step: 1 },
    ],
  },
  {
    id: "position_size",
    label: "Position Size",
    role: "exit",
    category: "Exits",
    icon: "scale",
    description: "Sets a fixed position/lot size for each trade.",
    keywords: ["position size", "lot size", "lots", "position sizing"],
    params: [
      { key: "size", label: "Size", type: "number", default: 1, unit: "lots", min: 0.01, max: 100, step: 0.01 },
    ],
  },
  {
    id: "risk_per_trade",
    label: "Risk Per Trade",
    role: "filter",
    category: "Risk",
    icon: "percent",
    description: "Caps the account risk percentage on every trade.",
    keywords: ["risk per trade", "risk %", "% risk", "risking", "risk 1%", "risk 2%"],
    params: [
      { key: "percent", label: "Risk", type: "number", default: 1, unit: "%", min: 0.1, max: 10, step: 0.1 },
    ],
  },
  {
    id: "risk_reward",
    label: "Risk : Reward",
    role: "filter",
    category: "Risk",
    icon: "balance",
    description: "Only takes trades that meet a minimum reward-to-risk ratio.",
    keywords: ["risk reward", "risk:reward", "r:r", "reward ratio", "1:2", "1:3"],
    params: [
      {
        key: "ratio",
        label: "Minimum ratio",
        type: "select",
        default: "1:2",
        options: [
          { value: "1:1", label: "1:1" },
          { value: "1:2", label: "1:2" },
          { value: "1:3", label: "1:3" },
          { value: "2:1", label: "2:1" },
        ],
      },
    ],
  },
  {
    id: "max_daily_loss",
    label: "Max Daily Loss",
    role: "filter",
    category: "Risk",
    icon: "warning",
    description: "Stops trading for the day once a loss limit is hit.",
    keywords: ["daily loss limit", "max daily loss", "daily drawdown", "stop trading for the day"],
    params: [
      { key: "percent", label: "Limit", type: "number", default: 3, unit: "%", min: 0.5, max: 20, step: 0.5 },
    ],
  },
  {
    id: "news_filter",
    label: "News Filter",
    role: "filter",
    category: "Filters",
    icon: "newspaper",
    description: "Avoids trading around high-impact news events.",
    keywords: ["news", "high impact news", "avoid news", "nfp", "red folder", "economic calendar"],
    params: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "Avoid high-impact news",
        options: [
          { value: "Avoid high-impact news", label: "Avoid high-impact news" },
          { value: "Avoid all news", label: "Avoid all news" },
        ],
      },
    ],
  },
  {
    id: "htf_confirmation",
    label: "Higher Timeframe Bias",
    role: "filter",
    category: "Filters",
    icon: "schema",
    description: "Only trades in the direction of a higher-timeframe bias.",
    keywords: ["higher timeframe", "htf", "daily bias", "4h bias", "weekly bias", "multi-timeframe", "multi timeframe"],
    params: [
      {
        key: "timeframe",
        label: "Timeframe",
        type: "select",
        default: "4H",
        options: [
          { value: "4H", label: "4H" },
          { value: "Daily", label: "Daily" },
          { value: "Weekly", label: "Weekly" },
        ],
      },
    ],
  },
];

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(
  BLOCKS.map((b) => [b.id, b])
);

export const CATEGORIES: BlockDef["category"][] = [
  "Timing",
  "Structure",
  "Levels",
  "Indicators",
  "Volatility",
  "Filters",
  "Risk",
  "Exits",
];

export function getBlock(id: string): BlockDef | undefined {
  return BLOCK_MAP[id];
}

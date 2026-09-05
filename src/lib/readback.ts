import type { BlockInstance } from "./types";

// Shared between the local keyword parser and the LLM parse route so both
// paths render an identical readback sentence for the same blocks.

export function describeBlock(instance: BlockInstance): string {
  switch (instance.blockId) {
    case "killzone":
      return `Trade only during the ${instance.params.session} session`;
    case "sweep":
      return `wait for price to sweep the ${String(instance.params.of).toLowerCase()}`;
    case "pdh":
      return `mark the previous day's ${String(instance.params.side).toLowerCase()} as a key level`;
    case "fvg":
      return `look for a fair value gap (${String(instance.params.direction).toLowerCase()}, at least ${instance.params.minSize} pips)`;
    case "ob":
      return `find the last order block over the past ${instance.params.lookback} candles`;
    case "atr":
      return `only trade when volatility is ${String(instance.params.condition).toLowerCase()} (ATR ${instance.params.period})`;
    case "ma_cross":
      return `enter on a ${instance.params.fast}/${instance.params.slow} ${instance.params.type} cross`;
    case "engulfing":
      return `wait for a ${String(instance.params.direction).toLowerCase()} engulfing candle`;
    case "fib50":
      return `enter on a ${instance.params.level} retrace`;
    case "trailing_stop":
      return `trail the stop by ${instance.params.distance} pips`;
    case "rsi":
      return `only trade when RSI(${instance.params.period}) is ${String(instance.params.condition).toLowerCase()}`;
    case "macd":
      return `enter on a ${String(instance.params.direction).toLowerCase()} MACD cross`;
    case "bollinger":
      return `react to a ${String(instance.params.touch).toLowerCase()} on the Bollinger Bands`;
    case "vwap":
      return String(instance.params.condition).toLowerCase();
    case "support_resistance":
      return `react to price at ${String(instance.params.side).toLowerCase()}`;
    case "bos":
      return `wait for a ${String(instance.params.direction).toLowerCase()} break of structure`;
    case "breakout":
      return `enter on a ${String(instance.params.direction).toLowerCase()} breakout`;
    case "pin_bar":
      return `wait for a ${String(instance.params.direction).toLowerCase()} pin bar`;
    case "divergence":
      return `look for ${String(instance.params.direction).toLowerCase()} divergence`;
    case "stop_loss":
      return `set a stop loss ${instance.params.distance} pips from entry`;
    case "take_profit":
      return `take profit ${instance.params.distance} pips from entry`;
    case "break_even":
      return `move the stop to break-even after ${instance.params.trigger} pips`;
    case "position_size":
      return `size each trade at ${instance.params.size} lots`;
    case "risk_per_trade":
      return `risk ${instance.params.percent}% of the account per trade`;
    case "risk_reward":
      return `only take trades with at least a ${instance.params.ratio} reward-to-risk ratio`;
    case "max_daily_loss":
      return `stop trading for the day after a ${instance.params.percent}% loss`;
    case "news_filter":
      return String(instance.params.mode).toLowerCase();
    case "htf_confirmation":
      return `only trade with the ${instance.params.timeframe} bias`;
    default:
      return instance.blockId;
  }
}

export function buildReadback(blocks: BlockInstance[]): string {
  if (blocks.length === 0) {
    return "I couldn't turn that into blocks yet. Try describing your entry and exit as separate sentences.";
  }

  const parts = blocks.map(describeBlock);
  // Capitalize the first clause, keep the rest lowercase and joined naturally.
  const sentence =
    parts[0].charAt(0).toUpperCase() +
    parts[0].slice(1) +
    (parts.length > 1 ? ". " + parts.slice(1).join(", then ") + "." : ".");

  return sentence;
}

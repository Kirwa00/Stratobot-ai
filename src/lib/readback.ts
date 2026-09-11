import type { BlockInstance } from "./types";

// Shared between the local keyword parser and the LLM parse route so both
// paths render an identical readback sentence for the same blocks.

/** "Bullish"/"Bearish" render as a qualifier ("a bullish breakout"); "Either"
 *  is dropped entirely rather than rendered literally ("a either breakout"
 *  is not a word), with the article re-picked so it still reads naturally
 *  ("an engulfing candle" vs. "a bullish engulfing candle"). */
function directionalPhrase(direction: unknown, noun: string): string {
  const d = String(direction).toLowerCase();
  const firstWord = d === "either" ? noun : d;
  const article = /^[aeiou]/i.test(firstWord) ? "an" : "a";
  return d === "either" ? `${article} ${noun}` : `${article} ${d} ${noun}`;
}

export function describeBlock(instance: BlockInstance): string {
  switch (instance.blockId) {
    case "killzone":
      return `Trade only during the ${instance.params.session} session`;
    case "sweep":
      return `wait for price to sweep the ${String(instance.params.of).toLowerCase()}`;
    case "pdh": {
      const side = String(instance.params.side).toLowerCase();
      return side === "both"
        ? `mark the previous day's high and low as key levels`
        : `mark the previous day's ${side} as a key level`;
    }
    case "fvg": {
      const dir = String(instance.params.direction).toLowerCase();
      const qualifier = dir === "either" ? "" : `${dir}, `;
      return `look for a fair value gap (${qualifier}at least ${instance.params.minSize} pips)`;
    }
    case "ob":
      return `find the last order block over the past ${instance.params.lookback} candles`;
    case "atr":
      return `only trade when volatility is ${String(instance.params.condition).toLowerCase()} (ATR ${instance.params.period})`;
    case "ma_cross":
      return `enter on a ${instance.params.fast}/${instance.params.slow} ${instance.params.type} cross`;
    case "engulfing":
      return `wait for ${directionalPhrase(instance.params.direction, "engulfing candle")}`;
    case "fib50":
      return `enter on a ${instance.params.level} retrace`;
    case "trailing_stop":
      return `trail the stop by ${instance.params.distance} pips`;
    case "rsi":
      return `only trade when RSI(${instance.params.period}) is ${String(instance.params.condition).toLowerCase()}`;
    case "macd":
      return `enter on ${directionalPhrase(instance.params.direction, "MACD cross")}`;
    case "bollinger":
      return `react to a ${String(instance.params.touch).toLowerCase()} on the Bollinger Bands`;
    case "vwap":
      return String(instance.params.condition).toLowerCase();
    case "support_resistance":
      return `react to price at ${String(instance.params.side).toLowerCase()}`;
    case "bos":
      return `wait for ${directionalPhrase(instance.params.direction, "break of structure")}`;
    case "breakout":
      return `enter on ${directionalPhrase(instance.params.direction, "breakout")}`;
    case "pin_bar":
      return `wait for ${directionalPhrase(instance.params.direction, "pin bar")}`;
    case "divergence": {
      const dir = String(instance.params.direction).toLowerCase();
      return `look for ${dir === "either" ? "" : `${dir} `}divergence`;
    }
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

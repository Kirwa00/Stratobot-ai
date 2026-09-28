// MQL5 Code Templates for StratoBot AI
// Engineering Plan v1.2 §2 - Workstream A: hand-written MQL5 block templates,
// assembled by the deterministic composer (deterministic-composer.ts).
//
// Template contract (the composer relies on all of this):
// - `{blockId}` is replaced with a per-instance token (e.g. "ma_cross", or
//   "ma_cross_2" for a second MA Cross), so two instances never collide.
// - Every param in blocks.ts has exactly one `input <type> {blockId}_<key> = <default>;`
//   line; the composer rewrites that default to the trader's chosen value.
// - Pip distances go through StratoPip(), never raw _Point (1 pip = 10 points
//   on 5- and 3-digit symbols).
// - Blocks that imply a trade direction call Vote(+1 buy / -1 sell) when they
//   fire; the composer's OpenPosition() trades only when every vote agrees.
// - Exit blocks only touch positions where IsOwnPosition() is true (this EA's
//   symbol AND magic number), never the trader's manual or other EAs' trades.
// Scaffold helpers (StratoPip, Vote, IsOwnPosition, StratoWarn, StratoSLPips,
// StratoTPPips) are emitted by the composer.

export interface MQL5Template {
  blockId: string;
  code: string;
  /** Check_/Apply_ functions the composer should call. Empty for input-only blocks. */
  functions: string[];
  /** True if this block can call Vote(), i.e. it can decide buy vs sell. */
  votes: boolean;
}

export const MQL5_TEMPLATES: Record<string, MQL5Template> = {
  // TIMING BLOCKS
  killzone: {
    blockId: "killzone",
    code: `
// Killzone Filter (session hours are GMT; TimeCurrent() is broker server time, which is usually not GMT)
input string {blockId}_session = "London"; // Session: London, New York, Asia, London/NY Overlap

bool Check_{blockId}() {
  MqlDateTime timeStruct;
  TimeToStruct(TimeGMT(), timeStruct);
  int hour = timeStruct.hour;
  string session = {blockId}_session;

  if (session == "London") return (hour >= 8 && hour < 17);
  if (session == "New York") return (hour >= 13 && hour < 22);
  if (session == "Asia") return (hour >= 23 || hour < 8);
  if (session == "London/NY Overlap") return (hour >= 13 && hour < 17);
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  // STRUCTURE BLOCKS
  sweep: {
    blockId: "sweep",
    code: `
// Liquidity Sweep: a sweep of highs sets up a sell, a sweep of lows sets up a buy
input string {blockId}_of = "Previous Day High"; // Sweeps: Previous Day High, Previous Day Low, Session High, Session Low

bool Check_{blockId}() {
  string target = {blockId}_of;
  double currentHigh = iHigh(_Symbol, _Period, 0);
  double currentLow = iLow(_Symbol, _Period, 0);
  double pdh = iHigh(_Symbol, PERIOD_D1, 1);
  double pdl = iLow(_Symbol, PERIOD_D1, 1);

  if (target == "Previous Day High" || target == "Session High") {
    if (currentHigh > pdh) { Vote(-1); return true; }
    return false;
  }
  if (target == "Previous Day Low" || target == "Session Low") {
    if (currentLow < pdl) { Vote(1); return true; }
    return false;
  }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  pdh: {
    blockId: "pdh",
    code: `
// Prior Day Level
input string {blockId}_side = "Both"; // Level: High, Low, Both

bool Check_{blockId}() {
  double pdh = iHigh(_Symbol, PERIOD_D1, 1);
  double pdl = iLow(_Symbol, PERIOD_D1, 1);
  double currentPrice = iClose(_Symbol, _Period, 0);
  string side = {blockId}_side;

  if (side == "High") return (currentPrice >= pdh);
  if (side == "Low") return (currentPrice <= pdl);
  if (side == "Both") return (currentPrice >= pdh || currentPrice <= pdl);
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  fvg: {
    blockId: "fvg",
    code: `
// Fair Value Gap: a gap between candle 3's wick and candle 1's wick (candle 1 = last closed bar)
input double {blockId}_minSize = 5; // Minimum size (pips)
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  double minSize = {blockId}_minSize * StratoPip();
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 4) return false;

  double bullishGap = iLow(_Symbol, _Period, 1) - iHigh(_Symbol, _Period, 3);
  double bearishGap = iLow(_Symbol, _Period, 3) - iHigh(_Symbol, _Period, 1);

  if ((direction == "Bullish" || direction == "Either") && bullishGap >= minSize) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && bearishGap >= minSize) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  ob: {
    blockId: "ob",
    code: `
// Order Block: the last opposite candle before a strong move; price returning to it
input int {blockId}_lookback = 10; // Lookback (candles)

bool Check_{blockId}() {
  int lookback = {blockId}_lookback;
  if (Bars(_Symbol, _Period) < lookback + 3) return false;

  for (int i = 2; i < lookback + 2; i++) {
    double candleBody = MathAbs(iClose(_Symbol, _Period, i) - iOpen(_Symbol, _Period, i));
    double prevBody = MathAbs(iClose(_Symbol, _Period, i + 1) - iOpen(_Symbol, _Period, i + 1));
    if (candleBody > prevBody * 1.5) {
      double obHigh = iHigh(_Symbol, _Period, i + 1);
      double obLow = iLow(_Symbol, _Period, i + 1);
      double currentPrice = iClose(_Symbol, _Period, 0);
      if (currentPrice < obLow || currentPrice > obHigh) return false;
      // An up-move out of the block makes it a demand (buy) zone; a down-move, a supply (sell) zone.
      Vote(iClose(_Symbol, _Period, i) > iOpen(_Symbol, _Period, i) ? 1 : -1);
      return true;
    }
  }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  ma_cross: {
    blockId: "ma_cross",
    code: `
// MA Cross
input int {blockId}_fast = 9; // Fast period
input int {blockId}_slow = 21; // Slow period
input string {blockId}_type = "EMA"; // Type: EMA, SMA

bool Check_{blockId}() {
  int fast = {blockId}_fast;
  int slow = {blockId}_slow;
  ENUM_MA_METHOD method = ({blockId}_type == "EMA") ? MODE_EMA : MODE_SMA;
  if (Bars(_Symbol, _Period) < slow + 1) return false;

  static int fastHandle = INVALID_HANDLE;
  static int slowHandle = INVALID_HANDLE;
  if (fastHandle == INVALID_HANDLE) fastHandle = iMA(_Symbol, _Period, fast, 0, method, PRICE_CLOSE);
  if (slowHandle == INVALID_HANDLE) slowHandle = iMA(_Symbol, _Period, slow, 0, method, PRICE_CLOSE);
  if (fastHandle == INVALID_HANDLE || slowHandle == INVALID_HANDLE) return false;

  double fastBuf[], slowBuf[];
  ArraySetAsSeries(fastBuf, true);
  ArraySetAsSeries(slowBuf, true);
  if (CopyBuffer(fastHandle, 0, 0, 2, fastBuf) < 2) return false;
  if (CopyBuffer(slowHandle, 0, 0, 2, slowBuf) < 2) return false;

  if (fastBuf[1] <= slowBuf[1] && fastBuf[0] > slowBuf[0]) { Vote(1); return true; }
  if (fastBuf[1] >= slowBuf[1] && fastBuf[0] < slowBuf[0]) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  engulfing: {
    blockId: "engulfing",
    code: `
// Engulfing Candle
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 2) return false;

  double currentOpen = iOpen(_Symbol, _Period, 0);
  double currentClose = iClose(_Symbol, _Period, 0);
  double prevOpen = iOpen(_Symbol, _Period, 1);
  double prevClose = iClose(_Symbol, _Period, 1);

  bool isBullishEngulfing = (prevClose < prevOpen) && (currentClose > currentOpen) &&
                            (currentOpen <= prevClose) && (currentClose >= prevOpen);
  bool isBearishEngulfing = (prevClose > prevOpen) && (currentClose < currentOpen) &&
                            (currentOpen >= prevClose) && (currentClose <= prevOpen);

  if ((direction == "Bullish" || direction == "Either") && isBullishEngulfing) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && isBearishEngulfing) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  fib50: {
    blockId: "fib50",
    code: `
// Fib Retrace
input string {blockId}_level = "50%"; // Retrace level: 38.2%, 50%, 61.8%

bool Check_{blockId}() {
  string levelStr = {blockId}_level;
  double fibLevel = 0.5;
  if (levelStr == "38.2%") fibLevel = 0.382;
  if (levelStr == "61.8%") fibLevel = 0.618;
  if (Bars(_Symbol, _Period) < 10) return false;

  double highestHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 10, 0));
  double lowestLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 10, 0));
  double fibLevelPrice = highestHigh - (highestHigh - lowestLow) * fibLevel;
  double currentPrice = iClose(_Symbol, _Period, 0);

  return (MathAbs(currentPrice - fibLevelPrice) < 10 * StratoPip());
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  // VOLATILITY BLOCKS
  atr: {
    blockId: "atr",
    code: `
// ATR Filter
input int {blockId}_period = 14; // Period
input string {blockId}_condition = "Above average"; // Condition: Above average, Below average

bool Check_{blockId}() {
  int period = {blockId}_period;
  string condition = {blockId}_condition;
  if (Bars(_Symbol, _Period) < period * 3 + 1) return false;

  static int atrHandle = INVALID_HANDLE;
  static int atrLongHandle = INVALID_HANDLE;
  if (atrHandle == INVALID_HANDLE) atrHandle = iATR(_Symbol, _Period, period);
  if (atrLongHandle == INVALID_HANDLE) atrLongHandle = iATR(_Symbol, _Period, period * 3);
  if (atrHandle == INVALID_HANDLE || atrLongHandle == INVALID_HANDLE) return false;

  double atrBuf[], atrLongBuf[];
  ArraySetAsSeries(atrBuf, true);
  ArraySetAsSeries(atrLongBuf, true);
  if (CopyBuffer(atrHandle, 0, 0, 1, atrBuf) < 1) return false;
  if (CopyBuffer(atrLongHandle, 0, 0, 1, atrLongBuf) < 1) return false;

  if (condition == "Above average") return (atrBuf[0] > atrLongBuf[0]);
  if (condition == "Below average") return (atrBuf[0] < atrLongBuf[0]);
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  // INDICATOR BLOCKS
  rsi: {
    blockId: "rsi",
    code: `
// RSI Filter: oversold sets up a buy, overbought a sell
input int {blockId}_period = 14; // Period
input string {blockId}_condition = "Oversold (<30)"; // Condition: Overbought (>70), Oversold (<30)

bool Check_{blockId}() {
  int period = {blockId}_period;
  string condition = {blockId}_condition;
  if (Bars(_Symbol, _Period) < period + 1) return false;

  static int rsiHandle = INVALID_HANDLE;
  if (rsiHandle == INVALID_HANDLE) rsiHandle = iRSI(_Symbol, _Period, period, PRICE_CLOSE);
  if (rsiHandle == INVALID_HANDLE) return false;

  double rsiBuf[];
  ArraySetAsSeries(rsiBuf, true);
  if (CopyBuffer(rsiHandle, 0, 0, 1, rsiBuf) < 1) return false;

  if (condition == "Overbought (>70)" && rsiBuf[0] > 70) { Vote(-1); return true; }
  if (condition == "Oversold (<30)" && rsiBuf[0] < 30) { Vote(1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  macd: {
    blockId: "macd",
    code: `
// MACD Cross
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 26) return false;

  static int macdHandle = INVALID_HANDLE;
  if (macdHandle == INVALID_HANDLE) macdHandle = iMACD(_Symbol, _Period, 12, 26, 9, PRICE_CLOSE);
  if (macdHandle == INVALID_HANDLE) return false;

  double mainBuf[], signalBuf[];
  ArraySetAsSeries(mainBuf, true);
  ArraySetAsSeries(signalBuf, true);
  if (CopyBuffer(macdHandle, 0, 0, 2, mainBuf) < 2) return false;
  if (CopyBuffer(macdHandle, 1, 0, 2, signalBuf) < 2) return false;

  bool bullishCross = (mainBuf[1] <= signalBuf[1]) && (mainBuf[0] > signalBuf[0]);
  bool bearishCross = (mainBuf[1] >= signalBuf[1]) && (mainBuf[0] < signalBuf[0]);

  if ((direction == "Bullish" || direction == "Either") && bullishCross) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && bearishCross) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  bollinger: {
    blockId: "bollinger",
    code: `
// Bollinger Band: lower-band touch sets up a buy, upper-band touch a sell
input string {blockId}_touch = "Lower band"; // Reaction: Upper band, Lower band, Squeeze

bool Check_{blockId}() {
  string touch = {blockId}_touch;
  if (Bars(_Symbol, _Period) < 31) return false;

  static int bandsHandle = INVALID_HANDLE;
  if (bandsHandle == INVALID_HANDLE) bandsHandle = iBands(_Symbol, _Period, 20, 0, 2.0, PRICE_CLOSE);
  if (bandsHandle == INVALID_HANDLE) return false;

  double upperBuf[], lowerBuf[];
  ArraySetAsSeries(upperBuf, true);
  ArraySetAsSeries(lowerBuf, true);
  if (CopyBuffer(bandsHandle, 1, 0, 11, upperBuf) < 11) return false;
  if (CopyBuffer(bandsHandle, 2, 0, 11, lowerBuf) < 11) return false;

  double currentPrice = iClose(_Symbol, _Period, 0);
  bool isSqueeze = (upperBuf[0] - lowerBuf[0]) < (upperBuf[10] - lowerBuf[10]) * 0.7;

  if (touch == "Upper band" && currentPrice >= upperBuf[0]) { Vote(-1); return true; }
  if (touch == "Lower band" && currentPrice <= lowerBuf[0]) { Vote(1); return true; }
  if (touch == "Squeeze") return isSqueeze;
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  // LEVELS BLOCKS
  vwap: {
    blockId: "vwap",
    code: `
// VWAP: price above VWAP favors buys, below favors sells
input string {blockId}_condition = "Price above VWAP"; // Condition: Price above VWAP, Price below VWAP, VWAP reclaim

bool Check_{blockId}() {
  string condition = {blockId}_condition;
  if (Bars(_Symbol, _Period) < 50) return false;

  // Cumulative VWAP over the current trading day, using tick volume as a
  // volume proxy (real traded volume is rarely available for forex symbols).
  datetime dayStart = iTime(_Symbol, PERIOD_D1, 0);
  int barsToday = 0;
  for (int i = 0; i < 500; i++) {
    if (iTime(_Symbol, _Period, i) < dayStart) break;
    barsToday++;
  }
  if (barsToday < 2) return false;

  double sumPV = 0;
  double sumV = 0;
  for (int i = 0; i < barsToday; i++) {
    double typicalPrice = (iHigh(_Symbol, _Period, i) + iLow(_Symbol, _Period, i) + iClose(_Symbol, _Period, i)) / 3.0;
    double vol = (double)iTickVolume(_Symbol, _Period, i);
    sumPV += typicalPrice * vol;
    sumV += vol;
  }
  if (sumV <= 0) return false;
  double vwap = sumPV / sumV;

  double currentPrice = iClose(_Symbol, _Period, 0);
  double prevPrice = iClose(_Symbol, _Period, 1);

  if (condition == "Price above VWAP" && currentPrice > vwap) { Vote(1); return true; }
  if (condition == "Price below VWAP" && currentPrice < vwap) { Vote(-1); return true; }
  if (condition == "VWAP reclaim") {
    if (prevPrice < vwap && currentPrice > vwap) { Vote(1); return true; }
    if (prevPrice > vwap && currentPrice < vwap) { Vote(-1); return true; }
  }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  support_resistance: {
    blockId: "support_resistance",
    code: `
// Support / Resistance: reaction at support sets up a buy, at resistance a sell
input string {blockId}_side = "Either"; // Level: Support, Resistance, Either

bool Check_{blockId}() {
  string side = {blockId}_side;
  if (Bars(_Symbol, _Period) < 20) return false;

  double recentHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 20, 0));
  double recentLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 20, 0));
  double currentPrice = iClose(_Symbol, _Period, 0);
  double tolerance = 10 * StratoPip();

  if ((side == "Resistance" || side == "Either") && MathAbs(currentPrice - recentHigh) < tolerance) { Vote(-1); return true; }
  if ((side == "Support" || side == "Either") && MathAbs(currentPrice - recentLow) < tolerance) { Vote(1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  // ADDITIONAL STRUCTURE BLOCKS
  bos: {
    blockId: "bos",
    code: `
// Break of Structure
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 12) return false;

  double swingHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 10, 2));
  double swingLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 10, 2));
  double currentPrice = iClose(_Symbol, _Period, 0);

  if ((direction == "Bullish" || direction == "Either") && currentPrice > swingHigh) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && currentPrice < swingLow) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  breakout: {
    blockId: "breakout",
    code: `
// Breakout of the previous 20 closed candles' range
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 22) return false;

  // Range starts at bar 1: a range that included the current bar could never be broken by it.
  double rangeHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 20, 1));
  double rangeLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 20, 1));
  double currentPrice = iClose(_Symbol, _Period, 0);

  if ((direction == "Bullish" || direction == "Either") && currentPrice > rangeHigh) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && currentPrice < rangeLow) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  pin_bar: {
    blockId: "pin_bar",
    code: `
// Pin Bar
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 2) return false;

  double open = iOpen(_Symbol, _Period, 0);
  double close = iClose(_Symbol, _Period, 0);
  double high = iHigh(_Symbol, _Period, 0);
  double low = iLow(_Symbol, _Period, 0);
  double totalRange = high - low;
  if (totalRange <= 0) return false;

  double bodySize = MathAbs(close - open);
  double upperWick = high - MathMax(open, close);
  double lowerWick = MathMin(open, close) - low;
  bool isPinBar = bodySize < totalRange * 0.33 &&
                  (upperWick > totalRange * 0.6 || lowerWick > totalRange * 0.6);
  if (!isPinBar) return false;

  bool bullishPin = lowerWick > upperWick && close > open;
  bool bearishPin = upperWick > lowerWick && close < open;

  if ((direction == "Bullish" || direction == "Either") && bullishPin) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && bearishPin) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  divergence: {
    blockId: "divergence",
    code: `
// RSI Divergence
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  if (Bars(_Symbol, _Period) < 20) return false;

  static int rsiHandle = INVALID_HANDLE;
  if (rsiHandle == INVALID_HANDLE) rsiHandle = iRSI(_Symbol, _Period, 14, PRICE_CLOSE);
  if (rsiHandle == INVALID_HANDLE) return false;

  double rsiBuf[];
  ArraySetAsSeries(rsiBuf, true);
  if (CopyBuffer(rsiHandle, 0, 0, 6, rsiBuf) < 6) return false;

  double currentPrice = iClose(_Symbol, _Period, 0);
  double prevPrice = iClose(_Symbol, _Period, 5);
  bool bullishDivergence = (currentPrice < prevPrice) && (rsiBuf[0] > rsiBuf[5]);
  bool bearishDivergence = (currentPrice > prevPrice) && (rsiBuf[0] < rsiBuf[5]);

  if ((direction == "Bullish" || direction == "Either") && bullishDivergence) { Vote(1); return true; }
  if ((direction == "Bearish" || direction == "Either") && bearishDivergence) { Vote(-1); return true; }
  return false;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },

  // EXIT BLOCKS
  trailing_stop: {
    blockId: "trailing_stop",
    code: `
// Trailing Stop
input double {blockId}_distance = 30; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * StratoPip();
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    ulong ticket = PositionGetTicket(i);
    if (ticket == 0 || !PositionSelectByTicket(ticket) || !IsOwnPosition()) continue;

    double currentSL = PositionGetDouble(POSITION_SL);
    double tp = PositionGetDouble(POSITION_TP);
    // Move the stop only by at least a pip at a time, so the broker isn't sent a modify on every tick.
    if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
      double newSL = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID) - distance, _Digits);
      if (currentSL == 0 || newSL >= currentSL + StratoPip()) trade.PositionModify(ticket, newSL, tp);
    } else {
      double newSL = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK) + distance, _Digits);
      if (currentSL == 0 || newSL <= currentSL - StratoPip()) trade.PositionModify(ticket, newSL, tp);
    }
  }
}`,
    functions: ["Apply_{blockId}"],
    votes: false,
  },

  stop_loss: {
    blockId: "stop_loss",
    code: `
// Stop Loss: set when the trade opens; this re-applies it if a position is ever left without one
input double {blockId}_distance = 20; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * StratoPip();
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    ulong ticket = PositionGetTicket(i);
    if (ticket == 0 || !PositionSelectByTicket(ticket) || !IsOwnPosition()) continue;
    if (PositionGetDouble(POSITION_SL) != 0) continue;

    double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
    double newSL = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? openPrice - distance : openPrice + distance;
    trade.PositionModify(ticket, NormalizeDouble(newSL, _Digits), PositionGetDouble(POSITION_TP));
  }
}`,
    functions: ["Apply_{blockId}"],
    votes: false,
  },

  take_profit: {
    blockId: "take_profit",
    code: `
// Take Profit: set when the trade opens; this re-applies it if a position is ever left without one
input double {blockId}_distance = 40; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * StratoPip();
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    ulong ticket = PositionGetTicket(i);
    if (ticket == 0 || !PositionSelectByTicket(ticket) || !IsOwnPosition()) continue;
    if (PositionGetDouble(POSITION_TP) != 0) continue;

    double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
    double newTP = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? openPrice + distance : openPrice - distance;
    trade.PositionModify(ticket, PositionGetDouble(POSITION_SL), NormalizeDouble(newTP, _Digits));
  }
}`,
    functions: ["Apply_{blockId}"],
    votes: false,
  },

  break_even: {
    blockId: "break_even",
    code: `
// Break Even
input double {blockId}_trigger = 20; // Trigger (pips)

void Apply_{blockId}() {
  double trigger = {blockId}_trigger * StratoPip();
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    ulong ticket = PositionGetTicket(i);
    if (ticket == 0 || !PositionSelectByTicket(ticket) || !IsOwnPosition()) continue;

    double openPrice = NormalizeDouble(PositionGetDouble(POSITION_PRICE_OPEN), _Digits);
    double currentSL = PositionGetDouble(POSITION_SL);
    double tp = PositionGetDouble(POSITION_TP);
    if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
      double profit = SymbolInfoDouble(_Symbol, SYMBOL_BID) - openPrice;
      if (profit >= trigger && (currentSL == 0 || currentSL < openPrice)) trade.PositionModify(ticket, openPrice, tp);
    } else {
      double profit = openPrice - SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      if (profit >= trigger && (currentSL == 0 || currentSL > openPrice)) trade.PositionModify(ticket, openPrice, tp);
    }
  }
}`,
    functions: ["Apply_{blockId}"],
    votes: false,
  },

  position_size: {
    blockId: "position_size",
    code: `
// Position Size (applied by StratoLots() when each trade opens)
input double {blockId}_size = 1.0; // Size (lots)`,
    functions: [],
    votes: false,
  },

  // RISK BLOCKS
  risk_per_trade: {
    blockId: "risk_per_trade",
    code: `
// Risk Per Trade (applied by StratoLots(): sizes each trade so hitting the Stop Loss loses this % of balance)
input double {blockId}_percent = 1.0; // Risk (%)`,
    functions: [],
    votes: false,
  },

  risk_reward: {
    blockId: "risk_reward",
    code: `
// Risk : Reward (compares the Take Profit distance to the Stop Loss distance)
input string {blockId}_ratio = "1:2"; // Minimum ratio: 1:1, 1:2, 1:3, 2:1

bool Check_{blockId}() {
  string ratio = {blockId}_ratio;
  double minRatio = 2.0;
  if (ratio == "1:1") minRatio = 1.0;
  if (ratio == "1:3") minRatio = 3.0;
  if (ratio == "2:1") minRatio = 0.5;

  double slPips = StratoSLPips();
  double tpPips = StratoTPPips();
  if (slPips <= 0 || tpPips <= 0) return true; // Needs both; OnInit() explains this in the journal.
  if (tpPips / slPips + 1e-9 < minRatio) {
    StratoWarn("Risk:Reward rule blocked the trade: Take Profit / Stop Loss is below the minimum ratio " + ratio);
    return false;
  }
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  max_daily_loss: {
    blockId: "max_daily_loss",
    code: `
// Max Daily Loss: today's closed-trade result plus open P&L, across the whole account
input double {blockId}_percent = 3.0; // Limit (%)

bool Check_{blockId}() {
  double limitPercent = {blockId}_percent;
  MqlDateTime t;
  TimeToStruct(TimeCurrent(), t);
  t.hour = 0;
  t.min = 0;
  t.sec = 0;
  if (!HistorySelect(StructToTime(t), TimeCurrent())) return true;

  double realized = 0;
  for (int i = HistoryDealsTotal() - 1; i >= 0; i--) {
    ulong deal = HistoryDealGetTicket(i);
    if (deal == 0) continue;
    long dealType = HistoryDealGetInteger(deal, DEAL_TYPE);
    if (dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue; // skip deposits/withdrawals
    realized += HistoryDealGetDouble(deal, DEAL_PROFIT) + HistoryDealGetDouble(deal, DEAL_SWAP) +
                HistoryDealGetDouble(deal, DEAL_COMMISSION);
  }

  double startBalance = AccountInfoDouble(ACCOUNT_BALANCE) - realized;
  if (startBalance <= 0) return true;
  double todayPnL = realized + AccountInfoDouble(ACCOUNT_PROFIT);
  if (todayPnL <= -startBalance * limitPercent / 100.0) {
    StratoWarn("Max Daily Loss reached: no new trades until tomorrow (server time)");
    return false;
  }
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  // FILTERS
  news_filter: {
    blockId: "news_filter",
    code: `
// News Filter: no new trades from 30 minutes before to 30 minutes after a calendar event
// for either currency in this symbol. Uses MetaTrader's built-in economic calendar,
// which only exists in live/demo trading, not in the Strategy Tester.
input string {blockId}_mode = "Avoid high-impact news"; // Mode: Avoid high-impact news, Avoid all news

bool Check_{blockId}() {
  if (MQLInfoInteger(MQL_TESTER)) return true;
  bool highOnly = ({blockId}_mode == "Avoid high-impact news");
  datetime now = TimeTradeServer();
  string currencies[2];
  currencies[0] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_BASE);
  currencies[1] = SymbolInfoString(_Symbol, SYMBOL_CURRENCY_PROFIT);

  for (int c = 0; c < 2; c++) {
    if (currencies[c] == "") continue;
    MqlCalendarValue values[];
    if (CalendarValueHistory(values, now - 1800, now + 1800, NULL, currencies[c]) <= 0) continue;
    for (int i = 0; i < ArraySize(values); i++) {
      MqlCalendarEvent ev;
      if (!CalendarEventById(values[i].event_id, ev)) continue;
      if (ev.importance == CALENDAR_IMPORTANCE_NONE) continue;
      if (highOnly && ev.importance != CALENDAR_IMPORTANCE_HIGH) continue;
      StratoWarn("News Filter paused trading around: " + ev.name + " (" + currencies[c] + ")");
      return false;
    }
  }
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: false,
  },

  htf_confirmation: {
    blockId: "htf_confirmation",
    code: `
// Higher Timeframe Bias: price vs. the 20-period SMA on the higher timeframe.
// It votes like any directional block, so a trade against this bias is skipped.
input string {blockId}_timeframe = "4H"; // Timeframe: 4H, Daily, Weekly

bool Check_{blockId}() {
  string tf = {blockId}_timeframe;
  ENUM_TIMEFRAMES htf = PERIOD_H4;
  if (tf == "Daily") htf = PERIOD_D1;
  else if (tf == "Weekly") htf = PERIOD_W1;
  if (Bars(_Symbol, htf) < 21) return false;

  static int htfMAHandle = INVALID_HANDLE;
  if (htfMAHandle == INVALID_HANDLE) htfMAHandle = iMA(_Symbol, htf, 20, 0, MODE_SMA, PRICE_CLOSE);
  if (htfMAHandle == INVALID_HANDLE) return false;

  double htfMABuf[];
  ArraySetAsSeries(htfMABuf, true);
  if (CopyBuffer(htfMAHandle, 0, 0, 1, htfMABuf) < 1) return false;
  double htfPrice = iClose(_Symbol, htf, 0);

  if (htfPrice > htfMABuf[0]) Vote(1);
  else if (htfPrice < htfMABuf[0]) Vote(-1);
  return true;
}`,
    functions: ["Check_{blockId}"],
    votes: true,
  },
};

export function getMQL5Template(blockId: string): MQL5Template | undefined {
  return MQL5_TEMPLATES[blockId];
}

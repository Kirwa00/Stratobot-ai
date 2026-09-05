// MQL5 Code Templates for StratoBot AI
// Engineering Plan v1.2 §2 - Workstream A: Hand-written, pre-compiled, individually-tested block templates
// Each template represents a reusable MQL5 code block that can be assembled by the deterministic composer

export interface MQL5Template {
  blockId: string;
  code: string;
  inputs: string[];
  functions: string[];
  dependencies: string[];
}

export const MQL5_TEMPLATES: Record<string, MQL5Template> = {
  // TIMING BLOCKS
  killzone: {
    blockId: "killzone",
    code: `
// Killzone Filter
input string {blockId}_session = "London"; // Session: London, New York, Asia, London/NY Overlap

bool Check_{blockId}() {
  datetime currentTime = TimeCurrent();
  MqlDateTime timeStruct;
  TimeToStruct(currentTime, timeStruct);
  
  int hour = timeStruct.hour;
  string session = {blockId}_session;
  
  // London session: 8:00 - 17:00 GMT
  if (session == "London") {
    return (hour >= 8 && hour < 17);
  }
  // New York session: 13:00 - 22:00 GMT
  if (session == "New York") {
    return (hour >= 13 && hour < 22);
  }
  // Asia session: 23:00 - 8:00 GMT
  if (session == "Asia") {
    return (hour >= 23 || hour < 8);
  }
  // London/NY Overlap: 13:00 - 17:00 GMT
  if (session == "London/NY Overlap") {
    return (hour >= 13 && hour < 17);
  }
  
  return true; // Default to allow if session not recognized
}`,
    inputs: ["{blockId}_session"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // STRUCTURE BLOCKS
  sweep: {
    blockId: "sweep",
    code: `
// Sweep Filter
input string {blockId}_of = "Previous Day High"; // Sweeps: Previous Day High, Previous Day Low, Session High, Session Low

bool Check_{blockId}() {
  string target = {blockId}_of;
  double currentHigh = iHigh(_Symbol, _Period, 0);
  double currentLow = iLow(_Symbol, _Period, 0);
  
  // Get previous day high/low
  double pdh = iHigh(_Symbol, PERIOD_D1, 1);
  double pdl = iLow(_Symbol, PERIOD_D1, 1);
  
  // Get session high/low (simplified - using daily)
  double sessionHigh = pdh;
  double sessionLow = pdl;
  
  if (target == "Previous Day High" || target == "Previous Day High (PDH)") {
    return (currentHigh > pdh);
  }
  if (target == "Previous Day Low" || target == "Previous Day Low (PDL)") {
    return (currentLow < pdl);
  }
  if (target == "Session High") {
    return (currentHigh > sessionHigh);
  }
  if (target == "Session Low") {
    return (currentLow < sessionLow);
  }
  
  return false;
}`,
    inputs: ["{blockId}_of"],
    functions: ["Check_{blockId}"],
    dependencies: []
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
  
  if (side == "High") {
    return (currentPrice >= pdh);
  }
  if (side == "Low") {
    return (currentPrice <= pdl);
  }
  if (side == "Both") {
    return (currentPrice >= pdh || currentPrice <= pdl);
  }
  
  return false;
}`,
    inputs: ["{blockId}_side"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  fvg: {
    blockId: "fvg",
    code: `
// Fair Value Gap
input double {blockId}_minSize = 5; // Minimum size (pips)
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  double minSize = {blockId}_minSize * _Point;
  string direction = {blockId}_direction;
  
  // Check last 3 candles for FVG pattern
  if (Bars(_Symbol, _Period) < 3) return false;
  
  double candle1High = iHigh(_Symbol, _Period, 1);
  double candle1Low = iLow(_Symbol, _Period, 1);
  double candle2High = iHigh(_Symbol, _Period, 2);
  double candle2Low = iLow(_Symbol, _Period, 2);
  double candle3High = iHigh(_Symbol, _Period, 3);
  double candle3Low = iLow(_Symbol, _Period, 3);
  
  // Bullish FVG: candle2 low > candle3 high
  double bullishGap = candle2Low - candle3High;
  // Bearish FVG: candle2 high < candle3 low
  double bearishGap = candle3Low - candle2High;
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishGap >= minSize) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishGap >= minSize) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_minSize", "{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  ob: {
    blockId: "ob",
    code: `
// Order Block
input int {blockId}_lookback = 10; // Lookback (candles)

bool Check_{blockId}() {
  int lookback = {blockId}_lookback;
  
  if (Bars(_Symbol, _Period) < lookback + 2) return false;
  
  // Find the last strong move
  for (int i = 2; i < lookback + 2; i++) {
    double candleBody = MathAbs(iClose(_Symbol, _Period, i) - iOpen(_Symbol, _Period, i));
    double prevBody = MathAbs(iClose(_Symbol, _Period, i+1) - iOpen(_Symbol, _Period, i+1));
    
    // Strong move: current candle body significantly larger than previous
    if (candleBody > prevBody * 1.5) {
      // The opposite candle before the strong move is the order block
      double obHigh = iHigh(_Symbol, _Period, i+1);
      double obLow = iLow(_Symbol, _Period, i+1);
      double currentPrice = iClose(_Symbol, _Period, 0);
      
      // Check if price is back at the order block level
      return (currentPrice >= obLow && currentPrice <= obHigh);
    }
  }
  
  return false;
}`,
    inputs: ["{blockId}_lookback"],
    functions: ["Check_{blockId}"],
    dependencies: []
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
  string type = {blockId}_type;
  ENUM_MA_METHOD method = (type == "EMA") ? MODE_EMA : MODE_SMA;

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

  double fastMA_now = fastBuf[0], fastMA_prev = fastBuf[1];
  double slowMA_now = slowBuf[0], slowMA_prev = slowBuf[1];

  // Bullish cross: fast MA crosses above slow MA
  if (fastMA_prev <= slowMA_prev && fastMA_now > slowMA_now) return true;
  // Bearish cross: fast MA crosses below slow MA
  if (fastMA_prev >= slowMA_prev && fastMA_now < slowMA_now) return true;

  return false;
}`,
    inputs: ["{blockId}_fast", "{blockId}_slow", "{blockId}_type"],
    functions: ["Check_{blockId}"],
    dependencies: []
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
  double currentHigh = iHigh(_Symbol, _Period, 0);
  double currentLow = iLow(_Symbol, _Period, 0);
  
  double prevOpen = iOpen(_Symbol, _Period, 1);
  double prevClose = iClose(_Symbol, _Period, 1);
  double prevHigh = iHigh(_Symbol, _Period, 1);
  double prevLow = iLow(_Symbol, _Period, 1);
  
  bool isBullishEngulfing = (prevClose < prevOpen) && // Previous candle is bearish
                            (currentClose > currentOpen) && // Current candle is bullish
                            (currentOpen <= prevClose) && // Current opens below/at previous close
                            (currentClose >= prevOpen); // Current closes above/at previous open
                            
  bool isBearishEngulfing = (prevClose > prevOpen) && // Previous candle is bullish
                            (currentClose < currentOpen) && // Current candle is bearish
                            (currentOpen >= prevClose) && // Current opens above/at previous close
                            (currentClose <= prevOpen); // Current closes below/at previous open
  
  if (direction == "Bullish" || direction == "Either") {
    if (isBullishEngulfing) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (isBearishEngulfing) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  fib50: {
    blockId: "fib50",
    code: `
// Fib 50% Retrace
input string {blockId}_level = "50%"; // Retrace level: 38.2%, 50%, 61.8%

bool Check_{blockId}() {
  string levelStr = {blockId}_level;
  double fibLevel = 0.5; // Default 50%
  
  if (levelStr == "38.2%") fibLevel = 0.382;
  if (levelStr == "61.8%") fibLevel = 0.618;
  
  if (Bars(_Symbol, _Period) < 10) return false;
  
  // Find recent swing high and low (simplified)
  double highestHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 10, 0));
  double lowestLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 10, 0));
  
  double fibLevelPrice = highestHigh - (highestHigh - lowestLow) * fibLevel;
  double currentPrice = iClose(_Symbol, _Period, 0);
  
  // Check if price is near the fib level (within 10 pips)
  double tolerance = 10 * _Point;
  return (MathAbs(currentPrice - fibLevelPrice) < tolerance);
}`,
    inputs: ["{blockId}_level"],
    functions: ["Check_{blockId}"],
    dependencies: []
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

  double currentATR = atrBuf[0];
  double averageATR = atrLongBuf[0]; // Longer-period ATR used as a smoother baseline

  if (condition == "Above average") {
    return (currentATR > averageATR);
  }
  if (condition == "Below average") {
    return (currentATR < averageATR);
  }

  return true;
}`,
    inputs: ["{blockId}_period", "{blockId}_condition"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // INDICATOR BLOCKS
  rsi: {
    blockId: "rsi",
    code: `
// RSI Filter
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
  double currentRSI = rsiBuf[0];

  if (condition == "Overbought (>70)") {
    return (currentRSI > 70);
  }
  if (condition == "Oversold (<30)") {
    return (currentRSI < 30);
  }

  return false;
}`,
    inputs: ["{blockId}_period", "{blockId}_condition"],
    functions: ["Check_{blockId}"],
    dependencies: []
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

  double macdMain = mainBuf[0], macdMainPrev = mainBuf[1];
  double macdSignal = signalBuf[0], macdSignalPrev = signalBuf[1];

  // Bullish crossover: MACD line crosses above signal line
  bool bullishCross = (macdMainPrev <= macdSignalPrev) && (macdMain > macdSignal);
  // Bearish crossover: MACD line crosses below signal line
  bool bearishCross = (macdMainPrev >= macdSignalPrev) && (macdMain < macdSignal);
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishCross) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishCross) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  bollinger: {
    blockId: "bollinger",
    code: `
// Bollinger Band
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

  double upperBand = upperBuf[0];
  double lowerBand = lowerBuf[0];
  double currentPrice = iClose(_Symbol, _Period, 0);

  // Check for squeeze (bands narrowing) vs. 10 bars ago
  double upperBandPrev = upperBuf[10];
  double lowerBandPrev = lowerBuf[10];
  double currentBandWidth = upperBand - lowerBand;
  double prevBandWidth = upperBandPrev - lowerBandPrev;
  bool isSqueeze = currentBandWidth < prevBandWidth * 0.7;
  
  if (touch == "Upper band") {
    return (currentPrice >= upperBand);
  }
  if (touch == "Lower band") {
    return (currentPrice <= lowerBand);
  }
  if (touch == "Squeeze") {
    return isSqueeze;
  }
  
  return false;
}`,
    inputs: ["{blockId}_touch"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // LEVELS BLOCKS
  vwap: {
    blockId: "vwap",
    code: `
// VWAP
input string {blockId}_condition = "Price above VWAP"; // Condition: Price above VWAP, Price below VWAP, VWAP reclaim

bool Check_{blockId}() {
  string condition = {blockId}_condition;

  if (Bars(_Symbol, _Period) < 50) return false;

  // Cumulative VWAP over the current trading day, using tick volume as a
  // volume proxy (real traded volume is rarely available for forex symbols).
  // MQL5 has no built-in iVWAP, so this walks the day's bars directly.
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

  if (condition == "Price above VWAP") {
    return (currentPrice > vwap);
  }
  if (condition == "Price below VWAP") {
    return (currentPrice < vwap);
  }
  if (condition == "VWAP reclaim") {
    return (prevPrice < vwap && currentPrice > vwap) || (prevPrice > vwap && currentPrice < vwap);
  }
  
  return false;
}`,
    inputs: ["{blockId}_condition"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  support_resistance: {
    blockId: "support_resistance",
    code: `
// Support / Resistance
input string {blockId}_side = "Either"; // Level: Support, Resistance, Either

bool Check_{blockId}() {
  string side = {blockId}_side;
  
  if (Bars(_Symbol, _Period) < 20) return false;
  
  // Find recent highs and lows
  double recentHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 20, 0));
  double recentLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 20, 0));
  double currentPrice = iClose(_Symbol, _Period, 0);
  
  // Check if price is at support or resistance (within 10 pips)
  double tolerance = 10 * _Point;
  
  if (side == "Resistance" || side == "Either") {
    if (MathAbs(currentPrice - recentHigh) < tolerance) return true;
  }
  if (side == "Support" || side == "Either") {
    if (MathAbs(currentPrice - recentLow) < tolerance) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_side"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // ADDITIONAL STRUCTURE BLOCKS
  bos: {
    blockId: "bos",
    code: `
// Break of Structure
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  
  if (Bars(_Symbol, _Period) < 5) return false;
  
  // Find recent swing high/low
  double swingHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 10, 2));
  double swingLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 10, 2));
  double currentPrice = iClose(_Symbol, _Period, 0);
  
  bool bullishBOS = currentPrice > swingHigh;
  bool bearishBOS = currentPrice < swingLow;
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishBOS) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishBOS) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  breakout: {
    blockId: "breakout",
    code: `
// Breakout
input string {blockId}_direction = "Either"; // Direction: Bullish, Bearish, Either

bool Check_{blockId}() {
  string direction = {blockId}_direction;
  
  if (Bars(_Symbol, _Period) < 20) return false;
  
  // Find range boundaries
  double rangeHigh = iHigh(_Symbol, _Period, iHighest(_Symbol, _Period, MODE_HIGH, 20, 0));
  double rangeLow = iLow(_Symbol, _Period, iLowest(_Symbol, _Period, MODE_LOW, 20, 0));
  double currentPrice = iClose(_Symbol, _Period, 0);
  
  bool bullishBreakout = currentPrice > rangeHigh;
  bool bearishBreakout = currentPrice < rangeLow;
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishBreakout) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishBreakout) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
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
  
  double bodySize = MathAbs(close - open);
  double upperWick = high - MathMax(open, close);
  double lowerWick = MathMin(open, close) - low;
  double totalRange = high - low;
  
  // Pin bar has small body and long wick (at least 2/3 of total range)
  bool isPinBar = bodySize < totalRange * 0.33 && 
                   (upperWick > totalRange * 0.6 || lowerWick > totalRange * 0.6);
  
  if (!isPinBar) return false;
  
  bool bullishPin = lowerWick > upperWick && close > open;
  bool bearishPin = upperWick > lowerWick && close < open;
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishPin) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishPin) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  divergence: {
    blockId: "divergence",
    code: `
// Divergence
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

  // Check for RSI divergence (simplified)
  double currentRSI = rsiBuf[0];
  double prevRSI = rsiBuf[5];
  double currentPrice = iClose(_Symbol, _Period, 0);
  double prevPrice = iClose(_Symbol, _Period, 5);

  bool bullishDivergence = (currentPrice < prevPrice) && (currentRSI > prevRSI);
  bool bearishDivergence = (currentPrice > prevPrice) && (currentRSI < prevRSI);
  
  if (direction == "Bullish" || direction == "Either") {
    if (bullishDivergence) return true;
  }
  if (direction == "Bearish" || direction == "Either") {
    if (bearishDivergence) return true;
  }
  
  return false;
}`,
    inputs: ["{blockId}_direction"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // EXIT BLOCKS
  trailing_stop: {
    blockId: "trailing_stop",
    code: `
// Trailing Stop
input double {blockId}_distance = 30; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * _Point;
  
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    if (PositionSelectByTicket(PositionGetTicket(i))) {
      if (PositionGetString(POSITION_SYMBOL) == _Symbol) {
        double currentSL = PositionGetDouble(POSITION_SL);
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentPrice = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? 
                              SymbolInfoDouble(_Symbol, SYMBOL_BID) : 
                              SymbolInfoDouble(_Symbol, SYMBOL_ASK);
        
        double newSL;
        if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
          newSL = currentPrice - distance;
          if (newSL > currentSL) {
            trade.PositionModify(PositionGetTicket(i), newSL, PositionGetDouble(POSITION_TP));
          }
        } else {
          newSL = currentPrice + distance;
          if (newSL < currentSL || currentSL == 0) {
            trade.PositionModify(PositionGetTicket(i), newSL, PositionGetDouble(POSITION_TP));
          }
        }
      }
    }
  }
}`,
    inputs: ["{blockId}_distance"],
    functions: ["Apply_{blockId}"],
    dependencies: ["CTrade"]
  },

  stop_loss: {
    blockId: "stop_loss",
    code: `
// Stop Loss
input double {blockId}_distance = 20; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * _Point;
  
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    if (PositionSelectByTicket(PositionGetTicket(i))) {
      if (PositionGetString(POSITION_SYMBOL) == _Symbol) {
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentSL = PositionGetDouble(POSITION_SL);
        
        if (currentSL == 0) {
          double newSL;
          if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
            newSL = openPrice - distance;
          } else {
            newSL = openPrice + distance;
          }
          trade.PositionModify(PositionGetTicket(i), newSL, PositionGetDouble(POSITION_TP));
        }
      }
    }
  }
}`,
    inputs: ["{blockId}_distance"],
    functions: ["Apply_{blockId}"],
    dependencies: ["CTrade"]
  },

  take_profit: {
    blockId: "take_profit",
    code: `
// Take Profit
input double {blockId}_distance = 40; // Distance (pips)

void Apply_{blockId}() {
  double distance = {blockId}_distance * _Point;
  
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    if (PositionSelectByTicket(PositionGetTicket(i))) {
      if (PositionGetString(POSITION_SYMBOL) == _Symbol) {
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentTP = PositionGetDouble(POSITION_TP);
        
        if (currentTP == 0) {
          double newTP;
          if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
            newTP = openPrice + distance;
          } else {
            newTP = openPrice - distance;
          }
          trade.PositionModify(PositionGetTicket(i), PositionGetDouble(POSITION_SL), newTP);
        }
      }
    }
  }
}`,
    inputs: ["{blockId}_distance"],
    functions: ["Apply_{blockId}"],
    dependencies: ["CTrade"]
  },

  break_even: {
    blockId: "break_even",
    code: `
// Break Even
input double {blockId}_trigger = 20; // Trigger (pips)

void Apply_{blockId}() {
  double trigger = {blockId}_trigger * _Point;
  
  for (int i = PositionsTotal() - 1; i >= 0; i--) {
    if (PositionSelectByTicket(PositionGetTicket(i))) {
      if (PositionGetString(POSITION_SYMBOL) == _Symbol) {
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double currentSL = PositionGetDouble(POSITION_SL);
        double currentPrice = PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? 
                              SymbolInfoDouble(_Symbol, SYMBOL_BID) : 
                              SymbolInfoDouble(_Symbol, SYMBOL_ASK);
        
        double profit;
        if (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
          profit = currentPrice - openPrice;
          if (profit >= trigger && currentSL < openPrice) {
            trade.PositionModify(PositionGetTicket(i), openPrice, PositionGetDouble(POSITION_TP));
          }
        } else {
          profit = openPrice - currentPrice;
          if (profit >= trigger && (currentSL > openPrice || currentSL == 0)) {
            trade.PositionModify(PositionGetTicket(i), openPrice, PositionGetDouble(POSITION_TP));
          }
        }
      }
    }
  }
}`,
    inputs: ["{blockId}_trigger"],
    functions: ["Apply_{blockId}"],
    dependencies: ["CTrade"]
  },

  position_size: {
    blockId: "position_size",
    code: `
// Position Size
input double {blockId}_size = 1.0; // Size (lots)

void Apply_{blockId}() {
  double size = {blockId}_size;
  // This is applied during order opening, not modification
  // Store the size for use in entry logic
  GlobalVariableSet("stratobot_position_size", size);
}`,
    inputs: ["{blockId}_size"],
    functions: ["Apply_{blockId}"],
    dependencies: []
  },

  // RISK BLOCKS
  risk_per_trade: {
    blockId: "risk_per_trade",
    code: `
// Risk Per Trade
input double {blockId}_percent = 1.0; // Risk (%)

bool Check_{blockId}() {
  double riskPercent = {blockId}_percent;
  double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
  double riskAmount = accountBalance * (riskPercent / 100.0);
  
  // Calculate position size based on risk (simplified)
  GlobalVariableSet("stratobot_risk_amount", riskAmount);
  GlobalVariableSet("stratobot_risk_percent", riskPercent);
  
  return true;
}`,
    inputs: ["{blockId}_percent"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  risk_reward: {
    blockId: "risk_reward",
    code: `
// Risk : Reward
input string {blockId}_ratio = "1:2"; // Minimum ratio

bool Check_{blockId}() {
  string ratio = {blockId}_ratio;
  
  // Parse ratio (simplified)
  double minRatio = 2.0; // Default 1:2
  if (ratio == "1:1") minRatio = 1.0;
  if (ratio == "1:3") minRatio = 3.0;
  if (ratio == "2:1") minRatio = 0.5;
  
  GlobalVariableSet("stratobot_min_rr_ratio", minRatio);
  
  return true;
}`,
    inputs: ["{blockId}_ratio"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  max_daily_loss: {
    blockId: "max_daily_loss",
    code: `
// Max Daily Loss
input double {blockId}_percent = 3.0; // Limit (%)

bool Check_{blockId}() {
  double maxLossPercent = {blockId}_percent;
  double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
  double dailyProfit = AccountInfoDouble(ACCOUNT_PROFIT);
  
  double maxLossAmount = accountBalance * (maxLossPercent / 100.0);
  
  // Check if daily loss exceeds limit
  if (dailyProfit < -maxLossAmount) {
    return false; // Stop trading for the day
  }
  
  return true;
}`,
    inputs: ["{blockId}_percent"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  // FILTERS
  news_filter: {
    blockId: "news_filter",
    code: `
// News Filter
input string {blockId}_mode = "Avoid high-impact news"; // Mode: Avoid high-impact news, Avoid all news

bool Check_{blockId}() {
  string mode = {blockId}_mode;
  
  // In production, this would integrate with an economic calendar API
  // For now, it's a placeholder that returns true
  // The actual implementation would check for upcoming news events
  
  if (mode == "Avoid high-impact news") {
    // Check if high-impact news is within 30 minutes
    // Placeholder: return true for now
    return true;
  }
  if (mode == "Avoid all news") {
    // Check if any news is within 30 minutes
    // Placeholder: return true for now
    return true;
  }
  
  return true;
}`,
    inputs: ["{blockId}_mode"],
    functions: ["Check_{blockId}"],
    dependencies: []
  },

  htf_confirmation: {
    blockId: "htf_confirmation",
    code: `
// Higher Timeframe Bias
input string {blockId}_timeframe = "4H"; // Timeframe: 4H, Daily, Weekly

bool Check_{blockId}() {
  string tf = {blockId}_timeframe;
  
  ENUM_TIMEFRAMES htf;
  if (tf == "4H") htf = PERIOD_H4;
  else if (tf == "Daily") htf = PERIOD_D1;
  else if (tf == "Weekly") htf = PERIOD_W1;
  else htf = PERIOD_H4;

  if (Bars(_Symbol, htf) < 21) return false;

  // Get higher timeframe trend (simplified using MA)
  static int htfMAHandle = INVALID_HANDLE;
  if (htfMAHandle == INVALID_HANDLE) htfMAHandle = iMA(_Symbol, htf, 20, 0, MODE_SMA, PRICE_CLOSE);
  if (htfMAHandle == INVALID_HANDLE) return false;

  double htfMABuf[];
  ArraySetAsSeries(htfMABuf, true);
  if (CopyBuffer(htfMAHandle, 0, 0, 1, htfMABuf) < 1) return false;
  double htfMA = htfMABuf[0];
  double htfPrice = iClose(_Symbol, htf, 0);

  // Determine bias
  bool bullishBias = htfPrice > htfMA;
  bool bearishBias = htfPrice < htfMA;
  
  // Store bias for use in entry logic
  GlobalVariableSet("stratobot_htf_bullish", bullishBias ? 1 : 0);
  
  return true;
}`,
    inputs: ["{blockId}_timeframe"],
    functions: ["Check_{blockId}"],
    dependencies: []
  }
};

export function getMQL5Template(blockId: string): MQL5Template | undefined {
  return MQL5_TEMPLATES[blockId];
}

export function getAllMQL5Templates(): MQL5Template[] {
  return Object.values(MQL5_TEMPLATES);
}
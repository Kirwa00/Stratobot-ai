// Indicator series computed the way MetaTrader 5's built-in indicators compute
// them (iMA, iRSI, iATR, iMACD, iBands), so the interpreter and a compiled EA
// agree. Inputs and outputs are oldest-first; NaN where MT5 has no value yet.
// Seeds (e.g. EMA starting from the first price) differ from MT5 only by how
// much history each side has, which decays away; the differential test skips
// a warm-up period for that reason.
//
// MT5 specifics that differ from textbook definitions:
// - iATR is a simple moving average of true range, not Wilder smoothing.
// - iMACD's signal line is a simple moving average of the main line.
// - iBands uses the population standard deviation.

export function sma(src: number[], period: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    sum += src[i];
    if (i >= period) sum -= src[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(src: number[], period: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  if (src.length === 0) return out;
  const k = 2 / (period + 1);
  out[0] = src[0];
  for (let i = 1; i < src.length; i++) out[i] = src[i] * k + out[i - 1] * (1 - k);
  return out;
}

export function smma(src: number[], period: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  if (src.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += src[i];
  out[period - 1] = sum / period;
  for (let i = period; i < src.length; i++) out[i] = (out[i - 1] * (period - 1) + src[i]) / period;
  return out;
}

export function lwma(src: number[], period: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  const weightSum = (period * (period + 1)) / 2;
  for (let i = period - 1; i < src.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += src[i - j] * (period - j);
    out[i] = sum / weightSum;
  }
  return out;
}

export function rsi(close: number[], period: number): number[] {
  const out = new Array<number>(close.length).fill(NaN);
  if (close.length <= period) return out;
  let pos = 0;
  let neg = 0;
  for (let i = 1; i <= period; i++) {
    const d = close[i] - close[i - 1];
    pos += d > 0 ? d : 0;
    neg += d < 0 ? -d : 0;
  }
  pos /= period;
  neg /= period;
  const value = () => (neg !== 0 ? 100 - 100 / (1 + pos / neg) : pos !== 0 ? 100 : 50);
  out[period] = value();
  for (let i = period + 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    pos = (pos * (period - 1) + (d > 0 ? d : 0)) / period;
    neg = (neg * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = value();
  }
  return out;
}

export function atr(high: number[], low: number[], close: number[], period: number): number[] {
  const out = new Array<number>(close.length).fill(NaN);
  const tr = close.map((_, i) =>
    i === 0 ? 0 : Math.max(high[i], close[i - 1]) - Math.min(low[i], close[i - 1])
  );
  let sum = 0;
  for (let i = 1; i < close.length; i++) {
    sum += tr[i];
    if (i > period) sum -= tr[i - period];
    if (i >= period) out[i] = sum / period;
  }
  return out;
}

export function macd(
  close: number[],
  fast: number,
  slow: number,
  signal: number
): { main: number[]; signal: number[] } {
  const f = ema(close, fast);
  const s = ema(close, slow);
  const main = close.map((_, i) => f[i] - s[i]);
  return { main, signal: sma(main, signal) };
}

export function bands(
  close: number[],
  period: number,
  deviation: number
): { middle: number[]; upper: number[]; lower: number[] } {
  const middle = sma(close, period);
  const upper = new Array<number>(close.length).fill(NaN);
  const lower = new Array<number>(close.length).fill(NaN);
  for (let i = period - 1; i < close.length; i++) {
    let sq = 0;
    for (let j = 0; j < period; j++) sq += (close[i - j] - middle[i]) ** 2;
    const sd = Math.sqrt(sq / period);
    upper[i] = middle[i] + deviation * sd;
    lower[i] = middle[i] - deviation * sd;
  }
  return { middle, upper, lower };
}

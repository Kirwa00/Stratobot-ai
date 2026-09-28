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

/** Population standard deviation around the SMA (iStdDev with MODE_SMA). */
export function stddev(src: number[], period: number): number[] {
  const mid = sma(src, period);
  const out = new Array<number>(src.length).fill(NaN);
  for (let i = period - 1; i < src.length; i++) {
    let sq = 0;
    for (let j = 0; j < period; j++) sq += (src[i - j] - mid[i]) ** 2;
    out[i] = Math.sqrt(sq / period);
  }
  return out;
}

export function stochastic(
  high: number[],
  low: number[],
  close: number[],
  k: number,
  d: number,
  slowing: number
): { main: number[]; signal: number[] } {
  const n = close.length;
  const lowest = new Array<number>(n).fill(NaN);
  const highest = new Array<number>(n).fill(NaN);
  for (let i = k - 1; i < n; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = i - k + 1; j <= i; j++) {
      lo = Math.min(lo, low[j]);
      hi = Math.max(hi, high[j]);
    }
    lowest[i] = lo;
    highest[i] = hi;
  }
  const main = new Array<number>(n).fill(NaN);
  for (let i = k - 1 + slowing - 1; i < n; i++) {
    let sumLow = 0;
    let sumHigh = 0;
    for (let j = i - slowing + 1; j <= i; j++) {
      sumLow += close[j] - lowest[j];
      sumHigh += highest[j] - lowest[j];
    }
    main[i] = sumHigh === 0 ? 100 : (sumLow / sumHigh) * 100;
  }
  const signal = new Array<number>(n).fill(NaN);
  for (let i = k - 1 + slowing - 1 + d - 1; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < d; j++) sum += main[i - j];
    signal[i] = sum / d;
  }
  return { main, signal };
}

export function cci(src: number[], period: number): number[] {
  const mid = sma(src, period);
  const out = new Array<number>(src.length).fill(NaN);
  for (let i = period - 1; i < src.length; i++) {
    let dev = 0;
    for (let j = 0; j < period; j++) dev += Math.abs(src[i - j] - mid[i]);
    const d = dev * (0.015 / period);
    out[i] = d !== 0 ? (src[i] - mid[i]) / d : 0;
  }
  return out;
}

export function momentum(src: number[], period: number): number[] {
  return src.map((v, i) => (i >= period ? (v * 100) / src[i - period] : NaN));
}

/** Williams %R; a flat range repeats the previous value, as MT5's WPR does. */
export function wpr(high: number[], low: number[], close: number[], period: number): number[] {
  const out = new Array<number>(close.length).fill(NaN);
  for (let i = period - 1; i < close.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      hi = Math.max(hi, high[j]);
      lo = Math.min(lo, low[j]);
    }
    out[i] = hi !== lo ? (-(hi - close[i]) * 100) / (hi - lo) : i > 0 && !Number.isNaN(out[i - 1]) ? out[i - 1] : 0;
  }
  return out;
}

/** MT5's ADX: directional movement smoothed with an EMA (2 / (period + 1)), not Wilder's. */
export function adx(
  high: number[],
  low: number[],
  close: number[],
  period: number
): { adx: number[]; plus_di: number[]; minus_di: number[] } {
  const n = close.length;
  const k = 2 / (period + 1);
  const pdi = new Array<number>(n).fill(0);
  const ndi = new Array<number>(n).fill(0);
  const adxLine = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    let up = high[i] - high[i - 1];
    let down = low[i - 1] - low[i];
    if (up < 0) up = 0;
    if (down < 0) down = 0;
    if (up > down) down = 0;
    else if (up < down) up = 0;
    else {
      up = 0;
      down = 0;
    }
    const tr = Math.max(Math.abs(high[i] - low[i]), Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1]));
    const pd = tr !== 0 ? (100 * up) / tr : 0;
    const nd = tr !== 0 ? (100 * down) / tr : 0;
    pdi[i] = pd * k + pdi[i - 1] * (1 - k);
    ndi[i] = nd * k + ndi[i - 1] * (1 - k);
    const sum = pdi[i] + ndi[i];
    const dx = sum !== 0 ? 100 * Math.abs((pdi[i] - ndi[i]) / sum) : 0;
    adxLine[i] = dx * k + adxLine[i - 1] * (1 - k);
  }
  return { adx: adxLine, plus_di: pdi, minus_di: ndi };
}

export function demarker(high: number[], low: number[], period: number): number[] {
  const deMax = high.map((h, i) => (i > 0 && h > high[i - 1] ? h - high[i - 1] : 0));
  const deMin = low.map((l, i) => (i > 0 && l < low[i - 1] ? low[i - 1] - l : 0));
  const aMax = sma(deMax, period);
  const aMin = sma(deMin, period);
  return aMax.map((mx, i) => {
    const den = mx + aMin[i];
    return Number.isNaN(den) ? NaN : den !== 0 ? mx / den : 0;
  });
}

/** Bars of history each Parabolic SAR value is computed from (both here and in the compiled EA). */
export const SAR_WINDOW = 500;

/**
 * Parabolic SAR computed from closed bars only: each value runs MT5's
 * ParabolicSAR state machine over the SAR_WINDOW bars ending at that bar.
 * MT5's built-in iSAR re-processes the forming bar on every tick with global
 * state, so its values depend on the intrabar tick path; the compiled EA uses
 * this same closed-bar calculation instead, so both sides agree exactly.
 */
export function sar(high: number[], low: number[], step: number, maximum: number): number[] {
  const out = new Array<number>(high.length).fill(NaN);
  for (let end = SAR_WINDOW - 1; end < high.length; end++) {
    out[end] = sarWindow(high.slice(end - SAR_WINDOW + 1, end + 1), low.slice(end - SAR_WINDOW + 1, end + 1), step, maximum);
  }
  return out;
}

/** SAR of the last bar in the window (oldest-first arrays), reversal on that bar included. */
function sarWindow(high: number[], low: number[], step: number, maximum: number): number {
  const n = high.length;
  const out = new Array<number>(n).fill(NaN);
  const af = new Array<number>(n).fill(0);
  const ep = new Array<number>(n).fill(0);
  let long = false;
  let lastRev = 0;
  out[0] = high[0];
  af[0] = step;
  ep[0] = low[0];
  const highestSince = (from: number, to: number) => {
    let h = -Infinity;
    for (let j = from; j <= to; j++) h = Math.max(h, high[j]);
    return h;
  };
  const lowestSince = (from: number, to: number) => {
    let l = Infinity;
    for (let j = from; j <= to; j++) l = Math.min(l, low[j]);
    return l;
  };
  for (let i = 1; i < n; i++) {
    if (Number.isNaN(out[i])) out[i] = out[i - 1];
    // On a reversal SAR jumps to the prior trend's extreme, from the last reversal up to (not including) this bar.
    if (long && out[i] > low[i]) {
      long = false;
      out[i] = highestSince(lastRev, i - 1);
      ep[i] = low[i];
      lastRev = i;
      af[i] = step;
    } else if (!long && out[i] < high[i]) {
      long = true;
      out[i] = lowestSince(lastRev, i - 1);
      ep[i] = high[i];
      lastRev = i;
      af[i] = step;
    }
    if (long) {
      if (high[i] > ep[i - 1] && i !== lastRev) {
        ep[i] = high[i];
        af[i] = Math.min(af[i - 1] + step, maximum);
      } else if (i !== lastRev) {
        af[i] = af[i - 1];
        ep[i] = ep[i - 1];
      }
      if (i + 1 < n) {
        out[i + 1] = out[i] + af[i] * (ep[i] - out[i]);
        if (out[i + 1] > low[i] || out[i + 1] > low[i - 1]) out[i + 1] = Math.min(low[i], low[i - 1]);
      }
    } else {
      if (low[i] < ep[i - 1] && i !== lastRev) {
        ep[i] = low[i];
        af[i] = Math.min(af[i - 1] + step, maximum);
      } else if (i !== lastRev) {
        af[i] = af[i - 1];
        ep[i] = ep[i - 1];
      }
      if (i + 1 < n) {
        out[i + 1] = out[i] + af[i] * (ep[i] - out[i]);
        if (out[i + 1] < high[i] || out[i + 1] < high[i - 1]) out[i + 1] = Math.max(high[i], high[i - 1]);
      }
    }
  }
  return out[n - 1];
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

import * as ind from "./indicators";
import { buildNodeTable, stableKey, type NodeTable } from "./nodes";
import type { Condition, Field, RuleStrategy, Session, Timeframe, Value } from "./types";

// Reference implementation of the rule language (see types.ts for semantics).
// Every index calculation mirrors the MQL5 the compiler emits:
//   MQL5:  idx = iBarShift(tf, T(k)) + 1 + shift        (series counted newest-first)
//   here:  idx = containing(tf, T(k)) - 1 - shift       (arrays oldest-first)
// where T(k) is the open time of the chart bar that opened k bars before the decision.

export interface Candle {
  /** Bar open time, seconds, in broker server time (as MT5 reports it). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  tickVolume: number;
}

export interface InterpretOptions {
  /** Price distance of one pip for this symbol. See pipSize(). */
  pip: number;
  /** Broker server time minus GMT, in hours (session filters are defined in GMT). */
  serverGmtOffsetHours: number;
}

export interface Decision {
  time: number;
  values: number[];
  conditions: boolean[];
  filters: boolean;
  long: boolean;
  short: boolean;
}

// Comparisons treat values within a relative 1e-9 of each other as equal, the
// same way the compiled EA does (StratoGt etc.). Decimal prices produce exact
// ties often ("gap of exactly 5 pips"); without this, which side of a tie wins
// depends on binary rounding noise and the two implementations can disagree.
const EPS = 1e-9;
const tol = (a: number, b: number) => EPS * Math.max(1, Math.abs(a), Math.abs(b));
const gt = (a: number, b: number) => a - b > tol(a, b);
const lt = (a: number, b: number) => b - a > tol(a, b);
const gte = (a: number, b: number) => !lt(a, b);
const lte = (a: number, b: number) => !gt(a, b);

export function pipSize(digits: number, point: number): number {
  return digits === 3 || digits === 5 ? point * 10 : point;
}

const TF_SECONDS: Record<Exclude<Timeframe, "W1">, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
};

/** Open time of the bar of `tf` containing `time`. MT5 weekly bars start on Sunday. */
function bucket(time: number, tf: Timeframe): number {
  if (tf === "W1") {
    const day = Math.floor(time / 86400);
    const dayOfWeek = (day + 4) % 7; // 1970-01-01 was a Thursday; 0 = Sunday
    return (day - dayOfWeek) * 86400;
  }
  const s = TF_SECONDS[tf];
  return Math.floor(time / s) * s;
}

function resample(candles: Candle[], tf: Timeframe): Candle[] {
  const out: Candle[] = [];
  for (const c of candles) {
    const t = bucket(c.time, tf);
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.tickVolume += c.tickVolume;
    } else {
      if (last && t < last.time) throw new Error(`timeframe ${tf} is lower than the candle timeframe`);
      out.push({ ...c, time: t });
    }
  }
  return out;
}

function fieldOf(c: Candle, field: Field): number {
  switch (field) {
    case "median":
      return (c.high + c.low) / 2;
    case "typical":
      return (c.high + c.low + c.close) / 3;
    case "weighted":
      return (c.high + c.low + 2 * c.close) / 4;
    default:
      return c[field];
  }
}

export const SESSION_HOURS: Record<Session, (hour: number) => boolean> = {
  london: (h) => h >= 8 && h < 17,
  new_york: (h) => h >= 13 && h < 22,
  asia: (h) => h >= 23 || h < 8,
  london_ny_overlap: (h) => h >= 13 && h < 17,
};

export class Interpreter {
  readonly nodes: NodeTable;
  private seriesCache = new Map<string, Candle[]>();
  private arrayCache = new Map<string, number[]>();

  constructor(
    readonly strategy: RuleStrategy,
    private readonly candles: Candle[],
    private readonly opts: InterpretOptions
  ) {
    this.nodes = buildNodeTable(strategy);
  }

  /** Evaluate every node at decision index t (the bar at t has just opened; t-1 is the newest closed bar). */
  decide(t: number): Decision {
    const values = this.nodes.values.map((v) => this.value(v, t, 0));
    const conditions = this.nodes.conditions.map((c) => this.condition(c, t, 0));
    const allOf = (ids: number[]) => ids.every((id) => conditions[id]);
    const filters = allOf(this.nodes.filters);
    return {
      time: this.candles[t].time,
      values,
      conditions,
      filters,
      long: filters && this.nodes.long !== null && allOf(this.nodes.long),
      short: filters && this.nodes.short !== null && allOf(this.nodes.short),
    };
  }

  indexOfTime(time: number): number {
    return this.containing(this.candles, time, true);
  }

  private series(tf: Timeframe | undefined): Candle[] {
    if (!tf) return this.candles;
    let s = this.seriesCache.get(tf);
    if (!s) {
      s = resample(this.candles, tf);
      this.seriesCache.set(tf, s);
    }
    return s;
  }

  /** Index of the last bar with time <= T (or exactly T when exact). -1 if none. */
  private containing(bars: Candle[], T: number, exact = false): number {
    let lo = 0;
    let hi = bars.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (bars[mid].time <= T) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (exact && (found < 0 || bars[found].time !== T)) return -1;
    return found;
  }

  private decisionTime(t: number, k: number): number {
    return t - k >= 0 ? this.candles[t - k].time : NaN;
  }

  /** Oldest-first index of the closed bar `shift` bars back on `tf`, as of offset k. -1 if unavailable. */
  private closedIndex(tf: Timeframe | undefined, t: number, k: number, shift = 0): number {
    const T = this.decisionTime(t, k);
    if (Number.isNaN(T)) return -1;
    const j = this.containing(this.series(tf), T);
    return j < 0 ? -1 : j - 1 - shift;
  }

  private cached(key: string, compute: () => number[]): number[] {
    let a = this.arrayCache.get(key);
    if (!a) {
      a = compute();
      this.arrayCache.set(key, a);
    }
    return a;
  }

  private fieldArray(tf: Timeframe | undefined, field: Field): number[] {
    return this.cached(`field|${tf}|${field}`, () => this.series(tf).map((c) => fieldOf(c, field)));
  }

  private gmtOf(serverTime: number): Date {
    return new Date((serverTime - this.opts.serverGmtOffsetHours * 3600) * 1000);
  }

  private indicatorArray(v: Value): number[] {
    const tf = "tf" in v ? v.tf : undefined;
    const close = () => this.fieldArray(tf, "close");
    const high = () => this.fieldArray(tf, "high");
    const low = () => this.fieldArray(tf, "low");
    const maOf = (method: "sma" | "ema" | "smma" | "lwma", src: number[], period: number) =>
      ({ sma: ind.sma, ema: ind.ema, smma: ind.smma, lwma: ind.lwma })[method](src, period);
    return this.cached(stableKey({ ...v, shift: undefined }), () => {
      switch (v.kind) {
        case "ma":
          return maOf(v.method, this.fieldArray(tf, v.field ?? "close"), v.period);
        case "rsi":
          return ind.rsi(close(), v.period);
        case "atr":
          return ind.atr(high(), low(), close(), v.period);
        case "macd":
          return ind.macd(close(), v.fast, v.slow, v.signal)[v.line];
        case "bands":
          return ind.bands(close(), v.period, v.deviation)[v.line];
        case "stochastic":
          return ind.stochastic(high(), low(), close(), v.k, v.d, v.slowing)[v.line];
        case "cci":
          return ind.cci(this.fieldArray(tf, v.field ?? "typical"), v.period);
        case "adx":
          return ind.adx(high(), low(), close(), v.period)[v.line];
        case "sar":
          return ind.sar(high(), low(), v.step, v.max);
        case "momentum":
          return ind.momentum(this.fieldArray(tf, v.field ?? "close"), v.period);
        case "wpr":
          return ind.wpr(high(), low(), close(), v.period);
        case "envelopes": {
          const factor = v.line === "upper" ? 1 + v.deviation / 100 : 1 - v.deviation / 100;
          return maOf(v.method, this.fieldArray(tf, v.field ?? "close"), v.period).map((m) => m * factor);
        }
        case "stddev":
          return ind.stddev(this.fieldArray(tf, v.field ?? "close"), v.period);
        case "demarker":
          return ind.demarker(high(), low(), v.period);
        default:
          throw new Error(`not an indicator: ${v.kind}`);
      }
    });
  }

  value(v: Value, t: number, k: number): number {
    switch (v.kind) {
      case "const":
        return v.value;
      case "pips":
        return v.value * this.opts.pip;
      case "arith": {
        const a = this.value(v.a, t, k);
        const b = this.value(v.b, t, k);
        if (v.op === "add") return a + b;
        if (v.op === "sub") return a - b;
        if (v.op === "mul") return a * b;
        return b === 0 ? NaN : a / b;
      }
      case "vwap":
        return this.vwap(this.closedIndex(undefined, t, k, v.shift ?? 0));
      case "price": {
        const i = this.closedIndex(v.tf, t, k, v.shift ?? 0);
        return i < 0 ? NaN : fieldOf(this.series(v.tf)[i], v.field);
      }
      case "candle": {
        const i = this.closedIndex(v.tf, t, k, v.shift ?? 0);
        if (i < 0) return NaN;
        const c = this.series(v.tf)[i];
        if (v.measure === "body") return Math.abs(c.close - c.open);
        if (v.measure === "range") return c.high - c.low;
        if (v.measure === "upper_wick") return c.high - Math.max(c.open, c.close);
        return Math.min(c.open, c.close) - c.low;
      }
      case "swing": {
        // Newest-first p = shift + strength .. shift + lookback, i.e. oldest-first i - strength down to i - lookback.
        const i = this.closedIndex(v.tf, t, k, v.shift ?? 0);
        if (i < 0) return NaN;
        const bars = this.series(v.tf);
        const px = (j: number) => (v.side === "high" ? bars[j].high : bars[j].low);
        const beats = (a: number, b: number) => (v.side === "high" ? gt(a, b) : lt(a, b));
        for (let p = i - v.strength; p >= i - v.lookback; p--) {
          if (p - v.strength < 0) return NaN;
          let pivot = true;
          for (let j = 1; j <= v.strength && pivot; j++) pivot = beats(px(p), px(p - j)) && beats(px(p), px(p + j));
          if (pivot) return px(p);
        }
        return NaN;
      }
      case "session_range": {
        const i = this.closedIndex(undefined, t, k, v.shift ?? 0);
        if (i < 0) return NaN;
        const inSession = SESSION_HOURS[v.session];
        let found = false;
        let best = v.side === "high" ? -Infinity : Infinity;
        for (let j = i; j >= 0 && j > i - 1000; j--) {
          const c = this.candles[j];
          if (inSession(this.gmtOf(c.time).getUTCHours())) {
            found = true;
            best = v.side === "high" ? Math.max(best, c.high) : Math.min(best, c.low);
          } else if (found) break;
        }
        return found ? best : NaN;
      }
      case "highest":
      case "lowest": {
        const i = this.closedIndex(v.tf, t, k, v.shift ?? 0);
        const oldest = i - v.bars + 1;
        if (i < 0 || oldest < 0) return NaN;
        const bars = this.series(v.tf);
        let best = v.kind === "highest" ? -Infinity : Infinity;
        for (let j = oldest; j <= i; j++) {
          best = v.kind === "highest" ? Math.max(best, bars[j].high) : Math.min(best, bars[j].low);
        }
        return best;
      }
      default: {
        const i = this.closedIndex(v.tf, t, k, v.shift ?? 0);
        return i < 0 ? NaN : this.indicatorArray(v)[i];
      }
    }
  }

  private vwap(i: number): number {
    if (i < 0) return NaN;
    const dayStart = bucket(this.candles[i].time, "D1");
    let pv = 0;
    let vol = 0;
    for (let j = i; j >= 0 && j > i - 1000 && this.candles[j].time >= dayStart; j--) {
      const c = this.candles[j];
      pv += ((c.high + c.low + c.close) / 3) * c.tickVolume;
      vol += c.tickVolume;
    }
    return vol > 0 ? pv / vol : NaN;
  }

  condition(c: Condition, t: number, k: number): boolean {
    const valid = (...xs: number[]) => xs.every((x) => Number.isFinite(x));
    switch (c.kind) {
      case "compare": {
        const a = this.value(c.a, t, k);
        const b = this.value(c.b, t, k);
        if (!valid(a, b)) return false;
        return { gt, lt, gte, lte }[c.op](a, b);
      }
      case "cross": {
        const a0 = this.value(c.a, t, k);
        const b0 = this.value(c.b, t, k);
        const a1 = this.value(c.a, t, k + 1);
        const b1 = this.value(c.b, t, k + 1);
        if (!valid(a0, b0, a1, b1)) return false;
        return c.dir === "above" ? lte(a1, b1) && gt(a0, b0) : gte(a1, b1) && lt(a0, b0);
      }
      case "near": {
        const a = this.value(c.a, t, k);
        const b = this.value(c.b, t, k);
        return valid(a, b) && lt(Math.abs(a - b), c.pips * this.opts.pip);
      }
      case "session":
      case "time_window":
      case "weekday": {
        const T = this.decisionTime(t, k);
        if (Number.isNaN(T)) return false;
        const gmt = this.gmtOf(T);
        const hour = gmt.getUTCHours();
        if (c.kind === "session") return SESSION_HOURS[c.name](hour);
        if (c.kind === "weekday") return c.days.includes(gmt.getUTCDay());
        return c.fromHour <= c.toHour
          ? hour >= c.fromHour && hour < c.toHour
          : hour >= c.fromHour || hour < c.toHour;
      }
      case "all":
        return c.of.every((x) => this.condition(x, t, k));
      case "any":
        return c.of.some((x) => this.condition(x, t, k));
      case "not":
        return !this.condition(c.of, t, k);
      case "within":
        for (let j = 0; j < c.bars; j++) if (this.condition(c.of, t, k + j)) return true;
        return false;
      case "pattern":
        return this.pattern(c, this.closedIndex(c.tf, t, k, c.shift ?? 0));
    }
  }

  private pattern(c: Extract<Condition, { kind: "pattern" }>, i: number): boolean {
    const bars = this.series(c.tf);
    const bar = (j: number) => (j >= 0 ? bars[j] : undefined);
    const cur = bar(i);
    if (!cur) return false;
    const body = (x: Candle) => Math.abs(x.close - x.open);

    switch (c.pattern) {
      case "engulfing": {
        const prev = bar(i - 1);
        if (!prev) return false;
        return c.side === "bullish"
          ? lt(prev.close, prev.open) && gt(cur.close, cur.open) && lte(cur.open, prev.close) && gte(cur.close, prev.open)
          : gt(prev.close, prev.open) && lt(cur.close, cur.open) && gte(cur.open, prev.close) && lte(cur.close, prev.open);
      }
      case "pin_bar": {
        const range = cur.high - cur.low;
        if (!gt(range, 0)) return false;
        const upper = cur.high - Math.max(cur.open, cur.close);
        const lower = Math.min(cur.open, cur.close) - cur.low;
        if (!(lt(body(cur), range * 0.33) && (gt(upper, range * 0.6) || gt(lower, range * 0.6)))) return false;
        return c.side === "bullish"
          ? gt(lower, upper) && gt(cur.close, cur.open)
          : gt(upper, lower) && lt(cur.close, cur.open);
      }
      case "fvg": {
        const oldest = bar(i - 2);
        if (!oldest) return false;
        const min = c.minPips * this.opts.pip;
        return c.side === "bullish" ? gte(cur.low - oldest.high, min) : gte(oldest.low - cur.high, min);
      }
      case "inside_bar":
      case "outside_bar": {
        const prev = bar(i - 1);
        if (!prev) return false;
        return c.pattern === "inside_bar"
          ? lt(cur.high, prev.high) && gt(cur.low, prev.low)
          : gt(cur.high, prev.high) && lt(cur.low, prev.low);
      }
      case "doji": {
        const range = cur.high - cur.low;
        return gt(range, 0) && lte(body(cur), range * 0.1);
      }
      case "three_in_row": {
        const b1 = bar(i - 1);
        const b2 = bar(i - 2);
        if (!b1 || !b2) return false;
        const dirOk = (x: Candle) => (c.side === "bullish" ? gt(x.close, x.open) : lt(x.close, x.open));
        const beyond = (a: number, b: number) => (c.side === "bullish" ? gt(a, b) : lt(a, b));
        return dirOk(cur) && dirOk(b1) && dirOk(b2) && beyond(cur.close, b1.close) && beyond(b1.close, b2.close);
      }
      case "star": {
        // Oldest candle: large body against the new direction; middle: small body; newest: closes past the oldest's midpoint.
        const mid = bar(i - 1);
        const first = bar(i - 2);
        if (!mid || !first) return false;
        const smallMiddle = lt(body(mid), body(first) * 0.3);
        const midpoint = (first.open + first.close) / 2;
        return c.side === "bullish"
          ? lt(first.close, first.open) && smallMiddle && gt(cur.close, cur.open) && gt(cur.close, midpoint)
          : gt(first.close, first.open) && smallMiddle && lt(cur.close, cur.open) && lt(cur.close, midpoint);
      }
      case "order_block": {
        for (let j = i - 1; j >= i - c.lookback; j--) {
          const impulse = bar(j);
          const block = bar(j - 1);
          if (!impulse || !block) return false;
          if (gt(body(impulse), body(block) * 1.5)) {
            if (lt(cur.close, block.low) || gt(cur.close, block.high)) return false;
            const bullish = gt(impulse.close, impulse.open);
            return c.side === "bullish" ? bullish : !bullish;
          }
        }
        return false;
      }
    }
  }
}

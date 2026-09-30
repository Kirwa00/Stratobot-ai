import { execute, type Tick } from "./execute";
import type { Candle } from "./interpret";
import { buildNodeTable } from "./nodes";
import type { RuleStrategy, Timeframe, Value } from "./types";
import type { SimulatedTrade, SimulationResult } from "../types";

// Logic check for rule strategies: the strategy's own rules, run through the
// MT5-verified trade engine (execute.ts), on a synthetic EURUSD-like price
// path. Trades fire exactly where the compiled EA would fire them on that
// path. The path is random, not market data, so this shows how the rules
// behave (how often they trigger, which exits resolve) and nothing about
// profitability.

const VISIBLE = 150;
const MAX_WARMUP = 20000;
const PIP = 0.0001;
const POINT = 0.00001;
const SPREAD = 0.8 * PIP;
const START = Date.UTC(2026, 0, 5) / 1000; // a Monday, 00:00 GMT; server time = GMT here

export const TF_SECONDS: Record<Timeframe, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
  W1: 604800,
};

export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/** Bars of history (on the base timeframe) the rules need before their first decision. */
export function lookback(rules: RuleStrategy, baseSeconds: number): number {
  let need = 0;
  const walk = (v: Value) => {
    const o = v as Record<string, unknown>;
    let bars = 2;
    for (const k of ["period", "slow", "bars", "lookback", "k", "d", "slowing", "shift", "signal"]) {
      if (typeof o[k] === "number") bars += o[k] as number;
    }
    if (v.kind === "sar") bars += 500;
    if (v.kind === "ma" || v.kind === "rsi" || v.kind === "adx" || v.kind === "macd") bars *= 3; // smoothing warm-up
    const tf = typeof o.tf === "string" ? TF_SECONDS[o.tf as Timeframe] : baseSeconds;
    need = Math.max(need, Math.ceil((bars * Math.max(tf, baseSeconds)) / baseSeconds));
  };
  buildNodeTable(rules).values.forEach(walk);
  if (JSON.stringify(rules).includes('"D1"') || JSON.stringify(rules).includes('"session_range"')) {
    need = Math.max(need, Math.ceil((2 * 86400) / baseSeconds));
  }
  return Math.min(MAX_WARMUP, Math.max(50, need + 10));
}

const round = (p: number) => Math.round(p / POINT) * POINT;

export function buildPath(count: number, baseSeconds: number, rng: () => number): Candle[] {
  const candles: Candle[] = [];
  const sigma = 8 * PIP * Math.sqrt(baseSeconds / 3600);
  let price = 1.1;
  let drift = 0;
  let t = START;
  const skipWeekend = baseSeconds < 604800;
  while (candles.length < count) {
    const day = new Date(t * 1000).getUTCDay();
    if (skipWeekend && (day === 0 || day === 6)) {
      t += baseSeconds;
      continue;
    }
    // Trends that come and go, so trend and mean-reversion rules both get a chance to fire.
    if (rng() < 0.02) drift = (rng() - 0.5) * sigma * 0.6;
    // Occasional volatility bursts: real markets have fat tails, and gap or breakout
    // patterns can't form on a path where every bar moves about the same amount.
    const vol = rng() < 0.08 ? 2 + rng() * 2 : 1;
    const open = price;
    const close = round(open + drift + (rng() - 0.5) * 2 * sigma * vol);
    const high = round(Math.max(open, close) + rng() * sigma * 0.6 * vol);
    const low = round(Math.min(open, close) - rng() * sigma * 0.6 * vol);
    candles.push({ time: t, open, high, low, close, tickVolume: 100 + Math.floor(rng() * 900) });
    price = close;
    t += baseSeconds;
  }
  return candles;
}

/** Four ticks per bar in MT5's 1-minute-OHLC order: open, then low/high (bullish) or high/low (bearish), then close. */
export function ticksFor(candles: Candle[], from: number, baseSeconds: number): Tick[] {
  const ticks: Tick[] = [];
  const step = Math.max(1, Math.floor(baseSeconds / 4));
  for (let i = from; i < candles.length; i++) {
    const c = candles[i];
    const path = c.close >= c.open ? [c.open, c.low, c.high, c.close] : [c.open, c.high, c.low, c.close];
    path.forEach((bid, j) => ticks.push({ time: (c.time + j * step) * 1000, bid, ask: round(bid + SPREAD) }));
  }
  return ticks;
}

export function simulateRules(rules: RuleStrategy, runIndex = 0): SimulationResult {
  const baseTf: Timeframe = rules.timeframe === "chart" ? "H1" : rules.timeframe;
  const baseSeconds = TF_SECONDS[baseTf];
  const warmup = lookback(rules, baseSeconds);
  const rng = seededRandom(hash(JSON.stringify(rules)) + runIndex * 7919 + 1);
  const candles = buildPath(warmup + VISIBLE, baseSeconds, rng);
  const ticks = ticksFor(candles, warmup, baseSeconds);

  const events = execute(rules, candles, ticks, {
    pip: PIP,
    serverGmtOffsetHours: 0,
    symbol: { digits: 5, point: POINT, volumeStep: 0.01, volumeMin: 0.01, volumeMax: 100, tickValue: 1, tickSize: POINT },
    initialBalance: 10000,
    startBar: candles[warmup - 1].time,
    noSignalDirection: "buy",
  });

  const visible = candles.slice(warmup);
  const barOf = (ms: number) => {
    const sec = ms / 1000;
    let i = 0;
    while (i + 1 < visible.length && visible[i + 1].time <= sec) i++;
    return i;
  };

  const trades: SimulatedTrade[] = [];
  let current: SimulatedTrade | null = null;
  let pendingDir: 1 | -1 = 1;
  for (const e of events) {
    if (e.kind === "place") pendingDir = e.dir;
    if (e.kind === "open" || e.kind === "fill") {
      const dir = e.kind === "open" ? e.dir : pendingDir;
      current = { index: trades.length, candle: barOf(e.time), direction: dir > 0 ? "buy" : "sell", outcome: "open" };
      trades.push(current);
    }
    if (e.kind === "close" && current) {
      current.exitCandle = barOf(e.time);
      current.outcome = e.reason === "tp" ? "target" : e.reason === "sl" ? "stopped" : "closed";
      current = null;
    }
  }

  const lo = Math.min(...visible.map((c) => c.low));
  const hi = Math.max(...visible.map((c) => c.high));
  const scale = (p: number) => (hi > lo ? (p - lo) / (hi - lo) : 0.5);
  return {
    candles: visible.map((c) => ({ open: scale(c.open), high: scale(c.high), low: scale(c.low), close: scale(c.close) })),
    trades,
    runAt: Date.now(),
  };
}

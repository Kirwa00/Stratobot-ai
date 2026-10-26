import { execute, type Tick } from "./execute";
import { Interpreter, pipSize, resample, type Candle } from "./interpret";
import { SYMBOL_MAP, type MarketSeries, type SymbolInfo } from "../market/types";
import { explainEntry, explainExit, formatNumber } from "./explain";
import { buildNodeTable } from "./nodes";
import type { RuleStrategy, Timeframe, Value } from "./types";
import type { SimulatedTrade, SimulationResult } from "../types";

// Logic check for rule strategies: the strategy's own rules, run through the
// MT5-verified trade engine (execute.ts), either on real historical candles
// (simulateRulesOnMarket) or on a synthetic EURUSD-like price path
// (simulateRules). Trades fire exactly where the compiled EA would fire them
// on that data. It shows how the rules behave (how often they trigger, which
// exits resolve) and nothing about future profitability. Inside each candle
// the order of the high and low is estimated from the candle's direction.

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
export function ticksFor(candles: Candle[], from: number, baseSeconds: number, point = POINT, spread = SPREAD): Tick[] {
  const round = (p: number) => Math.round(p / point) * point;
  const ticks: Tick[] = [];
  const step = Math.max(1, Math.floor(baseSeconds / 4));
  for (let i = from; i < candles.length; i++) {
    const c = candles[i];
    const path = c.close >= c.open ? [c.open, c.low, c.high, c.close] : [c.open, c.high, c.low, c.close];
    path.forEach((bid, j) => ticks.push({ time: (c.time + j * step) * 1000, bid, ask: round(bid + spread) }));
  }
  return ticks;
}

const EURUSD = SYMBOL_MAP.EURUSD;

interface Run {
  trades: SimulatedTrade[];
  visible: Candle[];
}

/** Run the rules over candles[warmup..], with candles[0..warmup) as indicator history. */
function runOnCandles(rules: RuleStrategy, candles: Candle[], warmup: number, baseSeconds: number, sym: SymbolInfo): Run {
  const pip = pipSize(sym.digits, sym.point);
  const ticks = ticksFor(candles, warmup, baseSeconds, sym.point, sym.spreadPoints * sym.point);
  const events = execute(rules, candles, ticks, {
    pip,
    serverGmtOffsetHours: 0,
    symbol: { digits: sym.digits, point: sym.point, volumeStep: 0.01, volumeMin: 0.01, volumeMax: 100, tickValue: sym.tickValue, tickSize: sym.point },
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

  // Entries are decided on the first tick of a bar, so the event's bar is the decision bar.
  const interp = new Interpreter(rules, candles, { pip, serverGmtOffsetHours: 0 });
  const decisionBar = (ms: number) => warmup + barOf(ms);

  const trades: SimulatedTrade[] = [];
  let current: SimulatedTrade | null = null;
  let stopMoved = false;
  let pending: { dir: 1 | -1; why: string[] } | null = null;
  for (const e of events) {
    if (e.kind === "place") pending = { dir: e.dir, why: explainEntry(interp, rules, decisionBar(e.time), e.dir) };
    if (e.kind === "cancel") pending = null;
    if (e.kind === "open" || (e.kind === "fill" && pending)) {
      const dir = e.kind === "open" ? e.dir : pending!.dir;
      const why = e.kind === "open" ? explainEntry(interp, rules, decisionBar(e.time), e.dir) : [...pending!.why, `Filled at ${formatNumber(e.price)}.`];
      current = { index: trades.length, candle: barOf(e.time), direction: dir > 0 ? "buy" : "sell", outcome: "open", why };
      trades.push(current);
      pending = null;
      stopMoved = false;
    }
    if (e.kind === "modify") stopMoved = true;
    if (e.kind === "partial" && current) current.why = [...(current.why ?? []), `Closed ${e.lots} lots early at ${formatNumber(e.price)} (partial take profit).`];
    if (e.kind === "close" && current) {
      current.exitCandle = barOf(e.time);
      current.outcome = e.reason === "tp" ? "target" : e.reason === "sl" ? "stopped" : "closed";
      current.exitWhy = explainExit(e.reason, e.price, stopMoved, rules);
      current = null;
    }
  }
  return { trades, visible };
}

function normalized(visible: Candle[]) {
  const lo = Math.min(...visible.map((c) => c.low));
  const hi = Math.max(...visible.map((c) => c.high));
  const scale = (p: number) => (hi > lo ? (p - lo) / (hi - lo) : 0.5);
  return visible.map((c) => ({ open: scale(c.open), high: scale(c.high), low: scale(c.low), close: scale(c.close) }));
}

export function simulateRules(rules: RuleStrategy, runIndex = 0): SimulationResult {
  const baseTf = marketTimeframe(rules);
  const baseSeconds = TF_SECONDS[baseTf];
  const warmup = lookback(rules, baseSeconds);
  const rng = seededRandom(hash(JSON.stringify(rules)) + runIndex * 7919 + 1);
  const candles = buildPath(warmup + VISIBLE, baseSeconds, rng);
  const { trades, visible } = runOnCandles(rules, candles, warmup, baseSeconds, EURUSD);
  return { candles: normalized(visible), trades, runAt: Date.now(), source: { kind: "synthetic" } };
}

/** The timeframe of candles this strategy is checked on (chart-timeframe strategies use H1). */
export function marketTimeframe(rules: RuleStrategy): Timeframe {
  return rules.timeframe === "chart" ? "H1" : rules.timeframe;
}

const TF_NAMES: Record<Timeframe, string> = {
  M1: "1-minute",
  M5: "5-minute",
  M15: "15-minute",
  M30: "30-minute",
  H1: "1-hour",
  H4: "4-hour",
  D1: "daily",
  W1: "weekly",
};

const day = (sec: number) =>
  new Date(sec * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The series as candles of timeframe `tf`: as-is, resampled from a finer timeframe, or null if it's coarser. */
const resampled = new WeakMap<MarketSeries, Map<Timeframe, Candle[]>>();

export function marketCandles(series: MarketSeries, tf: Timeframe): Candle[] | null {
  if (series.tf === tf) return series.candles;
  if (TF_SECONDS[series.tf] > TF_SECONDS[tf]) return null;
  let byTf = resampled.get(series);
  if (!byTf) resampled.set(series, (byTf = new Map()));
  let out = byTf.get(tf);
  if (!out) byTf.set(tf, (out = resample(series.candles, tf)));
  return out;
}

/** How many more candles of `tf` this series needs before the strategy can be checked on it (0 = enough), or null if the timeframe is too coarse. */
export function marketShortfall(rules: RuleStrategy, series: MarketSeries): number | null {
  const tf = marketTimeframe(rules);
  const all = marketCandles(series, tf);
  if (!all) return null;
  return Math.max(0, lookback(rules, TF_SECONDS[tf]) + VISIBLE - all.length);
}

/** One window of real history, chosen by runIndex so each run checks a different stretch. null if the series is too short. */
export function simulateRulesOnMarket(rules: RuleStrategy, series: MarketSeries, runIndex = 0): SimulationResult | null {
  const sym = series.info ?? SYMBOL_MAP[series.symbol];
  const tf = marketTimeframe(rules);
  if (!sym) return null;
  const all = marketCandles(series, tf);
  if (!all) return null;
  const baseSeconds = TF_SECONDS[tf];
  const warmup = lookback(rules, baseSeconds);
  const room = all.length - warmup - VISIBLE;
  if (room < 0) return null;
  const start = warmup + ((hash(JSON.stringify(rules)) + runIndex * 7919) % (room + 1));
  const candles = all.slice(start - warmup, start + VISIBLE);
  const { trades, visible } = runOnCandles(rules, candles, warmup, baseSeconds, sym);
  return {
    candles: normalized(visible),
    trades,
    runAt: Date.now(),
    source: {
      kind: "real",
      label: `${sym.label}, ${TF_NAMES[tf]} candles, ${day(visible[0].time)} to ${day(visible[visible.length - 1].time)}`,
      provider: series.source,
    },
  };
}

import { getBlock } from "./blocks";
import type { BlockInstance, Candle, SimulationResult, SimulatedTrade, TradeOutcome } from "./types";

// Mock "logic check" simulator — Engineering Plan Phase 4 / UX Plan §5.4.
// This deliberately does NOT compute P&L. It draws a plausible OHLC price
// path and fires trades wherever the strategy's entry blocks "would"
// trigger, then walks each trade forward against whatever exit blocks are
// configured (Stop Loss / Take Profit / Trailing Stop) to see which level
// gets touched first. It exists to demonstrate the honest framing rules
// from the UX plan: lead with trade count, name the two failure modes,
// never imply profitability — "target hit" / "stopped out" describe rule
// mechanics against a synthetic path, not a real backtest result.

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashBlocks(blocks: BlockInstance[]): number {
  const str = blocks.map((b) => `${b.blockId}:${JSON.stringify(b.params)}`).join("|") || "empty";
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

const CANDLE_COUNT = 100;
// Maps a "pip" distance (as configured on Stop Loss / Take Profit / Trailing
// Stop blocks) onto the same 0-1 normalized range the synthetic path lives
// in, calibrated so a default ~20-40 pip exit resolves within a handful of
// candles against the path's per-candle volatility below — not instantly,
// not never.
const PIP_UNIT = 0.0012;

function buildCandles(rng: () => number): Candle[] {
  const candles: Candle[] = [];
  let price = 0.5;
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const open = price;
    price += (rng() - 0.5) * 0.06;
    price = Math.max(0.05, Math.min(0.95, price));
    const close = price;
    const wickUp = rng() * 0.012;
    const wickDown = rng() * 0.012;
    candles.push({
      open,
      close,
      high: Math.min(1, Math.max(open, close) + wickUp),
      low: Math.max(0, Math.min(open, close) - wickDown),
    });
  }
  return candles;
}

interface ExitPlan {
  mode: "fixed" | "trailing" | "none";
  slDist?: number; // normalized units
  tpDist?: number;
  trailDist?: number;
}

function buildExitPlan(blocks: BlockInstance[]): ExitPlan {
  const sl = blocks.find((b) => b.blockId === "stop_loss");
  const tp = blocks.find((b) => b.blockId === "take_profit");
  const trailing = blocks.find((b) => b.blockId === "trailing_stop");

  if (sl || tp) {
    return {
      mode: "fixed",
      slDist: sl ? Number(sl.params.distance) * PIP_UNIT : undefined,
      tpDist: tp ? Number(tp.params.distance) * PIP_UNIT : undefined,
    };
  }
  if (trailing) {
    return { mode: "trailing", trailDist: Number(trailing.params.distance) * PIP_UNIT };
  }
  return { mode: "none" };
}

/** Walk forward from entry, checking each candle's high/low against the
 *  configured exit. Ambiguous same-candle overlap resolves to "stopped" —
 *  the conservative assumption. */
function resolveTrade(
  candles: Candle[],
  entryIndex: number,
  direction: "buy" | "sell",
  plan: ExitPlan
): { exitCandle?: number; outcome: TradeOutcome } {
  const entryPrice = candles[entryIndex].close;
  const sign = direction === "buy" ? 1 : -1;

  if (plan.mode === "fixed") {
    const targetPrice = plan.tpDist !== undefined ? entryPrice + sign * plan.tpDist : undefined;
    const stopPrice = plan.slDist !== undefined ? entryPrice - sign * plan.slDist : undefined;
    for (let i = entryIndex + 1; i < candles.length; i++) {
      const c = candles[i];
      const hitTarget =
        targetPrice !== undefined &&
        (direction === "buy" ? c.high >= targetPrice : c.low <= targetPrice);
      const hitStop =
        stopPrice !== undefined &&
        (direction === "buy" ? c.low <= stopPrice : c.high >= stopPrice);
      if (hitStop) return { exitCandle: i, outcome: "stopped" };
      if (hitTarget) return { exitCandle: i, outcome: "target" };
    }
    return { outcome: "open" };
  }

  if (plan.mode === "trailing" && plan.trailDist !== undefined) {
    let extreme = entryPrice;
    for (let i = entryIndex + 1; i < candles.length; i++) {
      const c = candles[i];
      extreme = direction === "buy" ? Math.max(extreme, c.high) : Math.min(extreme, c.low);
      const trailStop = extreme - sign * plan.trailDist;
      const stopped = direction === "buy" ? c.low <= trailStop : c.high >= trailStop;
      if (stopped) {
        const favorable = direction === "buy" ? trailStop > entryPrice : trailStop < entryPrice;
        return { exitCandle: i, outcome: favorable ? "target" : "stopped" };
      }
    }
    return { outcome: "open" };
  }

  return { outcome: "open" };
}

export function runSimulation(blocks: BlockInstance[], runIndex = 0): SimulationResult {
  const rng = seededRandom(hashBlocks(blocks) + runIndex * 7919 + 1);
  const candles = buildCandles(rng);
  const exitPlan = buildExitPlan(blocks);

  // Strategy "strictness" drives trade frequency, mirroring the two
  // documented failure modes: too many filters -> ~0 trades, too few -> many.
  const filterCount = blocks.filter((b) => getBlock(b.blockId)?.role === "filter").length;
  const entryCount = Math.max(1, blocks.filter((b) => getBlock(b.blockId)?.role !== "exit").length);

  let baseChance = 0.14 - filterCount * 0.045 - (entryCount - 1) * 0.02;
  baseChance = Math.max(0.005, Math.min(0.35, baseChance));

  if (blocks.length === 0) baseChance = 0;

  const trades: SimulatedTrade[] = [];
  let lastTradeCandle = -10;
  for (let i = 5; i < CANDLE_COUNT; i++) {
    if (i - lastTradeCandle < 4) continue;
    if (rng() < baseChance) {
      const direction = rng() > 0.5 ? "buy" : "sell";
      const resolved = resolveTrade(candles, i, direction, exitPlan);
      trades.push({
        index: trades.length,
        candle: i,
        direction,
        ...resolved,
      });
      lastTradeCandle = i;
    }
  }

  return { candles, trades, runAt: Date.now() };
}

export interface SimulationStats {
  total: number;
  buys: number;
  sells: number;
  targets: number;
  stopped: number;
  open: number;
  hasManagedExit: boolean;
  longestGap: number;
}

export function simulationStats(result: SimulationResult, blocks: BlockInstance[]): SimulationStats {
  const { trades, candles } = result;
  const buys = trades.filter((t) => t.direction === "buy").length;
  const targets = trades.filter((t) => t.outcome === "target").length;
  const stopped = trades.filter((t) => t.outcome === "stopped").length;
  const open = trades.filter((t) => t.outcome === "open").length;

  let longestGap = 0;
  for (let i = 1; i < trades.length; i++) {
    longestGap = Math.max(longestGap, trades[i].candle - trades[i - 1].candle);
  }
  if (trades.length === 0) longestGap = candles.length;

  return {
    total: trades.length,
    buys,
    sells: trades.length - buys,
    targets,
    stopped,
    open,
    hasManagedExit: buildExitPlan(blocks).mode !== "none",
    longestGap,
  };
}

export interface AggregateStats {
  runs: number;
  totalTrades: number;
  avgTradesPerRun: number;
  minTradesPerRun: number;
  maxTradesPerRun: number;
  buys: number;
  sells: number;
  targets: number;
  stopped: number;
  open: number;
  hasManagedExit: boolean;
}

/** Combines several independent logic-check runs into one honest summary —
 *  still no P&L, still no win rate. Just "how often did this fire, and how
 *  often did the configured exit resolve which way" across a bigger sample
 *  of synthetic paths, so a trader can see whether one run was a fluke. */
export function aggregateSimulationStats(
  results: SimulationResult[],
  blocks: BlockInstance[]
): AggregateStats {
  const perRun = results.map((r) => simulationStats(r, blocks));
  const totalTrades = perRun.reduce((s, p) => s + p.total, 0);
  const counts = perRun.map((p) => p.total);
  return {
    runs: results.length,
    totalTrades,
    avgTradesPerRun: results.length ? totalTrades / results.length : 0,
    minTradesPerRun: counts.length ? Math.min(...counts) : 0,
    maxTradesPerRun: counts.length ? Math.max(...counts) : 0,
    buys: perRun.reduce((s, p) => s + p.buys, 0),
    sells: perRun.reduce((s, p) => s + p.sells, 0),
    targets: perRun.reduce((s, p) => s + p.targets, 0),
    stopped: perRun.reduce((s, p) => s + p.stopped, 0),
    open: perRun.reduce((s, p) => s + p.open, 0),
    hasManagedExit: perRun[0]?.hasManagedExit ?? false,
  };
}

export function simulationMessage(result: SimulationResult, blockCount: number): {
  headline: string;
  detail?: string;
} {
  const n = result.trades.length;
  if (blockCount === 0) {
    return {
      headline: "Nothing to simulate yet",
      detail: "Add at least one entry block to run a check.",
    };
  }
  if (n === 0) {
    return {
      headline: "Your rules never triggered on this data.",
      detail: "Usually one condition is too strict — try widening the killzone or removing a filter.",
    };
  }
  if (n >= 30) {
    return {
      headline: `${n} trades over ${CANDLE_COUNT} candles`,
      detail: "Your rules fired on almost every candle. Usually a filter is missing.",
    };
  }
  return { headline: `${n} trades over ${CANDLE_COUNT} candles` };
}

import { Interpreter, type Candle, type InterpretOptions } from "./interpret";
import { atrValue } from "./nodes";
import type { PendingEntry, RuleStrategy, StopSpec, TargetSpec } from "./types";

// Trade execution engine: replays a tick stream through the same logic the
// compiled EA runs (compile-mql5.ts: OnTick / ManageExits / StratoEnter), so the
// MT5 differential test can check every order, fill, stop change and exit.
// Given the exact ticks MT5 used it should reproduce the EA's events exactly;
// with ticks generated from bars it becomes a backtest.
//
// Per tick, in the tester's order: (1) the broker fills a pending order or
// triggers the stop loss / take profit, (2) the EA manages the open position,
// (3) on the first tick of a new bar: exits decided at the bar open, order
// expiry, then the entry decision (rules evaluated on closed bars).

export interface Tick {
  /** Milliseconds, broker server time. */
  time: number;
  bid: number;
  ask: number;
}

export interface SymbolSpec {
  digits: number;
  point: number;
  volumeStep: number;
  volumeMin: number;
  volumeMax: number;
  /** Account-currency value of one tickSize move for one lot. */
  tickValue: number;
  tickSize: number;
  /** Broker's minimum stop distance from price, in points (SYMBOL_TRADE_STOPS_LEVEL). */
  stopsLevel?: number;
}

export interface ExecuteOptions extends InterpretOptions {
  symbol: SymbolSpec;
  initialBalance: number;
  /** Chart bar open time (seconds) current when the EA started; the first decision is at the next bar. */
  startBar: number;
  /** The EA's "If no rule picks a direction" input. */
  noSignalDirection?: "skip" | "buy" | "sell";
  /** Balance to size a trade from, if known more exactly than this engine tracks it (e.g. with broker swaps). */
  balanceAt?: (timeMs: number) => number | undefined;
  /** Free margin and margin for one lot at an entry, as the broker reports them. Without it, sizes aren't margin-capped. */
  marginAt?: (timeMs: number) => { free: number; perLot: number } | undefined;
}

export type CloseReason = "sl" | "tp" | "time" | "opposite";

export type TradeEvent =
  | { time: number; kind: "open"; dir: 1 | -1; price: number; sl: number; tp: number; lots: number }
  | { time: number; kind: "place"; dir: 1 | -1; type: "limit" | "stop"; price: number; sl: number; tp: number; lots: number }
  | { time: number; kind: "cancel" }
  | { time: number; kind: "fill"; price: number; lots: number }
  | { time: number; kind: "modify"; sl: number; tp: number }
  | { time: number; kind: "partial"; price: number; lots: number }
  | { time: number; kind: "close"; price: number; reason: CloseReason; lots: number };

interface Position {
  dir: 1 | -1;
  open: number;
  sl: number;
  tp: number;
  lots: number;
  entryBar: number;
  initialRiskPts: number;
  partialDone: boolean;
}

interface Pending {
  dir: 1 | -1;
  type: "limit" | "stop";
  price: number;
  sl: number;
  tp: number;
  lots: number;
  placedBar: number;
}

/**
 * MQL5 NormalizeDouble: round half away from zero to `digits` places. It scales
 * back by *multiplying* by 10^-digits (not dividing by 10^digits), which can land
 * one ulp away; verified against MT5, and it decides exact 1-pip trailing steps.
 */
export function normalize(x: number, digits: number): number {
  return Math.sign(x) * Math.round(Math.abs(x) * 10 ** digits) * Number(`1e-${digits}`);
}

export function execute(s: RuleStrategy, candles: Candle[], ticks: Tick[], opts: ExecuteOptions): TradeEvent[] {
  const interp = new Interpreter(s, candles, opts);
  const { symbol, pip } = opts;
  const x = s.exits;
  const g = s.guards;
  const riskSized = Boolean(s.sizing.riskPercent || s.sizing.riskMoney);
  const lotsInput = s.sizing.fixedLots ?? 0.1;
  const maxLots = riskSized && s.sizing.fixedLots ? s.sizing.fixedLots : 0;
  const noDirection = s.directionFromInput === true && s.long === null && s.short === null;

  // The trade server compares prices in whole points, not raw doubles: tester
  // ticks carry float noise (1.1691199999999999), and a stop at 1.16945 fires
  // when the bid prints 1.16945 whichever side of it the noise falls.
  const pts = (price: number) => Math.round(price / symbol.point);
  const pipPts = symbol.digits === 3 || symbol.digits === 5 ? 10 : 1;
  // A distance in whole points; exact half-point ties (ATR averages of whole-point ranges) round away from the entry.
  const distPts = (distance: number) => Math.floor(distance / symbol.point + 0.5 + 1e-6);

  const events: TradeEvent[] = [];
  let pos: Position | null = null;
  let pending: Pending | null = null;
  let balance = opts.initialBalance;
  let lastBar = opts.startBar;
  const entryDays: number[] = [];

  const barIndexAt = (sec: number) => {
    let lo = 0;
    let hi = candles.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (candles[mid].time <= sec) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found;
  };
  const serverDay = (ms: number) => Math.floor(ms / 86400000);

  const profit = (dir: number, open: number, price: number, lots: number) =>
    ((dir * (price - open)) / symbol.tickSize) * symbol.tickValue * lots;

  const normalizeLots = (lots: number) => {
    const step = symbol.volumeStep > 0 ? symbol.volumeStep : 0.01;
    let l = Math.floor(lots / step + 1e-9) * step;
    if (l < symbol.volumeMin) return 0;
    if (symbol.volumeMax > 0 && l > symbol.volumeMax) l = symbol.volumeMax;
    return normalize(l, 8);
  };

  const atrAt = (period: number, i: number) => interp.value(atrValue(period), i, 0);

  function stopDistance(spec: StopSpec | undefined, dir: number, entry: number, i: number): number {
    if (!spec) return 0;
    if (spec.kind === "pips") return spec.pips > 0 ? spec.pips * pip : 0;
    if (spec.kind === "atr") {
      if (spec.multiple <= 0) return 0;
      const a = atrAt(spec.period, i);
      return Number.isFinite(a) && a > 0 ? spec.multiple * a : -1;
    }
    const lv = interp.value(spec.at, i, 0);
    if (!Number.isFinite(lv) || dir * (pts(entry) - pts(lv)) <= 0) return -1;
    return Math.abs(entry - lv);
  }

  function targetDistance(spec: TargetSpec | undefined, dir: number, entry: number, stop: number, i: number): number {
    if (!spec) return 0;
    if (spec.kind === "rr") return spec.multiple > 0 && stop > 0 ? spec.multiple * stop : 0;
    if (spec.kind === "pips") return spec.pips > 0 ? spec.pips * pip : 0;
    if (spec.kind === "atr") {
      if (spec.multiple <= 0) return 0;
      const a = atrAt(spec.period, i);
      return Number.isFinite(a) && a > 0 ? spec.multiple * a : -1;
    }
    const lv = interp.value(spec.at, i, 0);
    if (!Number.isFinite(lv) || dir * (pts(lv) - pts(entry)) <= 0) return -1;
    return Math.abs(lv - entry);
  }

  function trailDistance(i: number): number {
    const t = x.trailing;
    if (!t) return 0;
    if (t.kind === "pips") return t.pips > 0 ? t.pips * pip : 0;
    if (t.multiple <= 0) return 0;
    const a = atrAt(t.period, i);
    return Number.isFinite(a) && a > 0 ? t.multiple * a : 0;
  }

  const lotsFor = (tick: Tick, stop: number) => {
    let lots = lotsInput;
    const bal = opts.balanceAt?.(tick.time) ?? balance;
    const risk = s.sizing.riskMoney ? s.sizing.riskMoney : s.sizing.riskPercent ? (bal * s.sizing.riskPercent) / 100 : 0;
    if (risk > 0 && stop > 0 && symbol.tickValue > 0 && symbol.tickSize > 0) {
      lots = risk / ((stop / symbol.tickSize) * symbol.tickValue);
      if (maxLots > 0) lots = Math.min(lots, maxLots);
    }
    return normalizeLots(lots);
  };

  // MT5 refuses a stop on the wrong side of the current price ("invalid stops").
  const slValid = (p: Position, sl: number, tick: Tick) =>
    sl === 0 || (p.dir > 0 ? pts(sl) < pts(tick.bid) : pts(sl) > pts(tick.ask));

  const openPosition = (tick: Tick, dir: 1 | -1, price: number, sl: number, tp: number, lots: number) => {
    pos = {
      dir,
      open: price,
      sl,
      tp,
      lots,
      entryBar: barIndexAt(Math.floor(tick.time / 1000)),
      initialRiskPts: sl > 0 ? Math.abs(pts(price) - pts(sl)) : 0,
      partialDone: false,
    };
    entryDays.push(serverDay(tick.time));
  };

  const closeAll = (tick: Tick, price: number, reason: CloseReason) => {
    if (!pos) return;
    balance += profit(pos.dir, pos.open, price, pos.lots);
    events.push({ time: tick.time, kind: "close", price, reason, lots: pos.lots });
    pos = null;
  };

  function manageExits(tick: Tick, i: number) {
    const p = pos;
    if (!p) return;
    const d = p.dir;
    const market = d > 0 ? tick.bid : tick.ask;
    const gainPts = d * (pts(market) - pts(p.open));

    const partial = x.partial;
    if (partial && partial.atR > 0 && !p.partialDone && p.initialRiskPts > 0 && gainPts >= Math.round(partial.atR * p.initialRiskPts)) {
      p.partialDone = true;
      const part = normalizeLots(p.lots * partial.fraction);
      if (part > 0 && part < p.lots) {
        balance += profit(d, p.open, market, part);
        p.lots = normalize(p.lots - part, 8);
        events.push({ time: tick.time, kind: "partial", price: market, lots: part });
      }
    }

    let newSL = p.sl;
    const be = x.breakEvenPips ?? 0;
    if (be > 0 && gainPts >= Math.round(be * pipPts) && (newSL === 0 || d * (pts(p.open) - pts(newSL)) > 0)) newSL = p.open;
    const td = trailDistance(i);
    if (td > 0) {
      const trail = (pts(market) - d * distPts(td)) * symbol.point;
      if (newSL === 0 || d * (pts(trail) - pts(newSL)) >= pipPts) newSL = trail;
    }
    newSL = normalize(newSL, symbol.digits);
    if (newSL !== normalize(p.sl, symbol.digits) && slValid(p, newSL, tick)) {
      p.sl = newSL;
      events.push({ time: tick.time, kind: "modify", sl: newSL, tp: p.tp });
    }
  }

  function pendingPrice(dir: 1 | -1, spec: PendingEntry | undefined, tick: Tick, i: number): number | null | undefined {
    if (!spec) return undefined; // market
    const raw = interp.value(spec.at, i, 0);
    if (!Number.isFinite(raw)) return null;
    const p = normalize(raw, symbol.digits);
    const ref = pts(dir > 0 ? tick.ask : tick.bid);
    const beyond = (dir > 0) === (spec.type === "stop");
    return (beyond ? pts(p) > ref : pts(p) < ref) ? p : null;
  }

  function enter(tick: Tick, dir: 1 | -1, i: number) {
    const spec = dir > 0 ? s.entry?.long : s.entry?.short;
    const pend = pendingPrice(dir, spec, tick, i);
    if (pend === null) return;
    const entry = pend ?? (dir > 0 ? tick.ask : tick.bid);
    const sd = stopDistance(x.stopLoss, dir, entry, i);
    if (sd < 0) return;
    const td = targetDistance(x.takeProfit, dir, entry, sd, i);
    if (td < 0) return;
    const slPts = sd > 0 ? distPts(sd) : 0;
    const tpPts = td > 0 ? distPts(td) : 0;
    if ((g.minRewardRisk ?? 0) > 0 && slPts > 0 && tpPts > 0 && tpPts / slPts + 1e-9 < g.minRewardRisk!) return;
    let lots = lotsFor(tick, slPts * symbol.point);
    const margin = opts.marginAt?.(tick.time);
    if (lots > 0 && margin && margin.perLot > 0) lots = Math.min(lots, normalizeLots((margin.free * 0.95) / margin.perLot));
    if (lots <= 0) return;
    const sl = slPts > 0 ? normalize(entry - dir * slPts * symbol.point, symbol.digits) : 0;
    const tp = tpPts > 0 ? normalize(entry + dir * tpPts * symbol.point, symbol.digits) : 0;
    // Market orders: stops must clear the current price (buys vs bid, sells vs ask) by the broker's minimum.
    if (pend === undefined) {
      const ref = pts(dir > 0 ? tick.bid : tick.ask);
      const minGap = symbol.stopsLevel ?? 0;
      if ((sl > 0 && dir * (ref - pts(sl)) <= minGap) || (tp > 0 && dir * (pts(tp) - ref) <= minGap)) return;
    }
    if (spec && pend !== undefined) {
      pending = { dir, type: spec.type, price: entry, sl, tp, lots, placedBar: i };
      events.push({ time: tick.time, kind: "place", dir, type: spec.type, price: entry, sl, tp, lots });
    } else {
      openPosition(tick, dir, entry, sl, tp, lots);
      events.push({ time: tick.time, kind: "open", dir, price: entry, sl, tp, lots });
    }
  }

  for (const tick of ticks) {
    // 1. Broker side: pending fill, or stop loss / take profit (filled at the level).
    const o = pending as Pending | null;
    if (o) {
      // Buy orders trigger on the ask, sell orders on the bid. An order above the market
      // (buy stop, sell limit) fills when price rises to it; one below (buy limit, sell stop) when it falls to it.
      const ref = pts(o.dir > 0 ? tick.ask : tick.bid);
      const above = (o.dir > 0) === (o.type === "stop");
      const hit = above ? ref >= pts(o.price) : ref <= pts(o.price);
      if (hit) {
        pending = null;
        openPosition(tick, o.dir, o.price, o.sl, o.tp, o.lots);
        events.push({ time: tick.time, kind: "fill", price: o.price, lots: o.lots });
      }
    } else if (pos) {
      const p: Position = pos;
      if (p.dir > 0) {
        if (p.sl !== 0 && pts(tick.bid) <= pts(p.sl)) closeAll(tick, p.sl, "sl");
        else if (p.tp !== 0 && pts(tick.bid) >= pts(p.tp)) closeAll(tick, p.tp, "tp");
      } else {
        if (p.sl !== 0 && pts(tick.ask) >= pts(p.sl)) closeAll(tick, p.sl, "sl");
        else if (p.tp !== 0 && pts(tick.ask) <= pts(p.tp)) closeAll(tick, p.tp, "tp");
      }
    }

    // 2. OnTick: manage the open position.
    const i = barIndexAt(Math.floor(tick.time / 1000));
    manageExits(tick, i);

    // 3. OnTick: new-bar decision.
    if (i < 0 || candles[i].time === lastBar) continue;
    lastBar = candles[i].time;
    const d = interp.decide(i);

    const p = pos as Position | null;
    if (p) {
      if ((x.closeAfterBars ?? 0) > 0 && i - p.entryBar >= x.closeAfterBars!) closeAll(tick, p.dir > 0 ? tick.bid : tick.ask, "time");
      else if (x.closeOnOpposite && (p.dir > 0 ? d.short : d.long)) closeAll(tick, p.dir > 0 ? tick.bid : tick.ask, "opposite");
    }
    const q = pending as Pending | null;
    if (q) {
      const expiry = (q.dir > 0 ? s.entry?.long : s.entry?.short)?.expiresBars ?? 1;
      if (i - q.placedBar >= expiry) {
        pending = null;
        events.push({ time: tick.time, kind: "cancel" });
      }
    }
    if (pos || pending) continue;

    if (d.long && d.short) continue;
    let dir: 1 | -1 | 0 = d.long ? 1 : d.short ? -1 : 0;
    if (!dir && noDirection && d.filters) {
      dir = opts.noSignalDirection === "buy" ? 1 : opts.noSignalDirection === "sell" ? -1 : 0;
    }
    if (!dir) continue;
    if ((g.maxTradesPerDay ?? 0) > 0 && entryDays.filter((day) => day === serverDay(tick.time)).length >= g.maxTradesPerDay!) continue;
    if ((g.maxSpreadPips ?? 0) > 0 && pts(tick.ask) - pts(tick.bid) > Math.round(g.maxSpreadPips! * pipPts)) continue;
    enter(tick, dir, i);
  }
  return events;
}

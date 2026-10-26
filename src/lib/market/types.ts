import type { Candle } from "../rules/interpret";
import type { Timeframe } from "../rules/types";

// Historical market data for the logic check (Phase 5). Candle times are
// seconds in GMT: the check runs with a zero broker offset, so session and
// weekday rules line up with the times the trader sees.

export interface SymbolInfo {
  symbol: string;
  label: string;
  digits: number;
  point: number;
  /** Account-currency (USD) value of a one-point move for one lot, approximate for non-USD-quoted pairs. */
  tickValue: number;
  /** Typical spread used by the logic check, in points. */
  spreadPoints: number;
}

export const SYMBOLS: SymbolInfo[] = [
  { symbol: "EURUSD", label: "EUR/USD", digits: 5, point: 0.00001, tickValue: 1, spreadPoints: 8 },
  { symbol: "GBPUSD", label: "GBP/USD", digits: 5, point: 0.00001, tickValue: 1, spreadPoints: 12 },
  { symbol: "USDJPY", label: "USD/JPY", digits: 3, point: 0.001, tickValue: 0.67, spreadPoints: 10 },
  { symbol: "XAUUSD", label: "Gold", digits: 2, point: 0.01, tickValue: 1, spreadPoints: 25 },
];

export const SYMBOL_MAP: Record<string, SymbolInfo> = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s]));

export interface MarketSeries {
  symbol: string;
  tf: Timeframe;
  candles: Candle[];
  /** Where the data came from, shown with every result (e.g. the provider's name). */
  source: string;
}

/** Compact wire format for /api/candles. */
export interface MarketPayload {
  symbol: string;
  tf: Timeframe;
  source: string;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
}

export function toPayload(m: MarketSeries): MarketPayload {
  const k = m.candles;
  return {
    symbol: m.symbol,
    tf: m.tf,
    source: m.source,
    t: k.map((x) => x.time),
    o: k.map((x) => x.open),
    h: k.map((x) => x.high),
    l: k.map((x) => x.low),
    c: k.map((x) => x.close),
    v: k.map((x) => x.tickVolume),
  };
}

export function fromPayload(p: MarketPayload): MarketSeries {
  return {
    symbol: p.symbol,
    tf: p.tf,
    source: p.source,
    candles: p.t.map((time, i) => ({ time, open: p.o[i], high: p.h[i], low: p.l[i], close: p.c[i], tickVolume: p.v[i] })),
  };
}

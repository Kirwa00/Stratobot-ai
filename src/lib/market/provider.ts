import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { resample, type Candle } from "../rules/interpret";
import type { Timeframe } from "../rules/types";
import { SYMBOL_MAP, type MarketSeries } from "./types";

// Server-side source of historical candles. Which provider runs is set by
// MARKET_DATA_PROVIDER; with none configured the logic check stays on the
// synthetic path. Licensed data must never be committed to the repo or served
// beyond what the provider's licence allows.
//
//   file  Local development only: MARKET_DATA_DIR/<SYMBOL>_<TF>.csv with rows
//         time(seconds),open,high,low,close,tickVolume. Refused in production.

export interface CandleProvider {
  name: string;
  /** The finest timeframe it serves; coarser ones are resampled from it. */
  load(symbol: string, tf: Timeframe): Promise<Candle[] | null>;
}

const TF_ORDER: Timeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

function fileProvider(dir: string): CandleProvider {
  // Files exported from MT5 carry broker server time; MARKET_DATA_GMT_OFFSET (hours) converts them to GMT.
  const offset = Number(process.env.MARKET_DATA_GMT_OFFSET ?? 0) * 3600;
  return {
    name: "local file",
    async load(symbol, tf) {
      // Use the finest file available at or below the requested timeframe.
      for (let i = TF_ORDER.indexOf(tf); i >= 0; i--) {
        const text = await readFile(join(dir, `${symbol}_${TF_ORDER[i]}.csv`), "utf8").catch(() => null);
        if (text === null) continue;
        const candles = text
          .trim()
          .split(/\r?\n/)
          .map((line) => {
            const [time, open, high, low, close, vol] = line.split(",").map(Number);
            return { time: time - offset, open, high, low, close, tickVolume: vol || 0 };
          })
          .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close));
        return TF_ORDER[i] === tf ? candles : resample(candles, tf);
      }
      return null;
    },
  };
}

export function getProvider(): CandleProvider | null {
  const kind = process.env.MARKET_DATA_PROVIDER;
  if (kind === "file" && process.env.MARKET_DATA_DIR && process.env.NODE_ENV !== "production") {
    return fileProvider(process.env.MARKET_DATA_DIR);
  }
  return null;
}

/** At most this many bars of the requested timeframe are returned (enough for warm-up plus many windows). */
export const MAX_BARS = 12000;

const cache = new Map<string, { at: number; series: MarketSeries | null }>();
const CACHE_MS = 60 * 60 * 1000;

export async function loadSeries(symbol: string, tf: Timeframe): Promise<MarketSeries | null> {
  if (!SYMBOL_MAP[symbol] || !TF_ORDER.includes(tf)) return null;
  const provider = getProvider();
  if (!provider) return null;
  const key = `${provider.name}|${symbol}|${tf}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.series;
  const candles = await provider.load(symbol, tf);
  const series = candles && candles.length ? { symbol, tf, candles: candles.slice(-MAX_BARS), source: provider.name } : null;
  cache.set(key, { at: Date.now(), series });
  return series;
}

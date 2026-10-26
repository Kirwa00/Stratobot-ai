import type { Candle } from "../rules/interpret";
import type { Timeframe } from "../rules/types";
import { SYMBOL_MAP, type MarketSeries, type SymbolInfo } from "./types";

// Candles a trader exports from their own MetaTrader (MT5: Symbols > Bars >
// Export; MT4: History Center > Export). The file is parsed in the browser and
// never uploaded: it's the trader's own broker data, used only on their device.
//
// Accepted shapes:
//   MT5:  <DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>
//         2024.01.02\t00:00:00\t1.10372\t1.10398\t1.10348\t1.10380\t412\t0\t3
//         (daily exports have no <TIME> column)
//   MT4:  2024.01.02,00:00,1.1037,1.1039,1.1034,1.1038,412   (no header)

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
/** Newest candles kept from a file; enough for months of M1 or decades of H1. */
export const MAX_UPLOAD_CANDLES = 250_000;

const TIMEFRAMES: [Timeframe, number][] = [
  ["M1", 60],
  ["M5", 300],
  ["M15", 900],
  ["M30", 1800],
  ["H1", 3600],
  ["H4", 14400],
  ["D1", 86400],
  ["W1", 604800],
];

export interface ParsedExport {
  series: MarketSeries;
  /** Things the trader should know about how the file was read. */
  notes: string[];
}

export class ExportError extends Error {}

function parseTime(date: string, time: string | undefined): number {
  const d = date.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!d) return NaN;
  const t = (time ?? "00:00").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!t) return NaN;
  return Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2], +(t[3] ?? 0)) / 1000;
}

function decimals(s: string): number {
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.trim().length - i - 1;
}

function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** "EURUSD_H1_202401020000_202412312300.csv", "EURUSD.m H1.csv", "XAUUSD+.csv" → symbol and timeframe hints. */
export function hintsFromFilename(name: string): { symbol: string | null; tf: Timeframe | null } {
  const base = name.replace(/\.(csv|txt)$/i, "").toUpperCase();
  const tfMatch = base.match(/(?:^|[^A-Z0-9])(M1|M5|M15|M30|H1|H4|D1|W1)(?:[^A-Z0-9]|$)/);
  const letters = base.replace(/[^A-Z]/g, "");
  const known = Object.keys(SYMBOL_MAP).find((s) => letters.startsWith(s));
  const pair = known ?? letters.match(/^([A-Z]{6})/)?.[1] ?? null;
  return { symbol: pair, tf: (tfMatch?.[1] as Timeframe) ?? null };
}

function inferTimeframe(candles: Candle[]): Timeframe | null {
  const gaps: number[] = [];
  for (let i = 1; i < Math.min(candles.length, 2000); i++) gaps.push(candles[i].time - candles[i - 1].time);
  const g = median(gaps);
  const hit = TIMEFRAMES.find(([, s]) => s === g);
  return hit ? hit[0] : null;
}

/** Contract details for a pair: the built-in table, or an approximation from the prices themselves. */
export function symbolInfoFor(symbol: string, digits: number, lastClose: number, spreadPoints: number | null): { info: SymbolInfo; approximate: boolean } {
  const known = SYMBOL_MAP[symbol];
  if (known) {
    // Brokers differ on precision (gold at 2 or 3 digits); scale to the file's own.
    const point = digits > 0 ? 10 ** -digits : known.point;
    const scale = point / known.point;
    return {
      info: {
        ...known,
        digits: digits || known.digits,
        point,
        tickValue: known.tickValue * scale,
        spreadPoints: spreadPoints ?? Math.round(known.spreadPoints / scale),
      },
      approximate: false,
    };
  }
  const point = 10 ** -digits;
  const metal = /^X(AU|AG|PT|PD)/.test(symbol);
  const contract = metal ? (symbol.startsWith("XAU") ? 100 : 5000) : 100_000;
  const quote = symbol.slice(3, 6);
  // Value of one point for one lot in USD: exact when the quote currency is USD,
  // divided by the price when USD is the base, otherwise an estimate.
  const tickValue = quote === "USD" ? contract * point : symbol.startsWith("USD") ? (contract * point) / lastClose : contract * point;
  const label = symbol.length === 6 ? `${symbol.slice(0, 3)}/${quote}` : symbol;
  return {
    info: { symbol, label, digits, point, tickValue, spreadPoints: spreadPoints ?? (digits >= 4 ? 10 : 20) },
    approximate: quote !== "USD" && !symbol.startsWith("USD"),
  };
}

/**
 * Parse an MT4/MT5 history export. `gmtOffsetHours` is the broker's server
 * time zone (MT5 exports carry server time); candle times are shifted to GMT so
 * session rules line up.
 */
export function parseMetaTraderExport(text: string, filename: string, gmtOffsetHours: number, symbolOverride?: string): ParsedExport {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new ExportError("That file is empty.");

  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  let cols = { date: 0, time: 1 as number | null, open: 2, high: 3, low: 4, close: 5, vol: 6 as number | null, spread: null as number | null };
  let start = 0;
  const header = lines[0].toUpperCase();
  if (/<DATE>|\bDATE\b/.test(header)) {
    const h = lines[0].split(delim).map((x) => x.replace(/[<>"]/g, "").trim().toUpperCase());
    const at = (name: string) => {
      const i = h.indexOf(name);
      return i < 0 ? null : i;
    };
    const need = (name: string) => {
      const i = at(name);
      if (i === null) throw new ExportError(`The file has no ${name} column. Export bars from MetaTrader's Symbols window.`);
      return i;
    };
    cols = { date: need("DATE"), time: at("TIME"), open: need("OPEN"), high: need("HIGH"), low: need("LOW"), close: need("CLOSE"), vol: at("TICKVOL") ?? at("VOLUME") ?? at("VOL"), spread: at("SPREAD") };
    start = 1;
  } else if (lines[0].split(delim).length < 6) {
    throw new ExportError("This doesn't look like a MetaTrader price export.");
  } else if (!/^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}(\s|$)/.test(lines[0].split(delim)[0].trim())) {
    throw new ExportError("This doesn't look like a MetaTrader price export.");
  } else if (lines[0].split(delim)[1]?.includes(":") !== true) {
    // Headerless daily data: date, open, high, low, close, volume.
    cols = { date: 0, time: null, open: 1, high: 2, low: 3, close: 4, vol: 5, spread: null };
  }

  const offset = gmtOffsetHours * 3600;
  const candles: Candle[] = [];
  const spreads: number[] = [];
  let digits = 0;
  let bad = 0;
  for (let i = start; i < lines.length; i++) {
    const f = lines[i].split(delim);
    // Some exports put date and time in one field: "2024.01.02 00:00".
    const [date, inlineTime] = f[cols.date]?.trim().split(/\s+/) ?? [];
    const time = parseTime(date ?? "", cols.time === null ? inlineTime : f[cols.time]) - offset;
    const open = Number(f[cols.open]);
    const high = Number(f[cols.high]);
    const low = Number(f[cols.low]);
    const close = Number(f[cols.close]);
    if (![time, open, high, low, close].every(Number.isFinite) || high < low) {
      bad++;
      continue;
    }
    if (candles.length && time <= candles[candles.length - 1].time) {
      bad++;
      continue;
    }
    if (i - start < 500) digits = Math.max(digits, decimals(f[cols.close]), decimals(f[cols.open]));
    candles.push({ time, open, high, low, close, tickVolume: cols.vol === null ? 0 : Number(f[cols.vol]) || 0 });
    if (cols.spread !== null) {
      const sp = Number(f[cols.spread]);
      if (Number.isFinite(sp) && sp > 0) spreads.push(sp);
    }
  }
  if (candles.length < 50) throw new ExportError("Fewer than 50 readable candles in that file.");

  const notes: string[] = [];
  if (bad > 0) notes.push(`${bad.toLocaleString("en-GB")} unreadable or out-of-order rows were skipped.`);
  const kept = candles.length > MAX_UPLOAD_CANDLES ? candles.slice(-MAX_UPLOAD_CANDLES) : candles;
  if (kept.length < candles.length) notes.push(`Only the newest ${MAX_UPLOAD_CANDLES.toLocaleString("en-GB")} candles are used.`);

  const hints = hintsFromFilename(filename);
  const tf = inferTimeframe(kept) ?? hints.tf;
  if (!tf) throw new ExportError("Couldn't tell the timeframe of these candles.");

  const symbol = (symbolOverride || hints.symbol || "").toUpperCase();
  if (!symbol) throw new ExportError("Couldn't tell which symbol this is. Choose it below.");
  const spread = spreads.length ? median(spreads) : null;
  const { info, approximate } = symbolInfoFor(symbol, digits, kept[kept.length - 1].close, spread);
  if (approximate) notes.push(`Money values for ${info.label} are approximate; pips and trade timing are exact.`);
  if (spread === null) notes.push(`The file has no spread column, so a typical ${info.spreadPoints}-point spread is assumed.`);

  return { series: { symbol, tf, candles: kept, source: "your MetaTrader export", info }, notes };
}

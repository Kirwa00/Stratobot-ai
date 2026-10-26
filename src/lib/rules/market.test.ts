import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMPLES } from "./translate";
import { buildPath, marketShortfall, marketTimeframe, simulateRulesOnMarket, TF_SECONDS } from "./synthetic";
import { ExportError, hintsFromFilename, parseMetaTraderExport } from "../market/mt5-csv";
import type { MarketSeries } from "../market/types";
import type { Candle } from "./interpret";

// Real-candle logic check: MetaTrader export parsing, and running rules over a
// window of real (here: generated, but fed through the same path) history.

const pad = (n: number) => String(n).padStart(2, "0");
function mt5Date(sec: number) {
  const d = new Date(sec * 1000);
  return [`${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`, `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`];
}

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function candles(count: number, tfSeconds: number): Candle[] {
  return buildPath(count, tfSeconds, seeded(42));
}

function mt5Text(cs: Candle[], digits = 5, offsetSec = 0) {
  const rows = cs.map((c) => {
    const [d, t] = mt5Date(c.time + offsetSec);
    return [d, t, c.open.toFixed(digits), c.high.toFixed(digits), c.low.toFixed(digits), c.close.toFixed(digits), c.tickVolume, 0, 7].join("\t");
  });
  return ["<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>", ...rows].join("\r\n");
}

test("an MT5 bar export is read with its symbol, timeframe, spread and GMT offset", () => {
  const cs = candles(600, 3600);
  const { series, notes } = parseMetaTraderExport(mt5Text(cs, 5, 2 * 3600), "EURUSD.m_H1_202401020000_202412312300.csv", 2);
  assert.equal(series.symbol, "EURUSD");
  assert.equal(series.tf, "H1");
  assert.equal(series.candles.length, 600);
  assert.equal(series.candles[0].time, cs[0].time, "server time shifted back to GMT");
  assert.equal(series.info?.spreadPoints, 7);
  assert.equal(series.info?.digits, 5);
  assert.deepEqual(notes, []);
});

test("an MT4-style headerless comma export is read too", () => {
  const cs = candles(300, 900);
  const text = cs
    .map((c) => {
      const [d, t] = mt5Date(c.time);
      return [d, t.slice(0, 5), c.open.toFixed(5), c.high.toFixed(5), c.low.toFixed(5), c.close.toFixed(5), 10].join(",");
    })
    .join("\n");
  const { series, notes } = parseMetaTraderExport(text, "GBPUSD15.csv", 0);
  assert.equal(series.symbol, "GBPUSD");
  assert.equal(series.tf, "M15");
  assert.ok(notes.some((n) => n.includes("spread")));
});

test("files that aren't price exports are refused with a reason", () => {
  assert.throws(() => parseMetaTraderExport("name,email\nann,a@b.c\n", "x.csv", 0), ExportError);
  assert.throws(() => parseMetaTraderExport("", "x.csv", 0), ExportError);
});

test("broker suffixes and file names give symbol and timeframe hints", () => {
  assert.deepEqual(hintsFromFilename("XAUUSD+_M5_2024.csv"), { symbol: "XAUUSD", tf: "M5" });
  assert.deepEqual(hintsFromFilename("eurjpy-h4.csv"), { symbol: "EURJPY", tf: "H4" });
});

test("rules run on real history: a dated window, real source, trades inside it", () => {
  const rules = EXAMPLES[0].output.rules!;
  const tf = marketTimeframe(rules);
  const series: MarketSeries = { symbol: "EURUSD", tf, candles: candles(3000, TF_SECONDS[tf]), source: "test" };
  assert.equal(marketShortfall(rules, series), 0);
  const r = simulateRulesOnMarket(rules, series, 0)!;
  assert.ok(r);
  assert.equal(r.source?.kind, "real");
  assert.match(r.source && r.source.kind === "real" ? r.source.label : "", /EUR\/USD, .* candles, \d+ \w+ \d{4} to \d+ \w+ \d{4}/);
  assert.equal(r.candles.length, 150);
  for (const t of r.trades) assert.ok(t.candle >= 0 && t.candle < 150);
  // Different runs look at different stretches of history.
  assert.notDeepEqual(simulateRulesOnMarket(rules, series, 1)!.candles, r.candles);
});

test("finer candles are resampled up; coarser or too-short history is refused", () => {
  const rules = { ...EXAMPLES[0].output.rules!, timeframe: "H1" as const };
  const m15: MarketSeries = { symbol: "EURUSD", tf: "M15", candles: candles(12000, 900), source: "test" };
  assert.ok(simulateRulesOnMarket(rules, m15, 0));
  const d1: MarketSeries = { symbol: "EURUSD", tf: "D1", candles: candles(400, 86400), source: "test" };
  assert.equal(marketShortfall(rules, d1), null);
  assert.equal(simulateRulesOnMarket(rules, d1, 0), null);
  const short: MarketSeries = { symbol: "EURUSD", tf: "H1", candles: candles(60, 3600), source: "test" };
  assert.ok((marketShortfall(rules, short) ?? 0) > 0);
  assert.equal(simulateRulesOnMarket(rules, short, 0), null);
});

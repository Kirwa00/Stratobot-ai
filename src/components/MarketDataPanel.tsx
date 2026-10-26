"use client";

import { useEffect, useId, useState } from "react";
import { useStrategyStore } from "@/lib/store";
import { marketShortfall, marketTimeframe } from "@/lib/rules/synthetic";
import { ExportError, MAX_UPLOAD_BYTES, parseMetaTraderExport } from "@/lib/market/mt5-csv";
import { strategyRules } from "@/lib/simulate";

// Lets a trader run the logic check on candles exported from their own
// MetaTrader. The file is read in the browser and kept in memory only: nothing
// is uploaded, so there's no market-data licence question and no storage.

const OFFSETS = Array.from({ length: 25 }, (_, i) => i - 12);
const day = (sec: number) =>
  new Date(sec * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function MarketDataPanel() {
  const { strategy, market, setMarketSeries } = useStrategyStore();
  const fileId = useId();
  const offsetId = useId();
  const symbolId = useId();
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [offset, setOffset] = useState(2);
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Re-read the file whenever the time zone or symbol changes.
  useEffect(() => {
    if (!file) return;
    try {
      const parsed = parseMetaTraderExport(file.text, file.name, offset, symbol || undefined);
      /* eslint-disable react-hooks/set-state-in-effect */
      setError(null);
      setNotes(parsed.notes);
      /* eslint-enable react-hooks/set-state-in-effect */
      setMarketSeries(parsed.series);
    } catch (e) {
      setError(e instanceof ExportError ? e.message : "Couldn't read that file.");
      setNotes([]);
      setMarketSeries(null);
    }
  }, [file, offset, symbol, setMarketSeries]);

  const rules = strategy ? strategyRules(strategy) : null;
  if (!rules) return null;

  const need = marketTimeframe(rules);
  const shortfall = market ? marketShortfall(rules, market) : 0;

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_UPLOAD_BYTES) {
      setError("That file is over 30 MB. Export a shorter date range.");
      return;
    }
    setFile({ name: f.name, text: await f.text() });
  }

  function clear() {
    setFile(null);
    setError(null);
    setNotes([]);
    setSymbol("");
    setMarketSeries(null);
  }

  return (
    <section aria-label="Price data" className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1">Price data</p>
          {market ? (
            <p className="text-sm text-chalk/85">
              Your {market.info?.label ?? market.symbol} {market.tf} export:{" "}
              {market.candles.length.toLocaleString("en-GB")} candles, {day(market.candles[0].time)} to{" "}
              {day(market.candles[market.candles.length - 1].time)}
            </p>
          ) : (
            <p className="text-sm text-chalk/85">A made-up price path. Check on real candles from your own MT5 instead:</p>
          )}
        </div>
        {market && (
          <button type="button" onClick={clear} className="text-xs text-secondary hover:underline shrink-0">
            Use made-up path
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={fileId} className="text-sm font-medium text-chalk">
          {market ? "Replace file" : "MT5 price export (.csv)"}
        </label>
        <input
          id={fileId}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="text-sm text-chalk/80 file:mr-3 file:rounded-full file:border-0 file:bg-signal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-signal"
        />
        <p className="text-xs text-chalk/55">
          Your strategy runs on {need} candles: export {need} or a lower timeframe. The file stays on this
          device.
        </p>
      </div>

      {file && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={offsetId} className="text-xs font-medium text-chalk">
              Broker server time
            </label>
            <select
              id={offsetId}
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              className="rounded-lg border border-outline bg-slate-high text-chalk px-2 py-2 text-sm"
            >
              {OFFSETS.map((o) => (
                <option key={o} value={o}>
                  GMT{o >= 0 ? "+" : ""}
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={symbolId} className="text-xs font-medium text-chalk">
              Symbol
            </label>
            <input
              id={symbolId}
              value={symbol || market?.symbol || ""}
              onChange={(e) => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. EURUSD"
              className="rounded-lg border border-outline bg-slate-high text-chalk px-2 py-2 text-sm"
            />
          </div>
          <p className="col-span-2 text-xs text-chalk/55 -mt-1">
            Most brokers run on GMT+2 in winter and GMT+3 in summer. It matters for session rules
            (London, New York): compare MT5&apos;s Market Watch clock with GMT.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-sell">
          {error}
        </p>
      )}
      {market && shortfall === null && (
        <p role="alert" className="text-xs text-sell">
          These are {market.tf} candles, but your strategy runs on {need}. Export {need} or a lower
          timeframe.
        </p>
      )}
      {market && shortfall !== null && shortfall > 0 && (
        <p role="alert" className="text-xs text-sell">
          Not enough history for your indicators: export at least {shortfall.toLocaleString("en-GB")} more{" "}
          {need} candles.
        </p>
      )}
      {notes.map((n) => (
        <p key={n} className="text-xs text-chalk/55">
          {n}
        </p>
      ))}

      <button
        type="button"
        onClick={() => setShowHelp((v) => !v)}
        className="self-start text-xs text-secondary hover:underline"
        aria-expanded={showHelp}
      >
        {showHelp ? "Hide" : "How do I export candles from MT5?"}
      </button>
      {showHelp && (
        <ol className="text-xs text-chalk/75 leading-relaxed list-decimal pl-5 flex flex-col gap-1">
          <li>In MetaTrader 5, open View → Symbols (Ctrl+U).</li>
          <li>Open the Bars tab, pick your symbol and the {need} timeframe (or lower).</li>
          <li>Choose a date range of a few months, press Request, then Export Bars.</li>
          <li>Save the .csv and choose it above.</li>
        </ol>
      )}
    </section>
  );
}

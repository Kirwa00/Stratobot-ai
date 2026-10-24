"use client";

import { useId, useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

// How a pair's pip value reaches a USD account:
//  - "usd":  quote currency is USD, so no conversion (EUR/USD).
//  - "div":  divide by the USD/quote price (USD/JPY, EUR/JPY → USD/JPY).
//  - "mul":  multiply by the quote/USD price (EUR/GBP → GBP/USD).
type Conv = { kind: "usd" } | { kind: "div" | "mul"; ratePair: string };

const PAIRS: { pair: string; conv: Conv }[] = [
  { pair: "EUR/USD", conv: { kind: "usd" } },
  { pair: "GBP/USD", conv: { kind: "usd" } },
  { pair: "AUD/USD", conv: { kind: "usd" } },
  { pair: "NZD/USD", conv: { kind: "usd" } },
  { pair: "USD/JPY", conv: { kind: "div", ratePair: "USD/JPY" } },
  { pair: "USD/CHF", conv: { kind: "div", ratePair: "USD/CHF" } },
  { pair: "USD/CAD", conv: { kind: "div", ratePair: "USD/CAD" } },
  { pair: "EUR/JPY", conv: { kind: "div", ratePair: "USD/JPY" } },
  { pair: "GBP/JPY", conv: { kind: "div", ratePair: "USD/JPY" } },
  { pair: "AUD/JPY", conv: { kind: "div", ratePair: "USD/JPY" } },
  { pair: "EUR/CHF", conv: { kind: "div", ratePair: "USD/CHF" } },
  { pair: "EUR/GBP", conv: { kind: "mul", ratePair: "GBP/USD" } },
  { pair: "EUR/AUD", conv: { kind: "mul", ratePair: "AUD/USD" } },
  { pair: "GBP/AUD", conv: { kind: "mul", ratePair: "AUD/USD" } },
];

export function PipCalculator() {
  const selectId = useId();
  const [pair, setPair] = useState("EUR/USD");
  const [lots, setLots] = useState<number | "">(1);
  const [rate, setRate] = useState<number | "">("");
  const [usdKes, setUsdKes] = useState<number | "">("");

  const { conv } = PAIRS.find((p) => p.pair === pair)!;
  const quote = pair.split("/")[1];
  const pipSize = quote === "JPY" ? 0.01 : 0.0001;
  const units = (Number(lots) || 0) * 100000;
  const pipInQuote = pipSize * units;
  const r = Number(rate) || 0;

  const pipUsd =
    conv.kind === "usd" ? pipInQuote : r > 0 ? (conv.kind === "div" ? pipInQuote / r : pipInQuote * r) : null;
  const kes = Number(usdKes) || 0;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={selectId} className="text-sm font-medium text-chalk">
            Currency pair
          </label>
          <select
            id={selectId}
            value={pair}
            onChange={(e) => {
              setPair(e.target.value);
              setRate("");
            }}
            className="w-full rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          >
            {PAIRS.map((p) => (
              <option key={p.pair} value={p.pair}>
                {p.pair}
              </option>
            ))}
          </select>
        </div>
        <CalcField label="Position size" value={lots} onChange={setLots} unit="lots" step={0.01} min={0} />
        {conv.kind !== "usd" && (
          <CalcField
            label={`Current ${conv.ratePair} price`}
            value={rate}
            onChange={setRate}
            step={0.0001}
            min={0}
            placeholder={`Copy it from your ${conv.ratePair} chart`}
          />
        )}
        <CalcField
          label="USD/KES rate (optional)"
          value={usdKes}
          onChange={setUsdKes}
          unit="KES"
          min={0}
          placeholder="Add it to see pip value in shillings"
        />
      </div>

      <CalcResultGroup>
        <CalcResult
          label="Pip value"
          value={pipUsd === null ? `Enter the ${conv.kind !== "usd" ? conv.ratePair : ""} price` : `$${fmt(pipUsd)} / pip`}
          emphasis
        />
        {pipUsd !== null && kes > 0 && <CalcResult label="In shillings" value={`KES ${fmt(pipUsd * kes)} / pip`} />}
        <CalcResult label={`Pip value in ${quote}`} value={`${fmt(pipInQuote)} ${quote} / pip`} />
        <CalcResult label="Pip size" value={pipSize.toString()} />
        <CalcResult label="Units" value={units.toLocaleString("en-US")} />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        Pip value = pip size × units, converted into US dollars at the price you enter. Your
        broker may differ slightly (contract size, account currency, rounding). This tells you
        what a pip is worth — not whether a trade is a good idea.
      </p>
    </div>
  );
}

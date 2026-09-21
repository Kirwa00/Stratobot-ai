"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult } from "./CalcResult";

export function ForexProfitCalculator() {
  const [pips, setPips] = useState<number | "">(25);
  const [lots, setLots] = useState<number | "">(0.5);
  const [pipValue, setPipValue] = useState<number | "">(10);

  const p = Number(pips) || 0;
  const l = Number(lots) || 0;
  const pv = Number(pipValue) || 0;

  const profit = p * l * pv;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField
          label="Pips gained or lost"
          value={pips}
          onChange={setPips}
          unit="pips"
          placeholder="Negative for a loss"
        />
        <CalcField label="Position size" value={lots} onChange={setLots} unit="lots" step={0.01} />
        <CalcField
          label="Pip value per standard lot"
          value={pipValue}
          onChange={setPipValue}
          unit="$"
        />
      </div>

      <CalcResult
        label={profit >= 0 ? "Profit" : "Loss"}
        value={`${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`}
        emphasis
      />

      <p className="text-xs text-chalk/50 leading-relaxed">
        This calculates the P/L for a specific trade you specify — it doesn&apos;t predict what
        any future trade will do. Doesn&apos;t include spread, commission, or swap; see the{" "}
        trading cost calculator for those.
      </p>
    </div>
  );
}

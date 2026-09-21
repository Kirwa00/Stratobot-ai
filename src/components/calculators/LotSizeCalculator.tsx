"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function LotSizeCalculator() {
  const [lots, setLots] = useState<number | "">(0.1);
  const [pipValuePerStandardLot, setPipValuePerStandardLot] = useState<number | "">(10);

  const l = Number(lots) || 0;
  const pvStd = Number(pipValuePerStandardLot) || 0;

  const units = l * 100000;
  const standardLots = l;
  const miniLots = l * 10;
  const microLots = l * 100;
  const pipValue = pvStd * l;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField label="Lot size" value={lots} onChange={setLots} unit="lots" step={0.01} />
        <CalcField
          label="Pip value per standard lot"
          value={pipValuePerStandardLot}
          onChange={setPipValuePerStandardLot}
          unit="$"
          placeholder="Usually ~$10 for most USD-quoted pairs"
        />
      </div>

      <CalcResultGroup>
        <CalcResult label="Units" value={units.toLocaleString("en-US")} emphasis />
        <CalcResult label="Standard lots" value={standardLots.toFixed(2)} />
        <CalcResult label="Mini lots" value={miniLots.toFixed(2)} />
        <CalcResult label="Micro lots" value={microLots.toFixed(2)} />
        <CalcResult label="Pip value at this size" value={`$${pipValue.toFixed(2)} / pip`} />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        1 standard lot = 100,000 units = 10 mini lots = 100 micro lots. Pip value scales linearly
        with lot size.
      </p>
    </div>
  );
}

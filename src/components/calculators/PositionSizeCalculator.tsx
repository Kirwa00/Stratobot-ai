"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function PositionSizeCalculator() {
  const [balance, setBalance] = useState<number | "">(1000);
  const [riskPct, setRiskPct] = useState<number | "">(1);
  const [stopLossPips, setStopLossPips] = useState<number | "">(20);
  const [pipValue, setPipValue] = useState<number | "">(10);

  const b = Number(balance) || 0;
  const r = Number(riskPct) || 0;
  const sl = Number(stopLossPips) || 0;
  const pv = Number(pipValue) || 0;

  const riskAmount = b * (r / 100);
  const lots = sl > 0 && pv > 0 ? riskAmount / (sl * pv) : 0;
  const units = lots * 100000;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField
          label="Account balance"
          value={balance}
          onChange={setBalance}
          unit="$"
        />
        <CalcField
          label="Risk per trade"
          value={riskPct}
          onChange={setRiskPct}
          unit="%"
          step={0.1}
        />
        <CalcField
          label="Stop-loss distance"
          value={stopLossPips}
          onChange={setStopLossPips}
          unit="pips"
        />
        <CalcField
          label="Pip value per standard lot"
          value={pipValue}
          onChange={setPipValue}
          unit="$"
          placeholder="Usually ~$10 for most USD-quoted pairs"
        />
      </div>

      <CalcResultGroup>
        <CalcResult label="Amount at risk" value={`$${riskAmount.toFixed(2)}`} />
        <CalcResult label="Position size" value={`${lots.toFixed(2)} lots`} emphasis />
        <CalcResult label="In units" value={units.toLocaleString("en-US")} />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        Pip value per lot varies by pair and account currency — check your broker&apos;s contract
        specs for the exact figure rather than assuming $10 for every pair.
      </p>
    </div>
  );
}

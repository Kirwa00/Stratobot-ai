"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function ForexRiskCalculator() {
  const [lots, setLots] = useState<number | "">(0.5);
  const [stopLossPips, setStopLossPips] = useState<number | "">(20);
  const [pipValue, setPipValue] = useState<number | "">(10);
  const [balance, setBalance] = useState<number | "">(1000);

  const l = Number(lots) || 0;
  const sl = Number(stopLossPips) || 0;
  const pv = Number(pipValue) || 0;
  const b = Number(balance) || 0;

  const riskAmount = l * sl * pv;
  const riskPct = b > 0 ? (riskAmount / b) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField label="Position size" value={lots} onChange={setLots} unit="lots" step={0.01} />
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
        />
        <CalcField label="Account balance" value={balance} onChange={setBalance} unit="$" />
      </div>

      <CalcResultGroup>
        <CalcResult label="Amount at risk" value={`$${riskAmount.toFixed(2)}`} emphasis />
        <CalcResult label="% of account at risk" value={`${riskPct.toFixed(2)}%`} />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        This is the risk on this one trade if your stop-loss is hit — it doesn&apos;t account for
        other open positions or correlated exposure.
      </p>
    </div>
  );
}

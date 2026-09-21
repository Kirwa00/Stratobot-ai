"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult } from "./CalcResult";

export function RiskOfRuinCalculator() {
  const [winRatePct, setWinRatePct] = useState<number | "">(55);
  const [riskPerTradePct, setRiskPerTradePct] = useState<number | "">(2);

  const winRate = Math.min(1, Math.max(0, (Number(winRatePct) || 0) / 100));
  const riskFraction = Math.max(0.0001, (Number(riskPerTradePct) || 0) / 100);

  const edge = 2 * winRate - 1;
  const capitalUnits = 1 / riskFraction;
  const base = (1 - edge) / (1 + edge);
  const rawRuin = Math.pow(Math.max(0, base), capitalUnits);
  const ruinPct = Math.min(100, Math.max(0, rawRuin * 100));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField label="Win rate" value={winRatePct} onChange={setWinRatePct} unit="%" />
        <CalcField
          label="Risk per trade"
          value={riskPerTradePct}
          onChange={setRiskPerTradePct}
          unit="%"
          step={0.1}
        />
      </div>

      <CalcResult label="Estimated risk of ruin" value={`${ruinPct.toFixed(1)}%`} emphasis />

      <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
        <p className="text-xs text-chalk/80 leading-relaxed">
          This uses a simplified model that assumes a roughly 1:1 reward-to-risk ratio and a
          constant win rate across every trade — real trading rarely holds either assumption
          exactly. Treat this as a rough sensitivity check on risk-per-trade, not a precise
          prediction of ruin.
        </p>
      </div>
    </div>
  );
}

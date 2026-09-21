"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function CompoundTradingCalculator() {
  const [startBalance, setStartBalance] = useState<number | "">(1000);
  const [returnPct, setReturnPct] = useState<number | "">(2);
  const [periods, setPeriods] = useState<number | "">(12);

  const start = Number(startBalance) || 0;
  const rate = Number(returnPct) || 0;
  const n = Math.max(0, Math.floor(Number(periods) || 0));

  const finalBalance = start * Math.pow(1 + rate / 100, n);
  const totalGrowthPct = start > 0 ? ((finalBalance - start) / start) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField
          label="Starting balance"
          value={startBalance}
          onChange={setStartBalance}
          unit="$"
        />
        <CalcField
          label="Return per period"
          value={returnPct}
          onChange={setReturnPct}
          unit="%"
          step={0.1}
        />
        <CalcField label="Number of periods" value={periods} onChange={setPeriods} unit="periods" />
      </div>

      <CalcResultGroup>
        <CalcResult label="Ending balance" value={`$${finalBalance.toFixed(2)}`} emphasis />
        <CalcResult label="Total growth" value={`${totalGrowthPct.toFixed(1)}%`} />
      </CalcResultGroup>

      <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
        <p className="text-xs text-chalk/80 leading-relaxed">
          This assumes the exact same % return every single period, compounding with no losing
          periods — something no real trading strategy delivers. It&apos;s a demonstration of how
          compounding math works, not a projection of what any strategy, EA, or account will
          actually return.
        </p>
      </div>
    </div>
  );
}

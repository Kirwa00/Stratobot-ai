"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function DrawdownCalculator() {
  const [startBalance, setStartBalance] = useState<number | "">(10000);
  const [currentBalance, setCurrentBalance] = useState<number | "">(8000);

  const start = Number(startBalance) || 0;
  const current = Number(currentBalance) || 0;

  const loss = Math.max(0, start - current);
  const drawdownPct = start > 0 ? (loss / start) * 100 : 0;
  const recoveryPct = drawdownPct < 100 ? (drawdownPct / (100 - drawdownPct)) * 100 : Infinity;

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
          label="Current balance"
          value={currentBalance}
          onChange={setCurrentBalance}
          unit="$"
        />
      </div>

      <CalcResultGroup>
        <CalcResult label="Amount lost" value={`$${loss.toFixed(2)}`} />
        <CalcResult label="Drawdown" value={`${drawdownPct.toFixed(2)}%`} emphasis />
        <CalcResult
          label="Gain needed to recover"
          value={Number.isFinite(recoveryPct) ? `${recoveryPct.toFixed(2)}%` : "100% loss — no recovery from zero"}
        />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        Recovery math is asymmetric: a 20% drawdown needs a 25% gain to recover, a 50% drawdown
        needs 100%. The deeper the drawdown, the harder the climb back.
      </p>
    </div>
  );
}

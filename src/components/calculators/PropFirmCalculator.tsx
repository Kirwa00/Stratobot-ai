"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function PropFirmCalculator() {
  const [accountSize, setAccountSize] = useState<number | "">(100000);
  const [profitTargetPct, setProfitTargetPct] = useState<number | "">(10);
  const [maxDailyLossPct, setMaxDailyLossPct] = useState<number | "">(5);
  const [maxOverallDrawdownPct, setMaxOverallDrawdownPct] = useState<number | "">(10);

  const size = Number(accountSize) || 0;
  const target = Number(profitTargetPct) || 0;
  const dailyLoss = Number(maxDailyLossPct) || 0;
  const overallDd = Number(maxOverallDrawdownPct) || 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField
          label="Account (challenge) size"
          value={accountSize}
          onChange={setAccountSize}
          unit="$"
        />
        <CalcField
          label="Profit target"
          value={profitTargetPct}
          onChange={setProfitTargetPct}
          unit="%"
        />
        <CalcField
          label="Max daily loss limit"
          value={maxDailyLossPct}
          onChange={setMaxDailyLossPct}
          unit="%"
        />
        <CalcField
          label="Max overall drawdown limit"
          value={maxOverallDrawdownPct}
          onChange={setMaxOverallDrawdownPct}
          unit="%"
        />
      </div>

      <CalcResultGroup>
        <CalcResult
          label="Profit target"
          value={`$${((size * target) / 100).toFixed(2)}`}
          emphasis
        />
        <CalcResult label="Max daily loss" value={`$${((size * dailyLoss) / 100).toFixed(2)}`} />
        <CalcResult
          label="Max overall drawdown"
          value={`$${((size * overallDd) / 100).toFixed(2)}`}
        />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        Enter the % rules from your specific prop firm&apos;s challenge — they vary by firm and
        account size, so check your firm&apos;s actual terms rather than assuming these defaults.
      </p>
    </div>
  );
}

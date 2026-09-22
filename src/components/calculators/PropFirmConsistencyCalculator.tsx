"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function PropFirmConsistencyCalculator() {
  const [totalProfit, setTotalProfit] = useState<number | "">(10000);
  const [consistencyLimitPct, setConsistencyLimitPct] = useState<number | "">(30);
  const [bestDayProfit, setBestDayProfit] = useState<number | "">(2500);

  const total = Number(totalProfit) || 0;
  const limitPct = Number(consistencyLimitPct) || 0;
  const bestDay = Number(bestDayProfit) || 0;

  const maxAllowedDay = (total * limitPct) / 100;
  const bestDayPct = total > 0 ? (bestDay / total) * 100 : 0;
  const hasBestDay = bestDayProfit !== "";
  const breaches = hasBestDay && total > 0 && bestDay > maxAllowedDay;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField
          label="Total profit so far (or profit target)"
          value={totalProfit}
          onChange={setTotalProfit}
          unit="$"
        />
        <CalcField
          label="Consistency rule limit"
          value={consistencyLimitPct}
          onChange={setConsistencyLimitPct}
          unit="%"
        />
        <CalcField
          label="Your best single day's profit (optional)"
          value={bestDayProfit}
          onChange={setBestDayProfit}
          unit="$"
        />
      </div>

      <CalcResultGroup>
        <CalcResult
          label="Max allowed profit in a single day"
          value={`$${maxAllowedDay.toFixed(2)}`}
          emphasis
        />
        {hasBestDay && (
          <CalcResult
            label="Your best day as % of total profit"
            value={`${bestDayPct.toFixed(1)}%`}
          />
        )}
      </CalcResultGroup>

      {hasBestDay && total > 0 && (
        <div
          className={`rounded-lg border px-4 py-3.5 ${
            breaches ? "border-sell bg-sell/10" : "border-buy bg-buy/10"
          }`}
        >
          <p className={`text-sm font-semibold ${breaches ? "text-sell" : "text-buy"}`}>
            {breaches ? "This would breach the consistency rule" : "Within the consistency limit"}
          </p>
          <p className="text-xs text-chalk/70 mt-1 leading-relaxed">
            {breaches
              ? "One day made up too much of your total profit for this limit. Some firms fail the evaluation for this, others just hold or reduce the payout — check which applies to your firm."
              : "No single day is carrying more than the limit allows, based on the numbers entered."}
          </p>
        </div>
      )}

      <p className="text-xs text-chalk/50 leading-relaxed">
        Consistency rules vary a lot by prop firm — some use 20%, some 30% or 40%, some don&apos;t
        have one at all, and some check it continuously rather than only at payout. Enter your
        specific firm&apos;s published limit rather than assuming the default here.
      </p>
    </div>
  );
}

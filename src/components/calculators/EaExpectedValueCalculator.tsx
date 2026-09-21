"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function EaExpectedValueCalculator() {
  const [winRatePct, setWinRatePct] = useState<number | "">(45);
  const [avgWin, setAvgWin] = useState<number | "">(60);
  const [avgLoss, setAvgLoss] = useState<number | "">(30);
  const [trades, setTrades] = useState<number | "">(100);

  const winRate = Math.min(1, Math.max(0, (Number(winRatePct) || 0) / 100));
  const win = Number(avgWin) || 0;
  const loss = Number(avgLoss) || 0;
  const n = Math.max(0, Number(trades) || 0);

  const expectedValuePerTrade = winRate * win - (1 - winRate) * loss;
  const expectedTotal = expectedValuePerTrade * n;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField label="Win rate" value={winRatePct} onChange={setWinRatePct} unit="%" />
        <CalcField label="Average win" value={avgWin} onChange={setAvgWin} unit="$" />
        <CalcField label="Average loss" value={avgLoss} onChange={setAvgLoss} unit="$" />
        <CalcField label="Number of trades" value={trades} onChange={setTrades} unit="trades" />
      </div>

      <CalcResultGroup>
        <CalcResult
          label="Expected value per trade"
          value={`${expectedValuePerTrade >= 0 ? "+" : ""}$${expectedValuePerTrade.toFixed(2)}`}
        />
        <CalcResult
          label={`Expected total over ${n} trades`}
          value={`${expectedTotal >= 0 ? "+" : ""}$${expectedTotal.toFixed(2)}`}
          emphasis
        />
      </CalcResultGroup>

      <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
        <p className="text-xs text-chalk/80 leading-relaxed">
          This is a theoretical expected value calculated from the win rate and average win/loss{" "}
          <em>you enter</em> — typically pulled from a backtest or logic check. It is not a
          prediction of what any EA will actually earn; real results depend on live market
          conditions the inputs can&apos;t capture.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CalcField } from "./CalcField";
import { CalcResult, CalcResultGroup } from "./CalcResult";

export function TradingCostCalculator() {
  const [lots, setLots] = useState<number | "">(0.5);
  const [trades, setTrades] = useState<number | "">(20);
  const [spreadPips, setSpreadPips] = useState<number | "">(1.2);
  const [pipValue, setPipValue] = useState<number | "">(10);
  const [commissionPerLot, setCommissionPerLot] = useState<number | "">(7);
  const [swapPerLotPerNight, setSwapPerLotPerNight] = useState<number | "">(0);
  const [avgNightsHeld, setAvgNightsHeld] = useState<number | "">(0);

  const l = Number(lots) || 0;
  const t = Math.max(0, Number(trades) || 0);
  const spread = Number(spreadPips) || 0;
  const pv = Number(pipValue) || 0;
  const commission = Number(commissionPerLot) || 0;
  const swap = Number(swapPerLotPerNight) || 0;
  const nights = Number(avgNightsHeld) || 0;

  const spreadCost = spread * pv * l * t;
  const commissionCost = commission * l * t;
  const swapCost = swap * l * nights * t;
  const total = spreadCost + commissionCost + swapCost;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <CalcField label="Position size per trade" value={lots} onChange={setLots} unit="lots" step={0.01} />
        <CalcField label="Number of trades" value={trades} onChange={setTrades} unit="trades" />
        <CalcField label="Spread" value={spreadPips} onChange={setSpreadPips} unit="pips" step={0.1} />
        <CalcField label="Pip value per standard lot" value={pipValue} onChange={setPipValue} unit="$" />
        <CalcField
          label="Commission per lot (round-turn)"
          value={commissionPerLot}
          onChange={setCommissionPerLot}
          unit="$"
        />
        <CalcField
          label="Swap per lot per night"
          value={swapPerLotPerNight}
          onChange={setSwapPerLotPerNight}
          unit="$"
          placeholder="0 if you close trades same-day"
        />
        <CalcField
          label="Average nights held"
          value={avgNightsHeld}
          onChange={setAvgNightsHeld}
          unit="nights"
        />
      </div>

      <CalcResultGroup>
        <CalcResult label="Spread cost" value={`$${spreadCost.toFixed(2)}`} />
        <CalcResult label="Commission cost" value={`$${commissionCost.toFixed(2)}`} />
        <CalcResult label="Swap cost" value={`$${swapCost.toFixed(2)}`} />
        <CalcResult label="Total trading cost" value={`$${total.toFixed(2)}`} emphasis />
      </CalcResultGroup>

      <p className="text-xs text-chalk/50 leading-relaxed">
        Spreads, commissions, and swap rates vary by broker and instrument — check your broker&apos;s
        actual figures rather than assuming these defaults.
      </p>
    </div>
  );
}

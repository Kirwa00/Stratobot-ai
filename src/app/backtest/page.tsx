"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useStrategyStore } from "@/lib/store";
import { aggregateSimulationStats, type AggregateStats } from "@/lib/simulate";

// Runs many independent logic-check passes and aggregates them — same
// honest engine as /simulate (src/lib/simulate.ts), just a bigger sample so
// a trader can see whether one run's trade count was typical or a fluke.
// Deliberately does NOT compute P&L, win rate, Sharpe ratio, or anything
// else that would imply this predicts real profitability — that's the one
// rule the rest of this app holds to everywhere else, and this page held it
// too until it briefly showed a hardcoded $1,980.20 / 60.3% mock result.

const RUN_OPTIONS = [5, 10, 25];

export default function BacktestPage() {
  const router = useRouter();
  const { strategy, simsRemaining, runBatchSim } = useStrategyStore();
  const [runCount, setRunCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [ranWith, setRanWith] = useState(0);

  if (!strategy || strategy.blocks.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        <Header back title="Extended Check" />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
          <span className="material-symbols-outlined text-4xl text-chalk/20">candlestick_chart</span>
          <p className="text-sm text-chalk/60">No strategy loaded to check.</p>
          <Button onClick={() => router.push("/adjust?new=1")}>Create strategy</Button>
        </main>
      </div>
    );
  }

  function handleRun() {
    const n = Math.min(runCount, simsRemaining);
    if (n === 0) return;
    setIsRunning(true);
    // Small delay so the run feels deliberate rather than instant — the
    // work itself (N synthetic paths) is cheap and synchronous.
    window.setTimeout(() => {
      const results = runBatchSim(n);
      setStats(aggregateSimulationStats(results, strategy!.blocks));
      setRanWith(results.length);
      setIsRunning(false);
    }, 500);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Extended Check" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-6 flex flex-col gap-5">
        <div className="p-4 rounded-lg border border-outline bg-slate">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-chalk">{strategy.name}</h3>
            <span className="text-xs text-chalk/50">{strategy.blocks.length} blocks</span>
          </div>
          <p className="text-xs text-chalk/60 line-clamp-2">{strategy.readback}</p>
        </div>

        <div>
          <p className="text-sm text-chalk/80 leading-relaxed">
            One simulation is one synthetic price path. Running several at once shows whether your
            rules fire consistently, or whether the last run was a fluke — still not a prediction of
            profit.
          </p>
        </div>

        <div>
          <p className="text-xs text-chalk/50 mb-2 uppercase tracking-wide">Number of runs</p>
          <div className="flex gap-2">
            {RUN_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setRunCount(n)}
                disabled={n > simsRemaining && n !== runCount}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                  runCount === n
                    ? "bg-signal text-white border-signal"
                    : "bg-slate text-chalk/70 border-outline hover:bg-slate-high"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-chalk/50 mt-2">
            {simsRemaining} simulation{simsRemaining === 1 ? "" : "s"} left. Each run in the batch
            counts as one.
          </p>
        </div>

        <Button className="w-full" onClick={handleRun} disabled={isRunning || simsRemaining === 0}>
          {isRunning ? (
            <>
              <span className="material-symbols-outlined animate-spin mr-2 text-base">refresh</span>
              Running {Math.min(runCount, simsRemaining)} checks…
            </>
          ) : simsRemaining === 0 ? (
            "No simulations left"
          ) : (
            `Run ${Math.min(runCount, simsRemaining)} checks`
          )}
        </Button>

        <div className="p-3 rounded-lg border border-outline bg-slate">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-caution text-sm shrink-0">info</span>
            <p className="text-xs text-chalk/70 leading-relaxed">
              Every run is a fresh, randomly generated price path — not historical market data. This
              shows whether your rules fire and how your Stop Loss / Take Profit / Trailing Stop
              would have resolved against that path. It does not show whether you&apos;d make money.
              Test on a demo account before going live.
            </p>
          </div>
        </div>

        {stats && (
          <div className="animate-stagger-in flex flex-col gap-4">
            <h2 className="text-sm font-medium text-chalk">
              Results across {ranWith} run{ranWith === 1 ? "" : "s"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Total trades" value={stats.totalTrades} />
              <StatTile label="Avg trades / run" value={stats.avgTradesPerRun.toFixed(1)} />
              <StatTile label="Trades per run range" value={`${stats.minTradesPerRun}–${stats.maxTradesPerRun}`} />
              <StatTile label="Buy / Sell" value={`${stats.buys} / ${stats.sells}`} />
            </div>

            {stats.hasManagedExit ? (
              <div>
                <h3 className="text-xs font-medium text-chalk mb-3 uppercase tracking-wide">
                  How your exit rule resolved
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatTile label="Target hit" value={stats.targets} tone="buy" />
                  <StatTile label="Stopped out" value={stats.stopped} tone="sell" />
                  <StatTile label="Still open" value={stats.open} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-chalk/50">
                Add a Stop Loss, Take Profit, or Trailing Stop block to see how trades would have
                exited across these runs.
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => router.push("/adjust")}>
                <span className="material-symbols-outlined text-sm mr-2">edit</span>
                Edit strategy
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => router.push("/unlock")}>
                <span className="material-symbols-outlined text-sm mr-2">download</span>
                Get bot
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "buy" | "sell";
}) {
  const toneClass = tone === "buy" ? "text-buy" : tone === "sell" ? "text-sell" : "text-chalk";
  return (
    <div className="rounded-lg border border-outline bg-slate px-3 py-2.5">
      <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-chalk/50">
        {label}
      </p>
      <p className={`text-lg font-bold mono-num ${toneClass}`}>{value}</p>
    </div>
  );
}

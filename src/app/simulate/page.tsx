"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { SimulationChart } from "@/components/SimulationChart";
import { useStrategyStore, simsButtonLabel } from "@/lib/store";
import { simulationMessage, simulationStats } from "@/lib/simulate";

export default function SimulatePage() {
  const router = useRouter();
  const { hydrated, strategy, simResult, simsRemaining, runSim } = useStrategyStore();

  useEffect(() => {
    if (hydrated && !strategy) router.replace("/app");
  }, [hydrated, strategy, router]);

  if (!strategy) return null;

  const message = simResult ? simulationMessage(simResult, strategy.blocks.length) : null;
  const stats = simResult ? simulationStats(simResult, strategy.blocks) : null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Simulation" />
      <StrategyStrip blocks={strategy.blocks} />

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 flex flex-col gap-5">
        {!simResult ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-chalk/60">No run yet for this strategy.</p>
            <Button
              disabled={strategy.blocks.length === 0 || simsRemaining === 0}
              onClick={() => runSim()}
            >
              {simsButtonLabel("Run simulation", simsRemaining)}
            </Button>
          </div>
        ) : (
          <>
            <SimulationChart result={simResult} />

            <div>
              <p className="font-display font-bold text-lg text-chalk mono-num">
                {message?.headline}
              </p>
              {message?.detail && (
                <p className="text-sm text-chalk/60 mt-1">{message.detail}</p>
              )}
            </div>

            {stats && stats.total > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatTile label="Buy / Sell" value={`${stats.buys} / ${stats.sells}`} />
                {stats.hasManagedExit ? (
                  <>
                    <StatTile label="Target hit" value={stats.targets} tone="buy" />
                    <StatTile label="Stopped out" value={stats.stopped} tone="sell" />
                  </>
                ) : (
                  <StatTile label="Longest gap" value={`${stats.longestGap}c`} className="col-span-2" />
                )}
              </div>
            )}

            {stats && stats.total > 0 && !stats.hasManagedExit && (
              <p className="text-xs text-chalk/50 -mt-2">
                Add a Stop Loss, Take Profit, or Trailing Stop block to see how trades would have
                exited.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={simsRemaining === 0}
                onClick={() => runSim()}
                className="flex-1"
              >
                {simsButtonLabel("Run again", simsRemaining)}
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push("/backtest")}
                className="flex-1"
              >
                <span className="material-symbols-outlined text-sm mr-2">analytics</span>
                Run more checks
              </Button>
            </div>

            <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm text-chalk/80 leading-relaxed">
                This is a logic check, not a backtest. It shows whether your rules fire — not
                whether they make money. Test on a demo account before going live.
              </p>
            </div>
          </>
        )}
      </main>

      <div className="sticky bottom-0 flex gap-3 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button variant="ghost" className="flex-1" onClick={() => router.push("/adjust")}>
          Adjust
        </Button>
        <Button
          className="flex-1"
          disabled={!simResult}
          onClick={() => router.push("/unlock")}
        >
          Get my bot
        </Button>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  className = "",
}: {
  label: string;
  value: string | number;
  tone?: "buy" | "sell";
  className?: string;
}) {
  const toneClass = tone === "buy" ? "text-buy" : tone === "sell" ? "text-sell" : "text-chalk";
  return (
    <div className={`rounded-lg border border-outline bg-slate px-3 py-2.5 ${className}`}>
      <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-chalk/50">
        {label}
      </p>
      <p className={`text-lg font-bold mono-num ${toneClass}`}>{value}</p>
    </div>
  );
}

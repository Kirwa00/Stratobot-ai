"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { MpesaCheckout } from "@/components/MpesaCheckout";
import { RulesReadback } from "@/components/RulesReadback";
import { useStrategyStore } from "@/lib/store";
import { PRICE_EA_SHORT } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { strategyRules } from "@/lib/simulate";

export default function UnlockPage() {
  const router = useRouter();
  const { hydrated, strategy, paid, freeEaAvailable, claimFreeEa, markPaid, markEaPurchased } = useStrategyStore();
  useEffect(() => {
    if (hydrated && !strategy) router.replace("/app");
  }, [hydrated, strategy, router]);

  useEffect(() => {
    if (paid) router.replace("/building");
  }, [paid, router]);

  useEffect(() => {
    trackEvent("pricing_viewed", { page: "unlock" }, { oncePerSession: true });
  }, []);

  if (!strategy) return null;

  function getFreeEa() {
    trackEvent("checkout_started", { method: "free_first_ea" });
    claimFreeEa();
  }

  const rules = strategyRules(strategy);

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Unlock" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-6 flex flex-col gap-6">
        <h1 className="font-display font-bold text-xl text-chalk">
          Your bot is ready to build
        </h1>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
            What it does
          </p>
          {rules ? (
            <RulesReadback rules={rules} />
          ) : (
            <p className="text-sm text-chalk/85 leading-relaxed">{strategy.readback}</p>
          )}
        </div>

        {!strategy.rules && <StrategyStrip blocks={strategy.blocks} />}

        {freeEaAvailable ? (
          <>
            <div className="rounded-lg border border-buy/40 bg-slate px-4 py-4">
              <div className="flex items-baseline justify-between mb-1">
                <p className="font-display font-bold text-lg text-chalk">Your first EA</p>
                <p className="font-display font-bold text-lg text-buy">Free</p>
              </div>
              <p className="text-sm text-chalk/80 leading-relaxed">
                Download this strategy as an .mq5 file and check it in your own MT5 Strategy
                Tester before you pay anything. You can keep adjusting this strategy and
                re-download it. After this one, each new EA is {PRICE_EA_SHORT}.
              </p>
            </div>
            <Button className="w-full" onClick={getFreeEa}>
              Get my free EA
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-chalk/75 leading-relaxed">
              You&apos;ve used your free EA in this browser. Unlock this one:
            </p>
            <MpesaCheckout
              strategyId={strategy.id}
              strategyName={strategy.name}
              onPaid={(kind) => (kind === "pro" ? markPaid() : markEaPurchased(strategy.id))}
            />
          </>
        )}

        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-caution text-base shrink-0">info</span>
          <p className="text-xs text-chalk/70 leading-relaxed">
            You&apos;ll need MetaTrader 5 on a Windows desktop or VPS to compile and run the file
            — mobile MT5 can&apos;t do it.
          </p>
        </div>
      </main>
    </div>
  );
}

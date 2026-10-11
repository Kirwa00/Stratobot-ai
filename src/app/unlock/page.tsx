"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { RulesReadback } from "@/components/RulesReadback";
import { useStrategyStore } from "@/lib/store";
import { BETA_CODE, PRICE_KES, PRO_DAYS } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { strategyRules } from "@/lib/simulate";

export default function UnlockPage() {
  const router = useRouter();
  const { hydrated, strategy, paid, markPaid } = useStrategyStore();
  useEffect(() => {
    if (hydrated && !strategy) router.replace("/app");
  }, [hydrated, strategy, router]);

  useEffect(() => {
    if (paid) router.replace("/building");
  }, [paid, router]);

  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState(false);

  useEffect(() => {
    trackEvent("pricing_viewed", { page: "unlock" }, { oncePerSession: true });
  }, []);

  if (!strategy) return null;

  // Payments aren't live yet (no provider is wired up; see
  // docs/conversion-sprint-audit.md). The previous screen simulated an M-Pesa
  // charge and then granted the pass anyway; this grants the same pass and says so.
  function activateBetaPass() {
    trackEvent("checkout_started", { method: "beta_free" });
    markPaid();
  }

  function redeemBeta() {
    if (betaCode.trim().toUpperCase() !== BETA_CODE) return setBetaError(true);
    trackEvent("checkout_started", { method: "beta_code" });
    markPaid();
  }

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
          {strategyRules(strategy) ? (
            <RulesReadback rules={strategyRules(strategy)!} />
          ) : (
            <p className="text-sm text-chalk/85 leading-relaxed">{strategy.readback}</p>
          )}
        </div>

        {!strategy.rules && <StrategyStrip blocks={strategy.blocks} />}

        <div className="rounded-lg border border-outline bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-display font-bold text-lg text-chalk">Pro</p>
            <p className="font-display font-bold text-lg text-chalk mono-num">
              KES {PRICE_KES.toLocaleString("en-KE")}
            </p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">
            Unlocks unlimited access for {PRO_DAYS} days. Not an auto-renewing subscription.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Your strategy as an MQL5 (.mq5) file, ready to compile in MetaTrader",
              `Unlimited logic checks for ${PRO_DAYS} days`,
              `Unlimited strategies and downloads for ${PRO_DAYS} days`,
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-signal text-base mt-0.5">check</span>
                {line}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-outline">
            <span className="material-symbols-outlined text-caution text-base shrink-0">info</span>
            <p className="text-xs text-chalk/70 leading-relaxed">
              You&apos;ll need MetaTrader 5 on a Windows desktop or VPS to compile and run this file
              — mobile MT5 can&apos;t do it. No desktop yet? A cheap trading VPS works too.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-buy/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-1.5">
            Free during the beta
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Payments aren&apos;t live yet, so Pro is free while we&apos;re in beta. No card or
            M-Pesa details needed. When payments open, Pro will cost KES{" "}
            {PRICE_KES.toLocaleString("en-KE")} for {PRO_DAYS} days.
          </p>
        </div>

        <Button className="w-full" onClick={activateBetaPass}>
          Activate my free {PRO_DAYS}-day pass
        </Button>

        <p className="text-xs text-chalk/50 text-center leading-relaxed">
          Your strategy is saved in this browser. Nothing is lost if you come back later.
        </p>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <label htmlFor="beta-code" className="block text-xs text-chalk/70 mb-2 leading-relaxed">
            Got a beta code by email? You can enter it here (it unlocks the same pass).
          </label>
          <div className="flex gap-2">
            <input
              id="beta-code"
              value={betaCode}
              onChange={(e) => {
                setBetaCode(e.target.value);
                setBetaError(false);
              }}
              placeholder="Beta code"
              className="flex-1 min-w-0 rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <Button variant="ghost" size="sm" onClick={redeemBeta} disabled={!betaCode.trim()}>
              Redeem
            </Button>
          </div>
          {betaError && (
            <p role="alert" className="text-xs text-sell mt-2">
              That code didn&apos;t match. Check your email, or just use the free pass above.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

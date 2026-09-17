"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { useStrategyStore, BETA_CODE } from "@/lib/store";

export default function UnlockPage() {
  const router = useRouter();
  const { hydrated, strategy, paid, markPaid } = useStrategyStore();
  const [processing, setProcessing] = useState(false);
  const pendingPayment = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState(false);

  function redeemBeta() {
    if (betaCode.trim().toUpperCase() === BETA_CODE) {
      markPaid();
    } else {
      setBetaError(true);
    }
  }

  useEffect(() => {
    if (hydrated && !strategy) router.replace("/");
  }, [hydrated, strategy, router]);

  useEffect(() => {
    if (paid) router.replace("/building");
  }, [paid, router]);

  // Cancel the in-flight mock confirmation if the trader navigates away
  // before it resolves — a real webhook/polling confirmation should never
  // mark a payment complete after the user has already left the flow.
  useEffect(() => {
    return () => {
      if (pendingPayment.current) clearTimeout(pendingPayment.current);
    };
  }, []);

  if (!strategy) return null;

  function pay(method: string) {
    setProcessing(true);
    // No real payment processor is wired up in this build — see README.
    // This simulates the webhook-confirmed flow described in the UX plan.
    pendingPayment.current = setTimeout(() => {
      markPaid();
    }, 1400);
    void method;
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
          <p className="text-sm text-chalk/85 leading-relaxed">{strategy.readback}</p>
        </div>

        <StrategyStrip blocks={strategy.blocks} />

        <div className="rounded-lg border border-outline bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-display font-bold text-lg text-chalk">Pro</p>
            <p className="font-display font-bold text-lg text-chalk mono-num">KES 2,500</p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">
            Unlocks unlimited access for 30 days. Not an auto-renewing subscription — pay again
            after it expires if you want to keep going.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Your strategy as an MQL5 (.mq5) file, ready to compile in MetaTrader",
              "Unlimited simulations for 30 days",
              "Unlimited strategies and downloads for 30 days",
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

        <div className="flex flex-col gap-3">
          <Button className="w-full" disabled={processing} onClick={() => pay("mpesa")}>
            {processing ? "Processing…" : "Pay with M-Pesa"}
          </Button>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              disabled={processing}
              onClick={() => pay("airtel")}
            >
              Airtel Money
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              disabled={processing}
              onClick={() => pay("card")}
            >
              Card
            </Button>
          </div>
        </div>

        <p className="text-xs text-chalk/50 text-center leading-relaxed">
          Your strategy is saved. Nothing is lost if you come back later.
        </p>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
            Beta tester?
          </p>
          <p className="text-xs text-chalk/70 mb-3 leading-relaxed">
            If you signed up on our{" "}
            <a href="/beta" className="text-secondary hover:underline">
              beta desk
            </a>{" "}
            and got a code by email, redeem it here for a free 30-day Pro pass.
          </p>
          <div className="flex gap-2">
            <input
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
            <p className="text-xs text-sell mt-2">That code didn&apos;t match. Check your email.</p>
          )}
        </div>
      </main>
    </div>
  );
}

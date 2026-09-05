"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { useStrategyStore } from "@/lib/store";

export default function UnlockPage() {
  const router = useRouter();
  const { hydrated, strategy, paid, markPaid } = useStrategyStore();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (hydrated && !strategy) router.replace("/");
  }, [hydrated, strategy, router]);

  useEffect(() => {
    if (paid) router.replace("/building");
  }, [paid, router]);

  if (!strategy) return null;

  function pay(method: string) {
    setProcessing(true);
    // No real payment processor is wired up in this build — see README.
    // This simulates the webhook-confirmed flow described in the UX plan.
    window.setTimeout(() => {
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
            One-time payment — not a subscription. No recurring charge.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Your strategy as an MQL5 (.mq5) file, ready to compile in MetaTrader",
              "Unlimited simulations on this and future strategies",
              "Unlimited strategies — describe as many bots as you like",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-signal text-base mt-0.5">check</span>
                {line}
              </li>
            ))}
          </ul>
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
      </main>
    </div>
  );
}

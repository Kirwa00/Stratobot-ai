import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { FREE_SIMS, PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing — StratoBot AI",
  description: `Free logic checks, or ${PRO_DAYS} days of unlimited strategies and downloads for KES ${PRICE_KES.toLocaleString("en-KE")}. Built for Kenyan traders, pay via M-Pesa.`,
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Pricing" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Simple pricing</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Try the logic check for free. Pay only when you&apos;re ready to download a working
            .mq5 file.
          </p>
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-display font-bold text-lg text-chalk">Free</p>
            <p className="font-display font-bold text-lg text-chalk mono-num">KES 0</p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">No account, no card, no time limit.</p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Describe a strategy in plain language",
              `${FREE_SIMS} free logic-check simulations`,
              "Build and adjust with the block editor",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-chalk/40 text-base mt-0.5">
                  check
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-display font-bold text-lg text-chalk">Pro</p>
            <p className="font-display font-bold text-lg text-chalk mono-num">
              KES {PRICE_KES.toLocaleString("en-KE")}
            </p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">
            Unlocks unlimited access for {PRO_DAYS} days. Not an auto-renewing subscription — pay
            again after it expires if you want to keep going.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Your strategy as an MQL5 (.mq5) file, ready to compile in MetaTrader",
              `Unlimited simulations for ${PRO_DAYS} days`,
              `Unlimited strategies and downloads for ${PRO_DAYS} days`,
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-signal text-base mt-0.5">
                  check
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="text-xs text-chalk/50 mt-3 pt-3 border-t border-outline">
            Priced in KES for Kenyan traders — pay with M-Pesa or Airtel Money.
          </p>
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-1.5">
            In beta right now
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            We&apos;re running a small private beta with free {PRO_DAYS}-day Pro access for
            testers who give us feedback.{" "}
            <Link href="/beta" className="text-secondary hover:underline">
              Join the beta desk
            </Link>
            .
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Questions about pricing?{" "}
          <Link href="/faq" className="text-secondary hover:underline">
            Read the FAQ
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

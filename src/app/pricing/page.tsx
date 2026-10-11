import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { TrackView } from "@/components/TrackView";
import { FREE_SIMS, PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing — StratoBot AI",
  description: `Describe and check your strategy free. Pro: ${PRO_DAYS} days of unlimited strategies and .mq5 downloads for KES ${PRICE_KES.toLocaleString("en-KE")} — free while StratoBot is in beta.`,
  path: "/pricing",
});

// Every answer below describes what the app actually does today (lib/store.tsx,
// app/unlock, app/download). Where a policy hasn't been decided, the page says so
// instead of inventing one.
const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "What needs Pro?",
    a: `Downloading the .mq5 file. Describing strategies, reviewing the rules, and ${FREE_SIMS} logic checks are free with no account.`,
  },
  {
    q: "Are there limits on Pro?",
    a: `No caps on strategies, rebuilds, downloads, or logic checks while the ${PRO_DAYS}-day pass is active.`,
  },
  {
    q: "What happens when the pass ends?",
    a: `Downloads lock again, and logic checks fall back to the free ${FREE_SIMS} (checks you ran during the pass count toward them). It doesn't renew automatically.`,
  },
  {
    q: "Do I keep the EAs I downloaded?",
    a: "Yes. Each download is an ordinary .mq5 file saved to your device. It keeps working after the pass ends, and you can edit, compile, and share it.",
  },
  {
    q: "Where is my strategy saved?",
    a: "In this browser only. There are no accounts yet, so clearing your browser data or switching devices starts you fresh. Download the file to keep it.",
  },
  {
    q: "Any other costs?",
    a: "Not from StratoBot. You'll need MetaTrader 5 (free from your broker) on a Windows PC or VPS to compile and run the EA; a VPS and broker trading costs are separate.",
  },
  {
    q: "How do I pay?",
    a: "You don't, yet. Payments aren't live while StratoBot is in beta, so Pro is free. We'll announce payment methods before charging anyone.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col flex-1">
      <TrackView event="pricing_viewed" props={{ page: "pricing" }} />
      <Header back title="Pricing" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Simple pricing</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Describe and check your strategy for free. Pro unlocks the .mq5 download.
          </p>
        </div>

        <div className="rounded-lg border border-buy/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-1.5">
            Free during the beta
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Payments aren&apos;t live yet, so Pro costs nothing right now. You activate the pass
            when you&apos;re ready to download.{" "}
            <Link href="/beta" className="text-secondary hover:underline">
              Join the beta desk
            </Link>{" "}
            to give feedback.
          </p>
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-lg text-chalk">Free</h2>
            <p className="font-display font-bold text-lg text-chalk mono-num">KES 0</p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">No account, no card, no time limit.</p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Describe a strategy in plain language",
              "See exactly what the bot will do, rule by rule",
              `${FREE_SIMS} free logic checks that explain every trade`,
              "Build and adjust with the block editor",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-chalk/40 text-base mt-0.5" aria-hidden="true">
                  check
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-lg text-chalk">Pro</h2>
            <p className="text-right">
              <span className="font-display font-bold text-lg text-chalk mono-num">
                KES {PRICE_KES.toLocaleString("en-KE")}
              </span>
              <span className="block text-xs text-buy">free during beta</span>
            </p>
          </div>
          <p className="text-xs text-chalk/50 mb-3">
            A {PRO_DAYS}-day pass. Not an auto-renewing subscription.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-chalk/85">
            {[
              "Your strategy as an MQL5 (.mq5) source file, ready to compile in MetaTrader 5",
              `Unlimited strategies and downloads for ${PRO_DAYS} days`,
              `Unlimited logic checks for ${PRO_DAYS} days`,
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-signal text-base mt-0.5" aria-hidden="true">
                  check
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <section aria-labelledby="pricing-faq">
          <h2 id="pricing-faq" className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            What you get, exactly
          </h2>
          <dl className="flex flex-col gap-3">
            {QUESTIONS.map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-outline px-4 py-3">
                <dt className="text-sm font-semibold text-chalk mb-1">{q}</dt>
                <dd className="text-sm text-chalk/70 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-sm text-chalk/70 text-center">
          More questions?{" "}
          <Link href="/faq" className="text-secondary hover:underline">
            Read the FAQ
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { FREE_SIMS, PRO_DAYS, PRICE_KES } from "@/lib/constants";

export const metadata = {
  title: "FAQ — StratoBot AI",
  description: "Answers about how StratoBot turns a trading strategy into an MT5 Expert Advisor.",
};

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Do I need to know MQL4 or MQL5?",
    a: "No. You describe your strategy in plain language — StratoBot maps it to a fixed set of pre-written, tested code blocks and assembles the .mq5 file. You never write or see raw code unless you want to.",
  },
  {
    q: "Will this guarantee my strategy makes money?",
    a: "No, and be wary of anything that claims otherwise. StratoBot runs a logic check — a synthetic simulation that confirms your rules fire the way you described them. It is not a backtest against real market history and it is not proof of profitability.",
  },
  {
    q: "What's the difference between the free check and paying?",
    a: (
      <>
        Free gets you {FREE_SIMS} logic-check simulations and the full block editor, no account
        needed. Paying (KES {PRICE_KES.toLocaleString("en-KE")} for {PRO_DAYS} days) unlocks
        unlimited simulations and lets you download the actual .mq5 file to compile in MetaTrader.
        See <Link href="/pricing" className="text-secondary hover:underline">Pricing</Link>.
      </>
    ),
  },
  {
    q: "What do I do with the file once I download it?",
    a: "It's a normal .mq5 source file. Copy it into MetaTrader 5's Experts folder, compile it in MetaEditor (one click), then attach it to a chart with Algo Trading enabled. Full steps are in the in-app install guide after you download.",
  },
  {
    q: "Do I need a VPS?",
    a: (
      <>
        Only if you want your bot to keep trading after you close your laptop — MT5 has to stay
        running. See our{" "}
        <Link href="/vps" className="text-secondary hover:underline">
          VPS comparison
        </Link>{" "}
        if you need one.
      </>
    ),
  },
  {
    q: "Can I run this on my phone?",
    a: "You can describe your strategy and run logic checks from any device. Compiling and running the actual EA requires MetaTrader 5 on a Windows desktop or VPS — mobile MT5 can't compile or run custom Expert Advisors.",
  },
  {
    q: "What if my strategy can't be fully automated?",
    a: "Some rules (pure discretionary judgment calls, ambiguous conditions) don't map cleanly to code. When that happens StratoBot tells you which parts it couldn't map, instead of silently guessing or inventing logic you didn't ask for.",
  },
  {
    q: "How is this different from buying a forex robot?",
    a: "A pre-built robot runs someone else's strategy. StratoBot builds an EA from your own rules — entries, exits, risk management, whatever you actually trade.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="FAQ" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <h1 className="font-display font-bold text-2xl text-chalk">
          Frequently asked questions
        </h1>

        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm font-semibold text-chalk mb-1.5">{q}</p>
              <p className="text-sm text-chalk/70 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <CtaBanner />
      </main>
    </div>
  );
}

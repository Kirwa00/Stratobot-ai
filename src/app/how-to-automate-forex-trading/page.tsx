import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "How to Automate Forex Trading — StratoBot AI",
  description: "The real options for automating forex trading — EAs, copy trading, and signal services — and where StratoBot fits.",
};

const OPTIONS = [
  {
    title: "Run your own Expert Advisor",
    whoseLogic: "Yours",
    body: "You define the rules; an EA executes them in MetaTrader 5, unattended. This is what StratoBot builds.",
  },
  {
    title: "Copy trading",
    whoseLogic: "Someone else's",
    body: "Your account mirrors another trader's live positions in real time. You're automating execution, not your own strategy.",
  },
  {
    title: "Signal services",
    whoseLogic: "Someone else's",
    body: "You get trade alerts from a provider and execute them yourself, or via a separate signal-copier tool. Still someone else's decisions, and still manual unless paired with more tooling.",
  },
];

export default function HowToAutomateForexTradingPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Automate forex trading" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            How to actually automate forex trading
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            &ldquo;Automate forex trading&rdquo; covers a few genuinely different things. Here&apos;s
            the honest landscape, and where an EA built from your own rules fits into it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((o) => (
            <div key={o.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-chalk">{o.title}</p>
                <span className="text-[10px] font-mono uppercase tracking-wide text-chalk/40 border border-outline rounded px-1.5 py-0.5">
                  Whose logic: {o.whoseLogic}
                </span>
              </div>
              <p className="text-xs text-chalk/70 leading-relaxed">{o.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-1.5">
            StratoBot&apos;s lane
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            If you already have your own trading rules and want them running as a real EA — not
            someone else&apos;s signals — describe them in plain language and StratoBot builds the
            .mq5 file.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/automate-forex-strategy" className="text-secondary hover:underline">
            What automating your own strategy requires
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

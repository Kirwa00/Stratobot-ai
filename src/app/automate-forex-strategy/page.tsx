import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "Automate Your Forex Strategy — StratoBot AI",
  description: "What automating your own forex strategy actually requires — and how to do it without learning to code.",
};

const REQUIREMENTS = [
  {
    icon: "rule",
    title: "A codified rule set",
    body: "Entries, exits, stop-loss, take-profit, and risk sizing need to be specific enough that they can't be misread — vague rules can't be automated, by a human coder or by StratoBot.",
  },
  {
    icon: "smart_toy",
    title: "An EA to execute it",
    body: "The rule set has to live somewhere that can act on it automatically — an Expert Advisor running in MetaTrader 5.",
  },
  {
    icon: "dns",
    title: "Somewhere for it to run 24/7",
    body: "MT5 has to stay open for the EA to keep watching the market. A desktop works while it's on; a VPS keeps it running when you're not.",
  },
];

export default function AutomateForexStrategyPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Automate your strategy" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            What it actually takes to automate your forex strategy
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Not theory — the three concrete things you need, and how StratoBot handles the part
            that used to require code.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {REQUIREMENTS.map((r) => (
            <div key={r.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {r.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{r.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
            Not the same as automation
          </p>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Copy trading and signal services automate execution of <em>someone else&apos;s</em>{" "}
            strategy. StratoBot is for automating your own — the rules stay yours, and so does the
            EA.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Need somewhere for your EA to run?{" "}
          <Link href="/vps" className="text-secondary hover:underline">Compare VPS providers</Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

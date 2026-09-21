import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "How to Create an MT5 EA — StratoBot AI",
  description: "Three real ways to create a MetaTrader 5 Expert Advisor, and why describing your strategy to StratoBot is the fastest one.",
};

const PATHS = [
  {
    title: "Learn MQL5 yourself",
    body: "The most control, the steepest cost: months of learning a C++-like language before you can build anything real. Worth it if you plan to code many EAs long-term.",
    icon: "school",
  },
  {
    title: "Hire an MQL4/MQL5 programmer",
    body: "Someone else writes it for you — for a price, on their timeline, with rounds of revisions if the spec wasn't perfect the first time.",
    icon: "person",
  },
  {
    title: "Describe it to StratoBot",
    body: "You describe entries, exits, and risk rules in plain language. StratoBot maps them to tested code blocks and assembles a real .mq5 file — no learning curve, no hiring.",
    icon: "bolt",
  },
];

export default function CreateMt5EaPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Create an MT5 EA" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Three ways to create an MT5 EA
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Whatever path you take, an EA is just your trading rules translated into code
            MetaTrader 5 can execute automatically. Here&apos;s how each path gets you there.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PATHS.map((p) => (
            <div key={p.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {p.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{p.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            What StratoBot needs from you
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-chalk/70">
            {[
              "Entry conditions",
              "Exit conditions",
              "Stop-loss and take-profit rules",
              "Risk/position sizing",
              "Trading hours or sessions",
              "Instruments and timeframes",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-buy text-base mt-0.5">check</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Considering the programmer route?{" "}
          <Link href="/compare/ea-programmer-alternative" className="text-secondary hover:underline">
            See the honest comparison
          </Link>{" "}
          · <Link href="/how-to-create-mt5-ea" className="text-secondary hover:underline">Step-by-step guide</Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

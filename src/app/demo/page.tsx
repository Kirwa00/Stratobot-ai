import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "See StratoBot in Action — Demo Walkthrough",
  description: "A full walkthrough of turning one real strategy into an MT5 EA with StratoBot, screen by screen.",
  path: "/demo",
});

const STAGES = [
  {
    n: "01",
    icon: "edit_note",
    title: "You describe it",
    body: `"London killzone, sweep PDH, enter on 50% retrace, trail stop 30 pips"`,
    isQuote: true,
  },
  {
    n: "02",
    icon: "fact_check",
    title: "StratoBot reads it back",
    body: "A plain-language summary of exactly what it understood — a session-time filter for London, prior-day-high sweep detection, a 50% retracement entry, and a 30-pip trailing stop. Anything it couldn't map gets flagged, not silently guessed.",
  },
  {
    n: "03",
    icon: "widgets",
    title: "You see it as blocks",
    body: "Each rule is now an editable block. Reorder them, tweak parameters, or add ones the description missed.",
  },
  {
    n: "04",
    icon: "science",
    title: "Free logic check",
    body: "A synthetic simulation runs your rules and reports how many trades fired, the buy/sell split, and the longest gap between signals — confirming the logic behaves the way you described. Not a backtest, not a profit forecast.",
  },
  {
    n: "05",
    icon: "lock_open",
    title: "Unlock",
    body: "Happy with it? Unlock 30 days of unlimited strategies and downloads.",
  },
  {
    n: "06",
    icon: "download",
    title: "Real .mq5 file",
    body: "Download a genuine, compilable MQL5 file — open it in MetaEditor, compile it, and run it in MetaTrader 5.",
  },
];

export default function DemoPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Demo" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            See StratoBot turn a real strategy into an EA
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            One example, start to finish — the same screens you&apos;ll see when you try it
            yourself.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {STAGES.map((s) => (
            <div key={s.n} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {s.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">
                  {s.n} · {s.title}
                </p>
                {s.isQuote ? (
                  <p className="font-mono text-[13px] text-chalk/70 leading-relaxed">
                    <span className="text-signal">&gt;</span> {s.body}
                  </p>
                ) : (
                  <p className="text-xs text-chalk/70 leading-relaxed">{s.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            This walkthrough is real — it&apos;s the same flow the live app uses. It isn&apos;t a
            substitute for trying it yourself, and the logic check isn&apos;t proof any strategy
            will be profitable.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Downloaded EA needs MT5 running around the clock?{" "}
          <Link href="/vps" className="text-secondary hover:underline">
            Compare VPS providers
          </Link>
        </p>

        <CtaBanner
          title="Try it with your own strategy"
          body="No account needed for the free logic check."
        />
      </main>
    </div>
  );
}

import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How It Works — StratoBot AI",
  description: "How StratoBot turns a plain-language trading strategy into a working MT5 Expert Advisor.",
  path: "/how-it-works",
});

const OLD_WAY = [
  "Write a technical specification for your strategy",
  "Find an MQL4/MQL5 programmer",
  "Explain the strategy back and forth",
  "Pay upfront",
  "Wait for a first draft",
  "Test it yourself",
  "Request corrections",
  "Pay again for revisions",
  "Deploy it to MT4/MT5",
  "Maintain it yourself going forward",
];

const STEPS = [
  {
    n: "01",
    icon: "edit_note",
    title: "Describe",
    body: "Type your strategy the way you'd explain it to another trader — entries, exits, stop-loss, take-profit, risk rules, timing.",
  },
  {
    n: "02",
    icon: "science",
    title: "Check it",
    body: "StratoBot maps your rules to a fixed set of pre-written blocks and runs a free logic check to confirm they fire the way you described.",
  },
  {
    n: "03",
    icon: "lock_open",
    title: "Unlock",
    body: "Happy with the read-back? Unlock unlimited simulations and downloads for 30 days.",
  },
  {
    n: "04",
    icon: "download",
    title: "Download",
    body: "Get a real .mq5 file, compile it in MetaEditor, and run it in MetaTrader 5.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="How it works" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-7">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            You create the strategy. StratoBot creates the EA.
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            No MQL4/MQL5 programming required — and no hiring a programmer.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            The old way
          </p>
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
            <ol className="flex flex-col gap-2 text-sm text-chalk/60">
              {OLD_WAY.map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="line-through decoration-chalk/30">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-3">
            The StratoBot way
          </p>
          <div className="flex flex-col gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
                <span className="material-symbols-outlined text-signal text-xl shrink-0">
                  {s.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-chalk mb-1">
                    {s.n} · {s.title}
                  </p>
                  <p className="text-xs text-chalk/70 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            The logic check confirms your rules fire correctly — it&apos;s not a backtest against
            real market history and it&apos;s not proof your strategy will be profitable.
          </p>
        </div>

        <CtaBanner />
      </main>
    </div>
  );
}

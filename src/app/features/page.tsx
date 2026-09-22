import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Features — StratoBot AI",
  description: "What StratoBot actually does: plain-language strategy input, deterministic MQL5 generation, and honest logic-check testing.",
  path: "/features",
});

const FEATURES = [
  {
    icon: "edit_note",
    title: "Plain-language strategy input",
    body: "Describe entries, exits, stop-loss, take-profit, timing, and risk rules the way you'd explain them to another trader — no technical spec required.",
  },
  {
    icon: "widgets",
    title: "Editable block builder",
    body: "Every parsed rule becomes a visible, reorderable block. Fine-tune parameters, add blocks the description missed, or build a strategy from scratch.",
  },
  {
    icon: "code",
    title: "Deterministic MQL5 generation",
    body: "Code comes from a fixed library of hand-written, pre-tested templates — never freeform AI-generated code. The AI only maps your words to the right blocks.",
  },
  {
    icon: "science",
    title: "Honest logic-check simulation",
    body: "See whether your rules actually fire the way you described, on a synthetic price path. We never call this a backtest or imply profitability.",
  },
  {
    icon: "download",
    title: "Real, compilable output",
    body: "Download an actual .mq5 source file — open it in MetaEditor, compile it, and run it in MetaTrader 5. Nothing hidden, nothing locked to our platform.",
  },
  {
    icon: "bolt",
    title: "Unlimited iteration while unlocked",
    body: "Change your mind about a rule? Re-describe or adjust the blocks and regenerate as many times as you want during your 30-day pass.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Features" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            What StratoBot actually does
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            A strategy-to-EA automation platform — not a forex robot, and not a promise of
            profit.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{f.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <CtaBanner />
      </main>
    </div>
  );
}

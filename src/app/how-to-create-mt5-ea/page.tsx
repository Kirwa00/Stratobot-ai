import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { CtaBanner } from "@/components/CtaBanner";
import { PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Create an MT5 EA — Step by Step",
  description: "A step-by-step guide to creating a MetaTrader 5 Expert Advisor from your own strategy, from description to a compiled .mq5 file.",
  path: "/how-to-create-mt5-ea",
});

const STEPS = [
  {
    title: "Write down your rules",
    body: "Entries, exits, stop-loss, take-profit, risk per trade, trading hours, instrument, timeframe. The more specific, the better the result.",
  },
  {
    title: "Describe it in plain language",
    body: `Type it the way you'd explain it to another trader — no technical spec needed.`,
  },
  {
    title: "Check the read-back",
    body: "StratoBot shows what it understood. Fix anything it misread before moving on.",
  },
  {
    title: "Adjust with the block editor",
    body: "Every rule is a visible, editable block — reorder, tweak parameters, or add ones the description missed.",
  },
  {
    title: "Run the free logic check",
    body: "Confirms your rules fire the way you described, on a synthetic price path. Not a backtest, not proof of profit.",
  },
  {
    title: "Unlock and download",
    body: `KES ${PRICE_KES.toLocaleString("en-KE")} unlocks unlimited strategies and downloads for ${PRO_DAYS} days. Download the real .mq5 file.`,
  },
  {
    title: "Compile and run it",
    body: "Copy it into MetaTrader 5's Experts folder, compile in MetaEditor (F7), then attach it to a chart with Algo Trading on.",
  },
];

export default function HowToCreateMt5EaPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Step-by-step guide" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            How to create an MT5 EA, step by step
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            The full path from &ldquo;I have a strategy&rdquo; to a working Expert Advisor.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="font-mono text-sm text-signal font-bold shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{s.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Always run the compiled EA on a demo account before trading it live. The logic check
            confirms your rules fire correctly — it is not proof they&apos;ll be profitable.
          </p>
        </div>

        <Link href="/app" className="w-full">
          <Button className="w-full">Start with step 1 — describe your strategy</Button>
        </Link>

        <p className="text-sm text-chalk/70 text-center">
          Prefer building visually?{" "}
          <Link href="/adjust?new=1" className="text-secondary hover:underline">
            Start with the block editor
          </Link>{" "}
          · <Link href="/install" className="text-secondary hover:underline">Full install guide</Link>
        </p>

        <CtaBanner
          title="Have a strategy ready?"
          body="Skip the guide and jump straight into describing it."
        />
      </main>
    </div>
  );
}

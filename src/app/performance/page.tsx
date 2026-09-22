import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Evaluate EA Performance — StratoBot AI",
  description: "The real metrics that matter when judging an EA's performance, and tools to calculate each one.",
  path: "/performance",
});

const METRICS = [
  {
    title: "Win rate",
    body: "The % of trades that close in profit. Useful, but meaningless on its own — a 30% win rate can still be profitable with a large enough reward-to-risk ratio.",
    href: "/tools/ea-profit-calculator",
    linkText: "Calculate expected value",
  },
  {
    title: "Expectancy / expected value",
    body: "The average $ result per trade once win rate and average win/loss are combined. This is the number that actually tells you if a strategy has an edge.",
    href: "/tools/ea-profit-calculator",
    linkText: "EA expected value calculator",
  },
  {
    title: "Maximum drawdown",
    body: "The largest peak-to-trough decline. A strategy with a great average return but a brutal 60% drawdown is often unusable in practice — recovery from deep drawdowns is asymmetric.",
    href: "/tools/drawdown-calculator",
    linkText: "Drawdown calculator",
  },
  {
    title: "Risk of ruin",
    body: "Given your win rate and risk per trade, how likely is a losing streak to wipe out the account. Position sizing that ignores this is the most common way traders blow accounts.",
    href: "/tools/risk-of-ruin-calculator",
    linkText: "Risk of ruin calculator",
  },
  {
    title: "Trading costs",
    body: "Spread, commission, and swap eat directly into edge — a strategy that looks profitable before costs can be a net loser after them, especially at high trade frequency.",
    href: "/tools/trading-cost-calculator",
    linkText: "Trading cost calculator",
  },
];

export default function PerformancePage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="EA performance" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            How to actually evaluate EA performance
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            StratoBot doesn&apos;t track live performance of a deployed EA yet — that&apos;s on
            our roadmap, not something shipped today. In the meantime, here are the metrics worth
            calculating yourself from a demo run or MetaTrader&apos;s own Strategy Tester.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {METRICS.map((m) => (
            <div key={m.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm font-semibold text-chalk mb-1.5">{m.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed mb-2">{m.body}</p>
              <Link href={m.href} className="text-xs font-semibold text-secondary hover:underline">
                {m.linkText} →
              </Link>
            </div>
          ))}
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/backtesting" className="text-secondary hover:underline">
            Where does StratoBot&apos;s logic check fit in?
          </Link>{" "}
          · <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

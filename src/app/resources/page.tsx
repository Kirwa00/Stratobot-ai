import Link from "next/link";
import { Header } from "@/components/Header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Resources — StratoBot AI",
  description: "Guides, calculators, and useful links for turning a trading strategy into an MT5 Expert Advisor.",
  path: "/resources",
});

const GUIDES = [
  { href: "/how-it-works", title: "How it works", body: "The full Describe → Check → Unlock → Download flow." },
  { href: "/how-to-create-mt5-ea", title: "How to create an MT5 EA", body: "Step-by-step, from strategy to compiled file." },
  { href: "/trading-strategy-to-ea", title: "Strategy types → EA blocks", body: "How different strategy families map to code." },
  { href: "/risk-management", title: "Risk management basics", body: "Position sizing, stop-loss discipline, drawdown limits." },
  { href: "/performance", title: "Evaluating EA performance", body: "Win rate, expectancy, drawdown, risk of ruin." },
  { href: "/backtesting", title: "Does StratoBot backtest?", body: "The honest answer, and where MT5's Strategy Tester fits in." },
  { href: "/tradingview-to-mt5", title: "Moving a TradingView strategy to MT5", body: "What actually works, honestly." },
  { href: "/compare/ea-generator", title: "Choosing an EA generator", body: "Questions worth asking any of them." },
];

const CALCULATORS_HREF = "/tools";

const EXTERNAL_LINKS = [
  {
    href: "https://www.metatrader5.com/en/download",
    title: "MetaTrader 5 (official download)",
    body: "The platform your EA runs in.",
  },
  {
    href: "https://www.mql5.com/en/docs",
    title: "MQL5 Reference Documentation",
    body: "The official language reference, for when you want to read the generated code.",
  },
];

export default function ResourcesPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Resources" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Resources</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Everything on the site in one place — guides, calculators, and the official platform
            links you&apos;ll actually need.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Guides
          </p>
          <div className="flex flex-col gap-2">
            {GUIDES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="rounded-lg border border-outline bg-slate px-4 py-3 hover:border-signal/50 transition-colors"
              >
                <p className="text-sm font-semibold text-chalk mb-0.5">{g.title}</p>
                <p className="text-xs text-chalk/60">{g.body}</p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Calculators
          </p>
          <Link
            href={CALCULATORS_HREF}
            className="rounded-lg border border-outline bg-slate px-4 py-3 flex items-center justify-between hover:border-signal/50 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-chalk mb-0.5">All 10 trading calculators</p>
              <p className="text-xs text-chalk/60">Position size, drawdown, risk of ruin, and more.</p>
            </div>
            <span className="material-symbols-outlined text-signal">arrow_forward</span>
          </Link>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Official platform links
          </p>
          <div className="flex flex-col gap-2">
            {EXTERNAL_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-outline bg-slate px-4 py-3 flex items-center justify-between hover:border-signal/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-chalk mb-0.5">{l.title}</p>
                  <p className="text-xs text-chalk/60">{l.body}</p>
                </div>
                <span className="material-symbols-outlined text-chalk/40 text-base">open_in_new</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

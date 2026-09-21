import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "Does StratoBot Backtest Strategies? — The Honest Answer",
  description: "StratoBot doesn't backtest against real historical data. Here's what the free logic check actually does, and why the difference matters.",
};

export default function BacktestingPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Backtesting" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Does StratoBot backtest strategies?
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Short, honest answer: no — not against real historical market data. Here&apos;s
            exactly what StratoBot does instead, and why we don&apos;t call it a backtest.
          </p>
        </div>

        <div className="rounded-lg border border-caution bg-caution-bg/20 px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-caution mb-1.5">
            What a real backtest is
          </p>
          <p className="text-sm text-chalk/80 leading-relaxed">
            A true backtest runs your strategy against years of actual historical price data for
            a specific instrument, accounting for real spread, slippage, and market conditions at
            the time. It tells you how the strategy would have performed historically — with all
            the caveats that past performance implies about future results.
          </p>
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-1.5">
            What StratoBot&apos;s free check actually does
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            It runs your parsed rules against a synthetic price path — not real market history —
            purely to confirm the logic fires the way you described it. Does the entry condition
            trigger when it should? Does the stop-loss actually attach? That&apos;s the whole
            job: a logic check, not a performance test.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Why we don&apos;t blur the two
          </p>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Calling a synthetic logic check a &ldquo;backtest&rdquo; would imply something about
            real-world performance that we have no basis to claim. Once you&apos;ve downloaded
            your EA, run it in MetaTrader 5&apos;s own Strategy Tester against real historical
            data — that&apos;s the right tool for an actual backtest, and it&apos;s built into
            the platform you&apos;re already using.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/how-it-works" className="text-secondary hover:underline">
            See the full flow
          </Link>{" "}
          · <Link href="/performance" className="text-secondary hover:underline">
            How to evaluate EA performance
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

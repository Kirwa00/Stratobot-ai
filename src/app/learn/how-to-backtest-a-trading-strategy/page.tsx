import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Backtest a Trading Strategy — StratoBot AI",
  description: "The real ways to backtest a trading strategy — manual chart replay, MetaTrader's Strategy Tester, and dedicated engines — plus what backtesting can't tell you.",
  path: "/learn/how-to-backtest-a-trading-strategy",
});

const METHODS = [
  {
    title: "Manual chart replay",
    body: "Scroll a chart back to a past date and step forward candle by candle, marking where your rules would have entered and exited. Slow and manual, but it's the fastest way to find out whether a strategy's logic even makes sense before building anything — TradingView's bar replay tool is built for exactly this.",
  },
  {
    title: "MetaTrader 5's Strategy Tester",
    body: "The standard way to backtest a compiled EA. It runs your .mq5 file against real historical tick or OHLC data for a chosen symbol and date range, and reports win rate, drawdown, profit factor, and more. This only works once you have compiled code — it's a step after description and logic-checking, not a replacement for either.",
  },
  {
    title: "Dedicated backtesting engines",
    body: "Platforms and code libraries (from paid backtesting software to Python frameworks) built specifically for strategy testing, usually with more control over data quality, spread modeling, and walk-forward analysis than a built-in tester. Worth it once you're testing seriously across many symbols or timeframes, overkill for a first pass.",
  },
];

const PITFALLS = [
  {
    title: "Overfitting to the past",
    body: "Tuning parameters until a backtest looks perfect almost always means fitting to noise in that specific historical window, not finding a real edge. A strategy tuned this way tends to fall apart on data it hasn't seen.",
  },
  {
    title: "Ignoring spread and slippage",
    body: "A backtest using perfect fill prices will overstate performance. Real trades pay the spread and sometimes slip past your intended price, especially during news or low liquidity.",
  },
  {
    title: "Testing on too short a window",
    body: "A strategy that looks great over three months of trending price action may fail the moment the market ranges or reverses. Test across different market conditions, not just a convenient recent stretch.",
  },
  {
    title: "Treating a backtest as a guarantee",
    body: "Historical performance describes the past, not the future. Even a well-built backtest is one input into a decision, not proof of what a strategy will do going forward.",
  },
];

export default function HowToBacktestPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="How to backtest a trading strategy"
      intro="Backtesting means running a strategy against historical price data to see how it would have performed. Here's how people actually do it, and where it fits alongside a logic check like StratoBot's."
    >
      <ArticleSection title="The three real methods">
        <div className="flex flex-col gap-3">
          {METHODS.map((m) => (
            <div key={m.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm font-semibold text-chalk mb-1">{m.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </ArticleSection>

      <ArticleSection title="Where a logic check fits in">
        <p>
          Before any of the above, you need a strategy specific enough to actually test — clear
          entry conditions, exits, and position sizing, not a vague idea. StratoBot&apos;s free
          logic check confirms your described rules fire the way you expect, using a synthetic
          price path rather than real market history. It answers &ldquo;does the logic work as
          described&rdquo;, not &ldquo;would this have made money&rdquo; — that second question
          is what an actual backtest, like MetaTrader&apos;s Strategy Tester, is for.{" "}
          <Link href="/backtesting" className="text-secondary hover:underline">
            See the full distinction
          </Link>
          .
        </p>
      </ArticleSection>

      <ArticleSection title="What backtesting can't tell you">
        <div className="flex flex-col gap-3">
          {PITFALLS.map((p) => (
            <div key={p.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm font-semibold text-chalk mb-1">{p.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/demo" className="text-secondary hover:underline">
          See the full flow in a demo
        </Link>{" "}
        · <Link href="/learn/common-automation-mistakes" className="text-secondary hover:underline">
          Common automation mistakes
        </Link>
      </p>
    </ArticleShell>
  );
}

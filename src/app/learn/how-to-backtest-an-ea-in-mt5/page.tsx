import Link from "next/link";
import { ArticleFaq, ArticleSection, ArticleShell, ArticleSteps } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How to Backtest an Expert Advisor in MT5 (Strategy Tester Guide) — StratoBot AI",
  description:
    "How to backtest an EA in MetaTrader 5: Strategy Tester settings, which modelling mode to pick, how to read the report, and the mistakes that make a backtest look better than it is.",
  path: "/learn/how-to-backtest-an-ea-in-mt5",
});

const STEPS = [
  { title: "Open the Strategy Tester", body: "In MT5 press Ctrl+R, or choose View → Strategy Tester. The EA must already be installed and compiled." },
  { title: "Pick the EA, symbol and timeframe", body: "Choose your Expert Advisor, the symbol it trades, and the timeframe it was designed for." },
  { title: "Set the date range", body: "Use a custom period long enough to include different market conditions: trends, ranges, and volatile news weeks, not just a recent stretch that happens to suit the strategy." },
  { title: "Choose the modelling mode", body: "This decides how price moves inside each bar; see the section below." },
  { title: "Set deposit, leverage and inputs", body: "Use the deposit and leverage you'd really trade with, and check the EA's settings on the Inputs tab. Tick Visual mode if you want to watch the trades being placed." },
  { title: "Start and read the report", body: "Click Start. When it finishes, the Backtest tab has the report, the Graph tab shows the balance curve, and the Journal lists every order and any errors." },
];

const MODES = [
  { title: "Every tick based on real ticks", body: "Replays your broker's recorded ticks, including real spreads. The most realistic, the slowest, and only as good as the tick history your broker provides." },
  { title: "Every tick", body: "Generates artificial ticks inside each one-minute bar. Detailed, but the in-bar path is simulated rather than recorded." },
  { title: "1 minute OHLC", body: "Uses just four prices per minute: the open, then the low and high (low first on a rising minute, high first on a falling one), then the close. Fast and a good middle ground for EAs that make decisions on closed bars; less exact for tight stops, which can be hit inside a minute in ways four prices don't capture." },
  { title: "Open prices only", body: "Only each bar's open price. Very fast, but valid only for EAs that act solely at the start of a bar. Stops and trailing stops are modelled crudely." },
];

const REPORT = [
  { title: "Total net profit", body: "Profit after the whole test. Meaningless on its own without the drawdown next to it." },
  { title: "Maximal drawdown", body: "The largest fall from a peak. This is the pain you'd have had to sit through, and the number prop firm rules are measured against." },
  { title: "Profit factor", body: "Gross profit divided by gross loss. Above 1 means winners outweighed losers over this period." },
  { title: "Total trades", body: "Too few trades (a few dozen) and the other numbers are mostly luck." },
];

const FAQ = [
  { q: "Which modelling mode should I use in the MT5 Strategy Tester?", a: "Use Every tick based on real ticks for a final check if your broker has the data; 1 minute OHLC is a fast, reasonable choice for EAs that decide on closed bars. Open prices only is only valid for EAs that act solely at the open of each bar." },
  { q: "How much history should I backtest an EA on?", a: "Enough to cover several different market conditions and at least a few hundred trades. A few months of one trending market can make almost any strategy look good." },
  { q: "Does a good backtest mean the EA will be profitable?", a: "No. A backtest describes how the rules behaved on past data. Overfitting, spreads, slippage and changing markets all mean live results can be very different." },
];

export default function BacktestEaMt5Page() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="How to backtest an EA in MT5"
      intro="MetaTrader 5's Strategy Tester runs a compiled Expert Advisor against historical prices and reports how it would have traded. Here's how to set it up, which modelling mode to choose, and how to read the results honestly."
    >
      <ArticleSection title="Running a backtest">
        <ArticleSteps steps={STEPS} />
      </ArticleSection>

      <ArticleSection title="Choosing a modelling mode">
        <ArticleSteps steps={MODES} />
      </ArticleSection>

      <ArticleSection title="Reading the report">
        <ArticleSteps steps={REPORT} />
      </ArticleSection>

      <ArticleSection title="What a backtest can't tell you">
        <p>
          A backtest shows how your rules behaved on one stretch of history, not what they&apos;ll do next.
          Tuning inputs until the curve looks perfect usually fits noise rather than finding an edge, so
          test on a period you didn&apos;t tune on, then run the EA on a demo account.{" "}
          <Link href="/learn/how-to-backtest-a-trading-strategy" className="text-secondary hover:underline">
            More on backtesting pitfalls
          </Link>
          .
        </p>
      </ArticleSection>

      <ArticleFaq items={FAQ} />

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/learn/how-to-add-expert-advisor-mt5" className="text-secondary hover:underline">
          How to install an EA in MT5
        </Link>{" "}
        ·{" "}
        <Link href="/how-to-create-mt5-ea" className="text-secondary hover:underline">
          Create an EA from your strategy
        </Link>
      </p>
    </ArticleShell>
  );
}

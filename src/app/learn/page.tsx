import Link from "next/link";
import { Header } from "@/components/Header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Learn — StratoBot AI",
  description: "Reference guides on Expert Advisors, MQL4 vs MQL5, algorithmic trading, and automating a strategy without coding.",
  path: "/learn",
});

const ARTICLES = [
  {
    href: "/learn/what-is-an-expert-advisor",
    title: "What Is an Expert Advisor (EA)?",
    body: "The basics of what an EA actually is and how it trades on your behalf.",
  },
  {
    href: "/learn/mql4-vs-mql5",
    title: "MQL4 vs MQL5: What's the Difference?",
    body: "The real architectural differences between the two languages — and why they matter.",
  },
  {
    href: "/learn/what-is-algorithmic-trading",
    title: "What Is Algorithmic Trading?",
    body: "How rules-based automated trading actually works, and what it doesn't promise.",
  },
  {
    href: "/learn/pips-lots-leverage-explained",
    title: "Pips, Lots, and Leverage Explained",
    body: "The units every position-sizing and risk calculation depends on.",
  },
  {
    href: "/learn/common-automation-mistakes",
    title: "Common Mistakes When Automating a Strategy",
    body: "The gaps that turn a good manual strategy into a broken EA.",
  },
  {
    href: "/learn/how-to-add-expert-advisor-mt5",
    title: "How to Add an Expert Advisor to MT5",
    body: "Where the file goes, compiling, attaching it to a chart, Algo Trading, and fixing an EA that won't trade.",
  },
  {
    href: "/learn/how-to-backtest-an-ea-in-mt5",
    title: "How to Backtest an EA in MT5",
    body: "Strategy Tester settings, which modelling mode to pick, and how to read the report honestly.",
  },
  {
    href: "/learn/run-ea-on-mt5-mobile",
    title: "Can You Run an EA on MT5 Mobile?",
    body: "Why the Android and iPhone apps can't run EAs, and three ways to keep one trading anyway.",
  },
  {
    href: "/learn/convert-mt4-ea-to-mt5",
    title: "How to Convert an MT4 EA to MT5",
    body: "What changes between MQL4 and MQL5, why an .ex4 can't be converted, and your realistic options.",
  },
  {
    href: "/learn/mt5-ea-for-prop-firms",
    title: "Using an MT5 EA on a Prop Firm Account",
    body: "What firms typically restrict, and how to make an EA respect daily loss, drawdown and consistency rules.",
  },
  {
    href: "/learn/how-to-backtest-a-trading-strategy",
    title: "How to Backtest a Trading Strategy",
    body: "The real methods — chart replay, MetaTrader's Strategy Tester, dedicated engines — and what backtesting can't tell you.",
  },
];

export default function LearnPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Learn" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Learn</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Reference guides on the concepts behind automated trading — evergreen, not
            time-sensitive.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ARTICLES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-outline bg-slate px-4 py-3.5 hover:border-signal/50 transition-colors"
            >
              <p className="text-sm font-semibold text-chalk mb-1">{a.title}</p>
              <p className="text-xs text-chalk/70 leading-relaxed">{a.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Trading Strategy to EA — By Strategy Type",
  description: "How different kinds of trading strategies — trend-following, breakout, mean-reversion, session-based — become MT5 Expert Advisors.",
  path: "/trading-strategy-to-ea",
});

const STRATEGY_TYPES = [
  {
    icon: "trending_up",
    title: "Trend-following",
    example: "e.g. moving average crossovers, ATR-filtered entries",
    body: "Maps to entry blocks that trigger on indicator conditions (crossovers, threshold breaks) plus a trailing stop to ride the move.",
  },
  {
    icon: "call_split",
    title: "Breakout",
    example: "e.g. prior-day-high sweep, range breakout",
    body: "Maps to level-detection blocks (session highs/lows, ranges) combined with a confirmation entry once price clears the level.",
  },
  {
    icon: "sync_alt",
    title: "Mean-reversion / retracement",
    example: "e.g. 50% retrace entries, RSI oversold/overbought",
    body: "Maps to retracement or oscillator-threshold blocks that wait for price to pull back before entering.",
  },
  {
    icon: "schedule",
    title: "Session-based",
    example: "e.g. London killzone, New York open",
    body: "Maps to a trading-hours filter block layered on top of whatever entry logic runs during that window.",
  },
  {
    icon: "candlestick_chart",
    title: "Price-action / candle patterns",
    example: "e.g. engulfing candle, pin bar confirmation",
    body: "Maps to candle-pattern detection blocks used as a confirmation trigger alongside your other conditions.",
  },
];

export default function TradingStrategyToEaPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Strategy types" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            How your kind of strategy becomes an EA
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Most trading strategies fall into a handful of families. Here&apos;s how each one
            typically maps to StratoBot&apos;s blocks — find yours below.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {STRATEGY_TYPES.map((t) => (
            <div key={t.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {t.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk">{t.title}</p>
                <p className="text-[11px] text-chalk/40 mb-1.5">{t.example}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{t.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="text-sm text-chalk/85 leading-relaxed">
            Combine two or more of these? That&apos;s normal — most real strategies layer a
            session filter, an entry trigger, and a confirmation together. Describe all of it at
            once and StratoBot maps each part separately.
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Not sure which fits?{" "}
          <Link href="/library" className="text-secondary hover:underline">
            Browse example strategies
          </Link>{" "}
          · <Link href="/adjust?new=1" className="text-secondary hover:underline">
            Build with blocks instead
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

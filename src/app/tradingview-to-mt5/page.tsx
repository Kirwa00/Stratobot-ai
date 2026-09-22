import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Move Your TradingView Strategy to MT5",
  description: "Have a strategy built on TradingView? Here's how to bring the same rules to MetaTrader 5 as a real EA — honestly, without a fake one-click Pine Script converter.",
  path: "/tradingview-to-mt5",
});

export default function TradingViewToMt5Page() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="TradingView to MT5" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Bringing a TradingView strategy to MT5
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            You built and tested a strategy on TradingView. Now you want it running as a real EA
            in MetaTrader 5. Here&apos;s the honest version of how that works.
          </p>
        </div>

        <div className="rounded-lg border border-caution bg-caution-bg/20 px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-caution mb-1.5">
            What we won&apos;t claim
          </p>
          <p className="text-sm text-chalk/80 leading-relaxed">
            Pine Script (TradingView) and MQL5 (MetaTrader) are different languages built for
            different platforms. There&apos;s no honest one-click button that turns one into the
            other — anything claiming automatic Pine-to-MQL5 conversion is glossing over a lot of
            real differences in how the two platforms handle bars, orders, and execution.
          </p>
        </div>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-1.5">
            What actually works
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            The logic in your Pine script — your entries, exits, stop-loss, take-profit, and
            filters — can be described in plain language, the same way you&apos;d explain it to
            another trader. StratoBot maps that description to real MQL5 blocks and builds a
            genuine MT5 EA from it.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            What to bring with you
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-chalk/70">
            {[
              "The exact entry condition(s) your Pine script checks for",
              "Exit logic — stop-loss, take-profit, or trailing rules",
              "Any session/time filters or indicator thresholds",
              "The instrument and timeframe you tested it on",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-buy text-base mt-0.5">check</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Not sure how your strategy type maps over?{" "}
          <Link href="/trading-strategy-to-ea" className="text-secondary hover:underline">
            See strategy types → EA blocks
          </Link>
        </p>

        <CtaBanner
          title="Describe your TradingView strategy"
          body="Type the same rules in plain language and see the read-back — free, no account needed."
        />
      </main>
    </div>
  );
}

import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PRO_DAYS, PRICE_KES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Convert Your Trading Strategy to an EA — StratoBot AI",
  description:
    "Turn a trading strategy you describe in plain language into a real MT5 Expert Advisor. No MQL4/MQL5 programming, no hiring a programmer.",
  path: "/convert-strategy-to-ea",
});

const OLD_WAY_STEPS = [
  "Write a technical spec",
  "Find an MQL4/MQL5 programmer",
  "Explain the strategy, repeatedly",
  "Pay upfront",
  "Wait 2–4+ weeks",
  "Test it yourself",
  "Request revisions",
  "Pay again",
];

export default function ConvertStrategyToEaPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Convert strategy to EA" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-8">
        {/* Hero */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-2">
            Strategy → EA
          </p>
          <h1 className="font-display font-bold text-2xl text-chalk mb-3">
            Convert your trading strategy into an Expert Advisor
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            You create the strategy. StratoBot creates the EA. Describe your entries, exits, and
            risk rules in plain language — no MQL4/MQL5 programming required.
          </p>
        </div>

        {/* Problem */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            The problem
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed mb-3">
            You have a strategy, but turning it into an automated system usually means hiring an
            MQL4/MQL5 programmer:
          </p>
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
            <ol className="flex flex-col gap-1.5 text-sm text-chalk/60">
              {OLD_WAY_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-chalk/40 mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="line-through decoration-chalk/30">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* How it works */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-3">
            How StratoBot does it instead
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "edit_note", label: "Describe" },
              { icon: "science", label: "Check it" },
              { icon: "lock_open", label: "Unlock" },
              { icon: "download", label: "Download" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-outline bg-slate px-3 py-3 flex flex-col items-center gap-1.5 text-center">
                <span className="material-symbols-outlined text-signal text-xl">{s.icon}</span>
                <span className="text-sm font-medium text-chalk">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            Example
          </p>
          <div className="rounded-lg bg-ink border border-outline px-4 py-4 mb-3">
            <p className="font-mono text-[13px] text-chalk/70 leading-relaxed">
              <span className="text-signal">&gt;</span> &ldquo;London killzone, sweep PDH, enter on
              50% retrace, trail stop 30 pips&rdquo;
            </p>
          </div>
          <p className="text-sm text-chalk/85 leading-relaxed mb-2">Becomes an EA with:</p>
          <ul className="flex flex-col gap-1.5 text-sm text-chalk/70">
            {[
              "A session-time filter for the London killzone",
              "Prior-day-high sweep detection",
              "A 50% retracement entry condition",
              "A trailing stop set to 30 pips",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-buy text-base mt-0.5">check</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Output */}
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            What you actually get
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            A real, compilable <code className="text-signal">.mq5</code> file — not a black box.
            Open it in MetaEditor, compile it, and run it in MetaTrader 5. The code comes from a
            fixed library of hand-written templates, not freeform AI generation, so it&apos;s the
            same predictable structure every time.
          </p>
        </div>

        {/* Honesty note */}
        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Before you download, StratoBot runs a free logic check — a synthetic simulation that
            confirms your rules fire the way you described. It is not a backtest against real
            market history and not a promise of profitability. Always test on a demo account
            first.
          </p>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1.5">
            Pricing
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Free to describe your strategy and run logic checks. KES{" "}
            {PRICE_KES.toLocaleString("en-KE")} unlocks unlimited strategies and downloads for{" "}
            {PRO_DAYS} days.{" "}
            <Link href="/pricing" className="text-secondary hover:underline">
              See full pricing
            </Link>
            .
          </p>
        </div>

        <p className="text-sm text-chalk/70 text-center">
          Comparing this to hiring a programmer?{" "}
          <Link href="/compare/ea-programmer-alternative" className="text-secondary hover:underline">
            See the comparison
          </Link>{" "}
          · <Link href="/faq" className="text-secondary hover:underline">Read the FAQ</Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

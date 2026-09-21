import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export const metadata = {
  title: "Forex Risk Management — StratoBot AI",
  description: "The core risk management concepts every automated strategy needs — position sizing, stop-loss discipline, drawdown limits, and risk of ruin.",
};

const PRINCIPLES = [
  {
    icon: "percent",
    title: "Risk a fixed % per trade, not a fixed lot size",
    body: "A fixed lot size means your risk grows and shrinks with stop-loss distance unpredictably. Risking a consistent % of account balance keeps every trade's downside comparable.",
    href: "/tools/position-size-calculator",
    linkText: "Position size calculator",
  },
  {
    icon: "block",
    title: "Every trade needs a stop-loss, no exceptions",
    body: "A strategy without a hard stop isn't risk-managed — it's a strategy hoping the market cooperates. StratoBot flags a strategy with no exit blocks, but it won't invent a stop-loss for you — describing one explicitly is on you.",
  },
  {
    icon: "trending_down",
    title: "Know your maximum acceptable drawdown before you start",
    body: "Decide the drawdown level that would make you stop trading a strategy — before you're actually in it and reasoning emotionally.",
    href: "/tools/drawdown-calculator",
    linkText: "Drawdown calculator",
  },
  {
    icon: "warning",
    title: "Check your risk of ruin, not just your average return",
    body: "A strategy can have a positive average return and still carry a meaningful chance of blowing the account, depending on risk per trade and win rate.",
    href: "/tools/risk-of-ruin-calculator",
    linkText: "Risk of ruin calculator",
  },
  {
    icon: "receipt_long",
    title: "Account for trading costs before trusting an edge",
    body: "Spread, commission, and swap are real costs that reduce expectancy — especially for higher-frequency strategies.",
    href: "/tools/trading-cost-calculator",
    linkText: "Trading cost calculator",
  },
];

export default function RiskManagementPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Risk management" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Risk management for automated strategies
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            An EA executes your rules perfectly and without hesitation — which means bad risk
            rules get executed just as faithfully as good ones. These are the basics worth
            getting right before you automate anything.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {p.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-1">{p.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed mb-2">{p.body}</p>
                {p.href && (
                  <Link href={p.href} className="text-xs font-semibold text-secondary hover:underline">
                    {p.linkText} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/performance" className="text-secondary hover:underline">
            How to evaluate performance
          </Link>
        </p>

        <CtaBanner
          title="Build risk rules into your EA from the start"
          body="Describe your stop-loss and position sizing rules along with your entry logic."
        />
      </main>
    </div>
  );
}

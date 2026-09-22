import Link from "next/link";
import { Header } from "@/components/Header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Free Forex Trading Calculators — StratoBot AI",
  description: "Free calculators for position sizing, drawdown, risk of ruin, prop firm targets, trading costs, and more.",
  path: "/tools",
});

const CALCULATORS = [
  {
    href: "/tools/position-size-calculator",
    icon: "straighten",
    title: "Position Size Calculator",
    body: "How many lots to trade based on your account risk %.",
  },
  {
    href: "/tools/lot-size-calculator",
    icon: "calculate",
    title: "Lot Size Calculator",
    body: "Convert between lots, units, and pip value.",
  },
  {
    href: "/tools/forex-risk-calculator",
    icon: "shield",
    title: "Forex Risk Calculator",
    body: "How much you're risking on a trade you've already sized.",
  },
  {
    href: "/tools/drawdown-calculator",
    icon: "trending_down",
    title: "Drawdown Calculator",
    body: "Your current drawdown, and the gain needed to recover from it.",
  },
  {
    href: "/tools/forex-profit-calculator",
    icon: "payments",
    title: "Forex Profit Calculator",
    body: "The P/L of a specific trade you specify, in your account currency.",
  },
  {
    href: "/tools/compound-trading-calculator",
    icon: "show_chart",
    title: "Compound Trading Calculator",
    body: "How compounding math works over time — not a return forecast.",
  },
  {
    href: "/tools/prop-firm-calculator",
    icon: "flag",
    title: "Prop Firm Calculator",
    body: "Turn a prop firm challenge's % rules into real dollar targets.",
  },
  {
    href: "/tools/prop-firm-consistency-calculator",
    icon: "balance",
    title: "Prop Firm Consistency Calculator",
    body: "Check whether one trading day breaks a firm's consistency rule.",
  },
  {
    href: "/tools/risk-of-ruin-calculator",
    icon: "warning",
    title: "Risk of Ruin Calculator",
    body: "Estimate ruin risk from your win rate and risk per trade.",
  },
  {
    href: "/tools/ea-profit-calculator",
    icon: "smart_toy",
    title: "EA Expected Value Calculator",
    body: "Expected P/L from stats you provide — not a prediction.",
  },
  {
    href: "/tools/trading-cost-calculator",
    icon: "receipt_long",
    title: "Trading Cost Calculator",
    body: "Spread, commission, and swap costs across your trades.",
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Calculators" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Free trading calculators
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            No account needed. Real formulas, plain math — none of these predict what any trade
            or strategy will actually do.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CALCULATORS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3 hover:border-signal/50 transition-colors"
            >
              <span className="material-symbols-outlined text-signal text-xl shrink-0">
                {c.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-chalk mb-0.5">{c.title}</p>
                <p className="text-xs text-chalk/70 leading-relaxed">{c.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

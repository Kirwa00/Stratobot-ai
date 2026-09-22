import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { ForexProfitCalculator } from "@/components/calculators/ForexProfitCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forex Profit Calculator — StratoBot AI",
  description: "Calculate the profit or loss of a specific forex trade in dollars, given pips and lot size.",
  path: "/tools/forex-profit-calculator",
});

export default function ForexProfitCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Profit calculator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Forex profit calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Work out the dollar P/L of a trade you specify — a real trade you took, or one
            you&apos;re considering. Not a prediction of future results.
          </p>
        </div>

        <ForexProfitCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/trading-cost-calculator" className="text-secondary hover:underline">
            Add in spread &amp; commission
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

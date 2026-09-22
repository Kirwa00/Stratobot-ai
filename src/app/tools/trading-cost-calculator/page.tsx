import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { TradingCostCalculator } from "@/components/calculators/TradingCostCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Trading Cost Calculator — StratoBot AI",
  description: "Calculate total trading costs — spread, commission, and swap — across a series of trades.",
  path: "/tools/trading-cost-calculator",
});

export default function TradingCostCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Trading costs" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Trading cost calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Spread, commission, and swap add up — see the real cost of trading before it eats
            into a strategy&apos;s edge.
          </p>
        </div>

        <TradingCostCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/forex-profit-calculator" className="text-secondary hover:underline">
            Calculate a trade&apos;s raw P/L
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

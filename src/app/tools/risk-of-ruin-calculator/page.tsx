import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { RiskOfRuinCalculator } from "@/components/calculators/RiskOfRuinCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Risk of Ruin Calculator — StratoBot AI",
  description: "Estimate risk of ruin from your win rate and risk per trade, using a simplified 1:1 reward-to-risk model.",
  path: "/tools/risk-of-ruin-calculator",
});

export default function RiskOfRuinCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Risk of ruin" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Risk of ruin calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            A simplified estimate of how your win rate and risk-per-trade combine to put your
            account at risk — useful for comparing settings, not as an exact forecast.
          </p>
        </div>

        <RiskOfRuinCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/position-size-calculator" className="text-secondary hover:underline">
            Size positions by risk %
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

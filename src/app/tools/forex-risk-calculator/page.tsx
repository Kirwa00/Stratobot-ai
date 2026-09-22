import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { ForexRiskCalculator } from "@/components/calculators/ForexRiskCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forex Risk Calculator — StratoBot AI",
  description: "Calculate the dollar and percentage risk of a forex trade you've already sized, given your stop-loss distance.",
  path: "/tools/forex-risk-calculator",
});

export default function ForexRiskCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Risk calculator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Forex risk calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Already know the lot size you want to trade? See exactly how much you&apos;re risking
            if the stop-loss is hit.
          </p>
        </div>

        <ForexRiskCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/position-size-calculator" className="text-secondary hover:underline">
            Work backward from a target risk % instead
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

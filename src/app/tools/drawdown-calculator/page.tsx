import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { DrawdownCalculator } from "@/components/calculators/DrawdownCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Drawdown Calculator — StratoBot AI",
  description: "Calculate your current drawdown percentage and the gain required to recover from it.",
  path: "/tools/drawdown-calculator",
});

export default function DrawdownCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Drawdown" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Drawdown calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            See your drawdown as a percentage, and the gain it actually takes to get back to
            even — recovery math isn&apos;t symmetric with loss.
          </p>
        </div>

        <DrawdownCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

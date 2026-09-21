import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { CompoundTradingCalculator } from "@/components/calculators/CompoundTradingCalculator";

export const metadata = {
  title: "Compound Trading Calculator — StratoBot AI",
  description: "See how compounding math works over time. This is not a return forecast — no real strategy delivers a constant return every period.",
};

export default function CompoundTradingCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Compounding" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Compound trading calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            This tool shows how compounding math behaves — not what your actual trading will do.
            Real returns vary and include losing periods; this assumes neither.
          </p>
        </div>

        <CompoundTradingCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/risk-of-ruin-calculator" className="text-secondary hover:underline">
            See the risk side of the equation
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

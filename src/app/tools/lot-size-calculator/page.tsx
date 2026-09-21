import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { LotSizeCalculator } from "@/components/calculators/LotSizeCalculator";

export const metadata = {
  title: "Lot Size Calculator — StratoBot AI",
  description: "Convert a forex lot size into units, standard/mini/micro lots, and pip value.",
};

export default function LotSizeCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Lot size" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Lot size calculator</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            A quick reference for converting a lot size into units, mini/micro lots, and pip
            value — not a risk calculation.
          </p>
        </div>

        <LotSizeCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/position-size-calculator" className="text-secondary hover:underline">
            Size a position by risk % instead
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

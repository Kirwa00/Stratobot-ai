import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PropFirmConsistencyCalculator } from "@/components/calculators/PropFirmConsistencyCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Prop Firm Consistency Calculator — StratoBot AI",
  description: "Check whether your best trading day breaks a prop firm's consistency rule, and see the max profit any single day can carry.",
  path: "/tools/prop-firm-consistency-calculator",
});

export default function PropFirmConsistencyCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Consistency rule" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Prop firm consistency calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Many prop firms cap how much of your total profit one single day can account for.
            Check your numbers against that limit before you request a payout.
          </p>
        </div>

        <PropFirmConsistencyCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/tools/prop-firm-calculator" className="text-secondary hover:underline">
            Prop firm % rules in dollars
          </Link>
          {" "}·{" "}
          <Link href="/prop-firms" className="text-secondary hover:underline">
            Compare prop firms
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

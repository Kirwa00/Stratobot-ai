import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { EaExpectedValueCalculator } from "@/components/calculators/EaExpectedValueCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "EA Expected Value Calculator — StratoBot AI",
  description: "Calculate the theoretical expected value of an EA from a win rate and average win/loss you provide — not a profit prediction.",
  path: "/tools/ea-profit-calculator",
});

export default function EaProfitCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="EA expected value" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            EA expected value calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Enter stats from a backtest, logic check, or live results — this does the expected
            value math on the numbers you give it. It doesn&apos;t forecast what an EA will
            actually earn.
          </p>
        </div>

        <EaExpectedValueCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">All calculators</Link>
          {" "}·{" "}
          <Link href="/how-it-works" className="text-secondary hover:underline">
            How StratoBot&apos;s logic check works
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PositionSizeCalculator } from "@/components/calculators/PositionSizeCalculator";

export const metadata = {
  title: "Position Size Calculator — StratoBot AI",
  description: "Calculate the right forex position size in lots based on your account balance, risk %, and stop-loss distance.",
};

export default function PositionSizeCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="Position size" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Position size calculator
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Work out how many lots to trade so a stopped-out trade only costs the % of your
            account you actually intend to risk.
          </p>
        </div>

        <PositionSizeCalculator />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools" className="text-secondary hover:underline">
            All calculators
          </Link>{" "}
          · <Link href="/tools/forex-risk-calculator" className="text-secondary hover:underline">
            Already picked a lot size? Check your risk instead
          </Link>
        </p>

        <CtaBanner
          title="Have this position sized — now automate the strategy"
          body="Turn the rules around this trade into a real MT5 EA, described in plain language."
        />
      </main>
    </div>
  );
}

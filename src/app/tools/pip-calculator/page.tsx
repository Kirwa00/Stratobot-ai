import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { PipCalculator } from "@/components/calculators/PipCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pip Calculator — Pip Value in USD and KES | StratoBot AI",
  description:
    "Free forex pip calculator: find the pip value of any lot size on EUR/USD, GBP/USD, USD/JPY and other majors and crosses, in US dollars or Kenyan shillings.",
  path: "/tools/pip-calculator",
});

const FAQ = [
  {
    q: "What is a pip in forex?",
    a: "A pip is the standard unit of price movement. For most pairs it is the fourth decimal place (0.0001). For pairs quoted in Japanese yen, such as USD/JPY, it is the second decimal place (0.01).",
  },
  {
    q: "How do you calculate pip value?",
    a: "Pip value = pip size × number of units. One standard lot is 100,000 units, so on EUR/USD one pip is 0.0001 × 100,000 = $10. If the pair isn't quoted in US dollars, convert that amount into dollars at the current exchange rate.",
  },
  {
    q: "How much is one pip worth on 0.01 lots?",
    a: "On pairs quoted in US dollars (EUR/USD, GBP/USD, AUD/USD), one pip on 0.01 lots (a micro lot) is worth $0.10. On 0.1 lots it is $1, and on 1 lot it is $10.",
  },
  {
    q: "Why does pip value change on USD/JPY?",
    a: "Because the profit is earned in yen, then converted to dollars. When the USD/JPY price moves, the dollar value of a 1,000-yen pip changes with it.",
  },
  {
    q: "Can I see pip value in Kenyan shillings?",
    a: "Yes. Enter the current USD/KES rate and the calculator converts the dollar pip value into shillings.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const TABLE = [
  { lots: "1.00", name: "Standard lot", value: "$10.00" },
  { lots: "0.10", name: "Mini lot", value: "$1.00" },
  { lots: "0.01", name: "Micro lot", value: "$0.10" },
];

export default function PipCalculatorPage() {
  return (
    <div className="flex flex-col flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <Header back title="Pip calculator" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Pip calculator</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Find out what one pip is worth for your lot size, on majors and crosses, in US dollars
            or Kenyan shillings.
          </p>
        </div>

        <PipCalculator />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-chalk">Pip value cheat sheet (USD-quoted pairs)</h2>
          <p className="text-sm text-chalk/70 leading-relaxed">
            For EUR/USD, GBP/USD, AUD/USD and NZD/USD, pip value doesn&apos;t depend on the price —
            only on lot size:
          </p>
          <div className="rounded-lg border border-outline overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate text-chalk/60 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Lots</th>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-right px-4 py-2 font-medium">Value per pip</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row) => (
                  <tr key={row.lots} className="border-t border-outline">
                    <td className="px-4 py-2 mono-num text-chalk">{row.lots}</td>
                    <td className="px-4 py-2 text-chalk/80">{row.name}</td>
                    <td className="px-4 py-2 mono-num text-right text-chalk">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-chalk">Pip calculator questions</h2>
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <h3 className="text-sm font-semibold text-chalk mb-1">{q}</h3>
              <p className="text-xs text-chalk/70 leading-relaxed">{a}</p>
            </div>
          ))}
        </section>

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/tools/position-size-calculator" className="text-secondary hover:underline">
            Size a trade by risk %
          </Link>{" "}
          ·{" "}
          <Link href="/learn/pips-lots-leverage-explained" className="text-secondary hover:underline">
            Pips, lots and leverage explained
          </Link>{" "}
          ·{" "}
          <Link href="/tools" className="text-secondary hover:underline">
            All calculators
          </Link>
        </p>

        <CtaBanner
          title="Put your pip targets into an EA"
          body="Describe your stop loss and take profit in pips, and StratoBot builds them into an MT5 Expert Advisor. Free to try."
        />
      </main>
    </div>
  );
}

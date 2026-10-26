import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { TrackView } from "@/components/TrackView";
import { FREE_SIMS, PRO_DAYS, PRICE_EA_SHORT, PRICE_PER_EA, PRICE_PRO_SHORT, PRO_PER_MONTH } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing — StratoBot AI",
  description: `Your first MT5 EA is free. After that, ${PRICE_PER_EA}, or Pro for ${PRO_PER_MONTH}. Describing and checking strategies is always free.`,
  path: "/pricing",
});

// Every answer below describes what the app actually does today (lib/store.tsx,
// app/unlock, app/download). Where a policy hasn't been decided, the page says so
// instead of inventing one.
const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "What's free?",
    a: `Describing strategies, reviewing the rules, ${FREE_SIMS} logic checks, and your first EA as a downloadable .mq5 file. No account needed.`,
  },
  {
    q: "What does an EA cost after that?",
    a: `${PRICE_PER_EA}, one-off. You can adjust that strategy and download it again without paying twice.`,
  },
  {
    q: "When is Pro worth it?",
    a: `If you rebuild often. Pro is ${PRO_PER_MONTH}: unlimited strategies, downloads and logic checks for ${PRO_DAYS} days. It doesn't renew automatically.`,
  },
  {
    q: "Do I keep the EAs I downloaded?",
    a: "Yes. Each download is an ordinary .mq5 file saved to your device. It keeps working forever, and you can edit, compile, and share it.",
  },
  {
    q: "Where is my strategy saved?",
    a: "In this browser only. There are no accounts yet, so clearing your browser data or switching devices starts you fresh. Download the file to keep it.",
  },
  {
    q: "Any other costs?",
    a: "Not from StratoBot. You'll need MetaTrader 5 (free from your broker) on a Windows PC or VPS to compile and run the EA; a VPS and broker trading costs are separate.",
  },
  {
    q: "How do I pay?",
    a: "By M-Pesa. Checkout is opening soon; until then you can get your first EA free, and your strategies stay saved in your browser.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col flex-1">
      <TrackView event="pricing_viewed" props={{ page: "pricing" }} />
      <Header back title="Pricing" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">Simple pricing</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Describe and check any strategy for free, and get your first EA free. Pay only
            for the EAs you keep building after that.
          </p>
        </div>

        <Plan
          name="Free"
          price="KES 0"
          note="No account, no card, no time limit."
          tone="free"
          lines={[
            "Describe a strategy in plain language",
            "See exactly what the bot will do, rule by rule",
            `${FREE_SIMS} free logic checks that explain every trade`,
            "Your first EA as an .mq5 file, free",
          ]}
        />
        <Plan
          name="Each EA after that"
          price={PRICE_EA_SHORT}
          note="One-off. The file is yours to keep."
          tone="main"
          lines={[
            "Your strategy as an MQL5 (.mq5) source file, ready to compile in MetaTrader 5",
            "Adjust it and re-download without paying again",
          ]}
        />
        <Plan
          name="Pro"
          price={PRICE_PRO_SHORT}
          per="/ month"
          note={`For traders who rebuild often. A ${PRO_DAYS}-day pass that doesn't renew automatically.`}
          tone="plain"
          lines={["Unlimited strategies and downloads", "Unlimited logic checks"]}
        />

        <p className="text-xs text-chalk/60 text-center">
          Pay by M-Pesa. Checkout is opening soon; your first EA is free now.
        </p>

        <section aria-labelledby="pricing-faq">
          <h2 id="pricing-faq" className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-3">
            What you get, exactly
          </h2>
          <dl className="flex flex-col gap-3">
            {QUESTIONS.map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-outline px-4 py-3">
                <dt className="text-sm font-semibold text-chalk mb-1">{q}</dt>
                <dd className="text-sm text-chalk/70 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-sm text-chalk/70 text-center">
          More questions?{" "}
          <Link href="/faq" className="text-secondary hover:underline">
            Read the FAQ
          </Link>
        </p>

        <CtaBanner />
      </main>
    </div>
  );
}

function Plan({
  name,
  price,
  per,
  note,
  lines,
  tone,
}: {
  name: string;
  price: string;
  per?: string;
  note: string;
  lines: string[];
  tone: "free" | "main" | "plain";
}) {
  const border = tone === "main" ? "border-signal/40" : tone === "free" ? "border-buy/40" : "border-outline";
  return (
    <div className={`rounded-lg border ${border} bg-slate px-4 py-4`}>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display font-bold text-lg text-chalk">{name}</h2>
        <p className="text-right">
          <span className="font-display font-bold text-lg text-chalk mono-num">{price}</span>
          {per && <span className="text-sm text-chalk/60"> {per}</span>}
        </p>
      </div>
      <p className="text-xs text-chalk/50 mb-3">{note}</p>
      <ul className="flex flex-col gap-2 text-sm text-chalk/85">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span
              className={`material-symbols-outlined text-base mt-0.5 ${tone === "plain" ? "text-chalk/40" : "text-signal"}`}
              aria-hidden="true"
            >
              check
            </span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

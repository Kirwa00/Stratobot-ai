import Link from "next/link";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";
import { YouTubeExplainer } from "@/components/YouTubeExplainer";
import { PRICE_PER_EA, PRO_PER_MONTH } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "fxDreema Alternative — Build an MT5 EA by Describing It | StratoBot",
  description:
    "Looking for an fxDreema alternative? StratoBot builds an MT5 Expert Advisor from a plain-language description instead of connected blocks. An honest comparison, including when fxDreema is the better pick.",
  path: "/compare/fxdreema-alternative",
});

// fxDreema facts are taken from fxdreema.com and its purchase page (checked October 2026).
// Keep them to what that site states; don't add prices or claims we can't verify.
const ROWS: { label: string; fxdreema: string; stratobot: string }[] = [
  {
    label: "How you build",
    fxdreema: "Place blocks and connect them visually",
    stratobot: "Describe the strategy in plain language",
  },
  {
    label: "Platforms",
    fxdreema: "MetaTrader 4 and MetaTrader 5",
    stratobot: "MetaTrader 5 only",
  },
  {
    label: "Free version",
    fxdreema: "Up to 10 block connections and 100 blocks per project",
    stratobot: "Describe, read back and run logic checks free",
  },
  {
    label: "Paid",
    fxdreema: "Subscriptions from 1 to 12 months",
    stratobot: `First EA free, then ${PRICE_PER_EA} (or Pro, ${PRO_PER_MONTH})`,
  },
  {
    label: "Before you download",
    fxdreema: "You see the block diagram you built",
    stratobot: "A line-by-line read-back of your rules and a logic check that explains each simulated trade",
  },
  {
    label: "Range of logic",
    fxdreema: "Large block library, very flexible",
    stratobot: "Smaller, fixed set of tested building blocks",
  },
];

export default function FxDreemaAlternativePage() {
  return (
    <div className="flex flex-col flex-1">
      <Header back title="fxDreema alternative" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            An fxDreema alternative for traders who&apos;d rather describe than wire
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            fxDreema is a well-known visual EA builder: you place blocks and connect them into
            logic. StratoBot takes a different route — you write your strategy in plain language,
            check what it understood, and download an MT5 Expert Advisor. Neither needs coding.
            Here&apos;s how they differ, honestly.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-chalk">Side by side</h2>
          <div className="flex flex-col gap-2 sm:hidden">
            {ROWS.map((r) => (
              <div key={r.label} className="rounded-lg border border-outline bg-slate px-4 py-3">
                <p className="text-sm font-semibold text-chalk mb-1.5">{r.label}</p>
                <p className="text-xs text-chalk/75 leading-relaxed">
                  <span className="font-semibold text-chalk/60">fxDreema: </span>
                  {r.fxdreema}
                </p>
                <p className="text-xs text-chalk/75 leading-relaxed mt-1">
                  <span className="font-semibold text-signal">StratoBot: </span>
                  {r.stratobot}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden sm:block rounded-lg border border-outline overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate text-chalk/60 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium w-[28%]"></th>
                  <th className="text-left px-4 py-2 font-medium">fxDreema</th>
                  <th className="text-left px-4 py-2 font-medium">StratoBot</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.label} className="border-t border-outline align-top">
                    <th scope="row" className="text-left px-4 py-2.5 font-medium text-chalk">{r.label}</th>
                    <td className="px-4 py-2.5 text-chalk/75">{r.fxdreema}</td>
                    <td className="px-4 py-2.5 text-chalk/75">{r.stratobot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-chalk/50">
            fxDreema details are from fxdreema.com as of October 2026. Check their site for current
            plans and prices.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-chalk">When StratoBot is the better fit</h2>
          <ul className="flex flex-col gap-2 text-sm text-chalk/80 leading-relaxed list-disc pl-5">
            <li>You can explain your strategy in a sentence or two, but wiring blocks feels slow.</li>
            <li>
              You want to see your rules{" "}
              <Link href="/how-it-works" className="text-secondary hover:underline">read back to you</Link>{" "}
              before you trust the EA.
            </li>
            <li>You trade on MT5 and want a real .mq5 source file you can open in MetaEditor.</li>
            <li>Your strategy uses common pieces: moving averages, RSI, crossovers, fixed stops and targets.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-chalk">When fxDreema is the better fit</h2>
          <ul className="flex flex-col gap-2 text-sm text-chalk/80 leading-relaxed list-disc pl-5">
            <li>
              You need an Expert Advisor for MetaTrader 4. StratoBot only builds for MT5 (see{" "}
              <Link href="/learn/mql4-vs-mql5" className="text-secondary hover:underline">MQL4 vs MQL5</Link>).
            </li>
            <li>Your logic is unusual or complex and needs blocks StratoBot doesn&apos;t have yet.</li>
            <li>You like seeing and editing every step of the logic as a diagram.</li>
          </ul>
          <p className="text-sm text-chalk/70 leading-relaxed">
            If a rule in your description is something StratoBot can&apos;t build, it tells you
            plainly instead of guessing — so you&apos;ll know quickly whether it fits.
          </p>
        </section>

        <div className="rounded-lg border border-caution bg-caution-bg/20 px-4 py-3.5">
          <p className="text-sm text-chalk/80 leading-relaxed">
            Whichever builder you use, an EA only automates your rules. It doesn&apos;t make a
            strategy profitable. Test it in MetaTrader&apos;s Strategy Tester and on a demo
            account before risking real money.
          </p>
        </div>

        <YouTubeExplainer heading="See StratoBot build an EA in 1 minute" />

        <p className="text-sm text-chalk/70 text-center">
          <Link href="/compare/ea-generator" className="text-secondary hover:underline">
            Questions to ask any EA generator
          </Link>{" "}
          ·{" "}
          <Link href="/how-to-create-mt5-ea" className="text-secondary hover:underline">
            How to create an MT5 EA
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="text-secondary hover:underline">
            Pricing
          </Link>
        </p>

        <p className="text-[11px] text-chalk/40 text-center">
          fxDreema is a product of its respective owners. StratoBot isn&apos;t affiliated with or
          endorsed by fxDreema.
        </p>

        <CtaBanner title="Try describing your strategy" />
      </main>
    </div>
  );
}

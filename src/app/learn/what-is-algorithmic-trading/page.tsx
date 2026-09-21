import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";

export const metadata = {
  title: "What Is Algorithmic Trading? — StratoBot AI",
  description: "A plain explanation of rules-based automated trading, and what it does and doesn't promise.",
};

export default function WhatIsAlgorithmicTradingPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="What is algorithmic trading?"
      intro="Algorithmic trading means a computer program makes and executes trading decisions based on a fixed set of rules — no emotion, no hesitation, and no judgment calls outside what the rules define."
    >
      <ArticleSection title="How it actually works">
        <p>
          A trader defines conditions — for entries, exits, position sizing, and risk — in
          advance. The program (an EA, on MetaTrader) then watches live price data and executes
          those conditions exactly, every time they occur, without a human deciding in the
          moment.
        </p>
      </ArticleSection>

      <ArticleSection title="Why traders do it">
        <ul className="flex flex-col gap-1.5">
          {[
            "Removes emotional decision-making — fear and greed don't affect a program",
            "Can watch markets and sessions a person can't stay awake for",
            "Executes instantly on a signal, without the delay of manual entry",
            "Applies the exact same rules every time, so results reflect the strategy, not the day's mood",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="material-symbols-outlined text-buy text-base mt-0.5">check</span>
              {line}
            </li>
          ))}
        </ul>
      </ArticleSection>

      <ArticleSection title="What it doesn't do">
        <p>
          Algorithmic trading doesn&apos;t make a bad strategy good. It executes whatever rules
          it&apos;s given with total consistency — including rules that are wrong, incomplete, or
          missing proper risk management. Automation is a multiplier on the strategy underneath
          it, not a substitute for having a sound one.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/automate-forex-strategy" className="text-secondary hover:underline">
          What automating your own strategy actually requires
        </Link>
      </p>
    </ArticleShell>
  );
}

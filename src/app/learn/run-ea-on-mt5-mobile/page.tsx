import Link from "next/link";
import { ArticleFaq, ArticleSection, ArticleShell, ArticleSteps } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Can You Run an EA on MT5 Mobile (Android or iPhone)? — StratoBot AI",
  description:
    "No: the MetaTrader 5 mobile apps can't run Expert Advisors. Here's why, and the three ways to keep an EA trading while you only carry a phone.",
  path: "/learn/run-ea-on-mt5-mobile",
});

const OPTIONS = [
  {
    title: "A computer that stays on",
    body: "Run the desktop version of MT5 with the EA attached and leave the computer running and online. Free, but a power cut, sleep mode or a Windows update stops the EA without warning.",
  },
  {
    title: "MetaQuotes' built-in virtual hosting",
    body: "Rent a small server from inside MT5 (right-click your account in the Navigator and choose Register a Virtual Server). Your EAs are copied to it and keep running with MT5 closed. You still need the desktop version once, to set it up.",
  },
  {
    title: "A forex VPS",
    body: (
      <>
        A remote Windows machine you log into, install MT5 on, and leave running. More control than the built-in
        hosting, and one VPS can run several terminals.{" "}
        <Link href="/vps" className="text-secondary hover:underline">
          Compare VPS options
        </Link>
        .
      </>
    ),
  },
];

const FAQ = [
  { q: "Can I run an Expert Advisor on the MT5 Android app?", a: "No. The MetaTrader 5 apps for Android and iPhone can't run Expert Advisors or custom indicators. EAs need the desktop version of MT5, either on your own computer or on a VPS." },
  { q: "Can I see my EA's trades on my phone?", a: "Yes. Log into the same trading account in the MT5 mobile app and you'll see every position the EA opens on the desktop or VPS, and you can close them manually." },
  { q: "What about apps that claim to run forex robots on Android?", a: "Treat them with suspicion. A real EA needs the MT5 desktop terminal; phone apps that promise automated profits are usually signal copiers, or worse." },
];

export default function RunEaOnMobilePage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="Can you run an EA on MT5 mobile?"
      intro="No. The MetaTrader 5 apps for Android and iPhone can't run Expert Advisors, and they can't compile them either. An EA needs the desktop version of MT5 running somewhere. Your phone becomes the place you watch it."
    >
      <ArticleSection title="Why it doesn't work on a phone">
        <p>
          The mobile apps are built for manual trading: charts, orders and account history. They don&apos;t include
          the engine that runs MQL5 programs, so there&apos;s nowhere for an EA to live. That&apos;s a MetaTrader
          limitation, not a broker setting, and it applies to every broker.
        </p>
      </ArticleSection>

      <ArticleSection title="Three ways to run an EA while you only carry a phone">
        <ArticleSteps steps={OPTIONS} />
      </ArticleSection>

      <ArticleSection title="Watching it from your phone">
        <p>
          Once the EA runs on a desktop or VPS, log into the same account in the MT5 mobile app. Its trades show up
          there in real time, and you can close a position by hand if you need to.
        </p>
      </ArticleSection>

      <ArticleFaq items={FAQ} />

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/learn/how-to-add-expert-advisor-mt5" className="text-secondary hover:underline">
          How to install an EA on desktop MT5
        </Link>{" "}
        ·{" "}
        <Link href="/vps" className="text-secondary hover:underline">
          VPS comparison
        </Link>
      </p>
    </ArticleShell>
  );
}

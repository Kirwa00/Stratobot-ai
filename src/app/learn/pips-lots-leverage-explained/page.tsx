import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pips, Lots, and Leverage Explained — StratoBot AI",
  description: "What pips, lots, and leverage actually mean in forex, and how they connect to position sizing.",
  path: "/learn/pips-lots-leverage-explained",
});

export default function PipsLotsLeverageExplainedPage() {
  return (
    <ArticleShell
      backTitle="Learn"
      title="Pips, lots, and leverage explained"
      intro="These three units show up in every position-sizing rule and every risk calculation — worth having solid before automating anything."
    >
      <ArticleSection title="Pip">
        <p>
          The smallest standard price move quoted for a currency pair — typically the fourth
          decimal place (0.0001) for most pairs, or the second decimal place (0.01) for pairs
          involving the Japanese yen. If EUR/USD moves from 1.1050 to 1.1051, that&apos;s one pip.
        </p>
      </ArticleSection>

      <ArticleSection title="Lot">
        <p>
          A unit of trade size. One standard lot is 100,000 units of the base currency. A mini
          lot is 10,000 units (0.1 lots), and a micro lot is 1,000 units (0.01 lots). Lot size
          directly determines how much each pip of movement is worth in your account currency —
          larger lots mean larger $ swings per pip.
        </p>
      </ArticleSection>

      <ArticleSection title="Leverage">
        <p>
          Leverage lets you control a position larger than your account balance by borrowing the
          difference from your broker. 100:1 leverage means $1,000 of your own capital can control
          a $100,000 position. Leverage amplifies both gains and losses proportionally — it
          doesn&apos;t change a strategy&apos;s edge, only the size of every outcome it produces.
        </p>
      </ArticleSection>

      <ArticleSection title="How they connect to risk">
        <p>
          Position size (lots), stop-loss distance (pips), and account risk % are the three
          numbers behind every proper risk calculation — get any one of them wrong and the actual
          dollar risk on a trade won&apos;t match what you intended.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/tools/position-size-calculator" className="text-secondary hover:underline">
          Calculate your position size
        </Link>{" "}
        · <Link href="/tools/lot-size-calculator" className="text-secondary hover:underline">
          Lot size converter
        </Link>
      </p>
    </ArticleShell>
  );
}

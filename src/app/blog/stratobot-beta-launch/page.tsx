import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "StratoBot Is in Private Beta — StratoBot AI Blog",
  description: "Why we opened a beta, what free 30-day access gets you, and what we're trying to learn from it.",
  path: "/blog/stratobot-beta-launch",
});

export default function StratobotBetaLaunchPost() {
  return (
    <ArticleShell
      backTitle="Blog"
      dateline="September 21, 2026"
      title="StratoBot is in private beta — here's what we're testing"
      intro="We opened a small beta program because the questions we actually need answered can't be answered by us alone, staring at our own product."
    >
      <ArticleSection title="What we're trying to learn">
        <p>
          The core engine — plain-language description → parsed rules → block editor → logic
          check → real .mq5 file — already works. What we don&apos;t know yet is where it breaks
          for strategies we didn&apos;t write ourselves, and where the wording confuses someone
          who isn&apos;t already inside our own head about how it should work.
        </p>
        <p>
          Every beta signup is someone testing that gap for us, on a real strategy they actually
          trade — not a demo strategy we picked to look good.
        </p>
      </ArticleSection>

      <ArticleSection title="What beta access actually gets you">
        <p>
          A real 30-day Pro pass — unlimited simulations, strategies, and downloads — free, in
          exchange for feedback. Not a trial with a feature ceiling, not a watered-down version:
          the same access as a paying customer.
        </p>
      </ArticleSection>

      <ArticleSection title="What we're asking in return">
        <p>
          Try it on a strategy you actually trade or want to trade, not just the example prompts.
          Tell us where the read-back got something wrong, where the block editor was confusing,
          or where the download and install steps didn&apos;t match what actually happened on your
          machine. The blunt version is the useful version.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/beta" className="text-secondary hover:underline">Join the beta desk</Link>
        {" "}·{" "}
        <Link href="/feedback" className="text-secondary hover:underline">Already testing? Send feedback</Link>
      </p>
    </ArticleShell>
  );
}

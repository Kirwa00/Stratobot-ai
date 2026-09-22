import Link from "next/link";
import { ArticleShell, ArticleSection } from "@/components/ArticleShell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Why We Don't Call StratoBot an \"AI Trading Bot\" — StratoBot AI Blog",
  description: "The AI maps your words to code blocks. It doesn't trade, and it doesn't decide what's profitable.",
  path: "/blog/why-we-dont-call-it-an-ai-trading-bot",
});

export default function WhyWeDontCallItAnAiTradingBotPost() {
  return (
    <ArticleShell
      backTitle="Blog"
      dateline="September 21, 2026"
      title="Why we don't call StratoBot an “AI trading bot”"
      intro="It would be an easier pitch. It would also be the wrong description of what the product does."
    >
      <ArticleSection title="What the label implies">
        <p>
          &ldquo;AI trading bot&rdquo; suggests the AI is making trading decisions — reading the
          market, deciding what looks profitable, choosing when to act. That&apos;s not what
          happens here, and we don&apos;t want anyone assuming it is.
        </p>
      </ArticleSection>

      <ArticleSection title="What the AI actually does">
        <p>
          It reads a plain-language description of a strategy and maps each rule to one of a
          fixed set of pre-written, tested code blocks. An entry condition here, a stop-loss rule
          there. That mapping — deciding which block matches which sentence — is the entire scope
          of what the AI decides. It never writes freeform trading logic, and it never evaluates
          whether a strategy is a good idea.
        </p>
      </ArticleSection>

      <ArticleSection title="Our message order, in practice">
        <p>
          When we describe StratoBot, outcome comes first — turn your strategy into an EA.
          Simplicity second — no MQL programming required. Ownership third — it&apos;s your
          strategy, automated, not ours. Speed fourth. Technology last: AI is how we get you
          there faster, not the reason to use it.
        </p>
      </ArticleSection>

      <ArticleSection title="The practical reason this matters">
        <p>
          Freeform AI-generated trading code can look plausible and still be wrong — a real risk
          once it&apos;s placing trades. A fixed library of reviewed, reused blocks structurally
          can&apos;t do that: nothing gets reinvented per request. Calling that &ldquo;AI
          trading&rdquo; would blur a distinction we think traders deserve to have explained
          plainly.
        </p>
      </ArticleSection>

      <p className="text-sm text-chalk/70 text-center">
        <Link href="/ai-ea-generator" className="text-secondary hover:underline">
          Read the full breakdown
        </Link>{" "}
        · <Link href="/mql5-ea-generator" className="text-secondary hover:underline">
          What&apos;s actually in the generated code
        </Link>
      </p>
    </ArticleShell>
  );
}

import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { CtaBanner } from "@/components/CtaBanner";

export function ArticleShell({
  backTitle,
  title,
  dateline,
  intro,
  children,
}: {
  backTitle: string;
  title: string;
  dateline?: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Header back title={backTitle} />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          {dateline && (
            <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/40 mb-2">
              {dateline}
            </p>
          )}
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">{title}</h1>
          {intro && <p className="text-sm text-chalk/70 leading-relaxed">{intro}</p>}
        </div>

        <div className="flex flex-col gap-5">{children}</div>

        <CtaBanner />
      </main>
    </div>
  );
}

/** Question list plus matching FAQPage structured data, from the same plain-text answers. */
export function ArticleFaq({ items }: { items: { q: string; a: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <ArticleSection title="Quick answers">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {items.map(({ q, a }) => (
        <div key={q}>
          <p className="font-semibold text-chalk mb-1">{q}</p>
          <p className="text-chalk/70">{a}</p>
        </div>
      ))}
    </ArticleSection>
  );
}

/** Numbered steps, each a bold title and a short explanation. */
export function ArticleSteps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex gap-3">
          <span className="font-mono text-xs font-bold text-signal mt-0.5 shrink-0">{i + 1}</span>
          <div>
            <p className="text-sm font-semibold text-chalk mb-1">{s.title}</p>
            <div className="text-xs text-chalk/70 leading-relaxed">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ArticleSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
        {title}
      </p>
      <div className="text-sm text-chalk/85 leading-relaxed flex flex-col gap-3">{children}</div>
    </div>
  );
}

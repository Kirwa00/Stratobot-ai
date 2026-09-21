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

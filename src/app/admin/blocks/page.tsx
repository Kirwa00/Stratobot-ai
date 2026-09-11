"use client";

import { Header } from "@/components/Header";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { BLOCKS, CATEGORIES } from "@/lib/blocks";

// The one admin section that needs no mock data — the block library is a
// real, static TypeScript module (src/lib/blocks.ts), so this just reads it
// directly. Read-only: editing block definitions means editing that file.

export default function AdminBlocksPage() {
  const { checked, allowed } = useAdminGuard();
  if (!checked || !allowed) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Block Library" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-xl text-chalk mb-1">
            {BLOCKS.length} blocks, {CATEGORIES.length} categories
          </h1>
          <p className="text-sm text-chalk/60">
            Read-only — this is a live read of{" "}
            <code className="font-mono text-xs bg-slate-high px-1 py-0.5 rounded">
              src/lib/blocks.ts
            </code>
            , not a database. Add or edit blocks by changing that file.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {CATEGORIES.map((category) => {
            const inCategory = BLOCKS.filter((b) => b.category === category);
            if (inCategory.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
                  {category} ({inCategory.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {inCategory.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-outline bg-slate px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary mt-0.5">
                          {b.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-chalk">{b.label}</p>
                            <span className="text-[10px] font-mono uppercase tracking-wide text-chalk/40 border border-outline rounded px-1.5 py-0.5">
                              {b.role}
                            </span>
                            <span className="text-[10px] font-mono text-chalk/30">{b.id}</span>
                          </div>
                          <p className="text-xs text-chalk/60 mt-0.5">{b.description}</p>
                          <p className="text-[11px] text-chalk/40 mt-1.5">
                            {b.params.length} param{b.params.length === 1 ? "" : "s"} ·{" "}
                            {b.keywords.length} keyword{b.keywords.length === 1 ? "" : "s"}:{" "}
                            {b.keywords.slice(0, 4).join(", ")}
                            {b.keywords.length > 4 ? "…" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { BLOCKS, CATEGORIES } from "@/lib/blocks";

export function BlockPickerSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (blockId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? BLOCKS.filter(
        (b) =>
          b.label.toLowerCase().includes(trimmed) ||
          b.description.toLowerCase().includes(trimmed) ||
          b.keywords.some((kw) => kw.includes(trimmed))
      )
    : null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a block">
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-chalk/40 text-lg">
          search
        </span>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blocks…"
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-base text-chalk/40 p-0.5 rounded hover:bg-slate-high hover:text-chalk/70"
          >
            close
          </button>
        )}
      </div>

      {matches ? (
        matches.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-3xl text-chalk/20 mb-2">
              search_off
            </span>
            <p className="text-sm text-chalk/40">No blocks match &ldquo;{query.trim()}&rdquo;</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((b) => (
              <BlockOption key={b.id} block={b} onPick={onPick} onClose={onClose} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-5">
          {CATEGORIES.map((category) => {
            const inCategory = BLOCKS.filter((b) => b.category === category);
            if (inCategory.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
                  {category}
                </h3>
                <div className="flex flex-col gap-2">
                  {inCategory.map((b) => (
                    <BlockOption key={b.id} block={b} onPick={onPick} onClose={onClose} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}

function BlockOption({
  block,
  onPick,
  onClose,
}: {
  block: (typeof BLOCKS)[number];
  onPick: (blockId: string) => void;
  onClose: () => void;
}) {
  return (
    <button
      onClick={() => {
        onPick(block.id);
        onClose();
      }}
      className="flex items-start gap-3 text-left rounded-md border border-outline bg-slate-high px-3 py-2.5 hover:border-secondary transition-colors"
    >
      <span className="material-symbols-outlined text-secondary mt-0.5">{block.icon}</span>
      <span className="min-w-0">
        <span className="block font-medium text-sm text-chalk">{block.label}</span>
        <span className="block text-xs text-chalk/60">{block.description}</span>
      </span>
    </button>
  );
}

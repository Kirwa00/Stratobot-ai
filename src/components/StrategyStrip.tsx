"use client";

import { getBlock } from "@/lib/blocks";
import { CONFIDENCE_THRESHOLD, type BlockInstance } from "@/lib/types";

function paramSummary(instance: BlockInstance): string {
  const def = getBlock(instance.blockId);
  if (!def) return "";
  const first = def.params[0];
  if (!first) return "";
  const val = instance.params[first.key];
  return first.unit ? `${val}${first.unit === "pips" ? "p" : first.unit}` : String(val);
}

export function StrategyStrip({
  blocks,
  onTapBlock,
  onAdd,
  animate = false,
}: {
  blocks: BlockInstance[];
  onTapBlock?: (instanceId: string) => void;
  onAdd?: () => void;
  animate?: boolean;
}) {
  if (blocks.length === 0 && !onAdd) return null;

  return (
    <div className="border-b border-outline bg-ink/40">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-3">
        {blocks.map((instance, i) => {
          const def = getBlock(instance.blockId);
          if (!def) return null;
          const lowConfidence = instance.confidence < CONFIDENCE_THRESHOLD;
          return (
            <div key={instance.instanceId} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onTapBlock?.(instance.instanceId)}
                style={animate ? { animationDelay: `${i * 40}ms` } : undefined}
                className={`${
                  animate ? "animate-stagger-in" : ""
                } flex flex-col items-start rounded-md border bg-slate px-3 py-1.5 min-w-[92px] text-left border-l-[3px] ${
                  lowConfidence ? "border-l-caution" : "border-l-signal"
                } border-outline hover:bg-slate-high transition-colors`}
              >
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-chalk/60">
                  {def.label}
                </span>
                <span className="text-xs font-mono text-chalk mono-num">
                  {paramSummary(instance)}
                </span>
              </button>
              {i < blocks.length - 1 && (
                <span className="material-symbols-outlined text-outline text-base">
                  arrow_forward
                </span>
              )}
            </div>
          );
        })}
        {onAdd && (
          <button
            onClick={onAdd}
            aria-label="Add block"
            className="shrink-0 flex items-center justify-center rounded-md border border-dashed border-outline w-11 h-11 hover:bg-slate-high text-chalk/70"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { getBlock } from "@/lib/blocks";
import type { BlockInstance } from "@/lib/types";

export function ParameterSheet({
  instance,
  onClose,
  onSave,
  onRemove,
}: {
  instance: BlockInstance | null;
  onClose: () => void;
  onSave: (instanceId: string, params: Record<string, string | number>) => void;
  onRemove?: (instanceId: string) => void;
}) {
  const def = instance ? getBlock(instance.blockId) : undefined;
  const [draft, setDraft] = useState<Record<string, string | number>>({});

  // Re-seed the draft whenever a different block is opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (instance) setDraft(instance.params);
  }, [instance]);

  if (!instance || !def) return null;

  return (
    <BottomSheet open={!!instance} onClose={onClose} title={def.label}>
      <p className="text-sm text-chalk/70 mb-4">{def.description}</p>
      <div className="flex flex-col gap-4">
        {def.params.map((p) => (
          <label key={p.key} className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/60">
              {p.label}
              {p.unit ? ` (${p.unit})` : ""}
            </span>
            {p.type === "select" ? (
              <select
                value={String(draft[p.key] ?? p.default)}
                onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                className="bg-slate-high border border-outline rounded-md px-3 py-2.5 text-chalk font-mono text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                {p.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={p.type === "number" ? "number" : "text"}
                value={String(draft[p.key] ?? p.default)}
                min={p.min}
                max={p.max}
                step={p.step}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [p.key]: p.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                className="bg-slate-high border border-outline rounded-md px-3 py-2.5 text-chalk font-mono text-sm mono-num focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        {onRemove && (
          <Button
            variant="danger-ghost"
            className="flex-1"
            onClick={() => {
              onRemove(instance.instanceId);
              onClose();
            }}
          >
            Remove
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={() => {
            onSave(instance.instanceId, draft);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </BottomSheet>
  );
}

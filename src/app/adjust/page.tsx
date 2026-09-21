"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { ParameterSheet } from "@/components/ParameterSheet";
import { BlockPickerSheet } from "@/components/BlockPickerSheet";
import { getBlock } from "@/lib/blocks";
import { useStrategyStore, simsButtonLabel } from "@/lib/store";
import type { BlockInstance } from "@/lib/types";

function BlockRow({
  instance,
  onOpen,
  onMove,
  isFirst,
  isLast,
}: {
  instance: BlockInstance;
  onOpen: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const def = getBlock(instance.blockId);
  if (!def) return null;
  const firstParam = def.params[0];
  const summary = firstParam
    ? `${instance.params[firstParam.key]}${firstParam.unit ? ` ${firstParam.unit}` : ""}`
    : "";

  return (
    <div className="flex items-center gap-2 border border-outline bg-slate rounded-md px-3 py-2.5">
      <span className="material-symbols-outlined text-secondary">{def.icon}</span>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-medium text-chalk">{def.label}</span>
        <span className="block text-xs font-mono text-chalk/60 mono-num">{summary}</span>
      </button>
      <div className="flex flex-col">
        <button
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className="material-symbols-outlined text-base text-chalk/50 disabled:opacity-20 hover:text-chalk"
        >
          keyboard_arrow_up
        </button>
        <button
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
          className="material-symbols-outlined text-base text-chalk/50 disabled:opacity-20 hover:text-chalk"
        >
          keyboard_arrow_down
        </button>
      </div>
      <button
        aria-label="Options"
        onClick={onOpen}
        className="material-symbols-outlined text-chalk/50 hover:text-chalk"
      >
        more_vert
      </button>
    </div>
  );
}

function AdjustInner() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    hydrated,
    strategy,
    startFromBlocks,
    addBlock,
    removeBlock,
    moveBlock,
    updateBlockParams,
    simsRemaining,
    runSim,
  } = useStrategyStore();

  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!strategy && params.get("new") === "1") startFromBlocks();
    else if (!strategy) router.replace("/app");
  }, [hydrated, strategy, params, startFromBlocks, router]);

  if (!strategy) return null;

  const entryBlocks = strategy.blocks.filter((b) => getBlock(b.blockId)?.role !== "exit");
  const exitBlocks = strategy.blocks.filter((b) => getBlock(b.blockId)?.role === "exit");
  const active = strategy.blocks.find((b) => b.instanceId === activeInstanceId) ?? null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Your strategy" />
      <StrategyStrip blocks={strategy.blocks} onTapBlock={setActiveInstanceId} onAdd={() => setPickerOpen(true)} />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-32 flex flex-col gap-6">
        <section>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Entry
          </h2>
          {entryBlocks.length === 0 ? (
            <p className="text-sm text-chalk/50 border border-dashed border-outline rounded-md px-3 py-3">
              No entry blocks yet. Tap + on the strip to add one.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entryBlocks.map((b, i) => (
                <BlockRow
                  key={b.instanceId}
                  instance={b}
                  onOpen={() => setActiveInstanceId(b.instanceId)}
                  onMove={(dir) => moveBlock(b.instanceId, dir)}
                  isFirst={i === 0}
                  isLast={i === entryBlocks.length - 1}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Exit
          </h2>
          {exitBlocks.length === 0 ? (
            <p className="text-sm text-chalk/50 border border-dashed border-outline rounded-md px-3 py-3">
              No exit blocks yet. Add a Stop Loss, Take Profit, or Trailing Stop from the picker.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {exitBlocks.map((b, i) => (
                <BlockRow
                  key={b.instanceId}
                  instance={b}
                  onOpen={() => setActiveInstanceId(b.instanceId)}
                  onMove={(dir) => moveBlock(b.instanceId, dir)}
                  isFirst={i === 0}
                  isLast={i === exitBlocks.length - 1}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="sticky bottom-0 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button
          className="w-full"
          disabled={strategy.blocks.length === 0 || simsRemaining === 0}
          onClick={() => {
            runSim();
            router.push("/simulate");
          }}
        >
          {simsButtonLabel("Simulate", simsRemaining)}
        </Button>
      </div>

      <ParameterSheet
        instance={active}
        onClose={() => setActiveInstanceId(null)}
        onSave={updateBlockParams}
        onRemove={removeBlock}
      />
      <BlockPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addBlock} />
    </div>
  );
}

export default function AdjustPage() {
  return (
    <Suspense fallback={null}>
      <AdjustInner />
    </Suspense>
  );
}

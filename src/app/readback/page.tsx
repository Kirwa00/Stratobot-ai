"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { StrategyStrip } from "@/components/StrategyStrip";
import { ParameterSheet } from "@/components/ParameterSheet";
import { getBlock } from "@/lib/blocks";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";
import { useStrategyStore } from "@/lib/store";

export default function ReadbackPage() {
  const router = useRouter();
  const { hydrated, strategy, updateBlockParams, removeBlock } = useStrategyStore();
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !strategy) router.replace("/app");
  }, [hydrated, strategy, router]);

  if (!strategy) return null;

  const active = strategy.blocks.find((b) => b.instanceId === activeInstanceId) ?? null;
  const lowConfidence = strategy.blocks.filter((b) => b.confidence < CONFIDENCE_THRESHOLD);

  return (
    <div className="flex flex-col flex-1">
      <Header back />
      <StrategyStrip blocks={strategy.blocks} onTapBlock={setActiveInstanceId} animate />

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <h1 className="font-display font-bold text-xl text-chalk mb-3">
          Here&apos;s what I understood
        </h1>
        <p className="text-[15px] leading-relaxed text-chalk/90 mb-5">{strategy.readback}</p>

        {lowConfidence.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-5">
            {lowConfidence.map((b) => {
              const def = getBlock(b.blockId);
              return (
                <button
                  key={b.instanceId}
                  onClick={() => setActiveInstanceId(b.instanceId)}
                  className="text-left text-sm text-caution flex items-start gap-1.5"
                >
                  <span className="material-symbols-outlined text-base leading-5">error</span>
                  <span>
                    Not sure I got the {def?.label.toLowerCase()} right — tap to check.
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {strategy.unmapped.length > 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-bg px-4 py-3.5 mb-5">
            <p className="flex items-center gap-2 font-medium text-caution text-sm mb-2">
              <span className="material-symbols-outlined text-base">warning</span>
              {strategy.unmapped.length === 1
                ? "One thing I couldn't add"
                : `${strategy.unmapped.length} things I couldn't add`}
            </p>
            <div className="flex flex-col gap-2">
              {strategy.unmapped.map((u, i) => (
                <p key={i} className="text-sm text-chalk/80 leading-relaxed">
                  &ldquo;{u.text}&rdquo; — there&apos;s no block for this yet. Your bot will not do
                  this.
                </p>
              ))}
            </div>
          </div>
        )}

        {strategy.blocks.length === 0 && (
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5 text-sm text-chalk/70">
            I couldn&apos;t turn that into blocks yet. Try describing your entry and exit as
            separate sentences, e.g. &ldquo;{`London killzone, sweep PDH, enter on 50% retrace`}
            &rdquo;.
          </div>
        )}
      </main>

      <div className="sticky bottom-0 flex gap-3 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button variant="ghost" className="flex-1" onClick={() => router.push("/adjust")}>
          Edit
        </Button>
        <Button
          className="flex-1"
          disabled={strategy.blocks.length === 0}
          onClick={() => router.push("/simulate")}
        >
          That&apos;s right
        </Button>
      </div>

      <ParameterSheet
        instance={active}
        onClose={() => setActiveInstanceId(null)}
        onSave={updateBlockParams}
        onRemove={removeBlock}
      />
    </div>
  );
}

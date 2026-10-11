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
import { RulesReadback } from "@/components/RulesReadback";
import { strategyRules } from "@/lib/simulate";
import { validateRules } from "@/lib/rules/validate";
import { RulesReadbackScreen } from "./RulesReadbackScreen";

export default function ReadbackPage() {
  const router = useRouter();
  const { hydrated, strategy, updateBlockParams, removeBlock } = useStrategyStore();
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !strategy) router.replace("/app");
  }, [hydrated, strategy, router]);

  if (!strategy) return null;
  if (strategy.rules || strategy.questions?.length) return <RulesReadbackScreen strategy={strategy} />;

  const active = strategy.blocks.find((b) => b.instanceId === activeInstanceId) ?? null;
  const lowConfidence = strategy.blocks.filter((b) => b.confidence < CONFIDENCE_THRESHOLD);
  // Exactly what the composer compiles, so the trader confirms what the bot will really do.
  const rules = strategyRules(strategy);
  const checked = rules ? validateRules(rules) : null;
  const warnings = checked?.ok ? checked.warnings : [];
  const oneSide =
    rules && !rules.directionFromInput && (rules.long === null) !== (rules.short === null)
      ? rules.long === null
        ? "sells"
        : "buys"
      : null;

  return (
    <div className="flex flex-col flex-1">
      <Header back />
      <StrategyStrip blocks={strategy.blocks} onTapBlock={setActiveInstanceId} animate />

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <h1 className="font-display font-bold text-xl text-chalk mb-1">
          {rules ? "Here's what your bot will do" : "I couldn't build a bot from that yet"}
        </h1>
        {strategy.rawPrompt && (
          <p className="text-xs text-chalk/50 leading-relaxed mb-4">
            You wrote: &ldquo;{strategy.rawPrompt}&rdquo;{" "}
            <button
              type="button"
              onClick={() => router.push("/app#edit")}
              className="text-secondary hover:underline focus-visible:underline"
            >
              Reword it
            </button>
          </p>
        )}

        {rules && (
          <div className="rounded-lg border border-outline bg-slate px-4 py-4 mb-5">
            <RulesReadback rules={rules} />
          </div>
        )}

        {(oneSide || warnings.length > 0) && (
          <div className="rounded-lg border border-caution/40 bg-caution-bg px-4 py-3.5 mb-5 flex flex-col gap-1.5">
            {oneSide && (
              <p className="text-sm text-caution flex items-start gap-1.5">
                <span className="material-symbols-outlined text-base leading-5">error</span>
                <span>
                  This bot only {oneSide}. If you meant it to {oneSide === "buys" ? "sell" : "buy"} too, add
                  that side to your description, e.g. &ldquo;{oneSide === "buys" ? "sell" : "buy"} when&hellip;&rdquo;.
                </span>
              </p>
            )}
            {warnings.map((w) => (
              <p key={w} className="text-sm text-caution flex items-start gap-1.5">
                <span className="material-symbols-outlined text-base leading-5">error</span>
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

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

        {!rules && (
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5 text-sm text-chalk/70 leading-relaxed">
            {strategy.blocks.length === 0
              ? "I couldn't find any trading rules in that yet."
              : "I found exit rules, but nothing that tells the bot when to open a trade."}{" "}
            Say when to buy or sell, plus a stop loss and take profit, e.g. &ldquo;9/21 EMA cross, stop
            loss 20 pips, take profit 40 pips&rdquo;.
            <button
              type="button"
              onClick={() => router.push("/app#edit")}
              className="block mt-2 text-secondary hover:underline"
            >
              Reword my strategy
            </button>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 flex gap-3 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button variant="ghost" className="flex-1" onClick={() => router.push("/adjust")}>
          Edit
        </Button>
        <Button
          className="flex-1"
          disabled={!rules}
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

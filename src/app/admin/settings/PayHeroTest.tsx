"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

type Channel = { id: number; type: string; description: string; shortCode: string; active: boolean; selected: boolean };
type Result = { ok: true; channels: Channel[] } | { ok: false; error: string };

export function PayHeroTest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function test() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payhero");
      setResult((await res.json()) as Result);
    } catch {
      setResult({ ok: false, error: "Couldn't reach the StratoBot server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="ghost" onClick={test} disabled={busy} className="self-start">
        {busy ? "Testing…" : "Test connection"}
      </Button>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-sell">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-sm text-buy">Connected. Payment channels on this PayHero account:</p>
          {result.channels.length === 0 && <p className="text-sm text-chalk/70">None yet. Add one in the PayHero dashboard.</p>}
          <ul className="flex flex-col gap-1.5">
            {result.channels.map((ch) => (
              <li
                key={ch.id}
                className={`rounded-lg border px-3 py-2 text-sm flex flex-wrap gap-x-4 ${ch.selected ? "border-signal" : "border-outline"}`}
              >
                <span className="mono-num text-chalk">{ch.id}</span>
                <span className="text-chalk/80">{ch.description || ch.type}</span>
                {ch.shortCode && <span className="text-chalk/60 mono-num">{ch.shortCode}</span>}
                {!ch.active && <span className="text-caution">inactive</span>}
                {ch.selected && <span className="text-signal font-semibold ml-auto">In use</span>}
              </li>
            ))}
          </ul>
          {!result.channels.some((c) => c.selected) && result.channels.length > 0 && (
            <p className="text-sm text-caution">
              PAYHERO_CHANNEL_ID doesn&apos;t match any channel above. Set it to one of these IDs.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

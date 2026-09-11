"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { FREE_SIMS } from "@/lib/store";

// Honest scope: there's no real backend configuration to change here (no
// feature flags, no server settings store) — this is read-only, real status
// about how this deployment is actually configured, not a fabricated
// settings panel with controls that don't do anything.

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const toneClass =
    tone === "good" ? "text-buy" : tone === "warn" ? "text-caution" : "text-chalk";
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline bg-slate px-4 py-3">
      <span className="text-sm text-chalk/70">{label}</span>
      <span className={`text-sm font-medium mono-num ${toneClass}`}>{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { checked, allowed } = useAdminGuard();
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/system-status")
      .then((r) => r.json())
      .then((d) => setLlmConfigured(Boolean(d.llmConfigured)))
      .catch(() => setLlmConfigured(false));
  }, []);

  if (!checked || !allowed) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="System Settings" />
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            Read-only. There&apos;s no server-side settings store yet, so nothing here is
            editable — it&apos;s real status about how this deployment is configured.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <StatusRow
            label="LLM strategy parsing"
            value={
              llmConfigured === null
                ? "Checking…"
                : llmConfigured
                  ? "Configured"
                  : "Not configured — using keyword fallback"
            }
            tone={llmConfigured === null ? undefined : llmConfigured ? "good" : "warn"}
          />
          <StatusRow label="Free simulations per session" value={String(FREE_SIMS)} />
          <StatusRow label="Payment processor" value="Mock (no real gateway wired up)" tone="warn" />
          <StatusRow label="Compile pipeline" value="Client-side MQL5 generation only" tone="warn" />
        </div>
      </main>
    </div>
  );
}

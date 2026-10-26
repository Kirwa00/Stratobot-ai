"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecheckButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function recheck() {
    setBusy(true);
    await fetch("/api/admin/payments/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setBusy(false);
    router.refresh();
  }
  return (
    <button type="button" onClick={recheck} disabled={busy} className="text-xs text-secondary hover:underline whitespace-nowrap">
      {busy ? "Checking…" : "Re-check with PayHero"}
    </button>
  );
}

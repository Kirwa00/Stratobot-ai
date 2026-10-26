"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { clientId, trackEvent } from "@/lib/analytics";
import { PRICE_EA_SHORT, PRICE_PRO_SHORT } from "@/lib/constants";

// M-Pesa checkout through PayHero: the server sends the STK prompt to the
// trader's phone, then this polls until PayHero confirms (or the prompt is
// cancelled). Nothing unlocks until /api/pay/status reports "success", which
// the server only sets after checking with PayHero itself.

type Kind = "ea" | "pro";
type Phase = "form" | "waiting" | "failed" | "timeout";

const POLL_MS = 3000;
const GIVE_UP_MS = 150_000;

export function MpesaCheckout({
  strategyId,
  strategyName,
  onPaid,
}: {
  strategyId: string;
  strategyName: string;
  onPaid: (kind: Kind) => void;
}) {
  const phoneId = useId();
  const [live, setLive] = useState<boolean | null>(null);
  const [kind, setKind] = useState<Kind>("ea");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const poll = useRef<{ id: string; started: number; timer?: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    fetch("/api/pay/config")
      .then((r) => r.json())
      .then((c: { live: boolean }) => setLive(c.live))
      .catch(() => setLive(false));
    return () => {
      if (poll.current?.timer) clearTimeout(poll.current.timer);
    };
  }, []);

  async function check() {
    const p = poll.current;
    if (!p) return;
    try {
      const res = await fetch(`/api/pay/status?id=${encodeURIComponent(p.id)}&client=${encodeURIComponent(clientId())}`);
      const s = (await res.json()) as { status?: string; kind?: Kind };
      if (s.status === "success") {
        poll.current = null;
        onPaid(s.kind ?? kind);
        return;
      }
      if (s.status === "failed") {
        poll.current = null;
        setPhase("failed");
        return;
      }
    } catch {
      // network blip: keep polling
    }
    if (Date.now() - p.started > GIVE_UP_MS) {
      setPhase("timeout");
      return;
    }
    p.timer = setTimeout(check, POLL_MS);
  }

  async function pay() {
    setError(null);
    setBusy(true);
    trackEvent("checkout_started", { method: "mpesa", kind });
    try {
      const res = await fetch("/api/pay/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, phone, clientId: clientId(), strategyId, strategyName }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Couldn't start the payment.");
        return;
      }
      poll.current = { id: data.id, started: Date.now() };
      setPhase("waiting");
      poll.current.timer = setTimeout(check, POLL_MS);
    } catch {
      setError("Couldn't reach StratoBot. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (live === null) return null;

  if (phase === "waiting" || phase === "timeout") {
    return (
      <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4 flex flex-col gap-3 text-center" aria-live="polite">
        <span className="material-symbols-outlined text-signal text-3xl">smartphone</span>
        <p className="font-semibold text-chalk">Check your phone</p>
        <p className="text-sm text-chalk/75 leading-relaxed">
          {phase === "waiting"
            ? `Enter your M-Pesa PIN to pay ${kind === "ea" ? PRICE_EA_SHORT : PRICE_PRO_SHORT}. This screen updates by itself.`
            : "We haven't heard back from M-Pesa yet. If you paid, it will show up; keep this page open or check again."}
        </p>
        {phase === "timeout" && (
          <Button
            variant="ghost"
            onClick={() => {
              if (!poll.current) return;
              poll.current.started = Date.now();
              setPhase("waiting");
              void check();
            }}
          >
            Check again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">What to buy</legend>
        {(
          [
            ["ea", "This EA", PRICE_EA_SHORT, "One-off. Yours to keep and re-download as you adjust it."],
            ["pro", "Pro, 30 days", PRICE_PRO_SHORT, "Unlimited EAs and logic checks. Doesn't renew by itself."],
          ] as const
        ).map(([k, label, price, detail]) => (
          <label
            key={k}
            className={`rounded-lg border px-3 py-3 cursor-pointer has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-secondary ${kind === k ? "border-signal bg-slate" : "border-outline"}`}
          >
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            <span className="block text-sm font-semibold text-chalk">{label}</span>
            <span className="block font-display font-bold text-lg text-chalk mono-num">{price}</span>
            <span className="block text-xs text-chalk/60 mt-1 leading-snug">{detail}</span>
          </label>
        ))}
      </fieldset>
      {!live ? (
        <>
          <div className="rounded-lg border border-caution/50 bg-slate px-4 py-3.5">
            <p className="text-sm text-chalk/85 leading-relaxed">
              M-Pesa checkout is opening soon. Your strategy stays saved in this browser, so you can come back and buy it
              when it&apos;s live.
            </p>
          </div>
          <Button className="w-full" disabled>
            Pay with M-Pesa (opening soon)
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={phoneId} className="text-sm font-medium text-chalk">
              M-Pesa phone number
            </label>
            <input
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>
          {phase === "failed" && (
            <p role="alert" className="text-xs text-sell">
              The payment didn&apos;t go through (cancelled, wrong PIN or not enough balance). You weren&apos;t charged.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-sell">
              {error}
            </p>
          )}
          <Button className="w-full" onClick={pay} disabled={busy || phone.replace(/\D/g, "").length < 9}>
            {busy ? "Sending the M-Pesa prompt…" : `Pay ${kind === "ea" ? PRICE_EA_SHORT : PRICE_PRO_SHORT} with M-Pesa`}
          </Button>
          <p className="text-xs text-chalk/50 text-center">You&apos;ll get an M-Pesa prompt on this phone. Payments by PayHero.</p>
        </>
      )}
    </div>
  );
}

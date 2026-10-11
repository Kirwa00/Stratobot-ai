"use client";

import { track } from "@vercel/analytics";

// Conversion funnel events, sent through the Vercel Web Analytics already on
// every page (<Analytics /> in app/layout.tsx). Custom events need a Vercel
// plan that includes them; where they aren't enabled, track() is a no-op.
//
// Privacy: only these fixed names and small enum/number properties are ever
// sent. Never pass strategy text, generated code, names or anything typed by
// the user.
//
// These are client-side signals. There is no verified server-side outcome yet:
// payments aren't live, so `subscription_succeeded` is deliberately not sent
// anywhere (see docs/conversion-sprint-audit.md).

export type FunnelEvent =
  | "landing_page_view"
  | "primary_cta_clicked"
  | "strategy_builder_opened"
  | "strategy_submitted"
  | "generation_started"
  | "generation_succeeded"
  | "generation_failed"
  | "ea_downloaded"
  | "pricing_viewed"
  | "checkout_started";

type Props = Record<string, string | number | boolean>;

/** Send a funnel event. With `oncePerSession`, repeats in the same tab session are dropped. */
export function trackEvent(name: FunnelEvent, props?: Props, opts: { oncePerSession?: boolean } = {}) {
  if (typeof window === "undefined") return;
  if (opts.oncePerSession) {
    const key = `stratobot.evt.${name}${props ? `.${JSON.stringify(props)}` : ""}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: send anyway rather than never
    }
  }
  try {
    // track() drops events fired before <Analytics /> mounts (page effects run first).
    // Create the same queue the SDK's inject() creates, so early events are kept.
    const w = window as unknown as { va?: (...a: unknown[]) => void; vaq?: unknown[][] };
    w.va ??= (...params: unknown[]) => {
      (w.vaq ??= []).push(params);
    };
    track(name, props);
  } catch {
    // analytics must never break the product
  }
}

"use client";

import { track } from "@vercel/analytics";
import { RECORDED_EVENTS } from "./events";

// Conversion funnel events, sent through the Vercel Web Analytics already on
// every page (<Analytics /> in app/layout.tsx). Custom events need a Vercel
// plan that includes them; where they aren't enabled, track() is a no-op.
//
// Privacy: only these fixed names and small enum/number properties are ever
// sent. Never pass strategy text, generated code, names or anything typed by
// the user.
//
// The same events also go to StratoBot's own database for the admin dashboard
// (/api/events), tagged with a random per-browser id. Payments are recorded
// server-side when PayHero confirms them, never from the browser.

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
  | "checkout_started"
  | "logic_check_run"
  | "free_ea_claimed"
  | "video_strategy_found";

type Props = Record<string, string | number | boolean>;

const RECORDED = new Set<string>(RECORDED_EVENTS);
const CLIENT_KEY = "stratobot.client.v1";

/** A random id for this browser, so the dashboard can count visitors and link a payment to its browser. */
export function clientId(): string {
  try {
    let id = window.localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-browser";
  }
}

function record(name: string, props?: Props) {
  if (!RECORDED.has(name)) return;
  const body = JSON.stringify({ type: name, clientId: clientId(), props });
  if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "text/plain" }))) return;
  void fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => {});
}

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
  try {
    record(name, props);
  } catch {
    // analytics must never break the product
  }
}

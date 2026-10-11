"use client";

import { useEffect } from "react";
import { trackEvent, type FunnelEvent } from "@/lib/analytics";

/** Fires a funnel event once per tab session when a (server-rendered) page mounts. */
export function TrackView({ event, props }: { event: FunnelEvent; props?: Record<string, string> }) {
  const key = props ? JSON.stringify(props) : "";
  useEffect(() => {
    trackEvent(event, key ? JSON.parse(key) : undefined, { oncePerSession: true });
  }, [event, key]);
  return null;
}

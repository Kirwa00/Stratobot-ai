"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type FunnelEvent } from "@/lib/analytics";

/** A link styled like Button (no button nested inside the link) that records a funnel event on click. */
export function TrackedLink({
  href,
  event,
  props,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  event: FunnelEvent;
  props?: Record<string, string>;
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  const look =
    variant === "primary"
      ? "bg-signal text-on-signal hover:bg-signal-dim"
      : "bg-transparent border border-outline text-chalk hover:bg-slate-high hover:border-signal/50";
  return (
    <Link
      href={href}
      onClick={() => trackEvent(event, props)}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 button-press text-[15px] px-5 py-3.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${look} ${className}`}
    >
      {children}
    </Link>
  );
}

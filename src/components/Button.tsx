"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger-ghost";
type Size = "default" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none button-press";

const sizes: Record<Size, string> = {
  default: "text-[15px] px-5 py-3.5 min-h-[44px]",
  sm: "text-xs px-3 py-2 min-h-[32px]"
};

const styles: Record<Variant, string> = {
  primary: "bg-signal text-white hover:bg-signal-dim active:bg-signal-dim hover:shadow-lg hover:shadow-signal/20",
  ghost:
    "bg-transparent border border-outline text-chalk hover:bg-slate-high active:bg-slate-high hover:border-signal/50",
  "danger-ghost": "bg-transparent border border-outline text-sell hover:bg-slate-high hover:border-sell/50",
};

export function Button({ variant = "primary", size = "default", className = "", children, ...rest }: Props) {
  return (
    <button className={`${base} ${sizes[size]} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Page width by route. The homepage is a full-width marketing page; the
// strategy builder flow stays a phone-sized column (it's a step-by-step tool
// with sticky bottom actions); content pages get a comfortable reading width.
const APP_ROUTES = [
  "/app",
  "/readback",
  "/adjust",
  "/simulate",
  "/backtest",
  "/unlock",
  "/building",
  "/download",
  "/install",
  "/library",
  "/login",
  "/feedback",
];

export function PageShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const width =
    path === "/"
      ? "max-w-none"
      : path === "/admin" || path.startsWith("/admin/")
        ? "max-w-6xl"
      : APP_ROUTES.some((r) => path === r || path.startsWith(`${r}/`))
        ? "max-w-[440px]"
        : "max-w-[720px]";
  return <div className={`mx-auto w-full ${width} min-h-dvh flex flex-col bg-ink relative`}>{children}</div>;
}

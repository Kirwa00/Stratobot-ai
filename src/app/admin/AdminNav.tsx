"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/blocks", label: "Blocks" },
];

export function AdminNav() {
  const path = usePathname();
  const router = useRouter();
  if (path === "/admin/login") return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <nav aria-label="Admin" className="flex items-center gap-1 overflow-x-auto border-b border-outline px-4 py-3">
      <span className="font-display font-bold text-chalk mr-3 shrink-0">StratoBot admin</span>
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${active ? "bg-signal text-on-signal font-semibold" : "text-chalk/70 hover:text-chalk"}`}
          >
            {l.label}
          </Link>
        );
      })}
      <button type="button" onClick={logout} className="ml-auto shrink-0 text-sm text-chalk/60 hover:text-chalk">
        Log out
      </button>
    </nav>
  );
}

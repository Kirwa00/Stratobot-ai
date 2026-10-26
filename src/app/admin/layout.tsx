import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: "Admin — StratoBot", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <AdminNav />
      {children}
    </div>
  );
}

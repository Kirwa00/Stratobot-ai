"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { logout } from "@/lib/auth";
import { useAdminGuard } from "@/lib/useAdminGuard";

export default function AdminPage() {
  const router = useRouter();
  const { checked, allowed, user } = useAdminGuard();

  const adminSections = [
    {
      id: "strategies",
      title: "Strategy Management",
      description: "Manage video-derived strategies and presets",
      icon: "strategy",
      path: "/admin/strategies"
    },
    {
      id: "videos",
      title: "Video Curation",
      description: "Curate and map YouTube videos to strategies",
      icon: "video_library",
      path: "/admin/videos"
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: "people",
      path: "/admin/users"
    },
    {
      id: "analytics",
      title: "Analytics Dashboard",
      description: "View usage statistics and performance metrics",
      icon: "analytics",
      path: "/admin/analytics"
    },
    {
      id: "blocks",
      title: "Block Library",
      description: "Manage trading block definitions and templates",
      icon: "extension",
      path: "/admin/blocks"
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure system-wide settings and integrations",
      icon: "settings",
      path: "/admin/settings"
    }
  ];

  if (!checked || !allowed) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Admin Dashboard" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-chalk mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm text-chalk/60">
              Manage content, users, and system configuration
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="shrink-0 text-xs text-chalk/50 hover:text-chalk px-3 py-2 rounded-md border border-outline hover:bg-slate-high transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {adminSections.map((section) => (
            <button
              key={section.id}
              onClick={() => router.push(section.path)}
              className="flex items-center gap-4 text-left rounded-lg border border-outline bg-slate px-4 py-4 hover:border-signal transition-colors"
            >
              <div className="w-12 h-12 shrink-0 rounded-lg bg-slate-high flex items-center justify-center">
                <span className="material-symbols-outlined text-chalk/70">
                  {section.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-chalk">{section.title}</p>
                <p className="text-xs text-chalk/50 truncate">{section.description}</p>
              </div>
              <span className="material-symbols-outlined text-chalk/30">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-lg border border-caution bg-caution-bg/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-caution shrink-0">
              info
            </span>
            <div>
              <p className="text-sm font-medium text-chalk mb-1">
                Signed in as {user?.email}
              </p>
              <p className="text-xs text-chalk/60">
                This page checks for an admin account before loading — it isn&apos;t just a
                convention, you were redirected to sign in to reach it. There&apos;s no audit
                log yet; every action below writes to this device&apos;s local storage only,
                same as the rest of the app.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
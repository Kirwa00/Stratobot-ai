"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

export default function AdminPage() {
  const router = useRouter();

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

  return (
    <div className="flex flex-col flex-1">
      <Header title="Admin Dashboard" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm text-chalk/60">
            Manage content, users, and system configuration
          </p>
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
              warning
            </span>
            <div>
              <p className="text-sm font-medium text-chalk mb-1">
                Admin Access Only
              </p>
              <p className="text-xs text-chalk/60">
                This area is restricted to authorized administrators only. All actions are logged.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { Header } from "@/components/Header";
import { useAdminGuard } from "@/lib/useAdminGuard";
import { getAuthState } from "@/lib/auth";

// Honest scope: there is no backend, so there is no real cross-device user
// database to manage — src/lib/auth.ts's MOCK_USERS is an in-memory object
// that resets on every page reload. Rather than fabricate a fake user table
// (which the app's own design principle rules out — see memory:
// stratobot-honesty-principle), this shows only what's actually real: the
// two accounts seeded in that mock, and whoever is currently signed in on
// this device.

const SEEDED_ACCOUNTS = [
  { email: "demo@stratobot.ai", role: "Free tier", note: "Seeded demo account" },
  { email: "admin@stratobot.ai", role: "Admin", note: "Seeded admin account" },
];

export default function AdminUsersPage() {
  const { checked, allowed } = useAdminGuard();
  if (!checked || !allowed) return null;

  const auth = getAuthState();

  return (
    <div className="flex flex-col flex-1">
      <Header back title="User Management" />
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
        <div className="p-3 rounded-lg border border-caution bg-caution-bg/20">
          <p className="text-xs text-chalk/80 leading-relaxed">
            There&apos;s no backend yet, so there&apos;s no real multi-user database to manage —
            accounts live in an in-memory mock that resets on reload. This shows what actually
            exists rather than a fabricated user list.
          </p>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            This device, right now
          </h2>
          <div className="rounded-lg border border-outline bg-slate px-4 py-3">
            {auth.isAuthenticated && auth.user ? (
              <>
                <p className="text-sm font-medium text-chalk">{auth.user.email}</p>
                <p className="text-xs text-chalk/50 mt-0.5">
                  {auth.user.subscriptionTier} · {auth.user.isAdmin ? "admin" : "standard"} ·
                  joined {new Date(auth.user.createdAt).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-chalk/50">Not signed in.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-2">
            Seeded mock accounts
          </h2>
          <div className="flex flex-col gap-2">
            {SEEDED_ACCOUNTS.map((a) => (
              <div
                key={a.email}
                className="flex items-center justify-between rounded-lg border border-outline bg-slate px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-chalk">{a.email}</p>
                  <p className="text-xs text-chalk/50">{a.note}</p>
                </div>
                <span className="text-xs text-chalk/60">{a.role}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { Suspense, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const id = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
      return;
    }
    const data = (await res?.json().catch(() => null)) as { error?: string } | null;
    setError(data?.error ?? "Couldn't sign in.");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="font-display font-bold text-2xl text-chalk">StratoBot admin</h1>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-chalk">
          Admin password
        </label>
        <input
          id={id}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-sell">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!password || busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

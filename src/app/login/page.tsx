"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { login, register } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          router.push("/");
        } else {
          setError(result.error || "Login failed");
        }
      } else {
        const result = await register(email, password, name);
        if (result.success) {
          router.push("/");
        } else {
          setError(result.error || "Registration failed");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("demo@stratobot.ai");
    setPassword("demo123");
  };

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-chalk/60">
            {isLogin ? "Sign in to continue building your trading bots" : "Start creating trading strategies today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-chalk/50 mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-chalk/50 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>

          <div>
            <label className="text-xs text-chalk/50 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              isLogin ? "Sign in" : "Create account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-signal hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {isLogin && (
          <div className="mt-8 pt-6 border-t border-outline">
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 text-xs text-chalk/50 hover:text-chalk transition-colors"
            >
              Try demo account
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
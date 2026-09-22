"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

const TO_EMAIL = "emmanuelkirwa8@gmail.com";

const EXAMPLES = [
  "London killzone, sweep PDH, enter on 50% retrace, trail stop 30 pips",
  "Wait for a bullish order block in New York, enter on engulfing candle",
  "9/21 EMA cross when ATR is above average, trail stop 20 pips",
];

const EXPERIENCE_OPTIONS = [
  "New to MT5 / EAs",
  "Some experience running EAs",
  "Power user — run EAs daily",
  "I build/code EAs myself",
];

const VALUE_CARDS = [
  {
    n: "01",
    title: "Run the free check",
    body: "Describe one real strategy and see if the logic check reads your rules correctly.",
  },
  {
    n: "02",
    title: "Try the full flow",
    body: "Go from description to a compiled .mq5 for MT5 and load it into your own terminal.",
  },
  {
    n: "03",
    title: "Tell us what broke",
    body: "Confusing wording, wrong logic, a missing rule type — we want the blunt version.",
  },
];

interface FormState {
  name: string;
  email: string;
  experience: string;
  style: string;
  notes: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", experience: "", style: "", notes: "" };

function buildBody(data: FormState): string {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `MT5/EA experience: ${data.experience}`,
    `Trading style: ${data.style || "(not given)"}`,
    `Notes: ${data.notes || "(none)"}`,
  ].join("\n");
}

export function BetaClient() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy my details instead");

  const canSubmit = Boolean(form.name.trim() && form.email.trim() && form.experience);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const subject = `StratoBot beta signup — ${form.name}`;
    const body = buildBody(form);
    window.location.href = `mailto:${encodeURIComponent(TO_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  async function handleCopy() {
    if (!canSubmit) return;
    const text = `To: ${TO_EMAIL}\nSubject: StratoBot beta signup — ${form.name}\n\n${buildBody(form)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied — paste into an email");
    } catch {
      setCopyLabel("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Beta" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-signal mb-2">
            Private beta · MT5 EA testers wanted
          </p>
          <h1 className="font-display font-bold text-2xl text-chalk mb-3">
            Help us break StratoBot before real traders do.
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            StratoBot turns a trading strategy you describe in plain language into a compiled MT5
            Expert Advisor. We&apos;re looking for a small group of EA users to run the free logic
            check against their own strategies and tell us honestly what&apos;s wrong with it.
          </p>
        </div>

        <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-buy mb-1.5">
            Free for 30 days
          </p>
          <p className="text-sm text-chalk/85 leading-relaxed">
            Beta testers get a full 30-day Pro pass — unlimited simulations, strategies, and
            downloads — at no cost. Sign up below and we&apos;ll email you a redeem code to enter
            on the Unlock screen.
          </p>
        </div>

        <div className="rounded-lg bg-ink border border-outline px-4 py-4 flex flex-col gap-2.5">
          {EXAMPLES.map((ex) => (
            <p key={ex} className="font-mono text-[13px] text-chalk/60 leading-relaxed">
              <span className="text-signal">&gt;</span> &ldquo;{ex}&rdquo;
            </p>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VALUE_CARDS.map((c) => (
            <div key={c.n} className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="font-mono text-xs text-signal mb-2">{c.n}</p>
              <p className="text-sm font-medium text-chalk mb-1">{c.title}</p>
              <p className="text-xs text-chalk/60 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="rounded-lg border border-outline bg-slate px-4 py-6 text-center">
            <span className="material-symbols-outlined text-buy text-3xl">check_circle</span>
            <h2 className="font-display font-bold text-lg text-chalk mt-2 mb-1.5">Almost there</h2>
            <p className="text-sm text-chalk/70 max-w-sm mx-auto">
              Your email app should be open with your details filled in for {TO_EMAIL} — just hit
              send. We&apos;ll reply with your beta redeem code.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-outline bg-slate px-4 py-5 flex flex-col gap-4"
          >
            <div>
              <h2 className="font-display font-bold text-lg text-chalk">Join the beta desk</h2>
              <p className="text-xs text-chalk/50 mt-1">
                Takes under a minute. We&apos;ll follow up by email with your free access code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-chalk">
                  Name
                </label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jane Trader"
                  className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-chalk">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="experience" className="text-sm font-medium text-chalk">
                MT5 / EA experience
              </label>
              <select
                id="experience"
                required
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
                className="rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                <option value="" disabled>
                  Choose one
                </option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="style" className="text-sm font-medium text-chalk">
                Trading style / strategy type <span className="text-chalk/50 font-normal">(optional)</span>
              </label>
              <input
                id="style"
                value={form.style}
                onChange={(e) => update("style", e.target.value)}
                placeholder="e.g. ICT/SMC, EMA crossover, breakout, grid"
                className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm font-medium text-chalk">
                Anything else? <span className="text-chalk/50 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="A strategy you'd want to test first, timezone, anything else"
                className="resize-none rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              Sign up to test StratoBot
            </Button>
            <p className="text-xs text-chalk/50 text-center">
              Opens your email app addressed to the StratoBot team. Email not set up?{" "}
              <button type="button" onClick={handleCopy} className="text-secondary hover:underline">
                {copyLabel}
              </button>
            </p>
          </form>
        )}

        <p className="text-xs text-chalk/50 text-center">
          Already testing?{" "}
          <Link href="/feedback" className="text-secondary hover:underline">
            Send feedback here
          </Link>
        </p>
      </main>
    </div>
  );
}

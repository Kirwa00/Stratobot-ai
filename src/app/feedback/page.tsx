"use client";

import { useState, type FormEvent } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

const TO_EMAIL = "emmanuelkirwa8@gmail.com";

const AREA_OPTIONS = [
  "Describing a strategy / parsing",
  "Simulation / logic check",
  "Unlock / payment / beta code",
  "Download / install in MetaTrader",
  "Admin",
  "Something else",
];

const TYPE_OPTIONS = ["Bug", "Confusing / unclear", "Feature suggestion", "General praise"];

interface FormState {
  name: string;
  email: string;
  area: string;
  type: string;
  message: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", area: "", type: "", message: "" };

function buildBody(data: FormState): string {
  return [
    `Name: ${data.name || "(not given)"}`,
    `Email: ${data.email || "(not given)"}`,
    `Area: ${data.area || "(not specified)"}`,
    `Type: ${data.type || "(not specified)"}`,
    "",
    data.message,
  ].join("\n");
}

export default function FeedbackPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy my feedback instead");

  const canSubmit = Boolean(form.message.trim());

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const subject = `StratoBot feedback — ${form.area || "General"}`;
    const body = buildBody(form);
    window.location.href = `mailto:${encodeURIComponent(TO_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  async function handleCopy() {
    if (!canSubmit) return;
    const text = `To: ${TO_EMAIL}\nSubject: StratoBot feedback — ${form.area || "General"}\n\n${buildBody(form)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied — paste into an email");
    } catch {
      setCopyLabel("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Feedback" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-xl text-chalk mb-2">
            Tell us what&apos;s wrong with it
          </h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            This goes straight to the person building StratoBot — not a support queue. Confusing
            wording, wrong logic, a missing block type, a broken screen: the blunt version is the
            useful version.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg border border-outline bg-slate px-4 py-6 text-center">
            <span className="material-symbols-outlined text-buy text-3xl">check_circle</span>
            <h2 className="font-display font-bold text-lg text-chalk mt-2 mb-1.5">
              Thanks — sending now
            </h2>
            <p className="text-sm text-chalk/70 max-w-sm mx-auto">
              Your email app should be open with your feedback filled in for {TO_EMAIL} — just hit
              send.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-outline bg-slate px-4 py-5 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-chalk">
                  Name <span className="text-chalk/50 font-normal">(optional)</span>
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jane Trader"
                  className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-chalk">
                  Email <span className="text-chalk/50 font-normal">(optional, for a reply)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="area" className="text-sm font-medium text-chalk">
                  Which part of the app?
                </label>
                <select
                  id="area"
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  className="rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                >
                  <option value="">Not sure / general</option>
                  {AREA_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="type" className="text-sm font-medium text-chalk">
                  What kind of feedback?
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  className="rounded-lg border border-outline bg-slate-high text-chalk px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                >
                  <option value="">Not sure / general</option>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-chalk">
                What happened?
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="What you were doing, what you expected, what actually happened."
                className="resize-none rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 text-[15px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              Send feedback
            </Button>
            <p className="text-xs text-chalk/50 text-center">
              Opens your email app addressed to the StratoBot team. Email not set up?{" "}
              <button type="button" onClick={handleCopy} className="text-secondary hover:underline">
                {copyLabel}
              </button>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}

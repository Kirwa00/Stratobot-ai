"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { RulesReadback } from "@/components/RulesReadback";
import { useStrategyStore } from "@/lib/store";
import type { ClarifyingQuestion, Strategy } from "@/lib/types";

// Readback for strategies the AI translator built in the rule language. The
// trader answers any clarifying questions, then confirms a readback generated
// from the exact rules the bot will run.

function Questions({ questions }: { questions: ClarifyingQuestion[] }) {
  const { answerQuestions, skipQuestions, parsing } = useStrategyStore();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  const answerFor = (q: ClarifyingQuestion) => (picked[q.id] === "__other" ? other[q.id]?.trim() : picked[q.id]) || "";
  const answered = questions.filter((q) => answerFor(q));

  async function submit() {
    setFailed(false);
    const ok = await answerQuestions(answered.map((q) => ({ question: q.question, answer: answerFor(q) })));
    if (!ok) setFailed(true);
  }

  return (
    <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4 mb-6 flex flex-col gap-5">
      <p className="flex items-center gap-2 font-medium text-chalk text-sm">
        <span className="material-symbols-outlined text-base text-signal">help</span>
        {questions.length === 1 ? "One thing to check before I build this" : `${questions.length} things to check before I build this`}
      </p>
      {questions.map((q) => (
        <fieldset key={q.id} className="flex flex-col gap-2">
          <legend className="text-sm text-chalk/90 leading-relaxed mb-2">{q.question}</legend>
          <div className="flex flex-wrap gap-2">
            {[...q.options, "Something else"].map((opt, i) => {
              const value = i === q.options.length ? "__other" : opt;
              const on = picked[q.id] === value;
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => ({ ...p, [q.id]: value }))}
                  className={`text-sm rounded-lg border px-3 py-2 min-h-[40px] text-left transition-colors ${
                    on ? "border-signal bg-signal/15 text-chalk" : "border-outline text-chalk/80 hover:border-signal/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked[q.id] === "__other" && (
            <input
              type="text"
              maxLength={300}
              value={other[q.id] ?? ""}
              onChange={(e) => setOther((o) => ({ ...o, [q.id]: e.target.value }))}
              placeholder="Type your answer"
              aria-label={`Your answer: ${q.question}`}
              className="rounded-lg border border-outline bg-ink px-3 py-2.5 text-sm text-chalk placeholder:text-chalk/40 focus:outline-none focus:border-signal"
            />
          )}
        </fieldset>
      ))}
      {failed && (
        <p className="text-sm text-caution">
          I couldn&apos;t update the strategy just now. Try again, or skip and use the draft below as it stands.
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="ghost" size="sm" className="flex-1" disabled={parsing} onClick={skipQuestions}>
          Skip, use the draft
        </Button>
        <Button size="sm" className="flex-1" disabled={parsing || answered.length === 0} onClick={submit}>
          {parsing ? "Updating…" : "Update my strategy"}
        </Button>
      </div>
    </div>
  );
}

export function RulesReadbackScreen({ strategy }: { strategy: Strategy }) {
  const router = useRouter();
  const questions = strategy.questions ?? [];
  const assumptions = strategy.assumptions ?? [];
  const warnings = strategy.warnings ?? [];

  return (
    <div className="flex flex-col flex-1">
      <Header back />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <h1 className="font-display font-bold text-xl text-chalk mb-4">
          {questions.length ? "Here's my draft" : "Here's what I understood"}
        </h1>

        {questions.length > 0 && <Questions key={questions.map((q) => q.id).join("|")} questions={questions} />}

        {strategy.rules && (
          <div className="rounded-lg border border-outline bg-slate px-4 py-4 mb-5">
            <RulesReadback rules={strategy.rules} />
          </div>
        )}

        {assumptions.length > 0 && (
          <div className="rounded-lg border border-outline px-4 py-3.5 mb-5">
            <p className="font-medium text-chalk text-sm mb-2">Choices I made where you didn&apos;t say</p>
            <ul className="flex flex-col gap-1.5">
              {assumptions.map((a, i) => (
                <li key={i} className="text-sm text-chalk/75 leading-relaxed">
                  {a}
                </li>
              ))}
            </ul>
            <p className="text-xs text-chalk/50 mt-2">If any of these is wrong, edit your description and say what you meant.</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-bg px-4 py-3.5 mb-5 flex flex-col gap-1.5">
            {warnings.map((w, i) => (
              <p key={i} className="text-sm text-caution flex items-start gap-1.5">
                <span className="material-symbols-outlined text-base leading-5">error</span>
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

        {strategy.unmapped.length > 0 && (
          <div className="rounded-lg border border-caution/40 bg-caution-bg px-4 py-3.5 mb-5">
            <p className="flex items-center gap-2 font-medium text-caution text-sm mb-2">
              <span className="material-symbols-outlined text-base">warning</span>
              {strategy.unmapped.length === 1 ? "One thing your bot won't do" : `${strategy.unmapped.length} things your bot won't do`}
            </p>
            <div className="flex flex-col gap-2.5">
              {strategy.unmapped.map((u, i) => (
                <p key={i} className="text-sm text-chalk/80 leading-relaxed">
                  &ldquo;{u.text}&rdquo;{u.reason ? ` — ${u.reason}` : " — this can't be built yet."}
                </p>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 flex gap-3 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button variant="ghost" className="flex-1" onClick={() => router.push("/app#edit")}>
          Edit description
        </Button>
        <Button className="flex-1" disabled={questions.length > 0 || !strategy.rules} onClick={() => router.push("/simulate")}>
          That&apos;s right
        </Button>
      </div>
    </div>
  );
}

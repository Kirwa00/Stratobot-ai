import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RULE_LANGUAGE_SPEC } from "./spec.generated";
import { EXAMPLES, SYSTEM_PROMPT, interpretOutput, userMessage, type TranslationOutput } from "./translate";
import { validateRules } from "./validate";

test("the prompt's rule-language spec matches types.ts (run scripts/gen-rule-spec.ts if not)", () => {
  const types = readFileSync(join(__dirname, "types.ts"), "utf8").replace(/\r\n/g, "\n");
  assert.equal(RULE_LANGUAGE_SPEC, types);
  assert.ok(SYSTEM_PROMPT.includes(RULE_LANGUAGE_SPEC));
});

test("every prompt example is valid and its status matches its questions", () => {
  for (const e of EXAMPLES) {
    const r = validateRules(e.output.rules);
    assert.ok(r.ok, `${e.prompt}: ${r.ok ? "" : r.errors.join("; ")}`);
    assert.equal(e.output.status, e.output.questions.length ? "needs_answers" : "ready");
  }
});

const output = (parts: Partial<TranslationOutput>): TranslationOutput => ({
  status: "ready",
  rules_json: JSON.stringify(EXAMPLES[0].output.rules),
  questions: [],
  assumptions: [],
  unmapped: [],
  ...parts,
});

test("interpretOutput validates rules and derives status from questions", () => {
  const ok = interpretOutput(output({ status: "needs_answers" }));
  assert.ok(ok.ok && ok.translation.status === "ready" && ok.translation.rules);

  const q = interpretOutput(output({ questions: [{ id: "x", question: "Mirror for sells?", options: ["Yes", "No"] }] }));
  assert.ok(q.ok && q.translation.status === "needs_answers");

  const bad = interpretOutput(output({ rules_json: '{"version":1}' }));
  assert.ok(!bad.ok && bad.errors.length > 0);

  const notJson = interpretOutput(output({ rules_json: "buy low sell high" }));
  assert.ok(!notJson.ok && notJson.errors[0].includes("not valid JSON"));

  const none = interpretOutput(output({ status: "not_a_strategy", rules_json: "" }));
  assert.ok(none.ok && none.translation.rules === null);
});

test("answers are included, trimmed and capped", () => {
  const msg = userMessage("Buy on RSI < 30", [
    { question: "Mirror for sells?", answer: "Yes" },
    { question: "ignored", answer: "   " },
    { bogus: true },
  ]);
  assert.ok(msg.includes('<answer question="Mirror for sells?">Yes</answer>'));
  assert.ok(!msg.includes("ignored"));
  assert.ok(!userMessage("x", "not a list").includes("<answers>"));
});

test("every benchmark expectation is valid rules", async () => {
  const { CORPUS } = await import("../../../scripts/translate-bench/corpus");
  const ids = new Set<string>();
  for (const b of CORPUS) {
    assert.ok(!ids.has(b.id), `duplicate id ${b.id}`);
    ids.add(b.id);
    if (b.expect === null) continue;
    const r = validateRules(b.expect);
    assert.ok(r.ok, `${b.id}: ${r.ok ? "" : r.errors.join("; ")}`);
  }
});

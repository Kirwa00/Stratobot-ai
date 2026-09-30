// Translation benchmark: sends every corpus prompt through the real AI
// translator (the same code as /api/translate) and scores the result by
// behaviour against the expected rules. Every run makes paid API calls
// (about 25-50 requests to claude-opus-5-5 at high effort).
//
//   npx tsx scripts/translate-bench/run.ts            all cases
//   npx tsx scripts/translate-bench/run.ts id1 id2    selected cases
//
// Needs ANTHROPIC_API_KEY in the environment or .env.local. Results are
// written to scripts/translate-bench/results/ (git-ignored).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { translateStrategy } from "../../src/lib/rules/translate-server";
import { CORPUS, type BenchCase } from "./corpus";
import { compareBehaviour, type Behaviour } from "./equivalence";

function apiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const env = join(__dirname, "..", "..", ".env.local");
  if (!existsSync(env)) return undefined;
  const line = readFileSync(env, "utf8").split(/\r?\n/).find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  return line?.slice("ANTHROPIC_API_KEY=".length).trim().replace(/^["']|["']$/g, "") || undefined;
}

interface CaseResult {
  id: string;
  outcome: "equivalent" | "different" | "failed" | "not_a_strategy_ok" | "not_a_strategy_wrong";
  asked: boolean;
  shouldAsk: boolean;
  unmappedOk: boolean;
  repaired: boolean;
  behaviour?: Behaviour;
  error?: string;
  assumptions?: string[];
  unmapped?: string[];
  rules?: unknown;
}

async function runCase(client: Anthropic, b: BenchCase): Promise<CaseResult> {
  const shouldAsk = Boolean(b.answers);
  const base = { id: b.id, shouldAsk, asked: false, unmappedOk: true, repaired: false };
  let r = await translateStrategy(client, b.prompt, []);
  if (!r.ok) return { ...base, outcome: "failed", error: r.reason };
  const asked = r.translation.questions.length > 0;
  let repaired = r.repaired;
  if (shouldAsk && asked) {
    r = await translateStrategy(client, b.prompt, b.answers);
    if (!r.ok) return { ...base, asked, outcome: "failed", error: `after answers: ${r.reason}` };
    repaired ||= r.repaired;
  }
  const t = r.translation;
  const unmappedText = t.unmapped.map((u) => u.text.toLowerCase());
  const unmappedOk = (b.unmapped ?? []).every((s) => unmappedText.some((u) => u.includes(s.toLowerCase())));
  const common = { ...base, asked, repaired, unmappedOk, assumptions: t.assumptions, unmapped: t.unmapped.map((u) => u.text), rules: t.rules };

  if (b.expect === null) return { ...common, outcome: t.status === "not_a_strategy" ? "not_a_strategy_ok" : "not_a_strategy_wrong" };
  if (!t.rules) return { ...common, outcome: "failed", error: `status ${t.status}, no rules` };
  const behaviour = compareBehaviour(b.expect, t.rules);
  const same = behaviour.timeframeMatch && behaviour.tradesIdentical && behaviour.signalAgreement === 1;
  return { ...common, behaviour, outcome: same ? "equivalent" : "different" };
}

async function main() {
  const key = apiKey();
  if (!key) {
    console.error("ANTHROPIC_API_KEY is not set (environment or .env.local).");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: key });
  const selected = process.argv.slice(2);
  const cases = selected.length ? CORPUS.filter((b) => selected.includes(b.id)) : CORPUS;

  const results: CaseResult[] = [];
  const queue = [...cases];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let b = queue.shift(); b; b = queue.shift()) {
        const res = await runCase(client, b).catch((err): CaseResult => ({
          id: b.id, outcome: "failed", asked: false, shouldAsk: Boolean(b.answers), unmappedOk: false, repaired: false, error: String(err),
        }));
        const beh = res.behaviour;
        console.log(
          `${res.outcome.toUpperCase().padEnd(21)} ${res.id}` +
            (beh ? `  signals ${(beh.signalAgreement * 100).toFixed(1)}% of ${beh.signalBars}, trades ${beh.actualTrades}/${beh.expectedTrades}${beh.timeframeMatch ? "" : ", TIMEFRAME"}` : "") +
            (res.shouldAsk !== res.asked ? (res.shouldAsk ? "  (should have asked)" : "  (asked unnecessarily)") : "") +
            (res.unmappedOk ? "" : "  (missed an unmapped clause)") +
            (res.error ? `  ${res.error}` : "") +
            (beh && beh.expectedTrades === 0 ? "  (expected rules never traded here, so this case proves little)" : "") +
            (beh?.firstDiff ? `\n    ${beh.firstDiff}` : "")
        );
        results.push(res);
      }
    })
  );

  const n = results.length;
  const count = (f: (r: CaseResult) => boolean) => results.filter(f).length;
  const correct = count((r) => r.outcome === "equivalent" || r.outcome === "not_a_strategy_ok");
  console.log(`\n${correct}/${n} behaviourally correct`);
  console.log(`${count((r) => r.shouldAsk === r.asked)}/${n} asked exactly when they should`);
  console.log(`${count((r) => r.unmappedOk)}/${n} reported every unsupported clause`);
  console.log(`${count((r) => r.outcome === "failed")} failed, ${count((r) => r.repaired)} needed a repair retry`);

  const dir = join(__dirname, "results");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`Details: ${file}`);
}

main();

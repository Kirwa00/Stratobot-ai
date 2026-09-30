import { test } from "node:test";
import assert from "node:assert/strict";
import { composeMQL5FromStrategy } from "../deterministic-composer";
import { EXAMPLES } from "./translate";
import type { Strategy } from "../types";

const strategy = (parts: Partial<Strategy>): Strategy => ({
  id: "strat-1",
  name: "Test",
  rawPrompt: "",
  readback: "",
  blocks: [],
  unmapped: [],
  createdAt: 0,
  updatedAt: 0,
  ...parts,
});

test("rule strategies compile directly, with unmapped clauses listed as notes", () => {
  const ex = EXAMPLES[2].output;
  const r = composeMQL5FromStrategy(strategy({ rules: ex.rules!, unmapped: ex.unmapped }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(r.code.includes("InpStopLossPips = 30"));
    assert.ok(r.notes.some((n) => n.startsWith('Not built: "there is bullish divergence"')));
  }
});

test("tampered stored rules are refused, not compiled", () => {
  const rules = JSON.parse(JSON.stringify(EXAMPLES[0].output.rules));
  rules.long[0].a.period = "9); DeleteEverything(";
  const r = composeMQL5FromStrategy(strategy({ rules }));
  assert.ok(!r.ok);
});

test("per-side level stops compile to a direction-dependent level", () => {
  const r = composeMQL5FromStrategy(strategy({ rules: EXAMPLES[1].output.rules! }));
  assert.ok(r.ok && /double lv = dir > 0 \? V\d+\(0\) : V\d+\(0\);/.test(r.code));
});

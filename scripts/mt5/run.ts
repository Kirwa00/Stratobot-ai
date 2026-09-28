// MT5 differential test: for each case, compile the EA with MetaEditor, run it
// in the Strategy Tester with InpDiffLog on, then replay the same bars through
// the TypeScript interpreter and compare every rule node on every bar.
//
//   npx tsx scripts/mt5/run.ts [case ...]
//
// Env: MT5_DIR (MetaTrader install), MT5_DATA (terminal data folder),
//      MT5_SYMBOL (default EURUSD), MT5_PERIOD (default M15),
//      MT5_FROM / MT5_TO (default 2026.03.01 / 2026.06.30).
// The terminal must not already be running (it reads the tester config on start),
// and it must be logged into an account that can download the symbol's history.
// The Strategy Tester never places real trades.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileRules } from "../../src/lib/rules/compile-mql5";
import { Interpreter, pipSize, type Candle } from "../../src/lib/rules/interpret";
import type { RuleStrategy } from "../../src/lib/rules/types";
import { CASES } from "./cases";

const MT5_DIR = process.env.MT5_DIR ?? "C:\\Program Files\\MetaTrader 5";
const MT5_DATA =
  process.env.MT5_DATA ?? join(process.env.APPDATA ?? "", "MetaQuotes", "Terminal", "D0E8209F77C8CF37AD8BF550E51FF075");
const COMMON_FILES = join(process.env.APPDATA ?? "", "MetaQuotes", "Terminal", "Common", "Files", "StratoBotDiff");
const SYMBOL = process.env.MT5_SYMBOL ?? "EURUSD";
const PERIOD = process.env.MT5_PERIOD ?? "M15";
const FROM = process.env.MT5_FROM ?? "2026.03.01";
const TO = process.env.MT5_TO ?? "2026.06.30";

/** Bars of history the interpreter needs before its indicators match MT5's (seed effects decay away). */
const WARMUP_BARS = 3000;
const REL_TOLERANCE = 1e-7;

function compileEa(name: string, rules: RuleStrategy): void {
  const dir = join(MT5_DATA, "MQL5", "Experts", "StratoBotDiff");
  mkdirSync(dir, { recursive: true });
  const src = join(dir, `${name}.mq5`);
  const log = join(dir, `${name}.log`);
  writeFileSync(src, compileRules(rules, { name, id: name }));
  try {
    execFileSync(join(MT5_DIR, "MetaEditor64.exe"), [`/compile:${src}`, `/inc:${join(MT5_DATA, "MQL5")}`, `/log:${log}`]);
  } catch {
    // MetaEditor exits non-zero even on success; the log is the source of truth.
  }
  const result = readFileSync(log, "utf16le").match(/Result:\s*(\d+) errors?/);
  if (!result || result[1] !== "0") throw new Error(`${name}: compile failed, see ${log}`);
}

function runTester(name: string): void {
  rmSync(COMMON_FILES, { recursive: true, force: true });
  const ini = join(MT5_DATA, `stratobot-diff-${name}.ini`);
  writeFileSync(
    ini,
    [
      "[Tester]",
      `Expert=StratoBotDiff\\${name}.ex5`,
      `Symbol=${SYMBOL}`,
      `Period=${PERIOD}`,
      "Model=1",
      `FromDate=${FROM}`,
      `ToDate=${TO}`,
      "Deposit=10000",
      "Leverage=100",
      "Optimization=0",
      "Visual=0",
      "ShutdownTerminal=1",
      "[TesterInputs]",
      "InpDiffLog=true",
      "",
    ].join("\r\n")
  );
  execFileSync(join(MT5_DIR, "terminal64.exe"), [`/config:${ini}`], { timeout: 30 * 60 * 1000 });
  rmSync(ini, { force: true });
  if (!existsSync(join(COMMON_FILES, "nodes.csv"))) throw new Error(`${name}: tester produced no log (is the terminal already running?)`);
}

function readRates(): Candle[] {
  return readFileSync(join(COMMON_FILES, "rates.csv"), "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const [time, open, high, low, close, vol] = line.split(",").map(Number);
      return { time, open, high, low, close, tickVolume: vol };
    });
}

interface Mismatch {
  node: string;
  time: number;
  mt5: string;
  ts: string;
}

function compare(
  name: string,
  rules: RuleStrategy
): { compared: number; mismatches: Mismatch[]; longs: number; shorts: number; filterPasses: number } {
  const [header, ...rows] = readFileSync(join(COMMON_FILES, "nodes.csv"), "utf8").trim().split(/\r?\n/);
  const [, , digits, point, gmt, nValues, nConds] = header.split(",");
  const interp = new Interpreter(rules, readRates(), {
    pip: pipSize(Number(digits), Number(point)),
    serverGmtOffsetHours: Number(gmt),
  });
  if (interp.nodes.values.length !== Number(nValues) || interp.nodes.conditions.length !== Number(nConds)) {
    throw new Error(`${name}: node tables differ between compiler and interpreter`);
  }

  const mismatches: Mismatch[] = [];
  let compared = 0;
  let longs = 0;
  let shorts = 0;
  let filterPasses = 0;
  for (const row of rows) {
    const cells = row.split(",");
    const time = Number(cells[0]);
    const t = interp.indexOfTime(time);
    if (t < WARMUP_BARS) continue;
    compared++;
    const d = interp.decide(t);
    const flag = (s: string) => s === "1";
    if (flag(cells[1])) filterPasses++;
    if (flag(cells[2])) longs++;
    if (flag(cells[3])) shorts++;
    const top: [string, boolean, boolean][] = [
      ["filters", flag(cells[1]), d.filters],
      ["long", flag(cells[2]), d.long],
      ["short", flag(cells[3]), d.short],
    ];
    for (const [node, mt5, ts] of top) if (mt5 !== ts) mismatches.push({ node, time, mt5: String(mt5), ts: String(ts) });

    d.values.forEach((ts, i) => {
      const raw = cells[4 + i];
      const mt5 = raw === "nan" ? NaN : Number(raw);
      const bothMissing = Number.isNaN(mt5) && !Number.isFinite(ts);
      const close = Math.abs(mt5 - ts) <= REL_TOLERANCE * Math.max(1, Math.abs(mt5), Math.abs(ts));
      if (!bothMissing && !close) mismatches.push({ node: `V${i}`, time, mt5: raw, ts: String(ts) });
    });
    d.conditions.forEach((ts, i) => {
      const mt5 = flag(cells[4 + d.values.length + i]);
      if (mt5 !== ts) mismatches.push({ node: `C${i}`, time, mt5: String(mt5), ts: String(ts) });
    });
  }
  return { compared, mismatches, longs, shorts, filterPasses };
}

const selected = process.argv.slice(2);
const names = selected.length ? selected : Object.keys(CASES);
let failed = 0;
for (const name of names) {
  const rules = CASES[name];
  if (!rules) throw new Error(`unknown case ${name}`);
  let result: ReturnType<typeof compare>;
  try {
    compileEa(name, rules);
    runTester(name);
    result = compare(name, rules);
  } catch (err) {
    failed++;
    console.log(`ERROR ${name}: ${err instanceof Error ? err.message : String(err)}`);
    continue;
  }
  const { compared, mismatches, longs, shorts, filterPasses } = result;
  const decisions = mismatches.filter((m) => ["filters", "long", "short"].includes(m.node)).length;
  const ok = compared > 0 && mismatches.length === 0;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${name}: ${compared} bars, filters passed ${filterPasses}, buy signals ${longs}, sell signals ${shorts}; ` +
      `${mismatches.length} node mismatches (${decisions} in final decisions)`
  );
  const byNode = new Map<string, Mismatch[]>();
  for (const m of mismatches) byNode.set(m.node, [...(byNode.get(m.node) ?? []), m]);
  for (const [node, list] of byNode) {
    const m = list[0];
    console.log(`   ${node}: ${list.length}x, e.g. bar ${new Date(m.time * 1000).toISOString()} mt5=${m.mt5} ts=${m.ts}`);
  }
}
console.log(failed ? `${failed} case(s) failed` : "all cases passed");
process.exit(failed ? 1 : 0);

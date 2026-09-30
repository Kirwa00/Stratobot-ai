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
import { execute, type Tick, type TradeEvent } from "../../src/lib/rules/execute";
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

interface TradeCheck {
  summary: string;
  mismatches: string[];
}

/** Replays the EA's logged ticks through execute() and compares every trade event with what the EA did. */
function compareTrades(rules: RuleStrategy): TradeCheck {
  const [header, ...tickLines] = readFileSync(join(COMMON_FILES, "ticks.csv"), "utf8").trim().split(/\r?\n/);
  const h = header.slice(1).split(",");
  const meta = Object.fromEntries(h.flatMap((v, i) => (i % 2 === 0 ? [[v, Number(h[i + 1])]] : [])));
  const ticks: Tick[] = tickLines.map((l) => {
    const [time, bid, ask] = l.split(",").map(Number);
    return { time, bid, ask };
  });
  const lastTick = ticks.length ? ticks[ticks.length - 1].time : 0;
  const [nodeHeader] = readFileSync(join(COMMON_FILES, "nodes.csv"), "utf8").split(/\r?\n/, 1);
  const [, , digits, point, gmt] = nodeHeader.split(",");

  // EA side: its own log for what it decided, and the deal history for what the broker did.
  const lines = readFileSync(join(COMMON_FILES, "trades.csv"), "utf8").trim().split(/\r?\n/).map((l) => l.split(","));
  const deals = lines.filter((c) => c[1] === "deal").map((c) => ({
    time: Number(c[0]),
    entry: c[3],
    price: Number(c[4]),
    volume: Number(c[5]),
    reason: c[6],
  }));
  const expertExit = (time: number) => deals.find((d) => d.time === time && d.entry === "1" && d.reason === "3");
  const eaEvents: TradeEvent[] = [];
  const balances = new Map<number, number>();
  const margins = new Map<number, { free: number; perLot: number }>();
  const openTimes = new Set<number>();
  // open/place lines: time,kind,dir,sl,tp,lots,balance,freeMargin,marginPerLot,price[,type]
  for (const c of lines) {
    const time = Number(c[0]);
    const dir = Number(c[2]) > 0 ? 1 : -1;
    if (c[1] === "open" || c[1] === "place") {
      balances.set(time, Number(c[6]));
      margins.set(time, { free: Number(c[7]), perLot: Number(c[8]) });
    }
    switch (c[1]) {
      case "open":
        eaEvents.push({ time, kind: "open", dir, sl: +c[3], tp: +c[4], lots: +c[5], price: +c[9] });
        openTimes.add(time);
        break;
      case "place":
        eaEvents.push({ time, kind: "place", dir, sl: +c[3], tp: +c[4], lots: +c[5], price: +c[9], type: c[10] as "limit" | "stop" });
        break;
      case "cancel":
        eaEvents.push({ time, kind: "cancel" });
        break;
      case "modify":
        eaEvents.push({ time, kind: "modify", sl: +c[2], tp: +c[3] });
        break;
      case "partial": {
        const d = expertExit(time);
        eaEvents.push({ time, kind: "partial", lots: +c[2], price: d?.price ?? NaN });
        break;
      }
      case "close": {
        const d = expertExit(time);
        eaEvents.push({ time, kind: "close", reason: c[2] as "time" | "opposite", price: d?.price ?? NaN, lots: d?.volume ?? NaN });
        break;
      }
    }
  }
  for (const d of deals) {
    if (d.time >= lastTick) continue; // closed by the tester at the end of the test
    if (d.entry === "0" && !openTimes.has(d.time)) eaEvents.push({ time: d.time, kind: "fill", price: d.price, lots: d.volume });
    if (d.entry === "1" && (d.reason === "4" || d.reason === "5")) {
      eaEvents.push({ time: d.time, kind: "close", reason: d.reason === "4" ? "sl" : "tp", price: d.price, lots: d.volume });
    }
  }

  const sim = execute(rules, readRates(), ticks, {
    pip: pipSize(Number(digits), Number(point)),
    serverGmtOffsetHours: Number(gmt),
    symbol: {
      digits: meta.digits,
      point: meta.point,
      volumeStep: meta.step,
      volumeMin: meta.min,
      volumeMax: meta.max,
      tickValue: meta.tickvalue,
      tickSize: meta.ticksize,
      stopsLevel: meta.stops ?? 0,
    },
    initialBalance: 10000,
    startBar: meta.start,
    balanceAt: (t) => balances.get(t),
    marginAt: (t) => margins.get(t),
  });

  // Same-millisecond events in processing order: broker, position management, bar-open exits, entry.
  const rank = (e: TradeEvent) =>
    e.kind === "fill" || (e.kind === "close" && (e.reason === "sl" || e.reason === "tp"))
      ? 0
      : e.kind === "partial" || e.kind === "modify"
        ? 1
        : e.kind === "close" || e.kind === "cancel"
          ? 2
          : 3;
  const order = (a: TradeEvent, b: TradeEvent) => a.time - b.time || rank(a) - rank(b);
  eaEvents.sort(order);
  sim.sort(order);

  const fmt = (e: TradeEvent | undefined) => (e ? `${new Date(e.time).toISOString()} ${JSON.stringify({ ...e, time: undefined })}` : "none");
  const same = (a: TradeEvent, b: TradeEvent) =>
    a.time === b.time &&
    a.kind === b.kind &&
    Object.keys(a).every((k) => {
      const va = (a as unknown as Record<string, unknown>)[k];
      const vb = (b as unknown as Record<string, unknown>)[k];
      return typeof va === "number" && typeof vb === "number" ? Math.abs(va - vb) < 1e-9 : va === vb;
    });
  const mismatches: string[] = [];
  for (let i = 0; i < Math.max(eaEvents.length, sim.length) && mismatches.length < 5; i++) {
    if (!eaEvents[i] || !sim[i] || !same(eaEvents[i], sim[i])) mismatches.push(`#${i}: mt5 ${fmt(eaEvents[i])} | ts ${fmt(sim[i])}`);
  }
  const count = (k: TradeEvent["kind"]) => eaEvents.filter((e) => e.kind === k).length;
  return {
    summary: `${count("open")} opens, ${count("place")} orders (${count("fill")} filled, ${count("cancel")} cancelled), ${count("modify")} stop changes, ${count("partial")} partials, ${count("close")} exits`,
    mismatches,
  };
}

const selected = process.argv.slice(2);
const names = selected.length ? selected : Object.keys(CASES);
let failed = 0;
for (const name of names) {
  const rules = CASES[name];
  if (!rules) throw new Error(`unknown case ${name}`);
  let result: ReturnType<typeof compare>;
  let trades: TradeCheck;
  try {
    compileEa(name, rules);
    runTester(name);
    result = compare(name, rules);
    trades = compareTrades(rules);
  } catch (err) {
    failed++;
    console.log(`ERROR ${name}: ${err instanceof Error ? err.message : String(err)}`);
    continue;
  }
  const { compared, mismatches, longs, shorts, filterPasses } = result;
  const decisions = mismatches.filter((m) => ["filters", "long", "short"].includes(m.node)).length;
  const ok = compared > 0 && mismatches.length === 0 && trades.mismatches.length === 0;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${name}: ${compared} bars, filters passed ${filterPasses}, buy signals ${longs}, sell signals ${shorts}; ` +
      `${mismatches.length} node mismatches (${decisions} in final decisions); ` +
      `trades: ${trades.summary}, ${trades.mismatches.length ? "MISMATCH" : "all match"}`
  );
  for (const m of trades.mismatches) console.log(`   trade ${m}`);
  const byNode = new Map<string, Mismatch[]>();
  for (const m of mismatches) byNode.set(m.node, [...(byNode.get(m.node) ?? []), m]);
  for (const [node, list] of byNode) {
    const m = list[0];
    console.log(`   ${node}: ${list.length}x, e.g. bar ${new Date(m.time * 1000).toISOString()} mt5=${m.mt5} ts=${m.ts}`);
  }
}
console.log(failed ? `${failed} case(s) failed` : "all cases passed");
process.exit(failed ? 1 : 0);

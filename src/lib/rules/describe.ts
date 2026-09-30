import type { Condition, Field, PendingEntry, RuleStrategy, Session, StopSpec, TargetSpec, Timeframe, TrailSpec, Value } from "./types";

// Deterministic plain-English readback of a RuleStrategy. This, not the AI's
// own summary, is what the trader confirms before a bot is built: it is
// generated from exactly the rules the compiler will compile, so anything the
// AI got wrong shows up here in words the trader can check.

export interface RulesReadback {
  timeframe: string;
  filters: string[];
  long: string[] | null;
  short: string[] | null;
  /** How direction is chosen when neither side has rules. */
  direction?: string;
  entry: string[];
  exits: string[];
  sizing: string[];
  guards: string[];
}

const TF_NAMES: Record<Timeframe, string> = {
  M1: "1-minute",
  M5: "5-minute",
  M15: "15-minute",
  M30: "30-minute",
  H1: "1-hour",
  H4: "4-hour",
  D1: "daily",
  W1: "weekly",
};

const SESSION_NAMES: Record<Session, string> = {
  london: "London session (08:00-17:00 GMT)",
  new_york: "New York session (13:00-22:00 GMT)",
  asia: "Asian session (23:00-08:00 GMT)",
  london_ny_overlap: "London/New York overlap (13:00-17:00 GMT)",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const FIELD_NAMES: Record<Field, string> = {
  open: "open",
  high: "high",
  low: "low",
  close: "close",
  median: "median price",
  typical: "typical price",
  weighted: "weighted close",
};

const num = (n: number) => String(Number(n.toFixed(6)));
const plural = (n: number, word: string) => `${num(n)} ${word}${n === 1 ? "" : "s"}`;

/** "of the last closed 4-hour candle", "of the 4-hour candle 2 before the last closed one". */
function candleRef(tf: Timeframe | undefined, shift = 0): string {
  const frame = tf ? `${TF_NAMES[tf]} ` : "";
  if (shift === 0) return `the last closed ${frame}candle`;
  return `the ${frame}candle ${shift} before the last closed one`;
}

function at(tf: Timeframe | undefined, shift = 0): string {
  if (!tf && !shift) return "";
  return ` (${tf ? `${TF_NAMES[tf]}` : ""}${tf && shift ? ", " : ""}${shift ? `${shift} candle${shift === 1 ? "" : "s"} back` : ""})`;
}

const MA_NAMES = { sma: "SMA", ema: "EMA", smma: "smoothed MA", lwma: "weighted MA" } as const;

export function describeValue(v: Value): string {
  const s = "shift" in v ? v.shift : undefined;
  const tf = "tf" in v ? v.tf : undefined;
  const f = (field: Field | undefined, dflt: Field) => (field && field !== dflt ? ` of the ${FIELD_NAMES[field]}` : "");
  switch (v.kind) {
    case "const":
      return num(v.value);
    case "pips":
      return plural(v.value, "pip");
    case "price":
      return `the ${FIELD_NAMES[v.field]} of ${candleRef(tf, s)}`;
    case "ma":
      return `the ${v.period} ${MA_NAMES[v.method]}${f(v.field, "close")}${at(tf, s)}`;
    case "rsi":
      return `RSI(${v.period})${at(tf, s)}`;
    case "atr":
      return `ATR(${v.period})${at(tf, s)}`;
    case "macd":
      return `the MACD(${v.fast},${v.slow},${v.signal}) ${v.line === "main" ? "line" : "signal line"}${at(tf, s)}`;
    case "bands":
      return `the ${v.line} Bollinger Band (${v.period}, ${num(v.deviation)})${at(tf, s)}`;
    case "stochastic":
      return `Stochastic(${v.k},${v.d},${v.slowing}) ${v.line === "main" ? "%K" : "%D"}${at(tf, s)}`;
    case "cci":
      return `CCI(${v.period})${f(v.field, "typical")}${at(tf, s)}`;
    case "adx":
      return `${v.line === "adx" ? "ADX" : v.line === "plus_di" ? "+DI" : "-DI"}(${v.period})${at(tf, s)}`;
    case "sar":
      return `Parabolic SAR (${num(v.step)}, ${num(v.max)})${at(tf, s)}`;
    case "momentum":
      return `Momentum(${v.period})${f(v.field, "close")}${at(tf, s)}`;
    case "wpr":
      return `Williams %R(${v.period})${at(tf, s)}`;
    case "envelopes":
      return `the ${v.line} envelope (${v.period} ${MA_NAMES[v.method]}, ${num(v.deviation)}%)${at(tf, s)}`;
    case "stddev":
      return `the ${v.period}-period standard deviation${f(v.field, "close")}${at(tf, s)}`;
    case "demarker":
      return `DeMarker(${v.period})${at(tf, s)}`;
    case "highest":
    case "lowest": {
      const word = v.kind === "highest" ? "highest high" : "lowest low";
      const candles = `${tf ? `${TF_NAMES[tf]} ` : ""}candle${v.bars === 1 ? "" : "s"}`;
      return s
        ? `the ${word} of the ${v.bars} ${candles} ending ${s} before the last closed one`
        : `the ${word} of the last ${v.bars} closed ${candles}`;
    }
    case "candle": {
      const m = { body: "body size", range: "high-to-low range", upper_wick: "upper wick", lower_wick: "lower wick" }[v.measure];
      return `the ${m} of ${candleRef(tf, s)}`;
    }
    case "swing":
      return `the most recent swing ${v.side} (${v.strength} candle${v.strength === 1 ? "" : "s"} each side, within ${v.lookback} candles${tf ? `, ${TF_NAMES[tf]}` : ""})${s ? `, ${s} candles back` : ""}`;
    case "session_range":
      return `the ${v.side} of the latest ${SESSION_NAMES[v.session].replace(/ \(.*\)/, "")}${s ? `, ${s} candles back` : ""}`;
    case "vwap":
      return `the day's VWAP${s ? `, ${s} candles back` : ""}`;
    case "arith": {
      const a = describeValue(v.a);
      const b = describeValue(v.b);
      if (v.op === "add") return `${a} plus ${b}`;
      if (v.op === "sub") return `${a} minus ${b}`;
      if (v.op === "mul") return `${a} times ${b}`;
      return `${a} divided by ${b}`;
    }
  }
}

function describePattern(c: Extract<Condition, { kind: "pattern" }>): string {
  const where = `on ${candleRef(c.tf, c.shift)}`;
  switch (c.pattern) {
    case "engulfing":
      return `there is a ${c.side} engulfing candle ${where}`;
    case "pin_bar":
      return `there is a ${c.side} pin bar ${where}`;
    case "fvg":
      return `there is a ${c.side} fair value gap of at least ${plural(c.minPips, "pip")} ending ${where}`;
    case "order_block":
      return `price is back inside a ${c.side} order block found in the last ${c.lookback} candles, as of ${candleRef(c.tf, c.shift)}`;
    case "inside_bar":
      return `there is an inside bar ${where}`;
    case "outside_bar":
      return `there is an outside bar ${where}`;
    case "doji":
      return `there is a doji ${where}`;
    case "three_in_row":
      return `there are ${c.side === "bullish" ? "three white soldiers" : "three black crows"} ending ${where}`;
    case "star":
      return `there is a${c.side === "bullish" ? " morning" : "n evening"} star ending ${where}`;
  }
}

const OPS = { gt: "is above", lt: "is below", gte: "is at or above", lte: "is at or below" } as const;

export function describeCondition(c: Condition): string {
  switch (c.kind) {
    case "compare":
      return `${describeValue(c.a)} ${OPS[c.op]} ${describeValue(c.b)}`;
    case "cross":
      return `${describeValue(c.a)} crosses ${c.dir} ${describeValue(c.b)}`;
    case "near":
      return `${describeValue(c.a)} is within ${plural(c.pips, "pip")} of ${describeValue(c.b)}`;
    case "pattern":
      return describePattern(c);
    case "session":
      return `it is the ${SESSION_NAMES[c.name]}`;
    case "time_window":
      return `the time is between ${pad(c.fromHour)}:00 and ${pad(c.toHour)}:00 GMT`;
    case "weekday":
      return `it is ${listOr(c.days.map((d) => DAYS[d]))}`;
    case "all":
      return c.of.length === 1 ? describeCondition(c.of[0]) : `all of: ${c.of.map((x) => `(${describeCondition(x)})`).join(", ")}`;
    case "any":
      return c.of.length === 1 ? describeCondition(c.of[0]) : `any of: ${c.of.map((x) => `(${describeCondition(x)})`).join(", ")}`;
    case "not":
      return `NOT (${describeCondition(c.of)})`;
    case "within":
      return c.bars === 1 ? describeCondition(c.of) : `at some point in the last ${c.bars} candles, ${describeCondition(c.of)}`;
  }
}

const pad = (h: number) => String(h).padStart(2, "0");
function listOr(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

function describeStop(s: StopSpec | TargetSpec): string {
  switch (s.kind) {
    case "pips":
      return `${plural(s.pips, "pip")} from entry`;
    case "atr":
      return `${num(s.multiple)} x ATR(${s.period}) from entry`;
    case "level": {
      const where = s.atShort ? `for buys at ${describeValue(s.at)}, for sells at ${describeValue(s.atShort)}` : `at ${describeValue(s.at)}`;
      return `${where}. If that is on the wrong side of the entry price, the trade is skipped`;
    }
    case "rr":
      return `${num(s.multiple)} times the stop-loss distance from entry`;
  }
}

function describeTrail(t: TrailSpec): string {
  return t.kind === "pips" ? plural(t.pips, "pip") : `${num(t.multiple)} x ATR(${t.period})`;
}

function describePending(side: "buy" | "sell", p: PendingEntry): string {
  const kind = p.type === "limit" ? `${side} limit (waits for a pullback)` : `${side} stop (waits for a breakout)`;
  return `Instead of entering at market, place a ${kind} at ${describeValue(p.at)}, cancelled if not filled within ${plural(p.expiresBars, "candle")}.`;
}

export function describeRules(s: RuleStrategy): RulesReadback {
  const timeframe =
    s.timeframe === "chart"
      ? "Checks its rules once per candle, on whatever chart timeframe you attach it to, using closed candles only."
      : `Checks its rules once per ${TF_NAMES[s.timeframe]} candle, using closed candles only.`;

  const entry: string[] = [];
  if (s.entry?.long) entry.push(describePending("buy", s.entry.long));
  if (s.entry?.short) entry.push(describePending("sell", s.entry.short));

  const exits: string[] = [];
  const e = s.exits;
  if (e.stopLoss) exits.push(`Stop loss ${describeStop(e.stopLoss)}.`);
  if (e.takeProfit) exits.push(`Take profit ${describeStop(e.takeProfit)}.`);
  if (e.breakEvenPips) exits.push(`Move the stop to the entry price once the trade is ${plural(e.breakEvenPips, "pip")} in profit.`);
  if (e.trailing) exits.push(`Trail the stop ${describeTrail(e.trailing)} behind price.`);
  if (e.partial) exits.push(`Close ${num(e.partial.fraction * 100)}% of the position once profit reaches ${num(e.partial.atR)} times the stop distance.`);
  if (e.closeAfterBars) exits.push(`Close the trade at market after ${plural(e.closeAfterBars, "candle")}.`);
  if (e.closeOnOpposite) exits.push("Close the trade when the opposite entry signal fires.");
  if (!exits.length) exits.push("No exit rules: trades stay open until you close them.");

  const sizing: string[] = [];
  const z = s.sizing;
  if (z.riskMoney) sizing.push(`Size each trade so hitting the stop loss loses ${num(z.riskMoney)} in account currency.`);
  else if (z.riskPercent) sizing.push(`Size each trade so hitting the stop loss loses ${num(z.riskPercent)}% of the balance.`);
  if (z.fixedLots) sizing.push(z.riskMoney || z.riskPercent ? `Never more than ${num(z.fixedLots)} lots.` : `Trade ${num(z.fixedLots)} lots.`);
  if (!sizing.length) sizing.push("Trade the lot size you set in the bot's inputs.");

  const guards: string[] = [];
  const g = s.guards;
  if (g.maxDailyLossPercent) guards.push(`Stop trading for the day after losing ${num(g.maxDailyLossPercent)}% of the balance.`);
  if (g.maxTradesPerDay) guards.push(`At most ${plural(g.maxTradesPerDay, "trade")} per day.`);
  if (g.maxSpreadPips) guards.push(`Skip entries while the spread is wider than ${plural(g.maxSpreadPips, "pip")}.`);
  if (g.minRewardRisk) guards.push(`Skip trades whose take profit is less than ${num(g.minRewardRisk)} times the stop distance.`);
  if (g.news) guards.push(`Pause around ${g.news === "high" ? "high-impact" : "all"} news events (live trading only).`);

  const side = (conds: Condition[] | null) => (conds === null ? null : conds.length ? conds.map(describeCondition) : ["(no extra conditions)"]);

  return {
    timeframe,
    filters: s.filters.map(describeCondition),
    long: side(s.long),
    short: side(s.short),
    direction: s.directionFromInput ? "No rule picks buy or sell; you choose the direction in the bot's inputs." : undefined,
    entry,
    exits,
    sizing,
    guards,
  };
}

/** The whole readback as plain text, e.g. for the AI repair prompt or a copy button. */
export function readbackText(r: RulesReadback): string {
  const lines = [r.timeframe];
  if (r.filters.length) lines.push("Only when:", ...r.filters.map((x) => `  - ${x}`));
  if (r.direction) lines.push(r.direction);
  else {
    lines.push(r.long ? "Buy when:" : "Never buys.", ...(r.long ?? []).map((x) => `  - ${x}`));
    lines.push(r.short ? "Sell when:" : "Never sells.", ...(r.short ?? []).map((x) => `  - ${x}`));
  }
  lines.push(...r.entry, ...r.exits, ...r.sizing, ...r.guards);
  return lines.join("\n");
}

import type {
  Condition,
  Field,
  MaMethod,
  PendingEntry,
  RuleStrategy,
  Session,
  StopSpec,
  TargetSpec,
  Timeframe,
  TrailSpec,
  Value,
} from "./types";

// Strict validator for RuleStrategy objects that come from outside the codebase
// (the AI translator, saved strategies, the URL). Everything the compiler and
// interpreter assume is checked here: no unknown keys, no missing fields, every
// number finite and inside the range MT5 accepts. The result is a fresh copy
// built from checked fields only, so nothing unexpected rides along.
//
// `errors` make the strategy unusable. `warnings` are legal but probably not
// what the trader meant; the UI shows them next to the readback.

export type ValidationResult =
  | { ok: true; rules: RuleStrategy; warnings: string[] }
  | { ok: false; errors: string[] };

const TIMEFRAMES: Timeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];
const FIELDS: Field[] = ["open", "high", "low", "close", "median", "typical", "weighted"];
const MA_METHODS: MaMethod[] = ["sma", "ema", "smma", "lwma"];
const SESSIONS: Session[] = ["london", "new_york", "asia", "london_ny_overlap"];
const SIDES = ["bullish", "bearish"] as const;

const MAX_PERIOD = 1000;
const MAX_SHIFT = 500;
const MAX_DEPTH = 10;
const MAX_NODES = 300;

type Obj = Record<string, unknown>;

class Checker {
  errors: string[] = [];
  warnings: string[] = [];
  nodes = 0;
  constructor(private readonly strategyTf: Timeframe | "chart") {}

  fail(path: string, msg: string): undefined {
    this.errors.push(`${path}: ${msg}`);
    return undefined;
  }

  obj(x: unknown, path: string, allowed: string[], required: string[] = []): Obj | undefined {
    if (typeof x !== "object" || x === null || Array.isArray(x)) return this.fail(path, "must be an object");
    const o = x as Obj;
    for (const k of Object.keys(o)) if (!allowed.includes(k)) this.fail(`${path}.${k}`, "unknown field");
    for (const k of required) if (o[k] === undefined) this.fail(`${path}.${k}`, "is required");
    return o;
  }

  oneOf<T extends string>(x: unknown, path: string, options: readonly T[]): T | undefined {
    if (typeof x !== "string" || !options.includes(x as T)) return this.fail(path, `must be one of ${options.join(", ")}`);
    return x as T;
  }

  num(x: unknown, path: string, min: number, max: number, opts: { int?: boolean; exclusiveMin?: boolean } = {}): number | undefined {
    if (typeof x !== "number" || !Number.isFinite(x)) return this.fail(path, "must be a number");
    if (opts.int && !Number.isInteger(x)) return this.fail(path, "must be a whole number");
    if (opts.exclusiveMin ? x <= min : x < min) return this.fail(path, `must be ${opts.exclusiveMin ? "greater than" : "at least"} ${min}`);
    if (x > max) return this.fail(path, `must be at most ${max}`);
    return x;
  }

  pos(x: unknown, path: string, max: number) {
    return this.num(x, path, 0, max, { exclusiveMin: true });
  }

  period(x: unknown, path: string, min = 1) {
    return this.num(x, path, min, MAX_PERIOD, { int: true });
  }

  /** Optional tf/shift shared by series values and patterns. */
  series(o: Obj, path: string, out: Obj) {
    if (o.tf !== undefined) {
      const tf = this.oneOf(o.tf, `${path}.tf`, TIMEFRAMES);
      if (tf && this.strategyTf !== "chart" && TIMEFRAMES.indexOf(tf) < TIMEFRAMES.indexOf(this.strategyTf)) {
        this.fail(`${path}.tf`, `can't be lower than the strategy timeframe ${this.strategyTf}`);
      }
      out.tf = tf;
    }
    if (o.shift !== undefined) out.shift = this.num(o.shift, `${path}.shift`, 0, MAX_SHIFT, { int: true });
  }

  field(o: Obj, path: string, out: Obj) {
    if (o.field !== undefined) out.field = this.oneOf(o.field, `${path}.field`, FIELDS);
  }

  count(path: string, depth: number): boolean {
    this.nodes++;
    if (this.nodes > MAX_NODES) {
      if (this.nodes === MAX_NODES + 1) this.fail(path, `strategy has more than ${MAX_NODES} parts`);
      return false;
    }
    if (depth > MAX_DEPTH) {
      this.fail(path, `nested more than ${MAX_DEPTH} levels deep`);
      return false;
    }
    return true;
  }

  value(x: unknown, path: string, depth = 0): Value | undefined {
    if (!this.count(path, depth)) return undefined;
    const kind = (x as Obj | null)?.kind;
    const S = ["kind", "tf", "shift"];
    const out: Obj = { kind };
    let o: Obj | undefined;
    switch (kind) {
      case "const":
        if (!(o = this.obj(x, path, ["kind", "value"], ["value"]))) return;
        out.value = this.num(o.value, `${path}.value`, -1e9, 1e9);
        break;
      case "pips":
        if (!(o = this.obj(x, path, ["kind", "value"], ["value"]))) return;
        out.value = this.num(o.value, `${path}.value`, -1e5, 1e5);
        break;
      case "price":
        if (!(o = this.obj(x, path, [...S, "field"], ["field"]))) return;
        out.field = this.oneOf(o.field, `${path}.field`, FIELDS);
        this.series(o, path, out);
        break;
      case "ma":
        if (!(o = this.obj(x, path, [...S, "method", "period", "field"], ["method", "period"]))) return;
        out.method = this.oneOf(o.method, `${path}.method`, MA_METHODS);
        out.period = this.period(o.period, `${path}.period`);
        this.field(o, path, out);
        this.series(o, path, out);
        break;
      case "rsi":
      case "atr":
      case "wpr":
      case "demarker":
        if (!(o = this.obj(x, path, [...S, "period"], ["period"]))) return;
        out.period = this.period(o.period, `${path}.period`);
        this.series(o, path, out);
        break;
      case "macd": {
        if (!(o = this.obj(x, path, [...S, "fast", "slow", "signal", "line"], ["fast", "slow", "signal", "line"]))) return;
        const fast = (out.fast = this.period(o.fast, `${path}.fast`));
        const slow = (out.slow = this.period(o.slow, `${path}.slow`));
        out.signal = this.period(o.signal, `${path}.signal`);
        out.line = this.oneOf(o.line, `${path}.line`, ["main", "signal"]);
        if (fast !== undefined && slow !== undefined && fast >= slow) this.fail(`${path}.fast`, "must be smaller than slow");
        this.series(o, path, out);
        break;
      }
      case "bands":
        if (!(o = this.obj(x, path, [...S, "period", "deviation", "line"], ["period", "deviation", "line"]))) return;
        out.period = this.period(o.period, `${path}.period`, 2);
        out.deviation = this.pos(o.deviation, `${path}.deviation`, 10);
        out.line = this.oneOf(o.line, `${path}.line`, ["middle", "upper", "lower"]);
        this.series(o, path, out);
        break;
      case "stochastic":
        if (!(o = this.obj(x, path, [...S, "k", "d", "slowing", "line"], ["k", "d", "slowing", "line"]))) return;
        out.k = this.period(o.k, `${path}.k`);
        out.d = this.period(o.d, `${path}.d`);
        out.slowing = this.period(o.slowing, `${path}.slowing`);
        out.line = this.oneOf(o.line, `${path}.line`, ["main", "signal"]);
        this.series(o, path, out);
        break;
      case "cci":
      case "momentum":
      case "stddev":
        if (!(o = this.obj(x, path, [...S, "period", "field"], ["period"]))) return;
        out.period = this.period(o.period, `${path}.period`, kind === "stddev" ? 2 : 1);
        this.field(o, path, out);
        this.series(o, path, out);
        break;
      case "adx":
        if (!(o = this.obj(x, path, [...S, "period", "line"], ["period", "line"]))) return;
        out.period = this.period(o.period, `${path}.period`);
        out.line = this.oneOf(o.line, `${path}.line`, ["adx", "plus_di", "minus_di"]);
        this.series(o, path, out);
        break;
      case "sar": {
        if (!(o = this.obj(x, path, [...S, "step", "max"], ["step", "max"]))) return;
        const step = (out.step = this.pos(o.step, `${path}.step`, 1));
        const max = (out.max = this.pos(o.max, `${path}.max`, 1));
        if (step !== undefined && max !== undefined && max < step) this.fail(`${path}.max`, "must be at least step");
        this.series(o, path, out);
        break;
      }
      case "envelopes":
        if (!(o = this.obj(x, path, [...S, "period", "method", "deviation", "line", "field"], ["period", "method", "deviation", "line"]))) return;
        out.period = this.period(o.period, `${path}.period`);
        out.method = this.oneOf(o.method, `${path}.method`, MA_METHODS);
        out.deviation = this.pos(o.deviation, `${path}.deviation`, 50);
        out.line = this.oneOf(o.line, `${path}.line`, ["upper", "lower"]);
        this.field(o, path, out);
        this.series(o, path, out);
        break;
      case "highest":
      case "lowest":
        if (!(o = this.obj(x, path, [...S, "bars"], ["bars"]))) return;
        out.bars = this.period(o.bars, `${path}.bars`);
        this.series(o, path, out);
        break;
      case "candle":
        if (!(o = this.obj(x, path, [...S, "measure"], ["measure"]))) return;
        out.measure = this.oneOf(o.measure, `${path}.measure`, ["body", "range", "upper_wick", "lower_wick"]);
        this.series(o, path, out);
        break;
      case "swing": {
        if (!(o = this.obj(x, path, [...S, "side", "strength", "lookback"], ["side", "strength", "lookback"]))) return;
        out.side = this.oneOf(o.side, `${path}.side`, ["high", "low"]);
        const strength = (out.strength = this.num(o.strength, `${path}.strength`, 1, 50, { int: true }));
        const lookback = (out.lookback = this.period(o.lookback, `${path}.lookback`));
        if (strength !== undefined && lookback !== undefined && lookback <= 2 * strength) {
          this.fail(`${path}.lookback`, "must be more than twice the strength, or no swing can ever be confirmed");
        }
        this.series(o, path, out);
        break;
      }
      case "session_range":
        if (!(o = this.obj(x, path, ["kind", "session", "side", "shift"], ["session", "side"]))) return;
        out.session = this.oneOf(o.session, `${path}.session`, SESSIONS);
        out.side = this.oneOf(o.side, `${path}.side`, ["high", "low"]);
        if (o.shift !== undefined) out.shift = this.num(o.shift, `${path}.shift`, 0, MAX_SHIFT, { int: true });
        break;
      case "vwap":
        if (!(o = this.obj(x, path, ["kind", "shift"]))) return;
        if (o.shift !== undefined) out.shift = this.num(o.shift, `${path}.shift`, 0, MAX_SHIFT, { int: true });
        break;
      case "arith":
        if (!(o = this.obj(x, path, ["kind", "op", "a", "b"], ["op", "a", "b"]))) return;
        out.op = this.oneOf(o.op, `${path}.op`, ["add", "sub", "mul", "div"]);
        out.a = this.value(o.a, `${path}.a`, depth + 1);
        out.b = this.value(o.b, `${path}.b`, depth + 1);
        break;
      default:
        return this.fail(`${path}.kind`, `unknown value kind ${JSON.stringify(kind)}`);
    }
    return out as unknown as Value;
  }

  conditions(x: unknown, path: string, depth: number, nonEmpty: boolean): Condition[] | undefined {
    if (!Array.isArray(x)) return this.fail(path, "must be a list");
    if (nonEmpty && x.length === 0) return this.fail(path, "must not be empty");
    return x.map((c, i) => this.condition(c, `${path}[${i}]`, depth)) as Condition[];
  }

  condition(x: unknown, path: string, depth = 0): Condition | undefined {
    if (!this.count(path, depth)) return undefined;
    const kind = (x as Obj | null)?.kind;
    const out: Obj = { kind };
    let o: Obj | undefined;
    switch (kind) {
      case "compare":
        if (!(o = this.obj(x, path, ["kind", "a", "op", "b"], ["a", "op", "b"]))) return;
        out.a = this.value(o.a, `${path}.a`, depth + 1);
        out.op = this.oneOf(o.op, `${path}.op`, ["gt", "lt", "gte", "lte"]);
        out.b = this.value(o.b, `${path}.b`, depth + 1);
        break;
      case "cross":
        if (!(o = this.obj(x, path, ["kind", "a", "dir", "b"], ["a", "dir", "b"]))) return;
        out.a = this.value(o.a, `${path}.a`, depth + 1);
        out.dir = this.oneOf(o.dir, `${path}.dir`, ["above", "below"]);
        out.b = this.value(o.b, `${path}.b`, depth + 1);
        break;
      case "near":
        if (!(o = this.obj(x, path, ["kind", "a", "b", "pips"], ["a", "b", "pips"]))) return;
        out.a = this.value(o.a, `${path}.a`, depth + 1);
        out.b = this.value(o.b, `${path}.b`, depth + 1);
        out.pips = this.pos(o.pips, `${path}.pips`, 10000);
        break;
      case "pattern": {
        const pattern = (x as Obj).pattern;
        const S = ["kind", "pattern", "tf", "shift"];
        switch (pattern) {
          case "engulfing":
          case "pin_bar":
          case "three_in_row":
          case "star":
            if (!(o = this.obj(x, path, [...S, "side"], ["side"]))) return;
            out.side = this.oneOf(o.side, `${path}.side`, SIDES);
            break;
          case "fvg":
            if (!(o = this.obj(x, path, [...S, "side", "minPips"], ["side", "minPips"]))) return;
            out.side = this.oneOf(o.side, `${path}.side`, SIDES);
            out.minPips = this.num(o.minPips, `${path}.minPips`, 0, 10000);
            break;
          case "order_block":
            if (!(o = this.obj(x, path, [...S, "side", "lookback"], ["side", "lookback"]))) return;
            out.side = this.oneOf(o.side, `${path}.side`, SIDES);
            out.lookback = this.num(o.lookback, `${path}.lookback`, 2, 200, { int: true });
            break;
          case "inside_bar":
          case "outside_bar":
          case "doji":
            if (!(o = this.obj(x, path, S))) return;
            break;
          default:
            return this.fail(`${path}.pattern`, `unknown pattern ${JSON.stringify(pattern)}`);
        }
        out.pattern = pattern;
        this.series(o, path, out);
        break;
      }
      case "session":
        if (!(o = this.obj(x, path, ["kind", "name"], ["name"]))) return;
        out.name = this.oneOf(o.name, `${path}.name`, SESSIONS);
        break;
      case "time_window": {
        if (!(o = this.obj(x, path, ["kind", "fromHour", "toHour"], ["fromHour", "toHour"]))) return;
        const from = (out.fromHour = this.num(o.fromHour, `${path}.fromHour`, 0, 23, { int: true }));
        const to = (out.toHour = this.num(o.toHour, `${path}.toHour`, 0, 24, { int: true }));
        if (from !== undefined && to !== undefined && from === to % 24) this.fail(path, "start and end hour are the same, so the window is empty");
        break;
      }
      case "weekday": {
        if (!(o = this.obj(x, path, ["kind", "days"], ["days"]))) return;
        if (!Array.isArray(o.days) || o.days.length === 0) return this.fail(`${path}.days`, "must be a non-empty list");
        const days = o.days.map((d, i) => this.num(d, `${path}.days[${i}]`, 0, 6, { int: true }));
        if (new Set(days).size !== days.length) this.fail(`${path}.days`, "has duplicates");
        out.days = days;
        break;
      }
      case "all":
      case "any":
        if (!(o = this.obj(x, path, ["kind", "of"], ["of"]))) return;
        out.of = this.conditions(o.of, `${path}.of`, depth + 1, true);
        break;
      case "not":
        if (!(o = this.obj(x, path, ["kind", "of"], ["of"]))) return;
        out.of = this.condition(o.of, `${path}.of`, depth + 1);
        break;
      case "within":
        if (!(o = this.obj(x, path, ["kind", "bars", "of"], ["bars", "of"]))) return;
        out.bars = this.num(o.bars, `${path}.bars`, 1, 200, { int: true });
        out.of = this.condition(o.of, `${path}.of`, depth + 1);
        break;
      default:
        return this.fail(`${path}.kind`, `unknown condition kind ${JSON.stringify(kind)}`);
    }
    return out as unknown as Condition;
  }

  stop(x: unknown, path: string, allowRr: boolean): TargetSpec | undefined {
    const kind = (x as Obj | null)?.kind;
    let o: Obj | undefined;
    switch (kind) {
      case "pips":
        if (!(o = this.obj(x, path, ["kind", "pips"], ["pips"]))) return;
        return { kind, pips: this.pos(o.pips, `${path}.pips`, 10000)! };
      case "atr":
        if (!(o = this.obj(x, path, ["kind", "multiple", "period"], ["multiple", "period"]))) return;
        return { kind, multiple: this.pos(o.multiple, `${path}.multiple`, 100)!, period: this.period(o.period, `${path}.period`)! };
      case "level":
        if (!(o = this.obj(x, path, ["kind", "at", "atShort"], ["at"]))) return;
        return o.atShort === undefined
          ? { kind, at: this.value(o.at, `${path}.at`, 1)! }
          : { kind, at: this.value(o.at, `${path}.at`, 1)!, atShort: this.value(o.atShort, `${path}.atShort`, 1)! };
      case "rr":
        if (!allowRr) break;
        if (!(o = this.obj(x, path, ["kind", "multiple"], ["multiple"]))) return;
        return { kind, multiple: this.pos(o.multiple, `${path}.multiple`, 100)! };
    }
    return this.fail(`${path}.kind`, `must be one of pips, atr, level${allowRr ? ", rr" : ""}`);
  }

  trail(x: unknown, path: string): TrailSpec | undefined {
    const kind = (x as Obj | null)?.kind;
    if (kind !== "pips" && kind !== "atr") return this.fail(`${path}.kind`, "must be pips or atr");
    return this.stop(x, path, false) as TrailSpec | undefined;
  }

  pending(x: unknown, path: string): PendingEntry | undefined {
    const o = this.obj(x, path, ["type", "at", "expiresBars"], ["type", "at", "expiresBars"]);
    if (!o) return;
    return {
      type: this.oneOf(o.type, `${path}.type`, ["limit", "stop"])!,
      at: this.value(o.at, `${path}.at`, 1)!,
      expiresBars: this.num(o.expiresBars, `${path}.expiresBars`, 1, 1000, { int: true })!,
    };
  }
}

export function validateRules(input: unknown): ValidationResult {
  const pre = new Checker("chart");
  const top = pre.obj(input, "rules", ["version", "timeframe", "filters", "long", "short", "directionFromInput", "entry", "exits", "sizing", "guards"], ["version", "timeframe", "filters", "long", "short", "exits", "sizing", "guards"]);
  if (!top) return { ok: false, errors: pre.errors };
  if (top.version !== 1) pre.fail("rules.version", "must be 1");
  const timeframe = pre.oneOf(top.timeframe, "rules.timeframe", [...TIMEFRAMES, "chart"] as const);

  const c = new Checker(timeframe ?? "chart");
  c.errors.push(...pre.errors);
  const out: Obj = { version: 1, timeframe };

  out.filters = c.conditions(top.filters, "rules.filters", 0, false);
  out.long = top.long === null ? null : c.conditions(top.long, "rules.long", 0, false);
  out.short = top.short === null ? null : c.conditions(top.short, "rules.short", 0, false);

  if (top.directionFromInput !== undefined) {
    if (typeof top.directionFromInput !== "boolean") c.fail("rules.directionFromInput", "must be true or false");
    else if (top.directionFromInput) {
      if (top.long !== null || top.short !== null) c.fail("rules.directionFromInput", "only allowed when both long and short are null");
      out.directionFromInput = true;
    }
  }
  if (top.long === null && top.short === null && !out.directionFromInput) {
    c.fail("rules", "long and short are both null, so the strategy can never trade");
  }

  if (top.entry !== undefined) {
    const e = c.obj(top.entry, "rules.entry", ["long", "short"]);
    if (e) {
      const entry: Obj = {};
      for (const side of ["long", "short"] as const) {
        if (e[side] === undefined) continue;
        if (top[side] === null) c.fail(`rules.entry.${side}`, `set, but this strategy never trades ${side}`);
        entry[side] = c.pending(e[side], `rules.entry.${side}`);
      }
      out.entry = entry;
    }
  }

  const ex = c.obj(top.exits, "rules.exits", ["stopLoss", "takeProfit", "trailing", "breakEvenPips", "closeAfterBars", "closeOnOpposite", "partial"]);
  const exits: Obj = {};
  if (ex) {
    if (ex.stopLoss !== undefined) exits.stopLoss = c.stop(ex.stopLoss, "rules.exits.stopLoss", false) as StopSpec;
    if (ex.takeProfit !== undefined) exits.takeProfit = c.stop(ex.takeProfit, "rules.exits.takeProfit", true);
    if (ex.trailing !== undefined) exits.trailing = c.trail(ex.trailing, "rules.exits.trailing");
    if (ex.breakEvenPips !== undefined) exits.breakEvenPips = c.pos(ex.breakEvenPips, "rules.exits.breakEvenPips", 10000);
    if (ex.closeAfterBars !== undefined) exits.closeAfterBars = c.num(ex.closeAfterBars, "rules.exits.closeAfterBars", 1, 10000, { int: true });
    if (ex.closeOnOpposite !== undefined) {
      if (typeof ex.closeOnOpposite !== "boolean") c.fail("rules.exits.closeOnOpposite", "must be true or false");
      else if (ex.closeOnOpposite) exits.closeOnOpposite = true;
    }
    if (ex.partial !== undefined) {
      const p = c.obj(ex.partial, "rules.exits.partial", ["atR", "fraction"], ["atR", "fraction"]);
      if (p) {
        exits.partial = { atR: c.pos(p.atR, "rules.exits.partial.atR", 100), fraction: c.pos(p.fraction, "rules.exits.partial.fraction", 1) };
        if (p.fraction === 1) c.fail("rules.exits.partial.fraction", "must be less than 1 (closing everything is a take profit)");
      }
    }
  }
  out.exits = exits;

  const sz = c.obj(top.sizing, "rules.sizing", ["fixedLots", "riskPercent", "riskMoney"]);
  const sizing: Obj = {};
  if (sz) {
    if (sz.fixedLots !== undefined) sizing.fixedLots = c.pos(sz.fixedLots, "rules.sizing.fixedLots", 100);
    if (sz.riskPercent !== undefined) sizing.riskPercent = c.pos(sz.riskPercent, "rules.sizing.riskPercent", 100);
    if (sz.riskMoney !== undefined) sizing.riskMoney = c.pos(sz.riskMoney, "rules.sizing.riskMoney", 1e7);
  }
  out.sizing = sizing;

  const g = c.obj(top.guards, "rules.guards", ["maxDailyLossPercent", "news", "minRewardRisk", "maxTradesPerDay", "maxSpreadPips"]);
  const guards: Obj = {};
  if (g) {
    if (g.maxDailyLossPercent !== undefined) guards.maxDailyLossPercent = c.pos(g.maxDailyLossPercent, "rules.guards.maxDailyLossPercent", 100);
    if (g.news !== undefined) guards.news = c.oneOf(g.news, "rules.guards.news", ["high", "all"]);
    if (g.minRewardRisk !== undefined) guards.minRewardRisk = c.pos(g.minRewardRisk, "rules.guards.minRewardRisk", 100);
    if (g.maxTradesPerDay !== undefined) guards.maxTradesPerDay = c.num(g.maxTradesPerDay, "rules.guards.maxTradesPerDay", 1, 1000, { int: true });
    if (g.maxSpreadPips !== undefined) guards.maxSpreadPips = c.pos(g.maxSpreadPips, "rules.guards.maxSpreadPips", 1000);
  }
  out.guards = guards;

  if (c.errors.length) return { ok: false, errors: c.errors };

  const rules = out as unknown as RuleStrategy;
  const w = c.warnings;
  const hasStop = Boolean(rules.exits.stopLoss);
  if ((rules.sizing.riskPercent || rules.sizing.riskMoney) && !hasStop) w.push("Risk-based sizing needs a stop loss; without one the bot uses the fixed lot size.");
  if (rules.sizing.riskPercent && rules.sizing.riskPercent > 5) w.push(`Risking ${rules.sizing.riskPercent}% of the balance per trade is very aggressive.`);
  if (rules.exits.takeProfit?.kind === "rr" && !hasStop) w.push("A risk:reward take profit is measured from the stop loss, and there is no stop loss, so it is ignored.");
  if (rules.exits.partial && !hasStop) w.push("The partial close is measured in multiples of the stop distance, and there is no stop loss, so it never happens.");
  if (rules.guards.minRewardRisk && !(hasStop && rules.exits.takeProfit)) w.push("The minimum reward:risk check needs both a stop loss and a take profit, so it has no effect.");
  if (!hasStop && !rules.exits.takeProfit && !rules.exits.trailing && !rules.exits.closeAfterBars && !rules.exits.closeOnOpposite) {
    w.push("Nothing ever closes a trade: there is no stop loss, take profit, trailing stop, time exit or opposite-signal exit.");
  }
  if (rules.long && rules.long.length === 0 && rules.filters.length === 0) w.push("The buy side has no conditions, so it buys on every bar.");
  if (rules.short && rules.short.length === 0 && rules.filters.length === 0) w.push("The sell side has no conditions, so it sells on every bar.");
  if (rules.guards.news) w.push("The news filter uses MetaTrader's live economic calendar, which the Strategy Tester doesn't have, so backtests ignore it.");
  return { ok: true, rules, warnings: w };
}

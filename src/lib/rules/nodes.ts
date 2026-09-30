import type { Condition, RuleStrategy, Value } from "./types";

// Deterministic numbering of every distinct value/condition node in a strategy.
// The MQL5 compiler names its functions V<id>/C<id> from this table and the
// interpreter reports results by the same ids, so a differential-test mismatch
// points straight at the node that disagrees. Structurally identical nodes
// share one id (and one indicator handle / one MT5 input).

export interface NodeTable {
  values: Value[];
  conditions: Condition[];
  valueId(v: Value): number;
  conditionId(c: Condition): number;
  /** Ids of the top-level lists, in strategy order. */
  filters: number[];
  long: number[] | null;
  short: number[] | null;
}

/** Values that order placement and exits read (pending prices, stop levels, ATR distances). */
export function tradeValues(s: RuleStrategy): Value[] {
  const out: Value[] = [];
  const spec = (x: { kind: string; at?: Value; period?: number } | undefined) => {
    if (x?.kind === "level" && x.at) out.push(x.at);
    if (x?.kind === "atr" && x.period) out.push(atrValue(x.period));
  };
  if (s.entry?.long) out.push(s.entry.long.at);
  if (s.entry?.short) out.push(s.entry.short.at);
  spec(s.exits.stopLoss);
  spec(s.exits.takeProfit);
  spec(s.exits.trailing);
  return out;
}

export function atrValue(period: number): Value {
  return { kind: "atr", period };
}

export function stableKey(node: unknown): string {
  if (Array.isArray(node)) return `[${node.map(stableKey).join(",")}]`;
  if (node && typeof node === "object") {
    const entries = Object.entries(node as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableKey(v)}`).join(",")}}`;
  }
  return JSON.stringify(node);
}

export function buildNodeTable(s: RuleStrategy): NodeTable {
  const values: Value[] = [];
  const conditions: Condition[] = [];
  const valueIds = new Map<string, number>();
  const conditionIds = new Map<string, number>();

  function addValue(v: Value): number {
    if (v.kind === "arith") {
      addValue(v.a);
      addValue(v.b);
    }
    const key = stableKey(v);
    const existing = valueIds.get(key);
    if (existing !== undefined) return existing;
    valueIds.set(key, values.length);
    values.push(v);
    return values.length - 1;
  }

  function addCondition(c: Condition): number {
    switch (c.kind) {
      case "compare":
      case "cross":
      case "near":
        addValue(c.a);
        addValue(c.b);
        break;
      case "all":
      case "any":
        c.of.forEach(addCondition);
        break;
      case "not":
      case "within":
        addCondition(c.of);
        break;
    }
    const key = stableKey(c);
    const existing = conditionIds.get(key);
    if (existing !== undefined) return existing;
    conditionIds.set(key, conditions.length);
    conditions.push(c);
    return conditions.length - 1;
  }

  const filters = s.filters.map(addCondition);
  const long = s.long ? s.long.map(addCondition) : null;
  const short = s.short ? s.short.map(addCondition) : null;
  for (const v of tradeValues(s)) addValue(v);

  return {
    values,
    conditions,
    valueId: (v) => {
      const id = valueIds.get(stableKey(v));
      if (id === undefined) throw new Error("value not in node table");
      return id;
    },
    conditionId: (c) => {
      const id = conditionIds.get(stableKey(c));
      if (id === undefined) throw new Error("condition not in node table");
      return id;
    },
    filters,
    long,
    short,
  };
}

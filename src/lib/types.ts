// Core domain types for the StratoBot AI trader-facing app.
// These model the "Blueprint" concept from Engineering Plan v1.2 §1:
// trader language -> schema-validated blueprint -> (in production) deterministic
// composer -> compiled bot. This app implements the blueprint + UI layers;
// the composer/compiler/payment backends are out of scope stubs (see README).

export type BlockRole = "entry" | "exit" | "filter";

export type BlockCategory =
  | "Timing"
  | "Structure"
  | "Levels"
  | "Indicators"
  | "Volatility"
  | "Filters"
  | "Risk"
  | "Exits";

export type ParamType = "select" | "number" | "text";

export interface ParamOption {
  value: string;
  label: string;
}

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  options?: ParamOption[];
  default: string | number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface BlockDef {
  id: string;
  label: string;
  role: BlockRole;
  category: BlockCategory;
  icon: string; // Material Symbols glyph name
  description: string; // one-line, shown in the picker
  keywords: string[]; // used by the mock parser
  params: ParamDef[];
}

export interface BlockInstance {
  instanceId: string;
  blockId: string;
  params: Record<string, string | number>;
  /** 0-1. Below CONFIDENCE_THRESHOLD renders the amber left edge. */
  confidence: number;
}

export interface UnmappedClause {
  text: string;
}

export interface Strategy {
  id: string;
  name: string;
  rawPrompt: string;
  readback: string;
  blocks: BlockInstance[];
  unmapped: UnmappedClause[];
  createdAt: number;
  updatedAt: number;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** How a trade's configured exit (if any) resolved against the synthetic path. */
export type TradeOutcome = "target" | "stopped" | "open";

export interface SimulatedTrade {
  index: number;
  candle: number;
  direction: "buy" | "sell";
  /** Candle where the exit rule resolved. Unset while `outcome` is "open". */
  exitCandle?: number;
  outcome: TradeOutcome;
}

export interface SimulationResult {
  candles: Candle[]; // normalized 0-1 OHLC path
  trades: SimulatedTrade[];
  runAt: number;
}

export const CONFIDENCE_THRESHOLD = 0.75;

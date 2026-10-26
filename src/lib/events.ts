// Funnel events the browser may record in StratoBot's own database (shown on
// the admin dashboard). Names only, plus small enum/number properties: never
// strategy text, code, phone numbers or anything a trader typed.
export const RECORDED_EVENTS = [
  "strategy_submitted",
  "generation_succeeded",
  "generation_failed",
  "logic_check_run",
  "pricing_viewed",
  "free_ea_claimed",
  "checkout_started",
  "ea_downloaded",
  "video_strategy_found",
] as const;

export type RecordedEvent = (typeof RECORDED_EVENTS)[number];

/** Readable labels for the admin dashboard. */
export const EVENT_LABELS: Record<string, string> = {
  strategy_submitted: "Strategies submitted",
  generation_succeeded: "Strategies built",
  generation_failed: "Strategies not buildable",
  logic_check_run: "Logic checks run",
  pricing_viewed: "Pricing viewed",
  free_ea_claimed: "Free EAs claimed",
  checkout_started: "Checkouts started",
  ea_downloaded: "EAs downloaded",
  video_strategy_found: "Strategies read from videos",
  payment_succeeded: "Payments received",
};

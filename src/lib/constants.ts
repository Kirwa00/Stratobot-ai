// Shared facts with no "use client" boundary, so both server components
// (marketing/SEO pages) and client components (the app itself) can import
// them directly. Keeping these out of store.tsx matters: a "use client"
// module's exports become opaque client references when pulled into a
// Server Component, and plain constants can't survive that crossing.
export const FREE_SIMS = 5;
export const PRO_DAYS = 30;
export const PRICE_KES = 2500;
/** Shared code handed out by email to beta testers so they can redeem a real
 *  30-day Pro pass (via markPaid()) without paying — not a per-user secret,
 *  same trust model as the rest of this no-backend app. */
export const BETA_CODE = "STRATOBETA30";

/** Example descriptions offered to first-time users (builder, homepage, demo).
 *  examples.test.ts checks each one builds a two-sided bot with a stop loss that
 *  actually trades, through the same parser the live site uses. */
export const EXAMPLE_STRATEGIES = [
  "9/21 EMA cross, stop loss 20 pips, take profit 40 pips",
  "London session only, enter on a bullish or bearish engulfing candle, stop loss 15 pips, take profit 30 pips",
  "MACD cross in either direction during the New York session, stop loss 20 pips, trailing stop 25 pips",
];

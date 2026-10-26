// Shared facts with no "use client" boundary, so both server components
// (marketing/SEO pages) and client components (the app itself) can import
// them directly. Keeping these out of store.tsx matters: a "use client"
// module's exports become opaque client references when pulled into a
// Server Component, and plain constants can't survive that crossing.
export const FREE_SIMS = 5;
export const PRO_DAYS = 30;
/** Pricing from the founder business plan (25 Oct 2026): the first EA is free,
 *  then each EA is a one-off purchase; Pro is the quieter option for traders
 *  who rebuild often. Every price on the site reads from here. */
export const PRICE_PER_EA_KES = 1000;
export const PRO_MONTHLY_KES = 1500;
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
export const PRICE_PER_EA = `${kes(PRICE_PER_EA_KES)} per EA`;
export const PRO_PER_MONTH = `${kes(PRO_MONTHLY_KES)} per month`;
export const PRICE_EA_SHORT = kes(PRICE_PER_EA_KES);
export const PRICE_PRO_SHORT = kes(PRO_MONTHLY_KES);
/** Payments aren't wired up yet; buy buttons say so instead of pretending. */
export const PAYMENTS_LIVE = false;

/** Example descriptions offered to first-time users (builder, homepage, demo).
 *  examples.test.ts checks each one builds a two-sided bot with a stop loss that
 *  actually trades, through the same parser the live site uses. */
export const EXAMPLE_STRATEGIES = [
  "9/21 EMA cross, stop loss 20 pips, take profit 40 pips",
  "London session only, enter on a bullish or bearish engulfing candle, stop loss 15 pips, take profit 30 pips",
  "MACD cross in either direction during the New York session, stop loss 20 pips, trailing stop 25 pips",
];

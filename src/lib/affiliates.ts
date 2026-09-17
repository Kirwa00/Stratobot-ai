export interface AffiliateOffer {
  id: string;
  icon: string;
  label: string;
  body: string;
  ctaText: string;
  /** Placeholder until a real affiliate link is chosen — replace before launch. */
  href: string;
}

// Placeholder hrefs — swap for real affiliate links before this ships. Keeping
// these in one static array (rather than inline in each page) means adding or
// swapping a partner is a one-line change here, not a page edit.
export const AFFILIATE_OFFERS: Record<string, AffiliateOffer> = {
  vps: {
    id: "vps",
    icon: "dns",
    label: "Keep it running 24/7 with a trading VPS",
    body: "Your bot only trades while MetaTrader is open. A trading VPS keeps it running around the clock, even when your own computer is off.",
    ctaText: "Compare VPS plans",
    href: "https://example.com/affiliate/vps-placeholder",
  },
  demoBroker: {
    id: "demoBroker",
    icon: "account_balance",
    label: "Open a free demo account",
    body: "If you don't already have an MT5 account to test on, this opens a free demo account — no real money, just a place to run the bot first.",
    ctaText: "Open a free demo account",
    href: "https://example.com/affiliate/broker-demo-placeholder",
  },
};

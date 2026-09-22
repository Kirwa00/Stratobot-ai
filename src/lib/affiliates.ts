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
    ctaText: "Compare VPS providers",
    href: "/vps",
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

export interface PropFirmPartner {
  id: string;
  name: string;
  note: string;
  /** Plain homepage link for now — swap for the approved affiliate link once available. */
  href: string;
}

// Plain (non-affiliate) homepage links to real, well-known forex prop firms —
// placeholders for real affiliate links once each program is approved. Notes
// are deliberately qualitative: challenge fees, profit splits, and rules
// change often and vary by account size, so we don't quote numbers here.
export const PROP_FIRM_PARTNERS: PropFirmPartner[] = [
  {
    id: "ftmo",
    name: "FTMO",
    note: "One of the largest, longest-running prop firms — a two-step evaluation model most others are compared against.",
    href: "https://ftmo.com",
  },
  {
    id: "fundednext",
    name: "FundedNext",
    note: "Several account types including instant-funding options, popular with retail forex traders.",
    href: "https://fundednext.com",
  },
  {
    id: "the5ers",
    name: "The5ers",
    note: "Forex-focused since early in the prop-firm space, known for scaling funded accounts over time.",
    href: "https://the5ers.com",
  },
  {
    id: "fundingpips",
    name: "Funding Pips",
    note: "Newer entrant with a large base of funded traders and multiple challenge formats.",
    href: "https://fundingpips.com",
  },
  {
    id: "e8markets",
    name: "E8 Markets",
    note: "Multiple funding tracks across forex and other instruments, with flexible scaling plans.",
    href: "https://e8markets.com",
  },
];

export interface VpsProvider {
  id: string;
  name: string;
  focus: "Forex-specialized" | "General-purpose";
  fromPrice: string;
  note: string;
  /** Placeholder until the real approved affiliate/referral link is available — swap in affiliates.ts. */
  href: string;
}

// Facts below (pricing, locations) are drawn from each provider's own public
// site and change over time — this is a starting comparison, not a live feed,
// so the page itself says to verify current details before buying.
export const VPS_PROVIDERS: VpsProvider[] = [
  {
    id: "forexvps",
    name: "ForexVPS.net",
    focus: "Forex-specialized",
    fromPrice: "From $25.60/mo (billed yearly)",
    note: "22 financial data centers worldwide; claims latency as low as 1ms near major broker servers.",
    href: "https://www.forexvps.net/?aff=138346",
  },
  {
    id: "fxvm",
    name: "FXVM",
    focus: "Forex-specialized",
    fromPrice: "From ~$21–25/mo",
    note: "16 server locations, broker-independent, month-to-month with no long-term contract.",
    href: "https://fxvm.net/?aff=125075",
  },
  {
    id: "vultr",
    name: "Vultr",
    focus: "General-purpose",
    fromPrice: "Windows VPS from ~$26/mo",
    note: "Cheap global cloud compute — you install MetaTrader 5 yourself over RDP. Not forex-specific.",
    href: "https://www.vultr.com/?ref=9923993",
  },
  {
    id: "contabo",
    name: "Contabo",
    focus: "General-purpose",
    fromPrice: "From ~$4/mo (Linux) + Windows license",
    note: "Best RAM-for-price ratio of the general options, but Windows costs extra and isn't optimized for broker latency.",
    href: "https://example.com/affiliate/contabo-placeholder",
  },
  {
    id: "hostwinds",
    name: "Hostwinds",
    focus: "General-purpose",
    fromPrice: "Windows VPS from $9.99/mo",
    note: "The cheapest Windows-ready option here — fine for a light EA, no forex-specific latency routing.",
    href: "https://example.com/affiliate/hostwinds-placeholder",
  },
];

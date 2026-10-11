# Conversion sprint audit — 2026-10-11

Scope: the path a first-time visitor takes from the homepage to a downloaded EA,
traced in the code on `main` at `90c57de` and checked against real EURUSD
history (Jan 2025 – Sep 2026, exported from the MT5 demo terminal).

## Stack facts (verified)

- Next.js 16 App Router, React 19, Tailwind 4, no component library: shared
  `Button`, `Header`, `CtaBanner`, design tokens in `globals.css`. Every page sits
  in a 420px mobile column (`app/layout.tsx`), on desktop too.
- No database and no server-side accounts. The strategy, simulation count and
  Pro pass live in the browser's `localStorage` (`lib/store.tsx`). `/login` and
  `lib/auth.ts` are a mock that only guards `/admin`; the build flow never asks
  anyone to sign in.
- Strategy interpretation: `/api/translate` (Claude, needs `ANTHROPIC_API_KEY`)
  → `/api/parse` (Claude, same key) → local keyword parser `lib/parser.ts`.
  Production has no key (`/api/translate` answers `no_api_key`), so **every live
  user goes through the keyword parser and the block path**.
- EA generation: `lib/deterministic-composer.ts` compiles rules with
  `lib/rules/compile-mql5.ts` (MT5-verified by `scripts/mt5`) in the browser at
  `/download`.
- Payments: none wired up (see problem 1).
- Analytics: `@vercel/analytics` `<Analytics />` page views only; no custom
  events anywhere.

## Current journey

`/` → "Describe your strategy — free" → `/app` (textarea + 3 example chips) →
"Read my strategy" → `/readback` (prose summary + block strip) → "That's right" →
`/simulate` (5 free logic checks) → "Get my bot" → `/unlock` (KES 2,500, pay
buttons, beta code) → `/building` (6.4 s of staged text) → `/download`
(disclaimer checkbox, `.mq5` download) → `/install`.

## The three most important verified problems

### 1. Payment is simulated, but the site says you pay with M-Pesa

**Evidence.** `app/unlock/page.tsx` `pay()` waits 1.4 s and calls `markPaid()`;
the comment says "No real payment processor is wired up in this build". The
homepage, `/pricing` and `/unlock` all say "pay with M-Pesa or Airtel Money"
(plus a "Card" button). Anyone who clicks "Pay with M-Pesa" gets a 30-day Pro
pass and is charged nothing; no revenue is possible and the claim is false.

**Fix (frontend, safe).** Say what the code does: payments aren't live, Pro is
free during the beta. The unlock button activates the same pass the mock did, so
nobody loses access, and no copy claims a payment method that doesn't exist.
**Backend still needed** before charging: a payment provider (M-Pesa Daraja /
PesaPal / similar), a server that verifies the payment, and server-side
entitlement. Today the Pro pass is a `localStorage` timestamp anyone can set.

**Expected impact.** Removes a false claim at the moment of highest intent
(trust), and stops a fake "Processing…" step. Revenue is unchanged (it was zero).

### 2. What the trader confirms is not what the bot does

**Evidence.**
- The readback screen shows the parser's prose ("wait for price to sweep the
  previous day high, *then* … *then* enter on a 50% retrace"), but the compiled
  rules (`blocksToRules`) require all of those on the *same* candle. The
  flagship example — on the homepage, `/app` and `/demo` — "London killzone,
  sweep PDH, enter on 50% retrace, trail stop 30 pips" produces a **sell-only**
  bot: 0 buys / 1,519 sells on M15 and 0 / 191 on H1 over 2025–26 EURUSD.
- The keyword parser silently guesses: "RSI oversold or overbought…" becomes a
  sell-only RSI > 70 bot (0 buys / 555 sells on H1) with nothing on screen to say
  the buy side was dropped.
- The free logic check for block strategies does not run the rules at all:
  `runSimulation` in `lib/simulate.ts` places trades at random
  (`rng() < baseChance`, random buy/sell). The homepage promises it "confirms
  your rules fire the way you described".

**Fix.** Show the deterministic readback of the exact rules that get compiled
(`describeRules(blocksToRules(blocks))`, the same component AI-built strategies
already use), flag one-sided bots, and run block strategies' logic check through
the real rules engine (`simulateRules`, the engine verified against MT5) with
per-trade explanations. Replace the flagship example with ones that compile into
two-sided bots with stops.

**Expected impact.** The biggest first-build obstacle: a user can no longer
confirm, "check" and download a bot that does something different from what
they were shown.

### 3. Bots with no stop loss or no exit are built without a warning

**Evidence.** Two of the three example chips have no stop loss; "Wait for a
bullish order block in New York, enter on engulfing candle" has no exit at all.
`validateRules` reports "Nothing ever closes a trade…", but the block path never
runs the validator, so the composer returns `notes: []` and `/download` shows no
warning.

**Fix.** Surface the validator's warnings for block strategies on the readback
screen and in the download notes; give every example a stop loss and target; tell
users what a complete description contains.

**Expected impact.** Fewer first bots that can't close trades; higher odds the
first demo-account test behaves sensibly.

## Smaller verified issues

- `/download` says "The simulation used 100 candles"; rule checks use 150.
- `/building` is 6.4 s of staged text ("Final checks") before the instant
  in-browser compile on `/download`. Left as is (product decision), noted.
- `<Link><Button/></Link>` nests a button inside a link (invalid interactive
  nesting) on CTAs.
- No custom conversion events (problem for measuring any of the above).

## Uncertainties needing manual verification

- Whether Vercel Web Analytics custom events are enabled on this Vercel plan
  (custom events need a paid plan; on Hobby, `track()` calls are dropped).
- The intended post-beta pricing policy (refunds, renewals, what happens to an
  expired pass beyond what the code does). Documented as unknown on `/pricing`
  rather than invented.
- Whether beta testers already received `STRATOBETA30` and expect the code box.
- Real-device mobile check (done here only in the browser pane's mobile viewport).

---

# What was implemented

| Problem | Change | Files |
|---|---|---|
| 1. Simulated payment | Unlock screen activates the same 30-day pass honestly ("free during the beta", no fake processing step); M-Pesa/Airtel claims removed from homepage, pricing and metadata; beta-code redemption kept | `app/unlock/page.tsx`, `app/page.tsx`, `app/pricing/page.tsx`, `components/CtaBanner.tsx` |
| 2. Confirmed ≠ compiled | Readback for block strategies now shows the compiled rules (`RulesReadback` + `strategyRules()`), flags one-sided bots; logic check runs block strategies' real rules through `simulateRules` with per-trade explanations; unlock shows the same readback | `app/readback/page.tsx`, `lib/simulate.ts`, `app/simulate/page.tsx` |
| 2b. Parser silent guesses | MA periods/type are read from the text (was always 9/21 EMA); "bullish or bearish" / "either" means both directions (was sell-only); "setup"/"upper" no longer read as "up" | `lib/parser.ts` |
| 3. No-stop bots, no warning | Block path uses the validator's warnings in readback and download notes | `lib/deterministic-composer.ts`, `app/readback/page.tsx` |
| First-build guidance | "What to include" help text, labelled textarea, verified examples (two-sided, with stops, high confidence), empty/exit-only states with a reword path, conditional heading | `app/app/AppClient.tsx`, `lib/constants.ts` |
| Homepage | New hero and CTAs ("Build My EA" → `/app`, "See How It Works" → on-page section), 4-step explanation, real readback of the example rendered from the live parser, corrected feature/logic-check claims, risk warning | `app/page.tsx` |
| Demo | Verified example with the real readback; stages match the current product; labelled as a demonstration | `app/demo/page.tsx` |
| Download | Accurate logic-check wording, compile/test next steps, correct edit route for AI strategies; files named from the trader's words (were random names like "fib-retrace.mq5") | `app/download/page.tsx`, `lib/parser.ts`, `lib/store.tsx` |

# Conversion events

Sent with Vercel Web Analytics `track()` via `lib/analytics.ts` (only fixed
names and small enum/number properties; never strategy text or code). Early
events are queued so they aren't dropped before `<Analytics />` mounts.

| Event | Where | Properties |
|---|---|---|
| `landing_page_view` | `/` (once per tab session) | — |
| `primary_cta_clicked` | hero "Build My EA" | `location` |
| `strategy_builder_opened` | `/app` (once per session) | — |
| `strategy_submitted` | "Read my strategy" | `source`: example / typed |
| `generation_started` / `_succeeded` / `_failed` | `startFromPrompt` (strategy → buildable rules) | `path`: ai / ai_blocks / parser; `questions` or `unmapped` count |
| `pricing_viewed` | `/pricing`, `/unlock` (once per session) | `page` |
| `checkout_started` | free-pass activation / beta code | `method`: beta_free / beta_code |
| `ea_downloaded` | `/download` click | `source`: ai / blocks |

Not implemented, on purpose:
- `signup_started` / `signup_completed`: there is no sign-up in the build flow
  (no accounts; `/login` only guards `/admin`). Add when real accounts exist.
- `subscription_succeeded`: must come from a server-verified payment
  (provider webhook). Payments aren't live, and a button click is not a payment.
- Custom events need a Vercel plan with Web Analytics custom events; verify
  this in the Vercel dashboard (dev mode logs them to the console, verified).

# Backend requirements this sprint did not touch

1. Real payments: provider account (M-Pesa Daraja, PesaPal, Flutterwave…),
   server route to start checkout, webhook to verify, and server-side
   entitlement. Today the Pro pass is a `localStorage` timestamp.
2. Accounts/storage, so strategies survive a device change.
3. `ANTHROPIC_API_KEY` in Vercel, so live users get the AI translator and its
   clarifying questions instead of the keyword parser.

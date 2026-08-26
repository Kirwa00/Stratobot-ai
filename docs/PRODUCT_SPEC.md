# StratoBot AI — Product Spec

> Reconstructed from the codebase (the design/plan lives inside the app
> itself — `SDLC_PHASES` in `src/data/initialData.ts` and the metadata
> description).

## 1. Vision

**AI-powered MT5 Expert Advisor builder**: retail forex traders (initial
market: Kenya/Tanzania) describe a trading strategy in plain English or
assemble it from "Lego bricks"; the platform uses Gemini to produce a
strategy blueprint, generates safe MQL5 code, validates it with an AST
parser, compiles it to a ready-to-run `.ex5` EA, and sells the download
via M-Pesa (PesaPal) — 2,500 KES / $20 per EA.

## 2. Target users

- Retail MT5 traders in Nairobi / Dar es Salaam who follow SMC/ICT-style
  strategies (FVG, order blocks, killzones, liquidity sweeps) but can't
  write MQL5.
- Free tier: strategy building + simulation (rate-limited, planned
  5 generations/hr); Pro tier (paid via M-Pesa/card): compiled EA
  downloads.

## 3. Core user journey

1. **Build** — describe a strategy in a narrative prompt (Gemini turns it
   into a structured blueprint) or drag Lego bricks (FVG, OB, killzone,
   EMA cross, ATR, Fibonacci, trailing stop, …) and set risk parameters.
2. **Learn** — Video Research Hub: curated YouTube strategy tutorials,
   each with a one-click "load this strategy" blueprint.
3. **Simulate** — in-browser candlestick backtester (100 candles) with
   buy/sell arrows and metrics: Net P&L (KES/USD), win rate, max
   drawdown, Sharpe ratio.
4. **Generate & validate** — MQL5 code generated from the blueprint
   inside a safety "Master Wrapper"; AST parser rejects MQL4 legacy
   calls and unsafe patterns, with an AI auto-repair loop.
5. **Pay & download** — PesaPal M-Pesa STK push / card checkout unlocks
   compilation; compiled `.ex5` served via signed 24h download links.
6. **Manage** — My Strategies vault (persistent, clone, tag, export).

## 4. Monetisation

- Per-EA purchase: 2,500 KES (~$20) via PesaPal (M-Pesa STK push + cards).
- Free vs Pro gating on compilations; planned rate limiting for free tier.
- Currency toggle KES/USD throughout the UI.

## 5. Current reality vs. plan (important)

The repo is an **AI Studio applet / high-fidelity prototype**. Real today:
Gemini blueprint generation and YouTube strategy search (server-side
`@google/genai`), MQL5 code generation from blueprints, AST validation,
the in-browser backtest engine, and the strategy vault (localStorage).

**Simulated** (hard-coded server responses, no real infrastructure):
MetaEditor compilation on an Azure Windows VM, Redis/BullMQ job queue,
Cloudflare R2 signed downloads, and PesaPal payments. The in-app SDLC
tracker marks Phases 0–4 as complete, but those claims describe the
*vision*; this codebase mocks them. See `docs/SDLC_STATUS.md`.

## 6. Success metrics (proposed)

- Prompt→blueprint success rate without manual edits.
- Simulation-to-checkout conversion.
- Paid EA downloads per week; repeat purchases.
- % of compiled EAs that load in MT5 without errors (beta gate).

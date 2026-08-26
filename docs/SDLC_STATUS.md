# StratoBot AI — SDLC Status & Roadmap

> The original 7-phase plan ships inside the app (`SDLC_PHASES` in
> `src/data/initialData.ts`, rendered by the SDLC Phase Tracker tab).
> This document reconciles that plan with what the code actually does.

## 1. The planned phases (as authored in-app)

| Phase | Weeks | Goal | In-app status |
|---|---|---|---|
| 0 — The Spelunking | 1–2 | Headless MQL5 compilation on an Azure Windows Spot VM (`metaeditor64.exe /compile`), Redis/BullMQ queue | "completed" |
| 1 — Master Wrapper & AST Parser | 3–6 | Stop LLM hallucinations: fixed MQL5 wrapper, AST rules, Gemini auto-repair | "completed" |
| 2 — Frontend & Video Hub | 7–10 | Mobile-first builder with 10 Lego bricks, YouTube research hub, 1-click load | "completed" |
| 3 — Simulation Engine | 11–13 | 100-candle candlestick backtester with signals + metrics | "completed" |
| 4 — Monetisation & Async Pipeline | 14–16 | PesaPal M-Pesa checkout (2,500 KES/$20), BullMQ worker, Cloudflare R2 downloads | "in_progress" |
| 5 — Beta Hardening | 17–18 | 20 beta traders in Nairobi/Dar, rate limits, Sentry/Datadog | planned |
| 6 — EA Market Launch | 19–20 | K6 load tests, Terraform auto-scaling, PR campaign | planned |

## 2. Honest status of this repository

The GitHub repo (single commit) is the **frontend + AI prototype**, i.e.
Phases 1–3 for real, with Phases 0 and 4 *simulated* end-to-end so the
whole journey is demoable:

**Actually working**
- Gemini blueprint generation + YouTube strategy search (server-side).
- MQL5 generation inside the Master Wrapper + AST validation & repair loop.
- Strategy Builder (Lego bricks), Simulator, Video Hub, My Strategies
  vault (localStorage persistence, cloning, export), Admin panel, KES/USD.

**Simulated (mocked in `server.ts`)**
- MetaEditor compilation on Azure VM, Redis/BullMQ queue, Cloudflare R2
  signed downloads (`/api/compile-job` fabricates logs and results).
- PesaPal M-Pesa STK push checkout (`/api/pesapal/checkout`).

If Phase 0 infrastructure (VM + compiler agent) exists, it lives outside
this repo. The in-app "completed" statuses should be read as the vision
narrative, not the state of this codebase.

## 3. Proposed roadmap from here

1. **Make Phase 0 real in code**: a repo (or directory) for the Windows
   compiler agent + queue worker; replace the `/api/compile-job` mock
   with real dispatch, keeping the mock as a dev fallback.
2. **Real PesaPal integration**: sandbox keys, IPN callback handling,
   payment persistence, then tier gating.
3. **Persistence & accounts**: move the strategy vault and purchases
   from localStorage to a database with simple auth.
4. **Hygiene**: rename the package from `react-example`, add a test
   runner for `astParser`/`backtestEngine`/`mql5Generator` (pure
   functions, easy wins), and a CI workflow (`tsc --noEmit` + tests).
5. Then Phase 5/6 as planned (rate limits, telemetry, load testing).

## 4. Dev commands

- `npm run dev` — Express + Vite middleware on one port (tsx).
- `npm run lint` — `tsc --noEmit` (passes at `bb2c46a`).
- `npm run build` — Vite client build + esbuild server bundle to `dist/`.
- Env: `GEMINI_API_KEY` (falls back to mock blueprints without it).

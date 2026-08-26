# StratoBot AI — Architecture

> State of the codebase at commit `bb2c46a`.

## 1. Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 6, Tailwind CSS 4, lucide-react icons, motion |
| Server | Express (TypeScript, run with `tsx` in dev; esbuild-bundled CJS for prod) — Vite runs in middleware mode so one process serves API + app |
| AI | Gemini via `@google/genai`, server-side only (key never reaches the browser) |
| Types/lint | TypeScript strict-ish, `npm run lint` = `tsc --noEmit` |
| Deploy target | AI Studio applet (Cloud Run) — `metadata.json`, `GEMINI_API_KEY`/`APP_URL` injected; `vercel.json` present as an alternative |

## 2. Layout

```
server.ts            Express app: 5 API endpoints + Vite middleware/static serving
api/index.ts         serverless entry (re-exports app)
src/App.tsx          tab shell; strategy vault persisted to localStorage
src/components/      Header, SdlcPhaseTracker, StrategyBuilder, MyStrategies,
                     VideoHub, SimulatorEngine, CodeAndCompiler, PesaPalModal,
                     AdminPanel
src/data/initialData.ts  Lego bricks catalogue, seed videos/strategies,
                     SDLC_PHASES plan, Master Wrapper MQL5 template
src/utils/           astParser (MQL5 safety rules), backtestEngine,
                     mql5Generator
src/types.ts         Blueprint / Brick / CompilationJob / Payment / SDLC types
```

## 3. API surface (`server.ts`)

| Endpoint | What it does | Real or simulated |
|---|---|---|
| `POST /api/generate-blueprint` | Narrative prompt → `StrategyBlueprint` JSON via Gemini (schema-constrained); mock blueprint when no key | Real (Gemini) |
| `POST /api/search-youtube-strategies` | Gemini-backed search for strategy videos | Real (Gemini) |
| `POST /api/validate-ast` | Run MQL5 AST safety rules over code | Real (local rules) |
| `POST /api/generate-code` | Blueprint → MQL5 inside Master Wrapper + AST repair loop | Real (local + Gemini) |
| `POST /api/compile-job` | "Azure VM MetaEditor CLI" compilation job | **Simulated** — fabricated logs/latency; pass/fail decided by the AST result |
| `POST /api/pesapal/checkout` | M-Pesa STK push checkout | **Simulated** — fake merchant refs/status |

## 4. Key design decisions (from code)

- **Master Wrapper pattern**: the LLM only ever fills in `CheckEntry()` /
  `CheckExit()` logic inside a fixed, known-good MQL5 template
  (`MASTER_WRAPPER_MQL5_TEMPLATE`) — bounding what AI can break.
- **AST safety gate**: `astParser.ts` rejects MQL4 legacy calls
  (`OrderSend`, `Ask`, `Bid`, `MarketInfo`, …), demands `NormalizeDouble`
  on price/lot math, and feeds failures back into an AI repair loop.
- **Lego brick registry**: strategies are data (`SelectedBrick[]` +
  risk params), so the builder, simulator, code generator, and vault all
  share one `StrategyBlueprint` shape.
- **Server-side Gemini only** — the key comes from env (AI Studio
  secrets); browser talks to the Express API.
- **Client-side persistence**: no database; strategies live in
  `localStorage` (`stratobot_saved_strategies`).

## 5. Gaps / debt

- No backend persistence, auth, or user accounts.
- Compilation, queueing (Redis/BullMQ), artifact storage (R2), and
  payments (PesaPal) are all mocked — the monetisation pipeline is UI-only.
- No tests and no CI; `package.json` still named `react-example`.
- No rate limiting despite the plan's free-tier limits.

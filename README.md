# StratoBot AI

AI-powered MT5 Expert Advisor builder: describe a trading strategy (or
assemble it from Lego bricks), let Gemini generate a blueprint, produce
AST-validated MQL5 code, simulate it on a candlestick backtester, and
buy the compiled EA via M-Pesa.

Design and plans:

- [Product spec](docs/PRODUCT_SPEC.md) — vision, users, journey, monetisation
- [Architecture](docs/ARCHITECTURE.md) — stack, API surface, design decisions
- [SDLC status & roadmap](docs/SDLC_STATUS.md) — the in-app 7-phase plan vs. what this repo actually implements

## Getting started

```bash
npm install
npm run dev        # Express + Vite on one port (tsx)
```

Set `GEMINI_API_KEY` in `.env` for real AI blueprint generation; without
it the server falls back to mock blueprints so the app stays demoable.

Other commands: `npm run lint` (tsc --noEmit), `npm run build` (Vite
client + esbuild server bundle), `npm start` (run the bundle).

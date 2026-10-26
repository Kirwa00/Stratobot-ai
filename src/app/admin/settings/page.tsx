import { databaseMode } from "@/lib/server/db";
import { callbackUrl, payheroConfig, payheroReady } from "@/lib/server/payhero";
import { PRICE_EA_SHORT, PRICE_PRO_SHORT, PRO_DAYS } from "@/lib/constants";
import { PayHeroTest } from "./PayHeroTest";

// Live configuration read from the server's environment. Secret values are
// never shown, only whether they're set. Changing anything here means changing
// the environment variable in Vercel and redeploying.
export const dynamic = "force-dynamic";

export default function AdminSettings() {
  const c = payheroConfig();
  const ready = payheroReady(c);
  const db = databaseMode();
  const cb = callbackUrl(c);

  return (
    <main className="flex-1 px-4 py-6 flex flex-col gap-8 max-w-3xl">
      <section aria-labelledby="payhero" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 id="payhero" className="font-display text-2xl text-chalk">
            PayHero (M-Pesa)
          </h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ready ? "bg-buy/15 text-buy" : "bg-caution/15 text-caution"}`}>
            {ready ? "Taking payments" : "Not live"}
          </span>
        </div>
        <dl className="rounded-lg border border-outline divide-y divide-outline text-sm">
          <Row k="API token (PAYHERO_BASIC_AUTH)" v={c.token ? "Set" : "Missing"} ok={!!c.token} />
          <Row k="Payment channel (PAYHERO_CHANNEL_ID)" v={c.channelId ? String(c.channelId) : "Missing"} ok={!!c.channelId} />
          <Row k="Callback secret (PAYHERO_CALLBACK_SECRET)" v={c.callbackSecret ? "Set" : "Missing"} ok={!!c.callbackSecret} />
          <Row k="API address" v={c.base} ok />
          <Row
            k="Callback URL sent with each payment"
            v={cb ? cb.replace(/secret=[^&]+/, "secret=••••••") : "Needs the callback secret"}
            ok={!!cb}
          />
          <Row k="Database" v={db === "neon" ? "Neon Postgres" : db === "local" ? "Local (development only)" : "Missing (DATABASE_URL)"} ok={db !== "none"} />
        </dl>
        <PayHeroTest />
        <details className="rounded-lg border border-outline bg-slate px-4 py-3 text-sm text-chalk/80">
          <summary className="cursor-pointer font-semibold text-chalk">How to switch payments on</summary>
          <ol className="list-decimal pl-5 mt-3 flex flex-col gap-2 leading-relaxed">
            <li>
              In your PayHero/FinoQ business dashboard, open <b>API Keys</b> → Add new API key, and copy the
              <b> Basic Authorization</b> token.
            </li>
            <li>
              Open <b>Payment Channels</b> and note the ID of the till, paybill or bank channel the money should go to.
            </li>
            <li>
              In Vercel → StratoBot → Settings → Environment Variables (Production), add{" "}
              <code className="font-mono text-xs">PAYHERO_BASIC_AUTH</code>, <code className="font-mono text-xs">PAYHERO_CHANNEL_ID</code>{" "}
              and <code className="font-mono text-xs">PAYHERO_CALLBACK_SECRET</code> (any long random text).
            </li>
            <li>
              Add a database: Vercel → Storage → Create Database → Neon. It sets <code className="font-mono text-xs">DATABASE_URL</code>.
            </li>
            <li>Redeploy, come back here and press Test connection. Then make one real KES purchase yourself.</li>
          </ol>
        </details>
      </section>

      <section aria-labelledby="pricing" className="flex flex-col gap-3">
        <h2 id="pricing" className="font-display text-xl text-chalk">
          Prices
        </h2>
        <dl className="rounded-lg border border-outline divide-y divide-outline text-sm">
          <Row k="First EA" v="Free (one per browser)" ok />
          <Row k="Each EA after that" v={PRICE_EA_SHORT} ok />
          <Row k="Pro" v={`${PRICE_PRO_SHORT} for ${PRO_DAYS} days`} ok />
        </dl>
        <p className="text-xs text-chalk/55">
          Prices are set in <code className="font-mono">src/lib/constants.ts</code> and charged by the server, so a browser
          can&apos;t change what it pays.
        </p>
      </section>

      <section aria-labelledby="other" className="flex flex-col gap-3">
        <h2 id="other" className="font-display text-xl text-chalk">
          Other services
        </h2>
        <dl className="rounded-lg border border-outline divide-y divide-outline text-sm">
          <Row
            k="AI strategy reader (ANTHROPIC_API_KEY)"
            v={process.env.ANTHROPIC_API_KEY ? "Set" : "Missing: typed strategies use the basic parser; videos can't be read"}
            ok={!!process.env.ANTHROPIC_API_KEY}
          />
          <Row k="Admin sign-in (ADMIN_PASSWORD)" v={process.env.ADMIN_PASSWORD ? "Set" : "Missing"} ok={!!process.env.ADMIN_PASSWORD} />
          <Row
            k="Separate session key (ADMIN_SESSION_SECRET)"
            v={process.env.ADMIN_SESSION_SECRET ? "Set" : "Not set (sessions are signed with the admin password)"}
            ok
          />
        </dl>
      </section>
    </main>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-2.5">
      <dt className="text-chalk/70">{k}</dt>
      <dd className={`mono-num break-all ${ok ? "text-chalk" : "text-sell"}`}>{v}</dd>
    </div>
  );
}

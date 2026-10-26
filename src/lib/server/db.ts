// The one place that talks to Postgres. Production uses Neon (DATABASE_URL,
// added from Vercel → Storage). Local development and tests run an in-process
// Postgres (PGlite) so the same SQL works without any setup. In production
// with no DATABASE_URL there is no database: payments and the admin data
// report that instead of silently using throwaway memory.

export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA = [
  `create table if not exists payments (
    id text primary key,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    kind text not null,
    amount integer not null,
    phone text not null,
    client_id text not null,
    strategy_id text,
    strategy_name text,
    status text not null,
    provider_ref text,
    checkout_request_id text,
    receipt text,
    result_desc text
  )`,
  `create index if not exists payments_created_idx on payments (created_at desc)`,
  `create table if not exists events (
    id bigserial primary key,
    at timestamptz not null default now(),
    type text not null,
    client_id text,
    data jsonb
  )`,
  `create index if not exists events_at_idx on events (at desc)`,
];

// One connection per server process. Next bundles route handlers and pages
// separately, so a module-level variable would give each bundle its own copy
// (and, locally, two PGlite instances fighting over one folder).
const shared = globalThis as unknown as { __stratobotDb?: Promise<Db | null> | null };

export function databaseMode(): "neon" | "local" | "none" {
  if (process.env.DATABASE_URL) return "neon";
  return process.env.NODE_ENV === "production" ? "none" : "local";
}

async function connect(): Promise<Db | null> {
  const mode = databaseMode();
  let db: Db;
  if (mode === "neon") {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    db = { query: async (text, params = []) => (await sql.query(text, params)) as never };
  } else if (mode === "local") {
    const { PGlite } = await import("@electric-sql/pglite");
    // In-memory for tests; a folder for `next dev` so data survives restarts.
    const dir = process.env.LOCAL_DB_DIR ?? (process.env.NODE_ENV === "test" ? undefined : ".data/pglite");
    if (dir && !dir.includes("://")) {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(dir, { recursive: true });
    }
    const pg = new PGlite(dir);
    db = { query: async (text, params = []) => (await pg.query(text, params)).rows as never };
  } else {
    return null;
  }
  for (const stmt of SCHEMA) await db.query(stmt);
  return db;
}

/** The database, or null when none is configured (production without DATABASE_URL). */
export function getDb(): Promise<Db | null> {
  shared.__stratobotDb ??= connect().catch((err) => {
    shared.__stratobotDb = null;
    throw err;
  });
  return shared.__stratobotDb;
}

/** Tests only: start from an empty in-memory database. */
export function resetDbForTests() {
  shared.__stratobotDb = null;
}

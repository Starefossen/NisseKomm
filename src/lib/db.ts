/**
 * Server-side store: game state (kv), sessions and login failures.
 * Postgres when DATABASE_URL is set, otherwise in memory (dev, tests).
 */
import { Pool } from "pg";

export type Role = "kid" | "parent";
type Session = { role: Role; expires: number };

/** Keys clients may sync (fase5-plan §2). Everything else stays local. */
export const STATE_KEYS = new Set([
  "nissekomm-codes",
  "nissekomm-julius-watched",
  "nissekomm-bonusoppdrag-completed",
  "nissekomm-earned-badges",
  "nissekomm-brevfugler",
  "nissekomm-santa-letters",
  "nissekomm-frost-off-day",
  "nissekomm-collected-symbols",
  "nissekomm-solved-decryptions",
  "nissekomm-unlocked-files",
  "nissekomm-topic-unlocks",
  "nissekomm-player-names",
  "nissekomm-viewed-emails",
  "nissekomm-viewed-bonusoppdrag-emails",
]);

// Lists two screens append to at once; merged per day instead of overwritten.
const MERGED_KEYS = new Set([
  "nissekomm-codes",
  "nissekomm-julius-watched",
  "nissekomm-bonusoppdrag-completed",
  "nissekomm-brevfugler",
  "nissekomm-santa-letters",
  "nissekomm-viewed-emails",
  "nissekomm-viewed-bonusoppdrag-emails",
]);

const itemId = (x: unknown) => {
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    return JSON.stringify(o.day ?? o.dag ?? o.kode ?? o);
  }
  return JSON.stringify(x);
};

/**
 * Union of stored and incoming lists, incoming wins per day.
 * ponytail: removals (revoked bonus, reset) don't propagate; add a
 * replace flag when a client needs to shrink a list.
 */
export function mergeValue(key: string, stored: unknown, incoming: unknown) {
  if (!MERGED_KEYS.has(key) || !Array.isArray(stored)) return incoming;
  if (!Array.isArray(incoming)) return incoming;
  const byId = new Map(stored.map((x) => [itemId(x), x]));
  for (const x of incoming) byId.set(itemId(x), x);
  return [...byId.values()];
}

export interface Store {
  getState(): Promise<Record<string, unknown>>;
  /** Merges and stores; returns the stored value. */
  putState(key: string, value: unknown): Promise<unknown>;
  getSession(hash: string): Promise<Session | null>;
  setSession(hash: string, s: Session): Promise<void>;
  deleteSession(hash: string): Promise<void>;
  /** Records a failure and returns failures within the window. */
  addFailure(windowMs: number): Promise<number>;
  failureCount(windowMs: number): Promise<number>;
}

export function createMemoryStore(): Store & { reset(): void } {
  let kv = new Map<string, unknown>();
  let sessions = new Map<string, Session>();
  let failures: number[] = [];
  const recent = (w: number) =>
    (failures = failures.filter((t) => Date.now() - t < w)).length;
  return {
    reset() {
      kv = new Map();
      sessions = new Map();
      failures = [];
    },
    async getState() {
      return Object.fromEntries(kv);
    },
    async putState(key, value) {
      const merged = mergeValue(key, kv.get(key), value);
      kv.set(key, merged);
      return merged;
    },
    async getSession(hash) {
      return sessions.get(hash) ?? null;
    },
    async setSession(hash, s) {
      sessions.set(hash, s);
    },
    async deleteSession(hash) {
      sessions.delete(hash);
    },
    async addFailure(w) {
      failures.push(Date.now());
      return recent(w);
    },
    async failureCount(w) {
      return recent(w);
    },
  };
}

const MIGRATION = `
CREATE TABLE IF NOT EXISTS kv (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_sha256 text PRIMARY KEY,
  role         text NOT NULL,
  expires      timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_failures (at timestamptz NOT NULL);
`;
const LOCK_ID = 501224;

/** Idempotent; the advisory lock keeps pods starting together from racing. */
export async function migrate(pool: Pool): Promise<void> {
  const c = await pool.connect();
  try {
    await c.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await c.query(MIGRATION);
  } finally {
    await c.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    c.release();
  }
}

export function createPgStore(pool: Pool): Store {
  const window = (w: number) => new Date(Date.now() - w);
  const failureCount = async (w: number) => {
    const r = await pool.query(
      "SELECT count(*)::int AS n FROM auth_failures WHERE at > $1",
      [window(w)],
    );
    return r.rows[0].n as number;
  };
  return {
    async getState() {
      const r = await pool.query("SELECT key, value FROM kv");
      return Object.fromEntries(r.rows.map((row) => [row.key, row.value]));
    },
    async putState(key, value) {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        await c.query(
          "INSERT INTO kv (key, value) VALUES ($1, 'null') ON CONFLICT (key) DO NOTHING",
          [key],
        );
        const r = await c.query(
          "SELECT value FROM kv WHERE key = $1 FOR UPDATE",
          [key],
        );
        const merged = mergeValue(key, r.rows[0]?.value, value);
        await c.query(
          "UPDATE kv SET value = $2, updated_at = now() WHERE key = $1",
          [key, JSON.stringify(merged)],
        );
        await c.query("COMMIT");
        return merged;
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    async getSession(hash) {
      const r = await pool.query(
        "SELECT role, expires FROM sessions WHERE token_sha256 = $1",
        [hash],
      );
      const row = r.rows[0];
      return row
        ? { role: row.role, expires: new Date(row.expires).getTime() }
        : null;
    },
    async setSession(hash, s) {
      await pool.query("DELETE FROM sessions WHERE expires < now()");
      await pool.query(
        "INSERT INTO sessions (token_sha256, role, expires) VALUES ($1, $2, $3)",
        [hash, s.role, new Date(s.expires)],
      );
    },
    async deleteSession(hash) {
      await pool.query("DELETE FROM sessions WHERE token_sha256 = $1", [hash]);
    },
    async addFailure(w) {
      await pool.query("DELETE FROM auth_failures WHERE at <= $1", [window(w)]);
      await pool.query("INSERT INTO auth_failures (at) VALUES (now())");
      return failureCount(w);
    },
    failureCount,
  };
}

export const memoryStore = createMemoryStore();

let pool: Pool | undefined;
function getPool(): Pool | undefined {
  if (!process.env.DATABASE_URL) return undefined;
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}

let store: Store | undefined;
export function getStore(): Store {
  const p = getPool();
  return (store ??= p ? createPgStore(p) : memoryStore);
}

/** Called once from instrumentation.ts. */
export async function migrateOnStartup(): Promise<void> {
  const p = getPool();
  if (p) await migrate(p);
}

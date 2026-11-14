/**
 * Server-side store: game state (kv), sessions and login failures.
 * Postgres when DATABASE_URL is set (mise run dev: local nissekomm-pg), else a
 * JSON file with DEV_STORE_FILE (dev fallback without Docker),
 * otherwise in memory (tests).
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  RESET_KEY,
  SERVER_KEYS,
  SYNCED_KEYS,
  VERSION_KEY,
} from "./storage-adapter";
import { mergeValue } from "./state-merge";

export type Role = "kid" | "parent";
type Session = { role: Role; expires: number };

/** Keys clients may sync (fase5-plan §2). Everything else stays local. */
export const STATE_KEYS = SYNCED_KEYS;
export { VERSION_KEY };

/** STORAGE_BACKEND, else server when DATABASE_URL is set. */
export function storageBackend(): "server" | "localStorage" {
  const b = process.env.STORAGE_BACKEND;
  if (b === "server" || b === "localStorage") return b;
  return process.env.DATABASE_URL ? "server" : "localStorage";
}

export { mergeValue };

export interface Store {
  getState(): Promise<Record<string, unknown>>;
  /**
   * Merges and stores; returns the stored value. replace skips the merge and
   * bumps VERSION_KEY, so screens holding the old list re-fetch.
   */
  putState(key: string, value: unknown, replace?: boolean): Promise<unknown>;
  getSession(hash: string): Promise<Session | null>;
  setSession(hash: string, s: Session): Promise<void>;
  deleteSession(hash: string): Promise<void>;
  /** Records a failure and returns failures within the window. */
  addFailure(windowMs: number): Promise<number>;
  failureCount(windowMs: number): Promise<number>;
  /**
   * Deletes the upload ticket `upload-ticket:<hash>` and returns true if it
   * was bound to `path` and unexpired. Atomic: a ticket works once.
   */
  consumeTicket(hash: string, path: string): Promise<boolean>;
}

const ticketOk = (t: unknown, path: string) => {
  const o = t as { path?: unknown; expires?: unknown } | null | undefined;
  return (
    o?.path === path && typeof o.expires === "number" && o.expires > Date.now()
  );
};

type Dump = { kv: [string, unknown][]; sessions: [string, Session][] };

export function createMemoryStore(
  init?: Dump,
  onChange?: (d: Dump) => void,
): Store & { reset(): void } {
  let kv = new Map<string, unknown>(init?.kv);
  let sessions = new Map<string, Session>(init?.sessions);
  let failures: number[] = [];
  const save = () => onChange?.({ kv: [...kv], sessions: [...sessions] });
  const recent = (w: number) =>
    (failures = failures.filter((t) => Date.now() - t < w)).length;
  return {
    reset() {
      kv = new Map();
      sessions = new Map();
      failures = [];
      save();
    },
    async getState() {
      return Object.fromEntries(kv);
    },
    async putState(key, value, replace = false) {
      const stored = replace ? value : mergeValue(key, kv.get(key), value);
      kv.set(key, stored);
      if (replace) kv.set(VERSION_KEY, Number(kv.get(VERSION_KEY) ?? 0) + 1);
      save();
      return stored;
    },
    async getSession(hash) {
      return sessions.get(hash) ?? null;
    },
    async setSession(hash, s) {
      for (const [h, o] of sessions)
        if (o.expires < Date.now()) sessions.delete(h);
      sessions.set(hash, s);
      save();
    },
    async deleteSession(hash) {
      sessions.delete(hash);
      save();
    },
    async consumeTicket(hash, path) {
      const key = `upload-ticket:${hash}`;
      const t = kv.get(key);
      kv.delete(key);
      save();
      return ticketOk(t, path);
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

/**
 * Memory store mirrored to a JSON file, so `mise run dev` keeps sessions and
 * progress across restarts. Written via tmp + rename so a crash never leaves
 * half a file.
 */
export function createFileStore(file: string): Store & { reset(): void } {
  let init: Dump | undefined;
  try {
    init = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return createMemoryStore(init, (d) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(d));
    fs.renameSync(`${file}.tmp`, file);
  });
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
CREATE INDEX IF NOT EXISTS sessions_expires ON sessions (expires);
CREATE INDEX IF NOT EXISTS auth_failures_at ON auth_failures (at);
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
    async putState(key, value, replace = false) {
      const c = await pool.connect();
      const update = async (k: string, fn: (old: unknown) => unknown) => {
        await c.query(
          "INSERT INTO kv (key, value) VALUES ($1, 'null') ON CONFLICT (key) DO NOTHING",
          [k],
        );
        const r = await c.query(
          "SELECT value FROM kv WHERE key = $1 FOR UPDATE",
          [k],
        );
        const next = fn(r.rows[0]?.value);
        await c.query(
          "UPDATE kv SET value = $2, updated_at = now() WHERE key = $1",
          [k, JSON.stringify(next)],
        );
        return next;
      };
      try {
        await c.query("BEGIN");
        const stored = await update(key, (old) =>
          replace ? value : mergeValue(key, old, value),
        );
        if (replace) await update(VERSION_KEY, (n) => Number(n ?? 0) + 1);
        await c.query("COMMIT");
        return stored;
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
    async consumeTicket(hash, path) {
      const r = await pool.query(
        "DELETE FROM kv WHERE key = $1 RETURNING value",
        [`upload-ticket:${hash}`],
      );
      return ticketOk(r.rows[0]?.value, path);
    },
    async addFailure(w) {
      await pool.query("DELETE FROM auth_failures WHERE at <= $1", [window(w)]);
      await pool.query("INSERT INTO auth_failures (at) VALUES (now())");
      return failureCount(w);
    },
    failureCount,
  };
}

/**
 * Season reset for the whole family. Replacing writes bump the version, so
 * screens re-fetch instead of pushing their old lists back. Sessions stay.
 */
export async function resetState(store: Store = getStore()): Promise<void> {
  for (const k of [...STATE_KEYS, ...SERVER_KEYS]) {
    await store.putState(k, null, true);
  }
  // Tells a stale screen this 409 was a reset, so it drops its pending writes.
  await store.putState(RESET_KEY, (await store.getState())[VERSION_KEY]);
}

export const memoryStore = createMemoryStore();

let pool: Pool | undefined;
function getPool(): Pool | undefined {
  if (!process.env.DATABASE_URL) return undefined;
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    // A blackholed DB must fail fast, not hang requests and /api/ready.
    connectionTimeoutMillis: 2000,
  }));
}

// On globalThis: Next loads route handlers and server components as separate
// module graphs in one process, and both must see the same sessions.
const g = globalThis as { nissekommStore?: Store };
export function getStore(): Store {
  const p = getPool();
  // Never in production: there DATABASE_URL is required.
  const file =
    process.env.NODE_ENV !== "production" && process.env.DEV_STORE_FILE;
  return (g.nissekommStore ??= p
    ? createPgStore(p)
    : file
      ? createFileStore(file)
      : memoryStore);
}

/** Readiness (/api/ready): true without DATABASE_URL (memory/file store), else SELECT 1. */
export async function dbOk(): Promise<boolean> {
  const p = getPool();
  if (!p) return true;
  return p.query("SELECT 1").then(
    () => true,
    () => false,
  );
}

export async function migrateOnStartup(): Promise<void> {
  const p = getPool();
  if (p) await migrate(p);
}

/**
 * Called from instrumentation.ts without await. Postgres down must not stop
 * the app (kids play on from the client cache): log and retry, 5 s to 60 s.
 */
export async function migrateWithRetry(
  attempt = migrateOnStartup,
  wait = (ms: number) => new Promise((r) => setTimeout(r, ms)),
): Promise<void> {
  for (let ms = 5000; ; ms = Math.min(ms * 2, 60_000)) {
    try {
      return await attempt();
    } catch (e) {
      console.error(`Migrering feilet, prøver igjen om ${ms / 1000} s:`, e);
      await wait(ms);
    }
  }
}

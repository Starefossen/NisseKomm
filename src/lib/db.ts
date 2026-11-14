/**
 * Server-side store: game state (kv), sessions and login rate counters.
 * Postgres when DATABASE_URL is set (mise run dev: local nissekomm-pg), else a
 * JSON file with DEV_STORE_FILE (dev fallback without Docker),
 * otherwise in memory (tests).
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  RESET_KEY,
  SEASON,
  SEASON_KEY,
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

/** A copy of the shared state, taken before anything clears it. */
export type Arkiv = {
  sesong: number;
  /** «sesongskifte» (once per season), «nullstilling» or «manuell» */
  grunn: string;
  arkivert: string;
  data: Record<string, unknown>;
};

/** The family's game state: synced and server keys that hold something. */
export function arkivData(state: Record<string, unknown>) {
  const keys = new Set<string>([...STATE_KEYS, ...SERVER_KEYS]);
  return Object.fromEntries(
    Object.entries(state).filter(([k, v]) => keys.has(k) && v != null),
  );
}

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
  /**
   * Atomically adds one hit to `key` and returns the count in its fixed
   * window (a new window starts when the old one has run out).
   */
  hit(key: string, windowMs: number): Promise<number>;
  /** hit() plus when the window ends (ms since epoch). */
  hits(key: string, windowMs: number): Promise<{ n: number; until: number }>;
  clearHits(key: string): Promise<void>;
  /**
   * Deletes the upload ticket `upload-ticket:<hash>` and returns true if it
   * was bound to `path` and unexpired. Atomic: a ticket works once.
   */
  consumeTicket(hash: string, path: string): Promise<boolean>;
  /**
   * Appends a snapshot of the game state for `sesong`. bareEnGang: skip (and
   * return the existing one) if this season already has a snapshot with this
   * grunn. Returns null when there was nothing to archive.
   */
  arkiver(
    sesong: number,
    grunn: string,
    bareEnGang?: boolean,
  ): Promise<Arkiv | null>;
  /** Every snapshot of a season, oldest first. */
  arkiv(sesong: number): Promise<Arkiv[]>;
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
  arkivFil?: (sesong: number) => string,
): Store & { reset(): void } {
  let kv = new Map<string, unknown>(init?.kv);
  let arkiver = new Map<number, Arkiv[]>();
  const lesArkiv = (s: number): Arkiv[] => {
    if (!arkivFil) return arkiver.get(s) ?? [];
    try {
      return JSON.parse(fs.readFileSync(arkivFil(s), "utf8"));
    } catch {
      return [];
    }
  };
  const skrivArkiv = (s: number, liste: Arkiv[]) => {
    if (!arkivFil) return void arkiver.set(s, liste);
    skrivAtomisk(arkivFil(s), JSON.stringify(liste, null, 1));
  };
  let sessions = new Map<string, Session>(init?.sessions);
  let hits = new Map<string, { n: number; until: number }>();
  const save = () => onChange?.({ kv: [...kv], sessions: [...sessions] });
  return {
    reset() {
      kv = new Map();
      arkiver = new Map();
      sessions = new Map();
      hits = new Map();
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
    async arkiver(sesong, grunn, bareEnGang = false) {
      const liste = lesArkiv(sesong);
      const før = bareEnGang && liste.find((a) => a.grunn === grunn);
      if (før) return før;
      const data = arkivData(Object.fromEntries(kv));
      if (!Object.keys(data).length) return null;
      const a = { sesong, grunn, arkivert: new Date().toISOString(), data };
      skrivArkiv(sesong, [...liste, structuredClone(a)]);
      return a;
    },
    async arkiv(sesong) {
      return structuredClone(lesArkiv(sesong));
    },
    async hit(key, w) {
      return (await this.hits(key, w)).n;
    },
    async hits(key, w) {
      const now = Date.now();
      for (const [k, h] of hits) if (h.until <= now) hits.delete(k);
      const h = hits.get(key) ?? { n: 0, until: now + w };
      h.n++;
      hits.set(key, h);
      return { ...h };
    },
    async clearHits(key) {
      hits.delete(key);
    },
  };
}

/**
 * Memory store mirrored to a JSON file, so `mise run dev` keeps sessions and
 * progress across restarts. Written via tmp + rename so a crash never leaves
 * half a file.
 */
function skrivAtomisk(file: string, text: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, text);
  fs.renameSync(`${file}.tmp`, file);
}

/** Archives go beside it as arkiv-<sesong>.json. */
export function createFileStore(file: string): Store & { reset(): void } {
  let init: Dump | undefined;
  try {
    init = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return createMemoryStore(
    init,
    (d) => skrivAtomisk(file, JSON.stringify(d)),
    (s) => path.join(path.dirname(file), `arkiv-${s}.json`),
  );
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
CREATE TABLE IF NOT EXISTS kv_arkiv (
  id       bigserial PRIMARY KEY,
  sesong   int NOT NULL,
  grunn    text NOT NULL,
  arkivert timestamptz NOT NULL DEFAULT now(),
  data     jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS kv_arkiv_sesong ON kv_arkiv (sesong);
CREATE TABLE IF NOT EXISTS auth_hits (
  key   text PRIMARY KEY,
  n     int NOT NULL,
  until timestamptz NOT NULL
);
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
    async arkiver(sesong, grunn, bareEnGang = false) {
      const c = await pool.connect();
      const rad = (r: {
        sesong: number;
        grunn: string;
        arkivert: Date;
        data: Record<string, unknown>;
      }): Arkiv => ({ ...r, arkivert: new Date(r.arkivert).toISOString() });
      try {
        await c.query("BEGIN");
        // Two pods changing season at once must not both archive.
        await c.query("SELECT pg_advisory_xact_lock($1, $2)", [
          LOCK_ID,
          sesong,
        ]);
        if (bareEnGang) {
          const r = await c.query(
            "SELECT sesong, grunn, arkivert, data FROM kv_arkiv WHERE sesong = $1 AND grunn = $2 ORDER BY id LIMIT 1",
            [sesong, grunn],
          );
          if (r.rows[0]) {
            await c.query("COMMIT");
            return rad(r.rows[0]);
          }
        }
        const kv = await c.query("SELECT key, value FROM kv");
        const data = arkivData(
          Object.fromEntries(kv.rows.map((row) => [row.key, row.value])),
        );
        if (!Object.keys(data).length) {
          await c.query("COMMIT");
          return null;
        }
        const r = await c.query(
          "INSERT INTO kv_arkiv (sesong, grunn, data) VALUES ($1, $2, $3) RETURNING sesong, grunn, arkivert, data",
          [sesong, grunn, JSON.stringify(data)],
        );
        await c.query("COMMIT");
        return rad(r.rows[0]);
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    async arkiv(sesong) {
      const r = await pool.query(
        "SELECT sesong, grunn, arkivert, data FROM kv_arkiv WHERE sesong = $1 ORDER BY id",
        [sesong],
      );
      return r.rows.map((row) => ({
        ...row,
        arkivert: new Date(row.arkivert).toISOString(),
      }));
    },
    // One UPSERT takes the row lock, so a parallel burst counts every hit.
    async hit(key, w) {
      return (await this.hits(key, w)).n;
    },
    async hits(key, w) {
      await pool.query("DELETE FROM auth_hits WHERE until < now()");
      const r = await pool.query(
        `INSERT INTO auth_hits (key, n, until)
           VALUES ($1, 1, $2)
         ON CONFLICT (key) DO UPDATE SET
           n = CASE WHEN auth_hits.until < now() THEN 1 ELSE auth_hits.n + 1 END,
           until = CASE WHEN auth_hits.until < now() THEN EXCLUDED.until ELSE auth_hits.until END
         RETURNING n, until`,
        [key, new Date(Date.now() + w)],
      );
      return {
        n: r.rows[0].n as number,
        until: new Date(r.rows[0].until).getTime(),
      };
    },
    async clearHits(key) {
      await pool.query("DELETE FROM auth_hits WHERE key = $1", [key]);
    },
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

/**
 * Season reset with the archive first: no snapshot, no reset (a failed
 * archive throws before anything is cleared).
 */
export async function arkiverOgNullstill(
  grunn: string,
  sesong = SEASON,
  store: Store = getStore(),
): Promise<Arkiv | null> {
  const a = await store.arkiver(sesong, grunn, grunn === "sesongskifte");
  console.log(
    `Sesong ${sesong}: ${grunn}, ${a ? `arkivert ${a.arkivert} (${Object.keys(a.data).length} nøkler)` : "ingenting å arkivere"}, nullstiller`,
  );
  await resetState(store);
  return a;
}

let sesongSjekk: Promise<void> | undefined;
/**
 * Runs before state is served. A stored season older than SEASON means a new
 * build started a new season: archive (once per season), then clear. No
 * marker yet means the state is this season's (servers from before the
 * marker existed): just stamp it.
 */
export function sjekkSesong(store: Store = getStore()): Promise<void> {
  // ponytail: per-process memo; two replicas rely on the archive's advisory lock.
  return (sesongSjekk ??= (async () => {
    const s = (await store.getState())[SEASON_KEY];
    if (s === SEASON) return;
    if (typeof s === "number" && s < SEASON)
      await arkiverOgNullstill("sesongskifte", s, store);
    if (typeof s !== "number" || s < SEASON)
      await store.putState(SEASON_KEY, SEASON);
  })().catch((e) => {
    sesongSjekk = undefined;
    throw e;
  }));
}

/** Tests: forget that this process has checked the season. */
export function glemSesongSjekk() {
  sesongSjekk = undefined;
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

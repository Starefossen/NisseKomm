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
  /** Unique across seasons (kv_arkiv.id; the dev file uses ms timestamps). */
  id: number;
  sesong: number;
  /** «sesongskifte», «nullstilling», «manuell» or «før-gjenoppretting» */
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

/** Exclusive access to kv and the archive (see Store.låst). */
export type Tx = {
  /** All of kv, read under the lock. */
  state: Record<string, unknown>;
  arkiv(sesong?: number): Promise<Arkiv[]>;
  leggTil(
    sesong: number,
    grunn: string,
    data: Record<string, unknown>,
  ): Promise<Arkiv>;
  /** Plain overwrites, no merge, no version bump. */
  skriv(verdier: Record<string, unknown>): Promise<void>;
};

export interface Store {
  getState(): Promise<Record<string, unknown>>;
  /**
   * Merges and stores; returns the stored value. replace skips the merge and
   * bumps VERSION_KEY, so screens holding the old list re-fetch.
   * With `forventet` (a client's version; null = none sent) the version is
   * checked under the same lock as the write: older than the stored one, or
   * null after a season reset, throws VersjonsKonflikt and writes nothing.
   */
  putState(
    key: string,
    value: unknown,
    replace?: boolean,
    forventet?: number | null,
  ): Promise<unknown>;
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
   * Runs fn alone: no other låst() or kv write (any process) runs meanwhile.
   * Postgres: one transaction under an advisory lock with kv locked against
   * writes; dev file: a lock file, kv re-read from disk.
   */
  låst<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  /** Every snapshot of a season (all seasons without one), oldest first. */
  arkiv(sesong?: number): Promise<Arkiv[]>;
}

const ticketOk = (t: unknown, path: string) => {
  const o = t as { path?: unknown; expires?: unknown } | null | undefined;
  return (
    o?.path === path && typeof o.expires === "number" && o.expires > Date.now()
  );
};

type Dump = { kv: [string, unknown][]; sessions: [string, Session][] };

const vent = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class VersjonsKonflikt extends Error {
  constructor(
    readonly version: number,
    readonly reset: unknown,
  ) {
    super("versjonskonflikt");
  }
}

/** Postgres lock_timeout (55P03): the caller answers 503 and the client retries. */
export const erLåsTimeout = (e: unknown) =>
  (e as { code?: string })?.code === "55P03";

function sjekkVersjon(
  forventet: number | null | undefined,
  lagret: unknown,
  reset: unknown,
) {
  if (forventet === undefined) return;
  const current = Number(lagret ?? 0);
  const v = forventet ?? (reset != null ? 0 : current);
  if (v < current) throw new VersjonsKonflikt(current, reset ?? null);
}

/** Cross-process lock for the dev file: mkdir is atomic. */
async function filLås<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const lås = `${file}.lock`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (let i = 0; ; i++) {
    try {
      fs.mkdirSync(lås);
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      // A crashed holder leaves the directory behind.
      const st = fs.statSync(lås, { throwIfNoEntry: false });
      if (st && Date.now() - st.mtimeMs > 30_000)
        fs.rmSync(lås, { recursive: true, force: true });
      else if (i > 1000) throw new Error(`Fikk ikke låsen ${lås}`);
      else await vent(10);
    }
  }
  try {
    return await fn();
  } finally {
    fs.rmSync(lås, { recursive: true, force: true });
  }
}

/**
 * An unreadable archive must never read as empty and be overwritten: move it
 * aside and stop.
 */
function lesArkivFil(file: string): Arkiv[] {
  let tekst: string;
  try {
    tekst = fs.readFileSync(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  try {
    const liste = JSON.parse(tekst);
    if (!Array.isArray(liste)) throw new Error("ikke en liste");
    return liste.map((a: Arkiv) => ({
      ...a,
      id: a.id ?? Date.parse(a.arkivert),
    }));
  } catch (e) {
    const ny = `${file}.korrupt-${Date.now()}`;
    fs.renameSync(file, ny);
    throw new Error(
      `Arkivet ${file} kunne ikke leses (flyttet til ${ny}): ${e}`,
    );
  }
}

/** In memory, or mirrored to `file` (with arkiv-<sesong>.json beside it). */
export function createMemoryStore(file?: string): Store & { reset(): void } {
  let kv = new Map<string, unknown>();
  let sessions = new Map<string, Session>();
  let arkiver: Arkiv[] = [];
  let hits = new Map<string, { n: number; until: number }>();
  const dir = file && path.dirname(file);
  const arkivFil = (s: number) => path.join(dir!, `arkiv-${s}.json`);

  const last = () => {
    if (!file) return;
    let d: Dump | undefined;
    try {
      d = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      // Only a missing file is an empty store; never overwrite one we can't read.
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        const ny = `${file}.korrupt-${Date.now()}`;
        fs.renameSync(file, ny);
        throw new Error(`${file} kunne ikke leses (flyttet til ${ny}): ${e}`);
      }
    }
    kv = new Map(d?.kv);
    sessions = new Map(d?.sessions);
  };
  const save = () => {
    if (file)
      skrivAtomisk(
        file,
        JSON.stringify({ kv: [...kv], sessions: [...sessions] }),
      );
  };
  const alleArkiv = (sesong?: number): Arkiv[] => {
    if (!dir)
      return arkiver.filter((a) => sesong == null || a.sesong === sesong);
    if (sesong != null) return lesArkivFil(arkivFil(sesong));
    const filer = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => /^arkiv-\d+\.json$/.test(f))
      : [];
    return filer
      .flatMap((f) => lesArkivFil(path.join(dir, f)))
      .sort((a, b) => a.arkivert.localeCompare(b.arkivert) || a.id - b.id);
  };

  // One operation at a time in this process; the dev file adds a lock across
  // processes and re-reads kv, so two dev servers see each other's writes.
  let kø: Promise<unknown> = Promise.resolve();
  const serie = <T>(fn: () => T | Promise<T>): Promise<T> => {
    const kjør = async () => {
      if (!file) return fn();
      return filLås(file, async () => {
        last();
        return fn();
      });
    };
    const p = kø.then(kjør);
    kø = p.catch(() => {});
    return p;
  };
  last();

  return {
    reset() {
      kv = new Map();
      arkiver = [];
      sessions = new Map();
      hits = new Map();
      save();
    },
    getState: () => serie(() => Object.fromEntries(kv)),
    putState: (key, value, replace = false, forventet) =>
      serie(() => {
        sjekkVersjon(forventet, kv.get(VERSION_KEY), kv.get(RESET_KEY));
        const stored = replace ? value : mergeValue(key, kv.get(key), value);
        kv.set(key, stored);
        if (replace) kv.set(VERSION_KEY, Number(kv.get(VERSION_KEY) ?? 0) + 1);
        save();
        return stored;
      }),
    getSession: (hash) => serie(() => sessions.get(hash) ?? null),
    setSession: (hash, s) =>
      serie(() => {
        for (const [h, o] of sessions)
          if (o.expires < Date.now()) sessions.delete(h);
        sessions.set(hash, s);
        save();
      }),
    deleteSession: (hash) =>
      serie(() => {
        sessions.delete(hash);
        save();
      }),
    consumeTicket: (hash, path) =>
      serie(() => {
        const key = `upload-ticket:${hash}`;
        const t = kv.get(key);
        kv.delete(key);
        save();
        return ticketOk(t, path);
      }),
    låst: (fn) =>
      serie(() =>
        fn({
          state: structuredClone(Object.fromEntries(kv)),
          arkiv: async (sesong) => structuredClone(alleArkiv(sesong)),
          async leggTil(sesong, grunn, data) {
            const forrige = Math.max(0, ...alleArkiv().map((a) => a.id));
            const a: Arkiv = {
              id: dir ? Math.max(Date.now(), forrige + 1) : forrige + 1,
              sesong,
              grunn,
              arkivert: new Date().toISOString(),
              data: structuredClone(data),
            };
            if (dir)
              skrivAtomisk(
                arkivFil(sesong),
                JSON.stringify([...alleArkiv(sesong), a], null, 1),
              );
            else arkiver.push(a);
            return structuredClone(a);
          },
          async skriv(verdier) {
            for (const [k, v] of Object.entries(verdier)) kv.set(k, v);
            save();
          },
        }),
      ),
    arkiv: (sesong) => serie(() => structuredClone(alleArkiv(sesong))),
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

/** Written via tmp + rename so a crash never leaves half a file. */
function skrivAtomisk(file: string, text: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

/**
 * Memory store mirrored to a JSON file, so `mise run dev` keeps sessions and
 * progress across restarts. Archives go beside it as arkiv-<sesong>.json.
 */
export function createFileStore(file: string): Store & { reset(): void } {
  return createMemoryStore(file);
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

const ARKIV_KOL = "id, sesong, grunn, arkivert, data";
const arkivRad = (r: Arkiv & { arkivert: Date | string }): Arkiv => ({
  ...r,
  id: Number(r.id),
  arkivert: new Date(r.arkivert).toISOString(),
});
async function lesArkiv(
  q: Pick<Pool, "query">,
  sesong?: number,
): Promise<Arkiv[]> {
  const r =
    sesong == null
      ? await q.query(`SELECT ${ARKIV_KOL} FROM kv_arkiv ORDER BY id`)
      : await q.query(
          `SELECT ${ARKIV_KOL} FROM kv_arkiv WHERE sesong = $1 ORDER BY id`,
          [sesong],
        );
  return r.rows.map(arkivRad);
}

export function createPgStore(pool: Pool): Store {
  return {
    async getState() {
      const r = await pool.query("SELECT key, value FROM kv");
      return Object.fromEntries(r.rows.map((row) => [row.key, row.value]));
    },
    async putState(key, value, replace = false, forventet) {
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
        await c.query("SET LOCAL lock_timeout = '5s'");
        await c.query("SELECT pg_advisory_xact_lock_shared($1)", [LOCK_ID]);
        if (forventet !== undefined) {
          // FOR UPDATE on the version row: a reset or restore that bumps it
          // either finished before (we see it) or waits for this write.
          const r = await c.query(
            "SELECT key, value FROM kv WHERE key IN ($1, $2) FOR UPDATE",
            [VERSION_KEY, RESET_KEY],
          );
          const m = Object.fromEntries(r.rows.map((x) => [x.key, x.value]));
          sjekkVersjon(forventet, m[VERSION_KEY], m[RESET_KEY]);
        }
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
    async låst(fn) {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        // Two pods changing season at once: the second waits, then sees the
        // first one's stamp. putState holds the shared lock, so no write
        // lands between the snapshot and the clear; GETs still read.
        await c.query("SET LOCAL lock_timeout = '5s'");
        await c.query("SELECT pg_advisory_xact_lock($1)", [LOCK_ID]);
        const kv = await c.query("SELECT key, value FROM kv");
        const svar = await fn({
          state: Object.fromEntries(kv.rows.map((r) => [r.key, r.value])),
          arkiv: (sesong) => lesArkiv(c, sesong),
          async leggTil(sesong, grunn, data) {
            const r = await c.query(
              `INSERT INTO kv_arkiv (sesong, grunn, data) VALUES ($1, $2, $3) RETURNING ${ARKIV_KOL}`,
              [sesong, grunn, JSON.stringify(data)],
            );
            return arkivRad(r.rows[0]);
          },
          async skriv(verdier) {
            for (const [k, v] of Object.entries(verdier))
              await c.query(
                `INSERT INTO kv (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
                [k, JSON.stringify(v ?? null)],
              );
          },
        });
        await c.query("COMMIT");
        return svar;
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    arkiv: (sesong) => lesArkiv(pool, sesong),
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

/** Every key a season reset clears. */
const tøm = (state: Record<string, unknown>) => {
  const v = Number(state[VERSION_KEY] ?? 0) + 1;
  // The new version makes screens re-fetch instead of pushing old lists
  // back; RESET_KEY tells them the 409 was a reset, so they drop pending writes.
  return {
    ...Object.fromEntries(
      [...STATE_KEYS, ...SERVER_KEYS].map((k) => [k, null]),
    ),
    [VERSION_KEY]: v,
    [RESET_KEY]: v,
  };
};

/** Top-level keys sorted, so key order never makes two equal states differ. */
const nøkkelSortert = (d: Record<string, unknown>) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(d).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

/**
 * A fresh snapshot of the state under the lock, unless it is identical to the
 * season's newest one (then that one). Null when there is nothing to keep.
 */
async function øyeblikk(tx: Tx, sesong: number, grunn: string) {
  const data = arkivData(tx.state);
  if (!Object.keys(data).length) return null;
  const siste = (await tx.arkiv(sesong)).at(-1);
  if (siste && nøkkelSortert(siste.data) === nøkkelSortert(data)) return siste;
  return tx.leggTil(sesong, grunn, data);
}

/** A manual snapshot (same dedupe as before a reset). */
export function arkiver(
  grunn: string,
  sesong = SEASON,
  store: Store = getStore(),
): Promise<Arkiv | null> {
  return store.låst((tx) => øyeblikk(tx, sesong, grunn));
}

/** Season reset without a snapshot (MCP reset, tests). Sessions stay. */
export function resetState(store: Store = getStore()): Promise<void> {
  return store.låst((tx) => tx.skriv(tøm(tx.state)));
}

/**
 * Season reset with the archive first, in one locked step: no snapshot, no
 * reset (a failed archive throws before anything is cleared).
 */
export async function arkiverOgNullstill(
  grunn: string,
  sesong = SEASON,
  store: Store = getStore(),
): Promise<Arkiv | null> {
  return store.låst(async (tx) => {
    const a = await øyeblikk(tx, sesong, grunn);
    logg(sesong, grunn, a);
    await tx.skriv(tøm(tx.state));
    return a;
  });
}

const logg = (sesong: number, grunn: string, a: Arkiv | null) =>
  console.log(
    `Sesong ${sesong}: ${grunn}, ${a ? `arkiv #${a.id} ${a.arkivert} (${Object.keys(a.data).length} nøkler)` : "ingenting å arkivere"}, nullstiller`,
  );

/**
 * Restores every key of snapshot `id`, codes included, after a fresh
 * snapshot of today's state (grunn «før-gjenoppretting»), so the restore can
 * itself be undone. The state is stamped as this season. Null: no such id.
 */
export async function gjenopprett(
  id: number,
  store: Store = getStore(),
): Promise<{ fra: Arkiv; før: Arkiv | null } | null> {
  return store.låst(async (tx) => {
    const fra = (await tx.arkiv()).find((a) => a.id === id);
    if (!fra) return null;
    const før = await øyeblikk(tx, SEASON, "før-gjenoppretting");
    await tx.skriv({
      ...tøm(tx.state),
      ...arkivData(fra.data),
      [SEASON_KEY]: SEASON,
    });
    console.log(
      `Gjenopprettet arkiv #${id} (sesong ${fra.sesong}, ${fra.arkivert}); før: #${før?.id ?? "-"}`,
    );
    return { fra, før };
  });
}

let sesongSjekk: Promise<void> | undefined;
/**
 * Runs before state is served. A stored season older than SEASON means a new
 * build started a new season: archive, clear and stamp in one locked step,
 * the marker read under the same lock, so a second process sees the stamp
 * and does nothing. No marker yet means the state is this season's (servers
 * from before the marker existed): just stamp it.
 */
export function sjekkSesong(store: Store = getStore()): Promise<void> {
  return (sesongSjekk ??= store
    .låst(async (tx) => {
      const s = tx.state[SEASON_KEY];
      if (s === SEASON) return;
      if (typeof s === "number" && s > SEASON) return;
      let ny: Record<string, unknown> = {};
      if (typeof s === "number") {
        const a = await øyeblikk(tx, s, "sesongskifte");
        logg(s, "sesongskifte", a);
        ny = tøm(tx.state);
      }
      await tx.skriv({ ...ny, [SEASON_KEY]: SEASON });
    })
    .catch((e) => {
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

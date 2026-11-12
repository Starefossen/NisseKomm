/**
 * Storage Adapter Layer
 *
 * Provides pluggable storage backends for StorageManager.
 * ServerSyncAdapter caches /api/state in localStorage and pushes writes back.
 *
 * Usage in StorageManager:
 * ```typescript
 * const adapter = createStorageAdapter();
 * adapter.set('key', value);
 * const value = adapter.get('key', defaultValue);
 * ```
 */

/**
 * Storage Adapter Interface
 * All storage backends must implement these methods
 * Note: Interface is synchronous to maintain compatibility with existing StorageManager API
 */
export interface StorageAdapter {
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  has(key: string): boolean;
  /** propagate: also clear the shared server state (a reset) */
  clear(propagate?: boolean): void | Promise<void>;
}

/**
 * LocalStorage Adapter
 * Direct synchronous wrapper around browser localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to read ${key}:`, error);
      }
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to write ${key}:`, error);
      }
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`LocalStorageAdapter: Failed to remove ${key}:`, error);
      }
    }
  }

  has(key: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("LocalStorageAdapter: Failed to clear:", error);
      }
    }
  }
}

/** Keys shared between screens through /api/state (fase5-plan §2). */
export const SYNCED_KEYS = new Set([
  "nissekomm-codes",
  "nissekomm-julius-watched",
  "nissekomm-bonusoppdrag-completed",
  "nissekomm-earned-badges",
  "nissekomm-santa-letters",
  "nissekomm-frost-off-day",
  "nissekomm-intros-seen",
  "nissekomm-slede",
  "nissekomm-collected-symbols",
  "nissekomm-solved-decryptions",
  "nissekomm-unlocked-files",
  "nissekomm-topic-unlocks",
  "nissekomm-player-names",
  "nissekomm-viewed-emails",
  "nissekomm-viewed-bonusoppdrag-emails",
  "nissekomm-eventyr",
  "nissekomm-failed-attempts",
  "nissekomm-foreldre-avkrysning",
]);
/** Solved codes: written on the server by /api/kode, read here. */
const CODES_KEY = "nissekomm-codes";
/** Written by MCP (set_frost, skip_day); clients only read them. */
export const SERVER_KEYS = ["frost-override", "day-offset"];
/** Bumped by every replacing write; an older client must re-fetch. */
export const VERSION_KEY = "state-version";
/** Set by a season reset (DELETE /api/state); only a new value may drop local writes. */
export const RESET_KEY = "state-reset";

const json = (x: unknown) => JSON.stringify(x);
const isObj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
/**
 * True when `next` drops a list item or an object key `prev` had, so a server
 * merge would undo it. Nested values don't count: a game save drops inventory
 * items all the time, and every replace makes other screens' next write 409.
 */
const shrinks = (prev: unknown, next: unknown) =>
  Array.isArray(prev)
    ? !Array.isArray(next) ||
      prev.some((x) => !next.some((y) => json(y) === json(x)))
    : isObj(prev) &&
      (!isObj(next) || Object.keys(prev).some((k) => !(k in next)));

type Pending = { value: unknown; replace: boolean };

/** Local-only list of synced keys written while the server was unreachable. */
const UNSYNCED_KEY = "nissekomm-unsynced";
/** Local-only: the reset marker this screen last saw. */
const RESET_SEEN_KEY = "nissekomm-state-reset-seen";

/**
 * localStorage as a synchronous cache of the server state. Plain
 * localStorage until start() has fetched the state, and stays that way when
 * the server has sync off (STORAGE_BACKEND=localStorage answers 204).
 */
export class ServerSyncAdapter extends LocalStorageAdapter {
  private live = false;
  private version = 0;
  private reset: unknown = null;
  private pending = new Map<string, Pending>();
  private timer?: ReturnType<typeof setTimeout>;
  private flushing = false;
  private retryMs = 1000;
  private onChange: () => void = () => {};
  private startRetry?: ReturnType<typeof setTimeout>;

  async start(onChange?: () => void): Promise<void> {
    if (onChange) this.onChange = onChange;
    if (this.live) {
      await this.pull();
      return;
    }
    // Progress made offline must not be overwritten by the first pull.
    const offline = this.unsynced().map(
      (k) => [k, super.get<unknown>(k, null)] as const,
    );
    const seen = super.get<unknown>(RESET_SEEN_KEY, null);
    clearTimeout(this.startRetry);
    try {
      this.live = await this.pull();
    } catch (e) {
      // Server down at boot: keep playing locally and try again later.
      this.startRetry = setTimeout(() => void this.start(), 30_000);
      throw e;
    }
    if (!this.live) return;
    // Season reset elsewhere since: the server wins.
    if (json(this.reset) !== json(seen)) {
      this.markUnsynced(this.unsynced(), false);
      offline.length = 0;
    }
    for (const [k, v] of offline) if (v != null) this.queue(k, v, false);
    const poll = () => {
      if (!this.pending.size && !this.flushing) {
        this.pull().catch(() => {});
      }
    };
    // ponytail: 30 s polling; push (SSE) if screens must react faster.
    setInterval(poll, 30_000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") poll();
    });
  }

  /** Replaces the cached shared keys with the server's. False if sync is off. */
  async pull(): Promise<boolean> {
    const res = await fetch("/api/state", { credentials: "same-origin" });
    if (res.status !== 200) return false;
    const state = (await res.json()) as Record<string, unknown>;
    for (const k of [...SYNCED_KEYS, ...SERVER_KEYS]) {
      if (state[k] == null) super.remove(k);
      else super.set(k, state[k]);
    }
    const v = state[VERSION_KEY];
    this.version = typeof v === "number" ? v : 0;
    this.reset = state[RESET_KEY] ?? null;
    super.set(RESET_SEEN_KEY, this.reset);
    this.onChange();
    return true;
  }

  set<T>(key: string, value: T): void {
    const prev = this.get<unknown>(key, null);
    super.set(key, value);
    this.queue(key, value, shrinks(prev, value));
  }

  remove(key: string): void {
    super.remove(key);
    this.queue(key, null, true);
  }

  /** With propagate, the server clears the whole family's state (parent only). */
  async clear(propagate = false): Promise<void> {
    clearTimeout(this.timer);
    this.pending.clear();
    super.clear();
    if (!propagate) return;
    const res = await fetch("/api/state", {
      method: "DELETE",
      credentials: "same-origin",
      keepalive: true,
    });
    if (!res.ok) throw new Error(`Nullstilling feilet (${res.status})`);
    if (this.live) await this.pull();
  }

  private unsynced(): string[] {
    return super.get<string[]>(UNSYNCED_KEY, []);
  }

  private markUnsynced(keys: string[], dirty: boolean) {
    const set = new Set(this.unsynced());
    for (const k of keys) {
      if (dirty) set.add(k);
      else set.delete(k);
    }
    if (set.size) super.set(UNSYNCED_KEY, [...set]);
    else super.remove(UNSYNCED_KEY);
  }

  private queue(key: string, value: unknown, replace: boolean) {
    if (!SYNCED_KEYS.has(key)) return;
    // The server writes solves itself (POST /api/kode); clients only clear them.
    if (key === CODES_KEY && value != null) return;
    if (!this.live) {
      // Not removals: the season wipe runs before start() and stays local.
      if (value != null) this.markUnsynced([key], true);
      return;
    }
    const replaced = this.pending.get(key)?.replace ?? false;
    this.pending.set(key, { value, replace: replace || replaced });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 300);
  }

  /** One PUT at a time, so each carries the version the previous returned. */
  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    let retry = false;
    try {
      for (const [key, p] of this.pending) {
        let res: Response;
        try {
          res = await fetch("/api/state", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, ...p, version: this.version }),
          });
        } catch {
          retry = true;
          break;
        }
        // 400, or 403 on the codes (a kid clearing them): this key was refused; drop
        // only it, the server's value wins.
        if (res.status === 400 || (res.status === 403 && key === CODES_KEY)) {
          if (this.pending.get(key) === p) {
            this.pending.delete(key);
            this.markUnsynced([key], false);
          }
          await this.pull().catch(() => {});
          continue;
        }
        // 409: a season reset drops local writes; any other replacing
        // write elsewhere just means a newer version, so send again.
        if (res.status === 409) {
          const c = (await res.json()) as { version: number; reset?: unknown };
          if (json(c.reset ?? null) !== json(this.reset)) {
            this.markUnsynced([...this.pending.keys()], false);
            this.pending.clear();
            await this.pull().catch(() => {});
            return;
          }
          this.version = c.version;
          break;
        }
        if (!res.ok) {
          retry = true;
          break;
        }
        const body = (await res.json()) as { value: unknown; version: number };
        this.version = body.version;
        if (this.pending.get(key) === p) {
          this.pending.delete(key);
          this.markUnsynced([key], false);
          if (body.value == null) super.remove(key);
          else super.set(key, body.value);
        }
      }
      this.retryMs = 1000;
    } catch {
      // A proxy's HTML error page instead of JSON: retry, never stall sync.
      retry = true;
    } finally {
      this.flushing = false;
    }
    if (retry) {
      // Survives a reload while the server is down.
      this.markUnsynced([...this.pending.keys()], true);
      this.timer = setTimeout(() => void this.flush(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 30_000);
    } else if (this.pending.size) {
      this.timer = setTimeout(() => void this.flush(), 300);
    }
    this.onChange();
  }
}

export function createStorageAdapter(): StorageAdapter {
  return new ServerSyncAdapter();
}

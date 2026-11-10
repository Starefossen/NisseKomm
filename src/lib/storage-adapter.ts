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
  clear(propagate?: boolean): void;
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
/** Written by MCP (set_frost, skip_day); clients only read them. */
export const SERVER_KEYS = ["frost-override", "day-offset"];
/** Bumped by every replacing write; an older client must re-fetch. */
export const VERSION_KEY = "state-version";

const json = (x: unknown) => JSON.stringify(x);
/** True when `next` drops something `prev` had, so a server merge would undo it. */
const shrinks = (prev: unknown, next: unknown) =>
  Array.isArray(prev) &&
  (!Array.isArray(next) ||
    prev.some((x) => !next.some((y) => json(y) === json(x))));

type Pending = { value: unknown; replace: boolean };

/**
 * localStorage as a synchronous cache of the server state. Plain
 * localStorage until start() has fetched the state, and stays that way when
 * the server has sync off (STORAGE_BACKEND=localStorage answers 404).
 */
export class ServerSyncAdapter extends LocalStorageAdapter {
  private live = false;
  private version = 0;
  private pending = new Map<string, Pending>();
  private timer?: ReturnType<typeof setTimeout>;
  private flushing = false;
  private retryMs = 1000;
  private onChange: () => void = () => {};

  async start(onChange?: () => void): Promise<void> {
    if (onChange) this.onChange = onChange;
    if (this.live) {
      await this.pull();
      return;
    }
    this.live = await this.pull();
    if (!this.live) return;
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
    if (!res.ok) return false;
    const state = (await res.json()) as Record<string, unknown>;
    for (const k of [...SYNCED_KEYS, ...SERVER_KEYS]) {
      if (state[k] == null) super.remove(k);
      else super.set(k, state[k]);
    }
    const v = state[VERSION_KEY];
    this.version = typeof v === "number" ? v : 0;
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

  clear(propagate = false): void {
    if (propagate) for (const k of SYNCED_KEYS) this.queue(k, null, true);
    super.clear();
  }

  private queue(key: string, value: unknown, replace: boolean) {
    if (!this.live || !SYNCED_KEYS.has(key)) return;
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
        // 409: reset or revoked elsewhere; 400: rejected (fake code). Server wins.
        if (res.status === 409 || res.status === 400) {
          this.pending.clear();
          await this.pull().catch(() => {});
          return;
        }
        if (!res.ok) {
          retry = true;
          break;
        }
        const body = (await res.json()) as { value: unknown; version: number };
        this.version = body.version;
        if (this.pending.get(key) === p) {
          this.pending.delete(key);
          if (body.value == null) super.remove(key);
          else super.set(key, body.value);
        }
      }
      this.retryMs = 1000;
    } finally {
      this.flushing = false;
    }
    if (retry) {
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

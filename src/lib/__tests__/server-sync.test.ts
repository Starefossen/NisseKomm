import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  SYNCED_KEYS,
  ServerSyncAdapter,
  VERSION_KEY,
} from "../storage-adapter";
import { GameEngine } from "../game-engine";
import { StorageManager } from "../storage";
import { getCurrentDay } from "../date-utils";

// A fake /api/state with the route's merge, replace and version rules.
// (db.ts can't load under jsdom: pg needs Node globals.)
let kv = new Map<string, unknown>();
const store = {
  reset: () => (kv = new Map()),
  getState: async () => Object.fromEntries(kv),
  putState: async (key: string, value: unknown, replace = false) => {
    const old = kv.get(key);
    const v =
      !replace && Array.isArray(old) && Array.isArray(value)
        ? [...new Set([...old, ...value])]
        : value;
    kv.set(key, v);
    if (replace) kv.set(VERSION_KEY, Number(kv.get(VERSION_KEY) ?? 0) + 1);
    return v;
  },
};
async function fakeFetch(_url: unknown, init?: RequestInit) {
  const reply = (status: number, body: unknown) =>
    ({ ok: status < 300, status, json: async () => body }) as Response;
  if (init?.method === "DELETE") {
    for (const k of SYNCED_KEYS) await store.putState(k, null, true);
    return reply(200, { reset: true });
  }
  if (init?.method !== "PUT") return reply(200, await store.getState());
  const { key, value, replace, version } = JSON.parse(String(init.body));
  const current = Number((await store.getState())[VERSION_KEY] ?? 0);
  if (version < current) return reply(409, { version: current });
  const stored = await store.putState(key, value, replace);
  return reply(200, {
    value: stored,
    version: replace ? current + 1 : current,
  });
}

const KEY = "nissekomm-julius-watched";
// Skips the 300 ms debounce. Both adapters share jsdom's localStorage,
// so each test checks the server, not the other screen's cache.
const flush = (a: ServerSyncAdapter) => a.flush();

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  store.reset();
  global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
});

describe("ServerSyncAdapter", () => {
  it("seeds localStorage from the server and pushes writes back", async () => {
    await store.putState(KEY, [1]);
    const a = new ServerSyncAdapter();
    await a.start();
    expect(a.get(KEY, [])).toEqual([1]);
    a.set(KEY, [1, 2]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1, 2]);
  });

  it("propagates a removal and a stale screen re-fetches", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(KEY, [1, 2]);
    await flush(a);

    // Reset from the guide (or MCP reset) on another screen
    await store.putState(KEY, null, true);

    // b still holds the old version: its write is refused and it re-fetches
    b.set(KEY, [1, 2, 3]);
    await flush(b);
    expect((await store.getState())[KEY]).toBeNull();
    expect(b.get(KEY, "tom")).toBe("tom");

    // A shrinking write is sent as replace
    b.set(KEY, [5, 6]);
    await flush(b);
    b.set(KEY, [6]);
    await flush(b);
    expect((await store.getState())[KEY]).toEqual([6]);
  });

  it("a reset on one screen empties another screen with stale data", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(KEY, [1, 2]);
    await flush(a);
    const seen = localStorage.getItem("nissekomm-state-version-seen");

    await a.clear(true);
    expect((await store.getState())[KEY]).toBeNull();

    // b reloads holding old progress it never managed to push
    localStorage.setItem(KEY, JSON.stringify([1, 2, 3]));
    localStorage.setItem("nissekomm-unsynced", JSON.stringify([KEY]));
    localStorage.setItem("nissekomm-state-version-seen", seen!);
    const b2 = new ServerSyncAdapter();
    await b2.start();
    await jest.advanceTimersByTimeAsync(1000);
    expect((await store.getState())[KEY]).toBeNull();
    expect(b2.get(KEY, "tom")).toBe("tom");
    expect(localStorage.getItem("nissekomm-unsynced")).toBeNull();

    // the old b, still open, is refused and re-fetches
    b.set(KEY, [1, 2, 3]);
    await flush(b);
    expect((await store.getState())[KEY]).toBeNull();
    expect(b.get(KEY, "tom")).toBe("tom");
  });

  it("keeps progress made while the server was down", async () => {
    await store.putState(KEY, [1]);
    global.fetch = jest.fn(async () => {
      throw new Error("nede");
    }) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await expect(a.start()).rejects.toThrow();
    a.set(KEY, [2]);

    // Server back: the retry pulls, then pushes the offline write
    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    await jest.advanceTimersByTimeAsync(30_000);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1, 2]);
    expect(localStorage.getItem("nissekomm-unsynced")).toBeNull();
  });

  it("stays local when the server has sync off", async () => {
    global.fetch = jest.fn(
      async () => ({ ok: true, status: 204 }) as Response,
    ) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await a.start();
    a.set(KEY, [1]);
    jest.runOnlyPendingTimers();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(a.get(KEY, [])).toEqual([1]);
  });
});

describe("frost-override from the server", () => {
  it("turns frost on outside a frost day and off on one", async () => {
    jest.setSystemTime(new Date(2026, 11, 3, 10, 0));
    await store.putState("frost-override", {
      active: true,
      until: "2026-12-03T20:00",
    });
    await StorageManager.sync();
    expect(GameEngine.getFrostMode().level).toBe(1);

    // Expired override: day 10 is frost as usual
    jest.setSystemTime(new Date(2026, 11, 10, 10, 0));
    expect(GameEngine.getFrostMode().level).toBe(1);

    await store.putState("frost-override", {
      active: false,
      until: "2026-12-10T20:00",
    });
    await StorageManager.sync();
    expect(GameEngine.getFrostMode().level).toBe(0);

    await store.putState("day-offset", 1);
    await StorageManager.sync();
    expect(getCurrentDay()).toBe(11);
  });
});

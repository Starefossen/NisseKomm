import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  RESET_KEY,
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
    kv.set(RESET_KEY, kv.get(VERSION_KEY));
    return reply(200, { reset: true });
  }
  if (init?.method !== "PUT") return reply(200, await store.getState());
  const { key, value, replace, version } = JSON.parse(String(init.body));
  const current = Number((await store.getState())[VERSION_KEY] ?? 0);
  if (version < current)
    return reply(409, { version: current, reset: kv.get(RESET_KEY) ?? null });
  if (key === "nissekomm-codes") return reply(400, { error: "Ugyldig kode" });
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
    await fakeFetch("", { method: "DELETE" });

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

  it("dropping an object key is sent as replace", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    a.set("nissekomm-slede", { tundra: 1, muren: 2 });
    await flush(a);
    const v = Number((await store.getState())[VERSION_KEY] ?? 0);
    a.set("nissekomm-slede", { tundra: 1 });
    await flush(a);
    expect((await store.getState())[VERSION_KEY]).toBe(v + 1);
  });

  it("a reset on one screen empties another screen with stale data", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(KEY, [1, 2]);
    await flush(a);
    const seen = localStorage.getItem("nissekomm-state-reset-seen");

    await a.clear(true);
    expect((await store.getState())[KEY]).toBeNull();

    // b reloads holding old progress it never managed to push
    localStorage.setItem(KEY, JSON.stringify([1, 2, 3]));
    localStorage.setItem("nissekomm-unsynced", JSON.stringify([KEY]));
    localStorage.setItem("nissekomm-state-reset-seen", seen!);
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

  it("a replacing write elsewhere (409, no reset) keeps pending writes", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set("nissekomm-slede", { tundra: 1, muren: 2 });
    await flush(a);
    a.set("nissekomm-slede", { tundra: 1 }); // shrink: bumps the version
    await flush(a);

    b.set(KEY, [7]);
    await flush(b); // 409, not a reset: b sends again
    await jest.advanceTimersByTimeAsync(1000);
    expect((await store.getState())[KEY]).toEqual([7]);
  });

  it("a rejected key does not drop the other pending keys", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    a.set("nissekomm-codes", [{ kode: "FALSK", day: 1 }]);
    a.set(KEY, [7]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([7]);
    expect((await store.getState())["nissekomm-codes"]).toBeUndefined();
  });

  it("a 403 drops only a codes clear; any other 403 keeps retrying", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    const puts: string[] = [];
    let nekt = true;
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT") return fakeFetch(url, init);
      const { key } = JSON.parse(String(init.body));
      puts.push(key);
      // The kids may not clear the codes; an Origin/Host mismatch hits any key.
      if (key === "nissekomm-codes" || nekt)
        return { ok: false, status: 403, json: async () => ({}) } as Response;
      return fakeFetch(url, init);
    }) as unknown as typeof fetch;
    a.remove("nissekomm-codes");
    a.set(KEY, [5]);
    await flush(a);
    expect((await store.getState())[KEY]).toBeUndefined();
    nekt = false;
    await jest.advanceTimersByTimeAsync(5000);
    expect((await store.getState())[KEY]).toEqual([5]);
    expect(puts.filter((k) => k === "nissekomm-codes")).toHaveLength(1);
  });

  it("retries after a non-JSON reply instead of stalling", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("<html>");
      },
    })) as unknown as typeof fetch;
    a.set(KEY, [3]);
    await flush(a);
    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    await jest.advanceTimersByTimeAsync(1000);
    expect((await store.getState())[KEY]).toEqual([3]);
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

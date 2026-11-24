import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  RESET_KEY,
  SYNCED_KEYS,
  ServerSyncAdapter,
  VERSION_KEY,
  getSyncStatus,
  setSyncStatus,
} from "../storage-adapter";
import { GameEngine } from "../game-engine";
import { mergeValue } from "../state-merge";
import { StorageManager } from "../storage";
import { getCurrentDay } from "../date-utils";

// A fake /api/state with the route's replace and version rules and the
// server's own merge (state-merge.ts; db.ts can't load under jsdom: pg).
let kv = new Map<string, unknown>();
const store = {
  reset: () => (kv = new Map()),
  getState: async () => Object.fromEntries(kv),
  putState: async (key: string, value: unknown, replace = false) => {
    const v = replace ? value : mergeValue(key, kv.get(key), value);
    kv.set(key, v);
    kv.set(VERSION_KEY, Number(kv.get(VERSION_KEY) ?? 0) + 1);
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
    version: current + 1,
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
  setSyncStatus("ok");
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

  it("a 409 never brings back what the other screen removed", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(KEY, [1, 2]);
    await flush(a);
    a.set(KEY, [1]); // removal: replace, bumps the version
    await flush(a);

    // b has not pulled since: its cache still holds the removed item
    localStorage.setItem(KEY, JSON.stringify([1, 2]));
    b.set(KEY, [1, 2, 3]);
    await flush(b);
    await jest.advanceTimersByTimeAsync(1000);
    expect((await store.getState())[KEY]).toEqual([1, 3]);
    expect(b.get(KEY, [])).toEqual([1, 3]);
  });

  it("a stale untick after a 409 keeps the other parent's tick", async () => {
    const LISTER = "nissekomm-foreldre-avkrysning";
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(LISTER, { kveld: ["x", "y"] });
    await flush(a);
    const gammel = localStorage.getItem(LISTER)!;
    a.set(LISTER, { kveld: ["x", "y"], handel: ["z"] });
    a.set("nissekomm-slede", { tundra: 1, muren: 2 });
    await flush(a);
    a.set("nissekomm-slede", { tundra: 1 }); // any replace bumps the version
    await flush(a);

    localStorage.setItem(LISTER, gammel);
    b.set(LISTER, { kveld: ["y"] });
    await flush(b);
    await jest.advanceTimersByTimeAsync(1000);
    expect((await store.getState())[LISTER]).toEqual({
      kveld: ["y"],
      handel: ["z"],
    });
  });

  it("an untick made while the server was down survives a reload", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    a.set(KEY, [1, 2]);
    await flush(a);
    const ok = global.fetch;
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (init?.method === "PUT") throw new Error("nede");
      return fakeFetch(url, init);
    }) as unknown as typeof fetch;
    a.set(KEY, [1]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1, 2]);

    // Reload: a new adapter, the server is back, another screen added 3
    global.fetch = ok;
    await store.putState(KEY, [3]);
    const a2 = new ServerSyncAdapter();
    await a2.start();
    await flush(a2);
    expect((await store.getState())[KEY]).toEqual([1, 3]);
    expect(localStorage.getItem("nissekomm-unsynced")).toBeNull();
    // The old page is gone: its listeners must not send in later tests.
    await a.clear();
  });

  it("a removal made before the first pull reaches the server", async () => {
    await store.putState(KEY, [1]);
    localStorage.setItem(KEY, JSON.stringify([1]));
    global.fetch = jest.fn(async () => {
      throw new Error("nede");
    }) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await expect(a.start()).rejects.toThrow();
    a.remove(KEY);

    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    await jest.advanceTimersByTimeAsync(30_000);
    await flush(a);
    expect((await store.getState())[KEY]).toBeNull();
  });

  it("a stale lower sled run never wipes another screen's record", async () => {
    const SLEDE = "nissekomm-slede";
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(SLEDE, { tundra: { poeng: 100, bjeller: 1 } });
    await flush(a);
    const gammel = localStorage.getItem(SLEDE)!;
    a.set(SLEDE, { tundra: { poeng: 900, bjeller: 3, utfordringDag: 8 } });
    await flush(a);
    a.set(KEY, [1, 2]);
    await flush(a);
    a.set(KEY, [1]); // any replace bumps the version
    await flush(a);

    localStorage.setItem(SLEDE, gammel);
    b.set(SLEDE, { tundra: { poeng: 300, bjeller: 2 } });
    await flush(b);
    await jest.advanceTimersByTimeAsync(3000);
    expect((await store.getState())[SLEDE]).toEqual({
      tundra: { poeng: 900, bjeller: 3, utfordringDag: 8 },
    });
  });

  it("a pull while a write waits rebases it like a 409 would", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(KEY, [1, 2]);
    await flush(a);
    a.set(KEY, [1]);
    await flush(a);

    localStorage.setItem(KEY, JSON.stringify([1, 2]));
    b.set(KEY, [1, 2, 3]);
    await b.pull(); // the 30 s poll or a focus, before the debounce fires
    await flush(b);
    await jest.advanceTimersByTimeAsync(3000);
    expect((await store.getState())[KEY]).toEqual([1, 3]);
  });

  it("a pull that sees a reset drops the waiting write", async () => {
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    b.set(KEY, [1, 2]);
    await a.clear(true);
    await b.pull();
    await flush(b);
    await jest.advanceTimersByTimeAsync(3000);
    expect((await store.getState())[KEY]).toBeNull();
    expect(b.get(KEY, "tom")).toBe("tom");
  });

  it("an offline write survives a second reload before it is sent", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("nede");
    }) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await expect(a.start()).rejects.toThrow();
    a.set(KEY, [2]);

    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    const a2 = new ServerSyncAdapter();
    await a2.start(); // queued, and the page closes before the PUT
    const a3 = new ServerSyncAdapter();
    await a3.start();
    await flush(a3);
    expect((await store.getState())[KEY]).toEqual([2]);
    // The closed pages' listeners must not send in later tests.
    jest.clearAllTimers();
    await a2.clear();
  });

  it("a write made while the first pull is out is kept and sent", async () => {
    let slipp!: () => void;
    const venter = new Promise<void>((r) => (slipp = r));
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (!init?.method) await venter;
      return fakeFetch(url, init);
    }) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    const start = a.start();
    a.set(KEY, [5]);
    slipp();
    await start;
    expect(a.get(KEY, [])).toEqual([5]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([5]);
  });

  it("repeated 409s back off instead of hammering the server", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    let puts = 0;
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT") return fakeFetch(url, init);
      puts++;
      return {
        ok: false,
        status: 409,
        json: async () => ({ version: 99, reset: null }),
      } as Response;
    }) as unknown as typeof fetch;
    a.set(KEY, [1]);
    await jest.advanceTimersByTimeAsync(10_000);
    expect(puts).toBeLessThan(8);
    await a.clear();
  });

  it("a pull answered after a newer write is not applied", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    // The GET reads the state when it is sent, and answers late.
    let slipp!: () => void;
    const venter = new Promise<void>((r) => (slipp = r));
    const ok = global.fetch;
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      const svar = await fakeFetch(url, init);
      if (!init?.method) await venter;
      return svar;
    }) as unknown as typeof fetch;
    const sen = a.pull();
    a.set(KEY, [1]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1]);
    slipp();
    await sen;
    global.fetch = ok;
    expect(a.get(KEY, [])).toEqual([1]);
    // And the version did not go back: the next write needs no 409 round.
    a.set(KEY, [1, 2]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1, 2]);
  });

  it("an untick on a copy that misses another parent's tick keeps that tick", async () => {
    const LISTER = "nissekomm-foreldre-avkrysning";
    const a = new ServerSyncAdapter();
    const b = new ServerSyncAdapter();
    await a.start();
    await b.start();
    a.set(LISTER, { kveld: ["x", "y"] });
    await flush(a);
    await b.pull();
    const gammel = localStorage.getItem(LISTER)!;
    a.set(LISTER, { kveld: ["x", "y"], handel: ["z"] }); // a merge, no replace
    await flush(a);

    localStorage.setItem(LISTER, gammel);
    b.set(LISTER, { kveld: ["y"] });
    await flush(b);
    await jest.advanceTimersByTimeAsync(3000);
    expect((await store.getState())[LISTER]).toEqual({
      kveld: ["y"],
      handel: ["z"],
    });
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

  it("syncs a season of letters (72 × ~19 KB) in one key", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    const brev = Array.from({ length: 72 }, (_, i) => ({
      day: (i % 24) + 1,
      from: ["Kristian", "Håkon", "Hanna"][i % 3],
      content: "Kjære Julius! ".repeat(18),
    }));
    expect(JSON.stringify(brev).length).toBeGreaterThan(19_000);
    a.set("nissekomm-santa-letters", brev);
    await flush(a);
    expect((await store.getState())["nissekomm-santa-letters"]).toHaveLength(
      72,
    );
  });

  it("a 413 on one key drops only it; the others sync and polling goes on", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    const puts: string[] = [];
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT") return fakeFetch(url, init);
      const { key } = JSON.parse(String(init.body));
      puts.push(key);
      if (key === "nissekomm-santa-letters")
        return { ok: false, status: 413, json: async () => ({}) } as Response;
      return fakeFetch(url, init);
    }) as unknown as typeof fetch;
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    a.set("nissekomm-santa-letters", [{ day: 1, content: "x" }]);
    a.set(KEY, [9]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([9]);
    await jest.advanceTimersByTimeAsync(5000);
    expect(puts.filter((k) => k === "nissekomm-santa-letters")).toHaveLength(1);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("a pull keeps a pending local write", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    await store.putState(KEY, [1]);
    a.set(KEY, [1, 2]);
    await a.pull();
    expect(a.get(KEY, [])).toEqual([1, 2]);
    await flush(a);
    expect((await store.getState())[KEY]).toEqual([1, 2]);
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

  it("a 403 on a parent-only key is final (kid session), not retried", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    let puts = 0;
    global.fetch = jest.fn(async (url: unknown, init?: RequestInit) => {
      if (init?.method !== "PUT") return fakeFetch(url, init);
      puts++;
      return { ok: false, status: 403, json: async () => ({}) } as Response;
    }) as unknown as typeof fetch;
    a.set("nissekomm-handlet", { melk: "kjopt" });
    await flush(a);
    await jest.advanceTimersByTimeAsync(5000);
    expect(puts).toBe(1);
    expect(a.get("nissekomm-handlet", null)).toBeNull();
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

describe("dead session and 5xx at startup", () => {
  it("a 503 at startup retries with backoff and goes live when the server answers", async () => {
    await store.putState(KEY, [1]);
    global.fetch = jest.fn(
      async () => ({ ok: false, status: 503 }) as Response,
    ) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await expect(a.start()).rejects.toThrow();
    expect(getSyncStatus()).toBe("frakoblet");
    await jest.advanceTimersByTimeAsync(2000); // second try, still 503
    expect(global.fetch).toHaveBeenCalledTimes(2);
    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    await jest.advanceTimersByTimeAsync(4000);
    expect(getSyncStatus()).toBe("ok");
    expect(a.get(KEY, [])).toEqual([1]);
  });

  it("backoff stops growing at 60 s", async () => {
    global.fetch = jest.fn(
      async () => ({ ok: false, status: 500 }) as Response,
    ) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await expect(a.start()).rejects.toThrow();
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    const n = (global.fetch as jest.Mock).mock.calls.length;
    await jest.advanceTimersByTimeAsync(60_000);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(n + 1);
  });

  it("a 401 marks the session gone, keeps the cache, and syncs after login", async () => {
    localStorage.setItem(KEY, JSON.stringify([7]));
    global.fetch = jest.fn(
      async () => ({ ok: false, status: 401 }) as Response,
    ) as unknown as typeof fetch;
    const a = new ServerSyncAdapter();
    await a.start();
    expect(getSyncStatus()).toBe("utlogget");
    a.set(KEY, [7, 8]);
    expect(a.get(KEY, [])).toEqual([7, 8]);

    global.fetch = jest.fn(fakeFetch) as unknown as typeof fetch;
    await a.start();
    await flush(a);
    expect(getSyncStatus()).toBe("ok");
    expect((await store.getState())[KEY]).toEqual([7, 8]);
  });

  it("logged out: a session restored elsewhere is found on focus or within 60 s", async () => {
    const a = new ServerSyncAdapter();
    await a.start();
    const ok = global.fetch;
    const ut = jest.fn(async () => ({ ok: false, status: 401 }) as Response);
    global.fetch = ut as unknown as typeof fetch;
    a.set(KEY, [7]);
    await flush(a);
    expect(getSyncStatus()).toBe("utlogget");

    // Still asks, but only every 60 s.
    await jest.advanceTimersByTimeAsync(400);
    const n = ut.mock.calls.length;
    await jest.advanceTimersByTimeAsync(120_000);
    expect(ut.mock.calls.length).toBe(n + 2);
    expect(getSyncStatus()).toBe("utlogget");

    // The session is back (another tab logged in): focus pulls and flushes.
    global.fetch = ok;
    window.dispatchEvent(new Event("focus"));
    await jest.advanceTimersByTimeAsync(0);
    expect(getSyncStatus()).toBe("ok");
    await jest.advanceTimersByTimeAsync(400);
    expect((await store.getState())[KEY]).toEqual([7]);

    // And without focus: the 60 s tick does the same.
    global.fetch = ut as unknown as typeof fetch;
    a.set(KEY, [7, 8]);
    await flush(a);
    expect(getSyncStatus()).toBe("utlogget");
    global.fetch = ok;
    await jest.advanceTimersByTimeAsync(61_000);
    expect(getSyncStatus()).toBe("ok");
    expect((await store.getState())[KEY]).toEqual([7, 8]);
  });

  it("a 401 from /api/kode says log in again, not wrong code", async () => {
    global.fetch = jest.fn(
      async () => ({ ok: false, status: 401 }) as Response,
    ) as unknown as typeof fetch;
    const r = await GameEngine.submitCode("NOE", 1);
    expect(r.utlogget).toBe(true);
    expect(r.message).toBe("LOGG INN PÅ NYTT");
    expect(GameEngine.getFailedAttempts(1)).toBe(0);
    expect(getSyncStatus()).toBe("utlogget");
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

describe("two screens (kjerne K1, K4, K6)", () => {
  it("K1: an edited letter keeps a sibling's letter on the server", async () => {
    const L = "nissekomm-santa-letters";
    const a = new ServerSyncAdapter();
    await a.start();
    const k = { day: 3, from: "Kristian", content: "Kjære Jlius" };
    a.set(L, [k]);
    await flush(a);
    // Håkon's letter from the TV reaches the server; a has not pulled yet.
    await store.putState(L, [{ day: 3, from: "Håkon", content: "Hei" }]);
    a.set(L, [{ ...k, content: "Kjære Julius" }]);
    await flush(a);
    const lagret = (await store.getState())[L] as { from: string }[];
    expect(lagret.map((x) => x.from).sort()).toEqual(["Håkon", "Kristian"]);
  });

  it("K6: a reset elsewhere clears this screen's local-only season keys", async () => {
    const LOKAL = "nissekomm-nissenet-last-visit";
    const a = new ServerSyncAdapter([LOKAL]);
    await a.start();
    localStorage.setItem(LOKAL, "20");
    await a.pull();
    expect(localStorage.getItem(LOKAL)).toBe("20");
    await fakeFetch("", { method: "DELETE" });
    await a.pull();
    expect(localStorage.getItem(LOKAL)).toBeNull();
  });

  it("K6: modules are derived, a stale stored list is ignored", () => {
    jest.setSystemTime(new Date(2026, 11, 1, 10, 0));
    localStorage.setItem("nissekomm-unlocked-modules", '["SLEDEFLUKT"]');
    expect(GameEngine.isModuleUnlocked("SLEDEFLUKT")).toBe(false);
    jest.setSystemTime(new Date(2026, 11, 8, 10, 0));
    expect(GameEngine.isModuleUnlocked("SLEDEFLUKT")).toBe(true);
  });

  it("K4: badges come from synced solves, celebrated once per screen", () => {
    jest.setSystemTime(new Date(2026, 11, 24, 18, 0));
    localStorage.setItem(
      "nissekomm-codes",
      JSON.stringify(
        Array.from({ length: 24 }, (_, i) => ({
          kode: "X",
          dato: "",
          day: i + 1,
        })),
      ),
    );
    localStorage.setItem(
      "nissekomm-solved-decryptions",
      JSON.stringify(["frosne-koder", "stjernetegn"]),
    );
    expect(GameEngine.recordSolve(24, "X").isNewCompletion).toBe(false);
    const ids = StorageManager.getEarnedBadges().map((b) => b.badgeId);
    expect(ids).toEqual(
      expect.arrayContaining(["varmebaerer", "portvokter", "snofalls-venn"]),
    );
    // Crypto files follow the solved challenge, not the solving screen's list.
    expect(GameEngine.isFileUnlocked("stjernetegn.txt", 24)).toBe(true);

    // Another screen: the badges arrive by sync and show once there too.
    localStorage.removeItem("nissekomm-badges-seen");
    const vist: string[] = [];
    const lytt = (b: { id: string }) => vist.push(b.id);
    GameEngine.onBadgeAwarded(lytt);
    GameEngine.awardDueBadges();
    GameEngine.offBadgeAwarded(lytt);
    expect(vist.sort()).toEqual(["portvokter", "snofalls-venn", "varmebaerer"]);
    GameEngine.onBadgeAwarded(lytt);
    GameEngine.awardDueBadges();
    GameEngine.offBadgeAwarded(lytt);
    expect(vist).toHaveLength(3);
  });
});

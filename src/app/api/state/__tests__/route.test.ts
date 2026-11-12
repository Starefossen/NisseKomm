/**
 * @jest-environment node
 */

// next-test-api-route-handler must be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { createHash } from "node:crypto";
import { newDb, DataType } from "pg-mem";
import type { Pool } from "pg";
import * as stateRoute from "../route";
import { createPgStore, memoryStore, mergeValue, migrate } from "@/lib/db";

process.env.STORAGE_BACKEND = "server";
const TOKEN = "test-token";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function call(
  method: "GET" | "PUT" | "DELETE",
  body?: unknown,
  cookie = true,
) {
  let out: { status: number; json: unknown } | undefined;
  await testApiHandler({
    appHandler: stateRoute,
    requestPatcher: (req) => req.headers.set("host", "nissekomm.no"),
    test: async ({ fetch }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Origin: "https://nissekomm.no",
      };
      if (cookie)
        headers.Cookie = `__Host-nissekomm=${TOKEN}; __Host-nissekomm-guide=${TOKEN}`;
      const res = await fetch({
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      out = {
        status: res.status,
        json: res.status === 204 ? null : await res.json(),
      };
    },
  });
  return out!;
}

beforeEach(async () => {
  memoryStore.reset();
  await memoryStore.setSession(sha(TOKEN), {
    role: "kid",
    expires: Date.now() + 60_000,
  });
});

describe("/api/state", () => {
  it("rejects requests without a session", async () => {
    expect((await call("GET", undefined, false)).status).toBe(401);
    const put = await call("PUT", { key: "nissekomm-codes", value: [] }, false);
    expect(put.status).toBe(401);
  });

  it("rejects keys outside the whitelist", async () => {
    const res = await call("PUT", {
      key: "nissekomm-authenticated",
      value: true,
    });
    expect(res.status).toBe(400);
    expect((await call("GET")).json).toEqual({});
  });

  it("merges a list key from two screens", async () => {
    await call("PUT", { key: "nissekomm-julius-watched", value: [1] });
    await call("PUT", { key: "nissekomm-julius-watched", value: [2] });
    expect((await call("GET")).json).toEqual({
      "nissekomm-julius-watched": [1, 2],
    });
  });
});

describe("mergeValue", () => {
  it("unions lists, incoming wins per day, other keys overwrite", () => {
    expect(mergeValue("nissekomm-julius-watched", [1, 2], [2, 3])).toEqual([
      1, 2, 3,
    ]);
    expect(
      mergeValue(
        "nissekomm-brevfugler",
        [{ dag: 1, innhold: "gammel" }],
        [{ dag: 1, innhold: "ny" }],
      ),
    ).toEqual([{ dag: 1, innhold: "ny" }]);
    expect(mergeValue("nissekomm-player-names", ["a"], ["b"])).toEqual(["b"]);
  });

  it("keeps a symbol or badge another screen saved meanwhile", () => {
    expect(
      mergeValue(
        "nissekomm-collected-symbols",
        [{ symbolId: "a", description: "A" }],
        [{ symbolId: "b", description: "B" }],
      ),
    ).toHaveLength(2);
    expect(
      mergeValue(
        "nissekomm-earned-badges",
        [{ badgeId: "x", timestamp: 1 }],
        [{ badgeId: "x", timestamp: 2 }],
      ),
    ).toEqual([{ badgeId: "x", timestamp: 2 }]);
  });
});

describe("Postgres store (pg-mem)", () => {
  function pgMemPool(): Pool {
    const db = newDb({ noAstCoverageCheck: true });
    for (const name of ["pg_advisory_lock", "pg_advisory_unlock"]) {
      db.public.registerFunction({
        name,
        args: [DataType.integer],
        returns: DataType.bool,
        implementation: () => true,
      });
    }
    const { Pool: MemPool } = db.adapters.createPg();
    return new MemPool() as Pool;
  }

  it("migrates idempotently and stores state, sessions and failures", async () => {
    const pool = pgMemPool();
    await migrate(pool);
    await migrate(pool);
    const store = createPgStore(pool);

    await store.putState("nissekomm-julius-watched", [1]);
    await store.putState("nissekomm-julius-watched", [3]);
    expect(await store.getState()).toEqual({
      "nissekomm-julius-watched": [1, 3],
    });

    const expires = Date.now() + 60_000;
    await store.setSession("h", { role: "parent", expires });
    expect(await store.getSession("h")).toEqual({ role: "parent", expires });
    await store.deleteSession("h");
    expect(await store.getSession("h")).toBeNull();

    await store.addFailure(60_000);
    expect(await store.addFailure(60_000)).toBe(2);

    await store.putState("nissekomm-julius-watched", null, true);
    expect((await store.getState())["state-version"]).toBe(1);
  });
});

describe("/api/state removals and validation", () => {
  it("never takes solved codes from a client, real or not: no code oracle", async () => {
    for (const value of [
      [{ kode: "JUKS", dato: "x", day: 1 }],
      [{ kode: "SIGNAL", dato: "x", day: 1 }],
      [{ kode: "SIGNAL" }],
    ]) {
      const res = await call("PUT", { key: "nissekomm-codes", value });
      expect(res.status).toBe(400);
    }
    expect((await call("GET")).json).toEqual({});
    const clear = await call("PUT", {
      key: "nissekomm-codes",
      value: null,
      replace: true,
    });
    expect(clear.status).toBe(200);
  });

  it("replace shrinks a list and stale versions get 409", async () => {
    const key = "nissekomm-julius-watched";
    await call("PUT", { key, value: [1, 2], version: 0 });
    const reset = await call("PUT", { key, value: null, replace: true });
    expect(reset.json).toEqual({ value: null, version: 1 });
    // A screen still on version 0 pushes its old list: refused
    const stale = await call("PUT", { key, value: [1, 2], version: 0 });
    expect(stale.status).toBe(409);
    expect(stale.json).toEqual({ version: 1, reset: null });
    expect((await call("GET")).json).toEqual({
      [key]: null,
      "state-version": 1,
    });
  });

  it("never returns internal keys, and tickets work once", async () => {
    await memoryStore.putState("upload-ticket:abc", {
      path: "a.mp4",
      expires: Date.now() + 60_000,
    });
    expect((await call("GET")).json).toEqual({});
    expect(await memoryStore.consumeTicket("abc", "a.mp4")).toBe(true);
    expect(await memoryStore.consumeTicket("abc", "a.mp4")).toBe(false);
  });

  it("DELETE resets the family's state for parents only, sessions stay", async () => {
    await memoryStore.putState("nissekomm-codes", [{ kode: "X", day: 1 }]);
    expect((await call("DELETE")).status).toBe(403);
    process.env.NISSEKOMM_MODE = "lan";
    await memoryStore.setSession(sha(TOKEN), {
      role: "parent",
      expires: Date.now() + 60_000,
    });
    expect((await call("DELETE")).status).toBe(200);
    const state = (await call("GET")).json as Record<string, unknown>;
    expect(state["nissekomm-codes"]).toBeNull();
    expect(state["state-version"]).toBeGreaterThan(0);
    delete process.env.NISSEKOMM_MODE;
  });

  it("is off (204) with STORAGE_BACKEND=localStorage", async () => {
    process.env.STORAGE_BACKEND = "localStorage";
    try {
      expect((await call("GET")).status).toBe(204);
    } finally {
      process.env.STORAGE_BACKEND = "server";
    }
  });
});

describe("nissekomm-slede sync merge", () => {
  it("keeps each screen's best run per stage", () => {
    expect(
      mergeValue(
        "nissekomm-slede",
        {
          tundra: { poeng: 900, bjeller: 3 },
          muren: { poeng: 100, bjeller: 0 },
        },
        {
          tundra: { poeng: 1500, bjeller: 2 },
          muren: { poeng: 300, bjeller: 1 },
        },
      ),
    ).toEqual({
      tundra: { poeng: 900, bjeller: 3 },
      muren: { poeng: 300, bjeller: 1 },
    });
  });
});

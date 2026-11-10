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

const TOKEN = "test-token";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function call(method: "GET" | "PUT", body?: unknown, cookie = true) {
  let out: { status: number; json: unknown } | undefined;
  await testApiHandler({
    appHandler: stateRoute,
    test: async ({ fetch }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Origin: "https://nissekomm.no",
        "X-Forwarded-Host": "nissekomm.no",
      };
      if (cookie) headers.Cookie = `__Host-nissekomm=${TOKEN}`;
      const res = await fetch({
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      out = { status: res.status, json: await res.json() };
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

  it("merges solved codes from two screens by day", async () => {
    const a = { kode: "SIGNAL", dato: "x", day: 1 };
    const b = { kode: "48", dato: "y", day: 2 };
    await call("PUT", { key: "nissekomm-codes", value: [a] });
    await call("PUT", { key: "nissekomm-codes", value: [b] });
    expect((await call("GET")).json).toEqual({ "nissekomm-codes": [a, b] });
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
  });
});

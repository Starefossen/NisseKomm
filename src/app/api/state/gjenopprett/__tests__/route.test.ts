/**
 * @jest-environment node
 */
import "next-test-api-route-handler";
import { testApiHandler } from "next-test-api-route-handler";
import { it, expect, beforeEach } from "@jest/globals";
import { createHash } from "node:crypto";
import * as route from "../route";
import { arkiverOgNullstill, memoryStore } from "@/lib/db";

process.env.STORAGE_BACKEND = "server";
const TOKEN = "gjen-token";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function call(method: "GET" | "POST", body?: unknown) {
  let out!: { status: number; json: unknown };
  await testApiHandler({
    appHandler: route,
    requestPatcher: (req) => req.headers.set("host", "nissekomm.no"),
    test: async ({ fetch }) => {
      const res = await fetch({
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: "https://nissekomm.no",
          Cookie: `__Host-nissekomm-guide=${TOKEN}; nissekomm-guide=${TOKEN}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      out = { status: res.status, json: await res.json() };
    },
  });
  return out;
}

beforeEach(() => {
  memoryStore.reset();
  process.env.NISSEKOMM_MODE = "lan";
});

it("lists snapshots and restores one, codes included, parent and lan only", async () => {
  await memoryStore.setSession(sha(TOKEN), {
    role: "kid",
    expires: Date.now() + 60_000,
  });
  expect((await call("GET")).status).toBe(403);
  await memoryStore.setSession(sha(TOKEN), {
    role: "parent",
    expires: Date.now() + 60_000,
  });
  const koder = [{ kode: "X", day: 1 }];
  await memoryStore.putState("nissekomm-codes", koder, true);
  await memoryStore.putState("nissekomm-santa-letters", [
    { day: 1, content: "Hei" },
  ]);
  await arkiverOgNullstill("nullstilling", 2026, memoryStore);

  const liste = (await call("GET")).json as {
    id: number;
    nøkler: number;
    brev: number;
  }[];
  expect(liste).toHaveLength(1);
  expect(liste[0]).toMatchObject({ nøkler: 2, brev: 1 });

  expect((await call("POST", { id: liste[0].id })).status).toBe(400);
  expect(
    (await call("POST", { id: 999999, bekreft: "GJENOPPRETT" })).status,
  ).toBe(404);
  const r = await call("POST", { id: liste[0].id, bekreft: "GJENOPPRETT" });
  expect(r.status).toBe(200);
  expect((await memoryStore.getState())["nissekomm-codes"]).toEqual(koder);

  process.env.NISSEKOMM_MODE = "public";
  expect((await call("GET")).status).toBe(404);
});

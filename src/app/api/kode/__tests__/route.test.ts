/**
 * @jest-environment node
 */

// next-test-api-route-handler must be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createHash } from "node:crypto";
import * as kodeRoute from "../route";
import { memoryStore } from "@/lib/db";
import { getOppdrag } from "@/lib/oppdrag";

process.env.STORAGE_BACKEND = "server";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function post(body: unknown, token: string) {
  let out: { status: number; json: Record<string, unknown> } | undefined;
  await testApiHandler({
    appHandler: kodeRoute,
    requestPatcher: (req) => req.headers.set("host", "nissekomm.no"),
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://nissekomm.no",
          Cookie: `__Host-nissekomm=${token}`,
        },
        body: JSON.stringify(body),
      });
      out = { status: res.status, json: await res.json() };
    },
  });
  return out!;
}

let n = 0;
async function kidToken() {
  const t = `kid-${++n}`;
  await memoryStore.setSession(sha(t), {
    role: "kid",
    expires: Date.now() + 60_000,
  });
  return t;
}

beforeEach(() => {
  memoryStore.reset();
  process.env.NEXT_PUBLIC_MOCK_MONTH = "12";
  process.env.NEXT_PUBLIC_MOCK_DAY = "10";
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_MOCK_MONTH;
  delete process.env.NEXT_PUBLIC_MOCK_DAY;
});

describe("POST /api/kode", () => {
  it("records a right code and refuses a future day", async () => {
    const t = await kidToken();
    const k = getOppdrag(10)!.kode;
    const ok = await post({ dag: 10, kode: k.toLowerCase() }, t);
    expect(ok.json).toEqual({ ok: true, dag: 10, kode: k.toUpperCase() });
    const state = await memoryStore.getState();
    expect(state["nissekomm-codes"]).toEqual([
      expect.objectContaining({ day: 10, kode: k.toUpperCase() }),
    ]);
    const fram = await post({ dag: 11, kode: getOppdrag(11)!.kode }, t);
    expect(fram.status).toBe(403);
  });

  it("rate-limits wrong tries per role: a new login or bogus cookie gets no fresh bucket", async () => {
    const a = await kidToken();
    for (let i = 0; i < 10; i++)
      expect((await post({ dag: 1, kode: `feil${i}` }, a)).json).toEqual({
        ok: false,
      });
    const b = await kidToken();
    expect((await post({ dag: 1, kode: "feil" }, b)).status).toBe(429);
    expect((await post({ dag: 1, kode: "feil" }, "falsk")).status).toBe(401);
  });
});

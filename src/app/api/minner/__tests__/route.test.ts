/**
 * @jest-environment node
 */
import "next-test-api-route-handler";
import { testApiHandler } from "next-test-api-route-handler";
import { it, expect } from "@jest/globals";
import { createHash } from "node:crypto";
import * as route from "../route";
import { arkiver, memoryStore, resetState } from "@/lib/db";

const TOKEN = "minne-token";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function get(qs: string, cookie = true) {
  let out!: { status: number; json: Record<string, unknown> };
  await testApiHandler({
    appHandler: route,
    url: `/api/minner${qs}`,
    test: async ({ fetch }) => {
      const res = await fetch({
        headers: cookie ? { Cookie: `nissekomm=${TOKEN}` } : {},
      });
      out = { status: res.status, json: await res.json() };
    },
  });
  return out;
}

it("serves a season's memories to the kids, 404 without an archive", async () => {
  memoryStore.reset();
  await memoryStore.setSession(sha(TOKEN), {
    role: "kid",
    expires: Date.now() + 60_000,
  });
  expect((await get("?sesong=2025", false)).status).toBe(401);
  expect((await get("?sesong=2025")).status).toBe(404);
  await memoryStore.putState("nissekomm-santa-letters", [
    { day: 3, from: "Hanna", content: "Hei Julius" },
  ]);
  await arkiver("manuell", 2025, memoryStore);
  // A near-empty later snapshot (after a reset) must not hide the letters.
  await resetState(memoryStore);
  await memoryStore.putState("nissekomm-intros-seen", ["dag1"]);
  await arkiver("sesongskifte", 2025, memoryStore);
  expect(await memoryStore.arkiv(2025)).toHaveLength(2);
  const r = await get("?sesong=2025");
  expect(r.status).toBe(200);
  expect(r.json.brev).toEqual({ Hanna: [{ dag: 3, tekst: "Hei Julius" }] });
});

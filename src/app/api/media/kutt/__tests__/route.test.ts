/** @jest-environment node */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { memoryStore } from "@/lib/db";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const req = (q: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://lan/api/media/kutt${q}`, { headers });
const parent = { cookie: "__Host-nissekomm-guide=parent" };

beforeEach(async () => {
  process.env.NISSEKOMM_MODE = "lan";
  memoryStore.reset();
  for (const role of ["kid", "parent"] as const)
    await memoryStore.setSession(sha(role), {
      role,
      expires: Date.now() + 60_000,
    });
});
afterEach(() => {
  delete process.env.NISSEKOMM_MODE;
});

describe("API /api/media/kutt", () => {
  it("lan mode and a parent only", async () => {
    expect((await GET(req("?dag=13"))).status).toBe(401);
    expect(
      (await GET(req("?dag=13", { cookie: "__Host-nissekomm=kid" }))).status,
    ).toBe(403);
    process.env.NISSEKOMM_MODE = "public";
    expect((await GET(req("?dag=13", parent))).status).toBe(404);
  });

  it("validates the day", async () => {
    for (const q of ["", "?dag=0", "?dag=25", "?dag=x", "?dag=1.5"])
      expect((await GET(req(q, parent))).status).toBe(400);
    const r = await GET(req("?dag=13", parent));
    expect(r.status).toBe(200);
    expect(await r.json()).toHaveProperty("status");
  });
});

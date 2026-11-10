/**
 * @jest-environment node
 */

// next-test-api-route-handler must be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import * as loginRoute from "../route";
import { memoryStore } from "@/lib/db";
import { proxy } from "@/proxy";

const ORIGIN = "https://nissekomm.no";

async function login(body: unknown, origin: string | null = ORIGIN) {
  let result:
    { status: number; text: string; cookie: string | null } | undefined;
  await testApiHandler({
    appHandler: loginRoute,
    test: async ({ fetch }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        // Behind Kourier the public host arrives as X-Forwarded-Host.
        "X-Forwarded-Host": "nissekomm.no",
      };
      if (origin) headers.Origin = origin;
      const res = await fetch({
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      result = {
        status: res.status,
        text: await res.text(),
        cookie: res.headers.get("set-cookie"),
      };
    },
  });
  return result!;
}

const env = process.env as Record<string, string | undefined>;

beforeEach(() => {
  env.KID_CODE = "snø lykt elg";
  env.PARENT_CODE = "bjelle kakao reinsdyr vott";
  env.NISSEKOMM_MODE = "lan";
  memoryStore.reset();
});

describe("POST /api/auth/login", () => {
  it("accepts the kid code with normalized case and separators", async () => {
    const res = await login({ code: "  SNØ-lykt   Elg " });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toEqual({
      role: "kid",
      kidCode: "SNØ LYKT ELG",
    });
    expect(res.cookie).toMatch(/^__Host-nissekomm=[\w-]{43};/);
    expect(res.cookie).toMatch(/Secure/);
    expect(res.cookie).toMatch(/HttpOnly/);
    expect(res.cookie).toMatch(/SameSite=lax/i);
    expect(res.cookie).toMatch(/Path=\//);
    const token = res.cookie!.match(/__Host-nissekomm=([^;]+)/)![1];
    const hash = createHash("sha256").update(token).digest("hex");
    expect(await memoryStore.getSession(hash)).toMatchObject({ role: "kid" });
  });

  it("accepts the parent code only in lan mode", async () => {
    const code = "bjelle-kakao-reinsdyr-vott";
    expect(JSON.parse((await login({ code })).text).role).toBe("parent");
    env.NISSEKOMM_MODE = "public";
    expect((await login({ code })).status).toBe(401);
  });

  it("rejects a wrong code with a generic error and no cookie", async () => {
    const res = await login({ code: "snø lykt" });
    expect(res.status).toBe(401);
    expect(JSON.parse(res.text)).toEqual({ error: "Ugyldig kode" });
    expect(res.cookie).toBeNull();
  });

  it("throttles to 1/s after 20 failures but still lets the kids in", async () => {
    for (let i = 0; i < 21; i++) {
      expect((await login({ code: `feil ${i}` })).status).toBe(401);
    }
    const start = Date.now();
    const [a, b] = await Promise.all([
      login({ code: "feil igjen" }),
      login({ code: "snø lykt elg" }),
    ]);
    expect(a.status).toBe(401);
    expect(b.status).toBe(200);
    expect(Date.now() - start).toBeGreaterThanOrEqual(1900);
  });

  it("rejects cross-origin, missing origin and oversized bodies", async () => {
    expect(
      (await login({ code: "snø lykt elg" }, "https://evil.example")).status,
    ).toBe(403);
    expect((await login({ code: "snø lykt elg" }, null)).status).toBe(403);
    expect((await login({ code: "x".repeat(17_000) })).status).toBe(413);
  });

  it("returns generic errors without stack traces", async () => {
    for (const body of [{}, "not json", { code: 42 }]) {
      const res = await login(body);
      expect(res.status).toBe(400);
      expect(res.text).not.toMatch(/at |Error|stack/);
    }
  });
});

describe("proxy (NISSEKOMM_MODE)", () => {
  const status = (path: string) =>
    proxy(new NextRequest(`${ORIGIN}${path}`)).status;

  it("404s lan-only routes in public mode", () => {
    env.NISSEKOMM_MODE = "public";
    for (const p of [
      "/nissemor-guide",
      "/nissemor-guide/oppdrag",
      "/dev/livecam",
      "/mcp",
    ]) {
      expect(status(p)).toBe(404);
    }
    expect(status("/")).toBe(200);
  });

  it("serves them in lan mode", () => {
    expect(status("/nissemor-guide")).toBe(200);
  });
});

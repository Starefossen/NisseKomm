/**
 * @jest-environment node
 */

// next-test-api-route-handler must be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect } from "@jest/globals";
import * as loginRoute from "../route";

async function login(body: unknown) {
  let result: { status: number; json: Record<string, unknown> } | undefined;
  await testApiHandler({
    appHandler: loginRoute,
    test: async ({ fetch }) => {
      const res = await fetch({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      result = { status: res.status, json: await res.json() };
    },
  });
  return result!;
}

describe("POST /api/auth/login", () => {
  it("rejects missing and empty code", async () => {
    expect((await login({})).status).toBe(400);
    expect((await login({ code: "" })).status).toBe(400);
  });

  it("rejects invalid code format", async () => {
    const res = await login({ code: "invalid-format" });
    expect(res.status).toBe(401);
    expect(res.json.error).toBe("Ugyldig kode");
  });

  it("accepts kid and parent codes case-insensitively", async () => {
    expect((await login({ code: "nissekraft2024" })).json).toEqual({
      sessionId: "NISSEKRAFT2024",
      role: "kid",
    });
    expect((await login({ code: "nordpol-8n4k2" })).json).toEqual({
      sessionId: "NORDPOL-8N4K2",
      role: "parent",
    });
  });
});

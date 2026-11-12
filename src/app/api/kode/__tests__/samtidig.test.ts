/**
 * @jest-environment node
 */

// next-test-api-route-handler must be imported first
import "next-test-api-route-handler";

import { testApiHandler } from "next-test-api-route-handler";
import { describe, it, expect, jest } from "@jest/globals";
import { createHash } from "node:crypto";
import * as kodeRoute from "../route";
import { memoryStore } from "@/lib/db";

process.env.STORAGE_BACKEND = "server";
process.env.NEXT_PUBLIC_TEST_MODE = "true";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

describe("POST /api/kode under parallel load", () => {
  it("lets exactly 10 wrong tries through even when they arrive at once", async () => {
    await memoryStore.setSession(sha("samtidig"), {
      role: "kid",
      expires: Date.now() + 60_000,
    });
    // A slow store: every request awaits here before it reaches the limiter.
    const ekte = memoryStore.getState.bind(memoryStore);
    jest.spyOn(memoryStore, "getState").mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return ekte();
    });
    const statuser: number[] = [];
    await testApiHandler({
      appHandler: kodeRoute,
      requestPatcher: (req) => req.headers.set("host", "nissekomm.no"),
      test: async ({ fetch }) => {
        const svar = await Promise.all(
          Array.from({ length: 20 }, (_, i) =>
            fetch({
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Origin: "https://nissekomm.no",
                Cookie: "__Host-nissekomm=samtidig",
              },
              body: JSON.stringify({ dag: 1, kode: `feil${i}` }),
            }),
          ),
        );
        statuser.push(...svar.map((r) => r.status));
      },
    });
    expect(statuser.filter((s) => s === 200)).toHaveLength(10);
    expect(statuser.filter((s) => s === 429)).toHaveLength(10);
  });
});

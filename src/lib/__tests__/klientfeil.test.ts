/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";
import { createMemoryStore } from "@/lib/db";
import { lagreKlientfeil, lesKlientfeil, renskFeil } from "@/lib/klientfeil";

describe("klientfeil", () => {
  it("keeps only message, path, user agent and time", () => {
    const f = renskFeil(
      { melding: "x".repeat(900), rute: "/dag?navn=Kristian#a", ekstra: 1 },
      "kid",
      "Safari",
      new Date("2026-12-03T08:00:00Z"),
    );
    expect(f).toEqual({
      tid: "2026-12-03T08:00:00.000Z",
      rolle: "kid",
      melding: "x".repeat(500),
      rute: "/dag",
      ua: "Safari",
    });
    expect(renskFeil({ melding: "  " }, "kid", "")).toBeNull();
  });

  it("stores newest first, capped", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < 205; i++)
      await lagreKlientfeil(store, renskFeil({ melding: `m${i}` }, "kid", "")!);
    const l = await lesKlientfeil(store);
    expect(l).toHaveLength(200);
    expect(l[0].melding).toBe("m204");
  });
});

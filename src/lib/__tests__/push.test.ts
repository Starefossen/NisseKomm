/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";
import { createMemoryStore } from "@/lib/db";
import { getAllOppdrag } from "@/lib/oppdrag";
import { antallKveldTing } from "@/lib/guide-sesong";
import {
  fjernSub,
  kveldMelding,
  lagreSub,
  lesSubs,
  renskSub,
  sendKveld,
} from "@/lib/notify/push";
import { eventsForWrite } from "@/lib/notify/events";

const sub = (endpoint: string, typer?: string[]) =>
  renskSub({
    subscription: { endpoint, keys: { p256dh: "p", auth: "a" } },
    typer,
  });

describe("push subscriptions", () => {
  it("validates and keeps only known types", () => {
    expect(sub("http://x")).toBeNull();
    expect(renskSub({ subscription: { endpoint: "https://x" } })).toBeNull();
    expect(sub("https://x", ["kode", "tull"])?.typer).toEqual(["kode"]);
    expect(sub("https://x")?.typer).toEqual(["kveld", "kode", "feil", "agent"]);
  });

  it("stores one per device and removes", async () => {
    const store = createMemoryStore();
    await lagreSub(store, sub("https://a", ["kode"])!);
    await lagreSub(store, sub("https://a", ["kveld"])!);
    await lagreSub(store, sub("https://b")!);
    expect((await lesSubs(store)).map((s) => [s.endpoint, s.typer])).toEqual([
      ["https://a", ["kveld"]],
      ["https://b", ["kveld", "kode", "feil", "agent"]],
    ]);
    await fjernSub(store, "https://a");
    expect((await lesSubs(store)).map((s) => s.endpoint)).toEqual([
      "https://b",
    ]);
  });
});

describe("20:00 I kveld", () => {
  const ting = () => 5;
  it("only from 20:00 Oslo, 30 Nov–23 Dec, for tomorrow", () => {
    // 19:59 and 20:00 Oslo (UTC+1)
    expect(kveldMelding(new Date("2026-12-07T18:59:00Z"), ting)).toBeNull();
    expect(kveldMelding(new Date("2026-12-07T19:00:00Z"), ting)?.body).toBe(
      "I kveld: 5 ting å sette opp til dag 8.",
    );
    expect(kveldMelding(new Date("2026-11-30T19:30:00Z"), ting)?.body).toMatch(
      /dag 1\.$/,
    );
    expect(kveldMelding(new Date("2026-12-24T19:30:00Z"), ting)).toBeNull();
    expect(kveldMelding(new Date("2026-12-07T19:30:00Z"), () => 0)).toBeNull();
  });

  it("sends once per date", async () => {
    const store = createMemoryStore();
    const t = new Date("2026-12-07T19:05:00Z");
    expect(await sendKveld(store, ting, t)).toBe(true);
    expect(await sendKveld(store, ting, new Date("2026-12-07T21:00:00Z"))).toBe(
      false,
    );
    expect(await sendKveld(store, ting, new Date("2026-12-08T19:05:00Z"))).toBe(
      true,
    );
  });

  it("counts every evening's checklist", () => {
    for (let d = 2; d <= 24; d++) expect(antallKveldTing(d)).toBeGreaterThan(0);
  });
});

describe("push text leaks nothing", () => {
  it("no codes or names in any push title or body", async () => {
    const texts: string[] = [];
    for (let d = 1; d <= 24; d++) {
      texts.push(
        kveldMelding(
          new Date(
            `2026-12-${String(Math.max(d - 1, 1)).padStart(2, "0")}T19:30:00Z`,
          ),
          antallKveldTing,
        )?.body ?? "",
      );
      for (const n of eventsForWrite(
        "nissekomm-codes",
        [],
        [{ kode: getAllOppdrag()[d - 1].kode, day: d }],
      ))
        if (n.event === "day_solved")
          texts.push(n.title, "Dagens kode er løst.");
    }
    const all = texts.join("\n").toUpperCase();
    // A one- or two-digit code reads like a day number; those are allowed.
    for (const o of getAllOppdrag().filter((o) => !/^\d{1,2}$/.test(o.kode)))
      expect(all).not.toMatch(new RegExp(`\\b${o.kode.toUpperCase()}\\b`));
    expect(all).not.toMatch(/KRISTIAN|HÅKON|HANNA|LANDÅS/);
  });
});

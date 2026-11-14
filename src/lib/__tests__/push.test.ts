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
  lekkerTekst,
  lesSubs,
  pushVert,
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
    expect(
      sub("https://web.push.apple.com/x", ["kode", "tull"])?.typer,
    ).toEqual(["kode"]);
    expect(sub("https://web.push.apple.com/x")?.typer).toEqual([
      "kveld",
      "kode",
      "feil",
      "agent",
    ]);
  });

  it("allows only the browser push services (SSRF)", () => {
    for (const ok of [
      "https://web.push.apple.com/abc",
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://wns2-db5p.notify.windows.com/w/?token=abc",
    ])
      expect(pushVert(ok)).toBe(true);
    for (const nei of [
      "https://localhost/x",
      "https://10.0.0.1/x",
      "https://fcm.googleapis.com.evil.no/x",
      "https://evilpush.apple.com/x",
      "https://fcm.googleapis.com:8443/x",
      "http://fcm.googleapis.com/x",
    ])
      expect(pushVert(nei)).toBe(false);
  });

  it("agent text filter catches names and word codes", () => {
    expect(lekkerTekst("Se på dag 4", ["Kristian"], ["NORDLYS"])).toBe(false);
    expect(lekkerTekst("hei kristian", ["Kristian"], ["NORDLYS"])).toBe(true);
    expect(lekkerTekst("koden er nordlys", ["Kristian"], ["NORDLYS"])).toBe(
      true,
    );
    expect(lekkerTekst("dag 12", [], ["12"])).toBe(false);
  });

  it("stores one per device and removes", async () => {
    const store = createMemoryStore();
    await lagreSub(store, sub("https://fcm.googleapis.com/a", ["kode"])!);
    await lagreSub(store, sub("https://fcm.googleapis.com/a", ["kveld"])!);
    await lagreSub(store, sub("https://fcm.googleapis.com/b")!);
    expect((await lesSubs(store)).map((s) => [s.endpoint, s.typer])).toEqual([
      ["https://fcm.googleapis.com/a", ["kveld"]],
      ["https://fcm.googleapis.com/b", ["kveld", "kode", "feil", "agent"]],
    ]);
    await fjernSub(store, "https://fcm.googleapis.com/a");
    expect((await lesSubs(store)).map((s) => s.endpoint)).toEqual([
      "https://fcm.googleapis.com/b",
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

  it("does not use up the evening when nothing was delivered", async () => {
    const store = createMemoryStore();
    // No VAPID keys in tests: sendPush delivers nothing.
    expect(await sendKveld(store, ting, new Date("2026-12-07T19:05:00Z"))).toBe(
      false,
    );
    expect(await store.hit("nissekomm-push-sendt:2026-12-07", 1000)).toBe(1);
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

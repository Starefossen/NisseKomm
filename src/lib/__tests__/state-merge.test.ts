import { describe, it, expect } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import {
  FIELD_MERGED_KEYS,
  MERGED_KEYS,
  mergeValue,
  shrinks,
} from "../state-merge";
import { SYNCED_KEYS } from "../storage-adapter";

// Every synced key and its rule; a new synced key without a row fails here.
const REGEL: Record<string, "liste" | "felt" | "slede" | "siste"> = {
  "nissekomm-codes": "liste",
  "nissekomm-julius-watched": "liste",
  "nissekomm-bonusoppdrag-completed": "liste",
  "nissekomm-earned-badges": "liste",
  "nissekomm-santa-letters": "liste",
  "nissekomm-frost-off-day": "siste",
  "nissekomm-intros-seen": "liste",
  "nissekomm-slede": "slede",
  "nissekomm-collected-symbols": "liste",
  "nissekomm-solved-decryptions": "liste",
  "nissekomm-unlocked-files": "liste",
  "nissekomm-topic-unlocks": "felt",
  "nissekomm-player-names": "siste",
  "nissekomm-viewed-emails": "liste",
  "nissekomm-viewed-bonusoppdrag-emails": "liste",
  "nissekomm-eventyr": "siste",
  "nissekomm-failed-attempts": "felt",
  "nissekomm-foreldre-avkrysning": "felt",
  "nissekomm-handlet": "felt",
};

describe("merge rule per synced key", () => {
  it("covers every synced key", () => {
    expect(Object.keys(REGEL).sort()).toEqual([...SYNCED_KEYS].sort());
  });
  it.each(Object.entries(REGEL))("%s: %s", (k, regel) => {
    expect(MERGED_KEYS.has(k)).toBe(regel === "liste");
    expect(FIELD_MERGED_KEYS.has(k)).toBe(regel === "felt");
  });
});

describe("K2 intros-seen", () => {
  it("is a union", () => {
    expect(
      mergeValue(
        "nissekomm-intros-seen",
        ["boot", "ny-sledeflukt-8"],
        ["boot", "ugle-k2"],
      ),
    ).toEqual(["boot", "ny-sledeflukt-8", "ugle-k2"]);
  });
});

describe("K3 sled challenge", () => {
  it("keeps utfordringDag from a run that ranks the same or lower", () => {
    const lagret = { "K/tundra": { poeng: 900, bjeller: 3 } };
    expect(
      mergeValue("nissekomm-slede", lagret, {
        "K/tundra": { poeng: 900, bjeller: 3, utfordringDag: 12 },
      }),
    ).toEqual({ "K/tundra": { poeng: 900, bjeller: 3, utfordringDag: 12 } });
    expect(
      mergeValue(
        "nissekomm-slede",
        { t: { poeng: 1000, bjeller: 4, utfordringDag: 12 } },
        { t: { poeng: 50, bjeller: 4, utfordringDag: 9 } },
      ),
    ).toEqual({ t: { poeng: 1000, bjeller: 4, utfordringDag: 12 } });
  });
});

describe("K5 parents' objects merge per field", () => {
  it("keeps the other phone's item", () => {
    expect(
      mergeValue("nissekomm-handlet", { melk: "kjopt" }, { band: "hjemme" }),
    ).toEqual({ melk: "kjopt", band: "hjemme" });
    expect(mergeValue("nissekomm-failed-attempts", { 3: 2 }, { 4: 1 })).toEqual(
      { 3: 2, 4: 1 },
    );
    expect(mergeValue("nissekomm-topic-unlocks", { a: 1 }, { b: 2 })).toEqual({
      a: 1,
      b: 2,
    });
    expect(
      mergeValue(
        "nissekomm-foreldre-avkrysning",
        { "kveld-3": ["a"], x: ["1"] },
        { "kveld-3": ["b"] },
      ),
    ).toEqual({ "kveld-3": ["a", "b"], x: ["1"] });
  });
  it("an untick or a removed item goes as replace", () => {
    const k = "nissekomm-foreldre-avkrysning";
    expect(shrinks(k, { a: ["1", "2"] }, { a: ["1"] })).toBe(true);
    expect(shrinks(k, { a: ["1"] }, { a: ["1", "2"] })).toBe(false);
    expect(shrinks("nissekomm-handlet", { m: "kjopt" }, {})).toBe(true);
    expect(shrinks("nissekomm-handlet", { m: "kjopt" }, { m: "hjemme" })).toBe(
      false,
    );
  });
});

describe("K1 edited letter", () => {
  it("is a merge, not a replace", () => {
    const k = "nissekomm-santa-letters";
    const før = [{ day: 3, from: "Kristian", content: "Kjære Jlius" }];
    const etter = [{ day: 3, from: "Kristian", content: "Kjære Julius" }];
    expect(shrinks(k, før, etter)).toBe(false);
    expect(shrinks(k, før, [])).toBe(true);
  });
});

describe("old data formats", () => {
  const dump = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "fixtures/gammel-dev-store.json"),
      "utf8",
    ),
  ) as { kv: [string, unknown][] };
  const gammel = Object.fromEntries(dump.kv);

  it("merges new writes into last season's stored shapes", () => {
    expect(
      mergeValue("nissekomm-santa-letters", gammel["nissekomm-santa-letters"], [
        { day: 3, from: "Håkon", content: "Hei" },
      ]),
    ).toHaveLength(2);
    expect(
      mergeValue("nissekomm-slede", gammel["nissekomm-slede"], {
        "Kristian/tundra": { poeng: 900, bjeller: 3, utfordringDag: 8 },
      }),
    ).toMatchObject({
      tundra: { poeng: 900, bjeller: 3 },
      "Kristian/tundra": { utfordringDag: 8 },
    });
    expect(
      mergeValue(
        "nissekomm-foreldre-avkrysning",
        gammel["nissekomm-foreldre-avkrysning"],
        { "kveld-4": ["b"] },
      ),
    ).toEqual({ handleliste: ["Melk"], "kveld-3": ["a"], "kveld-4": ["b"] });
    expect(
      mergeValue("nissekomm-intros-seen", gammel["nissekomm-intros-seen"], [
        "ugle-k1",
      ]),
    ).toHaveLength(3);
    expect(
      mergeValue("nissekomm-handlet", gammel["nissekomm-handlet"], {
        lim: "kjopt",
      }),
    ).toEqual({ melk: "kjopt", lim: "kjopt" });
  });
});

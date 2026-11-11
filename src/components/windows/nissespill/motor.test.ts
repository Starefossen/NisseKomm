import { describe, it, expect } from "@jest/globals";
import type { EventyrSave } from "@/lib/storage";
import * as M from "./motor";

const save = (...flags: string[]): EventyrSave => ({
  kapittel: 9,
  sceneId: "a",
  inventory: [],
  flags,
  hints: {},
});

describe("motor: vilkår", () => {
  const v: M.Vilkaar = {
    alle: [
      { hvis: "lampe" },
      { en_av: [{ hvis: "nokkel" }, { hvis: "kode" }] },
    ],
    uten: "ferdig",
  };
  it("alle og en_av kan nøstes, hvis/uten virker som før", () => {
    expect(M.ok(v, save("lampe"))).toBe(false);
    expect(M.ok(v, save("lampe", "kode"))).toBe(true);
    expect(M.ok(v, save("lampe", "nokkel", "ferdig"))).toBe(false);
    expect(M.ok({ hvis: "a" }, save("a"))).toBe(true);
    expect(M.ok({ en_av: [] }, save())).toBe(false);
  });
});

/** Tiny fixture: one example per engine feature. Not chapter content. */
const KAP: M.Kapittel = {
  n: 9,
  tittel: "Test",
  dag: 1,
  klar: true,
  start: "a",
  intro: [],
  slutt: "k9_slutt",
  utro: "",
  scener: [
    {
      id: "a",
      navn: "A",
      bilde: "",
      utganger: [],
      fjaer: { x: 10, y: 10, w: 3, h: 3 },
      hotspots: [],
    },
    { id: "b", navn: "B", bilde: "", utganger: [], hotspots: [] },
    {
      id: "c",
      navn: "C",
      bilde: "",
      utganger: [],
      fjaer: { x: 50, y: 80, w: 3, h: 3 },
      hotspots: [],
    },
  ],
  gjenstander: {},
  kombinasjoner: [],
  dialoger: {},
  gaater: [],
  fjaerBelonning: "Knerten blåser seg opp av stolthet.",
};

describe("motor: fjær", () => {
  it("gamle lagringer uten fjaer laster, SE plukker, siste gir belønning", () => {
    let s = save();
    expect(M.fjaerTelling(KAP, s)).toEqual([0, 2]);
    expect(M.taFjaer(KAP, s, "a", "bruk").save).toBe(s);
    s = M.taFjaer(KAP, s, "a", "se").save;
    expect(M.fjaerTelling(KAP, s)).toEqual([1, 2]);
    expect(M.taFjaer(KAP, s, "a", null).save).toBe(s);
    const u = M.taFjaer(KAP, s, "c", null);
    expect(u.tekst).toContain("Fjær 2/2. Knerten");
    expect(M.nyttKapittel(KAP, u.save).fjaer).toEqual(["9:a", "9:c"]);
  });
});

import { describe, expect, it } from "@jest/globals";
import {
  alleElementer,
  egenVurdering,
  nesteUvurdert,
  naboI,
  nyesteVersjon,
} from "./elementer";
import type { Sesong } from "../_kveld/felles";

const sesong = {
  dager: Array.from({ length: 24 }, (_, i) => ({
    utskrifter: i === 0 ? ["x"] : [],
  })),
  for: { radio: [{ dato: "2026-11-24", tekst: "" }] },
  historien: [{ tittel: "Kjernen", deler: [] }],
  promo: [],
} as unknown as Sesong;

describe("gjennomgang", () => {
  const liste = alleElementer("dag", sesong, [], 3);
  it("ids are unique and match the guide's (mise run vurderinger --prefiks)", () => {
    const ids = liste.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((i) => i.startsWith("dag/04/"))).toEqual([
      "dag/04/rampestrek",
      "dag/04/gaatekart",
      "dag/04/tekster",
      "dag/04/kveld",
    ]);
    expect(ids).toContain("dag/01/utskrifter");
    expect(ids).toContain("audio/rampenissen/dag-04.mp3");
    expect(ids).toContain("manus/julius/dag-24");
    expect(ids).toContain("manus/julius/dag-01");
    expect(egenVurdering("manus/julius/dag-01")).toBe(false);
    expect(egenVurdering("manus/julius/dag-01#s2")).toBe(true);
    expect(ids).toContain("krypto/3");
    expect(ids).toContain("promo/julius-promo-A.mp4");
  });
  it("neste uvurdert skips verdicts", () => {
    expect(
      nesteUvurdert(liste, "dag/01/rampestrek", {
        "dag/01/gaatekart": { vurdering: "godkjent" },
      })?.id,
    ).toBe("video/julius/dag-01.mp4");
  });
  it("picks the newest version", () => {
    expect(
      nyesteVersjon("promo/julius-promo-A", [
        { path: "promo/julius-promo-A.mp4" },
        { path: "promo/julius-promo-A-v2.mp4" },
      ]),
    ).toBe("promo/julius-promo-A-v2.mp4");
  });
});

describe("naboI", () => {
  const strek = Array.from({ length: 24 }, (_, i) => ({
    id: `dag/${String(i + 1).padStart(2, "0")}/rampestrek`,
    gruppe: "rampestrek",
    tittel: `Dag ${i + 1}`,
    dag: i + 1,
    media: [],
  }));
  it("N from day 7 gives day 8, not day 1; wraps at the end", () => {
    expect(naboI(strek, "dag/07/rampestrek", 1).e?.dag).toBe(8);
    expect(naboI(strek, "dag/07/rampestrek", -1).e?.dag).toBe(6);
    const slutt = naboI(strek, "dag/24/rampestrek", 1);
    expect(slutt.e?.dag).toBe(1);
    expect(slutt.rundt).toBe(true);
  });
});

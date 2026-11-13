import { describe, expect, it } from "@jest/globals";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { versionKey } from "@/lib/media-status";
import {
  alleElementer,
  egenVurdering,
  nesteUvurdert,
  naboI,
  naboer,
  type Element,
  nyesteVersjon,
  tilstand,
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

describe("dekning", () => {
  // Real inventory when present (gitignored), else one path per kind.
  const inv = path.join(process.cwd(), "public/media-inventar.json");
  const filer: { path: string; size: number | null }[] = existsSync(inv)
    ? JSON.parse(readFileSync(inv, "utf8"))
    : [
        "video/julius/dag-01.mp4",
        "video/julius/dag-01-v2.mp4",
        "audio/rampenissen/dag-03.mp3",
        "video/tv/landsby-rolig.mp4",
        "video/tv/port-aapen.mp4",
        "strek/dag01.old-2.png",
        "strek/dag10-v1.png",
        "spill/piksel/ikon/bolle.png",
        "spill/piksel/ikon/tesil.old-1.png",
        "spill/piksel/figur/julius.png",
        "spill/piksel/kafe.png",
        "spill/portrett-iq.png",
        "spill/torget.jpg",
        "feed/landsby-rolig.jpg",
        "music/rampenissen-synger.mp3",
        "promo/julius-promo-A-v2.mp4",
      ].map((p) => ({ path: p, size: 1 }));
  const liste = alleElementer("dag", sesong, filer, 3);
  const nåbar = (p: string) =>
    liste.some((e) =>
      [e.id, ...e.media, ...(e.eldre ?? [])].some(
        (x) => x === p || versionKey(x) === versionKey(p),
      ),
    );

  it("every inventory file is an item in Gjennomgang", () => {
    expect(filer.map((f) => f.path).filter((p) => !nåbar(p))).toEqual([]);
    expect(
      liste.find((e) => e.id === "spill/piksel/ikon/bolle.png")?.gruppe,
    ).toBe("Ikoner");
  });

  it("no verdict is orphaned: open set and counts unchanged", () => {
    const verdikt = ["godkjent", "ok", "lag_paa_nytt", undefined];
    const vurd = Object.fromEntries(
      filer.map((f, i) => [f.path, { vurdering: verdikt[i % 4] }]),
    );
    const telling = (ids: string[]) =>
      ids.map((i) => vurd[i].vurdering ?? "åpen").sort();
    const alle = Object.keys(vurd);
    expect(telling(alle.filter(nåbar))).toEqual(telling(alle));
  });
});

describe("naboer (N/P)", () => {
  const el = (id: string): Element => ({
    id,
    gruppe: "g",
    tittel: id,
    media: [],
  });
  const liste = ["a", "b", "c", "d"].map(el);
  it("P undoes N, both from the queue and from the list («Alt» passes no queue)", () => {
    for (const ko of [["d", "a", "c"], null])
      for (const x of ["a", "c"]) {
        const n = naboer(liste, liste, x, ko).neste!;
        expect(naboer(liste, liste, n.id, ko).forrige?.id).toBe(x);
      }
    expect(naboer(liste, liste, "a", null).neste?.id).toBe("b");
    expect(naboer(liste, liste, "a", ["d", "a", "c"]).neste?.id).toBe("c");
  });
});

describe("tilstand", () => {
  it("a section's own verdict wins over its sketch (rolled back in df5dd47)", () => {
    const e = {
      id: "dag/04/rampestrek",
      gruppe: "rampestrek",
      tittel: "",
      media: ["strek/dag04.png"],
    };
    const k = {
      filer: [{ path: "strek/dag04.png", size: 1 }],
      vurderinger: { "dag/04/rampestrek": { vurdering: "godkjent" } },
    };
    expect(tilstand(e, k).celle).toBe("godkjent");
    expect(tilstand(e, { ...k, vurderinger: {} }).celle).not.toBe("godkjent");
  });
});

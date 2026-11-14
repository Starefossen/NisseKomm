import { describe, it, expect } from "@jest/globals";
import { brukbar, celleFor, familie, type StatusKilde } from "./media-status";
import {
  dagElement,
  tilstand,
} from "@/app/nissemor-guide/gjennomgang/elementer";
import type { Sesong } from "@/app/nissemor-guide/_kveld/felles";

const f = (path: string) => ({ path, size: 5 });
// Hans' case: plain files in use not reviewed or stale, the newest -vN approved.
const k: StatusKilde = {
  filer: [
    f("video/julius/dag-01.mp4"),
    f("video/julius/dag-01-v3.mp4"),
    f("video/julius/dag-01-v4.mp4"),
    f("video/julius/dag-02.mp4"),
    f("video/julius/dag-02-v4.mp4"),
    f("video/julius/dag-03.mp4"),
    f("video/julius/dag-03-v5.mp4"),
  ],
  vurderinger: {
    "video/julius/dag-01-v3.mp4": { vurdering: "lag_paa_nytt" },
    "video/julius/dag-01-v4.mp4": { vurdering: "godkjent" },
    "video/julius/dag-02-v4.mp4": { vurdering: "godkjent" },
    "video/julius/dag-03.mp4": { vurdering: "godkjent" },
    "video/julius/dag-03-v5.mp4": { vurdering: "godkjent" },
  },
  inventar: new Map([
    ["video/julius/dag-02.mp4", { status: "stale" }],
    // Approved, then its prompt changed: still ✓.
    ["video/julius/dag-03.mp4", { status: "stale", date: "2026-11-12" }],
  ]),
};

describe("familie etter ta i bruk", () => {
  it("viser eldre -vK som historikk, ikke som nyere kandidat", () => {
    const k2: StatusKilde = {
      filer: [
        { path: "video/julius/dag-01.mp4", size: 5, fraVersjon: 4 },
        f("video/julius/dag-01-v2.mp4"),
        f("video/julius/dag-01-v3.mp4"),
      ],
      vurderinger: {
        "video/julius/dag-01.mp4": { vurdering: "godkjent" },
        "video/julius/dag-01-v3.mp4": { vurdering: "lag_paa_nytt" },
      },
    };
    const fam = familie("video/julius/dag-01.mp4", k2);
    expect(fam.kandidat).toBeUndefined();
    expect(fam.tekst).toBe("✓");
    k2.filer.push(f("video/julius/dag-01-v5.mp4"));
    expect(familie("video/julius/dag-01.mp4", k2).kandidat?.navn).toBe("v5");
  });
});

describe("media-status", () => {
  it("cellen er filen i bruk, pluss nyeste kandidat", () => {
    const d1 = familie("video/julius/dag-01-v3.mp4", k);
    expect(d1.key).toBe("video/julius/dag-01.mp4");
    expect(d1.tekst).toBe("○ → v4 ✓");
    expect(d1.kanTaIBruk).toBe(true);
    expect(d1.versjoner.map((v) => v.navn)).toEqual([
      "v4",
      "v3",
      "gjeldende versjon",
    ]);
    // Stale is a hint, never a state (Hans 13 Nov).
    expect(familie("video/julius/dag-02.mp4", k).tekst).toBe("○ → v4 ✓");
    expect(familie("video/julius/dag-02.mp4", k).iBruk.utdatert).toBe(
      "prompt endret",
    );
    expect(familie("video/julius/dag-03.mp4", k).tekst).toBe("✓ → v5 ✓");
    expect(familie("video/julius/dag-04.mp4", k).tekst).toBe("✗");
  });

  it("celleFor og Gjennomgang gir samme celle", () => {
    const sesong = { dager: [] } as unknown as Sesong;
    for (const n of [1, 2, 3, 4]) {
      const e = dagElement("julius", n, sesong, k.filer)!;
      const g = tilstand(e, k);
      const fil = `video/julius/dag-0${n}.mp4`;
      const m = celleFor([fil], k);
      expect(g.celle).toBe(m.celle);
      expect(g.tekst).toBe(familie(fil, k).tekst);
      expect(familie(e.id, k).kandidat?.navn).toBe(m.familie?.kandidat?.navn);
    }
  });

  it("OK er brukbar: kan tas i bruk, eget merke", () => {
    const ko: StatusKilde = {
      filer: [f("a/x.mp4"), f("a/x-v2.mp4")],
      vurderinger: {
        "a/x.mp4": { vurdering: "ok", notat: "litt mørk" },
        "a/x-v2.mp4": { vurdering: "ok" },
      },
    };
    const fam = familie("a/x.mp4", ko);
    expect(fam.celle).toBe("ok");
    expect(fam.tekst).toBe("◐ → v2 ◐");
    expect(fam.kanTaIBruk).toBe(true);
    expect(
      brukbar("ok") && brukbar("godkjent") && !brukbar("lag_paa_nytt"),
    ).toBe(true);
  });
});

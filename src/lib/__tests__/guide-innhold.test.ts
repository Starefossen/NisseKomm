import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, it, expect } from "@jest/globals";
import {
  assetFil,
  bruktAv,
  finnTreff,
  lintSegment,
  MANUS,
  parseJulius,
  parseRadio,
  wcount,
} from "@/lib/guide-innhold";

const md = (f: string) => readFileSync(f, "utf8");

describe("manus parsers", () => {
  it("reads every Julius day with segments, action and Kulde", () => {
    const text = md(MANUS.julius);
    for (let d = 1; d <= 24; d++) {
      const j = parseJulius(text, d);
      expect(j?.tittel).toMatch(new RegExp(`^Dag ${d} \\(`));
      expect(j!.segmenter.length).toBeGreaterThanOrEqual(3);
      for (const s of j!.segmenter) {
        expect(s.replikk.split("«").length).toBe(s.replikk.split("»").length);
        expect(s.sek).toBeGreaterThan(0);
        expect(s.handling).not.toBe("");
      }
    }
    expect(parseJulius(text, 1)!.segmenter).toHaveLength(8);
    expect(parseJulius(text, 25)).toBeNull();
  });

  it("does not leak the next day into a day block", () => {
    const j = parseJulius(md(MANUS.julius), 1)!;
    expect(j.intro).not.toContain("## Dag 2");
  });

  it("reads radio fields", () => {
    const r = parseRadio(md(MANUS.radio), 11)!;
    expect(r.strek).toContain("aluminiumsfolie");
    expect(r.klipp.startsWith("…hallo")).toBe(true);
    expect(r.lydregi).toBeTruthy();
    expect(r.intro_hint).toBeTruthy();
  });

  it("keeps a nested «…» inside the replikk", () => {
    const j = parseJulius(
      "## Dag 3 (x)\n1. **Replikk:** «Han sa «hei» til meg.» (låst)\n   - Varighet: 9 s\n",
      3,
    )!;
    expect(j.segmenter[0].replikk).toBe("Han sa «hei» til meg.");
    expect(j.segmenter[0].laast).toBe(true);
  });

  it("applies julius-dag.py's speech budget", () => {
    const kort = "en to tre fire fem";
    expect(lintSegment(kort, 15, false).varsler).toEqual([]);
    const lang = Array(25).fill("ord").join(" ");
    expect(lintSegment(lang, 15, false).varsler.join()).toMatch(/maks 22/);
    expect(lintSegment(lang, 15, true).varsler.join()).not.toMatch(/maks/);
    expect(wcount("TV-en og Lucia-morgen, 85,0")).toBe(5);
  });

  it("matches julius-dag.py lint on day 17", () => {
    // Expected values from: julius-dag.py wcount/timing over medie.julius_segments(17)
    const segs = parseJulius(md(MANUS.julius), 17)!.segmenter;
    expect(segs.map((s) => [s.ord, s.sek, s.laast])).toEqual([
      [20, 14, false],
      [20, 14, false],
      [19, 14, true],
      [22, 15, true],
    ]);
    expect(segs.map((s) => s.varsler)).toEqual([
      [],
      [],
      [],
      ["22 ord trenger 14.8 s; modellen leverer ofte 13 s på 15"],
    ]);
  });
});

describe("bruktAv", () => {
  it("matches place, image path and template variable like medie.py", () => {
    const jobber = {
      a: { sted: "torget" },
      b: { bilde: "locations/torget#standard" },
      c: { mal: "m.txt" },
      d: { bilde: "locations/torget-x#standard" },
    };
    expect(
      bruktAv("torget", jobber, { "m.txt": "{{locations/torget}}" }),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("finnTreff", () => {
  it("returns highlighted snippets case-insensitively", () => {
    const t = finnTreff(
      [{ kilde: "k", lenke: "/l", tekst: "Hei Winter!" }],
      "winter",
    );
    expect(t).toEqual([
      { kilde: "k", lenke: "/l", foer: "Hei ", treff: "Winter", etter: "!" },
    ]);
  });
});

describe("assetFil whitelist", () => {
  it("allows reference images in entity folders", () => {
    expect(assetFil(["characters", "winter", "ref-outside.jpg"])).toBe(
      "assets/characters/winter/ref-outside.jpg",
    );
    expect(assetFil(["locations", "torget", "ref.png"])).toBeTruthy();
  });

  it.each([
    [["..", "winter", "ref.jpg"]],
    [["characters", "..", "ref.jpg"]],
    [["characters", "winter", "..%2Fref.jpg"]],
    [["characters", "winter", "../ref.jpg"]],
    [["characters", "winter", "..jpg"]],
    [["characters", "winter", "entitet.md"]],
    [["characters", "winter", "beskrivelse.txt"]],
    [["prompts", "spill", "x.jpg"]],
    [["bin", "x", "x.jpg"]],
    [["characters", "winter", ".hidden.jpg"]],
    [["characters", "winter", "sub", "ref.jpg"]],
    [["characters", "Winter", "ref.jpg"]],
    [["characters", "winter", "ref.jpg\0"]],
  ])("refuses %j", (parts) => {
    expect(assetFil(parts)).toBeNull();
  });
});

describe("guide-innhold.json", () => {
  it("matches docs/manus and assets (node scripts/guide-innhold.mjs)", () => {
    expect(() =>
      execFileSync("node", ["scripts/guide-innhold.mjs", "--sjekk"], {
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});

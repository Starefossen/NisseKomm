import { readFileSync } from "node:fs";
import { describe, it, expect } from "@jest/globals";
import {
  assetFil,
  bruktAv,
  finnTreff,
  lintSegment,
  MANUS,
  parseJulius,
  parseRadio,
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

  it("applies julius-dag.py's speech budget", () => {
    const kort = "en to tre fire fem";
    expect(lintSegment(kort, 15, false).varsler).toEqual([]);
    const lang = Array(25).fill("ord").join(" ");
    expect(lintSegment(lang, 15, false).varsler.join()).toMatch(/maks 22/);
    expect(lintSegment(lang, 15, true).varsler.join()).not.toMatch(/maks/);
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

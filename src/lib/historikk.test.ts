/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { endredeFelt, gitLogg, historikk, kildeFor } from "./historikk";

function oppsett() {
  const dir = mkdtempSync(path.join(tmpdir(), "hist-media-"));
  const repo = mkdtempSync(path.join(tmpdir(), "hist-repo-"));
  mkdirSync(path.join(dir, "video/julius"), { recursive: true });
  mkdirSync(path.join(repo, "assets/out"), { recursive: true });
  const v = (f: string, s = "") =>
    writeFileSync(path.join(dir, "video/julius", f), s);
  v("dag-03.mp4");
  v(
    "dag-03.mp4.meta.json",
    JSON.stringify({
      created: "2026-11-10T10:00:00Z",
      generator: "julius-dag.py",
      prompt_version: "abcdef1234567890",
    }),
  );
  v("dag-03-v2.mp4");
  v("dag-04.mp4");
  v(
    "dag-03.segmenter.json",
    JSON.stringify([
      { s: 1, flagg: [] },
      { s: 2, flagg: ["mangler: ord"] },
    ]),
  );
  writeFileSync(
    path.join(dir, "media-promoteringer.log"),
    "2026-11-11T09:00:00.000Z video/julius/dag-03-v2.mp4 -> video/julius/dag-03.mp4; video/julius/dag-03.mp4 -> video/julius/dag-03.old-1.mp4\n",
  );
  writeFileSync(
    path.join(dir, "media-vurdering.json"),
    JSON.stringify({
      format: 2,
      sesong: 2026,
      elementer: {
        "video/julius/dag-03.mp4": {
          vurderinger: [
            {
              vurdering: "godkjent",
              oppdatert: "2026-11-12T08:00:00Z",
              hash: "*",
              fil: "video/julius/dag-03.mp4",
            },
          ],
          historikk: [
            {
              vurdering: "lag_paa_nytt",
              notat: "for lang",
              oppdatert: "2026-11-09T08:00:00Z",
              hash: "*",
              fil: "video/julius/dag-03.mp4",
              merknad: "gjenopprettet: test",
            },
          ],
        },
        "video/julius/dag-03#s2": {
          vurderinger: [
            {
              notat: "?",
              oppdatert: "2026-11-12T09:00:00Z",
              hash: "*",
              fil: "video/julius/dag-03#s2",
              trenger: {
                hva: "skisse",
                når: "2026-11-12T09:00:00Z",
                levert: "2026-11-12T10:00:00Z",
              },
            },
          ],
          historikk: [],
        },
      },
    }),
  );
  writeFileSync(
    path.join(repo, "assets/out/forbruk.jsonl"),
    [
      {
        t: "2026-11-08T10:00:00",
        type: "video",
        skript: "julius.sh",
        element: "dag03-2.raw.mp4",
      },
      {
        t: "2026-11-08T11:00:00",
        type: "video",
        skript: "julius.sh",
        element: "dag04-1.raw.mp4",
      },
    ]
      .map((r) => JSON.stringify(r))
      .join("\n"),
  );
  writeFileSync(
    path.join(repo, "assets/out/dag03-2.sjekk.json"),
    JSON.stringify({ flagg: ["x"], dekning: 0.5 }),
  );
  return { dir, repo };
}

describe("historikk", () => {
  it("samler vurderinger, versjoner, sjekk og kostnad, nyeste først, merket hvem", async () => {
    const { dir, repo } = oppsett();
    const h = await historikk(dir, "video/julius/dag-03-v2.mp4", repo);
    const tekst = h.map((x) => `${x.hvem}|${x.hva}|${x.tekst}`).join("\n");
    expect(tekst).toContain("Hans|vurdering|godkjent");
    expect(tekst).toContain("lag_paa_nytt");
    expect(tekst).toContain("agent|vurdering|gjenopprettet: test");
    expect(tekst).toContain("Hans|vurdering|trenger skisse");
    expect(tekst).toContain("agent|vurdering|levert: skisse");
    expect(tekst).toContain("maskin|versjon|dag-03.mp4 laget · julius-dag.py");
    expect(tekst).toContain("prompt abcdef123456");
    expect(tekst).toContain("maskin|versjon|dag-03-v2.mp4 laget");
    expect(tekst).not.toContain("dag-04.mp4");
    expect(tekst).toContain("Hans|versjon|Ta i bruk");
    expect(tekst).toContain("s2: mangler: ord");
    expect(tekst).toContain("opptak s2: x");
    expect(tekst).toContain("maskin|kostnad|1 kall, ca. 17 kr");
    expect(h.map((x) => x.t)).toEqual([...h.map((x) => x.t)].sort().reverse());
  });

  it("kildeteksten finnes for dagseksjoner, manus og radio", () => {
    expect(kildeFor("dag/04/kveld")).toContain("docs/gaater-2026.md");
    expect(kildeFor("dag/04/rampestrek")).toContain("historie-2026.md");
    expect(kildeFor("manus/julius/dag-04")).toContain("julius-2026.md");
    expect(kildeFor("manus/radio/dag-04")).toContain("radio-2026.md");
    expect(kildeFor("ugleposten/k1")).toBeNull();
    expect(
      endredeFelt("-- **Hint:** a\n+- **Hint:** b\n+- **Kode:** c"),
    ).toEqual(["Hint", "Kode"]);
  });

  it("git log for gaater gir commits med diff", async () => {
    const g = await gitLogg("dag/04/kveld");
    expect(g.length).toBeGreaterThan(0);
    expect(g[0].diff).toContain("Dag 4");
  });
});

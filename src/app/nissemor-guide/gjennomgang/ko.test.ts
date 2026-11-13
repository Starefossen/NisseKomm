import { describe, it, expect } from "@jest/globals";
import { byggKo, type KoServer } from "./ko";
import type { Element } from "./elementer";

const server = (o: Partial<KoServer> = {}): KoServer => ({
  forbruk: { brukt: 0, igjen: 2000, budsjett: 2000, fra: "2026-11-13" },
  duplikater: [],
  jobber: { "strek/dag02.png": "strek:dag02" },
  manus: { "3": [1, 2], "14": [1, 2] },
  ...o,
});
const f = (path: string) => ({ path, size: 1 });

describe("byggKo", () => {
  const liste: Element[] = [
    {
      id: "video/julius/dag-03-v2.mp4",
      gruppe: "julius",
      tittel: "Dag 3: Julius",
      dag: 3,
      media: ["video/julius/dag-03-v2.mp4"],
    },
    {
      id: "dag/02/rampestrek",
      gruppe: "rampestrek",
      tittel: "Dag 2: Rampestrek",
      dag: 2,
      media: ["strek/dag02.png"],
    },
    {
      id: "dag/05/kveld",
      gruppe: "oppsett",
      tittel: "Dag 5: Oppsett",
      dag: 5,
      media: [],
    },
  ];
  const filer = [
    f("video/julius/dag-03.mp4"),
    f("video/julius/dag-03-v2.mp4"),
    f("video/julius/dag-03-v1.mp4"),
  ];

  it("splits Hans, agent and lessons; hides duplicates and older candidates; sorts by day", () => {
    const ko = byggKo(
      liste,
      {
        filer,
        vurderinger: {
          "video/julius/dag-03.mp4": { vurdering: "ok", notat: "mikrofonen" },
          "dag/05/kveld": { vurdering: "lag_paa_nytt", notat: "feil" },
          "manus/julius/dag-14#s1": { vurdering: "godkjent" },
          "video/julius/dag-03#s2": { vurdering: "lag_paa_nytt" },
        },
      },
      server(),
    );
    expect(ko.venter.map((l) => l.id)).toEqual([
      "video/julius/dag-03-v2.mp4",
      "manus/julius/dag-14",
    ]);
    expect(ko.segmenter).toBe(1);
    expect(ko.agent.map((l) => [l.id, l.pris])).toEqual([
      ["dag/02/rampestrek", 1.4],
      ["video/julius/dag-03-v2.mp4", 17],
      ["dag/05/kveld", 0],
    ]);
    expect(ko.agent[0].kommando).toContain("--bare strek:dag02");
    expect(ko.agent[1].kommando).toContain("--segment 2");
    expect(ko.laerdom.map((l) => l.type)).toEqual(["julius"]);

    const dup = byggKo(
      liste,
      { filer, vurderinger: {} },
      server({ duplikater: ["video/julius/dag-03-v2.mp4"] }),
    );
    expect(dup.venter.map((l) => l.id)).not.toContain(
      "video/julius/dag-03-v2.mp4",
    );
  });

  it("an approved script without video is the agent's, priced per segment", () => {
    const ko = byggKo(
      liste,
      {
        filer,
        vurderinger: {
          "manus/julius/dag-14#s1": { vurdering: "godkjent" },
          "manus/julius/dag-14#s2": { vurdering: "ok" },
        },
      },
      server(),
    );
    expect(ko.agent.find((l) => l.dag === 14)).toMatchObject({
      kommando: "python3 assets/bin/julius-dag.py 14",
      pris: 34,
    });
  });

  it("radio: only a clip to make or remake waits on its script", () => {
    const r = (d: string): Element => ({
      id: `audio/rampenissen/dag-${d}.mp3`,
      gruppe: "radio",
      tittel: `Dag ${Number(d)}: Radio`,
      dag: Number(d),
      media: [`audio/rampenissen/dag-${d}.mp3`],
    });
    const ko = byggKo(
      [r("05"), r("06"), r("07"), r("08")],
      {
        filer: [
          f("audio/rampenissen/dag-05.mp3"),
          f("audio/rampenissen/dag-06.mp3"),
          f("audio/rampenissen/dag-07.mp3"),
        ],
        vurderinger: {
          "audio/rampenissen/dag-05.mp3": { vurdering: "godkjent" },
          "audio/rampenissen/dag-06.mp3": { vurdering: "lag_paa_nytt" },
          "audio/rampenissen/dag-07.mp3": { vurdering: "lag_paa_nytt" },
          "manus/radio/dag-07": { vurdering: "godkjent" },
        },
      },
      server({ manus: {} }),
    );
    // 05 approved clip: no script line; 06 remake waits on the script; 08 missing too; 07 goes to the agent.
    expect(ko.venter.map((l) => l.id)).toEqual([
      "manus/radio/dag-06",
      "manus/radio/dag-08",
    ]);
    expect(ko.agent.map((l) => l.id)).toEqual(["audio/rampenissen/dag-07.mp3"]);
  });
  it("lists flagged segments and scripts changed after the video", () => {
    const ko = byggKo(
      liste,
      {
        filer,
        vurderinger: {
          "manus/julius/dag-03#s1": {
            forrige: { vurdering: "godkjent" },
          } as never,
          "video/julius/dag-03#s1": { vurdering: "godkjent" },
        },
      },
      server({
        flagg: {
          "3": [
            { s: 1, flagg: ["x"] },
            { s: 2, flagg: ["mangler ord"] },
          ],
        },
      }),
    );
    const hva = ko.venter.map((l) => l.hva);
    expect(hva).toContain("dag 3 s2: ! mangler ord");
    expect(hva.some((h) => h.includes("s1: !"))).toBe(false);
    expect(hva).toContain("manus endret etter videoen (s1)");
    expect(ko.venter.find((l) => l.seg === 2)?.id).toBe(
      "video/julius/dag-03-v2.mp4",
    );
  });
});

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
});

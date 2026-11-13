import { describe, it, expect } from "@jest/globals";
import { byggKo, fremdrift, type KoServer } from "./ko";
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
      "dag/02/rampestrek",
      "video/julius/dag-03-v2.mp4",
      "manus/julius/dag-14",
    ]);
    expect(ko.venter[0].hva).toBe("aldri vurdert");
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
  it("radio: an unapproved script shows when the clip is unjudged or older than the script", () => {
    const r = (d: string): Element => ({
      id: `audio/rampenissen/dag-${d}.mp3`,
      gruppe: "radio",
      tittel: `Dag ${Number(d)}: Radio`,
      dag: Number(d),
      media: [`audio/rampenissen/dag-${d}.mp3`],
    });
    const ko = byggKo(
      [r("01"), r("02"), r("03")],
      {
        filer: ["01", "02", "03"].map((d) =>
          f(`audio/rampenissen/dag-${d}.mp3`),
        ),
        vurderinger: {
          "audio/rampenissen/dag-02.mp3": { vurdering: "godkjent" },
          "audio/rampenissen/dag-03.mp3": { vurdering: "godkjent" },
          "manus/radio/dag-03": { forrige: { vurdering: "godkjent" } } as never,
        },
      },
      server({ manus: {} }),
    );
    // 01 unjudged clip; 02 approved clip, unapproved script unchanged: out; 03 script changed.
    expect(ko.venter.map((l) => l.id)).toEqual([
      "manus/radio/dag-01",
      "manus/radio/dag-03",
    ]);
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

  it("never-reviewed day sections wait on Hans by day; Lærdom drops ruled and rejected ids", () => {
    const sek = (dag: number, gruppe: string, id: string): Element => ({
      id: `dag/${String(dag).padStart(2, "0")}/${id}`,
      gruppe,
      tittel: `Dag ${dag}: ${gruppe}`,
      dag,
      media: [],
    });
    const ko = byggKo(
      [
        sek(12, "gaate", "gaatekart"),
        sek(3, "tekster", "tekster"),
        sek(3, "gaate", "gaatekart"),
      ],
      {
        filer: [],
        vurderinger: {
          "dag/12/gaatekart": { vurdering: "ok", notat: "a" },
          "strek/dag04.png": { vurdering: "godkjent", notat: "b" },
          "strek/dag05.png": { vurdering: "ok", tagger: ["farger"] },
          "strek/dag06.png": { vurdering: "ok", notat: "c" },
        },
      },
      server({
        manus: {},
        laerdom: {
          regler: [
            {
              type: "strek",
              regel: "unngå: a",
              kilder: ["strek/dag04.png"],
              dato: "2026-11-13",
              aktiv: true,
            },
          ],
          avvist: ["strek/dag06.png"],
        },
      }),
    );
    expect(ko.venter.map((l) => l.id)).toEqual([
      "dag/03/gaatekart",
      "dag/03/tekster",
    ]);
    expect(ko.laerdom.map((l) => l.id)).toEqual([
      "strek/dag05.png",
      "dag/12/gaatekart",
    ]);
  });

  it("progress: every element in one bucket, counts sum to the total", () => {
    const liste: Element[] = [
      {
        id: "video/julius/dag-03.mp4",
        gruppe: "julius",
        tittel: "J3",
        dag: 3,
        media: ["video/julius/dag-03.mp4"],
      },
      {
        id: "video/julius/dag-20.mp4",
        gruppe: "julius",
        tittel: "J20",
        dag: 20,
        media: ["video/julius/dag-20.mp4"],
      },
      {
        id: "dag/02/tekster",
        gruppe: "tekster",
        tittel: "T2",
        dag: 2,
        media: [],
      },
      {
        id: "dag/04/tekster",
        gruppe: "tekster",
        tittel: "T4",
        dag: 4,
        media: [],
      },
      {
        id: "dag/05/kveld",
        gruppe: "oppsett",
        tittel: "K5",
        dag: 5,
        media: [],
      },
      {
        id: "dag/06/kveld",
        gruppe: "oppsett",
        tittel: "K6",
        dag: 6,
        media: [],
      },
    ];
    const k = {
      filer: [
        f("video/julius/dag-03.mp4"),
        { path: "video/julius/dag-20.mp4", size: null },
      ],
      vurderinger: {
        "video/julius/dag-03.mp4": { vurdering: "godkjent" as const },
        "dag/04/tekster": { vurdering: "ok" as const },
        "dag/05/kveld": { vurdering: "lag_paa_nytt" as const, notat: "x" },
      },
    };
    const ko = byggKo(liste, k, server({ manus: {} }));
    const fd = fremdrift(liste, k, ko);
    const sum = (t: Record<string, number>) =>
      Object.values(t).reduce((a, b) => a + b, 0);
    expect(fd.total.n).toBe(liste.length);
    expect(sum(fd.total.telling)).toBe(fd.total.n);
    for (const t of fd.typer) expect(sum(t.telling)).toBe(t.n);
    expect(fd.typer.reduce((a, t) => a + t.n, 0)).toBe(fd.total.n);
    expect(fd.total.telling).toEqual({
      godkjent: 1,
      ok: 1,
      venter: 2,
      agent: 1,
      mangler: 1,
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import { byggKo, elementStatus, fremdrift, type KoServer } from "./ko";
import { videoStatus } from "@/lib/segmenter";
import { tilstand, type Element } from "./elementer";

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
    // dag-03's s2 is ✗: the video waits on the agent, not on Hans (videoStatus).
    // The missing sketch is rampestrek's one line (Hos agent), not also «aldri vurdert».
    expect(ko.venter.map((l) => l.id)).toEqual(["manus/julius/dag-14"]);
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
    // The clip keeps its own line («venter på radiomanuset»): its element is counted in this tab.
    expect(ko.venter.map((l) => l.id)).toEqual([
      "manus/radio/dag-06",
      "audio/rampenissen/dag-06.mp3",
      "manus/radio/dag-08",
      "audio/rampenissen/dag-08.mp3",
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
    // The clip keeps its own line («venter på radiomanuset»): its element is counted in this tab.
    expect(ko.venter.map((l) => l.id)).toEqual([
      "manus/radio/dag-01",
      "audio/rampenissen/dag-01.mp3",
      "manus/radio/dag-03",
      "audio/rampenissen/dag-03.mp3",
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

  it("a pending cut check waits on Hans with the time, and is not an agent job", () => {
    const ko = byggKo(
      liste,
      {
        filer,
        vurderinger: {
          "video/julius/dag-03#s2": {
            vurdering: "ok",
            kuttsjekk: { retning: "slutt", t: 4 },
          },
        },
      },
      server({ segtid: { "3": [{ s: 2, start: 20, slutt: 29.4 }] } }),
    );
    expect(ko.venter.map((l) => l.hva)).toContain("dag 3 s2: hør kuttet @0:29");
    expect(ko.agent.some((l) => l.seg === 2 || l.hva.includes("kutt"))).toBe(
      false,
    );
  });

  it("a failed automatic cut is a red line in Hos agent with the log path", () => {
    const ko = byggKo(
      liste,
      { filer, vurderinger: {} },
      server({ kuttFeil: { "3": "assets/out/kutt-03.log" } }),
    );
    const l = ko.agent.find((x) => x.hva.includes("kutt-03.log"));
    expect(l).toMatchObject({ feil: true, dag: 3, pris: 0 });
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
      ikke: 0,
      valgfri: 0,
    });
    // The bar's two queue segments are exactly the tabs' element sets.
    const ider = new Set(liste.map((e) => e.id));
    const agentIder = new Set(
      ko.agent.map((l) => l.id).filter((x) => ider.has(x)),
    );
    const venterIder = new Set(
      ko.venter
        .map((l) => l.id)
        .filter((x) => ider.has(x) && !agentIder.has(x)),
    );
    expect(fd.total.telling.agent).toBe(agentIder.size);
    expect(fd.total.telling.venter).toBe(venterIder.size);
  });

  it("an unjudged duplicate is no queue line, so the bar shows it as «Ikke aktuelt», not «Venter»", () => {
    const liste: Element[] = [
      {
        id: "strek/dag02.png",
        gruppe: "rampestrek",
        tittel: "S2",
        dag: 2,
        media: ["strek/dag02.png"],
      },
    ];
    const k = { filer: [f("strek/dag02.png")], vurderinger: {} };
    const ko = byggKo(
      liste,
      k,
      server({ manus: {}, duplikater: ["strek/dag02.png"] }),
    );
    expect(ko.venter).toEqual([]);
    const s = { duplikater: ["strek/dag02.png"] };
    expect(fremdrift(liste, k, ko, s).total.telling.venter).toBe(0);
    expect(fremdrift(liste, k, ko, s).total.telling.ikke).toBe(1);
  });

  it("an optional file nobody made is no queue line, only «valgfri» in the progress bar", () => {
    const liste: Element[] = [
      {
        id: "video/tv/landsby-tarnklokke.mp4",
        gruppe: "Snøfall TV",
        tittel: "Tårnklokke",
        media: ["video/tv/landsby-tarnklokke.mp4"],
      },
    ];
    const k = {
      filer: [{ path: "video/tv/landsby-tarnklokke.mp4", size: null }],
      vurderinger: {},
      inventar: new Map([
        ["video/tv/landsby-tarnklokke.mp4", { status: "valgfri" }],
      ]),
    } as unknown as Parameters<typeof byggKo>[1];
    const ko = byggKo(liste, k, server({ manus: {} }));
    expect([...ko.venter, ...ko.agent]).toEqual([]);
    const fd = fremdrift(liste, k, ko);
    expect(fd.total.telling.valgfri).toBe(1);
    expect(fd.total.telling.mangler).toBe(0);
  });
});

describe("one status everywhere", () => {
  const liste: Element[] = [
    {
      id: "video/julius/dag-01.mp4",
      gruppe: "julius",
      tittel: "Dag 1: Julius",
      dag: 1,
      media: ["video/julius/dag-01.mp4"],
    },
    {
      id: "dag/03/rampestrek",
      gruppe: "rampestrek",
      tittel: "Dag 3: Rampestrek",
      dag: 3,
      media: ["strek/dag03.png"],
    },
    {
      id: "dag/04/gaatekart",
      gruppe: "gaate",
      tittel: "Dag 4: Gåte",
      dag: 4,
      media: [],
    },
    {
      id: "dag/05/gaatekart",
      gruppe: "gaate",
      tittel: "Dag 5: Gåte",
      dag: 5,
      media: [],
    },
  ];
  const vurderinger = {
    "video/julius/dag-01#s1": { vurdering: "godkjent" as const },
    "video/julius/dag-01#s2": { vurdering: "ok" as const },
    "video/julius/dag-01.mp4": { vurdering: "godkjent" as const },
    "dag/03/rampestrek": { vurdering: "godkjent" as const },
    "dag/04/gaatekart": {
      vurdering: "ok" as const,
      trenger: { hva: "skisse" as const, når: "2026-11-13T10:00:00Z" },
    },
    "dag/05/gaatekart": {
      vurdering: "godkjent" as const,
      forklaring: "Fordi.",
      trenger: {
        hva: "forklaring" as const,
        når: "2026-11-13T10:00:00Z",
        levert: "2026-11-13T11:00:00Z",
      },
    },
  };
  const k = {
    filer: [f("video/julius/dag-01.mp4"), f("strek/dag03.png")],
    vurderinger,
  };
  const s = server({ manus: { "1": [1, 2] } });
  const ko = byggKo(liste, k, s);
  const fd = fremdrift(liste, k, ko, s);
  const status = Object.fromEntries(fd.poster.map((p) => [p.id, p.status]));

  it("the matrix (fremdrift) and the Element view (elementStatus) agree for every id", () => {
    const agent = new Set(ko.agent.map((l) => l.id));
    const venter = new Set(ko.venter.map((l) => l.id));
    for (const e of liste)
      expect(status[e.id]).toBe(elementStatus(e, k, agent, venter, s));
    expect(Object.values(status)).not.toContain("utenfor");
  });

  it("a finished segmented Julius video is OK like the segment status says", () => {
    const vs = videoStatus(
      [{ s: 1 }, { s: 2 }],
      (n) =>
        vurderinger[`video/julius/dag-01#s${n}` as "video/julius/dag-01#s1"],
      vurderinger["video/julius/dag-01.mp4"],
    );
    expect(vs.tekst).toMatch(/^◐ OK/);
    expect(status["video/julius/dag-01.mp4"]).toBe("ok");
  });

  it("an approved section is not held back by its unjudged sketch file", () => {
    expect(status["dag/03/rampestrek"]).toBe("godkjent");
  });

  it("Trenger mer: open goes to the agent with a price, delivered comes back as Ny info", () => {
    const a = ko.agent.find((l) => l.id === "dag/04/gaatekart");
    expect(a?.hva).toBe("trenger skisse");
    expect(a?.pris).toBe(1.4);
    expect(status["dag/04/gaatekart"]).toBe("agent");
    const v = ko.venter.find((l) => l.id === "dag/05/gaatekart");
    expect(v?.hva).toBe("Ny info: forklaring lagt til");
    expect(status["dag/05/gaatekart"]).toBe("venter");
    expect(ko.trengerTelling).toEqual({ skisse: 1, forklaring: 1 });
  });
});

describe("round 3: no loop", () => {
  const el = (id: string, dag: number, gruppe: string, media: string[] = []) =>
    ({ id, gruppe, tittel: id, dag, media }) as Element;
  const liste: Element[] = [
    el("dag/04/rampestrek", 4, "rampestrek", ["strek/dag04.png"]),
    el("dag/10/rampestrek", 10, "rampestrek", ["strek/dag10.png"]),
    el("video/julius/dag-05.mp4", 5, "julius", ["video/julius/dag-05.mp4"]),
    el("audio/rampenissen/dag-06.mp3", 6, "radio", [
      "audio/rampenissen/dag-06.mp3",
    ]),
    el("manus/radio/dag-06", 6, "Radio-manus"),
    el("audio/rampenissen/dag-07.mp3", 7, "radio", [
      "audio/rampenissen/dag-07.mp3",
    ]),
    el("manus/radio/dag-07", 7, "Radio-manus"),
    el("dag/08/kveld", 8, "oppsett"),
  ];
  const k = {
    filer: [
      f("strek/dag04.png"),
      f("strek/dag10.png"),
      f("strek/dag10-v1.png"),
      f("video/julius/dag-05.mp4"),
      f("audio/rampenissen/dag-06.mp3"),
      f("audio/rampenissen/dag-07.mp3"),
    ],
    vurderinger: {
      "strek/dag04.png": { vurdering: "godkjent" as const },
      "strek/dag10-v1.png": { vurdering: "godkjent" as const },
      "video/julius/dag-05.mp4": { vurdering: "godkjent" as const },
      "audio/rampenissen/dag-07.mp3": { vurdering: "godkjent" as const },
      // A file that is gone: history, not a queue line.
      "spill/retro/borte.png": { vurdering: "godkjent" as const },
    },
    inventar: new Map([
      ["video/julius/dag-05.mp4", { status: "stale", date: "2026-11-12" }],
    ]),
  };
  const s = server({ manus: {} });
  const ko = byggKo(liste, k, s);
  const fd = fremdrift(liste, k, ko, s);
  const status = Object.fromEntries(fd.poster.map((p) => [p.id, p.status]));

  it("rampestrek inherits its approved sketch: no «aldri vurdert»", () => {
    expect(status["dag/04/rampestrek"]).toBe("godkjent");
    expect(tilstand(liste[0], k).tekst).toBe("godkjent (fra skissen)");
    expect(ko.venter.map((l) => l.id)).not.toContain("dag/04/rampestrek");
  });

  it("approved stays approved when its prompt changed: no agent line", () => {
    expect(status["video/julius/dag-05.mp4"]).toBe("godkjent");
    expect(ko.agent).toEqual([]);
  });

  it("every element in «agent»/«venter» has a queue line, and every line an element", () => {
    const ider = new Set(liste.map((e) => e.id));
    const a = new Set(ko.agent.map((l) => l.id));
    const v = new Set(ko.venter.map((l) => l.id).filter((x) => !a.has(x)));
    for (const x of [...a, ...v]) expect(ider).toContain(x);
    expect(fd.total.telling.agent).toBe(a.size);
    expect(fd.total.telling.venter).toBe(v.size);
    for (const p of fd.poster)
      if (p.status === "agent" || p.status === "venter")
        expect([p.id, (p.status === "agent" ? a : v).has(p.id)]).toEqual([
          p.id,
          true,
        ]);
    // Approved candidate = done; a radio script with an approved clip = done.
    expect(status["dag/10/rampestrek"]).toBe("godkjent");
    expect(status["manus/radio/dag-07"]).toBe("godkjent");
    expect(status["audio/rampenissen/dag-06.mp3"]).toBe("venter");
  });
});

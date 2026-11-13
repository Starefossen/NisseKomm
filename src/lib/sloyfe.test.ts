/** @jest-environment node */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as svarPOST } from "@/app/api/media/svar/route";
import { POST as arbeidPOST } from "@/app/api/media/arbeid/route";
import { POST as vurderingPOST } from "@/app/api/media/vurdering/route";
import { callTool } from "@/lib/mcp/tools";
import { historikk } from "@/lib/historikk";
import { byggKo, type KoServer } from "@/app/nissemor-guide/gjennomgang/ko";
import type { Element } from "@/app/nissemor-guide/gjennomgang/elementer";
import {
  ARBEID_MS,
  erSpørsmål,
  sløyfe,
  type Lager,
} from "@/lib/vurdering-lager";

let dir: string;
const lager = (): Lager =>
  JSON.parse(readFileSync(path.join(dir, "media-vurdering.json"), "utf8"));
const req = (url: string, body: unknown, agent = true) =>
  new NextRequest(`http://lan${url}`, {
    method: "POST",
    headers: {
      ...(agent ? { authorization: "Bearer parenttoken1" } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
const ID = "dag/17/tekster";
const dom = (notat: string, vurdering = "ok") =>
  vurderingPOST(req("/api/media/vurdering", { path: ID, vurdering, notat }));

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "sloyfe-"));
  process.env.MEDIA_DIR = dir;
  process.env.NISSEKOMM_MODE = "lan";
  process.env.MCP_DEV_TOKEN = "read:readtoken1,parent:parenttoken1";
  jest.spyOn(process, "cwd").mockReturnValue(dir);
});
afterEach(() => {
  jest.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

it("erSpørsmål: ends with ? or starts with a question word", () => {
  expect(erSpørsmål("Kan dette bli kortere?")).toBe(true);
  expect(erSpørsmål("hvorfor er han blå")).toBe(true);
  expect(erSpørsmål("For lang. Kutt slutten")).toBe(false);
  expect(erSpørsmål(undefined)).toBe(false);
});

it("erSpørsmål: Hans' real notes, English and modal verbs", () => {
  for (const q of [
    'automat? should this be "robot" instead',
    'Hæ? "I natt fanget den…"?',
    '"I dag er det 2. advent" ?',
    '"Orakelet vil ha meg i vinduet" what does this mean?',
    "Må dette være så langt",
    "should we cut it",
    '"Kan" dette sies sånn',
  ])
    expect([q, erSpørsmål(q)]).toEqual([q, true]);
  for (const n of [
    '"Sier man det?"',
    "Bytt til «Sier man det?» i linje 2",
    "For lang. Kutt slutten",
    "Måneskinn er for lyst",
    "Island er fint",
  ])
    expect([n, erSpørsmål(n)]).toEqual([n, false]);
  // old approved notes keep the old rule
  expect(erSpørsmål("Må dette kuttes", false)).toBe(false);
  expect(erSpørsmål("Hvorfor blå", false)).toBe(true);
});

describe("svar", () => {
  it("validates id and tekst", async () => {
    for (const body of [
      { id: "dag/99/kveld", tekst: "x" },
      { id: "../x", tekst: "x" },
      { id: ID, tekst: "" },
      { id: ID, tekst: "x".repeat(2001) },
    ])
      expect((await svarPOST(req("/api/media/svar", body))).status).toBe(400);
  });

  it("a question opens, a reply closes it and waits until seen", async () => {
    await dom("Hvorfor sier han «snart»?", "godkjent");
    expect(Object.keys(sløyfe(lager()).spørsmål)).toEqual([ID]);
    const r = await svarPOST(
      req("/api/media/svar", { id: ID, tekst: "Fordi dag 18.", av: "manus" }),
    );
    expect(r.status).toBe(200);
    const s = sløyfe(lager());
    expect(s.spørsmål).toEqual({});
    expect(s.svar[ID]).toMatchObject({ nytt: true, fil: ID });
    expect(s.svar[ID].tråd[0]).toMatchObject({
      tekst: "Fordi dag 18.",
      av: "agent:manus",
    });
    // Hans opens the item.
    await svarPOST(req("/api/media/svar", { id: ID, sett: true }));
    expect(sløyfe(lager()).svar[ID].nytt).toBe(false);
    const h = (await historikk(dir, ID)).map((x) => x.tekst).join("\n");
    expect(h).toContain("svar fra agent:manus: Fordi dag 18.");
  });

  it("a new verdict marks replies seen; Hans can close a question", async () => {
    await dom("Hva betyr dette");
    await svarPOST(req("/api/media/svar", { id: ID, tekst: "Se dag 3" }));
    await dom("Hvem er det?");
    const s = sløyfe(lager());
    expect(s.svar[ID].nytt).toBe(false);
    expect(s.spørsmål[ID].notat).toBe("Hvem er det?");
    await svarPOST(req("/api/media/svar", { id: ID, lukk: true }));
    expect(sløyfe(lager()).spørsmål).toEqual({});
  });
});

describe("arbeid", () => {
  it("sets, goes «stoppet?» after 2 h and ends with ferdig", async () => {
    expect(
      (await arbeidPOST(req("/api/media/arbeid", { id: ID, hva: "" }))).status,
    ).toBe(400);
    await arbeidPOST(
      req("/api/media/arbeid", { id: ID, hva: "skriver om", av: "manus" }),
    );
    const a = lager().elementer[ID].arbeid!;
    expect(a).toMatchObject({ av: "agent:manus", hva: "skriver om" });
    expect(sløyfe(lager()).arbeid[ID].stoppet).toBeUndefined();
    expect(
      sløyfe(lager(), Date.parse(a.når) + ARBEID_MS + 1).arbeid[ID].stoppet,
    ).toBe(true);
    await arbeidPOST(req("/api/media/arbeid", { id: ID, ferdig: true }));
    expect(lager().elementer[ID].arbeid).toBeUndefined();
  });
});

describe("MCP", () => {
  it("svar, arbeid, list SPØRSMÅL first and regler", async () => {
    await dom("Hvorfor?");
    const liste = String(await callTool("parent", "list_vurderinger", {}));
    expect(liste.split("\n")[1]).toMatch(/^SPØRSMÅL/);
    expect(liste).toContain(`${ID} | `);
    await callTool("parent", "svar_vurdering", {
      id: ID,
      tekst: "Fordi.",
      av: "a",
    });
    expect(
      String(await callTool("parent", "list_vurderinger", {})),
    ).not.toContain("SPØRSMÅL");
    await callTool("parent", "arbeid_vurdering", { id: ID, hva: "x", av: "a" });
    expect(lager().elementer[ID].arbeid?.av).toBe("agent:a");
    await expect(
      callTool("parent", "svar_vurdering", { id: ID, tekst: "" }),
    ).rejects.toThrow();
    await expect(
      callTool("read", "svar_vurdering", { id: ID, tekst: "x" }),
    ).rejects.toThrow();

    process.env.LAERDOM_FIL = path.join(dir, "laerdom.json");
    writeFileSync(
      process.env.LAERDOM_FIL,
      JSON.stringify({
        regler: [
          {
            type: "bilde",
            regel: "unngå: tekst i bildet",
            kilder: [],
            dato: "",
            aktiv: true,
          },
          { type: "bilde", regel: "av", kilder: [], dato: "", aktiv: false },
        ],
        avvist: [],
      }),
    );
    const r = String(
      await callTool("parent", "regler_vurdering", { type: "bilde" }),
    );
    delete process.env.LAERDOM_FIL;
    expect(r).toContain("- tekst i bildet");
    expect(r).not.toContain("- av");
    await expect(
      callTool("parent", "regler_vurdering", { type: "tull" }),
    ).rejects.toThrow();
  });
});

describe("køen", () => {
  const liste: Element[] = [
    { id: ID, gruppe: "tekster", tittel: "Tekster 17", dag: 17, media: [] },
  ];
  const server = (s: Partial<KoServer>): KoServer => ({
    forbruk: { brukt: 0, igjen: 1, budsjett: 1, fra: "2026-11-13" },
    duplikater: [],
    jobber: {},
    manus: {},
    ...s,
  });
  const k = {
    filer: [],
    vurderinger: { [ID]: { vurdering: "godkjent" as const } },
  };

  it("reply, question and work each get their line", () => {
    const ko = byggKo(
      liste,
      k,
      server({
        svar: {
          [ID]: {
            fil: ID,
            nytt: true,
            tråd: [{ fil: ID, tekst: "Svar", av: "agent:a", når: "x" }],
          },
        },
        spørsmål: { [ID]: { fil: ID, notat: "Hvorfor?", når: "x" } },
        arbeid: {
          [ID]: {
            fil: ID,
            av: "agent:a",
            hva: "skriver",
            når: "2026-11-13T13:32:00Z",
            stoppet: true,
          },
        },
      }),
    );
    expect(ko.venter.find((l) => l.hva === "Svar fra agent")?.notat).toBe(
      "Svar",
    );
    expect(ko.agent.some((l) => l.hva === "Spørsmål fra Hans: Hvorfor?")).toBe(
      true,
    );
    expect(ko.arbeid[0]).toMatchObject({
      id: ID,
      feil: true,
      hva: "a · skriver · stoppet?",
    });
  });

  it("Lærdom: the same note 3 times on a type is «gjentatt»", () => {
    const bilder = [1, 2, 3, 4].map((d) => `bilder/dag-0${d}.png`);
    const ko = byggKo(
      [],
      {
        filer: [],
        vurderinger: Object.fromEntries(
          bilder.map((b, i) => [
            b,
            { vurdering: "ok" as const, notat: i < 3 ? "For mørkt!" : "annet" },
          ]),
        ),
      },
      server({}),
    );
    const g = Object.fromEntries(ko.laerdom.map((l) => [l.id, l.gjentatt]));
    expect(g[bilder[0]]).toBe(3);
    expect(g[bilder[3]]).toBeUndefined();
  });
});

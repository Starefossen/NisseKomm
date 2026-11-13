/** @jest-environment node */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as prioritetPOST } from "@/app/api/media/prioritet/route";
import { POST as vurderingPOST } from "@/app/api/media/vurdering/route";
import { callTool } from "@/lib/mcp/tools";
import { historikk } from "@/lib/historikk";
import {
  byggKo,
  type KoServer,
  type Linje,
} from "@/app/nissemor-guide/gjennomgang/ko";
import type { Element } from "@/app/nissemor-guide/gjennomgang/elementer";
import type { Prioritet } from "@/lib/vurdering-lager";

let dir: string;
const lager = () =>
  JSON.parse(readFileSync(path.join(dir, "media-vurdering.json"), "utf8"));
const req = (url: string, body: unknown) =>
  new NextRequest(`http://lan${url}`, {
    method: "POST",
    headers: {
      authorization: "Bearer parenttoken1",
      "x-agent": "manus",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "prioritet-"));
  process.env.MEDIA_DIR = dir;
  process.env.NISSEKOMM_MODE = "lan";
  process.env.MCP_DEV_TOKEN = "read:readtoken1,parent:parenttoken1";
  jest.spyOn(process, "cwd").mockReturnValue(dir);
});
afterEach(() => {
  jest.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

describe("POST /api/media/prioritet", () => {
  it("validates id, nivaa, grunn and frist", async () => {
    for (const body of [
      { id: "dag/99/kveld", grunn: "x" },
      { id: "../x", grunn: "x" },
      { id: "dag/17/tekster", grunn: "" },
      { id: "dag/17/tekster", grunn: "x", nivaa: "lav" },
      { id: "dag/17/tekster", grunn: "x", frist: "snart" },
    ])
      expect(
        (await prioritetPOST(req("/api/media/prioritet", body))).status,
      ).toBe(400);
  });

  it("sets with `av`, logs history, and a verdict closes it", async () => {
    const id = "dag/17/tekster";
    const r = await prioritetPOST(
      req("/api/media/prioritet", {
        id,
        nivaa: "hast",
        grunn: "før video",
        frist: "2026-11-20",
      }),
    );
    expect(r.status).toBe(200);
    expect(lager().elementer[id].prioritet).toMatchObject({
      nivaa: "hast",
      av: "agent:manus",
      frist: "2026-11-20",
    });
    // A note alone is no verdict: the priority stays.
    await vurderingPOST(req("/api/media/vurdering", { path: id, notat: "hm" }));
    expect(lager().elementer[id].prioritet).toBeDefined();
    const dom = await vurderingPOST(
      req("/api/media/vurdering", { path: id, vurdering: "godkjent" }),
    );
    expect(await dom.text()).toContain("ok");
    expect(lager().elementer[id].prioritet).toBeUndefined();
    const h = (await historikk(dir, id)).map((x) => x.tekst).join("\n");
    expect(h).toContain("prioritet satt (hast) av agent:manus: før video");
    expect(h).toContain("prioritet lukket av dom");
  });
});

describe("MCP prioriter_vurdering", () => {
  it("sets, removes and rejects bad input", async () => {
    const id = "manus/julius/dag-17#s1";
    await callTool("parent", "prioriter_vurdering", {
      id,
      grunn: "blokkerer video",
      av: "x",
    });
    expect(lager().elementer[id].prioritet).toMatchObject({
      nivaa: "høy",
      av: "agent:x",
    });
    await callTool("parent", "prioriter_vurdering", {
      id,
      fjern: true,
      av: "x",
    });
    expect(lager().elementer[id].prioritet).toBeUndefined();
    await expect(
      callTool("parent", "prioriter_vurdering", { id }),
    ).rejects.toThrow();
    await expect(
      callTool("read", "prioriter_vurdering", { id, grunn: "x" }),
    ).rejects.toThrow();
  });
});

describe("køen", () => {
  const liste: Element[] = [2, 5, 9].map((d) => ({
    id: `dag/0${d}/kveld`,
    gruppe: "oppsett",
    tittel: `Dag ${d}`,
    dag: d,
    media: [],
  }));
  const p = (fil: string, nivaa: Prioritet["nivaa"]): Prioritet => ({
    fil,
    nivaa,
    grunn: "g",
    av: "agent:a",
    når: "2026-11-13",
  });
  const server = (prioriteter: KoServer["prioriteter"]): KoServer => ({
    forbruk: { brukt: 0, igjen: 1, budsjett: 1, fra: "2026-11-13" },
    duplikater: [],
    jobber: {},
    manus: {},
    prioriteter,
  });
  const ider = (l: Linje[]) => l.map((x) => x.id);

  it("puts hast, then høy, before the day order; none = day order", () => {
    const k = { filer: [], vurderinger: {} };
    expect(ider(byggKo(liste, k, server({})).venter)).toEqual([
      "dag/02/kveld",
      "dag/05/kveld",
      "dag/09/kveld",
    ]);
    const ko = byggKo(
      liste,
      k,
      server({
        "dag/05/kveld": p("dag/05/kveld", "høy"),
        "dag/09/kveld": p("dag/09/kveld", "hast"),
      }),
    );
    expect(ider(ko.venter)).toEqual([
      "dag/09/kveld",
      "dag/05/kveld",
      "dag/02/kveld",
    ]);
    expect(ko.venter[0].prioritet?.nivaa).toBe("hast");
  });
});

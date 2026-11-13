/** @jest-environment node */
import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { memoryStore } from "@/lib/db";
import { callTool } from "@/lib/mcp/tools";
import { GET, POST } from "@/app/api/beslutninger/route";
import { byggKo } from "@/app/nissemor-guide/gjennomgang/ko";

let rot: string;
const md = () => readFileSync(path.join(rot, "docs/beslutninger.md"), "utf8");
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const parent = { cookie: "__Host-nissekomm-guide=parent" };
const post = (body: unknown, h: Record<string, string> = parent) =>
  POST(
    new NextRequest("http://lan/api/beslutninger", {
      method: "POST",
      headers: { "content-type": "application/json", ...h },
      body: JSON.stringify(body),
    }),
  );
const ny = {
  sporsmal: "Bytte PS dag 17?",
  kontekst: "Står mot 85,0.",
  valg: ["Bytt", "Behold"],
  anbefalt: 0,
  lenker: ["dag/17/tekster"],
};

beforeEach(async () => {
  rot = mkdtempSync(path.join(tmpdir(), "beslutn-"));
  mkdirSync(path.join(rot, "docs"));
  writeFileSync(path.join(rot, "docs/beslutninger.md"), "# Beslutninger\n");
  jest.spyOn(process, "cwd").mockReturnValue(rot);
  process.env.NISSEKOMM_MODE = "lan";
  process.env.MCP_DEV_TOKEN = "parent:parenttoken1";
  memoryStore.reset();
  for (const role of ["kid", "parent"] as const)
    await memoryStore.setSession(sha(role), {
      role,
      expires: Date.now() + 60_000,
    });
});
afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.NISSEKOMM_MODE;
  rmSync(rot, { recursive: true });
});

describe("beslutninger", () => {
  it("round trip: an agent opens one, the queue shows it, Hans answers, beslutninger.md gets the line", async () => {
    expect(
      await callTool("parent", "opprett_beslutning", { ...ny, av: "test" }),
    ).toContain("beslutning/bytte-ps-dag-17");
    const liste = await callTool("parent", "list_beslutninger");
    expect(liste).toContain("1★. Bytt");
    const ko = byggKo(
      [],
      { filer: [], inventar: new Map(), vurderinger: {} } as never,
      {
        forbruk: { brukt: 0, igjen: 0, budsjett: 0, fra: "2026-11-13" },
        duplikater: [],
        jobber: {},
        manus: {},
        beslutninger: JSON.parse(
          await (
            await GET(
              new NextRequest("http://lan/api/beslutninger", {
                headers: parent,
              }),
            )
          ).text(),
        ),
      },
    );
    expect(ko.venter[0]).toMatchObject({
      id: "beslutning/bytte-ps-dag-17",
      prioritet: { nivaa: "høy" },
    });

    // An agent cannot answer for Hans.
    expect(
      (
        await post(
          { id: "beslutning/bytte-ps-dag-17", valg: 0 },
          { authorization: "Bearer parenttoken1" },
        )
      ).status,
    ).toBe(403);
    const r = await post({
      id: "beslutning/bytte-ps-dag-17",
      valg: 1,
      hvorfor: "Linjen er fin.",
    });
    expect(r.status).toBe(200);
    expect((await r.json()).beslutning.svar).toMatchObject({
      valg: 1,
      av: "hans",
    });
    expect(md()).toMatch(
      /## Besvart i Gjennomgang\n\n- \d{4}-\d\d-\d\d: Bytte PS dag 17\? Svar: Behold Hvorfor: Linjen er fin\.\n$/,
    );
    expect(await callTool("parent", "list_beslutninger")).toBe(
      "ingen beslutninger",
    );
    expect(
      await callTool("parent", "list_beslutninger", { status: "alle" }),
    ).toContain("besvart");
    // Twice is refused and the md gets no second line.
    expect(
      (await post({ id: "beslutning/bytte-ps-dag-17", valg: 0 })).status,
    ).toBe(400);
    expect(md().match(/Svar:/g)).toHaveLength(1);
  });

  it("validates", async () => {
    for (const b of [
      { ...ny, valg: ["bare én"] },
      { ...ny, valg: ["a", "b", "c", "d", "e"] },
      { ...ny, anbefalt: 2 },
      { ...ny, sporsmal: "" },
      { ...ny, kontekst: 3 },
    ])
      expect((await post(b)).status).toBe(400);
    expect((await post(ny)).status).toBe(200);
    expect((await post(ny)).status).toBe(400); // same slug
    expect(
      (await post({ id: "beslutning/bytte-ps-dag-17", valg: 5 })).status,
    ).toBe(400);
    expect((await post({ id: "beslutning/finnes-ikke", valg: 0 })).status).toBe(
      400,
    );
    await expect(
      callTool("parent", "opprett_beslutning", { valg: [] }),
    ).rejects.toThrow(/ugyldig argument/);
    // Kid session and public mode are shut out.
    expect((await post(ny, { cookie: "__Host-nissekomm=kid" })).status).toBe(
      403,
    );
    process.env.NISSEKOMM_MODE = "public";
    expect((await post(ny)).status).toBe(404);
  });

  it("a priority with no queue line of its own gets one, with its reason", () => {
    const ko = byggKo(
      [],
      { filer: [], inventar: new Map(), vurderinger: {} } as never,
      {
        forbruk: { brukt: 0, igjen: 0, budsjett: 0, fra: "2026-11-13" },
        duplikater: [],
        jobber: {},
        manus: {},
        prioriteter: {
          "video/julius/dag-23": {
            fil: "video/julius/dag-23#s5",
            nivaa: "høy",
            grunn: "lytt: låst brikke, mishøring?",
            av: "agent:test",
            når: "2026-11-13T12:00:00.000Z",
          },
        },
      },
    );
    expect(ko.venter).toEqual([
      expect.objectContaining({ seg: 5, hva: "lytt: låst brikke, mishøring?" }),
    ]);
  });
});

/** @jest-environment node */
import { beforeEach, expect, jest, test } from "@jest/globals";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { authorizeMedia, createUploadTicket } from "../media-server";
import { memoryStore } from "../db";
import { callTool } from "../mcp/tools";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const P = "video/julius/dag-01.mp4";

const req = (headers: Record<string, string> = {}, query = "") =>
  new NextRequest(`http://lan/api/media/${P}${query}`, { headers });

const status = async (r: NextRequest, rel?: string) =>
  (await authorizeMedia(r, rel))?.status ?? 200;

beforeEach(async () => {
  memoryStore.reset();
  process.env.NISSEKOMM_MODE = "lan";
  process.env.MCP_DEV_TOKEN = "read:readtoken1,parent:parenttoken1";
  for (const role of ["kid", "parent"] as const) {
    await memoryStore.setSession(sha(role), {
      role,
      expires: Date.now() + 60_000,
    });
  }
});

test("needs a parent cookie or parent bearer", async () => {
  expect(await status(req())).toBe(401);
  expect(await status(req({ cookie: "__Host-nissekomm=kid" }))).toBe(403);
  expect(await status(req({ cookie: "__Host-nissekomm-guide=parent" }))).toBe(
    200,
  );
  expect(await status(req({ authorization: "Bearer parenttoken1" }))).toBe(200);
  expect(await status(req({ authorization: "Bearer readtoken1" }))).toBe(403);
  expect(await status(req({ authorization: "Bearer nope-nope" }))).toBe(401);
});

test("public mode hides it", async () => {
  process.env.NISSEKOMM_MODE = "public";
  expect(await status(req({ authorization: "Bearer parenttoken1" }))).toBe(404);
});

test("ticket is single-use and bound to its path", async () => {
  const t = await createUploadTicket(P);
  const other = "video/julius/dag-02.mp4";
  expect(await status(req({}, `?ticket=${t}`), other)).toBe(403);
  const t2 = await createUploadTicket(P);
  expect(await status(req({}, `?ticket=${t2}`), P)).toBe(200);
  expect(await status(req({}, `?ticket=${t2}`), P)).toBe(403);
  // A ticket does not authorize the list endpoint.
  const t3 = await createUploadTicket(P);
  expect(await status(req({}, `?ticket=${t3}`))).toBe(401);
  await expect(createUploadTicket("../x.mp4")).rejects.toThrow();
});

test("ticket expires after 10 minutes", async () => {
  const t = await createUploadTicket(P);
  const now = Date.now();
  const spy = jest.spyOn(Date, "now").mockReturnValue(now + 10 * 60_000 + 1);
  expect(await status(req({}, `?ticket=${t}`), P)).toBe(403);
  spy.mockRestore();
});

test("upload_asset is parent-only; list_assets is read", async () => {
  await expect(callTool("read", "upload_asset", { path: P })).rejects.toThrow(
    "Ukjent verktøy",
  );
  const out = JSON.parse(await callTool("parent", "upload_asset", { path: P }));
  expect(out.url).toMatch(new RegExp(`^/api/media/${P}\\?ticket=`));
  const list = JSON.parse(await callTool("read", "list_assets"));
  expect(list.find((m: { path: string }) => m.path === P)).toBeDefined();
});

test("promo and strek under /media are parent-only", async () => {
  const { GET } = await import("../../app/media/[...path]/route");
  const get = async (p: string, cookie?: string) =>
    (
      await GET(
        new NextRequest(`http://lan/media/${p}`, {
          headers: cookie ? { cookie } : {},
        }),
        { params: Promise.resolve({ path: p.split("/") }) },
      )
    ).status;
  for (const p of ["promo/julius-promo-A.mp4", "strek/dag01.png"]) {
    expect(await get(p)).toBe(401);
    expect(await get(p, "__Host-nissekomm=kid")).toBe(403);
    expect(await get(p, "nissekomm=kid")).toBe(403);
  }
});

test("encoded paths cannot dodge the parent-only check", async () => {
  const { GET } = await import("../../app/media/[...path]/route");
  const get = async (seg: string[]) =>
    (
      await GET(new NextRequest("http://lan/media/x"), {
        params: Promise.resolve({ path: seg }),
      })
    ).status;
  const varianter = [
    ["strek%2Fdag01.png"],
    ["strek%2fdag01.png"],
    ["strek/dag01.png"],
    ["STREK", "dag01.png"],
    ["strek%5Cdag01.png"],
    ["strek%252Fdag01.png"],
    ["video", "..%2Fstrek", "dag01.png"],
    ["video", "..", "promo", "julius-promo-A.mp4"],
    ["_arkiv%2Fx.mp4"],
  ];
  for (const mode of ["lan", "public"]) {
    process.env.NISSEKOMM_MODE = mode;
    // lan: 401 proves the check ran (a bypass would reach the file lookup, 404).
    const ok = mode === "lan" ? [400, 401] : [400, 404];
    for (const v of varianter) expect(ok).toContain(await get(v));
  }
});

test("only exact kid folders are open; folded names and symlinks are not", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } =
    await import("node:fs");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const dir = mkdtempSync(path.join(tmpdir(), "media-"));
  mkdirSync(path.join(dir, "strek"));
  mkdirSync(path.join(dir, "audio"));
  writeFileSync(path.join(dir, "strek", "dag01.png"), "x");
  writeFileSync(path.join(dir, "audio", "a.mp3"), "x");
  symlinkSync(path.join(dir, "strek"), path.join(dir, "audio", "lenke"));
  process.env.MEDIA_DIR = dir;
  const { GET } = await import("../../app/media/[...path]/route");
  const get = async (seg: string[], cookie?: string) =>
    (
      await GET(
        new NextRequest("http://lan/media/x", {
          headers: cookie ? { cookie } : {},
        }),
        { params: Promise.resolve({ path: seg }) },
      )
    ).status;
  try {
    for (const mode of ["lan", "public"]) {
      process.env.NISSEKOMM_MODE = mode;
      const nei = mode === "lan" ? 401 : 404;
      expect(await get(["audio", "a.mp3"])).toBe(200);
      for (const seg of [
        ["%C5%BFtrek", "dag01.png"],
        ["%EF%AC%86rek", "dag01.png"],
        ["Audio", "a.mp3"],
        ["audio", "lenke", "dag01.png"],
      ]) {
        expect(await get(seg)).toBe(nei);
      }
    }
    process.env.NISSEKOMM_MODE = "lan";
    expect(
      await get(
        ["audio", "lenke", "dag01.png"],
        "__Host-nissekomm-guide=parent",
      ),
    ).toBe(200);
  } finally {
    delete process.env.MEDIA_DIR;
  }
});

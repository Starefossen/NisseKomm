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
  expect(await status(req({ cookie: "__Host-nissekomm=parent" }))).toBe(200);
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

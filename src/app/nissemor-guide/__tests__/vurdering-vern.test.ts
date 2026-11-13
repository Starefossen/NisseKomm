/** @jest-environment node */
/** Fable r3 #5/#7/#8: no verdict on a missing file, a stale view gets 409, and who saved it is kept. */
import { describe, it, expect, jest, beforeAll } from "@jest/globals";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

jest.mock("@/lib/media-server", () => ({
  ...jest.requireActual<object>("@/lib/media-server"),
  authorizeMedia: async () => null,
}));

let dir: string;
const post = async (body: object, headers: Record<string, string> = {}) => {
  const { POST } = await import("@/app/api/media/vurdering/route");
  return POST(
    new Request("http://x/api/media/vurdering", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }) as never,
  );
};

describe("vurderingsvern", () => {
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "vurd-vern-"));
    process.env.MEDIA_DIR = dir;
    await mkdir(path.join(dir, "strek"), { recursive: true });
    await writeFile(path.join(dir, "strek/dag01.png"), "a");
  });

  it("nekter vurdering på en fil som ikke finnes", async () => {
    const r = await post({
      path: "spill/retro/mangler.png",
      vurdering: "godkjent",
    });
    expect(r.status).toBe(400);
    expect(await r.text()).toBe("filen finnes ikke");
  });

  it("409 når innholdet er endret siden siden viste det", async () => {
    const { GET } = await import("@/app/api/media/vurdering/route");
    const { versjon } = (await (
      await GET(new Request("http://x/?versjon=strek/dag01.png") as never)
    ).json()) as { versjon: string };
    expect(versjon).toMatch(/^1-\d+$/);
    await writeFile(path.join(dir, "strek/dag01.png"), "bb");
    const r = await post({
      path: "strek/dag01.png",
      vurdering: "godkjent",
      versjon,
    });
    expect(r.status).toBe(409);
    expect(await r.text()).toMatch(/last på nytt/);
  });

  it("husker hvem: økt = hans, Bearer = agent:<navn>", async () => {
    const a = await post({ path: "strek/dag01.png", vurdering: "ok" });
    expect(((await a.json()) as { entry: { av: string } }).entry.av).toBe(
      "hans",
    );
    const b = await post(
      { path: "strek/dag01.png", vurdering: "godkjent" },
      { authorization: "Bearer x", "x-agent": "r3b" },
    );
    expect(((await b.json()) as { entry: { av: string } }).entry.av).toBe(
      "agent:r3b",
    );
  });
});

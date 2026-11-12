import { describe, it, expect } from "@jest/globals";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { taIBruk } from "./media-promote";

async function oppsett(vurd: Record<string, unknown>) {
  const dir = await mkdtemp(path.join(tmpdir(), "ta-i-bruk-"));
  const j = path.join(dir, "video/julius");
  await mkdir(j, { recursive: true });
  for (const f of [
    "dag-01.mp4",
    "dag-01.mp4.meta.json",
    "dag-01.jpg",
    "dag-01.old-1.mp4",
    "dag-01-v4.mp4",
    "dag-01-v4.mp4.meta.json",
    "dag-01-v4.jpg",
  ])
    await writeFile(path.join(j, f), f);
  await writeFile(path.join(dir, "media-vurdering.json"), JSON.stringify(vurd));
  await writeFile(
    path.join(dir, "media-inventar.json"),
    JSON.stringify([
      { path: "video/julius/dag-01.mp4", status: "current", reasons: [] },
      { path: "video/julius/dag-01-v4.mp4", status: "kandidat", reasons: [] },
    ]),
  );
  return { dir, j };
}

describe("taIBruk", () => {
  it("flytter i bruk til .old-N og kandidaten til det rene navnet", async () => {
    const { dir, j } = await oppsett({
      "video/julius/dag-01.mp4": { notat: "munn" },
      "video/julius/dag-01-v4.mp4": { vurdering: "godkjent" },
    });
    await taIBruk(dir, "video/julius/dag-01-v4.mp4");
    const les = (f: string) => readFile(path.join(j, f), "utf8");
    expect(await les("dag-01.mp4")).toBe("dag-01-v4.mp4");
    expect(await les("dag-01.mp4.meta.json")).toBe("dag-01-v4.mp4.meta.json");
    expect(await les("dag-01.jpg")).toBe("dag-01-v4.jpg");
    expect(await les("dag-01.old-2.mp4")).toBe("dag-01.mp4");
    expect(await les("dag-01.old-2.mp4.meta.json")).toBe(
      "dag-01.mp4.meta.json",
    );
    expect(await les("dag-01.old-2.jpg")).toBe("dag-01.jpg");
    expect(await les("dag-01.old-1.mp4")).toBe("dag-01.old-1.mp4");
    expect((await readdir(j)).filter((f) => f.includes("-v4"))).toEqual([]);
    const vurd = JSON.parse(
      await readFile(path.join(dir, "media-vurdering.json"), "utf8"),
    );
    expect(vurd).toEqual({
      "video/julius/dag-01.old-2.mp4": { notat: "munn" },
      "video/julius/dag-01.mp4": {
        vurdering: "godkjent",
        versjon: expect.stringMatching(/^13-\d+$/),
      },
    });
    const inv = JSON.parse(
      await readFile(path.join(dir, "media-inventar.json"), "utf8"),
    );
    expect(
      inv.map((r: { path: string; status: string }) => [r.path, r.status]),
    ).toEqual([
      ["video/julius/dag-01.old-2.mp4", "arkiv"],
      ["video/julius/dag-01.mp4", "unknown"], // sidecar is not JSON here
    ]);
    expect(
      await readFile(path.join(dir, "media-promoteringer.log"), "utf8"),
    ).toContain("dag-01-v4.mp4 -> video/julius/dag-01.mp4");
  });

  it("gir den tatt i bruk-filen riktig status med en gang", async () => {
    const { dir, j } = await oppsett({
      "video/julius/dag-01-v4.mp4": { vurdering: "godkjent" },
    });
    // The candidate's sidecar travels with it; its source is gone, so the file reads «utdatert».
    await writeFile(
      path.join(j, "dag-01-v4.mp4.meta.json"),
      JSON.stringify({
        generator: "julius-dag.py",
        created: "2026-11-12T00:00:00+00:00",
        source: { path: "docs/finnes-ikke.md", section: "Dag 1", sha256: "x" },
        reference_images: [],
      }),
    );
    await taIBruk(dir, "video/julius/dag-01-v4.mp4");
    const inv = JSON.parse(
      await readFile(path.join(dir, "media-inventar.json"), "utf8"),
    );
    const rad = inv.find(
      (r: { path: string }) => r.path === "video/julius/dag-01.mp4",
    );
    expect(rad.status).toBe("stale");
    expect(rad.reasons[0]).toContain("kilden finnes ikke lenger");
  });

  it("nekter en kandidat som ikke er godkjent, og rører ingenting", async () => {
    const { dir, j } = await oppsett({});
    const før = (await readdir(j)).sort();
    await expect(taIBruk(dir, "video/julius/dag-01-v4.mp4")).rejects.toThrow(
      "ikke godkjent",
    );
    expect((await readdir(j)).sort()).toEqual(før);
  });
});

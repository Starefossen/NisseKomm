/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  endreLager,
  flat,
  lesLager,
  migrer,
  settVurdering,
  visning,
  type Flat,
  type Lager,
} from "./vurdering-lager";
import { medVersjon } from "./vurdering-versjon";
import { celleAv, familie, type StatusKilde } from "./media-status";
import { mediaStatus } from "./media-server";

const antall = (l: Lager) =>
  Object.values(l.elementer).reduce(
    (n, e) => n + e.vurderinger.length + e.historikk.length,
    0,
  );

async function mappe(vurd: Flat) {
  const dir = await mkdtemp(path.join(tmpdir(), "vurd-lager-"));
  await mkdir(path.join(dir, "strek"), { recursive: true });
  await writeFile(path.join(dir, "strek/dag01.png"), "a");
  await writeFile(path.join(dir, "strek/dag01-v2.png"), "b");
  await writeFile(path.join(dir, "media-vurdering.json"), JSON.stringify(vurd));
  return dir;
}

describe("vurdering-lager (format 2)", () => {
  it("flytter format 1 én gang, med kopi i _arkiv, -vN i samme element", async () => {
    const dir = await mappe({
      "strek/dag01.png": { vurdering: "Lag på nytt", notat: "mørk" },
      "strek/dag01-v2.png": { vurdering: "godkjent" },
      "dag/01/fritt": { notat: "uten vurdering" },
    });
    const l = await lesLager(dir);
    expect(Object.keys(l.elementer).sort()).toEqual([
      "dag/01/fritt",
      "strek/dag01.png",
    ]);
    expect(antall(l)).toBe(3);
    expect(flat(l)["strek/dag01.png"].vurdering).toBe("lag_paa_nytt");
    const lagret = await readFile(
      path.join(dir, "media-vurdering.json"),
      "utf8",
    );
    expect(JSON.parse(lagret).format).toBe(2);
    // Idempotent: a second read changes nothing.
    await lesLager(dir);
    expect(await readFile(path.join(dir, "media-vurdering.json"), "utf8")).toBe(
      lagret,
    );
    const dato = new Date(Date.now()).toISOString().slice(0, 10);
    expect(
      existsSync(
        path.join(dir, "_arkiv", dato, "media-vurdering.format1.json"),
      ),
    ).toBe(true);
  });

  it("vurderingen hører til innholdet; overskrevet går til historikk", async () => {
    const dir = await mappe({});
    await endreLager(dir, (l) =>
      settVurdering(dir, l, "strek/dag01.png", { vurdering: "godkjent" }),
    );
    // Same bytes, new mtime: still approved.
    await writeFile(path.join(dir, "strek/dag01.png"), "a");
    let l = await lesLager(dir);
    expect((await visning(dir, l))["strek/dag01.png"].vurdering).toBe(
      "godkjent",
    );
    await writeFile(path.join(dir, "strek/dag01.png"), "cc");
    expect((await visning(dir, l))["strek/dag01.png"].forrige?.vurdering).toBe(
      "godkjent",
    );
    await endreLager(dir, (l) =>
      settVurdering(dir, l, "strek/dag01.png", {
        vurdering: "lag_paa_nytt",
        notat: "x",
      }),
    );
    await endreLager(dir, (l) => settVurdering(dir, l, "strek/dag01.png", {}));
    l = await lesLager(dir);
    expect(flat(l)["strek/dag01.png"]).toBeUndefined();
    expect(l.elementer["strek/dag01.png"].historikk).toHaveLength(2);
  });

  const ekte = process.env.MEDIA_DIR ?? path.join(process.cwd(), "public");
  const fil = path.join(ekte, "media-vurdering.json");
  const gammel = existsSync(fil)
    ? (JSON.parse(readFileSync(fil, "utf8")) as Flat)
    : null;
  // The acceptance test on the real store, read-only: verdicts in = out, no cell changes.
  (gammel && !("format" in gammel) ? it : it.skip)(
    "ekte data: alle vurderinger med, ingen celle endret",
    async () => {
      const før = await medVersjon(ekte, gammel!);
      const lager = await migrer(ekte, gammel!);
      const etter = await visning(ekte, lager);
      expect(antall(lager)).toBe(Object.keys(gammel!).length);
      const filer = await mediaStatus(ekte);
      const celler = (v: StatusKilde["vurderinger"]) => {
        const k: StatusKilde = { filer, vurderinger: v };
        return {
          id: Object.fromEntries(
            Object.keys(gammel!).map((id) => [id, celleAv(v[id])]),
          ),
          filer: Object.fromEntries(
            filer.map((f) => [f.path, familie(f.path, k).tekst]),
          ),
        };
      };
      expect(celler(etter)).toEqual(celler(før));
      console.log(
        `vurderinger: ${Object.keys(gammel!).length}, celler: ${Object.keys(gammel!).length + filer.length}`,
      );
    },
    600000,
  );
});

describe("segmentvurdering følger råklippet", () => {
  it("video/julius/dag-NN#sK gjelder så lenge råklippet er det samme, også i neste video", async () => {
    const dir = await mappe({});
    const j = path.join(dir, "video/julius");
    await mkdir(j, { recursive: true });
    const side = (raw: string) =>
      JSON.stringify([
        { s: 1, start: 0, slutt: 5, hash: "h", raw, replikk: "x", flagg: [] },
      ]);
    await writeFile(
      path.join(j, "dag-99-v2.segmenter.json"),
      side("aaaaaaaaaaaa"),
    );
    const id = "video/julius/dag-99#s1";
    await endreLager(dir, (l) =>
      settVurdering(dir, l, id, { vurdering: "godkjent" }),
    );
    // A new join (v3) that reused the take: still approved.
    await writeFile(
      path.join(j, "dag-99-v3.segmenter.json"),
      side("aaaaaaaaaaaa"),
    );
    expect((await visning(dir, await lesLager(dir)))[id].vurdering).toBe(
      "godkjent",
    );
    // A new take for the segment: the verdict becomes history.
    await new Promise((r) => setTimeout(r, 20));
    await writeFile(
      path.join(j, "dag-99-v4.segmenter.json"),
      side("bbbbbbbbbbbb"),
    );
    expect(
      (await visning(dir, await lesLager(dir)))[id].forrige?.vurdering,
    ).toBe("godkjent");
  });
});

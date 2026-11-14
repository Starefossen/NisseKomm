/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  medLås,
  endreLager,
  flat,
  lesLager,
  migrer,
  nyesteSegmenter,
  ryddAlltid,
  SESONG,
  settVurdering,
  utvidSnapshots,
  skrivbart,
  visning,
  type Flat,
  type Lager,
} from "./vurdering-lager";
import { HASH_VERSJON, medVersjon } from "./vurdering-versjon";
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

describe("fillås mot medie.py", () => {
  it("parallelle lagringer fra python og serveren mister ingenting", async () => {
    const { spawn } = await import("node:child_process");
    const dir = await mkdtemp(path.join(tmpdir(), "lås-"));
    const fil = path.join(dir, "media-vurdering.json");
    const py = `
import sys, time
sys.path.insert(0, "assets/bin")
import medie
from pathlib import Path
f = Path(sys.argv[1])
for i in range(25):
    with medie.lås(f):
        d = medie.les_lager(f) or {"format": 2, "sesong": 2026, "elementer": {}}
        time.sleep(0.004)
        d["elementer"][f"py{i}"] = {"vurderinger": [{"fil": f"py{i}", "hash": "*", "notat": "x"}], "historikk": []}
        medie.skriv_lager(f, d)
`;
    const python = new Promise<number | null>((ok) =>
      spawn("python3", ["-c", py, fil], { stdio: "inherit" }).on("exit", ok),
    );
    for (let i = 0; i < 25; i++)
      await endreLager(dir, async (l) => {
        await new Promise((r) => setTimeout(r, 4));
        await settVurdering(dir, l, `ts${i}`, { notat: "x" });
      });
    expect(await python).toBe(0);
    const ider = Object.keys((await lesLager(dir)).elementer);
    expect(ider.filter((k) => k.startsWith("py"))).toHaveLength(25);
    expect(ider.filter((k) => k.startsWith("ts"))).toHaveLength(25);
    expect(existsSync(`${fil}.lock`)).toBe(false);
  }, 30_000);
});

describe("medLås", () => {
  it("removes a lock left over 30 s ago, like medie.lås", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lås-"));
    const fil = path.join(dir, "media-vurdering.json");
    await writeFile(`${fil}.lock`, "");
    const gammel = (Date.now() - 31_000) / 1000;
    await utimes(`${fil}.lock`, gammel, gammel);
    expect(await medLås(fil, async () => "ok")).toBe("ok");
    expect(existsSync(`${fil}.lock`)).toBe(false);
  });

  it("waits on a fresh lock and gives up", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "lås-"));
    const fil = path.join(dir, "media-vurdering.json");
    await writeFile(`${fil}.lock`, "");
    await expect(medLås(fil, async () => "ok")).rejects.toThrow("er låst");
    expect(existsSync(`${fil}.lock`)).toBe(true);
  }, 15_000);
});

describe("nyesteSegmenter", () => {
  it("reads the newest candidate's flags, not only the plain name's", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "nyeste-seg-"));
    const j = path.join(dir, "video/julius");
    await mkdir(j, { recursive: true });
    const seg = (flagg: string[]) => JSON.stringify([{ s: 1, flagg }]);
    await writeFile(path.join(j, "dag-06.segmenter.json"), seg([]));
    await writeFile(path.join(j, "dag-06-v2.segmenter.json"), seg(["a"]));
    await writeFile(path.join(j, "dag-06-v10.segmenter.json"), seg(["ny"]));
    await writeFile(path.join(j, "dag-06.old-3.segmenter.json"), seg(["gml"]));
    await writeFile(path.join(j, "dag-16-v11.segmenter.json"), seg(["x"]));
    expect(await nyesteSegmenter(dir, 6)).toEqual([{ s: 1, flagg: ["ny"] }]);
    expect(await nyesteSegmenter(dir, 7)).toEqual([]);
  });
});

describe("fable r3: «*» og eldre kode", () => {
  it("settVurdering nekter en mediefil som mangler (ellers hash «*», godkjent for alltid)", async () => {
    const dir = await mappe({});
    const l: Lager = { format: 2, sesong: 2026, elementer: {} };
    await expect(
      settVurdering(dir, l, "spill/retro/x.png", { vurdering: "godkjent" }),
    ).rejects.toThrow("filen finnes ikke");
  });

  it("ryddAlltid: fil nå → ny versjon, fil borte → historikk, tekster får hash", async () => {
    const dir = await mappe({});
    await mkdir(path.join(dir, "spill/retro"), { recursive: true });
    await writeFile(path.join(dir, "spill/retro/kom.png"), "senere");
    const v = (fil: string) => ({
      vurderinger: [
        {
          hash: "*",
          fil,
          vurdering: "godkjent",
          oppdatert: "2026-11-13T12:00:00Z",
        },
      ],
      historikk: [],
    });
    const l: Lager = {
      format: 2,
      sesong: 2026,
      elementer: {
        "spill/retro/kom.png": v("spill/retro/kom.png"),
        "spill/retro/borte.png": v("spill/retro/borte.png"),
        "dag/01/tekster": v("dag/01/tekster"),
        "dag/02/tekster": v("dag/02/tekster"),
      },
    };
    const uendret = async () => uendretSvar.shift()!;
    const uendretSvar = [true, false];
    expect(await ryddAlltid(dir, l, uendret)).toEqual({
      nyVersjon: 2,
      fjernet: 1,
      restemplet: 1,
    });
    const vis = await visning(dir, l);
    expect(vis["spill/retro/kom.png"].vurdering).toBeUndefined();
    expect(vis["spill/retro/borte.png"]).toBeUndefined();
    expect(l.elementer["spill/retro/borte.png"].historikk).toHaveLength(1);
    expect(vis["dag/01/tekster"].vurdering).toBe("godkjent");
    expect(l.elementer["dag/01/tekster"].vurderinger[0].hash).toMatch(
      /^[0-9a-f]{12}$/,
    );
    expect(vis["dag/02/tekster"].vurdering).toBeUndefined();
    // Idempotent.
    expect(await ryddAlltid(dir, l, uendret)).toEqual({
      nyVersjon: 0,
      fjernet: 0,
      restemplet: 0,
    });
  });

  it("manus/julius/dag-NN med «*» går til historikk (dagnivå erstattet av segmenter)", async () => {
    const dir = await mappe({});
    const id = "manus/julius/dag-15";
    const l: Lager = {
      format: 2,
      sesong: 2026,
      elementer: {
        [id]: {
          vurderinger: [{ hash: "*", fil: id, vurdering: "godkjent" }],
          historikk: [],
        },
      },
    };
    await ryddAlltid(dir, l);
    expect(l.elementer[id].vurderinger).toHaveLength(0);
    expect(l.elementer[id].historikk[0].merknad).toBe(
      "dagnivå erstattet av segmenter",
    );
    await ryddAlltid(dir, l);
    expect(l.elementer[id].historikk).toHaveLength(1);
  });

  it("utvidSnapshots: avklippet snapshot blir hele dagsblokken når utsnittet stemmer nøyaktig", async () => {
    const { øyeblikkTekst, utsnitt } = await import("./vurdering-versjon");
    const { seksjon } = await import("./guide-sesong");
    const { dagBlokk } = await import("./guide-innhold");
    const { default: bakt } = await import("@/data/guide-innhold.json");
    const gaater = (bakt as Record<string, string>)["docs/gaater-2026.md"];
    const blokk = dagBlokk(seksjon(gaater, "Dag for dag"), 1);
    // The bake at the verdict's time had one more field, which kveld does not show.
    const gammel = blokk.replace("\n", "\n- **Oppsettskisse:** gammel\n");
    const gammelMd = gaater.replace(blokk, () => gammel);
    const hel = (await øyeblikkTekst("dag/01/kveld"))!;
    const snitt = utsnitt("dag/01/kveld", hel);
    const mk = (fil: string, tekst: string): Lager => ({
      format: 2,
      sesong: 2026,
      elementer: {
        [fil]: {
          vurderinger: [
            {
              hash: "x",
              fil,
              vurdering: "godkjent",
              tekst,
              oppdatert: "2026-11-13T10:00:00Z",
            },
          ],
          historikk: [],
        },
      },
    });
    const l = mk("dag/01/kveld", snitt);
    expect(await utvidSnapshots(l, async () => gammelMd)).toEqual([
      "dag/01/kveld",
    ]);
    const v = l.elementer["dag/01/kveld"].vurderinger[0];
    expect(v.tekst).toContain("Oppsettskisse:** gammel");
    // Cut back it is the stored text, so a wider FELT.kveld cannot stale it.
    expect(utsnitt("dag/01/kveld", v.tekst!)).toBe(snitt);
    expect(l.elementer["dag/01/kveld"].historikk[0].merknad).toBe(
      "snapshot utvidet",
    );
    // Idempotent.
    expect(await utvidSnapshots(l, async () => gammelMd)).toEqual([]);
    // A cut that does not match what the old bake gives is left alone.
    const l2 = mk("dag/01/kveld", snitt + "\nannet");
    expect(await utvidSnapshots(l2, async () => gammelMd)).toEqual([]);
  });

  it("endreLager nekter å skrive når lageret er fra nyere kode, og stempler hashVersjon", async () => {
    const dir = await mappe({});
    const fil = path.join(dir, "media-vurdering.json");
    await endreLager(dir, () => {});
    expect(JSON.parse(readFileSync(fil, "utf8")).hashVersjon).toBe(
      HASH_VERSJON,
    );
    await writeFile(
      fil,
      JSON.stringify({
        format: 2,
        sesong: 2026,
        hashVersjon: HASH_VERSJON + 1,
        elementer: {},
      }),
    );
    await expect(endreLager(dir, () => {})).rejects.toThrow(
      "koden er eldre enn lageret",
    );
  });

  it("dev: nekter MEDIA_DIR utenfor checkouten uten NISSEKOMM_TILLAT_EKSTERN_MEDIA", () => {
    const env = process.env as Record<string, string | undefined>;
    const før = env.NODE_ENV;
    env.NODE_ENV = "development";
    try {
      expect(() => skrivbart("/tmp/annen")).toThrow("utenfor");
      expect(() => skrivbart(path.join(process.cwd(), "public"))).not.toThrow();
      env.NISSEKOMM_TILLAT_EKSTERN_MEDIA = "1";
      expect(() => skrivbart("/tmp/annen")).not.toThrow();
    } finally {
      env.NODE_ENV = før;
      delete env.NISSEKOMM_TILLAT_EKSTERN_MEDIA;
    }
  });

  it("medie.py har samme HASH_VERSJON og SESONG", () => {
    const py = readFileSync("assets/bin/medie.py", "utf8");
    expect(Number(py.match(/^HASH_VERSJON = (\d+)/m)?.[1])).toBe(HASH_VERSJON);
    expect(Number(py.match(/^SESONG = (\d+)/m)?.[1])).toBe(SESONG);
  });
});

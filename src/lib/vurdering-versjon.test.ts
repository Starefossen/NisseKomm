/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { mkdtemp, mkdir, readFile, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { medVersjon, versjonAv } from "./vurdering-versjon";
import { taIBruk } from "./media-promote";
import { familie, type StatusKilde } from "./media-status";
import { tilstand } from "@/app/nissemor-guide/gjennomgang/elementer";

async function mappe() {
  const dir = await mkdtemp(path.join(tmpdir(), "vurd-versjon-"));
  await mkdir(path.join(dir, "strek"), { recursive: true });
  await writeFile(path.join(dir, "strek/dag01.png"), "a");
  return dir;
}

describe("vurdering-versjon", () => {
  it("en fil skrevet på nytt etter vurderingen er ny versjon, med forrige som historikk", async () => {
    const dir = await mappe();
    const versjon = (await versjonAv(dir, "strek/dag01.png"))!;
    const v = {
      "strek/dag01.png": {
        vurdering: "lag_paa_nytt",
        notat: "for mørk",
        oppdatert: "2026-11-12T10:00:00Z",
        versjon,
      },
    };
    expect((await medVersjon(dir, v))["strek/dag01.png"]).toEqual(
      v["strek/dag01.png"],
    );
    await writeFile(path.join(dir, "strek/dag01.png"), "bb");
    const ut = await medVersjon(dir, v);
    expect(ut["strek/dag01.png"].vurdering).toBeUndefined();
    const k: StatusKilde = {
      filer: [{ path: "strek/dag01.png", size: 2 }],
      vurderinger: ut,
    };
    const fam = familie("strek/dag01.png", k);
    expect(fam.celle).toBe("ny_versjon");
    expect(fam.iBruk.notat).toBe("forrige versjon: lag på nytt – «for mørk»");
  });

  it("gamle vurderinger uten versjon: sidecar opprettet etter vurderingen", async () => {
    const dir = await mappe();
    const v = {
      "strek/dag01.png": {
        vurdering: "godkjent",
        oppdatert: "2026-11-12T10:00:00Z",
      },
    };
    const meta = path.join(dir, "strek/dag01.png.meta.json");
    await writeFile(
      meta,
      JSON.stringify({ created: "2026-11-12T09:00:00+00:00" }),
    );
    expect(
      (await medVersjon(dir, v))["strek/dag01.png"].forrige,
    ).toBeUndefined();
    await writeFile(
      meta,
      JSON.stringify({ created: "2026-11-12T11:00:00+00:00" }),
    );
    expect(
      (await medVersjon(dir, v))["strek/dag01.png"].forrige?.vurdering,
    ).toBe("godkjent");
  });

  it("seksjoner: hash av den bakte teksten", async () => {
    const dir = await mappe();
    const h = await versjonAv(dir, "dag/04/gaatekart");
    expect(h).toMatch(/^[0-9a-f]{12}$/);
    expect(await versjonAv(dir, "dag/05/gaatekart")).not.toBe(h);
    expect(await versjonAv(dir, "ugleposten/k1")).toBeNull();
    const v = {
      "dag/04/gaatekart": {
        vurdering: "godkjent",
        notat: "ok",
        versjon: "000000000000",
      },
    };
    const ut = await medVersjon(dir, v);
    const t = tilstand(
      { id: "dag/04/gaatekart", gruppe: "gaate", tittel: "", media: [] },
      { filer: [], vurderinger: ut },
    );
    expect(t.celle).toBe("ny_versjon");
    expect(t.notat).toBe("forrige versjon: godkjent – «ok»");
    expect(
      (
        await medVersjon(dir, {
          "dag/04/gaatekart": { ...v["dag/04/gaatekart"], versjon: h! },
        })
      )["dag/04/gaatekart"].vurdering,
    ).toBe("godkjent");
  });

  it("Ta i bruk stempler den godkjente kandidaten så den fortsatt teller", async () => {
    const dir = await mappe();
    await writeFile(path.join(dir, "strek/dag01-v2.png"), "ny");
    await utimes(path.join(dir, "strek/dag01-v2.png"), 1, 1);
    await writeFile(
      path.join(dir, "media-vurdering.json"),
      JSON.stringify({
        "strek/dag01-v2.png": { vurdering: "godkjent", versjon: "gammel" },
      }),
    );
    await taIBruk(dir, "strek/dag01-v2.png");
    const vurd = JSON.parse(
      await readFile(path.join(dir, "media-vurdering.json"), "utf8"),
    );
    expect(vurd["strek/dag01.png"].versjon).toBe(
      await versjonAv(dir, "strek/dag01.png"),
    );
    expect((await medVersjon(dir, vurd))["strek/dag01.png"].vurdering).toBe(
      "godkjent",
    );
  });
});

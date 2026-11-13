/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  restemple,
  settVurdering,
  visning,
  type Lager,
} from "./vurdering-lager";
import {
  HASH_VERSJON,
  linjeDiff,
  seksjonsTekst,
  versjonAv,
  utsnitt,
} from "./vurdering-versjon";
import { kveldDag } from "./guide-sesong";

const ny = (): Lager => ({ format: 2, sesong: 2026, elementer: {} });
const mappe = () => mkdtemp(path.join(tmpdir(), "vurd-seksjon-"));
const ID = "dag/03/rampestrek";

describe("seksjonsvurderinger", () => {
  it("linjeDiff gir bare endrede linjer", () => {
    expect(linjeDiff("a\nb\nc", "a\nB\nc\nd")).toEqual([
      { t: "-", l: "b" },
      { t: "+", l: "B" },
      { t: "+", l: "d" },
    ]);
  });

  it("versjonen er kildeteksten, ikke det avledede sideobjektet", async () => {
    const tekst = (await seksjonsTekst(ID))!;
    expect(tekst).toContain("Dag 3");
    // Derived UI (shopping chips, print links) is not part of the text.
    expect(tekst).not.toContain(JSON.stringify(kveldDag(3)?.varer ?? []));
    expect(await versjonAv("/finnes-ikke", ID)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("lagrer teksten og viser diff når kilden endrer seg", async () => {
    const dir = await mappe();
    const l = ny();
    await settVurdering(dir, l, ID, { vurdering: "godkjent" });
    const v = l.elementer[ID].vurderinger[0];
    // The snapshot is the whole day block, cut at read time: a new field definition
    // can widen or narrow the section without making the verdict stale.
    expect(v.tekst).toBe(await seksjonsTekst(ID, true));
    expect(v.tekst).toContain("**Brikke H:**");
    expect(await seksjonsTekst(ID)).not.toContain("**Brikke H:**");
    expect(utsnitt(ID, v.tekst!)).toBe(await seksjonsTekst(ID));
    expect((await visning(dir, l))[ID].vurdering).toBe("godkjent");
    expect("tekst" in (await visning(dir, l))[ID]).toBe(false);
    // As if the doc said something else when Hans approved it.
    v.tekst = `${v.tekst}\n3 | en gammel linje`;
    v.hash = v.versjon = "aaaaaaaaaaaa";
    const ut = (await visning(dir, l))[ID];
    expect(ut.vurdering).toBeUndefined();
    expect(ut.forrige?.endringer).toEqual([
      { t: "-", l: "3 | en gammel linje" },
    ]);
  });

  it("ny hashdefinisjon gjør 0 vurderinger utdatert", async () => {
    const dir = await mappe();
    const l = ny();
    const ider = [ID, "dag/01/gaatekart", "manus/radio/dag-01"];
    for (const id of ider)
      await settVurdering(dir, l, id, { vurdering: "godkjent" });
    expect(l.elementer[ID].vurderinger[0].hashVersjon).toBe(HASH_VERSJON);
    // The definition changes: every stored hash is now wrong.
    const def = {
      versjon: HASH_VERSJON + 1,
      hash: async (id: string) => `ny-${id}`,
    };
    for (const e of Object.values(l.elementer))
      e.vurderinger[0].hash = e.vurderinger[0].versjon = "gammeldef0000";
    const vis = await visning(dir, l);
    expect(ider.filter((id) => vis[id].forrige)).toEqual([]);
    expect(await restemple(dir, l, def)).toEqual(ider);
    const v = l.elementer[ID].vurderinger[0];
    expect(v).toMatchObject({
      hash: `ny-${ID}`,
      hashVersjon: HASH_VERSJON + 1,
    });
    expect(l.elementer[ID].historikk[0].merknad).toBe(
      "gjenopprettet: hashdefinisjon endret",
    );
    // Run twice: nothing more to do.
    expect(await restemple(dir, l, def)).toEqual([]);
  });

  it("en ekte endring blir ikke restemplet", async () => {
    const dir = await mappe();
    const l = ny();
    await settVurdering(dir, l, ID, { vurdering: "godkjent" });
    l.elementer[ID].vurderinger[0].tekst += "\n3 | endret";
    delete l.elementer[ID].vurderinger[0].hashVersjon;
    expect(await restemple(dir, l)).toEqual([]);
    expect((await visning(dir, l))[ID].forrige?.endringer).toEqual([
      { t: "-", l: "3 | endret" },
    ]);
  });

  it("media uten grunnlag er «ukjent», byttet fil viser størrelse og gammel fil", async () => {
    const dir = await mappe();
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(path.join(dir, "strek"));
    await writeFile(path.join(dir, "strek/a.png"), "ny");
    await writeFile(path.join(dir, "strek/a.old-1.png"), "gammel");
    const l = ny();
    l.elementer["strek/a.png"] = {
      vurderinger: [
        {
          fil: "strek/a.png",
          hash: "x",
          versjon: "6-1",
          vurdering: "godkjent",
        },
      ],
      historikk: [],
    };
    l.elementer["strek/b.png"] = {
      vurderinger: [{ fil: "strek/b.png", hash: "utdatert", vurdering: "ok" }],
      historikk: [],
    };
    await writeFile(path.join(dir, "strek/b.png"), "b");
    const vis = await visning(dir, l);
    expect(vis["strek/a.png"].forrige?.fil).toMatchObject({
      før: 6,
      etter: 2,
      gammel: "strek/a.old-1.png",
    });
    expect(vis["strek/b.png"].forrige?.ukjent).toBe(true);
  });
});

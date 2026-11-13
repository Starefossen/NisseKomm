/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  migrerSeksjoner,
  settVurdering,
  visning,
  type Lager,
} from "./vurdering-lager";
import { linjeDiff, seksjonsTekst, versjonAv } from "./vurdering-versjon";
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
    expect(v.tekst).toBe(await seksjonsTekst(ID));
    expect((await visning(dir, l))[ID].vurdering).toBe("godkjent");
    expect("tekst" in (await visning(dir, l))[ID]).toBe(false);
    // As if the doc said something else when Hans approved it.
    v.tekst = `${v.tekst}\nen gammel linje`;
    v.hash = v.versjon = "aaaaaaaaaaaa";
    const ut = (await visning(dir, l))[ID];
    expect(ut.vurdering).toBeUndefined();
    expect(ut.forrige?.endringer).toEqual([{ t: "-", l: "en gammel linje" }]);
  });

  it("migrering: bare visning endret gir dommen tilbake, ekte endring blir diff", async () => {
    const dir = await mappe();
    const l = ny();
    const nå = (await seksjonsTekst(ID))!;
    const gammel = { hash: "111111111111", versjon: "111111111111" };
    l.elementer[ID] = {
      vurderinger: [{ ...gammel, fil: ID, vurdering: "godkjent" }],
      historikk: [],
    };
    l.elementer["dag/04/kveld"] = {
      vurderinger: [{ ...gammel, fil: "dag/04/kveld", vurdering: "godkjent" }],
      historikk: [],
    };
    const r = await migrerSeksjoner(
      dir,
      l,
      async (v) => (v.fil === ID ? nå : "annen tekst"),
      new Set([ID, "dag/04/kveld"]),
    );
    expect(r).toEqual({ gjenopprettet: [ID], endret: ["dag/04/kveld"] });
    const vis = await visning(dir, l);
    expect(vis[ID].vurdering).toBe("godkjent");
    expect(l.elementer[ID].historikk[0].merknad).toBe(
      "gjenopprettet: bare visning endret",
    );
    expect(vis["dag/04/kveld"].forrige?.endringer?.[0]).toEqual({
      t: "-",
      l: "annen tekst",
    });
    // Run twice, same result.
    expect(await migrerSeksjoner(dir, l, async () => "x", new Set())).toEqual({
      gjenopprettet: [],
      endret: [],
    });
  });
});

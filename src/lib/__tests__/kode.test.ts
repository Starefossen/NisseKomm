import { describe, it, expect } from "@jest/globals";
import { execFileSync } from "node:child_process";
import klient from "@/data/oppdrag-klient.json";
import { getAllOppdrag, getOppdrag } from "../oppdrag";
import { sjekkKode, ventSek } from "../kode";

describe("dagskoder bare på serveren", () => {
  it("sjekkKode godtar dagens kode, uansett store og små bokstaver", () => {
    const k = getOppdrag(8)!.kode;
    expect(sjekkKode(8, ` ${k.toLowerCase()} `)).toEqual({
      ok: true,
      dag: 8,
      kode: k.toUpperCase(),
    });
    expect(sjekkKode(9, k)).toEqual({ ok: false });
    expect(sjekkKode(8, "")).toEqual({ ok: false });
  });

  it("sjekkKode kjenner bonuskoden og sier hvilken dag den gjelder", () => {
    const b = getAllOppdrag().find((o) => o.bonusoppdrag)!;
    expect(sjekkKode(1, b.bonusoppdrag!.foreldre_kode)).toEqual({
      ok: true,
      bonus: b.dag,
    });
  });

  it("ventSek slipper ti forsøk i minuttet per økt", () => {
    for (let i = 0; i < 10; i++) expect(ventSek("a", 1000 + i)).toBe(0);
    expect(ventSek("a", 2000)).toBeGreaterThan(0);
    expect(ventSek("b", 2000)).toBe(0);
    expect(ventSek("a", 61_001)).toBe(0);
  });

  it("oppdrag-klient.json har ingen koder og er bakt på nytt", () => {
    const tekst = JSON.stringify(klient);
    expect(tekst).not.toMatch(/"kode"|foreldre_kode|fysisk_hint/);
    execFileSync("node", ["scripts/oppdrag-klient.mjs", "--sjekk"]);
  });
});

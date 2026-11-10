import { describe, it, expect } from "@jest/globals";
import { DAGER, HANDLELISTE, BYGGEPLAN } from "../data";
import { readFileSync } from "fs";
import { UTSKRIFTER } from "../../printout/filer";

const GAATER = readFileSync("docs/gaater-2026.md", "utf8")
  .replace(/[*`]/g, "")
  // The guide shows frost squares as ✱: ❄ renders as a colour emoji on iPad.
  .replace(/❄️?/g, "✱");
const KODER: Record<number, string> = Object.fromEntries(
  [1, 2, 3, 4]
    .flatMap((i) =>
      JSON.parse(readFileSync(`src/data/uke${i}_oppdrag.json`, "utf8")),
    )
    .map((q: { dag: number; kode: string }) => [q.dag, q.kode]),
);
const fyll = (t: string) =>
  t.replace(/\{(\d+)\}/g, (_, d) => KODER[+d]).replace(/`/g, "");

describe("kveldsdata fra gaater-2026", () => {
  it("har dag 1–24 i rekkefølge", () => {
    expect(DAGER.map((d) => d.dag)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });

  it.each(DAGER.map((d) => [d.dag, d] as const))(
    "dag %i har strek, oppsett, fasit og ekte utskrifter",
    (_, d) => {
      expect(d.strek.tekst.length).toBeGreaterThan(10);
      expect(d.iKveld.length).toBeGreaterThan(5);
      expect(d.brikkeH.length).toBeGreaterThan(10);
      expect(d.minutter).toBeGreaterThan(0);
      // letter codes are stored as {dag}; numeric codes stay as digits
      expect([`{${d.dag}}`, "48", "24", "75"]).toContain(d.kode);
      expect(d.slikLoses.length).toBeGreaterThan(1);
      expect(d.reserve.length).toBeGreaterThan(10);
      expect(d.utskrifter.length).toBeGreaterThan(0);
      for (const u of d.utskrifter)
        expect(UTSKRIFTER as readonly string[]).toContain(u);
    },
  );

  it("har handleliste og byggeplan", () => {
    expect(HANDLELISTE).toHaveLength(2);
    expect(BYGGEPLAN).toHaveLength(3);
  });

  // The guide is a copy of the locked doc; a doc edit must reach the parents too
  it.each(DAGER.map((d) => [d.dag, d] as const))(
    "dag %i står ordrett i gaater-2026.md",
    (_, d) => {
      const felt = [
        d.tittel,
        d.mekanikk,
        d.brikkeH,
        d.brikkeS,
        d.hanna,
        d.oppsett,
        d.materialer,
        d.utskrifterTekst,
        d.reserve,
        ...d.slikLoses,
      ];
      for (const f of felt) expect(GAATER).toContain(fyll(f));
    },
  );
});

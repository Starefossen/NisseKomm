import { describe, it, expect } from "@jest/globals";
import { DAGER, HANDLELISTE, BYGGEPLAN } from "../data";
import { UTSKRIFTER } from "../../printout/filer";

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
});

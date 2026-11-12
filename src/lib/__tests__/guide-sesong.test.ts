/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import bakt from "@/data/guide-innhold.json";
import {
  DOK,
  SEKSJONER,
  delsystemer,
  forSesongen,
  historien,
  kveldDag,
  sammendrag,
  seksjon,
  varden,
} from "@/lib/guide-sesong";
import { UTSKRIFTER } from "@/app/nissemor-guide/printout/filer";

const filer: Record<string, string> = bakt;

describe("guide-sesong", () => {
  it.each(SEKSJONER)("%s har seksjonen «%s»", (k, tittel) => {
    expect(seksjon(filer[DOK[k]], tittel).length).toBeGreaterThan(50);
  });

  it("seksjon stopper ved neste overskrift på samme nivå", () => {
    const md = "## A\nx\n### A.1\ny\n## B\nz";
    expect(seksjon(md, "A")).toBe("## A\nx\n### A.1\ny\n");
    expect(seksjon(md, "A.1")).toBe("### A.1\ny\n");
  });

  it.each(Array.from({ length: 24 }, (_, i) => i + 1))(
    "dag %i har kveldsliste, strek og sammendrag fra docs",
    (n) => {
      const d = kveldDag(n)!;
      expect(d.strek.tekst.length).toBeGreaterThan(10);
      expect(d.strek.minutter).toBeGreaterThan(0);
      expect(d.iKveld.length).toBeGreaterThan(5);
      expect(d.brikkeH.length).toBeGreaterThan(10);
      expect(d.mekanikk.length).toBeGreaterThan(10);
      expect(d.minutter).toBeGreaterThan(0);
      expect(d.slikLoses.length).toBeGreaterThan(1);
      expect(d.reserve.length).toBeGreaterThan(10);
      expect(d.utskrifter.length).toBeGreaterThan(0);
      for (const u of d.utskrifter)
        expect(UTSKRIFTER as readonly string[]).toContain(u);
      expect(sammendrag(n)).toMatch(new RegExp(`^### Dag ${n} \\(`));
      expect(delsystemer(n).length).toBeGreaterThanOrEqual(10);
    },
  );

  it("har forberedelser, handleliste og førsesongsradio", () => {
    const f = forSesongen();
    expect(f.innen25.length).toBeGreaterThan(5);
    expect(f.byggeplan.map((b) => b.steg.length)).toEqual([5, 5, 10]);
    expect(f.sjekkliste).toHaveLength(5);
    expect(f.handleliste.grupper.length).toBeGreaterThanOrEqual(2);
    expect(f.handleliste.sum).toMatch(/kr/);
    expect(f.morgen1).toMatch(/^Morgenen 1\. desember/);
    expect(f.radio.map((r) => r.dato)).toContain("2026-11-30");
  });

  it("Historien har tekst i hver del", () => {
    for (const h of historien())
      for (const d of h.deler) expect(d.length).toBeGreaterThan(50);
  });

  it("Varden skjuler dagens brikker før koden og viser dem etter", () => {
    const v = varden(7);
    expect(v.uloest.dag).toContain("[skjult]");
    expect(v.loest.dag).not.toContain('"mail":"[skjult]"');
  });
});

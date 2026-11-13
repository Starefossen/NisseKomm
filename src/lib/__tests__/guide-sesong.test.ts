/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import bakt from "@/data/guide-innhold.json";
import { getAllOppdrag } from "@/lib/oppdrag";
import { nyeRuner } from "@/lib/runeorden";
import {
  DOK,
  RESERVESETT,
  SEKSJONER,
  delsystemer,
  forSesongen,
  handleliste,
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

  it.each(getAllOppdrag().map((q) => [q.dag, q.kode] as const))(
    "dag %i har en hinttrapp på 3–4 trinn uten koden",
    (n, kode) => {
      const { hint } = kveldDag(n)!;
      expect(hint.length).toBeGreaterThanOrEqual(3);
      expect(hint.length).toBeLessThanOrEqual(4);
      // Same rule as kodelekkasje.test.ts: digits as a whole number, words anywhere.
      const lekk = /^\d+$/.test(kode)
        ? new RegExp(`(?<!\\d)${kode}(?!\\d)`)
        : new RegExp(kode, "i");
      for (const h of hint) {
        expect(h).not.toMatch(lekk);
        expect(h.length).toBeGreaterThan(20);
      }
    },
  );

  it("har forberedelser, handleliste og førsesongsradio", () => {
    const f = forSesongen();
    expect(f.innen25.length).toBeGreaterThan(5);
    expect(f.byggeplan.map((b) => b.steg.length)).toEqual([5, 5, 10]);
    expect(f.sjekkliste).toHaveLength(5);
    expect(f.handleliste.varer.length).toBeGreaterThan(20);
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

describe("reservesett", () => {
  it("hver dag med nye runer har reservesett i kveldslista", () => {
    for (let d = 1; d <= 24; d++)
      if (nyeRuner(d).size)
        expect([d, kveldDag(d)?.reservesett]).toEqual([d, RESERVESETT[d]]);
    for (const [d, u] of Object.entries(RESERVESETT))
      expect(kveldDag(Number(d))?.reservesett).toBe(u);
  });

  describe("handleliste", () => {
    const varer = handleliste();
    const dager = Array.from({ length: 24 }, (_, i) => kveldDag(i + 1)!);
    const lenket = (id: string) =>
      dager.filter((d) => d.varer.some((v) => v.id === id)).map((d) => d.dag);

    it("har unike id-er som ikke endres", () => {
      const ider = varer.map((v) => v.id);
      expect(new Set(ider).size).toBe(ider.length);
      // Synced ticks are keyed on these; renaming an item drops its tick.
      expect(ider).toEqual(
        expect.arrayContaining([
          "klementiner",
          "maskeringsteip",
          "bergkrystall",
          "runde-gullklistremerker",
        ]),
      );
    });

    it("hver vare finnes på en dag eller er generell", () => {
      const d1 = new Set(forSesongen().dag1.map((v) => v.id));
      const mangler = varer.filter(
        (v) => !v.generell && !lenket(v.id).length && !d1.has(v.id),
      );
      expect(mangler.map((v) => v.vare)).toEqual([]);
    });

    it("en vare med dager er lenket på minst én av dem", () => {
      const feil = varer
        .filter((v) => !v.generell)
        .filter((v) => {
          const egne = [...v.dager.matchAll(/\d+/g)].map((m) => Number(m[0]));
          return !lenket(v.id).some((d) => egne.includes(d));
        });
      expect(feil.map((v) => `${v.vare}: ${v.dager}`)).toEqual([]);
    });
  });
});

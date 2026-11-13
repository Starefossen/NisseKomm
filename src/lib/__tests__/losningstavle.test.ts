/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import { gaatekart, kveldDag } from "../guide-sesong";
import { getOppdrag } from "../oppdrag";
import { losningstavle } from "../losningstavle";

const dager = Array.from({ length: 24 }, (_, i) => i + 1);
const tavle = (n: number) => {
  const k = gaatekart(n);
  return losningstavle(
    getOppdrag(n)!.kode,
    kveldDag(n)!.slikLoses,
    k.hjemme,
    k.skjerm,
  );
};

describe("løsningstavle", () => {
  it("day 4: M and A from the house, the rest closed by Julius", () => {
    const t = tavle(4);
    expect(t.kjent).toBe("_ _ M _ A _ _");
    expect(t.hus).toBe(2);
    expect(t.celler.filter((c) => c.kilde === "resonnert")).toHaveLength(5);
    expect(t.lukk?.biter).toContain("S1");
  });

  it("every day: one cell per character, sources add up, warnings listed", () => {
    const varsler: string[] = [];
    for (const n of dager) {
      const t = tavle(n);
      expect(t.celler.map((c) => c.tegn).join("")).toBe(
        getOppdrag(n)!.kode.toUpperCase(),
      );
      expect(t.hus + t.skjerm).toBeLessThanOrEqual(t.lengde);
      for (const v of t.varsler) varsler.push(`dag ${n} ${v.niva}: ${v.tekst}`);
    }
    // Documents the season's open spots; a change here is a change in the riddles.
    console.log(varsler.join("\n") || "ingen varsler");
  });
});

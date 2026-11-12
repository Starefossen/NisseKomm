import { describe, it, expect } from "@jest/globals";
import { UTSKRIFTER, utskriftTittel } from "../filer";
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";

// Print titles and ids show up in the guide and in file names left on the table.
const KODER = [uke1, uke2, uke3, uke4]
  .flatMap((u) => (Array.isArray(u) ? u : Object.values(u).flat()))
  .map((o) => String((o as { kode?: unknown }).kode ?? "").toLowerCase())
  .filter((k) => /^[a-zæøå]{3,}$/.test(k));

describe("utskriftnavn", () => {
  it("leser kodene", () => expect(KODER.length).toBeGreaterThan(15));
  it.each(UTSKRIFTER)("%s røper ingen kode", (navn) => {
    const tekst = `${navn} ${utskriftTittel(navn)}`.toLowerCase();
    expect(KODER.filter((k) => tekst.includes(k))).toEqual([]);
  });
});

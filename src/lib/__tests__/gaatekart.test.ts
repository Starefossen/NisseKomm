/** @jest-environment node */
import { describe, it, expect } from "@jest/globals";
import juliusVideoer from "@/data/julius_videoer.json";
import { getQuestByDay } from "@/lib/data-loader";
import { gaatekart, norm, sesongKart } from "@/lib/guide-sesong";

const dager = Array.from({ length: 24 }, (_, i) => i + 1);

/** The text the kids actually see for a piece that points at mail, PS or video. */
function barnetekst(kilde: string, dag: number): string {
  const q = getQuestByDay(dag);
  if (kilde === "epost") return q?.nissemail_tekst ?? "";
  if (kilde === "ps") return q?.julius_ps ?? "";
  return juliusVideoer.find((v) => v.dag === dag)?.transkripsjon ?? "";
}

describe("gåtekart", () => {
  it.each(dager)("dag %i: hver bit med kilde står i barnas tekst", (n) => {
    const k = gaatekart(n);
    expect(k.hjemme.length).toBeGreaterThan(0);
    for (const b of k.skjerm) {
      if (b.kilde === "fil") expect(b.hvor).toMatch(/^NisseNet \/.+\.txt$/);
      if (b.kilde === "symbol") expect(b.hvor).toMatch(/^Symbolkort [1-9]\/9$/);
      if (b.kilde && b.kildeDag && b.kilde !== "symbol" && b.kilde !== "fil")
        expect(barnetekst(b.kilde, b.kildeDag)).not.toBe("");
      // A Julius piece found only in the manus segment still has to be in the video text.
      if (b.sitat && b.kilde && b.kildeDag)
        expect(norm(barnetekst(b.kilde, b.kildeDag))).toContain(norm(b.sitat));
    }
  });

  it("sesongkartet har 24 dager", () => {
    expect(sesongKart().map((r) => r.dag)).toEqual(dager);
  });
});

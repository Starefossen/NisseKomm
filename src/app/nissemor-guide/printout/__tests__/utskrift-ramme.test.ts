import { describe, it, expect } from "@jest/globals";
import { pakk, type Del } from "../_print/Utskrift";

const del = (str: Del["str"], antall: number): Del => ({
  str,
  antall,
  forside: () => null,
});

describe("Utskrift.pakk", () => {
  it("fills an A4 sheet before starting the next", () => {
    expect(pakk([del("A7", 8)])).toHaveLength(1);
    expect(pakk([del("A7", 9)])).toHaveLength(2);
    expect(pakk([del("A6", 4)])).toHaveLength(1);
    expect(pakk([del("A5", 2)])).toHaveLength(2);
  });
  it("splits A3 over two sheets", () => {
    expect(pakk([del("A3", 1)]).map((a) => a.a3)).toEqual(["topp", "bunn"]);
  });
  it("keeps every part inside the printable area", () => {
    for (const a of pakk([
      del({ b: 194, h: 140 }, 4),
      del("A6", 4),
      del("A7", 8),
    ]))
      for (const p of a.plasser) {
        expect(p.x + p.b).toBeLessThanOrEqual(194);
        expect(p.y + p.h).toBeLessThanOrEqual(280);
      }
  });
});

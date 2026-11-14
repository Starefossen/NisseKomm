import { describe, expect, it } from "@jest/globals";
import { getAllOppdrag } from "@/lib/oppdrag";
import { ALT_CRUISE, ETAPPER, RADIO, createSim } from "./slede";
import { rangering, rivaler, slårJulius, toppPoeng } from "./rangering";

function idealPoeng(i: number) {
  const sim = createSim(ETAPPER[i], { assist: false, reduceMotion: false });
  sim.s.liv = Infinity;
  const ringer = sim.s.ting.filter((t) => t.type === "varde");
  for (let n = 0; n < 40000 && !sim.s.ferdig; n++) {
    const s = sim.s;
    const mål = ringer.find((t) => t.z > s.dist);
    const steer = Math.max(
      -1,
      Math.min(1, ((mål?.x ?? 0) - s.px - s.vx * 0.3) * 6),
    );
    const climb = Math.max(
      -1,
      Math.min(1, ((mål?.h ?? ALT_CRUISE) - s.alt) / 25),
    );
    sim.step(1 / 60, { steer, climb, sprang: false });
  }
  return sim.s.poeng;
}

describe("rangering", () => {
  it("is deterministic, ordered Julius > Winter > Pil, and grows with the stage", () => {
    for (const e of ETAPPER) {
      expect(rivaler(e)).toEqual(rivaler(e));
      const [j, w, p] = rivaler(e).map((r) => r.poeng);
      expect(j).toBeGreaterThan(w);
      expect(w).toBeGreaterThan(p);
      expect(p).toBeGreaterThan(0);
    }
    expect(toppPoeng(ETAPPER[5])).toBeGreaterThan(toppPoeng(ETAPPER[0]));
  });

  it("a perfect run beats all three; a normal run beats Winter and Pil, not Julius", () => {
    ETAPPER.forEach((e, i) => {
      const best = idealPoeng(i);
      expect([e.id, slårJulius(e, best)]).toEqual([e.id, true]);
      const vanlig = rangering(e, [
        { navn: "A", poeng: Math.round(rivaler(e)[0].poeng * 0.8) },
      ]);
      expect(vanlig.findIndex((p) => !p.rival)).toBe(1);
    });
  });

  it("sorts kids in and lets a tie go to the kids", () => {
    const e = ETAPPER[0];
    const j = rivaler(e)[0].poeng;
    expect(rangering(e, [{ navn: "A", poeng: j }])[0].rival).toBe(false);
  });

  it("radio line names no code word", () => {
    for (const l of RADIO.julius)
      for (const { kode } of getAllOppdrag())
        expect(l.toUpperCase()).not.toContain(kode.toUpperCase());
  });
});

import { describe, it, expect } from "@jest/globals";
import { erSlipp, slippAlle, stikkeVerdi, tast, tomHeld } from "./taster";

describe("SLEDEFLUKT keys", () => {
  it("lets go of a letter released under Shift (the lock-up)", () => {
    const h = tomHeld();
    const ned = (code: string) => (h[tast({ code })!] = true);
    const opp = (code: string) => (h[tast({ code })!] = false);
    ned("KeyA");
    ned("ShiftLeft");
    // The browser reports this release as key "A"; the code is still KeyA.
    opp("KeyA");
    opp("ShiftLeft");
    expect(h.L).toBe(false);
    expect(h.G).toBe(false);
  });

  it("clears held keys when focus is lost, Space and Enter drop, E is sprang", () => {
    const h = tomHeld();
    h.L = h.U = true;
    slippAlle(h);
    expect(Object.values(h).every((v) => !v)).toBe(true);
    expect(erSlipp({ code: "Space", key: " " })).toBe(true);
    expect(erSlipp({ code: "Enter", key: "Enter" })).toBe(true);
    expect(tast({ code: "Space" })).toBeUndefined();
    expect(tast({ code: "KeyE" })).toBe("S");
  });

  it("a stick on a zero-size element never feeds NaN to the sim", () => {
    expect(stikkeVerdi(NaN)).toBe(0);
    expect(stikkeVerdi(Infinity)).toBe(0);
    expect(stikkeVerdi(3)).toBe(1);
  });
});

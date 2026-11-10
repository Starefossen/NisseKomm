import { beforeEach, describe, it, expect } from "@jest/globals";
import { GameEngine } from "@/lib/game-engine";
import { erBrevetFrossent, sendBrev } from "../Brevfugler";

describe("Brevfugler: Kuldes brev", () => {
  it("er fryst dag 14 (og fram til julaften)", () => {
    expect(erBrevetFrossent(14, false)).toBe(true);
    expect(erBrevetFrossent(23, false)).toBe(true);
  });

  it("har tint dag 24", () => {
    expect(erBrevetFrossent(24, false)).toBe(true);
    expect(erBrevetFrossent(24, true)).toBe(false);
  });
});

describe("Brevfugler: brev til Julius", () => {
  beforeEach(() => localStorage.clear());

  it("lagrer der foreldreguiden leser, og legger søskens brev samme dag til", () => {
    expect(sendBrev(14, "  Kjære Julius, Kristian her ")).toBe(true);
    expect(sendBrev(14, "Hilsen Hanna")).toBe(true);
    expect(GameEngine.getSantaLetters()).toEqual([
      { day: 14, content: "Kjære Julius, Kristian her\n\nHilsen Hanna" },
    ]);
  });

  it("avviser tomme brev og dager utenfor 1-24, så utkastet beholdes", () => {
    expect(sendBrev(14, "   ")).toBe(false);
    expect(sendBrev(25, "Etter jul")).toBe(false);
    expect(GameEngine.getSantaLetters()).toEqual([]);
  });
});

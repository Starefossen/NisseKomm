import { beforeEach, describe, it, expect } from "@jest/globals";
import { GameEngine } from "@/lib/game-engine";
import { erBrevetFrossent, sendBrev, skalTineSpilles } from "../Brevfugler";

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

  it("lagrer hvert barns brev med navn, og legger samme barns andre brev til", () => {
    expect(sendBrev(14, "  Kjære Julius, Kristian her ", "Kristian")).toBe(
      true,
    );
    expect(sendBrev(14, "Hilsen Hanna", "Hanna")).toBe(true);
    expect(sendBrev(14, "PS", "Kristian")).toBe(true);
    expect(GameEngine.getSantaLetters()).toEqual([
      {
        day: 14,
        from: "Kristian",
        content: "Kjære Julius, Kristian her\n\nPS",
      },
      { day: 14, from: "Hanna", content: "Hilsen Hanna" },
    ]);
  });

  it("beholder gamle brev uten navn ved siden av nye", () => {
    GameEngine.saveSantaLetters([{ day: 14, content: "Gammelt brev" }]);
    sendBrev(14, "Nytt", "Håkon");
    const brev = GameEngine.getSantaLetters();
    expect(brev).toContainEqual({ day: 14, content: "Gammelt brev" });
    expect(brev).toContainEqual({ day: 14, from: "Håkon", content: "Nytt" });
  });

  it("avviser tomme brev, manglende navn og dager utenfor 1-24", () => {
    expect(sendBrev(14, "   ", "Hanna")).toBe(false);
    expect(sendBrev(14, "Hei", "")).toBe(false);
    expect(sendBrev(25, "Etter jul", "Hanna")).toBe(false);
    expect(GameEngine.getSantaLetters()).toEqual([]);
  });
});

describe("Brevfugler: tøvær dag 24", () => {
  beforeEach(() => localStorage.clear());

  it("spilles bare én gang, og aldri mens brevet er fryst", () => {
    expect(skalTineSpilles(true)).toBe(false);
    expect(skalTineSpilles(false)).toBe(true);
    GameEngine.markIntroSeen("brev-tint");
    expect(skalTineSpilles(false)).toBe(false);
  });
});

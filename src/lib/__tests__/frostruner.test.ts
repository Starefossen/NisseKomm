import { describe, it, expect, beforeEach } from "@jest/globals";
import { GameEngine } from "../game-engine";
import statisk from "@/data/statisk_innhold.json";
import { KULDE_RUNER } from "@/components/windows/snofall-tv/runer";

const code = (day: number) =>
  GameEngine.getAllQuests().find((q) => q.dag === day)!.kode;

async function solveThrough(last: number) {
  for (let d = 1; d <= last; d++) {
    await GameEngine.submitCode(code(d), code(d), d);
  }
}

describe("Frostrunene (gaater-2026, meta 1)", () => {
  beforeEach(() => {
    localStorage.clear();
    process.env.NEXT_PUBLIC_MOCK_DAY = "24";
    process.env.NEXT_PUBLIC_MOCK_MONTH = "12";
  });

  it("learns E and T on day 1, U on day 7, B on day 18", async () => {
    expect(GameEngine.getLearnedRunes().size).toBe(0);
    await solveThrough(1);
    const day1 = GameEngine.getLearnedRunes();
    expect(day1.has("E") && day1.has("T")).toBe(true);
    expect(day1.has("U")).toBe(false);
    await solveThrough(6);
    expect(GameEngine.getLearnedRunes().has("U")).toBe(false);
    await solveThrough(7);
    expect(GameEngine.getLearnedRunes().has("U")).toBe(true);
    await solveThrough(17);
    expect(GameEngine.getLearnedRunes().has("B")).toBe(false);
    await solveThrough(18);
    expect(GameEngine.getLearnedRunes().has("B")).toBe(true);
    await solveThrough(24);
    expect(GameEngine.getLearnedRunes().has("Å")).toBe(false);
  });

  it("every Kulde rune line is fully learned before its day", async () => {
    for (const [day, line] of Object.entries(KULDE_RUNER)) {
      localStorage.clear();
      await solveThrough(Number(day) - 1);
      const learned = GameEngine.getLearnedRunes();
      const missing = line
        .replace(/ /g, "")
        .split("")
        .filter((c) => !learned.has(c));
      expect({ day, missing }).toEqual({ day, missing: [] });
    }
  });

  it("rune lines in NisseNet files are learned by the day the file opens", async () => {
    const files: {
      innhold?: string;
      unlockConditions?: { afterDay?: number };
    }[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") {
        const o = n as Record<string, unknown>;
        if (typeof o.innhold === "string") files.push(o as never);
        Object.values(o).forEach(walk);
      }
    };
    walk(statisk);
    const marked = files.filter((f) => f.innhold!.includes("ᚱ:"));
    expect(marked.length).toBeGreaterThan(0);
    for (const f of marked) {
      // Files gated by a decryption have no afterDay; they open late, day 23 at the earliest.
      const day = f.unlockConditions?.afterDay ?? 23;
      localStorage.clear();
      await solveThrough(day - 1);
      const learned = GameEngine.getLearnedRunes();
      for (const l of f
        .innhold!.split("\n")
        .filter((l) => l.startsWith("ᚱ:"))) {
        const missing = l
          .slice(2)
          .replace(/ /g, "")
          .split("")
          .filter((c) => !learned.has(c));
        expect(missing).toEqual([]);
      }
    }
  });
});

import { describe, it, expect, afterEach } from "@jest/globals";
import { sim } from "../simulation";
import { GameEngine } from "../game-engine";
import { getCurrentDay } from "../date-utils";

describe("Simulering", () => {
  afterEach(() => localStorage.clear());

  it("solveUntil solves days 1..N with videos, bonus only on request", async () => {
    await sim.solveUntil(11);
    expect([...GameEngine.getCompletedDays()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 11 }, (_, i) => i + 1),
    );
    expect(GameEngine.isJuliusVideoWatched(11)).toBe(true);
    expect(GameEngine.isJuliusVideoWatched(12)).toBe(false);
    const day11 = GameEngine.getAllQuests().find((q) => q.dag === 11)!;
    expect(GameEngine.isBonusOppdragCompleted(day11)).toBe(false);
    await sim.solveUntil(11, { bonus: true });
    expect(GameEngine.isBonusOppdragCompleted(day11)).toBe(true);
  });

  it("snapshot round-trips the full state and the time", async () => {
    sim.goTo(5, "09:30");
    await sim.solveUntil(5);
    const bilde = sim.exportSnapshot();
    await sim.solveUntil(9);
    sim.goTo(9);
    sim.importSnapshot(bilde);
    expect(GameEngine.getCompletedQuestCount()).toBe(5);
    expect(getCurrentDay()).toBe(5);
    expect(sim.exportSnapshot()).toBe(bilde);
  });

  it("reset clears progress but keeps the simulated day", async () => {
    sim.goTo(14);
    await sim.solveUntil(14);
    global.fetch = (async () => ({ ok: true, status: 204 })) as never;
    await sim.reset();
    expect(GameEngine.getCompletedQuestCount()).toBe(0);
    expect(getCurrentDay()).toBe(14);
  });
});

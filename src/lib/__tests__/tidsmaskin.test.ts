import { describe, it, expect, afterEach } from "@jest/globals";
import { getCurrentDate, getCurrentDay, setTimeOverride } from "../date-utils";
import { GameEngine } from "../game-engine";

describe("Tidsmaskin date override", () => {
  afterEach(() => {
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_MOCK_DAY;
  });

  it("uses the override for day, month and time", () => {
    setTimeOverride({ day: 3, month: 12, hour: 6, minute: 45 });
    const d = getCurrentDate();
    expect(getCurrentDay()).toBe(3);
    expect(d.getMonth()).toBe(11);
    expect(d.getHours()).toBe(6);
    expect(d.getMinutes()).toBe(45);
  });

  it("takes precedence over NEXT_PUBLIC_MOCK_DAY and falls back when cleared", () => {
    process.env.NEXT_PUBLIC_MOCK_DAY = "10";
    setTimeOverride({ day: 2, month: 12, hour: 8, minute: 0 });
    expect(getCurrentDay()).toBe(2);
    setTimeOverride(null);
    expect(getCurrentDay()).toBe(10);
  });
});

describe("Julius video watched state", () => {
  afterEach(() => localStorage.clear());

  it("is unwatched until marked, per day", () => {
    expect(GameEngine.isJuliusVideoWatched(1)).toBe(false);
    GameEngine.markJuliusVideoWatched(1);
    GameEngine.markJuliusVideoWatched(1);
    expect(GameEngine.isJuliusVideoWatched(1)).toBe(true);
    expect(GameEngine.isJuliusVideoWatched(2)).toBe(false);
  });
});

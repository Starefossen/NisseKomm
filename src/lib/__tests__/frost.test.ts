import { describe, it, expect } from "@jest/globals";
import { frostLevelFor, frostModeFor, isFrostDay } from "../frost";

describe("Frostgraden", () => {
  // storyboard-2026 §2: [day, morning, after code, after bonus]
  const table: Array<[number, number, number, number?]> = [
    [7, 30, 22],
    [8, 34, 28],
    [9, 40, 32],
    [10, 71, 45],
    [11, 62, 48, 28],
    [12, 55, 32],
    [13, 44, 36],
    [14, 50, 40],
    [15, 56, 46],
    [16, 63, 50, 30],
    [17, 52, 42],
    [18, 60, 48],
    [19, 68, 56],
    [20, 88, 76],
    [21, 94, 32],
    [22, 40, 24],
    [23, 30, 10],
    [24, 12, 0],
  ];

  it.each(table)("day %i: %i unsolved, %i solved", (day, morning, after) => {
    expect(frostLevelFor(day, false)).toBe(morning);
    expect(frostLevelFor(day, true)).toBe(after);
  });

  it("bonus drops frost by 20 on days 11 and 16", () => {
    expect(frostLevelFor(11, true, true)).toBe(28);
    expect(frostLevelFor(16, true, true)).toBe(30);
    expect(frostLevelFor(12, true, true)).toBe(32);
  });

  it("is hidden on days 1–6", () => {
    for (let d = 1; d <= 6; d++) expect(frostLevelFor(d, false)).toBeNull();
  });
});

describe("Frost mode", () => {
  const base = { month: 12, hour: 7, solved: false, disabled: false };

  it("is level 1 on day 10 and level 2 on day 21 until solved", () => {
    expect(frostModeFor({ ...base, day: 10 }).level).toBe(1);
    expect(frostModeFor({ ...base, day: 21 }).level).toBe(2);
    expect(
      frostModeFor({ ...base, day: 21 }).message.length,
    ).toBeLessThanOrEqual(120);
    expect(frostModeFor({ ...base, day: 10, solved: true }).level).toBe(0);
    expect(frostModeFor({ ...base, day: 21, solved: true }).level).toBe(0);
  });

  it("is off on other days, outside December, after 20:00 and when switched off", () => {
    expect(frostModeFor({ ...base, day: 11 }).level).toBe(0);
    expect(frostModeFor({ ...base, day: 10, month: 11 }).level).toBe(0);
    expect(frostModeFor({ ...base, day: 10, hour: 20 }).level).toBe(0);
    expect(frostModeFor({ ...base, day: 21, disabled: true }).level).toBe(0);
    expect(isFrostDay(10) && isFrostDay(21) && !isFrostDay(20)).toBe(true);
  });
});

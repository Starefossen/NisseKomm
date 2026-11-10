import { describe, it, expect } from "@jest/globals";
import { frostLevelFor, frostModeFor } from "@/lib/frost";
import { channelEffects } from "./channels";

// The TV must mirror the app-wide frost mode at 10:00 on each December day.
function fx(day: number, solved: boolean, opts = {}) {
  const mode = frostModeFor({
    day,
    month: 12,
    hour: 10,
    solved,
    disabled: false,
    ...opts,
  }).level;
  const frost = frostLevelFor(day, solved) ?? 0;
  return channelEffects(1, 90, { day, solved, frost, mode, thawed: 0 });
}

describe("Snøfall TV frost state per day", () => {
  it.each([
    [1, false, 0, false, false],
    [7, false, 30, false, false],
    [10, false, 71, true, false],
    [10, true, 45, false, false],
    [17, false, 52, false, false],
    [21, false, 94, false, true],
    [24, false, 0, false, false],
  ])("day %i solved=%s", (day, solved, frost, gray, frozen) => {
    const e = fx(day, solved);
    expect([e.frost, e.gray, e.frozen]).toEqual([frost, gray, frozen]);
  });

  it("day 21 after the code thaws channel by channel", () => {
    const frozen = (ch: 1 | 2, thawed: number) =>
      channelEffects(ch, 90, {
        day: 21,
        solved: true,
        frost: 32,
        mode: 0,
        thawed,
      }).frozen;
    expect(frozen(1, 0)).toBe(true);
    expect(frozen(1, 1)).toBe(false);
    expect(frozen(2, 1)).toBe(true);
  });

  it("kill switch and 20:00 fail-safe lift the freeze and the grey", () => {
    expect(fx(21, false, { disabled: true }).frozen).toBe(false);
    expect(fx(21, false, { hour: 20 }).frozen).toBe(false);
    expect(fx(10, false, { disabled: true }).gray).toBe(false);
  });
});

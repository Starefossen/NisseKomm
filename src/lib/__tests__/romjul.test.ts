import { describe, it, expect, afterEach, jest } from "@jest/globals";
import { getAdventDay, getCurrentDay, isCalendarActive } from "../date-utils";
import { åpenTilDag } from "../kode";

const på = (iso: string) => {
  jest.useFakeTimers().setSystemTime(new Date(iso));
};

describe("romjul", () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  it.each([
    ["2026-12-25T12:00:00", true],
    ["2026-12-31T12:00:00", true],
    ["2026-12-26T12:00:00", true],
    ["2027-01-15T12:00:00", true],
    ["2027-01-31T23:00:00", true],
    ["2027-02-01T00:30:00", false],
    ["2026-11-30T12:00:00", false],
  ])("%s åpen=%s", (iso, åpen) => {
    på(iso);
    expect(isCalendarActive(false)).toBe(åpen);
    if (åpen) {
      expect(getCurrentDay()).toBe(24);
      expect(getAdventDay()).toBe(24);
    }
    expect(åpenTilDag(0)).toBe(åpen ? 24 : 0);
  });
  it("november beholder ekte dato", () => {
    på("2026-11-28T12:00:00");
    expect(getCurrentDay()).toBe(28);
    expect(åpenTilDag(0)).toBe(0);
  });
});

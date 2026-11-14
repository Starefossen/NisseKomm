import { describe, it, expect, afterEach, jest } from "@jest/globals";
import {
  dagFor,
  effektivDag,
  getAdventDay,
  getCurrentDay,
  isCalendarActive,
  sesongFase,
} from "../date-utils";
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

describe("sesongFase", () => {
  afterEach(() => {
    jest.useRealTimers();
    delete process.env.NEXT_PUBLIC_MOCK_DAY;
    delete process.env.NEXT_PUBLIC_MOCK_MONTH;
  });
  it.each([
    ["2026-11-30T12:00:00", "før", 0],
    ["2026-12-01T12:00:00", "advent", 1],
    ["2026-12-24T23:00:00", "advent", 24],
    ["2026-12-25T00:30:00", "romjul", 24],
    ["2027-01-06T12:00:00", "romjul", 24],
    ["2027-01-31T23:00:00", "romjul", 24],
    ["2027-02-01T00:30:00", "stengt", 0],
  ] as const)("%s → %s dag %i", (iso, fase, dag) => {
    jest.useFakeTimers().setSystemTime(new Date(iso));
    expect(sesongFase()).toBe(fase);
    expect(effektivDag()).toBe(dag);
    expect(dagFor(new Date(iso).getMonth() + 1, new Date(iso).getDate())).toBe(
      dag,
    );
  });
  it("mock-dag", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-10T12:00:00"));
    process.env.NEXT_PUBLIC_MOCK_DAY = "7";
    expect(sesongFase()).toBe("advent");
    expect(effektivDag()).toBe(7);
  });
});

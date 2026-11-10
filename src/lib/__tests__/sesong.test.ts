import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { StorageManager as SM } from "../storage";

function freshStorage(): typeof SM {
  let m!: typeof SM;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    m = require("../storage").StorageManager;
  });
  return m;
}

describe("sesongmarkør", () => {
  beforeEach(() => localStorage.clear());

  it("wipes 2025 progress once and keeps settings", () => {
    localStorage.setItem("nissekomm-codes", JSON.stringify([{ kode: "X" }]));
    localStorage.setItem("nissekomm-julius-watched", "[1,2]");
    localStorage.setItem("nissekomm-unlocked-modules", '["NISSENET"]');
    localStorage.setItem("nissekomm-sounds-enabled", "false");

    const sm = freshStorage();
    expect(sm.getSubmittedCodes()).toEqual([]);
    expect(sm.getUnlockedModules()).toEqual([]);
    expect(localStorage.getItem("nissekomm-julius-watched")).toBeNull();
    expect(sm.isSoundsEnabled()).toBe(false);
    expect(localStorage.getItem("nissekomm-season")).toBe("2026");
  });

  it("keeps this season's progress across reloads", () => {
    freshStorage().unlockModule("NISSENET");
    expect(freshStorage().getUnlockedModules()).toEqual(["NISSENET"]);
  });
});

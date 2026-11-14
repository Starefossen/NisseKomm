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
    expect(localStorage.getItem("nissekomm-unlocked-modules")).toBeNull();
    expect(localStorage.getItem("nissekomm-julius-watched")).toBeNull();
    expect(sm.isSoundsEnabled()).toBe(false);
    expect(localStorage.getItem("nissekomm-season")).toBe("2026");
  });

  it("never sends the wipe to the server (it archives and clears itself)", () => {
    localStorage.setItem(
      "nissekomm-santa-letters",
      '[{"day":1,"content":"x"}]',
    );
    jest.isolateModules(() => {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const a = require("../storage-adapter");
      const remove = jest.spyOn(a.LocalStorageAdapter.prototype, "remove");
      require("../storage").StorageManager.getSantaLetters();
      /* eslint-enable @typescript-eslint/no-require-imports */
      expect(remove).not.toHaveBeenCalled();
    });
    expect(localStorage.getItem("nissekomm-santa-letters")).toBeNull();
  });

  it("keeps this season's progress across reloads", () => {
    freshStorage().addSantaLetter(3, "hei");
    expect(freshStorage().getSantaLetters()).toHaveLength(1);
  });
});

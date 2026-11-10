/**
 * Badge System Tests: three badges (Varmebærer, Portvokter, Snøfalls venn)
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { BadgeManager } from "../badge-system";
import { StorageManager } from "../storage";

const solveDay = (day: number) =>
  StorageManager.addSubmittedCode({ kode: `X${day}`, dato: "", day });

describe("BadgeManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads exactly the three 2026 badges", () => {
    expect(BadgeManager.getAllBadges().map((b) => b.id)).toEqual([
      "varmebaerer",
      "portvokter",
      "snofalls-venn",
    ]);
    BadgeManager.getAllBadges().forEach((b) =>
      expect(b.opplasingstekst).toMatch(/^MERKE: /),
    );
  });

  it("awards Varmebærer when frosne-koder is decrypted", () => {
    expect(BadgeManager.checkAndAwardBadge("varmebaerer").success).toBe(false);
    StorageManager.addSolvedDecryption("frosne-koder");
    const result = BadgeManager.checkAndAwardBadge("varmebaerer");
    expect(result.success && result.isNewAward).toBe(true);
    expect(BadgeManager.checkAndAwardBadge("varmebaerer").isNewAward).toBe(
      false,
    );
  });

  it("awards Portvokter when day 21 is solved", () => {
    solveDay(20);
    expect(BadgeManager.checkAndAwardBadge("portvokter").success).toBe(false);
    solveDay(21);
    expect(BadgeManager.checkAndAwardBadge("portvokter").success).toBe(true);
  });

  it("awards Snøfalls venn only when all 24 days are solved", () => {
    for (let d = 1; d <= 23; d++) solveDay(d);
    expect(
      BadgeManager.checkAndAwardAllEligibleBadges().map((b) => b.id),
    ).toEqual(["portvokter"]);
    solveDay(24);
    expect(
      BadgeManager.checkAndAwardAllEligibleBadges().map((b) => b.id),
    ).toEqual(["snofalls-venn"]);
  });

  it("reports progress and resets", () => {
    StorageManager.addEarnedBadge("portvokter");
    expect(BadgeManager.getBadgeProgress()).toEqual({
      earned: 1,
      total: 3,
      percentage: 33,
    });
    BadgeManager.resetAllBadges();
    expect(BadgeManager.getEarnedBadges()).toEqual([]);
  });

  it("rejects unknown badge IDs", () => {
    expect(BadgeManager.checkAndAwardBadge("antenne-ingenior").success).toBe(
      false,
    );
  });
});

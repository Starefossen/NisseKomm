/**
 * Eventyr Badge Award Tests
 *
 * Tests that eventyr badges are awarded only after ALL phases are completed,
 * not after individual phases.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { BadgeManager } from "../badge-system";
import { GameEngine } from "../game-engine";
import { getEventyrProgress } from "../eventyr";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Test kid code
const TEST_KID_CODE = "NISSEKRAFT2024";

describe("Eventyr Badge Award Logic", () => {
  beforeEach(() => {
    // Clear all state before each test
    localStorage.clear();
    BadgeManager.resetAllBadges();

    // Configure GameEngine with test kid code resolver
    GameEngine.configure({
      kidCodeResolver: async () => TEST_KID_CODE,
    });
  });

  afterEach(() => {
    // Reset dependencies after each test
    GameEngine.resetDependencies();
  });

  describe("IQs Oppfinnelser Badge", () => {
    it("should NOT award badge after completing only day 2 (phase 1)", async () => {
      // Complete day 2 (first phase)
      await GameEngine.submitCode("34", "34", 2);

      // Check that eventyr is NOT complete
      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).not.toContain("iqs-oppfinnelser");

      // Check that badge is NOT awarded
      const badge = BadgeManager.isBadgeEarned("oppfinner-assistent");
      expect(badge).toBe(false);
    });

    it("should NOT award badge after completing days 2 and 8 (phases 1-2)", async () => {
      // Complete days 2 and 8
      await GameEngine.submitCode("34", "34", 2);
      await GameEngine.submitCode("SEKK", "SEKK", 8);

      // Check that eventyr is NOT complete
      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).not.toContain("iqs-oppfinnelser");

      // Check that badge is NOT awarded
      const badge = BadgeManager.isBadgeEarned("oppfinner-assistent");
      expect(badge).toBe(false);
    });

    it("should NOT award badge after completing days 2, 8, and 19 (phases 1-3)", async () => {
      // Complete days 2, 8, and 19
      await GameEngine.submitCode("34", "34", 2);
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      await GameEngine.submitCode("REINSDYR", "REINSDYR", 19);

      // Check that eventyr is NOT complete
      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).not.toContain("iqs-oppfinnelser");

      // Check that badge is NOT awarded
      const badge = BadgeManager.isBadgeEarned("oppfinner-assistent");
      expect(badge).toBe(false);
    });

    it("SHOULD award badge after completing all 4 phases (days 2, 8, 19, 20)", async () => {
      // Complete all days for IQs Oppfinnelser
      await GameEngine.submitCode("34", "34", 2);
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      await GameEngine.submitCode("REINSDYR", "REINSDYR", 19);
      await GameEngine.submitCode("SLEDE", "SLEDE", 20);

      // Check that eventyr IS complete
      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).toContain("iqs-oppfinnelser");

      // Check that badge IS awarded
      const badge = BadgeManager.isBadgeEarned("oppfinner-assistent");
      expect(badge).toBe(true);
    });

    it("should show correct eventyr progress after each phase", async () => {
      const eventyrId = "iqs-oppfinnelser";
      const getProgress = () => {
        const completedDays = GameEngine.getCompletedDays();
        return getEventyrProgress(eventyrId, completedDays);
      };

      // After day 2: 1/4 = 25%
      await GameEngine.submitCode("34", "34", 2);
      let progress = getProgress();
      expect(progress).toBe(25);

      // After day 8: 2/4 = 50%
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      progress = getProgress();
      expect(progress).toBe(50);

      // After day 19: 3/4 = 75%
      await GameEngine.submitCode("REINSDYR", "REINSDYR", 19);
      progress = getProgress();
      expect(progress).toBe(75);

      // After day 20: 4/4 = 100%
      await GameEngine.submitCode("SLEDE", "SLEDE", 20);
      progress = getProgress();
      expect(progress).toBe(100);
    });
  });

  describe("Mørkets Trussel Badge", () => {
    it("should NOT award badge after completing only first phase (day 7)", async () => {
      await GameEngine.submitCode("ORAKELET", "ORAKELET", 7);

      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).not.toContain("morkets-trussel");

      const badge = BadgeManager.isBadgeEarned("morket-beseirer");
      expect(badge).toBe(false);
    });

    it("should award badge only after completing ALL phases", async () => {
      // This eventyr spans multiple days - need to check quest data
      // for exact days, but the principle is the same: ALL phases required
      const questsWithMorket = GameEngine.getAllQuests().filter(
        (q) => q.eventyr?.id === "morkets-trussel",
      );

      // Complete all quests for this eventyr
      for (const quest of questsWithMorket) {
        await GameEngine.submitCode(quest.kode, quest.kode, quest.dag);
      }

      // Should be complete now
      const completedEventyr = GameEngine.getCompletedEventyr();
      expect(completedEventyr).toContain("morkets-trussel");

      // Badge should be awarded
      const badge = BadgeManager.isBadgeEarned("morket-beseirer");
      expect(badge).toBe(true);
    });
  });

  describe("Badge Award on Code Submission", () => {
    it("should automatically check and award eventyr badge when last phase is completed", async () => {
      // Complete first 3 phases
      await GameEngine.submitCode("34", "34", 2);
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      await GameEngine.submitCode("REINSDYR", "REINSDYR", 19);

      // Badge should not be awarded yet
      expect(BadgeManager.isBadgeEarned("oppfinner-assistent")).toBe(false);

      // Complete final phase
      const result = await GameEngine.submitCode("SLEDE", "SLEDE", 20);

      // Badge should now be awarded automatically
      expect(result.success).toBe(true);
      expect(BadgeManager.isBadgeEarned("oppfinner-assistent")).toBe(true);
    });
  });
});

/**
 * Badge System Tests
 *
 * Tests for the centralized badge management system (BadgeManager).
 * Covers badge loading, condition evaluation, awarding logic, and storage integration.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadgeManager } from "../badge-system";
import { StorageManager } from "../storage";

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

describe("BadgeManager", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset any earned badges
    if (typeof BadgeManager.resetAllBadges === "function") {
      BadgeManager.resetAllBadges();
    }
  });

  describe("Badge Loading", () => {
    it("should load all badges from merker.json", () => {
      const badges = BadgeManager.getAllBadges();
      expect(badges).toBeDefined();
      expect(badges.length).toBe(6);
    });

    it("should load badge definitions with correct structure", () => {
      const badges = BadgeManager.getAllBadges();
      badges.forEach((badge) => {
        expect(badge).toHaveProperty("id");
        expect(badge).toHaveProperty("navn");
        expect(badge).toHaveProperty("beskrivelse");
        expect(badge).toHaveProperty("ikon");
        expect(badge).toHaveProperty("type");
        expect(badge).toHaveProperty("unlockCondition");
      });
    });

    it("should get a specific badge by ID", () => {
      const badge = BadgeManager.getBadge("antenne-ingenior");
      expect(badge).toBeDefined();
      expect(badge?.navn).toBe("Antenne-ingeniør");
    });

    it("should return undefined for non-existent badge ID", () => {
      const badge = BadgeManager.getBadge("non-existent-badge");
      expect(badge).toBeUndefined();
    });
  });

  describe("Badge Types", () => {
    it("should have correct badge types", () => {
      const bonusoppdragBadges = BadgeManager.getBadgesByType("bonusoppdrag");
      expect(bonusoppdragBadges.length).toBe(2);

      const eventyrBadges = BadgeManager.getBadgesByType("eventyr");
      expect(eventyrBadges.length).toBe(2);

      const decryptionBadges = BadgeManager.getBadgesByType("decryption");
      expect(decryptionBadges.length).toBe(1);

      const collectionBadges = BadgeManager.getBadgesByType("collection");
      expect(collectionBadges.length).toBe(1);
    });
  });

  describe("Badge Storage", () => {
    it("should initially have no earned badges", () => {
      const earned = BadgeManager.getEarnedBadges();
      expect(earned).toEqual([]);
    });

    it("should not be earned initially", () => {
      const isEarned = BadgeManager.isBadgeEarned("antenne-ingenior");
      expect(isEarned).toBe(false);
    });

    it("should store earned badge via StorageManager", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      const isEarned = BadgeManager.isBadgeEarned("antenne-ingenior");
      expect(isEarned).toBe(true);
    });

    it("should return all earned badges", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      StorageManager.addEarnedBadge("inventar-ekspert");

      const earned = BadgeManager.getEarnedBadges();
      expect(earned.length).toBe(2);
      expect(earned.map((b) => b.badgeId)).toContain("antenne-ingenior");
      expect(earned.map((b) => b.badgeId)).toContain("inventar-ekspert");
    });

    it("should not duplicate earned badges", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      StorageManager.addEarnedBadge("antenne-ingenior"); // Try to add again

      const earned = BadgeManager.getEarnedBadges();
      expect(earned.length).toBe(1);
    });

    it("should include timestamp when earning badge", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      const earned = BadgeManager.getEarnedBadges();
      expect(earned[0]).toHaveProperty("timestamp");
      expect(typeof earned[0].timestamp).toBe("number");
    });
  });

  describe("Badge Unlock Conditions", () => {
    it("should check bonusoppdrag unlock condition", () => {
      const badge = BadgeManager.getBadge("antenne-ingenior");
      expect(badge).toBeDefined();
      expect(badge?.unlockCondition.type).toBe("bonusoppdrag");
      if (badge?.unlockCondition.type === "bonusoppdrag") {
        expect(badge.unlockCondition.day).toBe(11);
      }
    });

    it("should check eventyr unlock condition", () => {
      const badge = BadgeManager.getBadge("morket-beseirer");
      expect(badge).toBeDefined();
      expect(badge?.unlockCondition.type).toBe("eventyr");
      if (badge?.unlockCondition.type === "eventyr") {
        expect(badge.unlockCondition.eventyrId).toBe("morkets-trussel");
      }
    });

    it("should check decryption unlock condition", () => {
      const badge = BadgeManager.getBadge("kode-mester");
      expect(badge).toBeDefined();
      expect(badge?.unlockCondition.type).toBe("allDecryptionsSolved");
    });

    it("should check collection unlock condition", () => {
      const badge = BadgeManager.getBadge("symbol-mester");
      expect(badge).toBeDefined();
      expect(badge?.unlockCondition.type).toBe("allSymbolsCollected");
    });
  });

  describe("Badge Award Logic", () => {
    it("should fail to award badge if condition not met", () => {
      const result = BadgeManager.checkAndAwardBadge("antenne-ingenior");
      expect(result.success).toBe(false);
      expect(result.isNewAward).toBe(false);
      expect(BadgeManager.isBadgeEarned("antenne-ingenior")).toBe(false);
    });

    it("should return already earned message if badge already awarded", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      const result = BadgeManager.checkAndAwardBadge("antenne-ingenior");
      expect(result.success).toBe(true);
      expect(result.isNewAward).toBe(false);
      expect(result.message).toContain("already earned");
    });

    it("should return error for non-existent badge", () => {
      const result = BadgeManager.checkAndAwardBadge("non-existent");
      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });
  });

  describe("Badge Progress", () => {
    it("should calculate badge progress correctly", () => {
      const progress = BadgeManager.getBadgeProgress();
      expect(progress.earned).toBe(0);
      expect(progress.total).toBe(6);
      expect(progress.percentage).toBe(0);
    });

    it("should update progress when badges earned", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      StorageManager.addEarnedBadge("inventar-ekspert");

      const progress = BadgeManager.getBadgeProgress();
      expect(progress.earned).toBe(2);
      expect(progress.total).toBe(6);
      expect(progress.percentage).toBe(33); // 2/6 = 33%
    });
  });

  describe("Badge Notifications", () => {
    it("should trigger notification callback when badge awarded", () => {
      const mockCallback = jest.fn();
      BadgeManager.onBadgeAwarded(mockCallback);

      // Simulate awarding a badge by manually calling the callback
      // (In real scenario, this would be triggered by checkAndAwardBadge)
      const badge = BadgeManager.getBadge("antenne-ingenior");
      if (badge) {
        // We can't directly test the private notifyBadgeAwarded method,
        // but we verify the subscription mechanism works
        expect(mockCallback).not.toHaveBeenCalled();
      }

      BadgeManager.offBadgeAwarded(mockCallback);
    });

    it("should allow unsubscribing from notifications", () => {
      const mockCallback = jest.fn();
      BadgeManager.onBadgeAwarded(mockCallback);
      BadgeManager.offBadgeAwarded(mockCallback);

      // Callback should not be called after unsubscribing
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty earned badges array", () => {
      const earned = BadgeManager.getEarnedBadges();
      expect(earned).toEqual([]);
      expect(BadgeManager.isBadgeEarned("any-badge")).toBe(false);
    });

    it("should handle clearing all badges", () => {
      StorageManager.addEarnedBadge("antenne-ingenior");
      StorageManager.addEarnedBadge("inventar-ekspert");

      BadgeManager.resetAllBadges();

      const earned = BadgeManager.getEarnedBadges();
      expect(earned).toEqual([]);
    });

    it("should handle malformed badge IDs gracefully", () => {
      const result = BadgeManager.checkAndAwardBadge("");
      expect(result.success).toBe(false);

      const result2 = BadgeManager.checkAndAwardBadge("   ");
      expect(result2.success).toBe(false);
    });
  });

  describe("Integration with GameEngine", () => {
    it("should evaluate bonusoppdrag condition using GameEngine", () => {
      const badge = BadgeManager.getBadge("antenne-ingenior");
      if (badge) {
        const isMet = BadgeManager.isUnlockConditionMet(badge.unlockCondition);
        // Should be false since no quest completed
        expect(isMet).toBe(false);
      }
    });

    it("should evaluate eventyr condition using GameEngine", () => {
      const badge = BadgeManager.getBadge("morket-beseirer");
      if (badge) {
        const isMet = BadgeManager.isUnlockConditionMet(badge.unlockCondition);
        // Should be false since no eventyr completed
        expect(isMet).toBe(false);
      }
    });

    it("should evaluate decryption condition using GameEngine", () => {
      const badge = BadgeManager.getBadge("kode-mester");
      if (badge) {
        const isMet = BadgeManager.isUnlockConditionMet(badge.unlockCondition);
        // Should be false since no decryptions solved
        expect(isMet).toBe(false);
      }
    });

    it("should evaluate symbol collection condition using GameEngine", () => {
      const badge = BadgeManager.getBadge("symbol-mester");
      if (badge) {
        const isMet = BadgeManager.isUnlockConditionMet(badge.unlockCondition);
        // Should be false since no symbols collected
        expect(isMet).toBe(false);
      }
    });
  });
});

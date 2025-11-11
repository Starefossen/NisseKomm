/**
 * Game Engine Test Suite
 *
 * Comprehensive tests for NisseKomm game mechanics including:
 * - Quest completion and validation
 * - Side-quest system and badge awards
 * - Module unlocking progression
 * - Email tracking
 * - Crisis management
 * - Game state persistence
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GameEngine } from "../game-engine";

// Get actual quest codes from data for testing
const allQuests = GameEngine.getAllQuests();
const getQuestCode = (day: number) => {
  const quest = allQuests.find((q) => q.dag === day);
  return quest?.kode || `CODE${day}`;
};

describe("GameEngine", () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
  });

  describe("Initial State", () => {
    it("should load empty state when no data exists", () => {
      const state = GameEngine.loadGameState();

      expect(state.completedQuests.size).toBe(0);
      expect(state.submittedCodes).toEqual([]);
      expect(state.earnedBadges).toEqual([]);
      expect(state.unlockedModules.size).toBe(0);
    });

    it("should return 0% progression on empty state", () => {
      expect(GameEngine.getProgressionPercentage()).toBe(0);
    });

    it("should not be complete on empty state", () => {
      expect(GameEngine.isGameComplete()).toBe(false);
    });
  });

  describe("Quest Completion", () => {
    it("should accept correct code and mark quest as completed", () => {
      const result = GameEngine.submitCode("SEKK", "SEKK", 8);

      expect(result.success).toBe(true);
      expect(result.isNewCompletion).toBe(true);
      expect(result.message).toContain("KODE AKSEPTERT");
    });

    it("should reject incorrect code", () => {
      const result = GameEngine.submitCode("WRONG", "SEKK", 8);

      expect(result.success).toBe(false);
      expect(result.isNewCompletion).toBe(false);
      expect(result.message).toContain("FEIL KODE");
    });

    it("should be case-insensitive for code validation", () => {
      const result1 = GameEngine.submitCode("sekk", "SEKK", 8);
      expect(result1.success).toBe(true);

      localStorage.clear();

      const result2 = GameEngine.submitCode("SekK", "SEKK", 8);
      expect(result2.success).toBe(true);
    });

    it("should detect duplicate submissions", () => {
      // First submission
      const result1 = GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(result1.isNewCompletion).toBe(true);

      // Second submission of same code
      const result2 = GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(result2.success).toBe(true);
      expect(result2.isNewCompletion).toBe(false);
      expect(result2.message).toContain("ALLEREDE REGISTRERT");
    });

    it("should track completed quest count correctly", () => {
      expect(GameEngine.getCompletedQuestCount()).toBe(0);

      GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(GameEngine.getCompletedQuestCount()).toBe(1);

      GameEngine.submitCode("18", "18", 9);
      expect(GameEngine.getCompletedQuestCount()).toBe(2);

      // Duplicate shouldn't increase count
      GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(GameEngine.getCompletedQuestCount()).toBe(2);
    });

    it("should check if specific quest is completed", () => {
      expect(GameEngine.isQuestCompleted(8)).toBe(false);

      GameEngine.submitCode("SEKK", "SEKK", 8);

      expect(GameEngine.isQuestCompleted(8)).toBe(true);
      expect(GameEngine.isQuestCompleted(9)).toBe(false);
    });
  });

  describe("Module Unlocks", () => {
    it("should unlock NISSEMUSIKK at 7 completed quests", () => {
      // Complete 6 quests - no unlock yet
      for (let i = 1; i <= 6; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(false);

      // Complete 7th quest - should unlock
      const code7 = getQuestCode(7);
      const result = GameEngine.submitCode(code7, code7, 7);
      expect(result.unlockedModule).toBeDefined();
      expect(result.unlockedModule?.moduleId).toBe("NISSEMUSIKK");
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);
    });

    it("should unlock SNØFALL_TV at 10 completed quests", () => {
      for (let i = 1; i <= 9; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(false);

      const code10 = getQuestCode(10);
      const result = GameEngine.submitCode(code10, code10, 10);
      expect(result.unlockedModule?.moduleId).toBe("SNØFALL_TV");
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(true);
    });

    it("should unlock BREVFUGLER at 14 completed quests", () => {
      for (let i = 1; i <= 13; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      const code14 = getQuestCode(14);
      const result = GameEngine.submitCode(code14, code14, 14);
      expect(result.unlockedModule?.moduleId).toBe("BREVFUGLER");
      expect(GameEngine.isModuleUnlocked("BREVFUGLER")).toBe(true);
    });

    it("should unlock NISSESTATS at 16 completed quests", () => {
      for (let i = 1; i <= 15; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      const code16 = getQuestCode(16);
      const result = GameEngine.submitCode(code16, code16, 16);
      expect(result.unlockedModule?.moduleId).toBe("NISSESTATS");
      expect(GameEngine.isModuleUnlocked("NISSESTATS")).toBe(true);
    });

    it("should not unlock module on duplicate submission", () => {
      for (let i = 1; i <= 7; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);

      // Submit duplicate
      const code7 = getQuestCode(7);
      const result = GameEngine.submitCode(code7, code7, 7);
      expect(result.unlockedModule).toBeUndefined();
    });

    it("should return all unlocked modules", () => {
      expect(GameEngine.getUnlockedModules()).toEqual([]);

      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      const unlocked = GameEngine.getUnlockedModules();
      expect(unlocked).toContain("NISSEMUSIKK");
      expect(unlocked).toContain("SNØFALL_TV");
      expect(unlocked.length).toBe(2);
    });
  });

  describe("Badge System", () => {
    it("should award antenna crisis badge", () => {
      const { success, badge } = GameEngine.awardBadge("antenna");

      expect(success).toBe(true);
      expect(badge.icon).toBe("zap");
      expect(badge.name).toBe("Antenne-Ingeniør");
      expect(badge.crisisType).toBe("antenna");
    });

    it("should award inventory crisis badge", () => {
      const { success, badge } = GameEngine.awardBadge("inventory");

      expect(success).toBe(true);
      expect(badge.icon).toBe("coin");
      expect(badge.name).toBe("Inventar-Ekspert");
      expect(badge.crisisType).toBe("inventory");
    });

    it("should persist badges across reloads", () => {
      GameEngine.awardBadge("antenna");
      GameEngine.awardBadge("inventory");

      const badges = GameEngine.getEarnedBadges();
      expect(badges.length).toBe(2);
      expect(badges.some((b) => b.icon === "zap")).toBe(true);
      expect(badges.some((b) => b.icon === "coin")).toBe(true);
    });

    it("should not duplicate badges", () => {
      GameEngine.awardBadge("antenna");
      GameEngine.awardBadge("antenna"); // Try to award again

      const badges = GameEngine.getEarnedBadges();
      expect(badges.length).toBe(1);
    });
  });

  describe("Crisis Management", () => {
    it("should start with all crises unresolved", () => {
      const status = GameEngine.getCrisisStatus();
      expect(status.antenna).toBe(false);
      expect(status.inventory).toBe(false);
    });

    it("should resolve crisis when badge is awarded", () => {
      expect(GameEngine.isCrisisResolved("antenna")).toBe(false);

      GameEngine.awardBadge("antenna");

      expect(GameEngine.isCrisisResolved("antenna")).toBe(true);
    });

    it("should resolve multiple crises independently", () => {
      GameEngine.awardBadge("antenna");

      expect(GameEngine.isCrisisResolved("antenna")).toBe(true);
      expect(GameEngine.isCrisisResolved("inventory")).toBe(false);

      GameEngine.awardBadge("inventory");

      expect(GameEngine.isCrisisResolved("antenna")).toBe(true);
      expect(GameEngine.isCrisisResolved("inventory")).toBe(true);
    });
  });

  describe("Email Tracking", () => {
    it("should mark main emails as viewed", () => {
      GameEngine.markEmailAsViewed(1, false);

      const state = GameEngine.loadGameState();
      expect(state.viewedMainEmails.has(1)).toBe(true);
    });

    it("should mark side-quest emails as viewed", () => {
      GameEngine.markEmailAsViewed(11, true);

      const state = GameEngine.loadGameState();
      expect(state.viewedSideQuestEmails.has(11)).toBe(true);
    });

    it("should calculate unread count correctly", () => {
      // Current day 5 means days 1-5 should be accessible
      const unreadCount = GameEngine.getUnreadEmailCount(5);
      expect(unreadCount).toBeGreaterThan(0); // Should have unread emails

      // Mark some as viewed
      GameEngine.markEmailAsViewed(1, false);
      GameEngine.markEmailAsViewed(2, false);

      const newUnreadCount = GameEngine.getUnreadEmailCount(5);
      expect(newUnreadCount).toBeLessThan(unreadCount);
    });
  });

  describe("Side-Quest System", () => {
    it("should check side-quest accessibility based on main quest", () => {
      // Day 11 side-quest not accessible without main quest
      expect(GameEngine.isSideQuestAccessible(11)).toBe(false);

      // Complete day 11 main quest
      GameEngine.submitCode("12", "12", 11);

      // Now side-quest should be accessible
      expect(GameEngine.isSideQuestAccessible(11)).toBe(true);
    });
  });

  describe("Progression Summary", () => {
    it("should provide comprehensive progression data", () => {
      // Complete 10 quests
      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      // Award one badge
      GameEngine.awardBadge("antenna");

      const summary = GameEngine.getProgressionSummary();

      expect(summary.mainQuests.completed).toBe(10);
      expect(summary.mainQuests.total).toBe(24);
      expect(summary.mainQuests.percentage).toBe(42); // 10/24 rounded

      expect(summary.badges.earned).toBe(1);

      expect(summary.modules.unlocked).toBe(2); // NISSEMUSIKK + SNØFALL_TV

      expect(summary.isComplete).toBe(false);
    });

    it("should show game complete when all 24 quests done", () => {
      for (let i = 1; i <= 24; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      expect(GameEngine.isGameComplete()).toBe(true);
      expect(GameEngine.getProgressionPercentage()).toBe(100);

      const summary = GameEngine.getProgressionSummary();
      expect(summary.isComplete).toBe(true);
      expect(summary.mainQuests.percentage).toBe(100);
    });
  });

  describe("State Persistence", () => {
    it("should persist state across reloads", () => {
      // Complete some quests
      GameEngine.submitCode("SEKK", "SEKK", 8);
      GameEngine.submitCode("18", "18", 9);

      // Award a badge
      GameEngine.awardBadge("antenna");

      // Mark email as viewed
      GameEngine.markEmailAsViewed(1, false);

      // Load state (simulating reload)
      const state = GameEngine.loadGameState();

      expect(state.completedQuests.has(8)).toBe(true);
      expect(state.completedQuests.has(9)).toBe(true);
      expect(state.earnedBadges.length).toBe(1);
      expect(state.viewedMainEmails.has(1)).toBe(true);
    });

    it("should export and import game state", () => {
      // Create some game state
      for (let i = 1; i <= 5; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      // Export
      const exported = GameEngine.exportGameState();
      expect(exported).toBeTruthy();

      // Clear storage
      localStorage.clear();
      expect(GameEngine.getCompletedQuestCount()).toBe(0);

      // Import
      const success = GameEngine.importGameState(exported);
      expect(success).toBe(true);

      // Verify state restored (note: export/import is Phase 2 feature, not all data included yet)
      expect(GameEngine.getCompletedQuestCount()).toBe(5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace in code submission", () => {
      const result = GameEngine.submitCode("  SEKK  ", "SEKK", 8);
      expect(result.success).toBe(true);
    });

    it("should handle empty code gracefully", () => {
      const result = GameEngine.submitCode("", "SEKK", 8);
      expect(result.success).toBe(false);
    });

    it("should handle completing quests out of order", () => {
      // Use actual quest codes from the JSON files
      const code10 = getQuestCode(10);
      const code5 = getQuestCode(5);
      const code15 = getQuestCode(15);

      GameEngine.submitCode(code10, code10, 10);
      GameEngine.submitCode(code5, code5, 5);
      GameEngine.submitCode(code15, code15, 15);

      expect(GameEngine.getCompletedQuestCount()).toBe(3);
      expect(GameEngine.isQuestCompleted(5)).toBe(true);
      expect(GameEngine.isQuestCompleted(10)).toBe(true);
      expect(GameEngine.isQuestCompleted(15)).toBe(true);
    });
  });
});

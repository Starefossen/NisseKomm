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
import { BadgeManager } from "../badge-system";
import * as eventyr from "../eventyr";

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
    it("should unlock NISSEKRYPTO on day 4 completion", () => {
      expect(GameEngine.isModuleUnlocked("NISSEKRYPTO")).toBe(false);

      const code4 = getQuestCode(4);
      GameEngine.submitCode(code4, code4, 4);
      expect(GameEngine.isModuleUnlocked("NISSEKRYPTO")).toBe(true);
    });

    it("should unlock NISSEMUSIKK on day 7 completion", () => {
      // Complete 6 quests - no unlock yet
      for (let i = 1; i <= 6; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(false);

      // Complete day 7 quest - should unlock NISSEMUSIKK
      const code7 = getQuestCode(7);
      GameEngine.submitCode(code7, code7, 7);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);
    });

    it("should unlock SNØFALL_TV on day 10 completion", () => {
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(false);

      const code10 = getQuestCode(10);
      GameEngine.submitCode(code10, code10, 10);
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(true);
    });

    it("should unlock BREVFUGLER on day 14 completion", () => {
      expect(GameEngine.isModuleUnlocked("BREVFUGLER")).toBe(false);

      const code14 = getQuestCode(14);
      GameEngine.submitCode(code14, code14, 14);
      expect(GameEngine.isModuleUnlocked("BREVFUGLER")).toBe(true);
    });

    it("should unlock NISSESTATS on day 16 completion", () => {
      expect(GameEngine.isModuleUnlocked("NISSESTATS")).toBe(false);

      const code16 = getQuestCode(16);
      GameEngine.submitCode(code16, code16, 16);
      expect(GameEngine.isModuleUnlocked("NISSESTATS")).toBe(true);
    });

    it("should not unlock module on duplicate submission", () => {
      const code7 = getQuestCode(7);
      GameEngine.submitCode(code7, code7, 7);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);

      // Submit duplicate - module stays unlocked but no duplicate unlock
      const result = GameEngine.submitCode(code7, code7, 7);
      expect(result.isNewCompletion).toBe(false);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);
    });

    it("should return all unlocked modules", () => {
      expect(GameEngine.getUnlockedModules()).toEqual([]);

      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      const unlocked = GameEngine.getUnlockedModules();
      expect(unlocked).toContain("NISSEKRYPTO");
      expect(unlocked).toContain("NISSEMUSIKK");
      expect(unlocked).toContain("SNØFALL_TV");
      expect(unlocked.length).toBe(3);
    });
  });

  describe("Badge System", () => {
    it("should award antenna crisis badge", () => {
      const result = BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

      expect(result.success).toBe(true);
      expect(result.badge.ikon).toBe("cloud-sharing.svg");
      expect(result.badge.navn).toBe("Antenne-ingeniør");
    });

    it("should award inventory crisis badge", () => {
      const result = BadgeManager.checkAndAwardBadge("inventar-ekspert", true);

      expect(result.success).toBe(true);
      expect(result.badge.ikon).toBe("loupe-and-bill.svg");
      expect(result.badge.navn).toBe("Inventar-ekspert");
    });

    it("should persist badges across reloads", () => {
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);
      BadgeManager.checkAndAwardBadge("inventar-ekspert", true);

      const badges = BadgeManager.getEarnedBadges();
      expect(badges.length).toBe(2);
      expect(badges.some((b) => b.badgeId === "antenne-ingenior")).toBe(true);
      expect(badges.some((b) => b.badgeId === "inventar-ekspert")).toBe(true);
    });

    it("should not duplicate badges", () => {
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true); // Try to award again

      const badges = BadgeManager.getEarnedBadges();
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

      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

      expect(GameEngine.isCrisisResolved("antenna")).toBe(true);
    });

    it("should resolve multiple crises independently", () => {
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

      expect(GameEngine.isCrisisResolved("antenna")).toBe(true);
      expect(GameEngine.isCrisisResolved("inventory")).toBe(false);

      BadgeManager.checkAndAwardBadge("inventar-ekspert", true);

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
      expect(state.viewedBonusOppdragEmails.has(11)).toBe(true);
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

  describe("Bonusoppdrag System", () => {
    it("should check side-quest accessibility based on main quest", () => {
      // Day 11 side-quest not accessible without main quest
      expect(GameEngine.isBonusOppdragAccessible(11)).toBe(false);

      // Complete day 11 main quest
      GameEngine.submitCode("12", "12", 11);

      // Now side-quest should be accessible
      expect(GameEngine.isBonusOppdragAccessible(11)).toBe(true);
    });
  });

  describe("Progression Summary", () => {
    it("should provide comprehensive progression data", () => {
      // Complete 10 quests
      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        GameEngine.submitCode(code, code, i);
      }

      // Award one bonus badge manually
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

      const summary = GameEngine.getProgressionSummary();

      expect(summary.mainQuests.completed).toBe(10);
      expect(summary.mainQuests.total).toBe(24);
      expect(summary.mainQuests.percentage).toBe(42); // 10/24 rounded

      // Badge count includes automatically awarded badges from eventyr completion
      // Day 1-10 completes multiple eventyr arcs which award badges automatically
      expect(summary.badges.earned).toBeGreaterThanOrEqual(1);
      expect(summary.badges.total).toBe(6); // Total badges available in merker.json

      expect(summary.modules.unlocked).toBe(3); // NISSEKRYPTO + NISSEMUSIKK + SNØFALL_TV

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
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

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

  describe("Eventy System", () => {
    it("should load all story arcs from eventyr.json", () => {
      const arcs = eventyr.getAllEventyr();

      expect(arcs.length).toBeGreaterThan(0);
      expect(arcs.length).toBe(9); // 5 major + 4 mini eventyr
    });

    it("should validate story arc structure", () => {
      const arcs = eventyr.getAllEventyr();

      arcs.forEach((arc) => {
        // Check required fields
        expect(arc.id).toBeDefined();
        expect(arc.navn).toBeDefined();
        expect(arc.beskrivelse).toBeDefined();
        expect(arc.tema).toBeInstanceOf(Array);
        expect(arc.farge).toMatch(/^#[0-9a-f]{6}$/i);
        expect(arc.ikon).toBeDefined();
        expect(["lett", "middels", "vanskelig"]).toContain(
          arc.vanskelighetsgrad,
        );
        expect(arc.belønning).toBeDefined();
        expect(arc.foreldreveiledning).toBeDefined();
      });
    });

    it("should derive days from oppdrag files correctly", () => {
      // Check brevfugl-mysteriet (Days 1, 5, 12, 14)
      const brevfuglDays = eventyr.getEventyrDays("brevfugl-mysteriet");
      expect(brevfuglDays).toEqual([1, 5, 12, 14]);

      // Check morkets-trussel (Days 7, 11, 17, 21)
      const morketDays = eventyr.getEventyrDays("morkets-trussel");
      expect(morketDays).toEqual([7, 11, 17, 21]);

      // Check farge-mysteriet (Days 10, 15)
      const fargeDays = eventyr.getEventyrDays("farge-mysteriet");
      expect(fargeDays).toEqual([10, 15]);
    });

    it("should identify arcs for a specific day", () => {
      // Day 1 should have brevfugl-mysteriet
      const day1Eventyr = eventyr.getEventyrForDay(1);
      expect(day1Eventyr.length).toBe(1);
      expect(day1Eventyr[0].id).toBe("brevfugl-mysteriet");

      // Day 17 might have multiple arcs (cross-reference)
      const day17Eventyr = eventyr.getEventyrForDay(17);
      expect(day17Eventyr.length).toBeGreaterThanOrEqual(1);
    });

    it("should track arc completion based on completed quests", () => {
      // Complete all brevfugl-mysteriet days
      GameEngine.submitCode(getQuestCode(1), getQuestCode(1), 1);
      GameEngine.submitCode(getQuestCode(5), getQuestCode(5), 5);
      GameEngine.submitCode(getQuestCode(12), getQuestCode(12), 12);
      GameEngine.submitCode(getQuestCode(14), getQuestCode(14), 14);

      const completedDays = new Set([1, 5, 12, 14]);
      expect(
        eventyr.isEventyrComplete("brevfugl-mysteriet", completedDays),
      ).toBe(true);
    });

    it("should calculate arc progress correctly", () => {
      // Complete 2 out of 4 days for brevfugl-mysteriet
      GameEngine.submitCode(getQuestCode(1), getQuestCode(1), 1);
      GameEngine.submitCode(getQuestCode(5), getQuestCode(5), 5);

      const completedDays = new Set([1, 5]);
      const percentage = eventyr.getEventyrProgress(
        "brevfugl-mysteriet",
        completedDays,
      );

      // getEventyrProgress returns a percentage directly, not an object
      expect(percentage).toBe(50);
    });

    it("should distinguish between major and mini arcs", () => {
      const majorEventyr = eventyr.getMajorEventyr();
      const miniEventyr = eventyr.getMiniEventyr();

      // Major arcs have 3+ days
      majorEventyr.forEach((arc) => {
        expect(eventyr.getEventyrDays(arc.id).length).toBeGreaterThanOrEqual(3);
      });

      // Mini arcs have < 3 days
      miniEventyr.forEach((arc) => {
        expect(eventyr.getEventyrDays(arc.id).length).toBeLessThan(3);
      });
    });

    it("should provide parent guidance for each arc", () => {
      const arcs = eventyr.getAllEventyr();

      arcs.forEach((arc) => {
        const guidance = eventyr.getParentGuidance(arc.id);

        expect(guidance).toBeDefined();
        if (guidance) {
          expect(guidance.sammendrag).toBeDefined();
          expect(guidance.pedagogisk_fokus).toBeInstanceOf(Array);
          expect(guidance.tips).toBeInstanceOf(Array);
          expect(guidance.pedagogisk_fokus.length).toBeGreaterThan(0);
          expect(guidance.tips.length).toBeGreaterThan(0);
        }
      });
    });

    it("should validate all quest eventyr references", () => {
      // This is already validated at build time, but test it works
      const quests = GameEngine.getAllQuests();

      const validEventyrIds = new Set(
        eventyr.getAllEventyr().map((arc) => arc.id),
      );

      quests.forEach((quest) => {
        if (quest.eventyr) {
          expect(validEventyrIds.has(quest.eventyr.id)).toBe(true);
          expect(quest.eventyr.phase).toBeGreaterThanOrEqual(1);
          expect(quest.eventyr.phase).toBeLessThanOrEqual(5);
        }
      });
    });

    it("should have sequential phases within each arc", () => {
      const quests = GameEngine.getAllQuests();
      const arcs = eventyr.getAllEventyr();

      arcs.forEach((arc) => {
        const arcQuests = quests
          .filter((q) => q.eventyr?.id === arc.id)
          .sort((a, b) => a.dag - b.dag);

        const phases = arcQuests.map((q) => q.eventyr!.phase);

        // Phases should be sequential: 1, 2, 3, 4...
        for (let i = 0; i < phases.length; i++) {
          expect(phases[i]).toBe(i + 1);
        }
      });
    });

    it("should return arc metadata (color, icon)", () => {
      // Test known arcs
      const morketColor = eventyr.getEventyrColor("morkets-trussel");
      expect(morketColor).toBe("#8b0000"); // Dark red

      const iqIcon = eventyr.getEventyrIcon("iqs-oppfinnelser");
      expect(iqIcon).toBe("zap"); // Lightning bolt
    });

    it("should handle invalid arc IDs gracefully", () => {
      // Functions return undefined for invalid IDs
      expect(eventyr.getEventyr("nonexistent-arc")).toBeUndefined();
      expect(eventyr.getEventyrDays("nonexistent-arc")).toEqual([]);
      expect(eventyr.getParentGuidance("nonexistent-arc")).toBeUndefined();
    });
  });
});

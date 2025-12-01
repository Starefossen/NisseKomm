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

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { GameEngine } from "../game-engine";
import { BadgeManager } from "../badge-system";
import * as eventyr from "../eventyr";

// Get actual quest codes from data for testing
const allQuests = GameEngine.getAllQuests();

// Test kid code for Day 1 (which uses {{KID_CODE}} placeholder)
const TEST_KID_CODE = "NISSEKRAFT2024";

const getQuestCode = (day: number) => {
  const quest = allQuests.find((q) => q.dag === day);
  const code = quest?.kode || `CODE${day}`;
  // Replace placeholder with test code
  return code === "{{KID_CODE}}" ? TEST_KID_CODE : code;
};

describe("GameEngine", () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();

    // Configure GameEngine with test kid code resolver
    GameEngine.configure({
      kidCodeResolver: async () => TEST_KID_CODE,
    });
  });

  afterEach(() => {
    // Reset dependencies after each test
    GameEngine.resetDependencies();
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
    it("should accept correct code and mark quest as completed", async () => {
      const result = await GameEngine.submitCode("SEKK", "SEKK", 8);

      expect(result.success).toBe(true);
      expect(result.isNewCompletion).toBe(true);
      expect(result.message).toContain("KODE AKSEPTERT");
    });

    it("should reject incorrect code", async () => {
      const result = await GameEngine.submitCode("WRONG", "SEKK", 8);

      expect(result.success).toBe(false);
      expect(result.isNewCompletion).toBe(false);
      expect(result.message).toContain("FEIL KODE");
    });

    it("should be case-insensitive for code validation", async () => {
      const result1 = await GameEngine.submitCode("sekk", "SEKK", 8);
      expect(result1.success).toBe(true);

      localStorage.clear();

      const result2 = await GameEngine.submitCode("SekK", "SEKK", 8);
      expect(result2.success).toBe(true);
    });

    it("should detect duplicate submissions", async () => {
      // First submission
      const result1 = await GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(result1.isNewCompletion).toBe(true);

      // Second submission of same code
      const result2 = await GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(result2.success).toBe(true);
      expect(result2.isNewCompletion).toBe(false);
      expect(result2.message).toContain("ALLEREDE REGISTRERT");
    });

    it("should track completed quest count correctly", async () => {
      expect(GameEngine.getCompletedQuestCount()).toBe(0);

      await GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(GameEngine.getCompletedQuestCount()).toBe(1);

      await GameEngine.submitCode("18", "18", 9);
      expect(GameEngine.getCompletedQuestCount()).toBe(2);

      // Duplicate shouldn't increase count
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      expect(GameEngine.getCompletedQuestCount()).toBe(2);
    });

    it("should check if specific quest is completed", async () => {
      expect(GameEngine.isQuestCompleted(8)).toBe(false);

      await GameEngine.submitCode("SEKK", "SEKK", 8);

      expect(GameEngine.isQuestCompleted(8)).toBe(true);
      expect(GameEngine.isQuestCompleted(9)).toBe(false);
    });
  });

  describe("Module Unlocks", () => {
    it("should unlock NISSEKRYPTO on day 4 completion", async () => {
      expect(GameEngine.isModuleUnlocked("NISSEKRYPTO")).toBe(false);

      const code4 = getQuestCode(4);
      await GameEngine.submitCode(code4, code4, 4);
      expect(GameEngine.isModuleUnlocked("NISSEKRYPTO")).toBe(true);
    });

    it("should unlock NISSEMUSIKK on day 7 completion", async () => {
      // Complete 6 quests - no unlock yet
      for (let i = 1; i <= 6; i++) {
        const code = getQuestCode(i);
        await GameEngine.submitCode(code, code, i);
      }
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(false);

      // Complete day 7 quest - should unlock NISSEMUSIKK
      const code7 = getQuestCode(7);
      await GameEngine.submitCode(code7, code7, 7);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);
    });

    it("should unlock SNØFALL_TV on day 10 completion", async () => {
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(false);

      const code10 = getQuestCode(10);
      await GameEngine.submitCode(code10, code10, 10);
      expect(GameEngine.isModuleUnlocked("SNØFALL_TV")).toBe(true);
    });

    it("should unlock BREVFUGLER on day 14 completion", async () => {
      expect(GameEngine.isModuleUnlocked("BREVFUGLER")).toBe(false);

      const code14 = getQuestCode(14);
      await GameEngine.submitCode(code14, code14, 14);
      expect(GameEngine.isModuleUnlocked("BREVFUGLER")).toBe(true);
    });

    it("should unlock NISSESTATS on day 16 completion", async () => {
      expect(GameEngine.isModuleUnlocked("NISSESTATS")).toBe(false);

      const code16 = getQuestCode(16);
      await GameEngine.submitCode(code16, code16, 16);
      expect(GameEngine.isModuleUnlocked("NISSESTATS")).toBe(true);
    });

    it("should not unlock module on duplicate submission", async () => {
      const code7 = getQuestCode(7);
      await GameEngine.submitCode(code7, code7, 7);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);

      // Submit duplicate - module stays unlocked but no duplicate unlock
      const result = await GameEngine.submitCode(code7, code7, 7);
      expect(result.isNewCompletion).toBe(false);
      expect(GameEngine.isModuleUnlocked("NISSEMUSIKK")).toBe(true);
    });

    it("should return all unlocked modules", async () => {
      expect(GameEngine.getUnlockedModules()).toEqual([]);

      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        await GameEngine.submitCode(code, code, i);
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
    it("should check side-quest accessibility based on main quest", async () => {
      // Day 11 side-quest not accessible without main quest
      expect(GameEngine.isBonusOppdragAccessible(11)).toBe(false);

      // Complete day 11 main quest
      await GameEngine.submitCode("12", "12", 11);

      // Now side-quest should be accessible
      expect(GameEngine.isBonusOppdragAccessible(11)).toBe(true);
    });
  });

  describe("Progression Summary", () => {
    it("should provide comprehensive progression data", async () => {
      // Complete 10 quests
      for (let i = 1; i <= 10; i++) {
        const code = getQuestCode(i);
        await GameEngine.submitCode(code, code, i);
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
      expect(summary.badges.total).toBe(7); // Total badges available in merker.json

      expect(summary.modules.unlocked).toBe(3); // NISSEKRYPTO + NISSEMUSIKK + SNØFALL_TV

      expect(summary.isComplete).toBe(false);
    });

    it("should show game complete when all 24 quests done", async () => {
      for (let i = 1; i <= 24; i++) {
        const code = getQuestCode(i);
        await GameEngine.submitCode(code, code, i);
      }

      expect(GameEngine.isGameComplete()).toBe(true);
      expect(GameEngine.getProgressionPercentage()).toBe(100);

      const summary = GameEngine.getProgressionSummary();
      expect(summary.isComplete).toBe(true);
      expect(summary.mainQuests.percentage).toBe(100);
    });
  });

  describe("State Persistence", () => {
    it("should persist state across reloads", async () => {
      // Complete some quests
      await GameEngine.submitCode("SEKK", "SEKK", 8);
      await GameEngine.submitCode("18", "18", 9);

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

    it("should export and import game state", async () => {
      // Create some game state
      for (let i = 1; i <= 5; i++) {
        const code = getQuestCode(i);
        await GameEngine.submitCode(code, code, i);
      }

      // Export
      const exported = GameEngine.exportGameState();
      expect(exported).toBeTruthy();

      // Clear storage
      localStorage.clear();
      expect(GameEngine.getCompletedQuestCount()).toBe(0);

      // Import
      const success = await GameEngine.importGameState(exported);
      expect(success).toBe(true);

      // Verify state restored (note: export/import is Phase 2 feature, not all data included yet)
      expect(GameEngine.getCompletedQuestCount()).toBe(5);
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace in code submission", async () => {
      const result = await GameEngine.submitCode("  SEKK  ", "SEKK", 8);
      expect(result.success).toBe(true);
    });

    it("should handle empty code gracefully", async () => {
      const result = await GameEngine.submitCode("", "SEKK", 8);
      expect(result.success).toBe(false);
    });

    it("should handle completing quests out of order", async () => {
      // Use actual quest codes from the JSON files
      const code10 = getQuestCode(10);
      const code5 = getQuestCode(5);
      const code15 = getQuestCode(15);

      await GameEngine.submitCode(code10, code10, 10);
      await GameEngine.submitCode(code5, code5, 5);
      await GameEngine.submitCode(code15, code15, 15);

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

    it("should track arc completion based on completed quests", async () => {
      // Complete all brevfugl-mysteriet days
      await GameEngine.submitCode(getQuestCode(1), getQuestCode(1), 1);
      await GameEngine.submitCode(getQuestCode(5), getQuestCode(5), 5);
      await GameEngine.submitCode(getQuestCode(12), getQuestCode(12), 12);
      await GameEngine.submitCode(getQuestCode(14), getQuestCode(14), 14);

      const completedDays = new Set([1, 5, 12, 14]);
      expect(
        eventyr.isEventyrComplete("brevfugl-mysteriet", completedDays),
      ).toBe(true);
    });

    it("should calculate arc progress correctly", async () => {
      // Complete 2 out of 4 days for brevfugl-mysteriet
      await GameEngine.submitCode(getQuestCode(1), getQuestCode(1), 1);
      await GameEngine.submitCode(getQuestCode(5), getQuestCode(5), 5);

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

  describe("Progressive System Status", () => {
    it("should return metrics with sigmoid progression", () => {
      const metrics = GameEngine.getProgressiveMetrics(12);

      expect(metrics.length).toBeGreaterThan(0);
      metrics.forEach((metric) => {
        expect(metric.navn).toBeDefined();
        expect(metric.verdi).toBeGreaterThanOrEqual(0);
        expect(metric.verdi).toBeLessThanOrEqual(metric.maks);
        expect(metric.maks).toBe(100);
        expect(["normal", "advarsel", "kritisk"]).toContain(metric.status);
      });
    });

    it("should show lower values on day 1", () => {
      const day1Metrics = GameEngine.getProgressiveMetrics(1);
      const day12Metrics = GameEngine.getProgressiveMetrics(12);

      // Day 1 should have lower values than day 12 (midpoint)
      const day1Avg =
        day1Metrics.reduce((sum, m) => sum + m.verdi, 0) / day1Metrics.length;
      const day12Avg =
        day12Metrics.reduce((sum, m) => sum + m.verdi, 0) / day12Metrics.length;

      expect(day1Avg).toBeLessThan(day12Avg);
    });

    it("should show higher values on day 24", () => {
      const day12Metrics = GameEngine.getProgressiveMetrics(12);
      const day24Metrics = GameEngine.getProgressiveMetrics(24);

      // Day 24 should have higher values than day 12
      const day12Avg =
        day12Metrics.reduce((sum, m) => sum + m.verdi, 0) / day12Metrics.length;
      const day24Avg =
        day24Metrics.reduce((sum, m) => sum + m.verdi, 0) / day24Metrics.length;

      expect(day24Avg).toBeGreaterThan(day12Avg);
    });

    it("should unlock metrics progressively", () => {
      const day1Metrics = GameEngine.getProgressiveMetrics(1);
      const day4Metrics = GameEngine.getProgressiveMetrics(4);
      const day7Metrics = GameEngine.getProgressiveMetrics(7);
      const day10Metrics = GameEngine.getProgressiveMetrics(10);

      // Only NISSEKRAFT visible on day 1
      expect(day1Metrics.length).toBe(1);
      expect(day1Metrics[0].navn).toBe("NISSEKRAFT");

      // BREVFUGL-SVERM unlocks day 4
      expect(day4Metrics.length).toBe(2);

      // VERKSTED-VARME unlocks day 7
      expect(day7Metrics.length).toBe(3);

      // SLEDE-TURBO unlocks day 10
      expect(day10Metrics.length).toBe(4);
    });

    it("should freeze REINSDYR at crisis value on day 11 if antenna unresolved", () => {
      const completedQuests = GameEngine.getCompletedQuestCount();
      const day11Metrics = GameEngine.getGlobalProductionMetrics(
        11,
        completedQuests,
      );
      const reinsdyr = day11Metrics.find((m) => m.navn === "REINSDYR FLYTIMER");

      expect(reinsdyr).toBeDefined();
      expect(reinsdyr!.inCrisis).toBe(true);
      expect(reinsdyr!.status).toBe("kritisk");
    });

    it("should restore REINSDYR after antenna crisis resolved", async () => {
      // Complete day 11 main quest first (required for bonusoppdrag)
      const day11Code = getQuestCode(11);
      await GameEngine.submitCode(day11Code, day11Code, 11);

      // Resolve antenna crisis by awarding badge
      const result = BadgeManager.checkAndAwardBadge("antenne-ingenior", true);
      expect(result.success).toBe(true);

      const completedQuests = GameEngine.getCompletedQuestCount();
      const day11Metrics = GameEngine.getGlobalProductionMetrics(
        11,
        completedQuests,
      );
      const reinsdyr = day11Metrics.find((m) => m.navn === "REINSDYR FLYTIMER");

      expect(reinsdyr).toBeDefined();
      // Crisis is resolved, so inCrisis should be false
      expect(reinsdyr!.inCrisis).toBe(false);
      // Status returns to normal calculation (value=82, max=240, so 34% = "kritisk" is correct)
      // The key difference is crisis is resolved, not that status changes
      expect(reinsdyr!.crisisText).toBeUndefined();
    });

    it("should freeze NISSEKRAFT at crisis value on day 16 if inventory unresolved", () => {
      const completedQuests = GameEngine.getCompletedQuestCount();
      const day16Metrics = GameEngine.getGlobalProductionMetrics(
        16,
        completedQuests,
      );
      const nissekraft = day16Metrics.find((m) => m.navn === "NISSEKRAFT");

      expect(nissekraft).toBeDefined();
      expect(nissekraft!.verdi).toBe(62); // Crisis value
      expect(nissekraft!.status).toBe("advarsel");
      expect(nissekraft!.inCrisis).toBe(true);
    });

    it("should restore NISSEKRAFT after inventory crisis resolved", async () => {
      // Complete day 16 main quest first (required for bonusoppdrag)
      const day16Code = getQuestCode(16);
      await GameEngine.submitCode(day16Code, day16Code, 16);

      // Resolve inventory crisis by awarding badge
      const result = BadgeManager.checkAndAwardBadge("inventar-ekspert", true);
      expect(result.success).toBe(true);

      const completedQuests = GameEngine.getCompletedQuestCount();
      const day16Metrics = GameEngine.getGlobalProductionMetrics(
        16,
        completedQuests,
      );
      const nissekraft = day16Metrics.find((m) => m.navn === "NISSEKRAFT");

      expect(nissekraft).toBeDefined();
      // Crisis is resolved, so inCrisis should be false
      expect(nissekraft!.inCrisis).toBe(false);
      // Status returns to normal calculation
      expect(nissekraft!.crisisText).toBeUndefined();
    });

    it("should freeze BREVFUGL-SVERM at crisis value on day 16 if unresolved", () => {
      const day16Metrics = GameEngine.getProgressiveMetrics(16);
      const brevfugl = day16Metrics.find((m) => m.navn === "BREVFUGL-SVERM");

      expect(brevfugl).toBeDefined();
      expect(brevfugl!.verdi).toBe(15); // Crisis value
      expect(brevfugl!.status).toBe("kritisk");
    });

    it("should restore BREVFUGL-SVERM after crisis resolved", () => {
      // Resolve inventory crisis
      BadgeManager.checkAndAwardBadge("inventar-ekspert", true);

      const day16Metrics = GameEngine.getProgressiveMetrics(16);
      const brevfugl = day16Metrics.find((m) => m.navn === "BREVFUGL-SVERM");

      expect(brevfugl).toBeDefined();
      expect(brevfugl!.verdi).toBeGreaterThan(15); // Restored to normal progression
      expect(brevfugl!.status).not.toBe("kritisk");
    });

    it("should classify status based on thresholds", () => {
      // Test various days to ensure status classification works
      const day1Metrics = GameEngine.getProgressiveMetrics(1);
      const day24Metrics = GameEngine.getProgressiveMetrics(24);

      // Day 1 metrics should be lower (possibly yellow/advarsel)
      const day1Status = day1Metrics.map((m) => m.status);
      expect(day1Status.some((s) => s === "advarsel" || s === "kritisk")).toBe(
        true,
      );

      // Day 24 metrics should be high (green/normal)
      const day24Status = day24Metrics.map((m) => m.status);
      expect(day24Status.some((s) => s === "normal")).toBe(true);
    });
  });

  describe("Dynamic Alert System", () => {
    it("should return alerts for current day", () => {
      const completedDays = new Set<number>();
      const day1Alerts = GameEngine.getDailyAlerts(1, completedDays);

      expect(day1Alerts.length).toBeGreaterThan(0);
      expect(day1Alerts[0].tekst).toBeDefined();
      expect(["info", "advarsel", "kritisk"]).toContain(day1Alerts[0].type);
    });

    it("should include crisis alerts when active", () => {
      const completedDays = new Set<number>();
      const day11Alerts = GameEngine.getDailyAlerts(11, completedDays);

      // Should have antenna crisis alert
      const crisisAlert = day11Alerts.find((a) => a.tekst.includes("ANTENNE"));
      expect(crisisAlert).toBeDefined();
      expect(crisisAlert!.type).toBe("kritisk");
    });

    it("should remove crisis alerts when resolved", () => {
      // Resolve antenna crisis
      BadgeManager.checkAndAwardBadge("antenne-ingenior", true);

      const completedDays = new Set<number>();
      const day11Alerts = GameEngine.getDailyAlerts(11, completedDays);

      // Should NOT have antenna crisis alert anymore
      const crisisAlert = day11Alerts.find((a) => a.tekst.includes("ANTENNE"));
      expect(crisisAlert).toBeUndefined();
    });

    it("should show multiple crisis alerts simultaneously", () => {
      const completedDays = new Set<number>();
      const day17Alerts = GameEngine.getDailyAlerts(17, completedDays);

      // Both crises should be active on day 17
      const antennaAlert = day17Alerts.find((a) => a.tekst.includes("ANTENNE"));
      const inventoryAlert = day17Alerts.find((a) =>
        a.tekst.includes("INVENTAR"),
      );

      expect(antennaAlert).toBeDefined();
      expect(inventoryAlert).toBeDefined();
    });

    it("should include milestone celebration alerts", () => {
      const completedDays = new Set([8]);
      const day8Alerts = GameEngine.getDailyAlerts(8, completedDays);

      // Should have week 1 completion celebration
      const celebrationAlert = day8Alerts.find(
        (a) => a.tekst.includes("uke") || a.tekst.includes("fullført"),
      );
      expect(celebrationAlert).toBeDefined();
    });

    it("should maintain 3-day rolling window", () => {
      const completedDays = new Set([1, 2, 3]);
      const day3Alerts = GameEngine.getDailyAlerts(3, completedDays);

      // Should have alerts from days 1, 2, and 3
      const days = new Set(day3Alerts.map((a) => a.day).filter((d) => d));
      expect(days.has(1) || days.has(2) || days.has(3)).toBe(true);
    });

    it("should limit to max 8 alerts", () => {
      const completedDays = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
      const alerts = GameEngine.getDailyAlerts(8, completedDays);

      expect(alerts.length).toBeLessThanOrEqual(8);
    });

    it("should prioritize kritisk over advarsel over info", () => {
      const completedDays = new Set<number>();
      const day11Alerts = GameEngine.getDailyAlerts(11, completedDays);

      // Check that kritisk alerts come first
      if (day11Alerts.length > 1) {
        const firstKritisk = day11Alerts.findIndex((a) => a.type === "kritisk");
        const firstAdvarsel = day11Alerts.findIndex(
          (a) => a.type === "advarsel",
        );
        const firstInfo = day11Alerts.findIndex((a) => a.type === "info");

        if (firstKritisk !== -1 && firstAdvarsel !== -1) {
          expect(firstKritisk).toBeLessThan(firstAdvarsel);
        }
        if (firstAdvarsel !== -1 && firstInfo !== -1) {
          expect(firstAdvarsel).toBeLessThan(firstInfo);
        }
      }
    });
  });

  describe("Christmas Countdown & Global Production Metrics", () => {
    describe("getChristmasCountdown", () => {
      it("should return countdown with all time components", () => {
        const countdown = GameEngine.getChristmasCountdown();

        expect(countdown).toHaveProperty("days");
        expect(countdown).toHaveProperty("hours");
        expect(countdown).toHaveProperty("minutes");
        expect(countdown).toHaveProperty("seconds");
        expect(countdown).toHaveProperty("isChristmas");
        expect(countdown).toHaveProperty("urgencyLevel");
      });

      it("should have valid urgency level", () => {
        const countdown = GameEngine.getChristmasCountdown();
        const validLevels = [
          "calm",
          "approaching",
          "urgent",
          "critical",
          "today",
        ];

        expect(validLevels).toContain(countdown.urgencyLevel);
      });

      it("should have non-negative time values", () => {
        const countdown = GameEngine.getChristmasCountdown();

        expect(countdown.days).toBeGreaterThanOrEqual(0);
        expect(countdown.hours).toBeGreaterThanOrEqual(0);
        expect(countdown.hours).toBeLessThan(24);
        expect(countdown.minutes).toBeGreaterThanOrEqual(0);
        expect(countdown.minutes).toBeLessThan(60);
        expect(countdown.seconds).toBeGreaterThanOrEqual(0);
        expect(countdown.seconds).toBeLessThan(60);
      });
    });

    describe("getGlobalProductionMetrics", () => {
      it("should return array of metrics with required properties", () => {
        const metrics = GameEngine.getGlobalProductionMetrics(8, 0);

        expect(Array.isArray(metrics)).toBe(true);
        expect(metrics.length).toBeGreaterThan(0);

        metrics.forEach((metric) => {
          expect(metric).toHaveProperty("navn");
          expect(metric).toHaveProperty("verdi");
          expect(metric).toHaveProperty("maks");
          expect(metric).toHaveProperty("displayType");
          expect(metric).toHaveProperty("unit");
          expect(metric).toHaveProperty("description");
          expect(metric).toHaveProperty("status");
          expect(metric).toHaveProperty("inCrisis");
        });
      });

      it("should filter metrics by unlock_day", () => {
        const day1Metrics = GameEngine.getGlobalProductionMetrics(1, 0);
        const day10Metrics = GameEngine.getGlobalProductionMetrics(10, 0);
        const day24Metrics = GameEngine.getGlobalProductionMetrics(24, 0);

        // Day 1 should have fewer metrics than day 24
        expect(day1Metrics.length).toBeLessThan(day24Metrics.length);

        // Day 10 should have more than day 1 but could have less than day 24
        expect(day10Metrics.length).toBeGreaterThanOrEqual(day1Metrics.length);
      });

      it("should have values between min and max", () => {
        const metrics = GameEngine.getGlobalProductionMetrics(8, 0);

        metrics.forEach((metric) => {
          expect(metric.verdi).toBeGreaterThanOrEqual(0);
          expect(metric.verdi).toBeLessThanOrEqual(metric.maks);
        });
      });

      it("should progress values over time with sigmoid curve", () => {
        const day1Metrics = GameEngine.getGlobalProductionMetrics(1, 0);
        const day12Metrics = GameEngine.getGlobalProductionMetrics(12, 0);
        const day24Metrics = GameEngine.getGlobalProductionMetrics(24, 0);

        // Find PEPPERKAKER (no crisis behavior) to test pure sigmoid
        const day1Pepper = day1Metrics.find(
          (m) => m.navn === "PEPPERKAKER BAKT",
        );
        const day12Pepper = day12Metrics.find(
          (m) => m.navn === "PEPPERKAKER BAKT",
        );
        const day24Pepper = day24Metrics.find(
          (m) => m.navn === "PEPPERKAKER BAKT",
        );

        if (day1Pepper && day12Pepper && day24Pepper) {
          // Values should increase over time
          expect(day12Pepper.verdi).toBeGreaterThan(day1Pepper.verdi);
          expect(day24Pepper.verdi).toBeGreaterThanOrEqual(day12Pepper.verdi);

          // Day 12 (midpoint) should be around 50% for sigmoid
          const day12Percent = (day12Pepper.verdi / day12Pepper.maks) * 100;
          expect(day12Percent).toBeGreaterThan(30); // At least 30%
          expect(day12Percent).toBeLessThan(70); // At most 70%
        }
      });

      it("should not reach 100% too early in progression", () => {
        // Test day 8 specifically (user reported 100% on day 8)
        const day8Metrics = GameEngine.getGlobalProductionMetrics(8, 0);

        day8Metrics.forEach((metric) => {
          const percentage = (metric.verdi / metric.maks) * 100;

          // On day 8 (1/3 through calendar), metrics shouldn't be at 100%
          // unless they have a very high min value (like BARN I VERDEN)
          if (metric.navn !== "BARN I VERDEN") {
            expect(percentage).toBeLessThan(95); // Allow some tolerance
          }
        });
      });

      it("should verify day 8 and day 16 progression values are reasonable", () => {
        const day8Metrics = GameEngine.getGlobalProductionMetrics(8, 0);
        const day16Metrics = GameEngine.getGlobalProductionMetrics(16, 0);

        // Verify day 8 metrics are not at 100% (except BARN I VERDEN)
        day8Metrics.forEach((metric) => {
          const percentage = (metric.verdi / metric.maks) * 100;
          if (metric.navn !== "BARN I VERDEN") {
            expect(percentage).toBeLessThan(95);
          }
        });

        // Find specific metrics to verify
        const day16Gaver = day16Metrics.find(
          (m) => m.navn === "GAVEPRODUKSJON",
        );
        const day16Reinsdyr = day16Metrics.find(
          (m) => m.navn === "REINSDYR FLYTIMER",
        );

        if (day16Gaver) {
          const gaverPercent = (day16Gaver.verdi / day16Gaver.maks) * 100;
          // Day 16 is after midpoint (12), should be over 50% unless in crisis
          if (!day16Gaver.inCrisis) {
            expect(gaverPercent).toBeGreaterThan(50);
          }
        }

        if (day16Reinsdyr) {
          const reinsdyrPercent =
            (day16Reinsdyr.verdi / day16Reinsdyr.maks) * 100;
          // Should be reasonable progression, not 100% on day 16
          if (!day16Reinsdyr.inCrisis) {
            expect(reinsdyrPercent).toBeLessThan(95);
          }
        }
      });

      it("should apply child progress bonus correctly", () => {
        const withoutBonus = GameEngine.getGlobalProductionMetrics(12, 0);
        const withBonus = GameEngine.getGlobalProductionMetrics(12, 10);

        // Find metrics with multipliers > 0
        const gaveWithoutBonus = withoutBonus.find(
          (m) => m.navn === "GAVEPRODUKSJON",
        );
        const gaveWithBonus = withBonus.find(
          (m) => m.navn === "GAVEPRODUKSJON",
        );

        if (gaveWithoutBonus && gaveWithBonus) {
          expect(gaveWithBonus.verdi).toBeGreaterThan(gaveWithoutBonus.verdi);
        }
      });

      it("should handle crisis behavior correctly", () => {
        // Day 11: Antenna crisis affects REINSDYR FLYTIMER, RUDOLF NES-SIGNAL, BREVFUGL-SVERM
        const day11Metrics = GameEngine.getGlobalProductionMetrics(11, 0);
        const reinsdyr = day11Metrics.find(
          (m) => m.navn === "REINSDYR FLYTIMER",
        );

        if (reinsdyr) {
          // Should be in crisis if badge not earned
          const hasResolved = GameEngine.isCrisisResolved("antenna");

          if (!hasResolved) {
            expect(reinsdyr.inCrisis).toBe(true);
            // Crisis type is "glitch" with multiple values, not fixed 0
            expect(reinsdyr.crisisText).toBeDefined();
          }
        }

        // Day 16: Inventory crisis affects GAVEPRODUKSJON
        const day16Metrics = GameEngine.getGlobalProductionMetrics(16, 0);
        const gaver = day16Metrics.find((m) => m.navn === "GAVEPRODUKSJON");

        if (gaver) {
          const hasResolved = GameEngine.isCrisisResolved("inventory");

          if (!hasResolved) {
            expect(gaver.inCrisis).toBe(true);
            expect(gaver.crisisText).toBeDefined();
          }
        }
      });

      it("should have valid display types", () => {
        const metrics = GameEngine.getGlobalProductionMetrics(24, 0);
        const validTypes = [
          "counter",
          "bar",
          "percentage",
          "waveform",
          "radar",
          "gauge",
          "binary",
          "hexgrid",
        ];

        metrics.forEach((metric) => {
          expect(validTypes).toContain(metric.displayType);
        });
      });

      it("should have valid status values", () => {
        const metrics = GameEngine.getGlobalProductionMetrics(12, 0);
        const validStatuses = ["normal", "advarsel", "kritisk"];

        metrics.forEach((metric) => {
          expect(validStatuses).toContain(metric.status);
        });
      });
    });
  });
});

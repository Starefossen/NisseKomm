/**
 * Storage Manager & GameEngine Tests
 *
 * Tests the complete storage and game logic flow:
 * - StorageManager API
 * - GameEngine facade pattern
 * - Game state persistence and retrieval
 * - Multi-tenant isolation (via unique passwords)
 * - Complex data types handling
 *
 * Uses localStorage backend for fast, isolated tests.
 * Sanity integration is tested separately in route tests.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { StorageManager } from "../storage";
import { GameEngine } from "../game-engine";

// Mock session-manager to prevent cookie side effects in tests
jest.mock("../session-manager", () => ({
  setSessionId: jest.fn(),
  getSessionId: jest.fn(() => null),
  clearSessionId: jest.fn(),
  getKidCodeFromSession: jest.fn(() => Promise.resolve(null)),
}));

// Use localStorage backend for these tests
process.env.NEXT_PUBLIC_STORAGE_BACKEND = "localStorage";

// Helper to generate unique test passwords
let testCounter = 0;
const generateTestPassword = () => {
  testCounter++;
  return `TEST_${Date.now()}_${testCounter}`;
};

describe("Storage Manager - Basic Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should authenticate and create session", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const isAuth = StorageManager.isAuthenticated();
    expect(isAuth).toBe(true);
  });

  it("should persist and retrieve submitted codes", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const testCode = {
      kode: "TESTCODE1",
      dato: new Date().toISOString(),
    };

    StorageManager.addSubmittedCode(testCode);

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.some((c) => c.kode === testCode.kode)).toBe(true);
  });

  it("should persist and retrieve viewed emails", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.markEmailAsViewed(5);

    const viewedEmails = StorageManager.getViewedEmails();
    expect(viewedEmails.has(5)).toBe(true);
  });

  it("should persist sound settings", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.setSoundsEnabled(false);

    const soundsEnabled = StorageManager.isSoundsEnabled();
    expect(soundsEnabled).toBe(false);
  });

  it("should persist music settings", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.setMusicEnabled(true);

    const musicEnabled = StorageManager.isMusicEnabled();
    expect(musicEnabled).toBe(true);
  });
});

describe("Storage Manager - Multi-Tenant Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist data across session switches in localStorage mode", async () => {
    // NOTE: localStorage backend does NOT support multi-tenancy
    // All sessions share the same browser localStorage
    // This is intentional - localStorage mode is for single-family usage

    // Family A session
    const familyA = generateTestPassword();
    await StorageManager.setAuthenticated(true, familyA);

    const codeA = {
      kode: "FAMILYA_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeA);

    // Verify Family A has their code
    const codesA1 = StorageManager.getSubmittedCodes();
    expect(codesA1.some((c) => c.kode === "FAMILYA_CODE")).toBe(true);

    // Switch to different session (localStorage mode doesn't clear data)
    const familyB = generateTestPassword();
    await StorageManager.setAuthenticated(true, familyB);

    const codeB = {
      kode: "FAMILYB_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeB);

    // In localStorage mode, both codes persist (no tenant isolation)
    const codesB = StorageManager.getSubmittedCodes();
    expect(codesB.some((c) => c.kode === "FAMILYA_CODE")).toBe(true);
    expect(codesB.some((c) => c.kode === "FAMILYB_CODE")).toBe(true);
  });

  it("should persist settings across session switches in localStorage mode", async () => {
    // NOTE: localStorage backend does NOT clear data when switching sessions
    // Settings persist in browser localStorage

    const tenant1 = generateTestPassword();
    await StorageManager.setAuthenticated(true, tenant1);
    StorageManager.setSoundsEnabled(false);

    // Verify tenant1 setting
    expect(StorageManager.isSoundsEnabled()).toBe(false);

    // Switch to tenant2 - localStorage does NOT clear, settings persist
    const tenant2 = generateTestPassword();
    await StorageManager.setAuthenticated(true, tenant2);

    // In localStorage mode, previous settings persist (no isolation)
    expect(StorageManager.isSoundsEnabled()).toBe(false);

    // Change setting
    StorageManager.setSoundsEnabled(true);
    expect(StorageManager.isSoundsEnabled()).toBe(true);
  });
});

describe("Storage Manager - Session Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist data in localStorage with same password", async () => {
    const familyPassword = generateTestPassword();

    // Device 1: Submit code
    await StorageManager.setAuthenticated(true, familyPassword);

    const testCode = {
      kode: "DEVICE1_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(testCode);

    // Device 2: Same password, should see same data via localStorage
    // (In real Sanity mode, this would sync across actual devices)
    const codes = StorageManager.getSubmittedCodes();
    expect(codes.some((c) => c.kode === "DEVICE1_CODE")).toBe(true);
  });

  it("should restore full game state", async () => {
    const password = generateTestPassword();

    // Build up game state
    await StorageManager.setAuthenticated(true, password);

    // Add various data
    StorageManager.addSubmittedCode({
      kode: "DAY1",
      dato: new Date().toISOString(),
    });
    StorageManager.markEmailAsViewed(1);
    StorageManager.markEmailAsViewed(2);
    StorageManager.setSoundsEnabled(false);
    StorageManager.setPlayerNames(["Alice", "Bob"]);

    // Verify all state persisted
    const codes = StorageManager.getSubmittedCodes();
    const emails = StorageManager.getViewedEmails();
    const sounds = StorageManager.isSoundsEnabled();
    const names = StorageManager.getPlayerNames();

    expect(codes.some((c) => c.kode === "DAY1")).toBe(true);
    expect(emails.has(1)).toBe(true);
    expect(emails.has(2)).toBe(true);
    expect(sounds).toBe(false);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });
});

describe("Storage Manager - Complex Data Types", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist badge data", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addBonusOppdragBadge(11, "🚨", "Krise Mester");

    const badges = StorageManager.getBonusOppdragBadges();
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.day === 11 && b.icon === "🚨")).toBe(true);
  });

  it("should persist eventyr badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addEventyrBadge("eventyr1", "📖", "Eventyr Helt");

    const badges = StorageManager.getEventyrBadges();
    expect(badges.some((b) => b.eventyrId === "eventyr1")).toBe(true);
  });

  it("should persist unlocked modules", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.unlockModule("nissenet");

    const modules = StorageManager.getUnlockedModules();
    expect(modules).toContain("nissenet");
  });

  it("should persist crisis resolution status", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.resolveCrisis("antenna");

    const status = StorageManager.getCrisisStatus();
    expect(status.antenna).toBe(true);
    expect(status.inventory).toBe(false);
  });

  it("should persist symbol collection", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const symbol = {
      symbolId: "symbol1",
      symbolIcon: "snowflake",
      symbolColor: "blue" as const,
      description: "Test symbol",
    };
    StorageManager.addCollectedSymbol(symbol);

    const symbols = StorageManager.getCollectedSymbols();
    expect(symbols.some((s) => s.symbolId === "symbol1")).toBe(true);
  });

  it("should persist decryption challenges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSolvedDecryption("challenge1");

    const solved = StorageManager.getSolvedDecryptions();
    expect(solved).toContain("challenge1");
  });
});

describe("GameEngine Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should work with GameEngine facade", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    // Configure GameEngine to use password as kid code (for Day 1 {{KID_CODE}} tests)
    GameEngine.configure({
      kidCodeResolver: async () => password,
    });

    // Day 1 uses {{KID_CODE}} placeholder which resolves to kid code
    const result = await GameEngine.submitCode(password, "{{KID_CODE}}", 1);

    expect(result.success).toBe(true);

    // Verify through StorageManager
    const codes = StorageManager.getSubmittedCodes();
    expect(codes.some((c) => c.kode === password.toUpperCase())).toBe(true);

    // Verify through GameEngine
    const state = GameEngine.loadGameState();
    expect(state.completedQuests.has(1)).toBe(true);

    // Cleanup
    GameEngine.resetDependencies();
  });

  it("should persist game progression", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    // Configure GameEngine for Day 1
    GameEngine.configure({
      kidCodeResolver: async () => password,
    });

    // Submit multiple codes (Day 1 uses {{KID_CODE}} placeholder, Day 2 uses 34)
    await GameEngine.submitCode(password, "{{KID_CODE}}", 1);
    await GameEngine.submitCode("34", "34", 2);

    const progression = GameEngine.getProgressionPercentage();
    expect(progression).toBeGreaterThan(0);

    // Verify progression persists in localStorage
    const newProgression = GameEngine.getProgressionPercentage();
    expect(newProgression).toBe(progression);

    // Cleanup
    GameEngine.resetDependencies();
  });
});

describe("Storage Manager - Error Handling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should handle duplicate code submissions gracefully", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const code = {
      kode: "DUPLICATE",
      dato: new Date().toISOString(),
    };

    StorageManager.addSubmittedCode(code);
    StorageManager.addSubmittedCode(code); // Duplicate

    const codes = StorageManager.getSubmittedCodes();
    const duplicates = codes.filter((c) => c.kode === "DUPLICATE");
    expect(duplicates.length).toBe(1); // Should only store once
  });

  it("should handle duplicate badge awards gracefully", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addBonusOppdragBadge(11, "🚨", "Test Badge");
    StorageManager.addBonusOppdragBadge(11, "🚨", "Test Badge"); // Duplicate

    const badges = StorageManager.getBonusOppdragBadges();
    const day11Badges = badges.filter((b) => b.day === 11);
    expect(day11Badges.length).toBe(1);
  });
});

describe("Storage Manager - Performance", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should handle rapid successive writes", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    // Rapid writes
    for (let i = 1; i <= 5; i++) {
      StorageManager.markEmailAsViewed(i);
    }

    const viewed = StorageManager.getViewedEmails();
    expect(viewed.size).toBe(5);
    for (let i = 1; i <= 5; i++) {
      expect(viewed.has(i)).toBe(true);
    }
  });

  it("should handle large datasets", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    // Add many codes
    for (let i = 1; i <= 24; i++) {
      StorageManager.addSubmittedCode({
        kode: `CODE_${i}`,
        dato: new Date().toISOString(),
      });
    }

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.length).toBe(24);
  });
});

describe("Storage Manager - Modules", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should unlock and track modules", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.isModuleUnlocked("NISSEKRYPTO")).toBe(false);

    StorageManager.unlockModule("NISSEKRYPTO");
    expect(StorageManager.isModuleUnlocked("NISSEKRYPTO")).toBe(true);

    const modules = StorageManager.getUnlockedModules();
    expect(modules).toContain("NISSEKRYPTO");
  });

  it("should not duplicate module unlocks", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.unlockModule("BREVFUGLER");
    StorageManager.unlockModule("BREVFUGLER");
    StorageManager.unlockModule("BREVFUGLER");

    const modules = StorageManager.getUnlockedModules();
    expect(modules.filter((m) => m === "BREVFUGLER").length).toBe(1);
  });
});

describe("Storage Manager - Crisis Status", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should track crisis resolution", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.isCrisisResolved("antenna")).toBe(false);
    expect(StorageManager.isCrisisResolved("inventory")).toBe(false);

    StorageManager.resolveCrisis("antenna");
    expect(StorageManager.isCrisisResolved("antenna")).toBe(true);
    expect(StorageManager.isCrisisResolved("inventory")).toBe(false);

    StorageManager.resolveCrisis("inventory");
    expect(StorageManager.isCrisisResolved("inventory")).toBe(true);
  });

  it("should return full crisis status", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const status = StorageManager.getCrisisStatus();
    expect(status).toEqual({ antenna: false, inventory: false });

    StorageManager.resolveCrisis("antenna");
    const updatedStatus = StorageManager.getCrisisStatus();
    expect(updatedStatus.antenna).toBe(true);
    expect(updatedStatus.inventory).toBe(false);
  });
});

describe("Storage Manager - Santa Letters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should add and retrieve santa letters", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSantaLetter(1, "Dear Santa, I want a bike!");
    StorageManager.addSantaLetter(5, "Dear Santa, I want a puppy!");

    const letters = StorageManager.getSantaLetters();
    expect(letters).toHaveLength(2);
    expect(letters[0].day).toBe(1);
    expect(letters[0].content).toBe("Dear Santa, I want a bike!");
  });

  it("should replace letter for same day", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSantaLetter(1, "First letter");
    StorageManager.addSantaLetter(1, "Updated letter");

    const letters = StorageManager.getSantaLetters();
    expect(letters).toHaveLength(1);
    expect(letters[0].content).toBe("Updated letter");
  });

  it("should sort letters by day", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSantaLetter(10, "Day 10 letter");
    StorageManager.addSantaLetter(3, "Day 3 letter");
    StorageManager.addSantaLetter(7, "Day 7 letter");

    const letters = StorageManager.getSantaLetters();
    expect(letters[0].day).toBe(3);
    expect(letters[1].day).toBe(7);
    expect(letters[2].day).toBe(10);
  });

  it("should reject invalid day numbers", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSantaLetter(0, "Invalid");
    StorageManager.addSantaLetter(25, "Invalid");

    const letters = StorageManager.getSantaLetters();
    expect(letters).toHaveLength(0);
  });

  it("should reject empty content", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addSantaLetter(1, "");
    StorageManager.addSantaLetter(2, "   ");

    const letters = StorageManager.getSantaLetters();
    expect(letters).toHaveLength(0);
  });
});

describe("Storage Manager - Earned Badges", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should add and check earned badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.hasEarnedBadge("test-badge")).toBe(false);

    StorageManager.addEarnedBadge("test-badge");
    expect(StorageManager.hasEarnedBadge("test-badge")).toBe(true);
  });

  it("should store badge with timestamp", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const before = Date.now();
    StorageManager.addEarnedBadge("timed-badge");
    const after = Date.now();

    const badges = StorageManager.getEarnedBadges();
    const badge = badges.find((b) => b.badgeId === "timed-badge");
    expect(badge).toBeDefined();
    expect(badge!.timestamp).toBeGreaterThanOrEqual(before);
    expect(badge!.timestamp).toBeLessThanOrEqual(after);
  });

  it("should not duplicate badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addEarnedBadge("dup-badge");
    StorageManager.addEarnedBadge("dup-badge");
    StorageManager.addEarnedBadge("dup-badge");

    const badges = StorageManager.getEarnedBadges();
    expect(badges.filter((b) => b.badgeId === "dup-badge")).toHaveLength(1);
  });

  it("should remove specific badge", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addEarnedBadge("badge-a");
    StorageManager.addEarnedBadge("badge-b");
    StorageManager.removeEarnedBadge("badge-a");

    expect(StorageManager.hasEarnedBadge("badge-a")).toBe(false);
    expect(StorageManager.hasEarnedBadge("badge-b")).toBe(true);
  });

  it("should clear all badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addEarnedBadge("badge-1");
    StorageManager.addEarnedBadge("badge-2");
    StorageManager.clearEarnedBadges();

    expect(StorageManager.getEarnedBadges()).toHaveLength(0);
  });
});

describe("Storage Manager - Bonusoppdrag Emails", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should track viewed bonusoppdrag emails", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.getViewedBonusOppdragEmails().has(11)).toBe(false);

    StorageManager.markBonusOppdragEmailAsViewed(11);
    expect(StorageManager.getViewedBonusOppdragEmails().has(11)).toBe(true);
  });

  it("should clear viewed bonusoppdrag emails", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.markBonusOppdragEmailAsViewed(11);
    StorageManager.markBonusOppdragEmailAsViewed(16);
    StorageManager.clearViewedBonusOppdragEmails();

    expect(StorageManager.getViewedBonusOppdragEmails().size).toBe(0);
  });
});

describe("Storage Manager - Bonusoppdrag Badges", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should add and check bonusoppdrag badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.hasBonusOppdragBadge(11)).toBe(false);

    StorageManager.addBonusOppdragBadge(11, "trophy", "Antenna Expert");
    expect(StorageManager.hasBonusOppdragBadge(11)).toBe(true);
  });

  it("should get all bonusoppdrag badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addBonusOppdragBadge(11, "trophy", "Antenna Expert");
    StorageManager.addBonusOppdragBadge(16, "star", "Inventory Master");

    const badges = StorageManager.getBonusOppdragBadges();
    expect(badges).toHaveLength(2);
    expect(badges[0].day).toBe(11);
    expect(badges[1].day).toBe(16);
  });

  it("should not duplicate bonusoppdrag badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addBonusOppdragBadge(11, "trophy", "Expert");
    StorageManager.addBonusOppdragBadge(11, "trophy", "Expert");

    const badges = StorageManager.getBonusOppdragBadges();
    expect(badges).toHaveLength(1);
  });
});

describe("Storage Manager - Eventyr Badges", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should add and check eventyr badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    expect(StorageManager.hasEventyrBadge("morkets-trussel")).toBe(false);

    StorageManager.addEventyrBadge(
      "morkets-trussel",
      "shield",
      "Mørket-Beseirer",
    );
    expect(StorageManager.hasEventyrBadge("morkets-trussel")).toBe(true);
  });

  it("should not duplicate eventyr badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    StorageManager.addEventyrBadge("iqs-oppfinnelser", "beaker", "Oppfinner");
    StorageManager.addEventyrBadge("iqs-oppfinnelser", "beaker", "Oppfinner");

    const badges = StorageManager.getEventyrBadges();
    expect(
      badges.filter((b) => b.eventyrId === "iqs-oppfinnelser"),
    ).toHaveLength(1);
  });
});

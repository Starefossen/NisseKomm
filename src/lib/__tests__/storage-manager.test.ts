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

import { describe, it, expect, beforeEach } from "@jest/globals";
import { StorageManager } from "../storage";
import { GameEngine } from "../game-engine";

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

  it("should authenticate and create session", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    const isAuth = StorageManager.isAuthenticated();
    expect(isAuth).toBe(true);
  });

  it("should persist and retrieve submitted codes", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    const testCode = {
      kode: "TESTCODE1",
      dato: new Date().toISOString(),
    };

    StorageManager.addSubmittedCode(testCode);

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.some((c) => c.kode === testCode.kode)).toBe(true);
  });

  it("should persist and retrieve viewed emails", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.markEmailAsViewed(5);

    const viewedEmails = StorageManager.getViewedEmails();
    expect(viewedEmails.has(5)).toBe(true);
  });

  it("should persist sound settings", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.setSoundsEnabled(false);

    const soundsEnabled = StorageManager.isSoundsEnabled();
    expect(soundsEnabled).toBe(false);
  });

  it("should persist music settings", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.setMusicEnabled(true);

    const musicEnabled = StorageManager.isMusicEnabled();
    expect(musicEnabled).toBe(true);
  });
});

describe("Storage Manager - Multi-Tenant Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should isolate data between different tenants", () => {
    // Family A session
    const familyA = generateTestPassword();
    StorageManager.setAuthenticated(true, familyA);

    const codeA = {
      kode: "FAMILYA_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeA);

    // Verify Family A has their code
    const codesA1 = StorageManager.getSubmittedCodes();
    expect(codesA1.some((c) => c.kode === "FAMILYA_CODE")).toBe(true);

    // Family B session (new password = new tenant)
    // NOTE: localStorage backend clears ALL data when switching tenants
    const familyB = generateTestPassword();
    StorageManager.setAuthenticated(true, familyB);

    const codeB = {
      kode: "FAMILYB_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeB);

    // Verify Family B has fresh storage (no Family A data)
    const codesB = StorageManager.getSubmittedCodes();
    expect(codesB.some((c) => c.kode === "FAMILYA_CODE")).toBe(false);
    expect(codesB.some((c) => c.kode === "FAMILYB_CODE")).toBe(true);
  });

  it("should start with fresh storage when switching tenants", () => {
    const tenant1 = generateTestPassword();
    StorageManager.setAuthenticated(true, tenant1);
    StorageManager.setSoundsEnabled(false);

    // Verify tenant1 setting
    expect(StorageManager.isSoundsEnabled()).toBe(false);

    // Switch to tenant2 - localStorage clears, so settings reset to defaults
    const tenant2 = generateTestPassword();
    StorageManager.setAuthenticated(true, tenant2);

    // New tenant starts with default settings (sounds enabled by default)
    expect(StorageManager.isSoundsEnabled()).toBe(true);

    // Set tenant2's preference
    StorageManager.setSoundsEnabled(false);
    expect(StorageManager.isSoundsEnabled()).toBe(false);
  });
});

describe("Storage Manager - Session Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist data in localStorage with same password", () => {
    const familyPassword = generateTestPassword();

    // Device 1: Submit code
    StorageManager.setAuthenticated(true, familyPassword);

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

  it("should restore full game state", () => {
    const password = generateTestPassword();

    // Build up game state
    StorageManager.setAuthenticated(true, password);

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

  it("should persist badge data", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.addBonusOppdragBadge(11, "🚨", "Krise Mester");

    const badges = StorageManager.getBonusOppdragBadges();
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.day === 11 && b.icon === "🚨")).toBe(true);
  });

  it("should persist eventyr badges", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.addEventyrBadge("eventyr1", "📖", "Eventyr Helt");

    const badges = StorageManager.getEventyrBadges();
    expect(badges.some((b) => b.eventyrId === "eventyr1")).toBe(true);
  });

  it("should persist unlocked modules", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.unlockModule("nissenet");

    const modules = StorageManager.getUnlockedModules();
    expect(modules).toContain("nissenet");
  });

  it("should persist crisis resolution status", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.resolveCrisis("antenna");

    const status = StorageManager.getCrisisStatus();
    expect(status.antenna).toBe(true);
    expect(status.inventory).toBe(false);
  });

  it("should persist symbol collection", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

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

  it("should persist decryption challenges", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    StorageManager.addSolvedDecryption("challenge1");

    const solved = StorageManager.getSolvedDecryptions();
    expect(solved).toContain("challenge1");
  });
});

describe("GameEngine Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should work with GameEngine facade", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    // Use GameEngine to submit code (use actual Day 1 code from uke1_oppdrag.json)
    const result = GameEngine.submitCode("NISSEKODE2025", "NISSEKODE2025", 1);

    expect(result.success).toBe(true);

    // Verify through StorageManager
    const codes = StorageManager.getSubmittedCodes();
    expect(codes.some((c) => c.kode === "NISSEKODE2025")).toBe(true);

    // Verify through GameEngine
    const state = GameEngine.loadGameState();
    expect(state.completedQuests.has(1)).toBe(true);
  });

  it("should persist game progression", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

    // Submit multiple codes (use actual quest codes from uke1_oppdrag.json)
    GameEngine.submitCode("NISSEKODE2025", "NISSEKODE2025", 1);
    GameEngine.submitCode("34", "34", 2);

    const progression = GameEngine.getProgressionPercentage();
    expect(progression).toBeGreaterThan(0);

    // Verify progression persists in localStorage
    const newProgression = GameEngine.getProgressionPercentage();
    expect(newProgression).toBe(progression);
  });
});

describe("Storage Manager - Error Handling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should handle duplicate code submissions gracefully", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

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

  it("should handle duplicate badge awards gracefully", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

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

  it("should handle rapid successive writes", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

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

  it("should handle large datasets", () => {
    const password = generateTestPassword();
    StorageManager.setAuthenticated(true, password);

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

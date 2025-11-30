/**
 * Sanity Storage Integration Tests
 *
 * Tests the complete storage flow with real Sanity backend:
 * - Adapter pattern implementation
 * - Cross-device data synchronization
 * - Cache-first reads with background sync
 * - Multi-tenant data isolation
 * - Game state persistence and retrieval
 *
 * IMPORTANT: These are INTEGRATION tests using real Sanity development dataset
 * - Requires NEXT_PUBLIC_STORAGE_BACKEND=sanity
 * - Requires valid Sanity credentials in .env.local
 * - Tests will create/modify real sessions in development dataset
 * - Each test uses unique password to avoid cross-contamination
 */

// CRITICAL: Set Sanity backend for these tests
process.env.NEXT_PUBLIC_STORAGE_BACKEND = "sanity";

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { StorageManager } from "../storage";
import { GameEngine } from "../game-engine";
import { SanityStorageAdapter } from "../storage-adapter";

// Helper to generate unique test passwords
let testCounter = 0;
const generateTestPassword = () => {
  testCounter++;
  return `TEST_${Date.now()}_${testCounter}`;
};

// Helper to wait for background sync (optimized for faster tests)
const waitForSync = async () => {
  // Wait for any pending syncs to complete
  await StorageManager.waitForPendingSyncs();
  // Small additional delay for Sanity propagation
  await new Promise((resolve) => setTimeout(resolve, 100));
};

describe("Sanity Storage Adapter - Basic Operations", () => {
  let testPassword: string;

  beforeAll(async () => {
    testPassword = generateTestPassword();
    await StorageManager.setAuthenticated(true, testPassword);
    await waitForSync(); // Wait for initial session creation
  });

  // Removed afterEach wait - let tests handle their own timing

  it("should authenticate and create session", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);

    const isAuth = StorageManager.isAuthenticated();
    expect(isAuth).toBe(true);
  }, 10000);

  it("should persist and retrieve submitted codes", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    const testCode = {
      kode: "TESTCODE1",
      dato: new Date().toISOString(),
    };

    StorageManager.addSubmittedCode(testCode);
    await waitForSync(); // Wait for background sync

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.some((c) => c.kode === testCode.kode)).toBe(true);
  }, 10000);

  it("should persist and retrieve viewed emails", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.markEmailAsViewed(5);
    await waitForSync();

    const viewedEmails = StorageManager.getViewedEmails();
    expect(viewedEmails.has(5)).toBe(true);
  }, 10000);

  it("should persist sound settings", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.setSoundsEnabled(false);
    await waitForSync();

    const soundsEnabled = StorageManager.isSoundsEnabled();
    expect(soundsEnabled).toBe(false);
  }, 10000);

  it("should persist music settings", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.setMusicEnabled(true);
    await waitForSync();

    const musicEnabled = StorageManager.isMusicEnabled();
    expect(musicEnabled).toBe(true);
  }, 10000);
});

describe("Sanity Storage - Multi-Tenant Isolation", () => {
  it("should isolate data between different tenants", async () => {
    // Family A session
    const familyA = generateTestPassword();
    await StorageManager.setAuthenticated(true, familyA);
    await waitForSync();

    const codeA = {
      kode: "FAMILYA_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeA);
    await waitForSync();

    // Family B session (new password = new tenant)
    const familyB = generateTestPassword();
    await StorageManager.setAuthenticated(true, familyB);
    await waitForSync();

    const codeB = {
      kode: "FAMILYB_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(codeB);
    await waitForSync();

    // Verify Family B doesn't see Family A's codes
    const codesB = StorageManager.getSubmittedCodes();
    expect(codesB.some((c) => c.kode === "FAMILYA_CODE")).toBe(false);
    expect(codesB.some((c) => c.kode === "FAMILYB_CODE")).toBe(true);

    // Switch back to Family A
    await StorageManager.setAuthenticated(true, familyA);
    await waitForSync();

    // Verify Family A still has their data
    const codesA = StorageManager.getSubmittedCodes();
    expect(codesA.some((c) => c.kode === "FAMILYA_CODE")).toBe(true);
    expect(codesA.some((c) => c.kode === "FAMILYB_CODE")).toBe(false);
  }, 20000); // 20 second timeout for multi-tenant switching

  it("should maintain separate sound preferences per tenant", async () => {
    const tenant1 = generateTestPassword();
    await StorageManager.setAuthenticated(true, tenant1);
    await waitForSync();
    StorageManager.setSoundsEnabled(false);
    await waitForSync();

    const tenant2 = generateTestPassword();
    await StorageManager.setAuthenticated(true, tenant2);
    await waitForSync();
    StorageManager.setSoundsEnabled(true);
    await waitForSync();

    // Switch back to tenant1
    await StorageManager.setAuthenticated(true, tenant1);
    await waitForSync();
    expect(StorageManager.isSoundsEnabled()).toBe(false);

    // Switch to tenant2
    await StorageManager.setAuthenticated(true, tenant2);
    await waitForSync();
    expect(StorageManager.isSoundsEnabled()).toBe(true);
  }, 20000); // 20 second timeout
});

describe("Sanity Storage - Cross-Device Simulation", () => {
  it("should sync data across simulated devices (same password)", async () => {
    const familyPassword = generateTestPassword();

    // Device 1: Submit code
    await StorageManager.setAuthenticated(true, familyPassword);
    await waitForSync();

    const testCode = {
      kode: "DEVICE1_CODE",
      dato: new Date().toISOString(),
    };
    StorageManager.addSubmittedCode(testCode);
    await waitForSync(); // Ensure sync completes

    // Device 2: Same password, should see same data
    // Simulate new device by clearing cache and re-authenticating
    localStorage.clear();
    await StorageManager.setAuthenticated(true, familyPassword);
    await waitForSync(); // Wait for session data to load

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.some((c) => c.kode === "DEVICE1_CODE")).toBe(true);
  }, 15000); // 15 second timeout

  it("should restore full game state on new device", async () => {
    const password = generateTestPassword();

    // Device 1: Build up game state
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Add various data
    StorageManager.addSubmittedCode({
      kode: "DAY1",
      dato: new Date().toISOString(),
    });
    StorageManager.markEmailAsViewed(1);
    StorageManager.markEmailAsViewed(2);
    StorageManager.setSoundsEnabled(false);
    StorageManager.setPlayerNames(["Alice", "Bob"]);
    await waitForSync();

    // Device 2: Restore state
    localStorage.clear();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Verify all state restored
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
  }, 15000); // 15 second timeout
});

describe("Sanity Storage - Complex Data Types", () => {
  it("should persist badge data", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.addBonusOppdragBadge(11, "🚨", "Krise Mester");
    await waitForSync();

    const badges = StorageManager.getBonusOppdragBadges();
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.day === 11 && b.icon === "🚨")).toBe(true);
  });

  it("should persist eventyr badges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.addEventyrBadge("eventyr1", "📖", "Eventyr Helt");
    await waitForSync();

    const badges = StorageManager.getEventyrBadges();
    expect(badges.some((b) => b.eventyrId === "eventyr1")).toBe(true);
  });

  it("should persist unlocked modules", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.unlockModule("nissenet");
    await waitForSync();

    const modules = StorageManager.getUnlockedModules();
    expect(modules).toContain("nissenet");
  });

  it("should persist crisis resolution status", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.resolveCrisis("antenna");
    await waitForSync();

    const status = StorageManager.getCrisisStatus();
    expect(status.antenna).toBe(true);
    expect(status.inventory).toBe(false);
  });

  it("should persist symbol collection", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    const symbol = {
      symbolId: "symbol1",
      symbolIcon: "snowflake",
      symbolColor: "blue" as const,
      description: "Test symbol",
    };
    StorageManager.addCollectedSymbol(symbol);
    await waitForSync();

    const symbols = StorageManager.getCollectedSymbols();
    expect(symbols.some((s) => s.symbolId === "symbol1")).toBe(true);
  });

  it("should persist decryption challenges", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.addSolvedDecryption("challenge1");
    await waitForSync();

    const solved = StorageManager.getSolvedDecryptions();
    expect(solved).toContain("challenge1");
  });
});

describe("Sanity Storage - GameEngine Integration", () => {
  it("should work with GameEngine facade", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Use GameEngine to submit code (use actual Day 1 code from uke1_oppdrag.json)
    const result = GameEngine.submitCode("NISSEKODE2025", "NISSEKODE2025", 1);
    await waitForSync();

    expect(result.success).toBe(true);

    // Verify through StorageManager
    const codes = StorageManager.getSubmittedCodes();
    expect(codes.some((c) => c.kode === "NISSEKODE2025")).toBe(true);

    // Verify through GameEngine
    const state = GameEngine.loadGameState();
    expect(state.completedQuests.has(1)).toBe(true);
  }, 15000); // 15 second timeout

  it("should persist game progression", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Submit multiple codes (use actual quest codes from uke1_oppdrag.json)
    GameEngine.submitCode("NISSEKODE2025", "NISSEKODE2025", 1);
    GameEngine.submitCode("34", "34", 2);
    await waitForSync();

    const progression = GameEngine.getProgressionPercentage();
    expect(progression).toBeGreaterThan(0);

    // Simulate new device
    localStorage.clear();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    const newProgression = GameEngine.getProgressionPercentage();
    expect(newProgression).toBe(progression);
  }, 15000); // 15 second timeout
});

describe("Sanity Storage - Error Handling", () => {
  it("should handle duplicate code submissions gracefully", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    const code = {
      kode: "DUPLICATE",
      dato: new Date().toISOString(),
    };

    StorageManager.addSubmittedCode(code);
    StorageManager.addSubmittedCode(code); // Duplicate
    await waitForSync();

    const codes = StorageManager.getSubmittedCodes();
    const duplicates = codes.filter((c) => c.kode === "DUPLICATE");
    expect(duplicates.length).toBe(1); // Should only store once
  });

  it("should handle duplicate badge awards gracefully", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    StorageManager.addBonusOppdragBadge(11, "🚨", "Test Badge");
    StorageManager.addBonusOppdragBadge(11, "🚨", "Test Badge"); // Duplicate
    await waitForSync();

    const badges = StorageManager.getBonusOppdragBadges();
    const day11Badges = badges.filter((b) => b.day === 11);
    expect(day11Badges.length).toBe(1);
  });
});

describe("Sanity Storage - Performance", () => {
  it("should handle rapid successive writes", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Rapid writes (tests background sync queueing)
    for (let i = 1; i <= 5; i++) {
      StorageManager.markEmailAsViewed(i);
    }
    await waitForSync();

    const viewed = StorageManager.getViewedEmails();
    expect(viewed.size).toBe(5);
    for (let i = 1; i <= 5; i++) {
      expect(viewed.has(i)).toBe(true);
    }
  });

  it("should handle large datasets", async () => {
    const password = generateTestPassword();
    await StorageManager.setAuthenticated(true, password);
    await waitForSync();

    // Add many codes
    for (let i = 1; i <= 24; i++) {
      StorageManager.addSubmittedCode({
        kode: `CODE_${i}`,
        dato: new Date().toISOString(),
      });
    }
    await waitForSync();

    const codes = StorageManager.getSubmittedCodes();
    expect(codes.length).toBe(24);
  });
});

// Global cleanup - clear adapter instances after all tests
afterAll(() => {
  SanityStorageAdapter.clearAllInstances();
});

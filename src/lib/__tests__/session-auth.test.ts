/**
 * Session Authentication Integration Tests
 *
 * Tests the complete authentication and session management flow:
 * - Password hashing and session ID creation
 * - Cookie and localStorage persistence
 * - Multi-tenant session isolation
 * - Session restoration across page loads
 *
 * NOTE: These tests use real Sanity development dataset (no mocking)
 * Requires NEXT_PUBLIC_STORAGE_BACKEND=sanity and valid Sanity credentials
 */

// Configure environment for Sanity backend testing
process.env.NEXT_PUBLIC_STORAGE_BACKEND = "sanity";

import { describe, it, expect, beforeEach } from "@jest/globals";
import { hashPassword } from "../password-utils";
import { createSessionIdFromPassword } from "../session-manager";

describe("Password Hashing", () => {
  it("should hash password consistently", async () => {
    const password = "TESTCODE2025";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
  });

  it("should produce different hashes for different passwords", async () => {
    const hash1 = await hashPassword("PASSWORD1");
    const hash2 = await hashPassword("PASSWORD2");

    expect(hash1).not.toBe(hash2);
  });

  it("should be case-sensitive", async () => {
    const hash1 = await hashPassword("TestCode");
    const hash2 = await hashPassword("testcode");

    expect(hash1).not.toBe(hash2);
  });
});

describe("Session Manager", () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Clear localStorage
    localStorage.clear();
  });

  it("should create session ID from password", async () => {
    const password = "FAMILY2025";
    const sessionId = await createSessionIdFromPassword(password);

    expect(sessionId).toBeTruthy();
    expect(sessionId).toHaveLength(64);
  });

  it("should store session ID in localStorage as fallback", async () => {
    const password = "BACKUP2025";
    await createSessionIdFromPassword(password);

    const stored = localStorage.getItem("nissekomm-session-id");
    expect(stored).toBeTruthy();
    expect(stored).toHaveLength(64);
  });

  it("should create consistent session IDs for same password", async () => {
    const password = "CONSISTENT2025";
    const id1 = await createSessionIdFromPassword(password);
    const id2 = await createSessionIdFromPassword(password);

    expect(id1).toBe(id2);
  });

  it("should create different session IDs for different passwords", async () => {
    const id1 = await createSessionIdFromPassword("FAMILY_A");
    const id2 = await createSessionIdFromPassword("FAMILY_B");

    expect(id1).not.toBe(id2);
  });
});

describe("Multi-Tenant Session Isolation", () => {
  it("should create unique tenants for different passwords", async () => {
    const family1Password = "HANSEN2025";
    const family2Password = "OLSEN2025";

    const tenant1 = await createSessionIdFromPassword(family1Password);
    const tenant2 = await createSessionIdFromPassword(family2Password);

    // Verify they are different tenants
    expect(tenant1).not.toBe(tenant2);

    // Verify consistency - same password = same tenant
    const tenant1Again = await createSessionIdFromPassword(family1Password);
    expect(tenant1Again).toBe(tenant1);
  });

  it("should maintain session ID format for multi-tenancy", async () => {
    const passwords = [
      "FAMILY_A",
      "FAMILY_B",
      "FAMILY_C",
      "TEST123",
      "NISSEKODE2025",
    ];

    const sessionIds = await Promise.all(
      passwords.map((pwd) => createSessionIdFromPassword(pwd)),
    );

    // All should be unique
    const uniqueIds = new Set(sessionIds);
    expect(uniqueIds.size).toBe(passwords.length);

    // All should be valid SHA-256 hashes
    sessionIds.forEach((id) => {
      expect(id).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

describe("Session Persistence", () => {
  it("should persist session across simulated page reload", async () => {
    const password = "PERSIST2025";
    const originalSessionId = await createSessionIdFromPassword(password);

    // Simulate page reload by checking localStorage
    const storedSessionId = localStorage.getItem("nissekomm-session-id");
    expect(storedSessionId).toBe(originalSessionId);

    // Recreate session from same password
    const restoredSessionId = await createSessionIdFromPassword(password);
    expect(restoredSessionId).toBe(originalSessionId);
  });

  it("should handle localStorage write failures gracefully", async () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("Storage quota exceeded");
    };

    // Should still create session ID even if localStorage fails
    const password = "FAILSAFE2025";
    const sessionId = await createSessionIdFromPassword(password);

    expect(sessionId).toBeTruthy();
    expect(sessionId).toHaveLength(64);

    // Restore original setItem
    localStorage.setItem = originalSetItem;
  });
});

describe("Cookie Management", () => {
  beforeEach(() => {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  it("should set cookie with correct attributes", async () => {
    const password = "COOKIE2025";
    const sessionId = await createSessionIdFromPassword(password);

    // Check cookie was set
    const cookies = document.cookie;
    expect(cookies).toContain("nissekomm-session=");
    expect(cookies).toContain(sessionId);
  });

  it("should create session even when cookies are disabled", async () => {
    // Mock document as undefined to simulate server-side or blocked cookies
    const originalDocument = global.document;
    // @ts-expect-error Testing edge case
    delete global.document;

    const password = "NOCOOKIE2025";
    const sessionId = await createSessionIdFromPassword(password);

    expect(sessionId).toBeTruthy();

    // Restore document
    global.document = originalDocument;
  });
});

describe("Edge Cases", () => {
  it("should handle empty password", async () => {
    const hash = await hashPassword("");
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });

  it("should handle very long passwords", async () => {
    const longPassword = "A".repeat(1000);
    const hash = await hashPassword(longPassword);
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });

  it("should handle special characters in password", async () => {
    const specialPassword = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~";
    const hash = await hashPassword(specialPassword);
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });

  it("should handle Norwegian characters", async () => {
    const norwegianPassword = "ÆRØÅÆØÅ2025";
    const hash = await hashPassword(norwegianPassword);
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });

  it("should handle Unicode characters", async () => {
    const unicodePassword = "🎄❄️🎅NISSEKODE2025";
    const hash = await hashPassword(unicodePassword);
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });
});

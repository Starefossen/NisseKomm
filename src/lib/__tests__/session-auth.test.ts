/**
 * Session Authentication Integration Tests
 *
 * Tests the new dual-code authentication system:
 * - Registration flow with kid/parent codes
 * - Login validation via API
 * - Session persistence with UUID sessionId
 * - Multi-tenant isolation
 *
 * NOTE: These tests require a running dev server for API routes
 * Run `pnpm dev` in another terminal before running tests
 */

// Configure environment for testing
process.env.NEXT_PUBLIC_STORAGE_BACKEND = "localStorage";

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  generateKidCode,
  generateParentCode,
  isValidKidCode,
  isValidParentCode,
  getCodeType,
} from "../code-generator";
import {
  getSessionId,
  setSessionId,
  clearSessionId,
  setParentAuthenticated,
  isParentAuthenticated,
  clearParentAuth,
  getKidCodeFromSession,
} from "../session-manager";

describe("Code Generation", () => {
  it("should generate valid kid codes", () => {
    // Mock Math.random to ensure different codes
    let callCount = 0;
    const mockRandom = jest.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.1 : 0.9; // Different values for each call
    });

    const code1 = generateKidCode();
    const code2 = generateKidCode();

    expect(isValidKidCode(code1)).toBe(true);
    expect(code1).toMatch(/^[A-Z]+2025$/);
    expect(code1).not.toBe(code2); // Different codes each time

    mockRandom.mockRestore();
  });

  it("should avoid collisions in kid codes", () => {
    const existing = ["NISSEKRAFT2025", "BREVFUGLSVERM2025"];
    const newCode = generateKidCode(2025, existing);

    expect(existing).not.toContain(newCode);
    expect(isValidKidCode(newCode)).toBe(true);
  });

  it("should generate valid parent codes", () => {
    const code1 = generateParentCode([]);
    const code2 = generateParentCode([]);

    expect(isValidParentCode(code1)).toBe(true);
    expect(code1).toMatch(/^NORDPOL-[A-Z0-9]{8}$/);
    expect(code1).not.toBe(code2); // Different codes each time
  });

  it("should avoid collisions in parent codes", () => {
    const existing = ["NORDPOL-AAAAA", "NORDPOL-BBBBB"];
    const newCode = generateParentCode(existing);

    expect(existing).not.toContain(newCode);
    expect(isValidParentCode(newCode)).toBe(true);
  });
});

describe("Code Validation", () => {
  it("should validate kid codes correctly", () => {
    expect(isValidKidCode("NISSEKRAFT2024")).toBe(true);
    expect(isValidKidCode("VERKSTEDVARME2025")).toBe(true);
    expect(isValidKidCode("invalid")).toBe(false);
    expect(isValidKidCode("")).toBe(false);
  });

  it("should validate parent codes correctly", () => {
    expect(isValidParentCode("NORDPOL-ABC12345")).toBe(true);
    expect(isValidParentCode("NORDPOL-XYZ99ABC")).toBe(true);
    expect(isValidParentCode("NORDPOL-ABC")).toBe(false); // Too short
    expect(isValidParentCode("INVALID-12345678")).toBe(false);
    expect(isValidParentCode("")).toBe(false);
  });

  it("should detect code type correctly", () => {
    expect(getCodeType("NISSEKRAFT2024")).toBe("kid");
    expect(getCodeType("NORDPOL-ABC12345")).toBe("parent");
    expect(getCodeType("invalid")).toBe("invalid");
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
    clearSessionId();
  });

  it("should store and retrieve session ID", () => {
    const testSessionId = "550e8400-e29b-41d4-a716-446655440000";
    setSessionId(testSessionId);

    const retrieved = getSessionId();
    expect(retrieved).toBe(testSessionId);
  });

  it("should persist session ID in localStorage", () => {
    const testSessionId = "550e8400-e29b-41d4-a716-446655440001";
    setSessionId(testSessionId);

    const stored = localStorage.getItem("nissekomm-session-id");
    expect(stored).toBe(testSessionId);
  });

  it("should clear session ID", () => {
    const testSessionId = "550e8400-e29b-41d4-a716-446655440002";
    setSessionId(testSessionId);
    expect(getSessionId()).toBe(testSessionId);

    clearSessionId();
    expect(getSessionId()).toBeNull();
    expect(localStorage.getItem("nissekomm-session-id")).toBeNull();
  });

  it("should return null for non-existent session", () => {
    const sessionId = getSessionId();
    expect(sessionId).toBeNull();
  });
});

describe("Session Persistence", () => {
  it("should persist session across simulated page reload", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440003";
    setSessionId(sessionId);

    // Simulate page reload by checking localStorage
    const storedSessionId = localStorage.getItem("nissekomm-session-id");
    expect(storedSessionId).toBe(sessionId);

    // Retrieve session
    const retrieved = getSessionId();
    expect(retrieved).toBe(sessionId);
  });

  it("should handle localStorage write failures gracefully", () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("Storage quota exceeded");
    };

    // Should not throw even if localStorage fails
    const sessionId = "550e8400-e29b-41d4-a716-446655440004";
    expect(() => setSessionId(sessionId)).not.toThrow();

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

  it("should set cookie with correct attributes", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440005";
    setSessionId(sessionId);

    // Check cookie was set
    const cookies = document.cookie;
    expect(cookies).toContain("nissekomm-session=");
    expect(cookies).toContain(sessionId);
  });
});

describe("Edge Cases", () => {
  it("should handle very long kid code vocabulary", () => {
    const existing: string[] = [];
    // Generate 100 codes to test uniqueness
    for (let i = 0; i < 100; i++) {
      const code = generateKidCode(2025, existing);
      expect(existing).not.toContain(code);
      existing.push(code);
    }
    expect(existing.length).toBe(100);
  });

  it("should handle many parent code generations", () => {
    const existing: string[] = [];
    // Generate 1000 codes to test collision avoidance
    for (let i = 0; i < 1000; i++) {
      const code = generateParentCode(existing);
      expect(existing).not.toContain(code);
      existing.push(code);
    }
    expect(existing.length).toBe(1000);
  });

  it("should validate codes case-insensitively", () => {
    expect(isValidKidCode("nissekraft2024")).toBe(true);
    expect(isValidKidCode("NISSEKRAFT2024")).toBe(true);
    expect(isValidKidCode("NisseKraft2024")).toBe(true);

    expect(isValidParentCode("nordpol-abc12345")).toBe(true);
    expect(isValidParentCode("NORDPOL-ABC12345")).toBe(true);
    expect(isValidParentCode("Nordpol-Abc12345")).toBe(true);
  });
});

describe("Parent Authentication", () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Clear localStorage
    localStorage.clear();
    clearSessionId();
    clearParentAuth();
  });

  it("should set parent as authenticated", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440010";
    setSessionId(sessionId);
    setParentAuthenticated(sessionId);

    expect(isParentAuthenticated()).toBe(true);
  });

  it("should return false when no session exists", () => {
    expect(isParentAuthenticated()).toBe(false);
  });

  it("should return false when parent auth does not match session", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440011";
    const otherSessionId = "550e8400-e29b-41d4-a716-446655440012";

    setSessionId(sessionId);
    setParentAuthenticated(otherSessionId);

    expect(isParentAuthenticated()).toBe(false);
  });

  it("should persist parent auth in localStorage", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440013";
    setSessionId(sessionId);
    setParentAuthenticated(sessionId);

    const stored = localStorage.getItem("nissekomm-parent-auth");
    expect(stored).toBe(sessionId);
  });

  it("should clear parent auth without clearing session", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440014";
    setSessionId(sessionId);
    setParentAuthenticated(sessionId);

    expect(isParentAuthenticated()).toBe(true);

    clearParentAuth();

    expect(isParentAuthenticated()).toBe(false);
    expect(getSessionId()).toBe(sessionId); // Session still exists
  });

  it("should set parent auth cookie", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440015";
    setSessionId(sessionId);
    setParentAuthenticated(sessionId);

    const cookies = document.cookie;
    expect(cookies).toContain("nissekomm-parent-auth=");
    expect(cookies).toContain(sessionId);
  });

  it("should handle localStorage write failures gracefully for parent auth", () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("Storage quota exceeded");
    };

    const sessionId = "550e8400-e29b-41d4-a716-446655440016";
    setSessionId(sessionId);

    // Should not throw even if localStorage fails
    expect(() => setParentAuthenticated(sessionId)).not.toThrow();

    localStorage.setItem = originalSetItem;
  });

  it("should use localStorage fallback for parent auth check", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440017";

    // Set session and parent auth
    setSessionId(sessionId);
    localStorage.setItem("nissekomm-parent-auth", sessionId);

    // Clear cookies to force localStorage fallback
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name === "nissekomm-parent-auth") {
        document.cookie = `${name}=;expires=${new Date().toUTCString()};path=/`;
      }
    });

    expect(isParentAuthenticated()).toBe(true);
  });
});

describe("Get Kid Code From Session", () => {
  beforeEach(() => {
    // Clear cookies and localStorage
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    clearSessionId();
  });

  it("should return null when no session exists", async () => {
    const result = await getKidCodeFromSession();
    expect(result).toBeNull();
  });

  it("should return sessionId as kidCode in localStorage mode when valid", async () => {
    // Generate a valid kid code and use it as session ID
    const kidCode = generateKidCode();
    setSessionId(kidCode);

    const result = await getKidCodeFromSession();
    expect(result).toBe(kidCode);
  });

  it("should return null for invalid kid code format in localStorage mode", async () => {
    // Use a UUID (not a valid kid code) as session ID
    const uuid = "550e8400-e29b-41d4-a716-446655440018";
    setSessionId(uuid);

    const result = await getKidCodeFromSession();
    expect(result).toBeNull();
  });
});

/**
 * Symbol System Tests
 *
 * Tests the physical-digital bridge for symbol collection:
 * - 9 symbols (3 shapes × 3 colors)
 * - Collection via code validation
 * - Duplicate detection
 * - Storage integration
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getAllSymbols,
  collectSymbolByCode,
  getCollectedSymbols,
  hasSymbol,
  clearCollectedSymbols,
  addCollectedSymbol,
} from "../systems/symbol-system";
import { StorageManager } from "../storage";

// Mock session-manager to prevent cookie side effects in tests
jest.mock("../session-manager", () => ({
  setSessionId: jest.fn(),
  getSessionId: jest.fn(() => null),
  clearSessionId: jest.fn(),
  getKidCodeFromSession: jest.fn(() => Promise.resolve(null)),
}));

// Use localStorage backend for these tests
process.env.NEXT_PUBLIC_STORAGE_BACKEND = "localStorage";

describe("Symbol System", () => {
  beforeEach(async () => {
    localStorage.clear();
    // Initialize storage for tests
    await StorageManager.setAuthenticated(true, `test_${Date.now()}`);
  });

  describe("getAllSymbols", () => {
    it("should return all 9 symbols", () => {
      const symbols = getAllSymbols();
      expect(symbols).toHaveLength(9);
    });

    it("should have 3 hearts, 3 suns, and 3 moons", () => {
      const symbols = getAllSymbols();
      const hearts = symbols.filter((s) => s.symbolIcon === "heart");
      const suns = symbols.filter((s) => s.symbolIcon === "sun");
      const moons = symbols.filter((s) => s.symbolIcon === "moon");

      expect(hearts).toHaveLength(3);
      expect(suns).toHaveLength(3);
      expect(moons).toHaveLength(3);
    });

    it("should have green, red, and blue variants for each shape", () => {
      const symbols = getAllSymbols();
      const colors = ["green", "red", "blue"];

      for (const icon of ["heart", "sun", "moon"]) {
        const shapeSymbols = symbols.filter((s) => s.symbolIcon === icon);
        const shapeColors = shapeSymbols.map((s) => s.symbolColor);
        expect(shapeColors.sort()).toEqual(colors.sort());
      }
    });

    it("should have unique symbolIds", () => {
      const symbols = getAllSymbols();
      const ids = symbols.map((s) => s.symbolId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(9);
    });

    it("should have Norwegian descriptions", () => {
      const symbols = getAllSymbols();
      // Check for Norwegian words
      expect(symbols.some((s) => s.description.includes("Grønt"))).toBe(true);
      expect(symbols.some((s) => s.description.includes("Rødt"))).toBe(true);
      expect(symbols.some((s) => s.description.includes("Blått"))).toBe(true);
    });
  });

  describe("collectSymbolByCode", () => {
    it("should successfully collect a valid symbol", () => {
      const result = collectSymbolByCode("heart-green");

      expect(result.success).toBe(true);
      expect(result.symbol).toBeDefined();
      expect(result.symbol?.symbolId).toBe("heart-green");
      expect(result.message).toContain("Symbol funnet");
    });

    it("should reject invalid symbol codes", () => {
      const result = collectSymbolByCode("invalid-code");

      expect(result.success).toBe(false);
      expect(result.symbol).toBeUndefined();
      expect(result.message).toContain("Ugyldig symbolkode");
    });

    it("should prevent duplicate collection", () => {
      // First collection should succeed
      const first = collectSymbolByCode("sun-red");
      expect(first.success).toBe(true);

      // Second collection of same symbol should fail
      const second = collectSymbolByCode("sun-red");
      expect(second.success).toBe(false);
      expect(second.message).toContain("allerede samlet");
      expect(second.symbol).toBeDefined(); // Returns symbol info even on failure
    });

    it("should allow collecting different symbols", () => {
      const first = collectSymbolByCode("heart-green");
      const second = collectSymbolByCode("moon-blue");

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
    });

    it("should include symbol description in success message", () => {
      const result = collectSymbolByCode("heart-red");

      expect(result.message).toContain("Rødt hjerte");
    });
  });

  describe("getCollectedSymbols", () => {
    it("should return empty array initially", () => {
      const collected = getCollectedSymbols();
      expect(collected).toEqual([]);
    });

    it("should return collected symbols", () => {
      collectSymbolByCode("heart-green");
      collectSymbolByCode("sun-blue");

      const collected = getCollectedSymbols();
      expect(collected).toHaveLength(2);
      expect(collected.map((s) => s.symbolId)).toContain("heart-green");
      expect(collected.map((s) => s.symbolId)).toContain("sun-blue");
    });
  });

  describe("hasSymbol", () => {
    it("should return false for uncollected symbols", () => {
      expect(hasSymbol("heart-green")).toBe(false);
    });

    it("should return true for collected symbols", () => {
      collectSymbolByCode("moon-red");
      expect(hasSymbol("moon-red")).toBe(true);
    });

    it("should return false for invalid symbol IDs", () => {
      expect(hasSymbol("invalid-id")).toBe(false);
    });
  });

  describe("clearCollectedSymbols", () => {
    it("should remove all collected symbols", () => {
      collectSymbolByCode("heart-green");
      collectSymbolByCode("sun-red");
      collectSymbolByCode("moon-blue");

      expect(getCollectedSymbols()).toHaveLength(3);

      clearCollectedSymbols();

      expect(getCollectedSymbols()).toHaveLength(0);
    });

    it("should allow re-collecting symbols after clear", () => {
      collectSymbolByCode("heart-green");
      clearCollectedSymbols();

      const result = collectSymbolByCode("heart-green");
      expect(result.success).toBe(true);
    });
  });

  describe("addCollectedSymbol", () => {
    it("should add symbol directly to collection", () => {
      const symbol = {
        symbolId: "heart-blue",
        symbolIcon: "heart" as const,
        symbolColor: "blue" as const,
        description: "Blått hjerte",
      };

      addCollectedSymbol(symbol);

      expect(hasSymbol("heart-blue")).toBe(true);
      const collected = getCollectedSymbols();
      expect(collected).toHaveLength(1);
      expect(collected[0].symbolId).toBe("heart-blue");
    });

    it("should work for parent guide manual addition", () => {
      // Simulate parent adding multiple symbols
      const symbols = getAllSymbols().slice(0, 3);
      symbols.forEach((s) => addCollectedSymbol(s));

      expect(getCollectedSymbols()).toHaveLength(3);
    });
  });

  describe("Full collection scenario", () => {
    it("should allow collecting all 9 symbols", () => {
      const allSymbols = getAllSymbols();

      for (const symbol of allSymbols) {
        const result = collectSymbolByCode(symbol.symbolId);
        expect(result.success).toBe(true);
      }

      expect(getCollectedSymbols()).toHaveLength(9);
    });
  });
});

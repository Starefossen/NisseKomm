/**
 * Oppdrag (Quest) System Tests
 *
 * Tests the quest loading, validation, and utility functions:
 * - Quest data validation and merging
 * - Accessibility checks
 * - Quest querying utilities
 */

import { describe, it, expect } from "@jest/globals";
import { getAllOppdrag, isBonusOppdragAccessible } from "../oppdrag";

describe("Oppdrag Loader", () => {
  describe("getAllOppdrag", () => {
    it("should return exactly 24 quests", () => {
      const quests = getAllOppdrag();
      expect(quests).toHaveLength(24);
    });

    it("should have quests for all days 1-24", () => {
      const quests = getAllOppdrag();
      const days = quests.map((q) => q.dag);

      for (let day = 1; day <= 24; day++) {
        expect(days).toContain(day);
      }
    });

    it("should return quests sorted by day number", () => {
      const quests = getAllOppdrag();

      for (let i = 0; i < quests.length - 1; i++) {
        expect(quests[i].dag).toBeLessThan(quests[i + 1].dag);
      }
    });

    it("should have unique codes for each quest", () => {
      const quests = getAllOppdrag();
      const codes = quests.map((q) => q.kode.toUpperCase());
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have all required fields populated", () => {
      const quests = getAllOppdrag();

      quests.forEach((quest) => {
        expect(quest.dag).toBeGreaterThanOrEqual(1);
        expect(quest.dag).toBeLessThanOrEqual(24);
        expect(quest.tittel).toBeTruthy();
        expect(quest.nissemail_tekst).toBeTruthy();
        expect(quest.kode).toBeTruthy();
        expect(quest.dagbokinnlegg).toBeTruthy();
        expect(quest.rampenissen_rampestrek).toBeTruthy();
        expect(quest.fysisk_hint).toBeTruthy();
        expect(quest.oppsett_tid).toBeTruthy();
        expect(Array.isArray(quest.materialer_nødvendig)).toBe(true);
        expect(quest.beste_rom).toBeTruthy();
        expect(quest.hint_type).toBeTruthy();
      });
    });

    it("should have valid oppsett_tid values", () => {
      const quests = getAllOppdrag();
      const validValues = ["enkel", "moderat", "avansert"];

      quests.forEach((quest) => {
        expect(validValues).toContain(quest.oppsett_tid);
      });
    });

    it("should have valid hint_type values", () => {
      const quests = getAllOppdrag();
      const validTypes = [
        "skrevet",
        "visuell",
        "gjemt_objekt",
        "arrangement",
        "spor",
        "lyd",
        "kombinasjon",
      ];

      quests.forEach((quest) => {
        expect(validTypes).toContain(quest.hint_type);
      });
    });
  });

  describe("Quest with Eventyr", () => {
    it("should have valid eventyr references", () => {
      const quests = getAllOppdrag();
      const questsWithEventyr = quests.filter((q) => q.eventyr);

      questsWithEventyr.forEach((quest) => {
        expect(quest.eventyr!.id).toBeTruthy();
        expect(quest.eventyr!.phase).toBeGreaterThan(0);
      });
    });

    it("should have sequential phases for each eventyr", () => {
      const quests = getAllOppdrag();
      const eventyrPhases = new Map<string, number[]>();

      quests.forEach((quest) => {
        if (quest.eventyr) {
          const { id, phase } = quest.eventyr;
          if (!eventyrPhases.has(id)) {
            eventyrPhases.set(id, []);
          }
          eventyrPhases.get(id)!.push(phase);
        }
      });

      // Each eventyr should have sequential phases starting from 1
      eventyrPhases.forEach((phases) => {
        const sorted = [...phases].sort((a, b) => a - b);
        expect(sorted[0]).toBe(1); // Should start at phase 1
        // Phases should be sequential (no gaps)
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i + 1]).toBe(sorted[i] + 1);
        }
      });
    });
  });

  describe("Quest with Bonusoppdrag", () => {
    it("should have valid bonusoppdrag structure", () => {
      const quests = getAllOppdrag();
      const questsWithBonus = quests.filter((q) => q.bonusoppdrag);

      expect(questsWithBonus.length).toBeGreaterThan(0);

      questsWithBonus.forEach((quest) => {
        expect(quest.bonusoppdrag!.tittel).toBeTruthy();
        expect(quest.bonusoppdrag!.beskrivelse).toBeTruthy();
        expect(quest.bonusoppdrag!.validering).toBeTruthy();
        expect(quest.bonusoppdrag!.badge_id).toBeTruthy();
        expect(quest.bonusoppdrag!.badge_icon).toBeTruthy();
        expect(quest.bonusoppdrag!.badge_navn).toBeTruthy();
      });
    });

    it("should have kode when validering is kode", () => {
      const quests = getAllOppdrag();
      const codeValidatedQuests = quests.filter(
        (q) => q.bonusoppdrag?.validering === "kode",
      );

      codeValidatedQuests.forEach((quest) => {
        expect(quest.bonusoppdrag!.kode).toBeTruthy();
      });
    });
  });

  describe("Quest with Reveals", () => {
    it("should have valid reveals structure when present", () => {
      const quests = getAllOppdrag();
      const questsWithReveals = quests.filter((q) => q.reveals);

      questsWithReveals.forEach((quest) => {
        if (quest.reveals!.files) {
          expect(Array.isArray(quest.reveals!.files)).toBe(true);
        }
        if (quest.reveals!.topics) {
          expect(Array.isArray(quest.reveals!.topics)).toBe(true);
        }
        if (quest.reveals!.modules) {
          expect(Array.isArray(quest.reveals!.modules)).toBe(true);
        }
      });
    });
  });

  describe("Quest with Symbol Clues", () => {
    it("should have valid symbol_clue structure when present", () => {
      const quests = getAllOppdrag();
      const questsWithSymbols = quests.filter((q) => q.symbol_clue);

      expect(questsWithSymbols.length).toBeGreaterThan(0);

      questsWithSymbols.forEach((quest) => {
        expect(quest.symbol_clue!.symbolId).toBeTruthy();
        expect(quest.symbol_clue!.symbolIcon).toBeTruthy();
        expect(quest.symbol_clue!.symbolColor).toBeTruthy();
        expect(quest.symbol_clue!.description).toBeTruthy();
      });
    });
  });
});

describe("isBonusOppdragAccessible", () => {
  it("should return false when main quest not completed", () => {
    const completedCodes: string[] = [];
    const result = isBonusOppdragAccessible(8, completedCodes);
    expect(result).toBe(false);
  });

  it("should return true when main quest is completed", () => {
    const quests = getAllOppdrag();
    const day8Quest = quests.find((q) => q.dag === 8);
    expect(day8Quest).toBeDefined();

    const completedCodes = [day8Quest!.kode.toUpperCase()];
    const result = isBonusOppdragAccessible(8, completedCodes);
    expect(result).toBe(true);
  });

  it("should be case-insensitive for code matching", () => {
    const quests = getAllOppdrag();
    const day8Quest = quests.find((q) => q.dag === 8);

    const completedCodes = [day8Quest!.kode.toLowerCase()];
    const result = isBonusOppdragAccessible(8, completedCodes);
    expect(result).toBe(true);
  });

  it("should return false for non-existent day", () => {
    const completedCodes = ["SOMECODE"];
    const result = isBonusOppdragAccessible(99, completedCodes);
    expect(result).toBe(false);
  });
});

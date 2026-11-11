/**
 * Oppdrag (Quest) System Tests
 *
 * Tests the quest loading, validation, and utility functions:
 * - Quest data validation and merging
 * - Accessibility checks
 * - Quest querying utilities
 */

import { describe, it, expect } from "@jest/globals";
import { getAllOppdrag } from "../oppdrag";

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
        expect(quest.rampenissen_rampestrek).toBeTruthy();
        expect(quest.fysisk_hint).toBeTruthy();
        expect(quest.oppsett_tid).toBeTruthy();
        expect(Array.isArray(quest.materialer_nødvendig)).toBe(true);
        expect(quest.beste_rom).toBeTruthy();
      });
    });

    it("should have julius_ps on every day", () => {
      getAllOppdrag().forEach((quest) => {
        expect(quest.julius_ps).toBeTruthy();
      });
    });

    it("should have PS variants only where app-tekster has them", () => {
      const days = (k: "julius_ps_bonus" | "julius_ps_krypto_mangler") =>
        getAllOppdrag()
          .filter((q) => q[k])
          .map((q) => q.dag);
      expect(days("julius_ps_bonus")).toEqual([11, 16, 17, 18, 19]);
      expect(days("julius_ps_krypto_mangler")).toEqual([20]);
    });

    it("should have valid oppsett_tid values", () => {
      const quests = getAllOppdrag();
      const validValues = ["enkel", "moderat", "avansert"];

      quests.forEach((quest) => {
        expect(validValues).toContain(quest.oppsett_tid);
      });
    });
  });

  describe("Quest with Eventyr", () => {
    it("should belong to the one story on every day", () => {
      getAllOppdrag().forEach((quest) => {
        expect(quest.eventyr).toEqual({
          id: "spokelseskoden",
          phase: quest.dag,
        });
      });
    });
  });

  describe("Quest with Bonusoppdrag", () => {
    it("should have the two parent-approved bonus quests", () => {
      const bonus = getAllOppdrag().filter((q) => q.bonusoppdrag);
      expect(bonus.map((q) => [q.dag, q.bonusoppdrag!.foreldre_kode])).toEqual([
        [11, "ANTENNE2026"],
        [16, "LYKT2026"],
      ]);
      bonus.forEach((q) => {
        expect(q.bonusoppdrag!.validering).toBe("forelder");
        expect(q.bonusoppdrag!.frost_effekt).toBe(-20);
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

/**
 * Template Resolver Tests
 *
 * Tests for placeholder resolution in static content.
 * Pure functions = easy to test without mocks.
 */

import { describe, it, expect } from "@jest/globals";
import {
  resolveTemplate,
  formatNameList,
  generateFinaleMessage,
  generateNiceListEntries,
  hasPlaceholders,
  findPlaceholders,
} from "../template-resolver";

describe("resolveTemplate", () => {
  describe("{{KID_CODE}}", () => {
    it("resolves kid code placeholder", () => {
      const template = "Din kode er: {{KID_CODE}}";
      const result = resolveTemplate(template, { kidCode: "NISSEKRAFT2024" });
      expect(result).toBe("Din kode er: NISSEKRAFT2024");
    });

    it("replaces with empty string when no kid code provided", () => {
      const template = "Kode: {{KID_CODE}}";
      const result = resolveTemplate(template, {});
      expect(result).toBe("Kode: ");
    });

    it("replaces multiple occurrences", () => {
      const template =
        "{{KID_CODE}} er din kode. Bruk {{KID_CODE}} for å logge inn.";
      const result = resolveTemplate(template, { kidCode: "TEST123" });
      expect(result).toBe("TEST123 er din kode. Bruk TEST123 for å logge inn.");
    });
  });

  describe("{{KID_NAMES}}", () => {
    it("formats single name", () => {
      const template = "Hei {{KID_NAMES}}!";
      const result = resolveTemplate(template, { kidNames: ["Ola"] });
      expect(result).toBe("Hei Ola!");
    });

    it("formats two names with 'og'", () => {
      const template = "Hei {{KID_NAMES}}!";
      const result = resolveTemplate(template, { kidNames: ["Ola", "Kari"] });
      expect(result).toBe("Hei Ola og Kari!");
    });

    it("formats three+ names with commas and 'og'", () => {
      const template = "Hei {{KID_NAMES}}!";
      const result = resolveTemplate(template, {
        kidNames: ["Ola", "Kari", "Per"],
      });
      expect(result).toBe("Hei Ola, Kari og Per!");
    });

    it("handles empty array", () => {
      const template = "Hei {{KID_NAMES}}!";
      const result = resolveTemplate(template, { kidNames: [] });
      expect(result).toBe("Hei !");
    });
  });

  describe("{{FRIEND_NAMES}}", () => {
    it("resolves friend names", () => {
      const template = "Venner: {{FRIEND_NAMES}}";
      const result = resolveTemplate(template, {
        friendNames: ["Emma", "Noah"],
      });
      expect(result).toBe("Venner: Emma og Noah");
    });

    it("filters empty strings", () => {
      const template = "{{FRIEND_NAMES}}";
      const result = resolveTemplate(template, {
        friendNames: ["Emma", "", "Noah", "  "],
      });
      expect(result).toBe("Emma og Noah");
    });
  });

  describe("{{PLAYER_NAMES}}", () => {
    it("resolves player names", () => {
      const template = "Spillere: {{PLAYER_NAMES}}";
      const result = resolveTemplate(template, {
        playerNames: ["Ola", "Kari"],
      });
      expect(result).toBe("Spillere: Ola og Kari");
    });
  });

  describe("{{UPDATE_DATE}}", () => {
    it("shows current day by default", () => {
      const template = "Sist oppdatert: {{UPDATE_DATE}}";
      const result = resolveTemplate(template, { currentDay: 15 });
      expect(result).toBe("Sist oppdatert: 15. Desember");
    });

    it("shows special message on Day 23 completion", () => {
      const template = "{{UPDATE_DATE}}";
      const result = resolveTemplate(template, {
        currentDay: 23,
        completedDays: [1, 2, 3, 23],
      });
      expect(result).toBe("23. Desember ✓");
    });

    it("shows julaften message on Day 24 completion", () => {
      const template = "{{UPDATE_DATE}}";
      const result = resolveTemplate(template, {
        currentDay: 24,
        completedDays: [23, 24],
      });
      expect(result).toBe("24. Desember - JULAFTEN! 🎄✨");
    });

    it("defaults to day 1 when no currentDay provided", () => {
      const template = "{{UPDATE_DATE}}";
      const result = resolveTemplate(template, {});
      expect(result).toBe("1. Desember");
    });
  });

  describe("{{FINALE_MESSAGE}}", () => {
    it("shows personalized message when Day 24 complete", () => {
      const template = "Nice List\n{{FINALE_MESSAGE}}";
      const result = resolveTemplate(template, {
        completedDays: [24],
        playerNames: ["Ola", "Kari"],
      });
      expect(result).toContain("GRATULERER, Ola, Kari!");
      expect(result).toContain("Julius");
    });

    it("uses generic 'barn' when no player names", () => {
      const template = "{{FINALE_MESSAGE}}";
      const result = resolveTemplate(template, {
        completedDays: [24],
        playerNames: [],
      });
      expect(result).toContain("GRATULERER, barn!");
    });

    it("removes placeholder when Day 24 not complete", () => {
      const template = "Nice List\n\n{{FINALE_MESSAGE}}";
      const result = resolveTemplate(template, {
        completedDays: [1, 2, 3],
      });
      expect(result).toBe("Nice List");
      expect(result).not.toContain("FINALE");
    });
  });

  describe("multiple placeholders", () => {
    it("resolves all placeholders in one pass", () => {
      const template =
        "Hei {{KID_NAMES}}! Din kode er {{KID_CODE}}. Dato: {{UPDATE_DATE}}";
      const result = resolveTemplate(template, {
        kidNames: ["Ola"],
        kidCode: "TEST123",
        currentDay: 10,
      });
      expect(result).toBe("Hei Ola! Din kode er TEST123. Dato: 10. Desember");
    });
  });

  describe("no placeholders", () => {
    it("returns original string unchanged", () => {
      const template = "Dette er en vanlig tekst uten plassholdere.";
      const result = resolveTemplate(template, {});
      expect(result).toBe(template);
    });
  });
});

describe("formatNameList", () => {
  it("returns empty string for empty array", () => {
    expect(formatNameList([])).toBe("");
  });

  it("returns single name as-is", () => {
    expect(formatNameList(["Ola"])).toBe("Ola");
  });

  it("joins two names with 'og'", () => {
    expect(formatNameList(["Ola", "Kari"])).toBe("Ola og Kari");
  });

  it("joins multiple names with commas and 'og'", () => {
    expect(formatNameList(["Ola", "Kari", "Per", "Lise"])).toBe(
      "Ola, Kari, Per og Lise",
    );
  });

  it("filters out empty strings", () => {
    expect(formatNameList(["Ola", "", "Kari", "   "])).toBe("Ola og Kari");
  });

  it("handles all empty strings", () => {
    expect(formatNameList(["", "  ", ""])).toBe("");
  });
});

describe("generateFinaleMessage", () => {
  it("includes the names provided", () => {
    const result = generateFinaleMessage("Ola og Kari");
    expect(result).toContain("Ola og Kari");
  });

  it("includes congratulations emoji", () => {
    const result = generateFinaleMessage("Test");
    expect(result).toContain("🏆");
    expect(result).toContain("GRATULERER");
  });

  it("includes Julius signature", () => {
    const result = generateFinaleMessage("Test");
    expect(result).toContain("Julius");
  });
});

describe("generateNiceListEntries", () => {
  describe("with showPlayerAchievements = true (Day 23+)", () => {
    it("generates entries for players with special marker", () => {
      const result = generateNiceListEntries(["Ola", "Kari"], [], true);
      expect(result).toContain(
        "1. Ola - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐",
      );
      expect(result).toContain(
        "2. Kari - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐",
      );
    });

    it("adds friends after players with absurd reasons", () => {
      const result = generateNiceListEntries(["Ola"], ["Emma", "Noah"], true);
      expect(result).toContain(
        "1. Ola - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐",
      );
      expect(result).toContain("2. Emma -");
      expect(result).toContain("3. Noah -");
      // Friends should have reasons (not the achievement marker)
      expect(result.split("\n")[1]).not.toContain("⭐");
    });
  });

  describe("with showPlayerAchievements = false (before Day 23)", () => {
    it("shows friends with absurd reasons", () => {
      const result = generateNiceListEntries([], ["Emma", "Noah"], false);
      expect(result).toContain("1. Emma -");
      expect(result).toContain("2. Noah -");
      // Should have placeholder text
      expect(result).toContain("... [PLASS TIL FLERE NAVN] ...");
    });

    it("uses fallback names when no friends provided", () => {
      const result = generateNiceListEntries([], [], false);
      // Should contain fallback names with reasons
      expect(result).toContain("1. Georg -");
      expect(result).toContain("2. Viljar -");
      // Should NOT have placeholder (fallback is complete list)
      expect(result).not.toContain("... [PLASS TIL FLERE NAVN] ...");
    });
  });

  it("generates deterministic reasons for same name", () => {
    const result1 = generateNiceListEntries([], ["Emma"], false);
    const result2 = generateNiceListEntries([], ["Emma"], false);
    expect(result1).toBe(result2);
  });

  it("generates different reasons for different names", () => {
    const result1 = generateNiceListEntries([], ["Emma"], false);
    const result2 = generateNiceListEntries([], ["Noah"], false);
    // Extract just the reason part
    const reason1 = result1.split(" - ")[1]?.split("\n")[0];
    const reason2 = result2.split(" - ")[1]?.split("\n")[0];
    expect(reason1).not.toBe(reason2);
  });

  it("filters empty names", () => {
    const result = generateNiceListEntries(["Ola", ""], ["Emma", "  "], true);
    expect(result).toContain("1. Ola");
    expect(result).toContain("2. Emma");
    expect(result).not.toContain("3.");
  });

  describe("pre-formatted entries (Name - Reason)", () => {
    it("uses provided reason when entry matches 'Name - Reason' format", () => {
      const result = generateNiceListEntries(
        [],
        ["Emma - reddet en kanin fra snøstorm"],
        false,
      );
      expect(result).toContain("1. Emma - reddet en kanin fra snøstorm");
      // Should NOT auto-generate a different reason
      expect(result).not.toMatch(/1\. Emma - (fant|delte|laget|hjalp)/);
    });

    it("auto-generates reason for names without dash separator", () => {
      const result = generateNiceListEntries([], ["Emma"], false);
      expect(result).toContain("1. Emma -");
      // Should have some auto-generated reason after the dash
      expect(result).toMatch(/1\. Emma - .+/);
    });

    it("handles mixed pre-formatted and simple names", () => {
      const result = generateNiceListEntries(
        [],
        ["Emma - reddet en kanin", "Noah", "Lise - delte lunsjen sin"],
        false,
      );
      expect(result).toContain("1. Emma - reddet en kanin");
      expect(result).toMatch(/2\. Noah - .+/); // Auto-generated
      expect(result).toContain("3. Lise - delte lunsjen sin");
    });

    it("trims whitespace around name and reason", () => {
      const result = generateNiceListEntries(
        [],
        ["  Emma  -  reddet en kanin  "],
        false,
      );
      expect(result).toContain("1. Emma - reddet en kanin");
      expect(result).not.toContain("  Emma  ");
    });

    it("handles names with hyphens in the name part", () => {
      const result = generateNiceListEntries(
        [],
        ["Anne-Lise - var snill"],
        false,
      );
      expect(result).toContain("1. Anne-Lise - var snill");
    });

    it("works with player achievements and pre-formatted friends", () => {
      const result = generateNiceListEntries(
        ["Ola"],
        ["Emma - reddet en kanin"],
        true,
      );
      expect(result).toContain(
        "1. Ola - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐",
      );
      expect(result).toContain("2. Emma - reddet en kanin");
    });
  });
});

describe("{{NICE_LIST_ENTRIES}} placeholder", () => {
  it("generates fallback list when no names provided", () => {
    const template = "Nice List:\n{{NICE_LIST_ENTRIES}}";
    const result = resolveTemplate(template, {});
    expect(result).toContain("1. Georg -");
    expect(result).toContain("2. Viljar -");
  });

  it("generates list with friend names when provided", () => {
    const template = "Nice List:\n{{NICE_LIST_ENTRIES}}";
    const result = resolveTemplate(template, {
      friendNames: ["Emma", "Noah"],
    });
    expect(result).toContain("1. Emma -");
    expect(result).toContain("2. Noah -");
    expect(result).not.toContain("Georg"); // No fallback
  });

  it("shows player achievements when Day 23 completed", () => {
    const template = "{{NICE_LIST_ENTRIES}}";
    const result = resolveTemplate(template, {
      playerNames: ["Ola"],
      friendNames: ["Emma"],
      completedDays: [23],
    });
    expect(result).toContain("1. Ola - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐");
    expect(result).toContain("2. Emma -");
  });
});

describe("hasPlaceholders", () => {
  it("returns true when placeholders exist", () => {
    expect(hasPlaceholders("Hello {{KID_CODE}}")).toBe(true);
    expect(hasPlaceholders("{{UPDATE_DATE}}")).toBe(true);
  });

  it("returns false when no placeholders", () => {
    expect(hasPlaceholders("Hello world")).toBe(false);
    expect(hasPlaceholders("")).toBe(false);
  });

  it("returns false for incomplete placeholder syntax", () => {
    expect(hasPlaceholders("Hello {KID_CODE}")).toBe(false);
    expect(hasPlaceholders("Hello {{kidcode}}")).toBe(false); // lowercase
  });
});

describe("findPlaceholders", () => {
  it("returns array of found placeholders", () => {
    const result = findPlaceholders("{{KID_CODE}} and {{UPDATE_DATE}}");
    expect(result).toEqual(["{{KID_CODE}}", "{{UPDATE_DATE}}"]);
  });

  it("returns unique placeholders only", () => {
    const result = findPlaceholders("{{KID_CODE}} and {{KID_CODE}}");
    expect(result).toEqual(["{{KID_CODE}}"]);
  });

  it("returns empty array when none found", () => {
    const result = findPlaceholders("No placeholders here");
    expect(result).toEqual([]);
  });
});

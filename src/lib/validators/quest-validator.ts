/**
 * Quest Validation Module
 *
 * Build-time validation functions for quest data integrity.
 * All validators are pure functions that throw errors on validation failure.
 *
 * VALIDATION CATEGORIES:
 * 1. Field validation - Required fields, types, enums
 * 2. Reference validation - File IDs, eventyr IDs, symbol IDs
 * 3. Dependency validation - Topic dependencies, circular references
 * 4. Sequence validation - Eventyr phases, progressive hints
 * 5. Collection validation - Day numbers, unique codes
 */

import { Oppdrag } from "@/types/innhold";
import { getAllEventyr } from "../eventyr";

/**
 * Validates a single quest (oppdrag) has all required fields
 *
 * REQUIRED FIELDS:
 * - dag: Quest day (1-24)
 * - tittel: Quest title
 * - nissemail_tekst: Email content from Rampenissen
 * - kode: Completion code (unique per quest)
 * - dagbokinnlegg: Julius' diary entry
 * - rampenissen_rampestrek: Rampenissen's mischief description
 * - fysisk_hint: Physical scavenger hunt clue
 * - oppsett_tid: Setup complexity (enkel/moderat/avansert)
 * - materialer_nødvendig: Required materials array
 * - beste_rom: Best room for hiding clue
 * - hint_type: Clue category (skrevet/visuell/gjemt_objekt/etc)
 *
 * BONUS QUEST VALIDATION:
 * - If bonusoppdrag exists, validates all required fields
 * - Checks badge_icon is in allowed list
 * - Ensures kode exists if validering="kode"
 *
 * @param oppdrag - Quest object to validate
 * @param weekNumber - Week number (1-4) for error messages
 * @throws Error with descriptive message if validation fails
 */
export function validateOppdrag(oppdrag: Oppdrag, weekNumber: number): void {
  const requiredFields: (keyof Oppdrag)[] = [
    "dag",
    "tittel",
    "nissemail_tekst",
    "kode",
    "dagbokinnlegg",
    "rampenissen_rampestrek",
    "fysisk_hint",
    "oppsett_tid",
    "materialer_nødvendig",
    "beste_rom",
    "hint_type",
  ];

  for (const field of requiredFields) {
    if (
      oppdrag[field] === undefined ||
      oppdrag[field] === null ||
      oppdrag[field] === ""
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - Missing required field: ${field}`,
      );
    }
  }

  // Validate materialer_nødvendig is an array
  if (!Array.isArray(oppdrag.materialer_nødvendig)) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - materialer_nødvendig must be an array`,
    );
  }

  // Validate oppsett_tid is valid value
  const validOppsettTid = ["enkel", "moderat", "avansert"];
  if (!validOppsettTid.includes(oppdrag.oppsett_tid)) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - oppsett_tid must be one of: ${validOppsettTid.join(", ")}`,
    );
  }

  // Validate hint_type is valid value
  const validHintTypes = [
    "skrevet",
    "visuell",
    "gjemt_objekt",
    "arrangement",
    "spor",
    "lyd",
    "kombinasjon",
  ] as const;
  if (
    !validHintTypes.includes(
      oppdrag.hint_type as (typeof validHintTypes)[number],
    )
  ) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - hint_type must be one of: ${validHintTypes.join(", ")}`,
    );
  }

  // Validate bonus quest structure if present
  if (oppdrag.bonusoppdrag) {
    const bonusoppdrag = oppdrag.bonusoppdrag;
    if (
      !bonusoppdrag.tittel ||
      !bonusoppdrag.beskrivelse ||
      !bonusoppdrag.validering ||
      !bonusoppdrag.badge_icon ||
      !bonusoppdrag.badge_navn
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag missing required fields`,
      );
    }
    if (bonusoppdrag.validering === "kode" && !bonusoppdrag.kode) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag with validering="kode" must have kode field`,
      );
    }
    const validBadgeIcons = ["coin", "heart", "zap", "trophy", "gift", "star"];
    if (!validBadgeIcons.includes(bonusoppdrag.badge_icon)) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag.badge_icon must be one of: ${validBadgeIcons.join(", ")}`,
      );
    }
  }
}

/**
 * Validate file references in quest reveals and decryption challenges
 *
 * Ensures all file IDs referenced in:
 * - quest.reveals.files[]
 * - quest.decryption_challenge.unlocksFiles[]
 *
 * Actually exist in statisk_innhold.json file tree.
 *
 * @param quests - Array of all quests to validate
 * @param availableFiles - Array of valid file IDs from static content
 * @throws Error if quest references non-existent file
 */
export function validateFileReferences(
  quests: Oppdrag[],
  availableFiles: string[],
): void {
  quests.forEach((quest) => {
    if (quest.reveals?.files) {
      quest.reveals.files.forEach((fileId) => {
        if (!availableFiles.includes(fileId)) {
          throw new Error(
            `Validation Error: Day ${quest.dag} reveals file '${fileId}' not found in statisk_innhold.json`,
          );
        }
      });
    }

    if (quest.decryption_challenge?.unlocksFiles) {
      quest.decryption_challenge.unlocksFiles.forEach((fileId: string) => {
        if (!availableFiles.includes(fileId)) {
          throw new Error(
            `Validation Error: Day ${quest.dag} decryption challenge unlocks file '${fileId}' not found in statisk_innhold.json`,
          );
        }
      });
    }
  });
}

/**
 * Build topic dependency graph and check for cycles using topological sort
 *
 * VALIDATION LOGIC:
 * 1. Collect all revealed topics from quest.reveals.topics[]
 * 2. For each quest.requires.topics[], verify topic was revealed somewhere
 * 3. Build dependency graph: required topic -> revealed topic
 * 4. Run DFS to detect circular dependencies
 *
 * PREVENTS:
 * - Topic A requires Topic B, Topic B requires Topic A (cycle)
 * - Quest requiring topic that is never revealed
 *
 * @param quests - Array of all quests to validate
 * @throws Error if circular dependency or missing topic detected
 */
export function validateTopicDependencies(quests: Oppdrag[]): void {
  // Build adjacency list: topic -> [dependent topics]
  const graph = new Map<string, string[]>();
  const allTopics = new Set<string>();

  // Collect all topics that are revealed
  quests.forEach((quest) => {
    if (quest.reveals?.topics) {
      quest.reveals.topics.forEach((topic) => {
        allTopics.add(topic);
        if (!graph.has(topic)) {
          graph.set(topic, []);
        }
      });
    }
  });

  // Build dependencies: if quest requires topics, those topics must exist
  quests.forEach((quest) => {
    if (quest.requires?.topics) {
      quest.requires.topics.forEach((requiredTopic) => {
        if (!allTopics.has(requiredTopic)) {
          throw new Error(
            `Validation Error: Day ${quest.dag} requires topic '${requiredTopic}' which is never revealed`,
          );
        }
      });

      // Add edges: required topics point to revealed topics
      if (quest.reveals?.topics) {
        quest.requires.topics.forEach((requiredTopic) => {
          quest.reveals!.topics!.forEach((revealedTopic) => {
            const deps = graph.get(requiredTopic) || [];
            deps.push(revealedTopic);
            graph.set(requiredTopic, deps);
          });
        });
      }
    }
  });

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(topic: string): boolean {
    visited.add(topic);
    recursionStack.add(topic);

    const neighbors = graph.get(topic) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(topic);
    return false;
  }

  for (const topic of allTopics) {
    if (!visited.has(topic)) {
      if (hasCycle(topic)) {
        throw new Error(
          `Validation Error: Circular dependency detected in topic requirements involving '${topic}'`,
        );
      }
    }
  }
}

/**
 * Validate that eventyr IDs in quests reference valid eventyr in eventyr.json
 *
 * Ensures quest.eventyr.id exists in the eventyr definitions.
 * Prevents typos or references to deleted/renamed eventyr.
 *
 * @param quests - Array of all quests to validate
 * @throws Error if quest references unknown eventyr ID
 */
export function validateEventyrReferences(quests: Oppdrag[]): void {
  const validEventyrIds = new Set(getAllEventyr().map((eventyr) => eventyr.id));

  quests.forEach((quest) => {
    if (quest.eventyr) {
      const eventyrId = quest.eventyr.id;
      if (!validEventyrIds.has(eventyrId)) {
        throw new Error(
          `Validation Error: Day ${quest.dag} references unknown eventyr '${eventyrId}'. ` +
            `Valid eventyr IDs: ${Array.from(validEventyrIds).join(", ")}`,
        );
      }
    }
  });
}

/**
 * Validate eventyr phase sequences are sequential without gaps
 *
 * RULES:
 * - Each eventyr must have phases 1, 2, 3, ..., N (no gaps)
 * - No duplicate phases within same eventyr
 * - Phases must be positive integers
 *
 * EXAMPLE VALID:
 * - brevfugl-mysteriet: [1, 2, 3, 4] ✓
 *
 * EXAMPLE INVALID:
 * - brevfugl-mysteriet: [1, 3, 4] ✗ (missing phase 2)
 * - brevfugl-mysteriet: [1, 2, 2, 3] ✗ (duplicate phase 2)
 *
 * @param quests - Array of all quests to validate
 * @throws Error if eventyr has non-sequential phases
 */
export function validateEventyr(quests: Oppdrag[]): void {
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

  // Check each eventyr has sequential phases without gaps
  eventyrPhases.forEach((phases, eventyrId) => {
    const sortedPhases = [...phases].sort((a, b) => a - b);
    for (let i = 0; i < sortedPhases.length; i++) {
      const expectedPhase = i + 1;
      if (sortedPhases[i] !== expectedPhase) {
        throw new Error(
          `Validation Error: Eventyr '${eventyrId}' has non-sequential phases. ` +
            `Expected phase ${expectedPhase}, found phase ${sortedPhases[i]}`,
        );
      }
    }
  });
}

/**
 * Validate symbol requirements reference existing symbol rewards
 *
 * VALIDATION:
 * 1. Collect all symbol IDs awarded via quest.symbol_clue.symbolId
 * 2. For each decryption challenge, verify all requiredSymbols exist
 * 3. Validate correctSequence indices are within bounds
 *
 * PREVENTS:
 * - Challenge requiring symbol that was never awarded
 * - correctSequence referencing out-of-bounds symbol index
 *
 * @param quests - Array of all quests to validate
 * @throws Error if challenge requires non-existent symbol
 */
export function validateSymbolReferences(quests: Oppdrag[]): void {
  const awardedSymbols = new Set<string>();

  // Collect all symbols awarded
  quests.forEach((quest) => {
    if (quest.symbol_clue) {
      awardedSymbols.add(quest.symbol_clue.symbolId);
    }
  });

  // Check decryption challenges reference valid symbols
  quests.forEach((quest) => {
    if (quest.decryption_challenge) {
      quest.decryption_challenge.requiredSymbols.forEach((symbolId: string) => {
        if (!awardedSymbols.has(symbolId)) {
          throw new Error(
            `Validation Error: Day ${quest.dag} decryption challenge requires symbol '${symbolId}' ` +
              `which is never awarded by any quest`,
          );
        }
      });

      // Validate correctSequence indexes are valid
      const maxIndex = quest.decryption_challenge.requiredSymbols.length - 1;
      quest.decryption_challenge.correctSequence.forEach(
        (index: number, pos: number) => {
          if (index < 0 || index > maxIndex) {
            throw new Error(
              `Validation Error: Day ${quest.dag} decryption challenge correctSequence[${pos}] = ${index} ` +
                `is out of bounds (max index is ${maxIndex})`,
            );
          }
        },
      );
    }
  });
}

/**
 * Validate quest collection integrity
 *
 * CHECKS:
 * 1. Exactly 24 quests exist (1 per day)
 * 2. Day numbers 1-24 all present (no gaps)
 * 3. No duplicate day numbers
 * 4. All codes are unique (case-insensitive)
 *
 * @param quests - Array of all quests to validate
 * @param weekCounts - Object with week1-4 lengths for error messages
 * @throws Error if collection validation fails
 */
export function validateQuestCollection(
  quests: Oppdrag[],
  weekCounts: { week1: number; week2: number; week3: number; week4: number },
): void {
  // Validate we have exactly 24 days
  if (quests.length !== 24) {
    throw new Error(
      `Validation Error: Expected 24 quests, found ${quests.length}. ` +
        `Week counts: W1=${weekCounts.week1}, W2=${weekCounts.week2}, W3=${weekCounts.week3}, W4=${weekCounts.week4}`,
    );
  }

  // Validate all day numbers 1-24 are present (no duplicates, no gaps)
  const dayNumbers = quests.map((o) => o.dag).sort((a, b) => a - b);
  for (let expectedDay = 1; expectedDay <= 24; expectedDay++) {
    if (!dayNumbers.includes(expectedDay)) {
      throw new Error(`Validation Error: Missing day ${expectedDay}`);
    }
  }

  // Check for duplicate day numbers
  const daySet = new Set(dayNumbers);
  if (daySet.size !== 24) {
    const duplicates = dayNumbers.filter(
      (day, index) => dayNumbers.indexOf(day) !== index,
    );
    throw new Error(
      `Validation Error: Duplicate day numbers found: ${duplicates.join(", ")}`,
    );
  }

  // Validate all codes are unique (case-insensitive)
  const codes = quests.map((o) => o.kode.toUpperCase());
  const codeSet = new Set(codes);
  if (codeSet.size !== quests.length) {
    const duplicateCodes: string[] = [];
    codes.forEach((code, index) => {
      if (codes.indexOf(code) !== index && !duplicateCodes.includes(code)) {
        duplicateCodes.push(code);
      }
    });
    throw new Error(
      `Validation Error: Duplicate codes found: ${duplicateCodes.join(", ")}. ` +
        `All 24 codes must be unique.`,
    );
  }
}

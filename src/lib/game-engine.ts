/**
 * NisseKomm Game Engine
 *
 * Centralized game state management and progression logic.
 * This module coordinates all game mechanics: quests, bonus quests, badges,
 * module unlocks, crisis management, and progression tracking.
 *
 * DESIGN PRINCIPLES:
 * 1. Single source of truth - All game state flows through this engine
 * 2. Data-driven - Configuration comes from JSON, not hardcoded values
 * 3. Event-based - Components subscribe to state changes
 * 4. Type-safe - Full TypeScript interfaces for all game state
 * 5. Testable - Pure functions for game logic, side effects isolated
 */

import { StorageManager } from "./storage";
import { BadgeManager } from "./badge-system";
import {
  getAllEventyr,
  getEventyr,
  getEventyrDays,
  getEventyrForDay,
  getEventyrProgress,
} from "./eventyr";
import {
  getCurrentDay,
  getCurrentMonth,
  getISOString,
  getCurrentDate,
} from "./date-utils";
import {
  Oppdrag,
  FilNode,
  SystemMetrikk,
  Varsel,
  DecryptionSymbol,
} from "@/types/innhold";

// Import all weekly quest JSON files
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";
import statiskInnhold from "@/data/statisk_innhold.json";

/**
 * ============================================================
 * DATA LOADING & VALIDATION (Build-time)
 * ============================================================
 */

// Type assertions for imported JSON
const week1 = uke1 as Oppdrag[];
const week2 = uke2 as Oppdrag[];
const week3 = uke3 as Oppdrag[];
const week4 = uke4 as Oppdrag[];

/**
 * Validates a single quest (oppdrag) has all required fields
 */
function validateOppdrag(oppdrag: Oppdrag, weekNumber: number): void {
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
 * Extract all file IDs from file tree recursively
 */
function extractFileIds(nodes: FilNode[]): string[] {
  const fileIds: string[] = [];

  function traverse(node: FilNode) {
    if (node.type === "fil") {
      fileIds.push(node.navn);
    }
    if (node.barn) {
      node.barn.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return fileIds;
}

/**
 * Validate file references in reveals
 */
function validateFileReferences(
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
 */
function validateTopicDependencies(quests: Oppdrag[]): void {
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
 * Validate that eventyr IDs in oppdrag reference valid eventyr in eventyr.json
 */
function validateEventyrReferences(quests: Oppdrag[]): void {
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
 * Validate eventyr phase sequences
 */
function validateEventyr(quests: Oppdrag[]): void {
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
 * Validate progressive hints have monotonically increasing attempt thresholds
 */
function validateProgressiveHints(quests: Oppdrag[]): void {
  quests.forEach((quest) => {
    if (quest.progressive_hints && quest.progressive_hints.length > 1) {
      for (let i = 1; i < quest.progressive_hints.length; i++) {
        const prev = quest.progressive_hints[i - 1].afterAttempts;
        const curr = quest.progressive_hints[i].afterAttempts;
        if (curr <= prev) {
          throw new Error(
            `Validation Error: Day ${quest.dag} progressive hints must have increasing afterAttempts. ` +
            `Hint ${i} has afterAttempts=${curr}, but previous hint has ${prev}`,
          );
        }
      }
    }
  });
}

/**
 * Validate symbol requirements reference existing symbol rewards
 */
function validateSymbolReferences(quests: Oppdrag[]): void {
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
 * Merges and validates all weekly quest files
 */
function mergeAndValidate(): Oppdrag[] {
  // Validate each week's quests
  week1.forEach((oppdrag) => validateOppdrag(oppdrag, 1));
  week2.forEach((oppdrag) => validateOppdrag(oppdrag, 2));
  week3.forEach((oppdrag) => validateOppdrag(oppdrag, 3));
  week4.forEach((oppdrag) => validateOppdrag(oppdrag, 4));

  // Merge all weeks
  const allOppdrag = [...week1, ...week2, ...week3, ...week4];

  // Validate we have exactly 24 days
  if (allOppdrag.length !== 24) {
    throw new Error(
      `Validation Error: Expected 24 quests, found ${allOppdrag.length}. ` +
      `Week counts: W1=${week1.length}, W2=${week2.length}, W3=${week3.length}, W4=${week4.length}`,
    );
  }

  // Validate all day numbers 1-24 are present (no duplicates, no gaps)
  const dayNumbers = allOppdrag.map((o) => o.dag).sort((a, b) => a - b);
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
  const codes = allOppdrag.map((o) => o.kode.toUpperCase());
  const codeSet = new Set(codes);
  if (codeSet.size !== allOppdrag.length) {
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

  // NEW: Multi-day narrative validation
  try {
    // Extract available file IDs from static content
    const fileTree = statiskInnhold.filer as FilNode[];
    const availableFiles = extractFileIds(fileTree);

    // Run comprehensive validation
    validateFileReferences(allOppdrag, availableFiles);
    validateTopicDependencies(allOppdrag);
    validateEventyrReferences(allOppdrag); // Validate eventyr IDs exist in eventyr.json
    validateEventyr(allOppdrag);
    validateProgressiveHints(allOppdrag);
    validateSymbolReferences(allOppdrag);
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof Error) {
      throw new Error(
        `Multi-day narrative validation failed: ${error.message}`,
      );
    }
    throw error;
  }

  // Sort by day number
  return allOppdrag.sort((a, b) => a.dag - b.dag);
}

// Build-time validation and internal storage
const ALL_QUESTS = mergeAndValidate();

/**
 * ============================================================
 * TYPE DEFINITIONS
 * ============================================================
 */

interface GameState {
  // Core progression
  completedQuests: Set<number>; // Day numbers of completed main quests
  submittedCodes: string[]; // All correct codes submitted

  // Bonus quest system
  completedBonusOppdrag: Set<number>; // Day numbers of completed bonus quests
  earnedBadges: Badge[];

  // Module unlocks
  unlockedModules: Set<string>;

  // Email tracking
  viewedMainEmails: Set<number>;
  viewedBonusOppdragEmails: Set<number>;

  // Crisis management
  resolvedCrises: {
    antenna: boolean;
    inventory: boolean;
  };

  // Cross-references (Phase 2 feature)
  unlockedTopics: Map<string, number>; // topic -> unlocked on day

  // Letters from Julius (Brevfugler)
  santaLetters: Array<{ day: number; content: string }>;

  // Eventyr tracking
  completedEventyr: Set<string>; // IDs of completed eventyr
}

interface Badge {
  day: number;
  icon: string;
  name: string;
  crisisType?: "antenna" | "inventory"; // Link to crisis if applicable
}

interface ModuleUnlock {
  moduleId: string;
  label: string;
  requiredCompletedQuests: number;
  icon: string;
}

interface QuestResult {
  success: boolean;
  isNewCompletion: boolean;
  earnedBadge?: Badge;
  message: string;
}

interface ContentUnlockResult {
  files: string[];
  symbols: Array<{ symbolId: string; symbolIcon: string; description: string }>;
  topics: string[];
}

interface DecryptionValidationResult {
  correct: boolean;
  message: string;
  correctCount: number;
}

/**
 * ============================================================
 * GAME CONFIGURATION (Data-Driven)
 * ============================================================
 */

/**
 * Module unlock configuration - DEPRECATED
 * Modules are now unlocked via quest.reveals.modules in JSON data
 * This is kept for reference only
 */
/*
const MODULE_UNLOCKS: ModuleUnlock[] = [
  {
    moduleId: "NISSEKRYPTO",
    label: "Nissekrypto",
    requiredCompletedQuests: 4,
    icon: "lock-closed",
  },
  {
    moduleId: "NISSEMUSIKK",
    label: "Nissemusikk",
    requiredCompletedQuests: 7,
    icon: "music",
  },
  {
    moduleId: "SNØFALL_TV",
    label: "Snøfall TV",
    requiredCompletedQuests: 10,
    icon: "image",
  },
  {
    moduleId: "BREVFUGLER",
    label: "Brevfugler",
    requiredCompletedQuests: 14,
    icon: "mail",
  },
  {
    moduleId: "NISSESTATS",
    label: "Nissestats",
    requiredCompletedQuests: 16,
    icon: "chart",
  },
];
*/

/**
 * ============================================================
 * GAME ENGINE CLASS
 * ============================================================
 */

export class GameEngine {
  /**
   * Load complete game state from storage
   */
  static loadGameState(): GameState {
    if (typeof window === "undefined") {
      return this.getEmptyState();
    }

    const submittedCodes = StorageManager.getSubmittedCodes();
    const allQuests = ALL_QUESTS;

    // Map codes to completed quest days
    const completedQuests = new Set<number>();
    submittedCodes.forEach((entry) => {
      const quest = allQuests.find(
        (q) => q.kode.toUpperCase() === entry.kode.toUpperCase(),
      );
      if (quest) {
        completedQuests.add(quest.dag);
      }
    });

    // Identify completed bonus quests
    const completedBonusOppdrag = new Set<number>();
    const storedBadges = StorageManager.getBonusOppdragBadges();
    const earnedBadges: Badge[] = storedBadges.map((b) => ({
      day: b.day,
      icon: b.icon,
      name: b.navn,
    }));

    allQuests.forEach((quest) => {
      if (quest.bonusoppdrag) {
        const isCompleted = this.isBonusOppdragCompleted(quest);
        if (isCompleted) {
          completedBonusOppdrag.add(quest.dag);
        }
      }
    });

    // Compute completed eventyr directly without circular call
    const eventyrPhases = new Map<string, Set<number>>();
    allQuests.forEach((quest) => {
      if (quest.eventyr && completedQuests.has(quest.dag)) {
        const { id, phase } = quest.eventyr;
        if (!eventyrPhases.has(id)) {
          eventyrPhases.set(id, new Set());
        }
        eventyrPhases.get(id)!.add(phase);
      }
    });

    const completedEventyrList: string[] = [];
    eventyrPhases.forEach((phases, eventyrId) => {
      const sortedPhases = Array.from(phases).sort((a, b) => a - b);
      const maxPhase = Math.max(...sortedPhases);
      const isComplete =
        sortedPhases.length === maxPhase &&
        sortedPhases.every((phase, idx) => phase === idx + 1);
      if (isComplete) {
        completedEventyrList.push(eventyrId);
      }
    });

    // Check for time-based module unlocks
    const currentDay = getCurrentDay();
    this.checkTimedModuleUnlocks(currentDay);

    return {
      completedQuests,
      submittedCodes: submittedCodes.map((c) => c.kode),
      completedBonusOppdrag,
      earnedBadges,
      unlockedModules: new Set(StorageManager.getUnlockedModules()),
      viewedMainEmails: StorageManager.getViewedEmails(),
      viewedBonusOppdragEmails: StorageManager.getViewedBonusOppdragEmails(),
      resolvedCrises: StorageManager.getCrisisStatus(),
      unlockedTopics: StorageManager.getUnlockedTopics(),
      santaLetters: StorageManager.getSantaLetters(),
      completedEventyr: new Set(completedEventyrList),
    };
  }

  /**
   * Get empty/initial game state
   */
  private static getEmptyState(): GameState {
    return {
      completedQuests: new Set(),
      submittedCodes: [],
      completedBonusOppdrag: new Set(),
      earnedBadges: [],
      unlockedModules: new Set(),
      viewedMainEmails: new Set(),
      viewedBonusOppdragEmails: new Set(),
      resolvedCrises: { antenna: false, inventory: false },
      unlockedTopics: new Map(),
      santaLetters: [],
      completedEventyr: new Set(),
    };
  }

  /**
   * ============================================================
   * QUEST COMPLETION
   * ============================================================
   */

  /**
   * Submit a code and update game state accordingly
   */
  static submitCode(
    code: string,
    expectedCode: string,
    day: number,
  ): QuestResult {
    const isCorrect = code.trim().toUpperCase() === expectedCode.toUpperCase();

    if (!isCorrect) {
      // Track failed attempt for progressive hints
      StorageManager.incrementFailedAttempts(day);
      return {
        success: false,
        isNewCompletion: false,
        message: "FEIL KODE - PRØV IGJEN",
      };
    }

    // Check if already completed
    const currentState = this.loadGameState();
    const isNewCompletion = !currentState.completedQuests.has(day);

    if (!isNewCompletion) {
      return {
        success: true,
        isNewCompletion: false,
        message: "KODEN ER ALLEREDE REGISTRERT",
      };
    }

    // Save code submission
    StorageManager.addSubmittedCode({
      kode: code.trim().toUpperCase(),
      dato: getISOString(),
    });

    // Reset failed attempts on success
    StorageManager.resetFailedAttempts(day);

    // Process content unlocks (files, symbols, topics, modules)
    this.processContentUnlocks(day);

    // Check and award badges for quest completion
    // This includes eventyr badges, decryption badges, and symbol collection badges
    BadgeManager.checkAndAwardAllEligibleBadges();

    // Special handling: Award trophy badge when Day 24 is completed
    if (day === 24) {
      BadgeManager.checkAndAwardBadge("julekalender-fullfort");
    }

    return {
      success: true,
      isNewCompletion: true,
      message: "KODE AKSEPTERT!",
    };
  }

  /**
   * Check if a quest day is completed
   */
  static isQuestCompleted(day: number): boolean {
    const state = this.loadGameState();
    return state.completedQuests.has(day);
  }

  /**
   * Get total number of completed quests
   */
  static getCompletedQuestCount(): number {
    const state = this.loadGameState();
    return state.completedQuests.size;
  }

  /**
   * Get all quest data (delegates to oppdrag loader)
   */
  static getAllQuests(): Oppdrag[] {
    return ALL_QUESTS;
  }

  /**
   * ============================================================
   * SIDE-QUEST SYSTEM
   * ============================================================
   */

  /**
   * Check if a bonus quest is completed
   */
  static isBonusOppdragCompleted(quest: Oppdrag): boolean {
    if (!quest.bonusoppdrag) return false;

    if (quest.bonusoppdrag.validering === "forelder") {
      // Parent-validated: check for badge
      return StorageManager.hasBonusOppdragBadge(quest.dag);
    } else if (quest.bonusoppdrag.kode) {
      // Code-validated: check for submitted code
      return StorageManager.isCodeSubmitted(quest.bonusoppdrag.kode);
    }

    return false;
  }

  /**
   * Check if a bonus quest is accessible (main quest must be completed)
   */
  static isBonusOppdragAccessible(day: number): boolean {
    return this.isQuestCompleted(day);
  }

  /**
   * ============================================================
   * MODULE UNLOCKS
   * ============================================================
   */

  /**
   * Check and unlock time-based modules
   * Modules unlock either when quest is completed OR the next day
   */
  private static checkTimedModuleUnlocks(currentDay: number): void {
    // Only apply timed unlocks if we're in December
    if (getCurrentMonth() !== 12) {
      return; // Not December, skip timed unlocks
    }

    ALL_QUESTS.forEach((quest) => {
      if (quest.reveals?.modules && quest.dag < currentDay) {
        // Auto-unlock if we're past the quest day (quest not completed in time)
        quest.reveals.modules.forEach((moduleId) => {
          if (!StorageManager.isModuleUnlocked(moduleId)) {
            StorageManager.unlockModule(moduleId);
          }
        });
      }
    });
  }

  /**
   * Check if a module is unlocked
   */
  static isModuleUnlocked(moduleId: string): boolean {
    return StorageManager.isModuleUnlocked(moduleId);
  }

  /**
   * Get all unlocked modules
   */
  static getUnlockedModules(): string[] {
    return StorageManager.getUnlockedModules();
  }

  /**
   * Get module unlock configuration (deprecated - now in quest data)
   */
  static getModuleUnlocks(): ModuleUnlock[] {
    return [];
  }

  /**
   * ============================================================
   * EMAIL TRACKING
   * ============================================================
   */

  /**
   * Mark an email as viewed
   */
  static markEmailAsViewed(day: number, isBonusOppdrag: boolean = false): void {
    if (isBonusOppdrag) {
      StorageManager.markBonusOppdragEmailAsViewed(day);
    } else {
      StorageManager.markEmailAsViewed(day);
    }
  }

  /**
   * Get unread email count for current day
   */
  static getUnreadEmailCount(currentDay: number): number {
    const allQuests = ALL_QUESTS;
    return StorageManager.getUnreadEmailCount(
      currentDay,
      allQuests.length,
      allQuests,
    );
  }

  /**
   * ============================================================
   * CRISIS MANAGEMENT
   * ============================================================
   */

  /**
   * Check if a crisis is resolved
   */
  static isCrisisResolved(crisisType: "antenna" | "inventory"): boolean {
    return StorageManager.isCrisisResolved(crisisType);
  }

  /**
   * Get crisis status for all crisis types
   */
  static getCrisisStatus(): { antenna: boolean; inventory: boolean } {
    return StorageManager.getCrisisStatus();
  }

  /**
   * ============================================================
   * NEW: CONTENT UNLOCK SYSTEM
   * ============================================================
   */

  /**
   * Process content unlocks when a quest is completed
   */
  static processContentUnlocks(day: number): void {
    const quest = ALL_QUESTS.find((q) => q.dag === day);
    if (!quest || !quest.reveals) return;

    // Unlock files
    if (quest.reveals.files) {
      quest.reveals.files.forEach((fileId) => {
        StorageManager.addUnlockedFile(fileId);
      });
    }

    // Unlock topics
    if (quest.reveals.topics) {
      quest.reveals.topics.forEach((topic) => {
        StorageManager.unlockTopic(topic, day);
      });
    }

    // Unlock modules
    if (quest.reveals.modules) {
      quest.reveals.modules.forEach((moduleId) => {
        StorageManager.unlockModule(moduleId);
      });
    }

    // NOTE: Symbols are NOT automatically awarded here!
    // Symbols must be physically found and collected via:
    // 1. QR code scanning (preferred)
    // 2. Manual parent addition (fallback)
    // See SymbolScanner component and nissemor-guide for collection methods
  }

  /**
   * Validate decryption sequence with partial feedback
   *
   * CHALLENGE PROGRESSION:
   * 1. "frosne-koder" (Day 12) - 3 hearts in correct order
   * 2. "stjernetegn" (Day 18) - 6 symbols (hearts + suns) in correct order
   * 3. "hjertets-hemmelighet" (Day 23) - All 9 symbols in correct order
   *
   * VALIDATION LOGIC:
   * - userSequence: Array of indices into challenge's requiredSymbols array
   * - Example: [1, 0, 2] means 2nd symbol, 1st symbol, 3rd symbol
   * - Returns count of correctly placed symbols (position matters!)
   *
   * SUCCESS BEHAVIOR:
   * - Marks challenge as solved in storage
   * - Unlocks secret files in NisseNet (if specified)
   * - Returns success message for UI display
   *
   * @param challengeId - Unique challenge identifier (e.g., "frosne-koder")
   * @param userSequence - Array of symbol indices representing user's arrangement
   * @returns Validation result with correctness, message, and correct count
   * @public Called by NisseKrypto component on solution submission
   */
  static validateDecryptionSequence(
    challengeId: string,
    userSequence: number[],
  ): DecryptionValidationResult {
    // Find the quest with this decryption challenge
    const quest = ALL_QUESTS.find(
      (q) => q.decryption_challenge?.challengeId === challengeId,
    );

    if (!quest?.decryption_challenge) {
      return {
        correct: false,
        message: "Ukjent dekrypteringsutfordring",
        correctCount: 0,
      };
    }

    const challenge = quest.decryption_challenge;

    // Check if already solved
    if (StorageManager.isDecryptionSolved(challengeId)) {
      return {
        correct: true,
        message: "Allerede løst!",
        correctCount: challenge.correctSequence.length,
      };
    }

    // Validate sequence length
    if (userSequence.length !== challenge.correctSequence.length) {
      StorageManager.incrementDecryptionAttempts(challengeId);
      return {
        correct: false,
        message: "Feil antall symboler",
        correctCount: 0,
      };
    }

    // Count correct positions
    let correctCount = 0;
    for (let i = 0; i < userSequence.length; i++) {
      if (userSequence[i] === challenge.correctSequence[i]) {
        correctCount++;
      }
    }

    const isCorrect = correctCount === challenge.correctSequence.length;

    if (isCorrect) {
      // Mark as solved and unlock files
      StorageManager.addSolvedDecryption(challengeId);
      if (challenge.unlocksFiles) {
        challenge.unlocksFiles.forEach((fileId) => {
          StorageManager.addUnlockedFile(fileId);
        });
      }
      return {
        correct: true,
        message: challenge.messageWhenSolved,
        correctCount,
      };
    } else {
      // Partial feedback
      StorageManager.incrementDecryptionAttempts(challengeId);
      return {
        correct: false,
        message: `${correctCount} av ${challenge.correctSequence.length} symboler korrekt plassert!`,
        correctCount,
      };
    }
  }

  /**
   * Get completed eventyr
   * Returns array of unique eventyr IDs that have all phases completed
   */
  static getCompletedEventyr(): string[] {
    const gameState = this.loadGameState();
    const eventyrPhases = new Map<string, Set<number>>();

    // Collect all eventyr phases from completed quests
    ALL_QUESTS.forEach((quest: Oppdrag) => {
      if (quest.eventyr && gameState.completedQuests.has(quest.dag)) {
        const { id, phase } = quest.eventyr;
        if (!eventyrPhases.has(id)) {
          eventyrPhases.set(id, new Set());
        }
        eventyrPhases.get(id)!.add(phase);
      }
    });

    // Determine which eventyr are complete (all phases 1-N present)
    const completedEventyrList: string[] = [];
    eventyrPhases.forEach((phases, eventyrId) => {
      const sortedPhases = Array.from(phases).sort((a, b) => a - b);
      const maxPhase = Math.max(...sortedPhases);
      const isComplete =
        sortedPhases.length === maxPhase &&
        sortedPhases.every((phase, idx) => phase === idx + 1);
      if (isComplete) {
        completedEventyrList.push(eventyrId);
      }
    });

    return completedEventyrList;
  }

  /**
   * Get total number of eventyr in the game
   */
  static getTotalEventyr(): number {
    const eventyrIds = new Set<string>();
    ALL_QUESTS.forEach((quest: Oppdrag) => {
      if (quest.eventyr) {
        eventyrIds.add(quest.eventyr.id);
      }
    });
    return eventyrIds.size;
  }

  /**
   * Get all collected symbols from storage
   *
   * @returns Array of DecryptionSymbol objects that have been scanned/collected
   * @public Used by NisseKrypto and SymbolScanner components
   * @see StorageManager.getCollectedSymbols() - Persistence layer
   */
  static getCollectedSymbols() {
    return StorageManager.getCollectedSymbols();
  }

  /**
   * Get all 9 symbol definitions (complete symbol library)
   *
   * SYMBOL TAXONOMY:
   * - 3 Hearts (green, red, blue) - Represents love, connection, warmth
   * - 3 Suns (green, red, blue) - Represents hope, light, energy
   * - 3 Moons (green, red, blue) - Represents calm, mystery, night
   *
   * USAGE:
   * - Used by /nissemor-guide/symboler page to generate QR code printouts
   * - Each symbol has unique ID (e.g., "heart-green") used as QR code data
   * - Icons from pixelarticons library: heart, sun, moon
   *
   * @returns Array of all 9 DecryptionSymbol objects with metadata
   * @public Used by parent guide for printing symbol cards
   */
  public static getAllSymbols(): DecryptionSymbol[] {
    return [
      // Hearts (green, red, blue)
      {
        symbolId: "heart-green",
        symbolIcon: "heart",
        symbolColor: "green",
        description: "Grønt hjerte",
      },
      {
        symbolId: "heart-red",
        symbolIcon: "heart",
        symbolColor: "red",
        description: "Rødt hjerte",
      },
      {
        symbolId: "heart-blue",
        symbolIcon: "heart",
        symbolColor: "blue",
        description: "Blått hjerte",
      },
      // Suns (green, red, blue)
      {
        symbolId: "sun-green",
        symbolIcon: "sun",
        symbolColor: "green",
        description: "Grønn sol",
      },
      {
        symbolId: "sun-red",
        symbolIcon: "sun",
        symbolColor: "red",
        description: "Rød sol",
      },
      {
        symbolId: "sun-blue",
        symbolIcon: "sun",
        symbolColor: "blue",
        description: "Blå sol",
      },
      // Moons (green, red, blue)
      {
        symbolId: "moon-green",
        symbolIcon: "moon",
        symbolColor: "green",
        description: "Grønn måne",
      },
      {
        symbolId: "moon-red",
        symbolIcon: "moon",
        symbolColor: "red",
        description: "Rød måne",
      },
      {
        symbolId: "moon-blue",
        symbolIcon: "moon",
        symbolColor: "blue",
        description: "Blå måne",
      },
    ];
  }

  /**
   * Collect a symbol by its code (from QR scan or manual entry)
   *
   * VALIDATION FLOW:
   * 1. Check if code matches any quest's symbol_clue.symbolId
   * 2. Verify symbol hasn't already been collected (no duplicates)
   * 3. Add to persistent storage if valid and new
   *
   * VALID CODES (9 total):
   * - heart-green, heart-red, heart-blue
   * - sun-green, sun-red, sun-blue
   * - moon-green, moon-red, moon-blue
   *
   * @param code - Symbol identifier from QR code or manual input
   * @returns Object with success status, message, and symbol data if found
   * @public Called by SymbolScanner component
   * @see SymbolScanner.processCode() - UI integration point
   */
  static collectSymbolByCode(code: string): {
    success: boolean;
    message: string;
    symbol?: DecryptionSymbol;
  } {
    // Find quest with this symbol code
    const quest = ALL_QUESTS.find(
      (q) => q.symbol_clue && q.symbol_clue.symbolId === code,
    );

    if (!quest?.symbol_clue) {
      return {
        success: false,
        message: "Ugyldig symbolkode. Prøv igjen!",
      };
    }

    // Check if already collected
    if (StorageManager.hasSymbol(code)) {
      return {
        success: false,
        message: "Du har allerede samlet dette symbolet!",
        symbol: quest.symbol_clue,
      };
    }

    // Add to collection
    StorageManager.addCollectedSymbol(quest.symbol_clue);

    return {
      success: true,
      message: `✓ Symbol funnet!\n\n${quest.symbol_clue.description}`,
      symbol: quest.symbol_clue,
    };
  }

  /**
   * Get newly unlocked content for a completed quest
   */
  static getNewlyUnlockedContent(day: number): ContentUnlockResult {
    const quest = ALL_QUESTS.find((q) => q.dag === day);
    if (!quest || !quest.reveals) {
      return { files: [], symbols: [], topics: [] };
    }

    return {
      files: quest.reveals.files || [],
      symbols: quest.symbol_clue ? [quest.symbol_clue] : [],
      topics: quest.reveals.topics || [],
    };
  }

  /**
   * Check if a file is unlocked (accessible in NisseNet)
   */
  static isFileUnlocked(fileId: string, currentDay: number): boolean {
    // Check if file was explicitly unlocked via reveals
    if (StorageManager.isFileUnlocked(fileId)) {
      return true;
    }

    // Check file's unlock conditions from static content
    const fileNode = this.findFileNode(
      fileId,
      statiskInnhold.filer as FilNode[],
    );
    if (!fileNode || !fileNode.unlockConditions) {
      return true; // No conditions = always accessible
    }

    const conditions = fileNode.unlockConditions;

    // Check day requirement
    if (conditions.afterDay && currentDay < conditions.afterDay) {
      return false;
    }

    // Check topic requirements
    if (conditions.requiresTopics) {
      const unlockedTopics = StorageManager.getUnlockedTopics();
      const hasAllTopics = conditions.requiresTopics.every((topic) =>
        unlockedTopics.has(topic),
      );
      if (!hasAllTopics) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper: Find file node by ID in file tree
   */
  private static findFileNode(
    fileId: string,
    nodes: FilNode[],
  ): FilNode | null {
    for (const node of nodes) {
      if (node.type === "fil" && node.navn === fileId) {
        return node;
      }
      if (node.barn) {
        const found = this.findFileNode(fileId, node.barn);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Check if a mission is accessible (requirements met)
   */
  static isMissionAccessible(day: number): boolean {
    const quest = ALL_QUESTS.find((q) => q.dag === day);
    if (!quest || !quest.requires) return true;

    const requirements = quest.requires;

    // Check completed day requirements
    if (requirements.completedDays) {
      const completedQuests = this.loadGameState().completedQuests;
      const hasAllDays = requirements.completedDays.every((d) =>
        completedQuests.has(d),
      );
      if (!hasAllDays) return false;
    }

    // Check topic requirements
    if (requirements.topics) {
      const unlockedTopics = StorageManager.getUnlockedTopics();
      const hasAllTopics = requirements.topics.every((topic) =>
        unlockedTopics.has(topic),
      );
      if (!hasAllTopics) return false;
    }

    return true;
  }

  /**
   * Get unread file count for NisseNet badge
   */
  static getUnreadFileCount(): number {
    const lastVisit = StorageManager.getNisseNetLastVisit();
    const completedQuests = this.loadGameState().completedQuests;

    // Count files unlocked since last visit
    let unreadCount = 0;
    ALL_QUESTS.forEach((quest) => {
      if (
        completedQuests.has(quest.dag) &&
        quest.dag > lastVisit &&
        quest.reveals?.files
      ) {
        unreadCount += quest.reveals.files.length;
      }
    });

    return unreadCount;
  }

  /**
   * ============================================================
   * PROGRESSION QUERIES
   * ============================================================
   */

  /**
   * Check if game is complete (all 24 quests done)
   */
  static isGameComplete(): boolean {
    return this.getCompletedQuestCount() === 24;
  }

  /**
   * Get progression percentage (0-100)
   */
  static getProgressionPercentage(): number {
    const completed = this.getCompletedQuestCount();
    return Math.round((completed / 24) * 100);
  }

  /**
   * Check if all decryption challenges are solved
   */
  static isAllDecryptionsSolved(): boolean {
    const solvedDecryptions = StorageManager.getSolvedDecryptions();
    return (
      solvedDecryptions.includes("frosne-koder") &&
      solvedDecryptions.includes("stjernetegn") &&
      solvedDecryptions.includes("hjertets-hemmelighet")
    );
  }

  /**
   * Get decryption challenge progress
   */
  static getDecryptionProgress(): {
    solved: number;
    total: number;
    allSolved: boolean;
  } {
    const solvedDecryptions = StorageManager.getSolvedDecryptions();
    return {
      solved: solvedDecryptions.length,
      total: 3,
      allSolved: this.isAllDecryptionsSolved(),
    };
  }

  /**
   * Check if all symbols are collected (9 total)
   */
  static isAllSymbolsCollected(): boolean {
    const collectedSymbols = StorageManager.getCollectedSymbols();
    return collectedSymbols.length >= 9;
  }

  /**
   * Get detailed progression summary
   */
  static getProgressionSummary() {
    const state = this.loadGameState();
    const allQuests = ALL_QUESTS;

    const bonusOppdragAvailable = allQuests.filter(
      (q) => q.bonusoppdrag,
    ).length;
    const bonusOppdragCompleted = state.completedBonusOppdrag.size;

    // Get badge counts from BadgeManager (centralized badge system)
    const allBadges = BadgeManager.getAllBadges();
    const earnedBadges = BadgeManager.getEarnedBadges();

    return {
      mainQuests: {
        completed: state.completedQuests.size,
        total: 24,
        percentage: this.getProgressionPercentage(),
      },
      bonusOppdrag: {
        completed: bonusOppdragCompleted,
        available: bonusOppdragAvailable,
        percentage: Math.round(
          (bonusOppdragCompleted / bonusOppdragAvailable) * 100,
        ),
      },
      badges: {
        earned: earnedBadges.length,
        total: allBadges.length,
      },
      modules: {
        unlocked: state.unlockedModules.size,
        total: 5, // NISSEKRYPTO, NISSEMUSIKK, SNØFALL_TV, BREVFUGLER, NISSESTATS
      },
      isComplete: this.isGameComplete(),
    };
  }

  /**
   * ============================================================
   * DATA MANAGEMENT
   * ============================================================
   */

  /**
   * Export complete game state as JSON
   */
  static exportGameState(): string {
    return StorageManager.exportData();
  }

  /**
   * Import game state from JSON
   */
  static importGameState(jsonData: string): boolean {
    return StorageManager.importData(jsonData);
  }

  /**
   * Reset all game progress
   */
  static resetGame(): void {
    if (typeof window === "undefined") return;
    if (confirm("Er du sikker på at du vil slette all progresjon?")) {
      StorageManager.clearAll();
      window.location.reload();
    }
  }

  /**
   * ============================================================
   * PROGRESSIVE SYSTEM METRICS
   * ============================================================
   */

  /**
   * Calculate progressive metric value using sigmoid curve
   *
   * Formula: min + (max - min) / (1 + e^(-k * (day - midpoint)))
   *
   * @param min - Minimum value at Day 1
   * @param max - Maximum value at Day 24
   * @param day - Current day (1-24)
   * @param k - Steepness parameter (default 0.4)
   * @param midpoint - Inflection point (default 12)
   */
  private static calculateSigmoidValue(
    min: number,
    max: number,
    day: number,
    k: number = 0.4,
    midpoint: number = 12,
  ): number {
    const sigmoid = 1 / (1 + Math.exp(-k * (day - midpoint)));
    const value = min + (max - min) * sigmoid;
    return Math.round(value);
  }

  /**
   * Determine metric status based on value and thresholds
   */
  private static getMetricStatus(
    value: number,
    max: number,
  ): "normal" | "advarsel" | "kritisk" {
    const percentage = (value / max) * 100;
    if (percentage < 50) return "kritisk";
    if (percentage < 75) return "advarsel";
    return "normal";
  }

  /**
   * Get progressive system metrics for current day
   *
   * BEHAVIOR:
   * - Filters metrics by unlock_day (progressive reveals)
   * - Calculates sigmoid progression values
   * - Applies crisis penalties from unresolved bonusoppdrag
   * - Merges quest-specific overrides (highest priority)
   *
   * @param day - Current day (1-24)
   * @returns Array of SystemMetrikk with computed values
   */
  static getProgressiveMetrics(day: number): SystemMetrikk[] {
    const baseMetrics = statiskInnhold.systemMetrikker as Array<{
      navn: string;
      min: number;
      maks: number;
      unlock_day: number;
      status: "normal" | "advarsel" | "kritisk";
    }>;

    const progressionConfig = (
      statiskInnhold as unknown as {
        progression_config: {
          sigmoid: { k: number; midpoint: number };
          crisis_events: Array<{
            day: number;
            affected_metric: string;
            crisis_value: number;
            status: "normal" | "advarsel" | "kritisk";
          }>;
        };
      }
    ).progression_config;
    const { k, midpoint } = progressionConfig.sigmoid;
    const crisisEvents = progressionConfig.crisis_events as Array<{
      day: number;
      affected_metric: string;
      crisis_value: number;
      status: "normal" | "advarsel" | "kritisk";
    }>;

    // Filter metrics by unlock_day
    const unlockedMetrics = baseMetrics.filter((m) => m.unlock_day <= day);

    // Calculate progressive values
    const progressiveMetrics: SystemMetrikk[] = unlockedMetrics.map(
      (metric) => {
        // Calculate sigmoid value
        let value = this.calculateSigmoidValue(
          metric.min,
          metric.maks,
          day,
          k,
          midpoint,
        );

        // Apply crisis penalties if unresolved
        const crisis = crisisEvents.find(
          (c) => c.affected_metric === metric.navn && c.day <= day,
        );

        if (crisis) {
          // Check if crisis is resolved
          const crisisResolved =
            (crisis.affected_metric === "NISSEKRAFT" &&
              this.isCrisisResolved("antenna")) ||
            (crisis.affected_metric === "BREVFUGL-SVERM" &&
              this.isCrisisResolved("inventory"));

          if (!crisisResolved) {
            // Freeze metric at crisis value
            value = crisis.crisis_value;
          }
        }

        // Determine status
        let status = this.getMetricStatus(value, metric.maks);

        // Apply crisis status if active
        if (crisis && crisis.status) {
          const crisisResolved =
            (crisis.affected_metric === "NISSEKRAFT" &&
              this.isCrisisResolved("antenna")) ||
            (crisis.affected_metric === "BREVFUGL-SVERM" &&
              this.isCrisisResolved("inventory"));

          if (!crisisResolved) {
            status = crisis.status;
          }
        }

        return {
          navn: metric.navn,
          verdi: value,
          maks: metric.maks,
          status,
        };
      },
    );

    return progressiveMetrics;
  }

  /**
   * Get current system metrics (wrapper for getProgressiveMetrics)
   * Used by SystemStatus component
   */
  static getCurrentSystemMetrics(): SystemMetrikk[] {
    const currentDay = getCurrentDay();
    return this.getProgressiveMetrics(currentDay);
  }

  /**
   * Get eventyr-driven story metrics
   * Returns themed metrics that appear only after first_unlock_day
   *
   * STORY METRICS:
   * - "Mørkets Trussel: Skygge-nivå" (Day 7+) - Darkness intensity 0-100
   * - "IQs Oppfinnelser: Suksessrate" (Day 2+) - Invention success 0-100
   * - "Brevfugl-Mysteriet: Koordinering" (Day 1+) - Letter organization 0-100
   * - "Frosne Mønster: Krystallisering" (Day 3+) - Snowflake pattern clarity 0-100
   *
   * @param day - Current day (1-24)
   * @param completedDays - Set of completed quest days
   * @returns Array of eventyr-specific metrics
   */
  static getEventyrMetrikker(
    day: number,
    completedDays: Set<number>,
  ): SystemMetrikk[] {
    const metrics: SystemMetrikk[] = [];
    const allEventyr = getAllEventyr();

    // Get major eventyr only (exclude mini-eventyr like countdown, juletradisjon)
    const majorEventyr = allEventyr.filter((e) => {
      const days = getEventyrDays(e.id);
      return days.length >= 3; // Major eventyr have 3+ days
    });

    majorEventyr.forEach((eventyr) => {
      // Only show metric if we've reached first unlock day
      if (day < eventyr.første_opplåsingsdag) return;

      const progress = getEventyrProgress(eventyr.id, completedDays);
      let status: "normal" | "advarsel" | "kritisk" = "normal";

      // Determine status based on progress
      if (progress < 30) {
        status = "kritisk";
      } else if (progress < 60) {
        status = "advarsel";
      }

      // Create themed metric name
      let themeLabel = "";
      switch (eventyr.id) {
        case "morkets-trussel":
          themeLabel = "Skygge-nivå";
          // Invert for Mørket (lower is better)
          status =
            progress > 70 ? "normal" : progress > 40 ? "advarsel" : "kritisk";
          break;
        case "iqs-oppfinnelser":
          themeLabel = "Suksessrate";
          break;
        case "brevfugl-mysteriet":
          themeLabel = "Koordinering";
          break;
        case "frosne-monster":
          themeLabel = "Krystallisering";
          break;
        case "farge-mysteriet":
          themeLabel = "Fargeklarhet";
          break;
        default:
          themeLabel = "Fremdrift";
      }

      metrics.push({
        navn: `${eventyr.navn}: ${themeLabel}`,
        verdi: progress,
        maks: 100,
        status,
      });
    });

    return metrics;
  }

  /**
   * ============================================================
   * DYNAMIC ALERTS
   * ============================================================
   */

  /**
   * Generate timestamp for alert (HH:MM format)
   */
  private static generateAlertTimestamp(): string {
    const now = getCurrentDate();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Get eventyr milestone celebration alerts
   * Generates alerts when specific eventyr phases complete
   *
   * @param day - Current day (1-24)
   * @param completedDays - Set of completed quest days
   * @returns Array of eventyr milestone alerts
   */
  private static getEventyrMilepælVarsler(
    day: number,
    completedDays: Set<number>,
  ): Varsel[] {
    const milepælVarsler: Varsel[] = [];

    // Brevfugl-Mysteriet milestones
    if (day >= 5 && completedDays.has(5)) {
      milepælVarsler.push({
        tekst: "📬 WINTER: 847 brevfugler sortert! Organisasjon perfekt!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 5,
      });
    }

    if (day >= 12 && completedDays.has(12)) {
      milepælVarsler.push({
        tekst: "🎵 PIL: Sang-systemet aktivert! Brevfugler synger!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 12,
      });
    }

    if (day >= 14 && completedDays.has(14)) {
      milepælVarsler.push({
        tekst: "🦅 JULIUS: PAPIR-kode funnet! Brevfugl-mysteriet løst!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 14,
      });
    }

    // IQs Oppfinnelser milestones
    if (day >= 8 && completedDays.has(8)) {
      milepælVarsler.push({
        tekst:
          "🎒 IQ: Magisk sekk test vellyket! (Den passet ikke gjennom døra...)",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 8,
      });
    }

    if (day >= 19 && completedDays.has(19)) {
      milepælVarsler.push({
        tekst: "⚡ IQ: Reinsdyr-energidrikk fungerer! Rudolf løper i cirkler!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 19,
      });
    }

    // Mørkets Trussel milestones
    if (day >= 7 && completedDays.has(7)) {
      milepælVarsler.push({
        tekst: "🌑 ORAKELET: Mørket lurer der ute... Hold øye med Julestjerna!",
        type: "advarsel",
        tidspunkt: this.generateAlertTimestamp(),
        day: 7,
      });
    }

    if (day >= 21 && completedDays.has(21)) {
      milepælVarsler.push({
        tekst: "🦌 RUDOLF: Nesen min lyser igjen! Mørket spredd!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 21,
      });
    }

    // Frosne Mønster milestones
    if (day >= 9 && completedDays.has(9)) {
      milepælVarsler.push({
        tekst: "❄️ JULIUS: Fant 18 snøfnugg-hjørner! Mønstrene er vakre!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 9,
      });
    }

    if (day >= 13 && completedDays.has(13)) {
      milepælVarsler.push({
        tekst: "🕯️ LUCIA: Lysseremoni fullført! Sn</pelet stråler!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 13,
      });
    }

    // Farge-Mysteriet milestones
    if (day >= 10 && completedDays.has(10)) {
      milepælVarsler.push({
        tekst: "🌱 PIL: GRØNN dag! Miljøvennlig juleproduksjon!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 10,
      });
    }

    if (day >= 15 && completedDays.has(15)) {
      milepælVarsler.push({
        tekst: "🍫 WINTER: Sjokolademysteriet løst! Mandelen funnet!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 15,
      });
    }

    // Slede-Forberedelser milestones
    if (day >= 18 && completedDays.has(18)) {
      milepælVarsler.push({
        tekst: "🛷 JULIUS: Slede-dimensjoner sjekket! Alt målt og klart!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 18,
      });
    }

    if (day >= 20 && completedDays.has(20)) {
      milepælVarsler.push({
        tekst: "✨ NISSENE: Sleda er klar! Magiske egenskaper aktivert!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 20,
      });
    }

    return milepælVarsler;
  }

  /**
   * Get daily narrative alerts for current day
   *
   * BEHAVIOR:
   * - Selects daily_alerts[day-1] as primary alert
   * - Adds active crisis alerts at top (kritisk priority)
   * - Injects milestone celebrations (Day 8, 16, 22)
   * - Merges recent quest alert_overrides (last 3 days)
   * - Returns max 8 alerts, newest first
   *
   * @param day - Current day (1-24)
   * @param completedDays - Set of completed day numbers
   * @returns Array of Varsel objects for display
   */
  static getDailyAlerts(day: number, completedDays: Set<number>): Varsel[] {
    const alerts: Varsel[] = [];
    const dailyAlerts = (
      statiskInnhold as unknown as {
        daily_alerts: Array<{
          day: number;
          tekst: string;
          type: "info" | "advarsel" | "kritisk";
        }>;
      }
    ).daily_alerts;

    // 1. Add crisis alerts if active (highest priority)
    if (day >= 11 && !this.isCrisisResolved("antenna")) {
      alerts.push({
        tekst: "⏰ KRITISK: TIDSANOMALIER - ANTENNE-SYSTEM NEDE!",
        type: "kritisk",
        tidspunkt: this.generateAlertTimestamp(),
        day: 11,
      });
    }

    if (day >= 16 && !this.isCrisisResolved("inventory")) {
      alerts.push({
        tekst: "🔧 KRITISK: INVENTAR-SYSTEM KRASJET - TRENGER HJELP!",
        type: "kritisk",
        tidspunkt: this.generateAlertTimestamp(),
        day: 16,
      });
    }

    // 2. Add eventyr milestone celebration alerts (after crisis, before daily)
    const eventyrVarsler = this.getEventyrMilepælVarsler(day, completedDays);
    alerts.push(...eventyrVarsler);

    // 3. Add ALL daily alerts from day 1 up to current day (historical feed)
    dailyAlerts
      .filter((a) => a.day <= day)
      .forEach((dailyAlert) => {
        alerts.push({
          tekst: dailyAlert.tekst,
          type: dailyAlert.type,
          tidspunkt: this.generateAlertTimestamp(),
          day: dailyAlert.day,
        });
      });

    // 4. Add milestone celebration alerts for completed days
    if (day >= 8 && completedDays.has(8)) {
      alerts.push({
        tekst: "🎉 NISSENE: Første uke fullført! Kaken var for stor...",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 8,
      });
    }

    if (day >= 16 && completedDays.has(16)) {
      alerts.push({
        tekst: "🎂 WINTER: Halvveis! Gaveproduksjon på topp!",
        type: "info",
        tidspunkt: this.generateAlertTimestamp(),
        day: 16,
      });
    }

    if (day >= 22 && completedDays.has(22)) {
      alerts.push({
        tekst: "⏰ ORAKELET: To dager! Magien intensiveres!",
        type: "advarsel",
        tidspunkt: this.generateAlertTimestamp(),
        day: 22,
      });
    }

    // 5. Sort by priority (kritisk > advarsel > info) and day (newest first)
    const priorityOrder = { kritisk: 0, advarsel: 1, info: 2 };
    alerts.sort((a, b) => {
      const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.day || 0) - (a.day || 0);
    });

    // 6. Return max 8 alerts
    return alerts.slice(0, 8);
  }

  /**
   * ============================================================
   * EVENTYR (Story Arc) HELPERS
   * ============================================================
   */

  /**
   * Get a specific eventyr by ID
   */
  static getEventyr = getEventyr;

  /**
   * Get days assigned to an eventyr
   */
  static getEventyrDays = getEventyrDays;

  /**
   * Get eventyr for a specific day
   */
  static getEventyrForDay = getEventyrForDay;

  /**
   * Get Brevfugl-Mysteriet progression summary for Brevfugler module
   * Returns completion status for all 4 phases + paper bird count
   *
   * PHASES:
   * - Phase 1 (Day 1): Brevfugler introduced
   * - Phase 2 (Day 5): Winter organizes 847 letters
   * - Phase 3 (Day 12): Sang-system connects worlds
   * - Phase 4 (Day 14): PAPIR puzzle completes → BREVFUGLER module unlocks
   *
   * @returns Object with phase completion booleans and paper bird counter
   */
  static getBrevfuglerFremdrift(): {
    fase1Fullført: boolean;
    fase2Fullført: boolean;
    fase3Fullført: boolean;
    fase4Fullført: boolean;
    antallPapirbrev: number;
  } {
    const completedQuests = this.loadGameState().completedQuests;

    return {
      fase1Fullført: completedQuests.has(1),
      fase2Fullført: completedQuests.has(5),
      fase3Fullført: completedQuests.has(12),
      fase4Fullført: completedQuests.has(14),
      antallPapirbrev: this.getMetricValue("BREVFUGL-SVERM"),
    };
  }

  /**
   * Helper: Get current value of a specific metric by name
   */
  private static getMetricValue(metricName: string): number {
    const metrics = this.getCurrentSystemMetrics();
    const metric = metrics.find((m) => m.navn === metricName);
    return metric?.verdi || 0;
  }

  /**
   * Get eventyr-reactive music playlist
   * Returns tracks with locked/unlocked status based on story progression
   *
   * UNLOCK PROGRESSION:
   * - Day 1: "Velkommen til Snøfall" (intro)
   * - Day 7: "Nissenes Marsj" (unlocked with NISSEMUSIKK module)
   * - Day 12: "Sang til Brevfuglene" (Brevfugl-Mysteriet Phase 3)
   * - Day 14: "Brevfugl-vals" (Brevfugl-Mysteriet complete)
   * - Day 19: "IQs Oppfinnerpolka" (IQs Oppfinnelser Phase 3)
   * - Day 21: "Rudolfs Triumf" (Mørkets Trussel resolved)
   * - Day 24: "Julaften i Snøfall" (finale)
   *
   * @returns Array of music tracks with lock status
   */
  static getEventyrMusikkSpor(): Array<{
    id: number;
    tittel: string;
    varighet: string;
    låst: boolean;
    opplåsingsDag: number;
    eventyrNavn: string;
  }> {
    const completedQuests = this.loadGameState().completedQuests;

    return [
      {
        id: 1,
        tittel: "Velkommen til Snøfall (8-bit)",
        varighet: "2:30",
        låst: false,
        opplåsingsDag: 1,
        eventyrNavn: "Intro",
      },
      {
        id: 2,
        tittel: "Nissenes Marsj (Chiptune)",
        varighet: "2:45",
        låst: !completedQuests.has(7),
        opplåsingsDag: 7,
        eventyrNavn: "Generell",
      },
      {
        id: 3,
        tittel: "Deilig er Jorden (8-bit)",
        varighet: "2:45",
        låst: !completedQuests.has(7),
        opplåsingsDag: 7,
        eventyrNavn: "Generell",
      },
      {
        id: 4,
        tittel: "Sang til Brevfuglene (Synth)",
        varighet: "3:15",
        låst: !completedQuests.has(12),
        opplåsingsDag: 12,
        eventyrNavn: "Brevfugl-Mysteriet",
      },
      {
        id: 5,
        tittel: "Brevfugl-vals (Oscillator)",
        varighet: "2:50",
        låst: !completedQuests.has(14),
        opplåsingsDag: 14,
        eventyrNavn: "Brevfugl-Mysteriet",
      },
      {
        id: 6,
        tittel: "Rudolf med Rød Nese (8-bit)",
        varighet: "2:58",
        låst: !completedQuests.has(7),
        opplåsingsDag: 7,
        eventyrNavn: "Generell",
      },
      {
        id: 7,
        tittel: "IQs Oppfinnerpolka (Retro)",
        varighet: "3:05",
        låst: !completedQuests.has(19),
        opplåsingsDag: 19,
        eventyrNavn: "IQs Oppfinnelser",
      },
      {
        id: 8,
        tittel: "Snøfnugg-symfoni (Ambient)",
        varighet: "3:20",
        låst: !completedQuests.has(13),
        opplåsingsDag: 13,
        eventyrNavn: "Frosne Mønster",
      },
      {
        id: 9,
        tittel: "Mørkets Melodi (Dramatisk)",
        varighet: "2:40",
        låst: !completedQuests.has(17),
        opplåsingsDag: 17,
        eventyrNavn: "Mørkets Trussel",
      },
      {
        id: 10,
        tittel: "Rudolfs Triumf (Heroisk)",
        varighet: "3:30",
        låst: !completedQuests.has(21),
        opplåsingsDag: 21,
        eventyrNavn: "Mørkets Trussel",
      },
      {
        id: 11,
        tittel: "Bjelleklang (Oscillator Ver.)",
        varighet: "2:15",
        låst: !completedQuests.has(7),
        opplåsingsDag: 7,
        eventyrNavn: "Generell",
      },
      {
        id: 12,
        tittel: "Glade Jul (Synth Wave)",
        varighet: "3:05",
        låst: !completedQuests.has(7),
        opplåsingsDag: 7,
        eventyrNavn: "Generell",
      },
      {
        id: 13,
        tittel: "Julaften i Snøfall (Finale)",
        varighet: "4:00",
        låst: !completedQuests.has(24),
        opplåsingsDag: 24,
        eventyrNavn: "Grand Finale",
      },
    ];
  }

  /**
   * ============================================================
   * CHRISTMAS COUNTDOWN & GLOBAL PRODUCTION METRICS
   * ============================================================
   */

  /**
   * Get real-time countdown to Christmas Eve (December 24)
   *
   * URGENCY LEVELS:
   * - calm: >14 days remaining (green, steady pulse)
   * - approaching: 8-14 days (blue, moderate pulse)
   * - urgent: 4-7 days (gold, fast pulse)
   * - critical: 1-3 days (red shake, larger text)
   * - today: 0 days (gold flash, "GOD JUL!")
   *
   * @returns Countdown object with time components and urgency level
   */
  static getChristmasCountdown(): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isChristmas: boolean;
    urgencyLevel: "calm" | "approaching" | "urgent" | "critical" | "today";
  } {
    const now = getCurrentDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Calculate target Christmas Eve (year comes from mocked getCurrentDate())
    let christmasYear = currentYear;
    if (currentMonth === 12 && now.getDate() > 24) {
      christmasYear = currentYear + 1;
    }
    const christmasEve = new Date(christmasYear, 11, 24, 23, 59, 59); // Dec 24, 23:59:59

    // Calculate time difference
    const diff = christmasEve.getTime() - now.getTime();
    const isChristmas = currentMonth === 12 && now.getDate() === 24;

    if (diff <= 0 || isChristmas) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isChristmas: true,
        urgencyLevel: "today",
      };
    }

    // Calculate components
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Determine urgency level
    let urgencyLevel: "calm" | "approaching" | "urgent" | "critical" | "today";
    if (days > 14) {
      urgencyLevel = "calm";
    } else if (days >= 8) {
      urgencyLevel = "approaching";
    } else if (days >= 4) {
      urgencyLevel = "urgent";
    } else {
      urgencyLevel = "critical";
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      isChristmas: false,
      urgencyLevel,
    };
  }

  /**
   * Get global production metrics for NisseStats dashboard
   *
   * METRIC CALCULATION:
   * 1. Base value from sigmoid progression (min → max over 24 days)
   * 2. Child progress multiplier bonus (subtle 2-5% boost per completed quest)
   * 3. Crisis behaviors (glitch, oscillate, drain, stuck, negative, warning, dimming, lost)
   * 4. Filter by unlock_day (progressive reveal)
   *
   * DISPLAY TYPES:
   * - counter: Large animated numbers (GAVEPRODUKSJON, PEPPERKAKER)
   * - bar: ASCII progress bar [████░░░░░░] (REINSDYR FLYTIMER)
   * - percentage: Value with % symbol (SLEDE DRIVSTOFF)
   * - waveform: Oscillating energy line (NISSEKRAFT)
   * - radar: Spinning radar sweep (BREVFUGL-SVERM)
   * - gauge: Semicircle meter with needle (RUDOLF NES-SIGNAL, FORSVARS-BARRIERE)
   * - binary: Flickering 0s and 1s (RUTE-BEREGNING)
   * - hexgrid: Hexagonal cells filling (MAGISKE SEKKER)
   *
   * CRISIS TYPES:
   * - glitch: Random flickering values with garbage data
   * - oscillate: Values counting up and down rapidly
   * - drain: Slowly decreasing value
   * - stuck: Frozen at specific value (loop)
   * - negative: Shows negative numbers (underflow)
   * - warning: Persistent warning state
   * - dimming: Slowly dimming/reducing
   * - lost: Complete signal loss (0 or ???)
   *
   * @param day - Current day (1-24)
   * @param completedQuestCount - Number of completed quests (0-24)
   * @returns Array of global production metrics with computed values
   */
  static getGlobalProductionMetrics(
    day: number,
    completedQuestCount: number,
  ): Array<{
    navn: string;
    verdi: number;
    maks: number;
    displayType:
    | "counter"
    | "bar"
    | "percentage"
    | "waveform"
    | "radar"
    | "gauge"
    | "binary"
    | "hexgrid";
    unit: string;
    description: string;
    status: "normal" | "advarsel" | "kritisk";
    inCrisis: boolean;
    crisisType?:
    | "glitch"
    | "oscillate"
    | "drain"
    | "stuck"
    | "negative"
    | "warning"
    | "dimming"
    | "lost";
    crisisText?: string;
    crisisValues?: number[];
  }> {
    const globalMetrics = (
      statiskInnhold as unknown as {
        nissestats_global_metrics: Array<{
          navn: string;
          min: number;
          maks: number;
          unlock_day: number;
          display_type:
          | "counter"
          | "bar"
          | "percentage"
          | "waveform"
          | "radar"
          | "gauge"
          | "binary"
          | "hexgrid";
          unit: string;
          child_progress_multiplier: number;
          description: string;
          crisis_behavior?: {
            day: number;
            crisis_type:
            | "glitch"
            | "oscillate"
            | "drain"
            | "stuck"
            | "negative"
            | "warning"
            | "dimming"
            | "lost";
            crisis_value?: number;
            crisis_values?: number[];
            status: "kritisk" | "advarsel";
            crisis_text: string;
          };
        }>;
      }
    ).nissestats_global_metrics;

    const progressionConfig = (
      statiskInnhold as unknown as {
        progression_config: {
          sigmoid: { k: number; midpoint: number };
        };
      }
    ).progression_config;
    const { k, midpoint } = progressionConfig.sigmoid;

    // Filter by unlock_day
    const unlockedMetrics = globalMetrics.filter((m) => m.unlock_day <= day);

    return unlockedMetrics.map((metric) => {
      // Calculate base sigmoid value
      const baseValue = this.calculateSigmoidValue(
        metric.min,
        metric.maks,
        day,
        k,
        midpoint,
      );

      // Apply child progress multiplier (subtle bonus)
      const progressBonus =
        1 + completedQuestCount * metric.child_progress_multiplier;
      let value = Math.round(baseValue * progressBonus);

      // Ensure value doesn't exceed max
      value = Math.min(value, metric.maks);

      // Check for crisis
      let inCrisis = false;
      let crisisType:
        | "glitch"
        | "oscillate"
        | "drain"
        | "stuck"
        | "negative"
        | "warning"
        | "dimming"
        | "lost"
        | undefined;
      let crisisText: string | undefined;
      let crisisValues: number[] | undefined;
      let status: "normal" | "advarsel" | "kritisk" = "normal";

      if (metric.crisis_behavior && day >= metric.crisis_behavior.day) {
        // Determine which crisis system this belongs to
        const crisisBehavior = metric.crisis_behavior;
        let crisisResolved = false;

        // Day 11: Antenna crisis (affects REINSDYR, RUDOLF, BREVFUGL-SVERM)
        // Programmatic resolution: Auto-resolve on day 13 OR when badge awarded
        if (
          crisisBehavior.day === 11 &&
          ["REINSDYR FLYTIMER", "RUDOLF NES-SIGNAL", "BREVFUGL-SVERM"].includes(
            metric.navn,
          )
        ) {
          crisisResolved = this.isCrisisResolved("antenna") || day >= 13;
        }

        // Day 16: Inventory crisis (affects GAVEPRODUKSJON, MAGISKE SEKKER, ØNSKELISTE, NISSEKRAFT)
        // Programmatic resolution: Auto-resolve on day 18 OR when badge awarded
        if (
          crisisBehavior.day === 16 &&
          [
            "GAVEPRODUKSJON",
            "MAGISKE SEKKER",
            "ØNSKELISTE BEHANDLET",
            "NISSEKRAFT",
          ].includes(metric.navn)
        ) {
          crisisResolved = this.isCrisisResolved("inventory") || day >= 18;
        }

        // Day 7: Mørket warning (affects FORSVARS-BARRIERE, JULESTJERNE)
        // This is a story warning, not a crisis that needs resolution
        // Programmatic resolution: Auto-resolves on day 14 (when Eventyr 1 concludes)
        if (
          crisisBehavior.day === 7 &&
          ["FORSVARS-BARRIERE", "JULESTJERNE LYSSTYRKE"].includes(metric.navn)
        ) {
          // Warning state persists until day 14 (when eventyr progresses)
          crisisResolved = day >= 14;
        }

        if (!crisisResolved) {
          inCrisis = true;
          crisisType = crisisBehavior.crisis_type;
          crisisText = crisisBehavior.crisis_text;
          status = crisisBehavior.status;

          // Set value(s) based on crisis type
          if (crisisBehavior.crisis_values) {
            crisisValues = crisisBehavior.crisis_values;
            // Use first value as default display
            value = crisisValues[0];
          } else if (crisisBehavior.crisis_value !== undefined) {
            value = crisisBehavior.crisis_value;
          }
        } else {
          // Crisis resolved, calculate normal status
          status = this.getMetricStatus(value, metric.maks);
        }
      } else {
        // No crisis, calculate normal status
        status = this.getMetricStatus(value, metric.maks);
      }

      return {
        navn: metric.navn,
        verdi: value,
        maks: metric.maks,
        displayType: metric.display_type,
        unit: metric.unit,
        description: metric.description,
        status,
        inCrisis,
        crisisType,
        crisisText,
        crisisValues,
      };
    });
  }
}

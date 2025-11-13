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
} from "./historier";
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
 * Validate that eventyr IDs in oppdrag reference valid eventyr in historier.json
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
    validateEventyrReferences(allOppdrag); // Validate eventyr IDs exist in historier.json
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
   * Get current system metrics (base + overrides from completed quests)
   */
  static getCurrentSystemMetrics(): SystemMetrikk[] {
    const baseMetrics = (statiskInnhold.systemMetrikker as SystemMetrikk[]).map(
      (m) => ({ ...m }),
    );
    const completedQuests = this.loadGameState().completedQuests;

    // Apply overrides from completed quests
    ALL_QUESTS.forEach((quest) => {
      if (completedQuests.has(quest.dag) && quest.system_status_override) {
        const override = quest.system_status_override;
        const metric = baseMetrics.find((m) => m.navn === override.metricName);
        if (metric) {
          metric.verdi = override.value;
          metric.status = override.status;
        }
      }
    });

    return baseMetrics;
  }

  /**
   * Get current alerts (base + overrides from recent quests)
   */
  static getCurrentAlerts(): Varsel[] {
    const baseAlerts = [...(statiskInnhold.varsler as Varsel[])];
    const completedQuests = this.loadGameState().completedQuests;
    const recentAlerts: Varsel[] = [];

    // Collect alert overrides from recently completed quests (last 3 days)
    const sortedDays = Array.from(completedQuests).sort((a, b) => b - a);
    const recentDays = sortedDays.slice(0, 3);

    ALL_QUESTS.forEach((quest) => {
      if (recentDays.includes(quest.dag) && quest.alert_override) {
        recentAlerts.push({
          id: `alert-day-${quest.dag}`,
          tekst: quest.alert_override.text,
          type: quest.alert_override.type,
          tidspunkt: getCurrentDate().toTimeString().slice(0, 5),
        });
      }
    });

    // Merge: recent alerts first, then base alerts
    return [...recentAlerts, ...baseAlerts];
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
}

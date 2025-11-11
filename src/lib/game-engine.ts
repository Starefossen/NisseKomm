/**
 * NisseKomm Game Engine
 *
 * Centralized game state management and progression logic.
 * This module coordinates all game mechanics: quests, side-quests, badges,
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
import { Oppdrag } from "@/types/innhold";

// Import all weekly quest JSON files
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";

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
    "beskrivelse",
    "kode",
    "dagbokinnlegg",
    "rampenissen_rampestrek",
    "fysisk_ledetekst",
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

  // Validate side-quest structure if present
  if (oppdrag.sideoppdrag) {
    const sideoppdrag = oppdrag.sideoppdrag;
    if (
      !sideoppdrag.tittel ||
      !sideoppdrag.beskrivelse ||
      !sideoppdrag.validering ||
      !sideoppdrag.badge_icon ||
      !sideoppdrag.badge_navn
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - sideoppdrag missing required fields`,
      );
    }
    if (sideoppdrag.validering === "kode" && !sideoppdrag.kode) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - sideoppdrag with validering="kode" must have kode field`,
      );
    }
    const validBadgeIcons = ["coin", "heart", "zap", "trophy", "gift", "star"];
    if (!validBadgeIcons.includes(sideoppdrag.badge_icon)) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - sideoppdrag.badge_icon must be one of: ${validBadgeIcons.join(", ")}`,
      );
    }
  }
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

  // Side-quest system
  completedSideQuests: Set<number>; // Day numbers of completed side-quests
  earnedBadges: Badge[];

  // Module unlocks
  unlockedModules: Set<string>;

  // Email tracking
  viewedMainEmails: Set<number>;
  viewedSideQuestEmails: Set<number>;

  // Crisis management
  resolvedCrises: {
    antenna: boolean;
    inventory: boolean;
  };

  // Cross-references (Phase 2 feature)
  unlockedTopics: Map<string, number>; // topic -> unlocked on day

  // Letters from Julius (Brevfugler)
  santaLetters: Array<{ day: number; content: string }>;
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
  unlockedModule?: ModuleUnlock;
  earnedBadge?: Badge;
  message: string;
}

/**
 * ============================================================
 * GAME CONFIGURATION (Data-Driven)
 * ============================================================
 */

/**
 * Module unlock configuration - defines when modules become available
 * Note: These thresholds are based on total completed quests, not specific days
 */
const MODULE_UNLOCKS: ModuleUnlock[] = [
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

/**
 * Crisis configuration - maps crisis types to their requirements
 * Data is derived from quest JSON files dynamically
 */
function getCrisisConfig(crisisType: "antenna" | "inventory") {
  const allQuests = ALL_QUESTS;
  const crisisTitle =
    crisisType === "antenna"
      ? "KRITISK: Signal-krise"
      : "KRITISK: Inventar-kaos";

  const quest = allQuests.find((q) => q.sideoppdrag?.tittel === crisisTitle);
  if (!quest?.sideoppdrag) {
    throw new Error(`Crisis configuration not found for: ${crisisType}`);
  }

  return {
    day: quest.dag,
    badgeIcon: quest.sideoppdrag.badge_icon,
    badgeName: quest.sideoppdrag.badge_navn,
    validationType: quest.sideoppdrag.validering,
  };
}

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

    // Identify completed side-quests
    const completedSideQuests = new Set<number>();
    const storedBadges = StorageManager.getSideQuestBadges();
    const earnedBadges: Badge[] = storedBadges.map((b) => ({
      day: b.day,
      icon: b.icon,
      name: b.navn,
    }));

    allQuests.forEach((quest) => {
      if (quest.sideoppdrag) {
        const isCompleted = this.isSideQuestCompleted(quest);
        if (isCompleted) {
          completedSideQuests.add(quest.dag);
        }
      }
    });

    return {
      completedQuests,
      submittedCodes: submittedCodes.map((c) => c.kode),
      completedSideQuests,
      earnedBadges,
      unlockedModules: new Set(StorageManager.getUnlockedModules()),
      viewedMainEmails: StorageManager.getViewedEmails(),
      viewedSideQuestEmails: StorageManager.getViewedSideQuestEmails(),
      resolvedCrises: StorageManager.getCrisisStatus(),
      unlockedTopics: StorageManager.getUnlockedTopics(),
      santaLetters: StorageManager.getSantaLetters(),
    };
  }

  /**
   * Get empty/initial game state
   */
  private static getEmptyState(): GameState {
    return {
      completedQuests: new Set(),
      submittedCodes: [],
      completedSideQuests: new Set(),
      earnedBadges: [],
      unlockedModules: new Set(),
      viewedMainEmails: new Set(),
      viewedSideQuestEmails: new Set(),
      resolvedCrises: { antenna: false, inventory: false },
      unlockedTopics: new Map(),
      santaLetters: [],
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
      dato: new Date().toISOString(),
    });

    // Check for cross-reference unlock
    const allQuests = ALL_QUESTS;
    const quest = allQuests.find((q) => q.dag === day);
    if (quest?.cross_reference_topic) {
      StorageManager.unlockTopic(quest.cross_reference_topic, day);
    }

    // Check for module unlocks
    const newCompletionCount = currentState.submittedCodes.length + 1;
    const unlockedModule = this.checkModuleUnlock(newCompletionCount);

    return {
      success: true,
      isNewCompletion: true,
      unlockedModule,
      message: unlockedModule
        ? `KODE AKSEPTERT! ${unlockedModule.label.toUpperCase()} LÅST OPP!`
        : "KODE AKSEPTERT!",
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
   * Check if a side-quest is completed
   */
  static isSideQuestCompleted(quest: Oppdrag): boolean {
    if (!quest.sideoppdrag) return false;

    if (quest.sideoppdrag.validering === "forelder") {
      // Parent-validated: check for badge
      return StorageManager.hasSideQuestBadge(quest.dag);
    } else if (quest.sideoppdrag.kode) {
      // Code-validated: check for submitted code
      return StorageManager.isCodeSubmitted(quest.sideoppdrag.kode);
    }

    return false;
  }

  /**
   * Check if a side-quest is accessible (main quest must be completed)
   */
  static isSideQuestAccessible(day: number): boolean {
    return this.isQuestCompleted(day);
  }

  /**
   * Award a badge for completing a parent-validated side-quest
   */
  static awardBadge(crisisType: "antenna" | "inventory"): {
    success: boolean;
    badge: Badge;
  } {
    const config = getCrisisConfig(crisisType);

    const badge: Badge = {
      day: config.day,
      icon: config.badgeIcon,
      name: config.badgeName,
      crisisType,
    };

    // Store badge
    StorageManager.addSideQuestBadge(badge.day, badge.icon, badge.name);

    // Mark crisis as resolved
    StorageManager.resolveCrisis(crisisType);

    return { success: true, badge };
  }

  /**
   * Get all earned badges
   */
  static getEarnedBadges(): Badge[] {
    const stored = StorageManager.getSideQuestBadges();
    return stored.map((b) => ({
      day: b.day,
      icon: b.icon,
      name: b.navn,
    }));
  }

  /**
   * ============================================================
   * MODULE UNLOCKS
   * ============================================================
   */

  /**
   * Check if completing quest count N unlocks a new module
   */
  private static checkModuleUnlock(
    completedCount: number,
  ): ModuleUnlock | undefined {
    const unlock = MODULE_UNLOCKS.find(
      (m) => m.requiredCompletedQuests === completedCount,
    );

    if (unlock && !StorageManager.isModuleUnlocked(unlock.moduleId)) {
      StorageManager.unlockModule(unlock.moduleId);
      return unlock;
    }

    return undefined;
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
   * Get module unlock configuration
   */
  static getModuleUnlocks(): ModuleUnlock[] {
    return MODULE_UNLOCKS;
  }

  /**
   * ============================================================
   * EMAIL TRACKING
   * ============================================================
   */

  /**
   * Mark an email as viewed
   */
  static markEmailAsViewed(day: number, isSideQuest: boolean = false): void {
    if (isSideQuest) {
      StorageManager.markSideQuestEmailAsViewed(day);
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
   * Get detailed progression summary
   */
  static getProgressionSummary() {
    const state = this.loadGameState();
    const allQuests = ALL_QUESTS;

    const sideQuestsAvailable = allQuests.filter((q) => q.sideoppdrag).length;
    const sideQuestsCompleted = state.completedSideQuests.size;

    return {
      mainQuests: {
        completed: state.completedQuests.size,
        total: 24,
        percentage: this.getProgressionPercentage(),
      },
      sideQuests: {
        completed: sideQuestsCompleted,
        available: sideQuestsAvailable,
        percentage: Math.round(
          (sideQuestsCompleted / sideQuestsAvailable) * 100,
        ),
      },
      badges: {
        earned: state.earnedBadges.length,
        total: sideQuestsAvailable, // Assumes each side-quest has a badge
      },
      modules: {
        unlocked: state.unlockedModules.size,
        total: MODULE_UNLOCKS.length,
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
}

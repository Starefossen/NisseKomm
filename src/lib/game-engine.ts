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
  calculateSigmoidValue,
  getMetricStatus,
} from "./utils/metric-calculator";
import { findFileNode } from "./utils/file-tree-utils";
import {
  getCrisisAlerts,
  getEventyrMilepælVarsler,
  getGeneralMilestoneAlerts,
  convertDailyAlerts,
  sortAlertsByPriority,
} from "./generators/alert-generator";
import { getAllSymbols, collectSymbolByCode } from "./systems/symbol-system";
import { getAllQuests, getQuestByDay } from "./data-loader";
import {
  Oppdrag,
  FilNode,
  SystemMetrikk,
  Varsel,
  InnsendelseLog,
} from "@/types/innhold";
import statiskInnhold from "@/data/statisk_innhold.json";

const ALL_QUESTS = getAllQuests();

interface GameState {
  completedQuests: Set<number>;
  submittedCodes: string[];
  completedBonusOppdrag: Set<number>;
  earnedBadges: Badge[];
  unlockedModules: Set<string>;
  viewedMainEmails: Set<number>;
  viewedBonusOppdragEmails: Set<number>;
  resolvedCrises: {
    antenna: boolean;
    inventory: boolean;
  };
  unlockedTopics: Map<string, number>;
  santaLetters: Array<{ day: number; content: string }>;
  completedEventyr: Set<string>;
}

interface Badge {
  day: number;
  icon: string;
  name: string;
  crisisType?: "antenna" | "inventory";
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

    const completedQuests = new Set<number>();
    submittedCodes.forEach((entry) => {
      const quest = allQuests.find(
        (q) => q.kode.toUpperCase() === entry.kode.toUpperCase(),
      );
      if (quest) {
        completedQuests.add(quest.dag);
      }
    });

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

    // Compute eventyr completion inline to avoid circular dependency
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
   * Submit a code and update game state accordingly
   */
  static submitCode(
    code: string,
    expectedCode: string,
    day: number,
  ): QuestResult {
    const isCorrect = code.trim().toUpperCase() === expectedCode.toUpperCase();

    if (!isCorrect) {
      StorageManager.incrementFailedAttempts(day);
      return {
        success: false,
        isNewCompletion: false,
        message: "FEIL KODE - PRØV IGJEN",
      };
    }

    const currentState = this.loadGameState();
    const isNewCompletion = !currentState.completedQuests.has(day);

    if (!isNewCompletion) {
      return {
        success: true,
        isNewCompletion: false,
        message: "KODEN ER ALLEREDE REGISTRERT",
      };
    }

    StorageManager.addSubmittedCode({
      kode: code.trim().toUpperCase(),
      dato: getISOString(),
    });

    StorageManager.resetFailedAttempts(day);

    this.processContentUnlocks(day);

    BadgeManager.checkAndAwardAllEligibleBadges();

    // Day 24 completion awards trophy badge
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

  static getCompletedDays(): Set<number> {
    const state = this.loadGameState();
    return state.completedQuests;
  }

  static getSubmittedCodes(): InnsendelseLog[] {
    return StorageManager.getSubmittedCodes();
  }

  static getFailedAttempts(day: number): number {
    return StorageManager.getFailedAttempts(day);
  }

  /**
   * Get all quest data (delegates to oppdrag loader)
   */
  static getAllQuests(): Oppdrag[] {
    return ALL_QUESTS;
  }

  /**
   * Check if a bonus quest is completed
   */
  static isBonusOppdragCompleted(quest: Oppdrag): boolean {
    if (!quest.bonusoppdrag) return false;

    if (quest.bonusoppdrag.validering === "forelder") {
      return StorageManager.hasBonusOppdragBadge(quest.dag);
    } else if (quest.bonusoppdrag.kode) {
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
   * Check and unlock time-based modules
   * Modules unlock either when quest is completed OR the next day
   */
  private static checkTimedModuleUnlocks(currentDay: number): void {
    if (getCurrentMonth() !== 12) {
      return;
    }

    ALL_QUESTS.forEach((quest) => {
      if (quest.reveals?.modules && quest.dag < currentDay) {
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

  static getSantaLetters(): Array<{ day: number; content: string }> {
    return StorageManager.getSantaLetters();
  }

  static addSantaLetter(day: number, content: string): void {
    StorageManager.addSantaLetter(day, content);
  }

  /**
   * Save complete set of Santa letters (replaces existing)
   */
  static saveSantaLetters(
    letters: Array<{ day: number; content: string }>,
  ): void {
    StorageManager.saveSantaLetters(letters);
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
    const quest = getQuestByDay(day);
    if (!quest || !quest.reveals) return;

    if (quest.reveals.files) {
      quest.reveals.files.forEach((fileId) => {
        StorageManager.addUnlockedFile(fileId);
      });
    }

    if (quest.reveals.topics) {
      quest.reveals.topics.forEach((topic) => {
        StorageManager.unlockTopic(topic, day);
      });
    }

    if (quest.reveals.modules) {
      quest.reveals.modules.forEach((moduleId) => {
        StorageManager.unlockModule(moduleId);
      });
    }

    // Symbols require physical collection (QR scanning or parent addition)
  }

  /**
   * Validate decryption sequence with partial feedback
   *
   * Challenges: "frosne-koder" (Day 12), "stjernetegn" (Day 18), "hjertets-hemmelighet" (Day 23)
   * Validates symbol placement order and unlocks secret files on success
   */
  static validateDecryptionSequence(
    challengeId: string,
    userSequence: number[],
  ): DecryptionValidationResult {
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

    if (StorageManager.isDecryptionSolved(challengeId)) {
      return {
        correct: true,
        message: "Allerede løst!",
        correctCount: challenge.correctSequence.length,
      };
    }

    if (userSequence.length !== challenge.correctSequence.length) {
      StorageManager.incrementDecryptionAttempts(challengeId);
      return {
        correct: false,
        message: "Feil antall symboler",
        correctCount: 0,
      };
    }

    let correctCount = 0;
    for (let i = 0; i < userSequence.length; i++) {
      if (userSequence[i] === challenge.correctSequence[i]) {
        correctCount++;
      }
    }

    const isCorrect = correctCount === challenge.correctSequence.length;

    if (isCorrect) {
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

    ALL_QUESTS.forEach((quest: Oppdrag) => {
      if (quest.eventyr && gameState.completedQuests.has(quest.dag)) {
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
   * ============================================================
   * SYMBOL COLLECTION
   * ============================================================
   * Physical-digital bridge for treasure hunt gameplay
   * Delegated to symbol-system module for better separation
   */

  public static getAllSymbols = getAllSymbols;
  public static collectSymbolByCode = collectSymbolByCode;

  /**
   * Get newly unlocked content for a completed quest
   */
  static getNewlyUnlockedContent(day: number): ContentUnlockResult {
    const quest = getQuestByDay(day);
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
    const fileNode = findFileNode(fileId, statiskInnhold.filer as FilNode[]);
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
      const hasAllTopics = conditions.requiresTopics.every((topic: string) =>
        unlockedTopics.has(topic),
      );
      if (!hasAllTopics) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a mission is accessible (requirements met)
   */
  static isMissionAccessible(day: number): boolean {
    const quest = getQuestByDay(day);
    if (!quest || !quest.requires) return true;

    const requirements = quest.requires;

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
   * Get all solved decryption challenge IDs
   *
   * @returns Array of decryption challenge IDs that have been solved
   * @public Used by UI components to check decryption completion status
   */
  static getSolvedDecryptions(): string[] {
    return StorageManager.getSolvedDecryptions();
  }

  /**
   * Check if specific decryption challenge is solved
   *
   * @param challengeId - Decryption challenge identifier
   * @returns True if challenge has been solved
   * @public Used by NisseKrypto and UI components
   */
  static isDecryptionSolved(challengeId: string): boolean {
    return StorageManager.isDecryptionSolved(challengeId);
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
        let value = calculateSigmoidValue(
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
        let status = getMetricStatus(value, metric.maks);

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
   * Get daily narrative alerts for current day
   *
   * BEHAVIOR:
   * - Adds active crisis alerts at top (kritisk priority)
   * - Injects eventyr milestone celebrations
   * - Includes all historical daily alerts
   * - Adds general milestone celebrations (Day 8, 16, 22)
   * - Returns max 8 alerts, sorted by priority
   *
   * @param day - Current day (1-24)
   * @param completedDays - Set of completed day numbers
   * @returns Array of Varsel objects for display
   */
  static getDailyAlerts(day: number, completedDays: Set<number>): Varsel[] {
    const alerts: Varsel[] = [];
    const dailyAlertsData = (
      statiskInnhold as unknown as {
        daily_alerts: Array<{
          day: number;
          tekst: string;
          type: "info" | "advarsel" | "kritisk";
        }>;
      }
    ).daily_alerts;

    // Get crisis status from storage
    const crisisStatus = this.getCrisisStatus();

    // 1. Add crisis alerts if active (highest priority)
    const crisisAlerts = getCrisisAlerts(day, crisisStatus);
    alerts.push(...crisisAlerts);

    // 2. Add eventyr milestone celebration alerts
    const eventyrVarsler = getEventyrMilepælVarsler(day, completedDays);
    alerts.push(...eventyrVarsler);

    // 3. Add ALL daily alerts from day 1 up to current day (historical feed)
    const dailyVarsler = convertDailyAlerts(dailyAlertsData, day);
    alerts.push(...dailyVarsler);

    // 4. Add general milestone celebration alerts
    const milestoneAlerts = getGeneralMilestoneAlerts(day, completedDays);
    alerts.push(...milestoneAlerts);

    // 5. Sort by priority (kritisk > advarsel > info) and day (newest first)
    sortAlertsByPriority(alerts);

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
      const baseValue = calculateSigmoidValue(
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
          status = getMetricStatus(value, metric.maks);
        }
      } else {
        // No crisis, calculate normal status
        status = getMetricStatus(value, metric.maks);
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

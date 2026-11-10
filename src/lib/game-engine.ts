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
import {
  frostLevelFor,
  frostModeFor,
  isFrostDay,
  type FrostMode,
} from "./frost";
import { findFileNode } from "./utils/file-tree-utils";
import {
  convertDailyAlerts,
  sortAlertsByPriority,
} from "./generators/alert-generator";
import {
  getAllSymbols,
  collectSymbolByCode,
  getCollectedSymbols,
  addCollectedSymbol,
  clearCollectedSymbols,
} from "./systems/symbol-system";
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
  unlockedModules: Set<string>;
  viewedMainEmails: Set<number>;
  viewedBonusOppdragEmails: Set<number>;
  unlockedTopics: Map<string, number>;
  santaLetters: Array<{ day: number; content: string }>;
  completedEventyr: Set<string>;
}

interface QuestResult {
  success: boolean;
  isNewCompletion: boolean;
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
 * Dependencies that can be injected for testing or customization
 */
interface GameEngineDependencies {
  /**
   * Resolver for {{KID_CODE}} placeholder
   * If not provided, will use default session-based resolver
   */
  kidCodeResolver?: () => Promise<string | null>;
}

export class GameEngine {
  private static dependencies: GameEngineDependencies = {};

  /**
   * Configure GameEngine with custom dependencies (primarily for testing)
   * Call this before using GameEngine methods to inject custom behavior
   *
   * @param deps - Partial dependencies to override defaults
   *
   * @example
   * // In tests
   * GameEngine.configure({
   *   kidCodeResolver: async () => "NISSEKRAFT2024"
   * });
   */
  static configure(deps: GameEngineDependencies): void {
    this.dependencies = { ...this.dependencies, ...deps };
  }

  /**
   * Reset dependencies to defaults (useful for test cleanup)
   */
  static resetDependencies(): void {
    this.dependencies = {};
  }

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
      // Prefer day-based matching (reliable with {{KID_CODE}} placeholder)
      if (entry.day !== undefined) {
        completedQuests.add(entry.day);
      } else {
        // Fallback to code-based matching for legacy data
        const quest = allQuests.find(
          (q) => q.kode.toUpperCase() === entry.kode.toUpperCase(),
        );
        if (quest) {
          completedQuests.add(quest.dag);
        }
      }
    });

    const completedBonusOppdrag = new Set<number>();

    allQuests.forEach((quest) => {
      if (quest.bonusoppdrag) {
        const isCompleted = this.isBonusOppdragCompleted(quest);
        if (isCompleted) {
          completedBonusOppdrag.add(quest.dag);
        }
      }
    });

    // Compute eventyr completion using total phase count from getEventyrDays
    const eventyrIds = new Set<string>();
    allQuests.forEach((quest) => {
      if (quest.eventyr) {
        eventyrIds.add(quest.eventyr.id);
      }
    });

    const completedEventyrList: string[] = [];
    eventyrIds.forEach((eventyrId) => {
      const allDaysForEventyr = getEventyrDays(eventyrId);
      if (
        allDaysForEventyr.length > 0 &&
        allDaysForEventyr.every((day) => completedQuests.has(day))
      ) {
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
      unlockedModules: new Set(StorageManager.getUnlockedModules()),
      viewedMainEmails: StorageManager.getViewedEmails(),
      viewedBonusOppdragEmails: StorageManager.getViewedBonusOppdragEmails(),
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
      unlockedModules: new Set(),
      viewedMainEmails: new Set(),
      viewedBonusOppdragEmails: new Set(),
      unlockedTopics: new Map(),
      santaLetters: [],
      completedEventyr: new Set(),
    };
  }

  /**
   * Submit a code and update game state accordingly
   * Resolves {{KID_CODE}} placeholder if present in expectedCode
   *
   * @param code - User-submitted code
   * @param expectedCode - Expected code (may contain {{KID_CODE}} placeholder)
   * @param day - Quest day number
   * @param kidCodeOverride - Optional kid code to use instead of fetching from session (for testing)
   */
  static async submitCode(
    code: string,
    expectedCode: string,
    day: number,
    kidCodeOverride?: string,
  ): Promise<QuestResult> {
    // Resolve placeholder if present
    let resolvedExpectedCode = expectedCode;
    if (expectedCode === "{{KID_CODE}}") {
      console.debug(
        "[GameEngine] Resolving {{KID_CODE}} placeholder for Day",
        day,
      );
      let kidCode: string | null = null;

      // Use override if provided (testing)
      if (kidCodeOverride) {
        kidCode = kidCodeOverride;
        console.debug("[GameEngine] Using kidCodeOverride:", kidCode);
      }
      // Use injected resolver if available
      else if (this.dependencies.kidCodeResolver) {
        console.debug("[GameEngine] Using injected kidCodeResolver");
        kidCode = await this.dependencies.kidCodeResolver();
      }
      // Fall back to default session resolver
      else {
        // The kid code is the session id in localStorage mode
        const { getSessionId } = await import("./auth-cookies");
        kidCode = getSessionId();
        console.debug(
          "[GameEngine] Got kidCode from session:",
          kidCode ? "SUCCESS" : "NULL",
        );
      }

      if (!kidCode) {
        console.error(
          "[GameEngine] Failed to resolve {{KID_CODE}} - no kidCode available",
        );
        return {
          success: false,
          isNewCompletion: false,
          message: "KUNNE IKKE HENTE KODE - PRØV IGJEN",
        };
      }
      resolvedExpectedCode = kidCode;
      console.debug("[GameEngine] Resolved expected code for Day", day);
    }

    const isCorrect =
      code.trim().toUpperCase() === resolvedExpectedCode.toUpperCase();

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
      day, // Store day for reliable matching
    });

    StorageManager.resetFailedAttempts(day);

    this.processContentUnlocks(day);

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

  static isJuliusVideoWatched(day: number): boolean {
    return StorageManager.getJuliusWatched().includes(day);
  }

  static markJuliusVideoWatched(day: number): void {
    StorageManager.markJuliusWatched(day);
  }

  /** Frostgraden (0–100) for a day, or null on days 1–6 when it is hidden. */
  static getFrostLevel(day: number = getCurrentDay()): number | null {
    const quest = ALL_QUESTS.find((q) => q.dag === day);
    return frostLevelFor(
      day,
      this.isQuestCompleted(day),
      quest ? this.isBonusOppdragCompleted(quest) : false,
    );
  }

  static isFrostDay(day: number = getCurrentDay()): boolean {
    return isFrostDay(day);
  }

  /** Frost mode right now: level 1 on day 10, 2 on day 21, 0 otherwise or once solved. */
  static getFrostMode(): FrostMode {
    const now = getCurrentDate();
    const day = now.getDate();
    return frostModeFor({
      day,
      month: now.getMonth() + 1,
      hour: now.getHours(),
      solved: this.isQuestCompleted(day),
      disabled: StorageManager.getFrostOffDay() === day,
    });
  }

  /** Parent kill switch («Frost av») for today. */
  static isFrostDisabledToday(): boolean {
    return StorageManager.getFrostOffDay() === getCurrentDay();
  }

  static setFrostDisabledToday(disabled: boolean): void {
    StorageManager.setFrostOffDay(disabled ? getCurrentDay() : 0);
  }

  /**
   * Frostrunene learned so far: every letter of a solved word code, plus E and
   * T from the loose cards on day 1 (gaater-2026, meta 1).
   */
  static getLearnedRunes(): Set<string> {
    const learned = new Set<string>();
    for (const day of this.getCompletedDays()) {
      const quest = ALL_QUESTS.find((q) => q.dag === day);
      for (const ch of quest?.kode.toUpperCase() ?? "") {
        if (/[A-ZÆØÅ]/.test(ch)) learned.add(ch);
      }
      if (day === 1) ["E", "T"].forEach((c) => learned.add(c));
    }
    return learned;
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

  /** Parent guide: clear a day's wrong guesses so Julius' hint resets */
  static resetFailedAttempts(day: number): void {
    StorageManager.resetFailedAttempts(day);
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

    return StorageManager.isBonusOppdragCompleted(quest.dag);
  }

  /**
   * Parent approval of a bonus quest (guide page or the parent code)
   */
  static completeBonusOppdrag(day: number): void {
    StorageManager.completeBonusOppdrag(day);
  }

  static revokeBonusOppdrag(day: number): void {
    StorageManager.revokeBonusOppdrag(day);
  }

  /**
   * Julius' PS for a solved day: bonus variant once the bonus is approved,
   * "krypto mangler" variant while the day's decryption is still unsolved
   */
  static getJuliusPs(day: number): string | undefined {
    const quest = getQuestByDay(day);
    if (!quest) return undefined;
    if (quest.julius_ps_krypto_mangler) {
      // The most recent decryption before this day (day 20: stjernetegn)
      const latest = ALL_QUESTS.filter(
        (q) => q.dag <= day && q.decryption_challenge,
      ).at(-1)?.decryption_challenge;
      if (latest && !StorageManager.isDecryptionSolved(latest.challengeId)) {
        return quest.julius_ps_krypto_mangler;
      }
    }
    if (quest.julius_ps_bonus && this.isLyktBonusCompleted(day)) {
      return quest.julius_ps_bonus;
    }
    return quest.julius_ps;
  }

  // Day 11 PS follows its own bonus; days 16-19 follow the lantern (day 16)
  private static isLyktBonusCompleted(day: number): boolean {
    return StorageManager.isBonusOppdragCompleted(day >= 16 ? 16 : day);
  }

  /**
   * Check if a bonus quest is accessible (main quest must be completed)
   */
  static isBonusOppdragAccessible(day: number): boolean {
    return this.isQuestCompleted(day);
  }

  /**
   * Check and unlock time-based modules
   * Modules in a day's reveals open on the morning of that day (storyboard S1),
   * before the code is solved.
   */
  private static checkTimedModuleUnlocks(currentDay: number): void {
    if (getCurrentMonth() !== 12) {
      return;
    }

    ALL_QUESTS.forEach((quest) => {
      if (quest.reveals?.modules && quest.dag <= currentDay) {
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
   * Crisis status is the bonus quests: antenna = day 11, inventory = day 16
   */
  static getCrisisStatus(): { antenna: boolean; inventory: boolean } {
    return {
      antenna: StorageManager.isBonusOppdragCompleted(11),
      inventory: StorageManager.isBonusOppdragCompleted(16),
    };
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
      BadgeManager.checkAndAwardAllEligibleBadges();
      return {
        correct: true,
        message: challenge.rewardText,
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
    const completedEventyrList: string[] = [];

    // Get all unique eventyr IDs from quests
    const eventyrIds = new Set<string>();
    ALL_QUESTS.forEach((quest: Oppdrag) => {
      if (quest.eventyr) {
        eventyrIds.add(quest.eventyr.id);
      }
    });

    // Check each eventyr using proper total phase count from getEventyrDays
    eventyrIds.forEach((eventyrId) => {
      const allDaysForEventyr = getEventyrDays(eventyrId);
      const completedDaysForEventyr = allDaysForEventyr.filter((day) =>
        gameState.completedQuests.has(day),
      );

      // Only complete if ALL days/phases are completed
      if (
        allDaysForEventyr.length > 0 &&
        completedDaysForEventyr.length === allDaysForEventyr.length
      ) {
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
  static getCollectedSymbols = getCollectedSymbols;

  static addCollectedSymbol(
    symbol: ReturnType<typeof getAllSymbols>[number],
  ): void {
    addCollectedSymbol(symbol);
    BadgeManager.checkAndAwardAllEligibleBadges();
  }

  static clearCollectedSymbols = clearCollectedSymbols;

  /**
   * ============================================================
   * SYMBOL COLLECTION
   * ============================================================
   * Physical-digital bridge for treasure hunt gameplay
   * Delegated to symbol-system module for better separation
   */

  public static getAllSymbols = getAllSymbols;

  public static collectSymbolByCode(code: string) {
    const result = collectSymbolByCode(code);
    if (result.success) {
      BadgeManager.checkAndAwardAllEligibleBadges();
    }
    return result;
  }

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

    // Decrypted files open only through the challenge (handled above)
    if (conditions.requiresSolvedDecryption) {
      return false;
    }

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

  static getNisseNetLastVisit(): number {
    return StorageManager.getNisseNetLastVisit();
  }

  static updateNisseNetLastVisit(day: number): void {
    StorageManager.setNisseNetLastVisit(day);
  }

  static hasUnreadNiceList(): boolean {
    return StorageManager.hasUnreadNiceList();
  }

  static setNiceListViewed(): void {
    StorageManager.setNiceListViewed();
  }

  static getPlayerNames(): string[] {
    return StorageManager.getPlayerNames();
  }

  static setPlayerNames(names: string[]): void {
    StorageManager.setPlayerNames(names);
  }

  static addBrevfugl(dag: number, innhold: string): void {
    StorageManager.leggTilBrevfugl(dag, innhold);
  }

  static addEarnedBadge(badgeId: string): void {
    StorageManager.addEarnedBadge(badgeId);
  }

  static removeEarnedBadge(badgeId: string): void {
    StorageManager.removeEarnedBadge(badgeId);
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
        total: 5, // NISSEKRYPTO, SYMBOLSKANNER, NISSEMUSIKK, BREVFUGLER, NISSESTATS
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
  static async importGameState(jsonData: string): Promise<boolean> {
    return await StorageManager.importData(jsonData);
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

  /** Full game state as plain data (Simulering's øyeblikksbilde) */
  static getSnapshot(): Record<string, unknown> {
    return StorageManager.snapshot();
  }

  static restoreSnapshot(data: Record<string, unknown>): void {
    StorageManager.restoreSnapshot(data);
  }

  /** Clear all progress without prompting (Tidsmaskin) */
  static resetProgress(): void {
    StorageManager.clearAll();
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
   * - Returns max 8 alerts, newest day first
   *
   * @param day - Current day (1-24)
   * @param completedDays - Set of completed day numbers
   * @returns Array of Varsel objects for display
   */
  static getDailyAlerts(
    day: number,
    completedDays: Set<number> = this.getCompletedDays(),
  ): Varsel[] {
    const alerts: Varsel[] = [];
    const dailyAlertsData = (
      statiskInnhold as unknown as {
        daily_alerts: Array<{
          day: number;
          tekst: string;
          type: "info" | "advarsel" | "kritisk";
          etterKode?: boolean;
        }>;
      }
    ).daily_alerts.filter((a) => !a.etterKode || completedDays.has(a.day));

    alerts.push(...convertDailyAlerts(dailyAlertsData, day));

    // Newest day first, priority as tiebreaker
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
          crisisResolved = this.getCrisisStatus().antenna || day >= 13;
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
          crisisResolved = this.getCrisisStatus().inventory || day >= 18;
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

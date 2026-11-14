/**
 * NisseKomm Game Engine
 *
 * Centralized game state management and progression logic.
 * This module coordinates all game mechanics: quests, bonus quests, badges,
 * module unlocks and progression tracking.
 *
 * DESIGN PRINCIPLES:
 * 1. Single source of truth - All game state flows through this engine
 * 2. Data-driven - Configuration comes from JSON, not hardcoded values
 * 3. Event-based - Components subscribe to state changes
 * 4. Type-safe - Full TypeScript interfaces for all game state
 * 5. Testable - Pure functions for game logic, side effects isolated
 */

import { fyllDyp, vedNavn } from "@/lib/navn";
import {
  StorageManager,
  type EventyrSave,
  type SantaLetter,
  type SledeResultat,
} from "./storage";
import { setSyncStatus } from "./storage-adapter";
import { BadgeManager } from "./badge-system";
import { getEventyr, getEventyrDays, getEventyrForDay } from "./eventyr";
import {
  getCurrentDay,
  getCurrentMonth,
  getCurrentDate,
  christmasCountdown,
} from "./date-utils";
import { isFrostDay, type FrostMode } from "./frost";
import {
  getAllSymbols,
  collectSymbolByCode,
  getSymbolShortCode,
  getSymbolQrPayload,
  getCollectedSymbols,
  addCollectedSymbol,
  clearCollectedSymbols,
} from "./systems/symbol-system";
import * as quests from "./systems/quest-system";
import * as frost from "./systems/frost-system";
import * as slede from "./systems/slede-system";
import * as brev from "./systems/brev-system";
import * as opplasing from "./systems/opplasing-system";
import type { IntroId } from "./systems/opplasing-system";
import * as krypto from "./systems/krypto-system";
import type { DecryptionValidationResult } from "./systems/krypto-system";
import * as stats from "./systems/stats-system";

export type { MetricDisplayType } from "./systems/stats-system";

export { runerFor } from "./systems/frost-system";
import type {
  GameState,
  QuestResult,
  ContentUnlockResult,
} from "./systems/quest-system";
import { ALLE_RUNER, getAllQuests } from "./data-loader";
import {
  Badge,
  Oppdrag,
  Varsel,
  InnsendelseLog,
  DecryptionSymbol,
} from "@/types/innhold";
import statiskInnhold from "@/data/statisk_innhold.json";
vedNavn(() => fyllDyp(statiskInnhold));
import type { Nivaa, Opplasing } from "./opplasinger";

const ALL_QUESTS = getAllQuests();

/** Answer from POST /api/kode (src/lib/kode.ts), or 429's wait. */
export type KodeSvar =
  | { ok: true; dag: number; kode: string }
  | { ok: true; bonus: number }
  | { ok: false; ventSek?: number; utlogget?: boolean };

/**
 * Dependencies that can be injected for testing or customization
 */
interface GameEngineDependencies {
  /** Checks a typed code; the default asks the server, tests check locally. */
  kodeSjekk?: (dag: number, kode: string) => Promise<KodeSvar>;
}

async function kodeSjekkServer(dag: number, kode: string): Promise<KodeSvar> {
  const r = await fetch("/api/kode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dag, kode }),
  });
  if (r.status === 429) return { ok: false, ...(await r.json()) };
  if (r.status === 401) return { ok: false, utlogget: true };
  if (!r.ok) throw new Error(`kode: ${r.status}`);
  return r.json();
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
   * GameEngine.configure({ kodeSjekk: async (dag, kode) => sjekkKode(dag, kode) });
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
    return quests.loadGameState();
  }

  /**
   * Check a typed code on the server and record the solve.
   * Bonus parent codes come back as bonusDag; the caller approves them.
   */
  static async submitCode(code: string, day: number): Promise<QuestResult> {
    const sjekk = this.dependencies.kodeSjekk ?? kodeSjekkServer;
    let svar: KodeSvar;
    try {
      svar = await sjekk(day, code);
    } catch {
      return {
        success: false,
        isNewCompletion: false,
        message: "KUNNE IKKE SJEKKE KODEN - PRØV IGJEN",
        nettfeil: true,
      };
    }
    if (!svar.ok) {
      if (svar.utlogget) {
        setSyncStatus("utlogget");
        return {
          success: false,
          isNewCompletion: false,
          message: "LOGG INN PÅ NYTT",
          utlogget: true,
        };
      }
      if (svar.ventSek)
        return {
          success: false,
          isNewCompletion: false,
          message: "FOR MANGE FORSØK - VENT LITT",
          ventSek: svar.ventSek,
        };
      StorageManager.incrementFailedAttempts(day);
      return {
        success: false,
        isNewCompletion: false,
        message: "FEIL KODE - PRØV IGJEN",
      };
    }
    if ("bonus" in svar)
      return {
        success: false,
        isNewCompletion: false,
        message: "BONUSKODE",
        bonusDag: svar.bonus,
      };

    return this.recordSolve(day, svar.kode);
  }

  /**
   * Record a solved day with its server-checked code (submitCode, or
   * sim.solveUntil with the codes from /api/kode/fasit).
   */
  static recordSolve(day: number, kode: string): QuestResult {
    return quests.recordSolve(day, kode);
  }

  /**
   * Check if a quest day is completed
   */
  static isQuestCompleted(day: number): boolean {
    return quests.isQuestCompleted(day);
  }

  /**
   * Get total number of completed quests
   */
  static getCompletedQuestCount(): number {
    return quests.getCompletedQuestCount();
  }

  static isJuliusVideoWatched(day: number): boolean {
    return StorageManager.getJuliusWatched().includes(day);
  }

  static markJuliusVideoWatched(day: number): void {
    StorageManager.markJuliusWatched(day);
  }

  /** One-off sequences: day-1 opener (T14) "boot" after the password and "tail" after Julius' video; "brev-tint" is Brevfugler's day-24 thaw; "ugle-k<n>" is Ugleposten's chapter opener. */
  static isIntroSeen(id: IntroId): boolean {
    return opplasing.isIntroSeen(id);
  }

  static markIntroSeen(id: IntroId): void {
    StorageManager.markIntroSeen(id);
  }

  /** Nudge level for one unlock today (lib/opplasinger.ts). */
  static getOpplasingNivaa(o: Opplasing, day = getCurrentDay()): Nivaa {
    return opplasing.getOpplasingNivaa(o, day);
  }

  /** Unlocks on a day a child may see now (after-code ones wait for the code). */
  static getOpplasinger(day: number, vindu?: string): Opplasing[] {
    return opplasing.getOpplasinger(day, vindu);
  }

  /** Highest nudge level among a window's unlocks (home tile). */
  static getNyttNivaa(vindu: string, day = getCurrentDay()): Nivaa {
    return opplasing.getNyttNivaa(vindu, day);
  }

  /** Opening a window counts as having seen everything unlocked in it so far. */
  static markOpplasingerSett(vindu: string, day = getCurrentDay()) {
    return opplasing.markOpplasingerSett(vindu, day);
  }

  /** Adventure (Ugleposten) save; null until the first move. */
  static getEventyrSave(): EventyrSave | null {
    return StorageManager.getEventyrSave();
  }

  static saveEventyr(save: EventyrSave): void {
    StorageManager.setEventyrSave(save);
  }

  /** Owl feathers found in Ugleposten (all chapters); FJAER_MAAL opens a MORO file. */
  static getUglefjaer(): number {
    return opplasing.getUglefjaer();
  }

  /** IQs sledesimulator: best score and bells per stage id, and per «Navn/etappe». */
  static getSledeResultater(): Record<string, SledeResultat> {
    return slede.getSledeResultater();
  }

  /** A player's best runs by stage id (empty when nobody is chosen). */
  static getSledeResultaterFor(
    spiller: string | null,
  ): Record<string, SledeResultat> {
    return slede.getSledeResultaterFor(spiller);
  }

  /**
   * Keeps the best of each; a worse run never lowers a saved result. With a
   * player the run is also kept under «Navn/etappe», and a cleared challenge is
   * remembered for the day even when the run itself was not a best.
   * Returns the player's record when there is one, else the family's.
   */
  static recordSledeResultat(
    etappe: string,
    poeng: number,
    bjeller: number,
    spiller?: string | null,
    utfordringDag?: number,
  ): SledeResultat {
    return slede.recordSledeResultat(
      etappe,
      poeng,
      bjeller,
      spiller,
      utfordringDag,
    );
  }

  /** Last player chosen on this screen; UI state, not game state. */
  static getSledeSpiller(): string | null {
    return slede.getSledeSpiller();
  }

  static setSledeSpiller(navn: string | null): void {
    return slede.setSledeSpiller(navn);
  }

  static getSkjermId(): string {
    return StorageManager.getSkjermId();
  }

  /** Frostgraden (0–100) for a day, or null on days 1–6 when it is hidden. */
  static getFrostLevel(day: number = getCurrentDay()): number | null {
    return frost.getFrostLevel(day);
  }

  static isFrostDay(day: number = getCurrentDay()): boolean {
    return isFrostDay(day);
  }

  /** Frost mode right now: level 1 on day 10, 2 on day 21, 0 otherwise or once solved. */
  static getFrostMode(): FrostMode {
    return frost.getFrostMode();
  }

  /** Parent kill switch («Frost av») for today. */
  static isFrostDisabledToday(): boolean {
    return StorageManager.getFrostOffDay() === getCurrentDay();
  }

  static setFrostDisabledToday(disabled: boolean): void {
    StorageManager.setFrostOffDay(disabled ? getCurrentDay() : 0);
  }

  /**
   * Runes learned so far: the letters of every solved word code (from the
   * submitted codes; the browser knows no other code), plus E and T on day 1.
   * Day 5 (number code) and day 22 (number cards) teach none.
   */
  static getLearnedRunes(): Set<string> {
    return frost.getLearnedRunes();
  }

  /** Every rune the season teaches (all 19), for the board and the stats. */
  static getTaughtRunes(): ReadonlySet<string> {
    return ALLE_RUNER;
  }

  static getCompletedDays(): Set<number> {
    return quests.getCompletedDays();
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
    return quests.isBonusOppdragCompleted(quest);
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
    return quests.getJuliusPs(day);
  }

  /**
   * Check if a bonus quest is accessible (main quest must be completed)
   */
  static isBonusOppdragAccessible(day: number): boolean {
    return this.isQuestCompleted(day);
  }

  /**
   * Check if a module is unlocked
   */
  static isModuleUnlocked(moduleId: string): boolean {
    return this.getUnlockedModules().includes(moduleId);
  }

  /** December day a module opens (its quest's reveals), null if never. */
  static getModuleUnlockDay(moduleId: string): number | null {
    return quests.getModuleUnlockDay(moduleId);
  }

  /**
   * Get all unlocked modules
   */
  static getUnlockedModules(): string[] {
    return quests.getUnlockedModules();
  }

  static markEmailAsViewed(day: number, isBonusOppdrag: boolean = false): void {
    if (isBonusOppdrag) {
      StorageManager.markBonusOppdragEmailAsViewed(day);
    } else {
      StorageManager.markEmailAsViewed(day);
    }
  }

  static isEmailViewed(day: number): boolean {
    return StorageManager.isEmailViewed(day);
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

  static getSantaLetters(): SantaLetter[] {
    return brev.getSantaLetters();
  }

  static addSantaLetter(day: number, content: string, from?: string): void {
    return brev.addSantaLetter(day, content, from);
  }

  /**
   * Save complete set of Santa letters (replaces existing)
   */
  static saveSantaLetters(letters: SantaLetter[]): void {
    StorageManager.saveSantaLetters(letters);
  }

  /**
   * ============================================================
   * CRISIS MANAGEMENT
   * ============================================================
   */

  /**
   * ============================================================
   * NEW: CONTENT UNLOCK SYSTEM
   * ============================================================
   */

  /**
   * Process content unlocks when a quest is completed
   */
  static processContentUnlocks(day: number): void {
    return quests.processContentUnlocks(day);
  }

  /**
   * Decryption challenges for NisseKrypto, from the morning of their day.
   * `requiredSymbols` keeps the data order, because `correctSequence` indexes
   * into it (not into the order the cards were scanned).
   */
  static getDecryptionChallenges(currentDay: number): Array<{
    challengeId: string;
    day: number;
    title: string;
    hint: string;
    requiredSymbols: DecryptionSymbol[];
    missingCount: number;
    isSolved: boolean;
  }> {
    return krypto.getDecryptionChallenges(currentDay);
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
    return krypto.validateDecryptionSequence(challengeId, userSequence);
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
  public static getSymbolShortCode = getSymbolShortCode;
  public static getSymbolQrPayload = getSymbolQrPayload;

  public static collectSymbolByCode(code: string) {
    // Day gating only in December; outside the season parents can test freely
    const day = getCurrentMonth() === 12 ? getCurrentDay() : 24;
    const result = collectSymbolByCode(code, day);
    if (result.success) {
      BadgeManager.checkAndAwardAllEligibleBadges();
    }
    return result;
  }

  /**
   * Get newly unlocked content for a completed quest
   */
  static getNewlyUnlockedContent(day: number): ContentUnlockResult {
    return quests.getNewlyUnlockedContent(day);
  }

  /**
   * Check if a file is unlocked (accessible in NisseNet)
   */
  static isFileUnlocked(fileId: string, currentDay: number): boolean {
    return krypto.isFileUnlocked(fileId, currentDay);
  }

  /**
   * Get unread file count for NisseNet badge
   */
  static getUnreadFileCount(): number {
    return krypto.getUnreadFileCount();
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
    return brev.getPlayerNames();
  }

  static setPlayerNames(names: string[]): void {
    return brev.setPlayerNames(names);
  }

  static addEarnedBadge(badgeId: string): void {
    StorageManager.addEarnedBadge(badgeId);
  }

  static removeEarnedBadge(badgeId: string): void {
    StorageManager.removeEarnedBadge(badgeId);
  }

  static getAllBadges() {
    return BadgeManager.getAllBadges();
  }

  static getBadge(badgeId: string) {
    return BadgeManager.getBadge(badgeId);
  }

  static getEarnedBadges() {
    return BadgeManager.getEarnedBadges();
  }

  static resetAllBadges(): void {
    BadgeManager.resetAllBadges();
  }

  /**
   * Badges are derived from synced solves: award what is due and celebrate
   * what this screen has not shown yet. Idempotent; run after every sync.
   */
  static awardDueBadges(): void {
    BadgeManager.checkAndAwardAllEligibleBadges();
  }

  static onBadgeAwarded(callback: (badge: Badge) => void): void {
    BadgeManager.onBadgeAwarded(callback);
    BadgeManager.announceUnseen();
  }

  static offBadgeAwarded(callback: (badge: Badge) => void): void {
    BadgeManager.offBadgeAwarded(callback);
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
    return quests.getProgressionPercentage();
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
   * Get detailed progression summary
   */
  static getProgressionSummary() {
    return quests.getProgressionSummary();
  }

  /**
   * ============================================================
   * DATA MANAGEMENT
   * ============================================================
   */

  /** Full game state as plain data (Simulering's øyeblikksbilde) */
  static getSnapshot(): Record<string, unknown> {
    return StorageManager.snapshot();
  }

  static restoreSnapshot(data: Record<string, unknown>): void {
    StorageManager.restoreSnapshot(data);
  }

  /** Clears all progress on every screen (parent guide, Tidsmaskin). */
  static resetProgress(): Promise<void> {
    return StorageManager.clearAll(true);
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
    return opplasing.getDailyAlerts(day, completedDays);
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

  /** Real-time countdown to Christmas Eve (date-utils.christmasCountdown). */
  static getChristmasCountdown() {
    return christmasCountdown(getCurrentDate());
  }

  /**
   * NisseStats metrics: a sigmoid from min to max over December with a small
   * bonus per solved code, or a live value when `kilde` names one (frost,
   * line warmth, runes, Kulde's ghost images). Filtered by unlock_day.
   */
  static getGlobalProductionMetrics(day: number, completedQuestCount: number) {
    return stats.getGlobalProductionMetrics(day, completedQuestCount);
  }
}

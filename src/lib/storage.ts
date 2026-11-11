/**
 * Storage Layer - Centralized state management
 *
 * This module provides a single source of truth for all persistent state.
 * Supports pluggable storage backends via adapter pattern:
 * - localStorage (default): Browser-only storage
 *
 * Usage:
 * - All storage access goes through this module
 * - Never access localStorage or storage adapters directly in components
 * - Switch backend via NEXT_PUBLIC_STORAGE_BACKEND environment variable
 */

import { InnsendelseLog, DecryptionSymbol } from "@/types/innhold";
import { getISOString } from "./date-utils";
import {
  createStorageAdapter,
  ServerSyncAdapter,
  type StorageAdapter,
} from "./storage-adapter";

/** Best run per stage in IQs sledesimulator (0–3 bells). */
export interface SledeResultat {
  poeng: number;
  bjeller: number;
}

/** A letter to Julius. Letters from before 2026 have no `from`. */
export interface SantaLetter {
  day: number;
  from?: string;
  content: string;
}

// Storage keys
const KEYS = {
  AUTHENTICATED: "nissekomm-authenticated",
  SUBMITTED_CODES: "nissekomm-codes",
  VIEWED_EMAILS: "nissekomm-viewed-emails",
  VIEWED_BONUSOPPDRAG_EMAILS: "nissekomm-viewed-bonusoppdrag-emails",
  SOUNDS_ENABLED: "nissekomm-sounds-enabled",
  MUSIC_ENABLED: "nissekomm-music-enabled",
  BONUSOPPDRAG_COMPLETED: "nissekomm-bonusoppdrag-completed",
  EARNED_BADGES: "nissekomm-earned-badges",
  TOPIC_UNLOCKS: "nissekomm-topic-unlocks",
  // NEW: Multi-day narrative system keys
  UNLOCKED_FILES: "nissekomm-unlocked-files",
  COLLECTED_SYMBOLS: "nissekomm-collected-symbols",
  SOLVED_DECRYPTIONS: "nissekomm-solved-decryptions",
  DECRYPTION_ATTEMPTS: "nissekomm-decryption-attempts",
  FAILED_ATTEMPTS: "nissekomm-failed-attempts",
  NISSENET_LAST_VISIT: "nissekomm-nissenet-last-visit",
  PLAYER_NAMES: "nissekomm-player-names",
  NICE_LIST_LAST_VIEWED: "nissekomm-nice-list-viewed",
  JULIUS_WATCHED: "nissekomm-julius-watched",
  FROST_OFF_DAY: "nissekomm-frost-off-day",
  UNLOCKED_MODULES: "nissekomm-unlocked-modules",
  SANTA_LETTERS: "nissekomm-santa-letters",
  INTROS_SEEN: "nissekomm-intros-seen",
  SLEDE: "nissekomm-slede",
  IDLE_PEEK: "nissekomm-idle-peek",
  SEASON: "nissekomm-season",
} as const;

const SEASON = 2026;

// Everything a season builds up. Login and sound settings survive a new season.
const SEASON_KEYS = Object.values(KEYS).filter(
  (k) =>
    k !== KEYS.AUTHENTICATED &&
    k !== KEYS.SOUNDS_ENABLED &&
    k !== KEYS.MUSIC_ENABLED &&
    k !== KEYS.SEASON,
);

// Type-safe storage interface
interface StorageData {
  authenticated: boolean;
  submittedCodes: InnsendelseLog[];
  viewedEmails: number[]; // Array of day numbers
  soundsEnabled: boolean;
  musicEnabled: boolean;
}

/**
 * Storage Manager Class
 * Handles all persistence operations with type safety
 */
export class StorageManager {
  private static adapter: StorageAdapter = createStorageAdapter();
  private static seasonChecked = false;

  /** Last year's progress must not carry over: wipe it once when the season changes. */
  private static ensureSeason(): void {
    if (this.seasonChecked || typeof window === "undefined") return;
    this.seasonChecked = true;
    if (this.adapter.get<number | null>(KEYS.SEASON, null) === SEASON) return;
    SEASON_KEYS.forEach((k) => this.adapter.remove(k));
    this.adapter.set(KEYS.SEASON, SEASON);
  }

  // ============================================================
  // Generic Helper Methods (now using adapter)
  // ============================================================

  /**
   * Generic set item using storage adapter
   */
  private static setItem<T>(key: string, value: T): void {
    this.ensureSeason();
    this.adapter.set(key, value);
  }

  /**
   * Generic get item using storage adapter
   */
  private static getItem<T>(key: string, defaultValue: T): T {
    this.ensureSeason();
    return this.adapter.get(key, defaultValue);
  }

  /**
   * Remove item from storage
   */
  private static removeItem(key: string): void {
    this.adapter.remove(key);
  }

  /**
   * Check if item exists in storage
   */
  private static hasItem(key: string): boolean {
    this.ensureSeason();
    return this.adapter.has(key);
  }

  // ============================================================
  // Authentication
  // ============================================================

  static isAuthenticated(): boolean {
    return this.getItem(KEYS.AUTHENTICATED, false);
  }

  static async setAuthenticated(value: boolean): Promise<void> {
    this.setItem(KEYS.AUTHENTICATED, value);
  }

  /**
   * Fetches the shared state from the server before game state is shown.
   * A no-op with STORAGE_BACKEND=localStorage or when offline.
   */
  static async sync(onChange?: () => void): Promise<void> {
    if (typeof window === "undefined") return;
    // Season wipe first: it is local, and must not reach the server.
    this.ensureSeason();
    if (this.adapter instanceof ServerSyncAdapter) {
      await this.adapter.start(onChange).catch(() => {});
    }
  }

  /** MCP set_frost, read-only here. */
  static getFrostOverride(): { active: boolean; until: string } | null {
    return this.getItem("frost-override", null);
  }

  static clearAuthentication(): void {
    this.removeItem(KEYS.AUTHENTICATED);
  }

  // ============================================================
  // Submitted Codes (Completed Missions)
  // ============================================================

  static getSubmittedCodes(): InnsendelseLog[] {
    if (typeof window === "undefined") return [];
    return this.getItem<InnsendelseLog[]>(KEYS.SUBMITTED_CODES, []);
  }

  static addSubmittedCode(code: InnsendelseLog): void {
    if (typeof window === "undefined") return;
    const codes = this.getSubmittedCodes();

    // Avoid duplicates
    if (!codes.some((c) => c.kode === code.kode && c.dato === code.dato)) {
      codes.push(code);
      this.setItem(KEYS.SUBMITTED_CODES, codes);
    }
  }

  static isCodeSubmitted(kode: string): boolean {
    return this.getSubmittedCodes().some((c) => c.kode === kode);
  }

  static getCompletedDaysForMissions(
    missions: Array<{ dag: number; kode: string }>,
  ): Set<number> {
    if (typeof window === "undefined") return new Set();

    const submittedCodes = this.getSubmittedCodes().map((c) =>
      c.kode.toUpperCase(),
    );
    const completedDays = new Set<number>();

    // Match submitted codes against missions
    missions.forEach((mission) => {
      if (submittedCodes.includes(mission.kode.toUpperCase())) {
        completedDays.add(mission.dag);
      }
    });

    return completedDays;
  }

  static clearSubmittedCodes(): void {
    if (typeof window === "undefined") return;
    this.removeItem(KEYS.SUBMITTED_CODES);
  }

  // ============================================================
  // Viewed Emails (NisseMail read status)
  // ============================================================

  static getViewedEmails(): Set<number> {
    if (typeof window === "undefined") return new Set();
    const array = this.getItem<number[]>(KEYS.VIEWED_EMAILS, []);
    return new Set(array);
  }

  static markEmailAsViewed(day: number): void {
    if (typeof window === "undefined") return;
    const viewed = this.getViewedEmails();
    viewed.add(day);
    this.setItem(KEYS.VIEWED_EMAILS, [...viewed]);
  }

  static isEmailViewed(day: number): boolean {
    return this.getViewedEmails().has(day);
  }

  static getUnreadEmailCount(
    currentDay: number,
    totalMissions: number,
    missions?: Array<{
      dag: number;
      kode?: string;
      bonusoppdrag?: object;
    }>,
  ): number {
    const viewed = this.getViewedEmails();
    const viewedBonusOppdrag = this.getViewedBonusOppdragEmails();
    const submittedCodes = this.getSubmittedCodes();
    let unreadCount = 0;

    for (let day = 1; day <= Math.min(currentDay, totalMissions); day++) {
      // Count unread main emails
      if (!viewed.has(day)) {
        unreadCount++;
      }

      // Count unread bonus quest emails if missions data provided
      if (missions) {
        const mission = missions.find((m) => m.dag === day);
        if (mission?.bonusoppdrag) {
          // Check if main quest is completed (to know if bonus quest is accessible)
          const isMainCompleted = submittedCodes.some(
            (c) =>
              c.day === day ||
              (mission.kode &&
                c.kode.toUpperCase() === mission.kode.toUpperCase()),
          );

          // Side-quest is accessible if main mission is completed
          if (isMainCompleted && !viewedBonusOppdrag.has(day)) {
            unreadCount++;
          }
        }
      }
    }

    return unreadCount;
  }

  static clearViewedEmails(): void {
    if (typeof window === "undefined") return;
    this.removeItem(KEYS.VIEWED_EMAILS);
  }

  // ============================================================
  // Bonusoppdrag Email Read Status
  // ============================================================

  static getViewedBonusOppdragEmails(): Set<number> {
    if (typeof window === "undefined") return new Set();
    const arr = this.getItem<number[]>(KEYS.VIEWED_BONUSOPPDRAG_EMAILS, []);
    return new Set(arr);
  }

  static markBonusOppdragEmailAsViewed(day: number): void {
    if (typeof window === "undefined") return;
    const viewed = this.getViewedBonusOppdragEmails();
    viewed.add(day);
    this.setItem(KEYS.VIEWED_BONUSOPPDRAG_EMAILS, [...viewed]);
  }

  static clearViewedBonusOppdragEmails(): void {
    if (typeof window === "undefined") return;
    this.removeItem(KEYS.VIEWED_BONUSOPPDRAG_EMAILS);
  }

  // ============================================================
  // Sound Settings
  // ============================================================

  static isSoundsEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return this.getItem<boolean>(KEYS.SOUNDS_ENABLED, true);
  }

  static setSoundsEnabled(value: boolean): void {
    if (typeof window === "undefined") return;
    this.setItem(KEYS.SOUNDS_ENABLED, value);
  }

  static isMusicEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return this.getItem<boolean>(KEYS.MUSIC_ENABLED, false);
  }

  static setMusicEnabled(value: boolean): void {
    if (typeof window === "undefined") return;
    this.setItem(KEYS.MUSIC_ENABLED, value);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get all storage data (useful for debugging or export)
   */
  static getAllData(): StorageData {
    return {
      authenticated: this.isAuthenticated(),
      submittedCodes: this.getSubmittedCodes(),
      viewedEmails: [...this.getViewedEmails()],
      soundsEnabled: this.isSoundsEnabled(),
      musicEnabled: this.isMusicEnabled(),
    };
  }

  /** Every stored key except login, for Simulering's øyeblikksbilde */
  static snapshot(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of Object.values(KEYS)) {
      if (k !== KEYS.AUTHENTICATED && this.adapter.has(k)) {
        out[k] = this.adapter.get(k, null);
      }
    }
    return out;
  }

  static restoreSnapshot(data: Record<string, unknown>): void {
    for (const k of Object.values(KEYS)) {
      if (k === KEYS.AUTHENTICATED) continue;
      if (k in data) this.adapter.set(k, data[k]);
      else this.adapter.remove(k);
    }
  }

  /** Clears this screen; with propagate also the shared state (reset). */
  static async clearAll(propagate = false): Promise<void> {
    if (typeof window === "undefined") return;
    await this.adapter.clear(propagate);
  }

  // ============================================================
  // Unlockable Modules
  // ============================================================

  static getUnlockedModules(): string[] {
    if (typeof window === "undefined") return [];
    return this.getItem<string[]>(KEYS.UNLOCKED_MODULES, []);
  }

  static unlockModule(moduleId: string): void {
    if (typeof window === "undefined") return;
    const modules = this.getUnlockedModules();
    if (!modules.includes(moduleId)) {
      modules.push(moduleId);
      this.setItem(KEYS.UNLOCKED_MODULES, modules);
    }
  }

  static isModuleUnlocked(moduleId: string): boolean {
    return this.getUnlockedModules().includes(moduleId);
  }

  // ============================================================
  // Santa Letters (BREVFUGLER Module)
  // ============================================================

  static getSantaLetters(): SantaLetter[] {
    if (typeof window === "undefined") return [];
    return this.getItem<SantaLetter[]>(KEYS.SANTA_LETTERS, []);
  }

  static saveSantaLetters(letters: SantaLetter[]): void {
    if (typeof window === "undefined") return;
    this.setItem(KEYS.SANTA_LETTERS, letters);
  }

  /** One letter per day and writer; a letter from the same writer the same day replaces it. */
  static addSantaLetter(day: number, content: string, from?: string): void {
    if (typeof window === "undefined") return;

    // Validate input
    if (day < 1 || day > 24) {
      console.error(`Invalid day number: ${day}. Must be between 1 and 24.`);
      return;
    }
    if (!content || content.trim().length === 0) {
      console.error("Cannot add empty letter content");
      return;
    }

    const letters = this.getSantaLetters();
    const letter: SantaLetter = from
      ? { day, from, content: content.trim() }
      : { day, content: content.trim() };
    // Replace in place so the order the children wrote in stays
    const i = letters.findIndex((l) => l.day === day && l.from === from);
    if (i >= 0) letters[i] = letter;
    else letters.push(letter);
    letters.sort((a, b) => a.day - b.day);
    this.saveSantaLetters(letters);
  }

  // ============================================================
  // Bonusoppdrag (parent-approved days)
  // ============================================================

  static getCompletedBonusOppdrag(): number[] {
    if (typeof window === "undefined") return [];
    return this.getItem<number[]>(KEYS.BONUSOPPDRAG_COMPLETED, []);
  }

  static completeBonusOppdrag(day: number): void {
    if (typeof window === "undefined") return;
    const days = this.getCompletedBonusOppdrag();
    if (!days.includes(day)) {
      this.setItem(KEYS.BONUSOPPDRAG_COMPLETED, [...days, day]);
    }
  }

  static revokeBonusOppdrag(day: number): void {
    if (typeof window === "undefined") return;
    this.setItem(
      KEYS.BONUSOPPDRAG_COMPLETED,
      this.getCompletedBonusOppdrag().filter((d) => d !== day),
    );
  }

  static isBonusOppdragCompleted(day: number): boolean {
    return this.getCompletedBonusOppdrag().includes(day);
  }

  // ============================================================
  // Unified Badge System (NEW - replaces separate badge storage)
  // ============================================================

  static getEarnedBadges(): Array<{ badgeId: string; timestamp: number }> {
    if (typeof window === "undefined") return [];
    return this.getItem<Array<{ badgeId: string; timestamp: number }>>(
      KEYS.EARNED_BADGES,
      [],
    );
  }

  static addEarnedBadge(badgeId: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEarnedBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.badgeId === badgeId)) {
      badges.push({ badgeId, timestamp: Date.now() });
      this.setItem(KEYS.EARNED_BADGES, badges);
    }
  }

  static hasEarnedBadge(badgeId: string): boolean {
    return this.getEarnedBadges().some((b) => b.badgeId === badgeId);
  }

  static removeEarnedBadge(badgeId: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEarnedBadges().filter((b) => b.badgeId !== badgeId);
    this.setItem(KEYS.EARNED_BADGES, badges);
  }

  static clearEarnedBadges(): void {
    if (typeof window === "undefined") return;
    this.removeItem(KEYS.EARNED_BADGES);
  }

  // ============================================================
  // Topic Unlocks (for cross-references)
  // ============================================================

  static getUnlockedTopics(): Map<string, number> {
    if (typeof window === "undefined") return new Map();
    const obj = this.getItem<Record<string, number>>(KEYS.TOPIC_UNLOCKS, {});
    return new Map(Object.entries(obj).map(([k, v]) => [k, v as number]));
  }

  static unlockTopic(topic: string, day: number): void {
    if (typeof window === "undefined") return;
    const topics = this.getUnlockedTopics();
    topics.set(topic, day);
    const obj = Object.fromEntries(topics);
    this.setItem(KEYS.TOPIC_UNLOCKS, obj);
  }

  static isTopicUnlocked(topic: string): boolean {
    return this.getUnlockedTopics().has(topic);
  }

  static getTopicUnlockDay(topic: string): number | null {
    return this.getUnlockedTopics().get(topic) || null;
  }

  // ============================================================
  // NEW: Symbol Collection System
  // ============================================================

  static getCollectedSymbols(): DecryptionSymbol[] {
    return this.getItem<DecryptionSymbol[]>(KEYS.COLLECTED_SYMBOLS, []);
  }

  static addCollectedSymbol(symbol: DecryptionSymbol): void {
    const symbols = this.getCollectedSymbols();
    // Avoid duplicates based on symbolId
    if (!symbols.some((s) => s.symbolId === symbol.symbolId)) {
      symbols.push(symbol);
      this.setItem(KEYS.COLLECTED_SYMBOLS, symbols);
    }
  }

  static hasSymbol(symbolId: string): boolean {
    return this.getCollectedSymbols().some((s) => s.symbolId === symbolId);
  }

  static clearCollectedSymbols(): void {
    this.removeItem(KEYS.COLLECTED_SYMBOLS);
  }

  // ============================================================
  // NEW: Decryption Challenge System
  // ============================================================

  static getSolvedDecryptions(): string[] {
    return this.getItem<string[]>(KEYS.SOLVED_DECRYPTIONS, []);
  }

  static addSolvedDecryption(challengeId: string): void {
    const solved = this.getSolvedDecryptions();
    if (!solved.includes(challengeId)) {
      solved.push(challengeId);
      this.setItem(KEYS.SOLVED_DECRYPTIONS, solved);
    }
  }

  static isDecryptionSolved(challengeId: string): boolean {
    return this.getSolvedDecryptions().includes(challengeId);
  }

  static getDecryptionAttempts(challengeId: string): number {
    const attempts = this.getItem<Record<string, number>>(
      KEYS.DECRYPTION_ATTEMPTS,
      {},
    );
    return attempts[challengeId] || 0;
  }

  static incrementDecryptionAttempts(challengeId: string): void {
    const attempts = this.getItem<Record<string, number>>(
      KEYS.DECRYPTION_ATTEMPTS,
      {},
    );
    attempts[challengeId] = (attempts[challengeId] || 0) + 1;
    this.setItem(KEYS.DECRYPTION_ATTEMPTS, attempts);
  }

  static clearDecryptionAttempts(): void {
    this.removeItem(KEYS.DECRYPTION_ATTEMPTS);
    this.removeItem(KEYS.SOLVED_DECRYPTIONS);
  }

  // ============================================================
  // NEW: File Unlock System
  // ============================================================

  static getUnlockedFiles(): string[] {
    return this.getItem<string[]>(KEYS.UNLOCKED_FILES, []);
  }

  static addUnlockedFile(fileId: string): void {
    const files = this.getUnlockedFiles();
    if (!files.includes(fileId)) {
      files.push(fileId);
      this.setItem(KEYS.UNLOCKED_FILES, files);
    }
  }

  static isFileUnlocked(fileId: string): boolean {
    return this.getUnlockedFiles().includes(fileId);
  }

  static clearUnlockedFiles(): void {
    this.removeItem(KEYS.UNLOCKED_FILES);
  }

  // ============================================================
  // NEW: Progressive Hints System
  // ============================================================

  static getFailedAttempts(day: number): number {
    const attempts = this.getItem<Record<number, number>>(
      KEYS.FAILED_ATTEMPTS,
      {},
    );
    return attempts[day] || 0;
  }

  static incrementFailedAttempts(day: number): void {
    const attempts = this.getItem<Record<number, number>>(
      KEYS.FAILED_ATTEMPTS,
      {},
    );
    attempts[day] = (attempts[day] || 0) + 1;
    this.setItem(KEYS.FAILED_ATTEMPTS, attempts);
  }

  static resetFailedAttempts(day: number): void {
    const attempts = this.getItem<Record<number, number>>(
      KEYS.FAILED_ATTEMPTS,
      {},
    );
    delete attempts[day];
    this.setItem(KEYS.FAILED_ATTEMPTS, attempts);
  }

  static clearAllFailedAttempts(): void {
    this.removeItem(KEYS.FAILED_ATTEMPTS);
  }

  // ============================================================
  // NEW: NisseNet Badge System (unread file tracking)
  // ============================================================

  static getNisseNetLastVisit(): number {
    return this.getItem<number>(KEYS.NISSENET_LAST_VISIT, 0);
  }

  static setNisseNetLastVisit(day: number): void {
    this.setItem(KEYS.NISSENET_LAST_VISIT, day);
  }

  // ============================================================
  // NEW: Player Names (for Day 23 nice list)
  // ============================================================

  static getPlayerNames(): string[] {
    return this.getItem<string[]>(KEYS.PLAYER_NAMES, []);
  }

  static setPlayerNames(names: string[]): void {
    // Filter empty strings and trim whitespace
    const cleanNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
    this.setItem(KEYS.PLAYER_NAMES, cleanNames);
  }

  static hasPlayerNames(): boolean {
    return this.getPlayerNames().length > 0;
  }

  static clearPlayerNames(): void {
    this.removeItem(KEYS.PLAYER_NAMES);
  }

  // ============================================================
  // Nice List Read Tracking (for Day 24 finale)
  // ============================================================

  /**
   * Mark the Nice List as viewed (called when file is opened)
   */
  static setNiceListViewed(): void {
    this.setItem(KEYS.NICE_LIST_LAST_VIEWED, getISOString());
  }

  /**
   * Check if Nice List has unread updates after Day 24 completion
   * Returns true if Day 24 is complete and list hasn't been viewed since completion
   */
  static hasUnreadNiceList(): boolean {
    // Check if Day 24 is completed
    const codes = this.getSubmittedCodes();
    const day24Code = codes.find(
      (c) => c.day === 24 || c.kode.toUpperCase() === "SNØFALLVENNER",
    );
    if (!day24Code) return false;

    // Get last viewed timestamp
    const lastViewed = this.getItem<string | null>(
      KEYS.NICE_LIST_LAST_VIEWED,
      null,
    );

    // If never viewed, it's unread
    if (!lastViewed) return true;

    // Compare timestamps: unread if Day 24 completed after last view
    const day24Timestamp = new Date(day24Code.dato).getTime();
    const lastViewedTimestamp = new Date(lastViewed).getTime();

    return day24Timestamp > lastViewedTimestamp;
  }

  // ============================================================
  // Julius' video diary
  // ============================================================

  static getJuliusWatched(): number[] {
    return this.getItem<number[]>(KEYS.JULIUS_WATCHED, []);
  }

  /** Day the parent switched frost off (0 = never). Per day so day 10 does not silence day 21. */
  static getFrostOffDay(): number {
    return this.getItem<number>(KEYS.FROST_OFF_DAY, 0);
  }

  static setFrostOffDay(day: number): void {
    this.setItem(KEYS.FROST_OFF_DAY, day);
  }

  /** One-off openers already shown this season (e.g. the day-1 boot). */
  static getIntrosSeen(): string[] {
    return this.getItem<string[]>(KEYS.INTROS_SEEN, []);
  }

  /** Time (ms) idle Rampenissen last peeked; UI state, see tidbits.ts. */
  static getIdlePeek(): number | null {
    return this.getItem<number | null>(KEYS.IDLE_PEEK, null);
  }

  static setIdlePeek(at: number): void {
    this.setItem(KEYS.IDLE_PEEK, at);
  }

  static markIntroSeen(id: string): void {
    const seen = this.getIntrosSeen();
    if (!seen.includes(id)) this.setItem(KEYS.INTROS_SEEN, [...seen, id]);
  }

  static getSledeResultater(): Record<string, SledeResultat> {
    return this.getItem<Record<string, SledeResultat>>(KEYS.SLEDE, {});
  }

  static setSledeResultat(etappe: string, r: SledeResultat): void {
    this.setItem(KEYS.SLEDE, { ...this.getSledeResultater(), [etappe]: r });
  }

  static markJuliusWatched(day: number): void {
    const watched = this.getJuliusWatched();
    if (!watched.includes(day)) {
      this.setItem(KEYS.JULIUS_WATCHED, [...watched, day]);
    }
  }
}

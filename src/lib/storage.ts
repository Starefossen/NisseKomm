/**
 * Storage Layer - Centralized state management
 *
 * This module provides a single source of truth for all persistent state.
 * Supports pluggable storage backends via adapter pattern:
 * - localStorage (default): Browser-only storage
 * - Sanity: Cross-device persistence via CMS backend
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
  type StorageAdapter,
  SanityStorageAdapter,
} from "./storage-adapter";

// Storage keys
const KEYS = {
  AUTHENTICATED: "nissekomm-authenticated",
  SUBMITTED_CODES: "nissekomm-codes",
  VIEWED_EMAILS: "nissekomm-viewed-emails",
  VIEWED_BONUSOPPDRAG_EMAILS: "nissekomm-viewed-bonusoppdrag-emails",
  SOUNDS_ENABLED: "nissekomm-sounds-enabled",
  MUSIC_ENABLED: "nissekomm-music-enabled",
  BONUSOPPDRAG_BADGES: "nissekomm-bonusoppdrag-badges",
  EVENTYR_BADGES: "nissekomm-eventyr-badges",
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
  DAGBOK_LAST_READ: "nissekomm-dagbok-last-read",
  BREVFUGLER: "nissekomm-brevfugler",
} as const;

// Type-safe storage interface
interface StorageData {
  authenticated: boolean;
  submittedCodes: InnsendelseLog[];
  viewedEmails: number[]; // Array of day numbers
  soundsEnabled: boolean;
  musicEnabled: boolean;
}

/**
 * Brevfugl entry type (parent-transcribed letters from children)
 */
interface Brevfugl {
  dag: number;
  innhold: string;
  tidspunkt: string; // ISO timestamp
}

/**
 * Storage Manager Class
 * Handles all persistence operations with type safety
 */
export class StorageManager {
  private static adapter: StorageAdapter = createStorageAdapter();

  // ============================================================
  // Generic Helper Methods (now using adapter)
  // ============================================================

  /**
   * Generic set item using storage adapter
   */
  private static setItem<T>(key: string, value: T): void {
    this.adapter.set(key, value);
  }

  /**
   * Generic get item using storage adapter
   */
  private static getItem<T>(key: string, defaultValue: T): T {
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
    return this.adapter.has(key);
  }

  // ============================================================
  // Authentication
  // ============================================================

  static isAuthenticated(): boolean {
    return this.getItem(KEYS.AUTHENTICATED, false);
  }

  static async setAuthenticated(
    value: boolean,
    sessionId?: string,
  ): Promise<void> {
    const backend = process.env.NEXT_PUBLIC_STORAGE_BACKEND || "localStorage";

    // If authenticating with sessionId, recreate adapter for session setup
    if (value && sessionId) {
      console.debug(
        `[StorageManager] Setting authenticated (${backend} mode) with sessionId:`,
        sessionId.substring(0, 8) + "...",
      );

      // CRITICAL: Save sessionId to cookie for persistence across page reloads
      const { setSessionId } = await import("./session-manager");
      setSessionId(sessionId);

      // CRITICAL: Wait for all pending syncs from ALL previous adapters before switching
      // This ensures multi-tenant data doesn't get lost during adapter switches
      if (backend === "sanity") {
        console.debug("[StorageManager] Waiting for pending syncs...");
        await SanityStorageAdapter.waitForAllPendingSyncs();
      }

      // Clear localStorage to ensure clean switch between tenants (Sanity mode only)
      if (backend === "sanity" && typeof window !== "undefined") {
        localStorage.clear();
      }

      console.debug("[StorageManager] Creating new storage adapter...");
      this.adapter = createStorageAdapter(sessionId);

      // Wait for Sanity adapter initialization to complete
      if (this.adapter instanceof SanityStorageAdapter) {
        console.debug("[StorageManager] Waiting for adapter initialization...");
        await this.adapter.waitForInitialization();
        console.debug("[StorageManager] Adapter initialization complete");
      }
    }

    this.setItem(KEYS.AUTHENTICATED, value);
  }

  static clearAuthentication(): void {
    this.removeItem(KEYS.AUTHENTICATED);
  }

  /**
   * Wait for all pending background syncs to complete (for testing)
   * Waits for syncs across ALL adapter instances, not just current one
   * This is critical for multi-tenant tests where adapters switch
   */
  static async waitForPendingSyncs(): Promise<void> {
    // Wait for syncs across ALL adapter instances (critical for multi-tenant tests)
    await SanityStorageAdapter.waitForAllPendingSyncs();
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
    missions?: Array<{ dag: number; bonusoppdrag?: { kode?: string } }>,
  ): number {
    const viewed = this.getViewedEmails();
    const viewedBonusOppdrag = this.getViewedBonusOppdragEmails();
    const completedCodes = this.getSubmittedCodes().map((c) => c.kode);
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
          const mainCode = missions.find((m) => m.dag === day);
          const isMainCompleted =
            mainCode &&
            completedCodes.includes(mission.bonusoppdrag.kode || "");

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

  /**
   * Clear all application data
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;

    // Clear all data through adapter
    this.adapter.clear();
  }

  // ============================================================
  // Unlockable Modules
  // ============================================================

  static getUnlockedModules(): string[] {
    if (typeof window === "undefined") return [];
    return this.getItem<string[]>("nissekomm-unlocked-modules", []);
  }

  static unlockModule(moduleId: string): void {
    if (typeof window === "undefined") return;
    const modules = this.getUnlockedModules();
    if (!modules.includes(moduleId)) {
      modules.push(moduleId);
      this.setItem("nissekomm-unlocked-modules", modules);
    }
  }

  static isModuleUnlocked(moduleId: string): boolean {
    return this.getUnlockedModules().includes(moduleId);
  }

  // ============================================================
  // Crisis Management
  // ============================================================

  static getCrisisStatus(): { antenna: boolean; inventory: boolean } {
    if (typeof window === "undefined")
      return { antenna: false, inventory: false };
    const status = this.getItem<{ antenna: boolean; inventory: boolean }>(
      "nissekomm-crisis-completed",
      { antenna: false, inventory: false },
    );
    // Validate structure to prevent corruption issues
    return {
      antenna: status.antenna === true,
      inventory: status.inventory === true,
    };
  }

  static resolveCrisis(crisisType: "antenna" | "inventory"): void {
    if (typeof window === "undefined") return;
    const status = this.getCrisisStatus();
    status[crisisType] = true;
    this.setItem("nissekomm-crisis-completed", status);
  }

  static isCrisisResolved(crisisType: "antenna" | "inventory"): boolean {
    return this.getCrisisStatus()[crisisType];
  }

  // ============================================================
  // Santa Letters (BREVFUGLER Module)
  // ============================================================

  static getSantaLetters(): Array<{ day: number; content: string }> {
    if (typeof window === "undefined") return [];
    return this.getItem<Array<{ day: number; content: string }>>(
      "nissekomm-santa-letters",
      [],
    );
  }

  static saveSantaLetters(
    letters: Array<{ day: number; content: string }>,
  ): void {
    if (typeof window === "undefined") return;
    this.setItem("nissekomm-santa-letters", letters);
  }

  static addSantaLetter(day: number, content: string): void {
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
    // Remove existing letter for this day if present
    const filtered = letters.filter((l) => l.day !== day);
    filtered.push({ day, content: content.trim() });
    // Sort by day
    filtered.sort((a, b) => a.day - b.day);
    this.saveSantaLetters(filtered);
  }

  // ============================================================
  // Bonusoppdrag Badges
  // ============================================================

  static getBonusOppdragBadges(): Array<{
    day: number;
    icon: string;
    navn: string;
  }> {
    if (typeof window === "undefined") return [];
    return this.getItem<Array<{ day: number; icon: string; navn: string }>>(
      KEYS.BONUSOPPDRAG_BADGES,
      [],
    );
  }

  static addBonusOppdragBadge(day: number, icon: string, navn: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getBonusOppdragBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.day === day)) {
      badges.push({ day, icon, navn });
      badges.sort((a, b) => a.day - b.day);
      this.setItem(KEYS.BONUSOPPDRAG_BADGES, badges);
    }
  }

  static hasBonusOppdragBadge(day: number): boolean {
    const badges = this.getBonusOppdragBadges();
    const result = badges.some((b) => {
      return b.day === day;
    });
    return result;
  }

  // ============================================================
  // Eventyr Badges (Story Arc Completion)
  // ============================================================

  static getEventyrBadges(): Array<{
    eventyrId: string;
    icon: string;
    navn: string;
  }> {
    if (typeof window === "undefined") return [];
    return this.getItem<
      Array<{ eventyrId: string; icon: string; navn: string }>
    >(KEYS.EVENTYR_BADGES, []);
  }

  static addEventyrBadge(eventyrId: string, icon: string, navn: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEventyrBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.eventyrId === eventyrId)) {
      badges.push({ eventyrId, icon, navn });
      this.setItem(KEYS.EVENTYR_BADGES, badges);
    }
  }

  static hasEventyrBadge(eventyrId: string): boolean {
    const badges = this.getEventyrBadges();
    return badges.some((b) => b.eventyrId === eventyrId);
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
    const day24Code = codes.find((c) => c.kode === "JULAFTEN");
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

  /**
   * Export data as JSON string (for backup or migration)
   */
  static exportData(): string {
    return JSON.stringify(this.getAllData(), null, 2);
  }

  /**
   * Import data from JSON string (for restore or migration)
   * Note: Does not import authentication state (requires password for multi-tenancy)
   */
  static async importData(jsonData: string): Promise<boolean> {
    try {
      const data: StorageData = JSON.parse(jsonData);

      // Skip authentication import - requires password for session setup
      // this.setAuthenticated(data.authenticated);

      this.setItem(KEYS.SUBMITTED_CODES, data.submittedCodes);
      this.setItem(KEYS.VIEWED_EMAILS, data.viewedEmails);
      this.setSoundsEnabled(data.soundsEnabled);
      this.setMusicEnabled(data.musicEnabled);

      return true;
    } catch (e) {
      console.error("Failed to import data:", e);
      return false;
    }
  }

  // ============================================================
  // Dagbok (Julius' Dagbok) Read Tracking
  // ============================================================

  /**
   * Get the last diary entry day that was read
   */
  static getDagbokLastRead(): number {
    return this.getItem<number>(KEYS.DAGBOK_LAST_READ, 0);
  }

  /**
   * Set the last diary entry day that was read
   */
  static setDagbokLastRead(day: number): void {
    this.setItem(KEYS.DAGBOK_LAST_READ, day);
  }

  /**
   * Get count of unread diary entries
   */
  static getUnreadDagbokCount(completedQuests: Set<number>): number {
    const lastRead = this.getDagbokLastRead();
    return Array.from(completedQuests).filter((day) => day > lastRead).length;
  }

  /**
   * Get completed quest days as a Set
   */
  static getCompletedQuestDays(): Set<number> {
    if (typeof window === "undefined") return new Set();

    // Note: This is a simplified version for compatibility
    // In production, prefer using GameEngine.loadGameState().completedQuests
    // which properly matches codes against mission data
    return new Set<number>();
  }

  // ============================================================
  // Brevfugler (Parent-transcribed letters from children)
  // ============================================================

  /**
   * Add a brevfugl letter (parent transcribes child's letter)
   */
  static leggTilBrevfugl(dag: number, innhold: string): void {
    const brevfugler = this.getItem<Brevfugl[]>(KEYS.BREVFUGLER, []);

    // Check if letter for this day already exists
    const existingIndex = brevfugler.findIndex((b) => b.dag === dag);

    const newBrevfugl: Brevfugl = {
      dag,
      innhold,
      tidspunkt: getISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing letter
      brevfugler[existingIndex] = newBrevfugl;
    } else {
      // Add new letter
      brevfugler.push(newBrevfugl);
    }

    // Sort by day
    brevfugler.sort((a, b) => a.dag - b.dag);

    this.setItem(KEYS.BREVFUGLER, brevfugler);
  }

  /**
   * Get all brevfugler letters
   */
  static hentAlleBrevfugler(): Brevfugl[] {
    return this.getItem<Brevfugl[]>(KEYS.BREVFUGLER, []);
  }

  /**
   * Get a specific brevfugl letter by day
   */
  static hentBrevfugl(dag: number): Brevfugl | null {
    const brevfugler = this.hentAlleBrevfugler();
    return brevfugler.find((b) => b.dag === dag) || null;
  }

  // ============================================================
  // Friend Names (for Nice List personalization)
  // ============================================================

  /**
   * Get friend names from Sanity session (async)
   * Returns empty array if using localStorage or if not available
   */
  static async getFriendNames(): Promise<string[]> {
    if (this.adapter instanceof SanityStorageAdapter) {
      await this.adapter.waitForInitialization();
      return this.adapter.getFriendNames();
    }
    return [];
  }

  /**
   * Set friend names in Sanity session (async)
   * No-op if using localStorage backend
   */
  static async setFriendNames(names: string[]): Promise<void> {
    if (this.adapter instanceof SanityStorageAdapter) {
      await this.adapter.waitForInitialization();
      await this.adapter.setFriendNames(names);
    }
  }
}

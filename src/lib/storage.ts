/**
 * Storage Layer - Centralized state management
 *
 * This module provides a single source of truth for all persistent state.
 * Currently uses localStorage, but designed to be easily replaced with
 * a backend API in the future.
 *
 * Usage:
 * - All localStorage access should go through this module
 * - Never access localStorage directly in components
 * - Easy migration path: replace localStorage calls with API calls
 */

import { InnsendelseLog, DecryptionSymbol } from "@/types/innhold";

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
} as const;

// Type-safe storage interface
interface StorageData {
  authenticated: boolean;
  submittedCodes: InnsendelseLog[];
  viewedEmails: number[]; // Array of day numbers
  soundsEnabled: boolean;
  musicEnabled: boolean;
}

// In-memory fallback storage (used when localStorage unavailable)
const inMemoryStorage = new Map<string, string>();

/**
 * Storage Manager Class
 * Handles all persistence operations with type safety
 */
export class StorageManager {
  // ============================================================
  // Generic Helper Methods (with error handling)
  // ============================================================

  /**
   * Generic set item with error handling and in-memory fallback
   */
  private static setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      inMemoryStorage.set(key, JSON.stringify(value));
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write to localStorage (${key}):`, error);
      inMemoryStorage.set(key, JSON.stringify(value));
    }
  }

  /**
   * Generic get item with error handling and in-memory fallback
   */
  private static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      const stored = inMemoryStorage.get(key);
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error);
      const stored = inMemoryStorage.get(key);
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    }
  }

  /**
   * Remove item from storage
   */
  private static removeItem(key: string): void {
    if (typeof window === "undefined") {
      inMemoryStorage.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
    }
    inMemoryStorage.delete(key);
  }

  /**
   * Check if item exists in storage
   */
  private static hasItem(key: string): boolean {
    if (typeof window === "undefined") {
      return inMemoryStorage.has(key);
    }
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return inMemoryStorage.has(key);
    }
  }

  // ============================================================
  // Authentication
  // ============================================================

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEYS.AUTHENTICATED) === "true";
  }

  static setAuthenticated(value: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.AUTHENTICATED, String(value));
  }

  static clearAuthentication(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.AUTHENTICATED);
  }

  // ============================================================
  // Submitted Codes (Completed Missions)
  // ============================================================

  static getSubmittedCodes(): InnsendelseLog[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(KEYS.SUBMITTED_CODES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse submitted codes:", e);
      return [];
    }
  }

  static addSubmittedCode(code: InnsendelseLog): void {
    if (typeof window === "undefined") return;
    const codes = this.getSubmittedCodes();

    // Avoid duplicates
    if (!codes.some((c) => c.kode === code.kode && c.dato === code.dato)) {
      codes.push(code);
      localStorage.setItem(KEYS.SUBMITTED_CODES, JSON.stringify(codes));
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
    localStorage.removeItem(KEYS.SUBMITTED_CODES);
  }

  // ============================================================
  // Viewed Emails (NisseMail read status)
  // ============================================================

  static getViewedEmails(): Set<number> {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(KEYS.VIEWED_EMAILS);
      const array = stored ? JSON.parse(stored) : [];
      return new Set(array);
    } catch (e) {
      console.error("Failed to parse viewed emails:", e);
      return new Set();
    }
  }

  static markEmailAsViewed(day: number): void {
    if (typeof window === "undefined") return;
    const viewed = this.getViewedEmails();
    viewed.add(day);
    localStorage.setItem(KEYS.VIEWED_EMAILS, JSON.stringify([...viewed]));
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
    localStorage.removeItem(KEYS.VIEWED_EMAILS);
  }

  // ============================================================
  // Bonusoppdrag Email Read Status
  // ============================================================

  static getViewedBonusOppdragEmails(): Set<number> {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(KEYS.VIEWED_BONUSOPPDRAG_EMAILS);
      if (stored) {
        const arr = JSON.parse(stored) as number[];
        return new Set(arr);
      }
    } catch {
      // Fallback to empty set on parse error
    }
    return new Set();
  }

  static markBonusOppdragEmailAsViewed(day: number): void {
    if (typeof window === "undefined") return;
    const viewed = this.getViewedBonusOppdragEmails();
    viewed.add(day);
    localStorage.setItem(
      KEYS.VIEWED_BONUSOPPDRAG_EMAILS,
      JSON.stringify([...viewed]),
    );
  }

  static clearViewedBonusOppdragEmails(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.VIEWED_BONUSOPPDRAG_EMAILS);
  }

  // ============================================================
  // Sound Settings
  // ============================================================

  static isSoundsEnabled(): boolean {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(KEYS.SOUNDS_ENABLED);
    return stored === null ? true : stored === "true";
  }

  static setSoundsEnabled(value: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.SOUNDS_ENABLED, String(value));
  }

  static isMusicEnabled(): boolean {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(KEYS.MUSIC_ENABLED);
    return stored === null ? false : stored === "true";
  }

  static setMusicEnabled(value: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.MUSIC_ENABLED, String(value));
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
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    // Also clear module/crisis/badge data
    localStorage.removeItem("nissekomm-unlocked-modules");
    localStorage.removeItem("nissekomm-crisis-completed");
    localStorage.removeItem("nissekomm-santa-letters");
    // Clear in-memory storage as well
    inMemoryStorage.clear();
  }

  // ============================================================
  // Unlockable Modules
  // ============================================================

  static getUnlockedModules(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem("nissekomm-unlocked-modules");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static unlockModule(moduleId: string): void {
    if (typeof window === "undefined") return;
    const modules = this.getUnlockedModules();
    if (!modules.includes(moduleId)) {
      modules.push(moduleId);
      localStorage.setItem(
        "nissekomm-unlocked-modules",
        JSON.stringify(modules),
      );
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
    try {
      const data = localStorage.getItem("nissekomm-crisis-completed");
      if (!data) return { antenna: false, inventory: false };

      const parsed = JSON.parse(data);
      // Validate structure to prevent corruption issues
      return {
        antenna: parsed.antenna === true,
        inventory: parsed.inventory === true,
      };
    } catch (error) {
      console.error("Failed to parse crisis status:", error);
      return { antenna: false, inventory: false };
    }
  }

  static resolveCrisis(crisisType: "antenna" | "inventory"): void {
    if (typeof window === "undefined") return;
    const status = this.getCrisisStatus();
    status[crisisType] = true;
    localStorage.setItem("nissekomm-crisis-completed", JSON.stringify(status));
  }

  static isCrisisResolved(crisisType: "antenna" | "inventory"): boolean {
    return this.getCrisisStatus()[crisisType];
  }

  // ============================================================
  // Santa Letters (BREVFUGLER Module)
  // ============================================================

  static getSantaLetters(): Array<{ day: number; content: string }> {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem("nissekomm-santa-letters");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSantaLetters(
    letters: Array<{ day: number; content: string }>,
  ): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("nissekomm-santa-letters", JSON.stringify(letters));
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
    try {
      const data = localStorage.getItem(KEYS.BONUSOPPDRAG_BADGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addBonusOppdragBadge(day: number, icon: string, navn: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getBonusOppdragBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.day === day)) {
      badges.push({ day, icon, navn });
      badges.sort((a, b) => a.day - b.day);
      localStorage.setItem(KEYS.BONUSOPPDRAG_BADGES, JSON.stringify(badges));
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
    try {
      const data = localStorage.getItem(KEYS.EVENTYR_BADGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addEventyrBadge(eventyrId: string, icon: string, navn: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEventyrBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.eventyrId === eventyrId)) {
      badges.push({ eventyrId, icon, navn });
      localStorage.setItem(KEYS.EVENTYR_BADGES, JSON.stringify(badges));
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
    try {
      const data = localStorage.getItem(KEYS.EARNED_BADGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addEarnedBadge(badgeId: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEarnedBadges();

    // Avoid duplicates
    if (!badges.some((b) => b.badgeId === badgeId)) {
      badges.push({ badgeId, timestamp: Date.now() });
      localStorage.setItem(KEYS.EARNED_BADGES, JSON.stringify(badges));
    }
  }

  static hasEarnedBadge(badgeId: string): boolean {
    return this.getEarnedBadges().some((b) => b.badgeId === badgeId);
  }

  static removeEarnedBadge(badgeId: string): void {
    if (typeof window === "undefined") return;
    const badges = this.getEarnedBadges().filter((b) => b.badgeId !== badgeId);
    localStorage.setItem(KEYS.EARNED_BADGES, JSON.stringify(badges));
  }

  static clearEarnedBadges(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.EARNED_BADGES);
  }

  // ============================================================
  // Topic Unlocks (for cross-references)
  // ============================================================

  static getUnlockedTopics(): Map<string, number> {
    if (typeof window === "undefined") return new Map();
    try {
      const data = localStorage.getItem(KEYS.TOPIC_UNLOCKS);
      if (!data) return new Map();
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj).map(([k, v]) => [k, v as number]));
    } catch {
      return new Map();
    }
  }

  static unlockTopic(topic: string, day: number): void {
    if (typeof window === "undefined") return;
    const topics = this.getUnlockedTopics();
    topics.set(topic, day);
    const obj = Object.fromEntries(topics);
    localStorage.setItem(KEYS.TOPIC_UNLOCKS, JSON.stringify(obj));
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
    this.setItem(KEYS.NICE_LIST_LAST_VIEWED, new Date().toISOString());
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
   */
  static importData(jsonData: string): boolean {
    try {
      const data: StorageData = JSON.parse(jsonData);

      this.setAuthenticated(data.authenticated);
      localStorage.setItem(
        KEYS.SUBMITTED_CODES,
        JSON.stringify(data.submittedCodes),
      );
      localStorage.setItem(
        KEYS.VIEWED_EMAILS,
        JSON.stringify(data.viewedEmails),
      );
      this.setSoundsEnabled(data.soundsEnabled);
      this.setMusicEnabled(data.musicEnabled);

      return true;
    } catch (e) {
      console.error("Failed to import data:", e);
      return false;
    }
  }

  // ============================================================
  // Dagbok (Julius' Diary) Read Tracking
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
  static getUnreadDiaryCount(completedQuests: Set<number>): number {
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
}

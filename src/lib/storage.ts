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

import { InnsendelseLog } from "@/types/innhold";

// Storage keys
const KEYS = {
  AUTHENTICATED: "nissekomm-authenticated",
  SUBMITTED_CODES: "nissekomm-codes",
  VIEWED_EMAILS: "nissekomm-viewed-emails",
  SOUNDS_ENABLED: "nissekomm-sounds-enabled",
  MUSIC_ENABLED: "nissekomm-music-enabled",
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
 * Storage Manager Class
 * Handles all persistence operations with type safety
 */
export class StorageManager {
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

  static getCompletedDays(): Set<number> {
    const codes = this.getSubmittedCodes();
    const days = new Set<number>();

    // Parse day from dato string (assuming format like "2025-12-03")
    codes.forEach((code, index) => {
      // Simple approach: use index + 1 as day number
      // TODO: Parse actual date when dato format is defined
      days.add(index + 1);
    });

    return days;
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
  ): number {
    const viewed = this.getViewedEmails();
    let unreadCount = 0;

    for (let day = 1; day <= Math.min(currentDay, totalMissions); day++) {
      if (!viewed.has(day)) {
        unreadCount++;
      }
    }

    return unreadCount;
  }

  static clearViewedEmails(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.VIEWED_EMAILS);
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
    // Also clear module/crisis data
    localStorage.removeItem("nissekomm-unlocked-modules");
    localStorage.removeItem("nissekomm-crisis-completed");
    localStorage.removeItem("nissekomm-santa-letters");
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
  // Santa Letters (NISSEBREV Module)
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
}

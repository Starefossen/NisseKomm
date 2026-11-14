/**
 * Badge System - Centralized badge management
 *
 * This module manages all badge awards, conditions, and notifications.
 * Badges (merker) are defined in data/merker.json and awarded based on:
 * - A solved decryption challenge (Varmebærer, day 12)
 * - A completed day (Portvokter, day 21)
 * - All 24 days completed (Snøfalls venn)
 *
 * Usage:
 * - BadgeManager.getAllBadges() - Get all badge definitions
 * - BadgeManager.getEarnedBadges() - Get player's earned badges
 * - BadgeManager.checkAndAwardBadge(badgeId) - Check conditions and award
 * - BadgeManager.isBadgeEarned(badgeId) - Check if badge is earned
 *
 * Integration points:
 * - GameEngine calls checkAndAwardBadge() after quest completion
 * - BadgeRow displays badges from getAllBadges() + getEarnedBadges()
 * - StorageManager persists earned badges in localStorage
 */

import badgeData from "@/data/merker.json";
import type { Badge, BadgeUnlockCondition, EarnedBadge } from "@/types/innhold";
import { StorageManager } from "@/lib/storage";
import { GameEngine } from "@/lib/game-engine";

/**
 * Badge award result with notification details
 */
export interface BadgeAwardResult {
  success: boolean;
  badge: Badge;
  isNewAward: boolean; // True if badge was just earned, false if already had it
  message: string;
}

/**
 * Badge notification event (can be listened to for UI animations)
 */
export type BadgeNotificationCallback = (badge: Badge) => void;

/**
 * Centralized Badge Manager
 * Handles all badge-related operations and business logic
 */
export class BadgeManager {
  private static notificationCallbacks: BadgeNotificationCallback[] = [];

  /**
   * Register a callback for badge award notifications
   * Useful for triggering UI animations when badges are earned
   */
  static onBadgeAwarded(callback: BadgeNotificationCallback): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Unregister a notification callback
   */
  static offBadgeAwarded(callback: BadgeNotificationCallback): void {
    this.notificationCallbacks = this.notificationCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  /**
   * Notify all listeners that a badge was awarded
   */
  private static notifyBadgeAwarded(badge: Badge): void {
    this.notificationCallbacks.forEach((callback) => callback(badge));
  }

  /**
   * Celebrates every earned badge this screen has not shown yet, once per
   * screen (local seen list), also when another screen earned it. Waits for
   * a listener (BadgeRow), so a badge synced before render is not lost.
   */
  static announceUnseen(): void {
    if (!this.notificationCallbacks.length) return;
    const seen = new Set(StorageManager.getBadgesSeen());
    const ny = this.getEarnedBadges()
      .map((b) => b.badgeId)
      .filter((id) => !seen.has(id));
    if (!ny.length) return;
    StorageManager.setBadgesSeen([...seen, ...ny]);
    for (const id of ny) {
      const b = this.getBadge(id);
      if (b) this.notifyBadgeAwarded(b);
    }
  }

  /**
   * Get all badge definitions from merker.json
   */
  static getAllBadges(): Badge[] {
    return badgeData.merker as Badge[];
  }

  /**
   * Get a specific badge by ID
   */
  static getBadge(badgeId: string): Badge | undefined {
    return badgeData.merker.find((b) => b.id === badgeId) as Badge | undefined;
  }

  /**
   * Get all badges earned by the player
   */
  static getEarnedBadges(): EarnedBadge[] {
    return StorageManager.getEarnedBadges();
  }

  /**
   * Check if a specific badge has been earned
   */
  static isBadgeEarned(badgeId: string): boolean {
    return StorageManager.hasEarnedBadge(badgeId);
  }

  /**
   * Evaluate if a badge's unlock condition is met
   * Does NOT check if badge is already earned - use isBadgeEarned() for that
   */
  static isUnlockConditionMet(condition: BadgeUnlockCondition): boolean {
    switch (condition.type) {
      case "decryptionSolved":
        return GameEngine.isDecryptionSolved(condition.challengeId);

      case "dayCompleted":
        return GameEngine.isQuestCompleted(condition.day);

      case "allQuestsCompleted":
        return GameEngine.isGameComplete();

      default:
        console.warn("Unknown badge unlock condition type:", condition);
        return false;
    }
  }

  /**
   * Check badge unlock condition and award badge if conditions are met
   * Returns result with success status and notification details
   *
   * This is the PRIMARY method for awarding badges - should be called:
   * - After a quest is completed
   * - After a decryption challenge is solved
   *
   * @param badgeId - The ID of the badge to award
   * @param bypassConditionCheck - If true, award badge without checking conditions (parent guide)
   */
  static checkAndAwardBadge(
    badgeId: string,
    bypassConditionCheck: boolean = false,
  ): BadgeAwardResult {
    const badge = this.getBadge(badgeId);

    if (!badge) {
      return {
        success: false,
        badge: {} as Badge,
        isNewAward: false,
        message: `Badge with ID "${badgeId}" not found`,
      };
    }

    // Check if already earned
    if (this.isBadgeEarned(badgeId)) {
      return {
        success: true,
        badge,
        isNewAward: false,
        message: `Badge "${badge.navn}" already earned`,
      };
    }

    // Check unlock condition (unless bypassed for parent validation)
    if (!bypassConditionCheck) {
      const conditionMet = this.isUnlockConditionMet(badge.unlockCondition);

      if (!conditionMet) {
        return {
          success: false,
          badge,
          isNewAward: false,
          message: `Badge "${badge.navn}" unlock condition not yet met`,
        };
      }
    }

    StorageManager.addEarnedBadge(badgeId);
    this.announceUnseen();

    return {
      success: true,
      badge,
      isNewAward: true,
      message: `Gratulerer! Du har låst opp merket "${badge.navn}"!`,
    };
  }

  /**
   * Check all badges and award any that have unlocked
   * Useful for periodic checks or after major game state changes
   * Returns array of newly awarded badges
   */
  static checkAndAwardAllEligibleBadges(): Badge[] {
    const newlyAwarded: Badge[] = [];

    for (const badge of this.getAllBadges()) {
      const result = this.checkAndAwardBadge(badge.id, false);
      if (result.success && result.isNewAward) {
        newlyAwarded.push(badge);
      }
    }
    this.announceUnseen();

    return newlyAwarded;
  }

  /**
   * Get progress stats for badge system
   */
  static getBadgeProgress(): {
    earned: number;
    total: number;
    percentage: number;
  } {
    const earned = this.getEarnedBadges().length;
    const total = this.getAllBadges().length;
    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

    return { earned, total, percentage };
  }

  /**
   * Reset all earned badges (for testing/demo purposes)
   */
  static resetAllBadges(): void {
    StorageManager.clearEarnedBadges();
    // Only log in non-test environments to reduce noise
    if (process.env.NODE_ENV !== "test") {
      console.log("All badges have been reset");
    }
  }
}

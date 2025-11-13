/**
 * Badge System - Centralized badge management
 *
 * This module manages all badge awards, conditions, and notifications.
 * Badges (merker) are defined in data/merker.json and awarded based on:
 * - Bonusoppdrag completion (parent-validated side quests)
 * - Eventyr completion (story arc achievements)
 * - Decryption challenges (all 3 challenges solved)
 * - Symbol collection (all 9 symbols collected)
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
      case "bonusoppdrag": {
        // Check if bonusoppdrag for this day is completed (parent validated)
        // We need to get the quest and check if bonusoppdrag is completed
        const quest = GameEngine.getAllQuests().find(
          (q) => q.dag === condition.day,
        );
        if (!quest || !quest.bonusoppdrag) return false;
        return GameEngine.isBonusOppdragCompleted(quest);
      }

      case "eventyr": {
        // Check if eventyr is completed (all phases done)
        const completedEventyr = GameEngine.getCompletedEventyr();
        return completedEventyr.includes(condition.eventyrId);
      }

      case "allDecryptionsSolved":
        // Check if all required decryption challenges are solved
        return GameEngine.isAllDecryptionsSolved();

      case "allSymbolsCollected":
        // Check if all required symbols are collected
        return GameEngine.isAllSymbolsCollected();

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
   * - After bonusoppdrag completion (parent validation)
   * - After eventyr completion (last phase)
   * - After decryption challenge solved
   * - After symbol collected
   *
   * @param badgeId - The ID of the badge to award
   * @param bypassConditionCheck - If true, award badge without checking conditions (for parent validation)
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

    // Award the badge!
    StorageManager.addEarnedBadge(badgeId);

    // If this is a bonusoppdrag badge, also store in legacy system and resolve crisis
    if (
      badge.type === "bonusoppdrag" &&
      badge.unlockCondition.type === "bonusoppdrag"
    ) {
      const day = badge.unlockCondition.day;

      // Store in legacy bonusoppdrag badge storage for isBonusOppdragCompleted compatibility
      StorageManager.addBonusOppdragBadge(day, badge.ikon, badge.navn);

      // Resolve the associated crisis
      const crisisType =
        badgeId === "antenne-ingenior"
          ? "antenna"
          : badgeId === "inventar-ekspert"
            ? "inventory"
            : null;

      if (crisisType) {
        StorageManager.resolveCrisis(crisisType);
      }
    }

    // Notify listeners for UI animations
    this.notifyBadgeAwarded(badge);

    return {
      success: true,
      badge,
      isNewAward: true,
      message: `🏅 Gratulerer! Du har låst opp merket "${badge.navn}"!`,
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
   * Get badges by type
   */
  static getBadgesByType(
    type: "bonusoppdrag" | "eventyr" | "decryption" | "collection",
  ): Badge[] {
    return this.getAllBadges().filter((b) => b.type === type);
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

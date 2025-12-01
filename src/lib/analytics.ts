/**
 * Analytics tracking utility for NisseKomm
 *
 * Wraps Vercel Analytics custom events with type-safe tracking
 * for all major user interactions and game milestones.
 *
 * USAGE:
 * import { trackEvent } from '@/lib/analytics';
 * trackEvent('code_submitted', { day: 1, success: true });
 */

import { track } from "@vercel/analytics";

/**
 * Event types for NisseKomm game interactions
 */
export type AnalyticsEventName =
  // Quest/Code Events
  | "code_submitted"
  | "code_success"
  | "code_failure"
  | "quest_completed"
  | "all_quests_completed"
  // Bonus Quest Events
  | "bonus_quest_started"
  | "bonus_quest_completed"
  | "crisis_resolved"
  // Story Events
  | "eventyr_started"
  | "eventyr_completed"
  | "eventyr_milestone"
  // Module/Window Events
  | "window_opened"
  | "window_closed"
  | "module_unlocked"
  // Symbol System Events
  | "symbol_scanned"
  | "symbol_collected"
  | "decryption_submitted"
  | "decryption_completed"
  // Calendar Events
  | "calendar_day_clicked"
  | "calendar_opened"
  // Mail Events
  | "mail_opened"
  | "mail_marked_read"
  | "dagbok_entry_read"
  // Badge Events
  | "badge_earned"
  | "badge_viewed"
  // Name Registration (Nice List)
  | "name_registered"
  | "grand_finale_viewed"
  // Authentication Events
  | "login_attempt"
  | "login_success"
  | "session_started"
  // Content Exploration
  | "feed_article_viewed"
  | "music_played"
  | "tv_video_watched"
  // Parent Guide Events
  | "guide_accessed"
  | "printout_generated";

/**
 * Event data types for different categories
 */
export interface AnalyticsEventData {
  // Quest events
  day?: number;
  success?: boolean;
  attempts?: number;
  code?: string;

  // Bonus quest events
  bonusQuestDay?: number;
  crisisType?: "antenna" | "inventory";

  // Story events
  eventyrId?: string;
  milestone?: string;

  // Window/Module events
  windowName?: string;
  moduleName?: string;

  // Symbol events
  symbolId?: string;
  symbolsCollected?: number;
  decryptionAttempts?: number;

  // Mail events
  emailDay?: number;
  emailType?: "quest" | "bonus" | "eventyr";

  // Badge events
  badgeType?: string;
  totalBadges?: number;

  // Name registration
  namesCount?: number;

  // Authentication
  authType?: "kid" | "parent";
  sessionId?: string;

  // Content
  contentId?: string;
  contentType?: string;

  // Generic properties
  location?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Track a custom analytics event
 *
 * @param eventName - The name of the event to track
 * @param data - Optional event data (properties limited by Vercel plan)
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  data?: AnalyticsEventData,
): void {
  // Skip tracking in development unless explicitly enabled
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_IN_DEV
  ) {
    console.log("[Analytics Dev]", eventName, data);
    return;
  }

  try {
    // Filter out undefined values and ensure data fits Vercel limitations
    const cleanData = data ? filterEventData(data) : undefined;

    track(eventName, cleanData);
  } catch (error) {
    console.error("[Analytics Error]", error);
  }
}

/**
 * Filter and sanitize event data to meet Vercel Analytics requirements:
 * - No nested objects
 * - Only strings, numbers, booleans, and null
 * - Max 255 characters per value
 * - Remove undefined values
 */
function filterEventData(
  data: AnalyticsEventData,
): Record<string, string | number | boolean | null> {
  const filtered: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Handle different value types
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      // Truncate strings longer than 255 characters
      if (typeof value === "string" && value.length > 255) {
        filtered[key] = value.substring(0, 255);
      } else {
        filtered[key] = value;
      }
    } else if (typeof value === "object" && value !== null) {
      // Flatten nested objects (metadata)
      // This is a simple flattening - only one level deep
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (
          typeof nestedValue === "string" ||
          typeof nestedValue === "number" ||
          typeof nestedValue === "boolean"
        ) {
          const combinedKey = `${key}_${nestedKey}`;
          if (typeof nestedValue === "string" && nestedValue.length > 255) {
            filtered[combinedKey] = nestedValue.substring(0, 255);
          } else {
            filtered[combinedKey] = nestedValue;
          }
        }
      }
    }
  }

  return filtered;
}

/**
 * Convenience functions for common tracking patterns
 */

export function trackCodeSubmission(
  day: number,
  success: boolean,
  attempts: number,
): void {
  const eventName = success ? "code_success" : "code_failure";
  trackEvent(eventName, { day, success, attempts });
}

export function trackWindowInteraction(
  windowName: string,
  action: "opened" | "closed",
): void {
  const eventName = action === "opened" ? "window_opened" : "window_closed";
  trackEvent(eventName, { windowName });
}

export function trackSymbolCollection(
  symbolId: string,
  symbolsCollected: number,
): void {
  trackEvent("symbol_collected", { symbolId, symbolsCollected });
}

export function trackBadgeEarned(badgeType: string, totalBadges: number): void {
  trackEvent("badge_earned", { badgeType, totalBadges });
}

/**
 * Eventy Management System
 *
 * Loads and provides access to story arc metadata from eventyr.json.
 * This separates narrative structure from mission data, making both more manageable.
 *
 * Days are derived from oppdrag files (single source of truth) rather than duplicated.
 */

import eventyrData from "@/data/eventyr.json";
import merkerData from "@/data/merker.json";
import type { EventyrData, Eventyr } from "@/types/innhold";
import { getAllOppdrag } from "@/lib/oppdrag";

// Load eventyr data at build time
const EVENTYR: EventyrData = eventyrData as EventyrData;

// Cache for derived eventyr-to-days mapping (computed once at module load)
const EVENTYR_DAYS_CACHE = new Map<string, number[]>();

/**
 * Build eventyr-to-days mapping from oppdrag files (single source of truth)
 * This runs once at module initialization
 */
function buildEventyrDaysMapping(): void {
  const allOppdrag = getAllOppdrag();

  allOppdrag.forEach((quest) => {
    if (quest.eventyr) {
      const eventyrId = quest.eventyr.id;
      if (!EVENTYR_DAYS_CACHE.has(eventyrId)) {
        EVENTYR_DAYS_CACHE.set(eventyrId, []);
      }
      EVENTYR_DAYS_CACHE.get(eventyrId)!.push(quest.dag);
    }
  });

  // Sort days for each eventyr
  EVENTYR_DAYS_CACHE.forEach((days) => days.sort((a, b) => a - b));
}

// Build mapping on module load
buildEventyrDaysMapping();

/**
 * Validate eventyr badges against merker.json at build time
 */
function validateEventyrBadges(): void {
  EVENTYR.eventyr.forEach((eventyr) => {
    if (eventyr.belønning.type === "badge") {
      const badgeId = eventyr.belønning.badge_id;

      // Check if badge_id is provided
      if (!badgeId) {
        throw new Error(
          `Validation Error: Eventyr "${eventyr.id}" has badge reward but missing badge_id`,
        );
      }

      // Check if badge exists in merker.json
      const badge = merkerData.merker.find((m) => m.id === badgeId);
      if (!badge) {
        throw new Error(
          `Validation Error: Eventyr "${eventyr.id}" references badge_id "${badgeId}" which does not exist in merker.json`,
        );
      }

      // Check if badge type is "eventyr"
      if (badge.type !== "eventyr") {
        throw new Error(
          `Validation Error: Eventyr "${eventyr.id}" references badge "${badgeId}" with type "${badge.type}", expected "eventyr"`,
        );
      }

      // Check if badge unlock condition matches eventyr ID
      if (
        badge.unlockCondition.type === "eventyr" &&
        badge.unlockCondition.eventyrId !== eventyr.id
      ) {
        throw new Error(
          `Validation Error: Badge "${badgeId}" unlock condition specifies eventyrId "${badge.unlockCondition.eventyrId}", but it's referenced by eventyr "${eventyr.id}"`,
        );
      }
    }
  });
}

// Validate badges on module load
validateEventyrBadges();

/**
 * Get days assigned to an eventyr (derived from oppdrag files)
 */
export function getEventyrDays(eventyrId: string): number[] {
  return EVENTYR_DAYS_CACHE.get(eventyrId) || [];
}

/**
 * Get all eventyr
 */
export function getAllEventyr(): Eventyr[] {
  return EVENTYR.eventyr;
}

/**
 * Get a specific eventyr by ID
 */
export function getEventyr(eventyrId: string): Eventyr | undefined {
  return EVENTYR.eventyr.find((eventyr) => eventyr.id === eventyrId);
}

/**
 * Get eventyr that include a specific day
 */
export function getEventyrForDay(day: number): Eventyr[] {
  return EVENTYR.eventyr.filter((eventyr) => {
    const days = getEventyrDays(eventyr.id);
    return days.includes(day);
  });
}

/**
 * Get eventyr color for UI styling
 */
export function getEventyrColor(eventyrId: string): string {
  const eventyr = getEventyr(eventyrId);
  return eventyr?.farge || "#666666";
}

/**
 * Get eventyr icon for UI display
 */
export function getEventyrIcon(eventyrId: string): string {
  const eventyr = getEventyr(eventyrId);
  return eventyr?.ikon || "help";
}

/**
 * Get parent guidance for an eventyr
 */
export function getParentGuidance(eventyrId: string) {
  const eventyr = getEventyr(eventyrId);
  return eventyr?.foreldreveiledning;
}

/**
 * Get eventyr reward information (internal use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEventyrReward(eventyrId: string) {
  const eventyr = getEventyr(eventyrId);
  return eventyr?.belønning;
}

/**
 * Check if all days in an eventyr are completed
 */
export function isEventyrComplete(
  eventyrId: string,
  completedDays: Set<number>,
): boolean {
  const days = getEventyrDays(eventyrId);
  if (days.length === 0) return false;

  return days.every((day) => completedDays.has(day));
}

/**
 * Get progress for an eventyr (percentage)
 */
export function getEventyrProgress(
  eventyrId: string,
  completedDays: Set<number>,
): number {
  const days = getEventyrDays(eventyrId);
  if (days.length === 0) return 0;

  const completedCount = days.filter((day) => completedDays.has(day)).length;
  return Math.round((completedCount / days.length) * 100);
}

/**
 * Get major eventyr (5 main narratives)
 */
export function getMajorEventyr(): Eventyr[] {
  return EVENTYR.eventyr.filter((eventyr) => {
    const days = getEventyrDays(eventyr.id);
    return !eventyr.id.startsWith("countdown") && days.length >= 3;
  });
}

/**
 * Get mini eventyr (shorter narratives)
 */
export function getMiniEventyr(): Eventyr[] {
  return EVENTYR.eventyr.filter((eventyr) => {
    const days = getEventyrDays(eventyr.id);
    return days.length < 3;
  });
}

/**
 * Get metadata about the eventyr system (internal use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEventyrMetadata() {
  return EVENTYR.metadata;
}

/**
 * Get pixelarticons icon name for reward type
 * Maps EventyrBeløning.type to valid pixelarticons names
 */
export function getRewardIcon(
  rewardType:
    | "badge"
    | "module_unlock"
    | "secret_unlock"
    | "symbol_collection"
    | "grand_finale",
): string {
  const iconMap: Record<string, string> = {
    badge: "trophy",
    module_unlock: "layout",
    secret_unlock: "lock-open",
    symbol_collection: "book",
    grand_finale: "gift",
  };

  return iconMap[rewardType] || "help";
}

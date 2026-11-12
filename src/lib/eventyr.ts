/**
 * Eventyr (story arc) data from eventyr.json
 *
 * 2026 has one story, «Spøkelseskoden», over all 24 days. Its days are derived
 * from the oppdrag files (single source of truth); its milestones (M1–M6) live
 * in eventyr.json.
 */

import eventyrData from "@/data/eventyr.json";
import merkerData from "@/data/merker.json";
import type { EventyrData, Eventyr } from "@/types/innhold";
import { getAllQuests as getAllOppdrag } from "@/lib/data-loader";

const EVENTYR: EventyrData = eventyrData as EventyrData;

const EVENTYR_DAYS_CACHE = new Map<string, number[]>();

function buildEventyrDaysMapping(): void {
  getAllOppdrag().forEach((quest) => {
    if (quest.eventyr) {
      const days = EVENTYR_DAYS_CACHE.get(quest.eventyr.id) ?? [];
      days.push(quest.dag);
      EVENTYR_DAYS_CACHE.set(quest.eventyr.id, days);
    }
  });
  EVENTYR_DAYS_CACHE.forEach((days) => days.sort((a, b) => a - b));

  EVENTYR.eventyr.forEach((eventyr) => {
    const firstDay = EVENTYR_DAYS_CACHE.get(eventyr.id)?.[0];
    if (firstDay !== undefined && eventyr.første_opplåsingsdag !== firstDay) {
      throw new Error(
        `Validation Error: Eventyr "${eventyr.id}" has første_opplåsingsdag=${eventyr.første_opplåsingsdag} but first quest day is ${firstDay}. Update eventyr.json to match.`,
      );
    }
    const badgeId = eventyr.belønning.badge_id;
    if (!merkerData.merker.some((m) => m.id === badgeId)) {
      throw new Error(
        `Validation Error: Eventyr "${eventyr.id}" references badge_id "${badgeId}" which does not exist in merker.json`,
      );
    }
  });
}

buildEventyrDaysMapping();

/**
 * Get days assigned to an eventyr (derived from oppdrag files)
 */
export function getEventyrDays(eventyrId: string): number[] {
  return EVENTYR_DAYS_CACHE.get(eventyrId) || [];
}

export function getAllEventyr(): Eventyr[] {
  return EVENTYR.eventyr;
}

export function getEventyr(eventyrId: string): Eventyr | undefined {
  return EVENTYR.eventyr.find((eventyr) => eventyr.id === eventyrId);
}

/**
 * Get eventyr that include a specific day
 */
export function getEventyrForDay(day: number): Eventyr[] {
  return EVENTYR.eventyr.filter((eventyr) =>
    getEventyrDays(eventyr.id).includes(day),
  );
}

/**
 * Get progress for an eventyr (percentage of days completed)
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

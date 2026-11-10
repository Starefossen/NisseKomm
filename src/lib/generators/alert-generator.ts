/**
 * Alert Generation Module
 *
 * Pure functions for generating system alerts and notifications.
 * All functions are stateless and return Varsel (alert) objects.
 *
 * ALERT TYPES:
 * - info: General information and milestone celebrations
 * - advarsel: Warnings that need attention
 * - kritisk: Critical issues requiring immediate action
 *
 * Source: daily_alerts in statisk_innhold.json
 */

import { Varsel } from "@/types/innhold";
import { getCurrentDate } from "../date-utils";

/**
 * Generate timestamp for alert in HH:MM format
 *
 * Uses current time from date-utils (respects mocking for testing).
 *
 * @returns Formatted timestamp string (e.g., "14:23")
 */
export function generateAlertTimestamp(): string {
  const now = getCurrentDate();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Convert daily alerts from static content into Varsel objects
 *
 * Takes raw alert data from statisk_innhold.json and converts it
 * into properly formatted Varsel objects with timestamps.
 *
 * @param dailyAlertsData - Raw alert data from static content
 * @param day - Current day (filters to show only alerts up to this day)
 * @returns Array of Varsel objects for historical feed
 */
export function convertDailyAlerts(
  dailyAlertsData: Array<{
    day: number;
    tekst: string;
    type: "info" | "advarsel" | "kritisk";
  }>,
  day: number,
): Varsel[] {
  return dailyAlertsData
    .filter((a) => a.day <= day)
    .map((dailyAlert) => ({
      tekst: dailyAlert.tekst,
      type: dailyAlert.type,
      tidspunkt: generateAlertTimestamp(),
      day: dailyAlert.day,
    }));
}

/**
 * Sort alerts by priority and day
 *
 * PRIORITY ORDER:
 * 1. kritisk (red, critical issues)
 * 2. advarsel (gold, warnings)
 * 3. info (green, general information)
 *
 * Within same priority, sorts by day (newest first).
 *
 * @param alerts - Array of alerts to sort
 * @returns Sorted array (in-place mutation)
 */
export function sortAlertsByPriority(alerts: Varsel[]): Varsel[] {
  const priorityOrder = { kritisk: 0, advarsel: 1, info: 2 };
  return alerts.sort((a, b) => {
    const priorityDiff = priorityOrder[a.type] - priorityOrder[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    return (b.day || 0) - (a.day || 0);
  });
}

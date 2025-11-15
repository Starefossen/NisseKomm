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
 * ALERT SOURCES:
 * 1. Crisis alerts (antenna failure, inventory chaos)
 * 2. Eventyr milestones (story arc completions)
 * 3. Daily narrative alerts (from static content)
 * 4. General milestones (Week 1 complete, Halfway, etc.)
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
 * Get crisis alerts for active crises
 *
 * CRISES:
 * - Antenna Crisis (Day 11): Time anomalies, affects NISSEKRAFT metrics
 * - Inventory Crisis (Day 16): System crash, affects GAVEPRODUKSJON metrics
 *
 * @param day - Current day (1-24)
 * @param crisisStatus - Object with antenna/inventory resolution status
 * @returns Array of kritisk alerts for active crises
 */
export function getCrisisAlerts(
  day: number,
  crisisStatus: { antenna: boolean; inventory: boolean },
): Varsel[] {
  const alerts: Varsel[] = [];

  // Antenna crisis (Day 11+)
  if (day >= 11 && !crisisStatus.antenna) {
    alerts.push({
      tekst: "⏰ KRITISK: TIDSANOMALIER - ANTENNE-SYSTEM NEDE!",
      type: "kritisk",
      tidspunkt: generateAlertTimestamp(),
      day: 11,
    });
  }

  // Inventory crisis (Day 16+)
  if (day >= 16 && !crisisStatus.inventory) {
    alerts.push({
      tekst: "🔧 KRITISK: INVENTAR-SYSTEM KRASJET - TRENGER HJELP!",
      type: "kritisk",
      tidspunkt: generateAlertTimestamp(),
      day: 16,
    });
  }

  return alerts;
}

/**
 * Get eventyr milestone celebration alerts
 *
 * Generates alerts when specific eventyr phases complete.
 * Each eventyr has 2-3 milestone moments that trigger celebration alerts.
 *
 * EVENTYR MILESTONES:
 * - Brevfugl-Mysteriet: Days 5, 12, 14
 * - IQs Oppfinnelser: Days 8, 19
 * - Mørkets Trussel: Days 7, 21
 * - Frosne Mønster: Days 9, 13
 * - Farge-Mysteriet: Days 10, 15
 * - Slede-Forberedelser: Days 18, 20
 *
 * @param day - Current day (1-24)
 * @param completedDays - Set of completed quest days
 * @returns Array of eventyr milestone alerts
 */
export function getEventyrMilepælVarsler(
  day: number,
  completedDays: Set<number>,
): Varsel[] {
  const milepælVarsler: Varsel[] = [];

  // Brevfugl-Mysteriet milestones
  if (day >= 5 && completedDays.has(5)) {
    milepælVarsler.push({
      tekst: "📬 WINTER: 847 brevfugler sortert! Organisasjon perfekt!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 5,
    });
  }

  if (day >= 12 && completedDays.has(12)) {
    milepælVarsler.push({
      tekst: "🎵 PIL: Sang-systemet aktivert! Brevfugler synger!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 12,
    });
  }

  if (day >= 14 && completedDays.has(14)) {
    milepælVarsler.push({
      tekst: "🦅 JULIUS: PAPIR-kode funnet! Brevfugl-mysteriet løst!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 14,
    });
  }

  // IQs Oppfinnelser milestones
  if (day >= 8 && completedDays.has(8)) {
    milepælVarsler.push({
      tekst:
        "🎒 IQ: Magisk sekk test vellyket! (Den passet ikke gjennom døra...)",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 8,
    });
  }

  if (day >= 19 && completedDays.has(19)) {
    milepælVarsler.push({
      tekst: "⚡ IQ: Reinsdyr-energidrikk fungerer! Rudolf løper i cirkler!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 19,
    });
  }

  // Mørkets Trussel milestones
  if (day >= 7 && completedDays.has(7)) {
    milepælVarsler.push({
      tekst: "🌑 ORAKELET: Mørket lurer der ute... Hold øye med Julestjerna!",
      type: "advarsel",
      tidspunkt: generateAlertTimestamp(),
      day: 7,
    });
  }

  if (day >= 21 && completedDays.has(21)) {
    milepælVarsler.push({
      tekst: "🦌 RUDOLF: Nesen min lyser igjen! Mørket spredd!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 21,
    });
  }

  // Frosne Mønster milestones
  if (day >= 9 && completedDays.has(9)) {
    milepælVarsler.push({
      tekst: "❄️ JULIUS: Fant 18 snøfnugg-hjørner! Mønstrene er vakre!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 9,
    });
  }

  if (day >= 13 && completedDays.has(13)) {
    milepælVarsler.push({
      tekst: "🕯️ LUCIA: Lysseremoni fullført! Sn</pelet stråler!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 13,
    });
  }

  // Farge-Mysteriet milestones
  if (day >= 10 && completedDays.has(10)) {
    milepælVarsler.push({
      tekst: "🌱 PIL: GRØNN dag! Miljøvennlig juleproduksjon!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 10,
    });
  }

  if (day >= 15 && completedDays.has(15)) {
    milepælVarsler.push({
      tekst: "🍫 WINTER: Sjokolademysteriet løst! Mandelen funnet!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 15,
    });
  }

  // Slede-Forberedelser milestones
  if (day >= 18 && completedDays.has(18)) {
    milepælVarsler.push({
      tekst: "🛷 JULIUS: Slede-dimensjoner sjekket! Alt målt og klart!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 18,
    });
  }

  if (day >= 20 && completedDays.has(20)) {
    milepælVarsler.push({
      tekst: "✨ NISSENE: Sleda er klar! Magiske egenskaper aktivert!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 20,
    });
  }

  return milepælVarsler;
}

/**
 * Get general milestone celebration alerts
 *
 * MILESTONES:
 * - Day 8: First week completed (7 quests done)
 * - Day 16: Halfway point reached (12 quests done)
 * - Day 22: Final countdown (2 days remaining)
 *
 * @param day - Current day (1-24)
 * @param completedDays - Set of completed quest days
 * @returns Array of milestone celebration alerts
 */
export function getGeneralMilestoneAlerts(
  day: number,
  completedDays: Set<number>,
): Varsel[] {
  const alerts: Varsel[] = [];

  // First week completed
  if (day >= 8 && completedDays.has(8)) {
    alerts.push({
      tekst: "🎉 NISSENE: Første uke fullført! Kaken var for stor...",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 8,
    });
  }

  // Halfway point
  if (day >= 16 && completedDays.has(16)) {
    alerts.push({
      tekst: "🎂 WINTER: Halvveis! Gaveproduksjon på topp!",
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day: 16,
    });
  }

  // Final countdown
  if (day >= 22 && completedDays.has(22)) {
    alerts.push({
      tekst: "⏰ ORAKELET: To dager! Magien intensiveres!",
      type: "advarsel",
      tidspunkt: generateAlertTimestamp(),
      day: 22,
    });
  }

  return alerts;
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

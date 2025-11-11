/**
 * Side-Quest Utilities
 *
 * Centralized logic for side-quest completion tracking.
 * This ensures consistency across NisseMail, Nissemor Guide, and other components.
 *
 * IMPORTANT: All side-quest data is derived from oppdrag JSON files (source of truth).
 * No hardcoded day numbers or badge information.
 */

import { StorageManager } from "./storage";
import { Oppdrag } from "@/types/innhold";
import { getAllOppdrag } from "./oppdrag";

/**
 * Get side-quest mission by crisis type from loaded mission data.
 * This is the single source of truth - data comes from JSON files.
 */
function getSideQuestMission(
  crisisType: "antenna" | "inventory",
): Oppdrag | null {
  const allMissions = getAllOppdrag();

  const crisisTitle =
    crisisType === "antenna"
      ? "KRITISK: Signal-krise"
      : "KRITISK: Inventar-kaos";

  // Find the first mission with this side-quest
  return allMissions.find((m) => m.sideoppdrag?.tittel === crisisTitle) || null;
}

/**
 * Check if a side-quest is completed (either by code submission or parent verification).
 */
export function isSideQuestCompleted(mission: Oppdrag): boolean {
  if (!mission.sideoppdrag) return false;

  if (mission.sideoppdrag.validering === "forelder") {
    // Parent-validated side-quests check for badge on the mission day
    return StorageManager.hasSideQuestBadge(mission.dag);
  } else if (mission.sideoppdrag.kode) {
    // Code-validated side-quests check for submitted code
    const submittedCodes = StorageManager.getSubmittedCodes().map(
      (c) => c.kode,
    );
    return submittedCodes.includes(mission.sideoppdrag.kode);
  }

  return false;
}

/**
 * Get side-quest definition by crisis type (for Nissemor Guide).
 * Derives all data from mission JSON files.
 */
export function getSideQuestDefinition(crisisType: "antenna" | "inventory") {
  const mission = getSideQuestMission(crisisType);

  if (!mission?.sideoppdrag) {
    throw new Error(
      `Side-quest mission not found for crisis type: ${crisisType}`,
    );
  }

  return {
    badgeDay: mission.dag,
    badgeIcon: mission.sideoppdrag.badge_icon,
    badgeName: mission.sideoppdrag.badge_navn,
    validationType: mission.sideoppdrag.validering,
  };
}

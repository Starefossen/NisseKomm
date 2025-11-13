/**
 * Oppdrag Loader - Validates and merges all weekly quest files
 *
 * This module imports all 4 weekly quest files (uke1-4_oppdrag.json),
 * validates the data structure, and exports a single sorted array of all 24 days.
 *
 * Build-time validation ensures:
 * - Exactly 24 days present (1-24)
 * - All codes are unique
 * - All required fields are populated
 * - No duplicate day numbers
 */

import type { Oppdrag } from "@/types/innhold";
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";
import merkerData from "@/data/merker.json";

// Type assertion for imported JSON
const week1 = uke1 as Oppdrag[];
const week2 = uke2 as Oppdrag[];
const week3 = uke3 as Oppdrag[];
const week4 = uke4 as Oppdrag[];

/**
 * Validates a single quest (oppdrag) has all required fields
 */
function validateOppdrag(oppdrag: Oppdrag, weekNumber: number): void {
  const requiredFields: (keyof Oppdrag)[] = [
    "dag",
    "tittel",
    "nissemail_tekst",
    "kode",
    "dagbokinnlegg",
    "rampenissen_rampestrek",
    "fysisk_hint",
    "oppsett_tid",
    "materialer_nødvendig",
    "beste_rom",
    "hint_type",
  ];

  for (const field of requiredFields) {
    if (
      oppdrag[field] === undefined ||
      oppdrag[field] === null ||
      oppdrag[field] === ""
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - Missing required field: ${field}`,
      );
    }
  }

  // Validate materialer_nødvendig is an array
  if (!Array.isArray(oppdrag.materialer_nødvendig)) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - materialer_nødvendig must be an array`,
    );
  }

  // Validate oppsett_tid is valid value
  const validOppsettTid = ["enkel", "moderat", "avansert"];
  if (!validOppsettTid.includes(oppdrag.oppsett_tid)) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - oppsett_tid must be one of: ${validOppsettTid.join(", ")}`,
    );
  }

  // Validate hint_type is valid value
  const validHintTypes = [
    "skrevet",
    "visuell",
    "gjemt_objekt",
    "arrangement",
    "spor",
    "lyd",
    "kombinasjon",
  ] as const;
  if (
    !validHintTypes.includes(
      oppdrag.hint_type as (typeof validHintTypes)[number],
    )
  ) {
    throw new Error(
      `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - hint_type must be one of: ${validHintTypes.join(", ")}`,
    );
  }

  // Validate side-quest structure if present
  if (oppdrag.bonusoppdrag) {
    const bonusoppdrag = oppdrag.bonusoppdrag;
    if (
      !bonusoppdrag.tittel ||
      !bonusoppdrag.beskrivelse ||
      !bonusoppdrag.validering ||
      !bonusoppdrag.badge_id ||
      !bonusoppdrag.badge_icon ||
      !bonusoppdrag.badge_navn
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag missing required fields (including badge_id)`,
      );
    }
    if (bonusoppdrag.validering === "kode" && !bonusoppdrag.kode) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag with validering="kode" must have kode field`,
      );
    }
    const validBadgeIcons = ["coin", "heart", "zap", "trophy", "gift", "star"];
    if (!validBadgeIcons.includes(bonusoppdrag.badge_icon)) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag.badge_icon must be one of: ${validBadgeIcons.join(", ")}`,
      );
    }

    // Validate badge_id exists in merker.json
    const badge = merkerData.merker.find((m) => m.id === bonusoppdrag.badge_id);
    if (!badge) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - bonusoppdrag.badge_id "${bonusoppdrag.badge_id}" not found in merker.json`,
      );
    }

    // Validate badge type is "bonusoppdrag"
    if (badge.type !== "bonusoppdrag") {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - badge "${bonusoppdrag.badge_id}" has type "${badge.type}", expected "bonusoppdrag"`,
      );
    }

    // Validate badge unlock condition matches this day
    if (
      badge.unlockCondition.type === "bonusoppdrag" &&
      badge.unlockCondition.day !== oppdrag.dag
    ) {
      throw new Error(
        `Validation Error: Week ${weekNumber}, Day ${oppdrag.dag} - badge "${bonusoppdrag.badge_id}" unlock condition specifies day ${badge.unlockCondition.day}, but bonusoppdrag is on day ${oppdrag.dag}`,
      );
    }
  }
}

/**
 * Merges and validates all weekly quest files
 */
function mergeAndValidate(): Oppdrag[] {
  // Validate each week's quests
  week1.forEach((oppdrag) => validateOppdrag(oppdrag, 1));
  week2.forEach((oppdrag) => validateOppdrag(oppdrag, 2));
  week3.forEach((oppdrag) => validateOppdrag(oppdrag, 3));
  week4.forEach((oppdrag) => validateOppdrag(oppdrag, 4));

  // Merge all weeks
  const allOppdrag = [...week1, ...week2, ...week3, ...week4];

  // Validate we have exactly 24 days
  if (allOppdrag.length !== 24) {
    throw new Error(
      `Validation Error: Expected 24 quests, found ${allOppdrag.length}. ` +
        `Week counts: W1=${week1.length}, W2=${week2.length}, W3=${week3.length}, W4=${week4.length}`,
    );
  }

  // Validate all day numbers 1-24 are present (no duplicates, no gaps)
  const dayNumbers = allOppdrag.map((o) => o.dag).sort((a, b) => a - b);
  for (let expectedDay = 1; expectedDay <= 24; expectedDay++) {
    if (!dayNumbers.includes(expectedDay)) {
      throw new Error(`Validation Error: Missing day ${expectedDay}`);
    }
  }

  // Check for duplicate day numbers
  const daySet = new Set(dayNumbers);
  if (daySet.size !== 24) {
    const duplicates = dayNumbers.filter(
      (day, index) => dayNumbers.indexOf(day) !== index,
    );
    throw new Error(
      `Validation Error: Duplicate day numbers found: ${duplicates.join(", ")}`,
    );
  }

  // Validate all codes are unique (case-insensitive)
  const codes = allOppdrag.map((o) => o.kode.toUpperCase());
  const codeSet = new Set(codes);
  if (codeSet.size !== allOppdrag.length) {
    const duplicateCodes: string[] = [];
    codes.forEach((code, index) => {
      if (codes.indexOf(code) !== index && !duplicateCodes.includes(code)) {
        duplicateCodes.push(code);
      }
    });
    throw new Error(
      `Validation Error: Duplicate codes found: ${duplicateCodes.join(", ")}. ` +
        `All 24 codes must be unique.`,
    );
  }

  // Sort by day number
  return allOppdrag.sort((a, b) => a.dag - b.dag);
}

// Build-time validation and export
const allOppdrag = mergeAndValidate();

/**
 * Get all 24 quests (oppdrag) in day order
 */
export function getAllOppdrag(): Oppdrag[] {
  return allOppdrag;
}

/**
 * Check if a specific day is completed (internal helper)
 */
function isDayCompleted(day: number, completedCodes: string[]): boolean {
  const oppdrag = allOppdrag.find((o) => o.dag === day);
  if (!oppdrag) return false;
  return completedCodes.some(
    (code) => code.toUpperCase() === oppdrag.kode.toUpperCase(),
  );
}

/**
 * Check if a side-quest is accessible (main quest must be completed first)
 * @public - Used by NisseMail component for sidequest visibility
 */
export function isBonusOppdragAccessible(
  day: number,
  completedCodes: string[],
): boolean {
  return isDayCompleted(day, completedCodes);
}

/**
 * Frost System
 *
 * Frostgraden and frost mode for a day, and the runes learned from solved
 * codes. Tables and rules live in lib/frost.ts; this module reads state.
 */

import { StorageManager } from "../storage";
import { getCurrentDate } from "../date-utils";
import { frostLevelFor, frostModeFor, type FrostMode } from "../frost";
import { getAllQuests } from "../data-loader";
import {
  getCompletedDays,
  isBonusOppdragCompleted,
  isQuestCompleted,
} from "./quest-system";

const ALL_QUESTS = getAllQuests();

/** Rune letters of the given solved days' codes; `kodeFor` looks a day's code up. */
export function runerFor(
  dager: Iterable<number>,
  kodeFor: (dag: number) => string | undefined,
): Set<string> {
  const learned = new Set<string>();
  for (const day of dager) {
    if (day === 5 || day === 22) continue;
    for (const ch of kodeFor(day)?.toUpperCase() ?? "")
      if (/[A-ZÆØÅ]/.test(ch)) learned.add(ch);
    if (day === 1) ["E", "T"].forEach((c) => learned.add(c));
  }
  return learned;
}

/** Frostgraden (0–100) for a day, or null on days 1–6 when it is hidden. */
export function getFrostLevel(day: number): number | null {
  const quest = ALL_QUESTS.find((q) => q.dag === day);
  return frostLevelFor(
    day,
    isQuestCompleted(day),
    quest ? isBonusOppdragCompleted(quest) : false,
  );
}

/** Frost mode right now: level 1 on day 10, 2 on day 21, 0 otherwise or once solved. */
export function getFrostMode(): FrostMode {
  const now = getCurrentDate();
  const day = now.getDate();
  const o = StorageManager.getFrostOverride();
  return frostModeFor({
    day,
    month: now.getMonth() + 1,
    hour: now.getHours(),
    solved: isQuestCompleted(day),
    disabled: StorageManager.getFrostOffDay() === day,
    override: o && new Date(o.until) > now ? o.active : undefined,
  });
}

/**
 * Runes learned so far: the letters of every solved word code (from the
 * submitted codes; the browser knows no other code), plus E and T on day 1.
 * Day 5 (number code) and day 22 (number cards) teach none.
 */
export function getLearnedRunes(): Set<string> {
  const koder = StorageManager.getSubmittedCodes();
  return runerFor(
    getCompletedDays(),
    (d) => koder.find((c) => c.day === d)?.kode,
  );
}

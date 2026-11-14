/**
 * Quest System
 *
 * Solved days, bonus quests, module and content unlocks, Julius' PS and
 * progression, all derived from the synced submitted codes. GameEngine is
 * the facade; UI calls it, not this module.
 */

import { StorageManager } from "../storage";
import { BadgeManager } from "../badge-system";
import { getEventyrDays } from "../eventyr";
import { getCurrentDay, getCurrentMonth, getISOString } from "../date-utils";
import { getAllQuests, getQuestByDay } from "../data-loader";
import type { Oppdrag } from "@/types/innhold";

const ALL_QUESTS = getAllQuests();

export interface GameState {
  completedQuests: Set<number>;
  submittedCodes: string[];
  completedBonusOppdrag: Set<number>;
  unlockedModules: Set<string>;
  viewedMainEmails: Set<number>;
  viewedBonusOppdragEmails: Set<number>;
  unlockedTopics: Map<string, number>;
  santaLetters: Array<{ day: number; content: string }>;
  completedEventyr: Set<string>;
}

export interface QuestResult {
  success: boolean;
  isNewCompletion: boolean;
  message: string;
  /** A bonus quest's parent code was typed: the day it approves. */
  bonusDag?: number;
  /** Too many tries: seconds to wait (the server's rate limit). */
  ventSek?: number;
  /** The check never got an answer (network, server error): not a wrong code. */
  nettfeil?: boolean;
  /** 401: the session is gone, the app shows the login again. */
  utlogget?: boolean;
}

export interface ContentUnlockResult {
  files: string[];
  symbols: Array<{ symbolId: string; symbolIcon: string; description: string }>;
  topics: string[];
}

/**
 * Load complete game state from storage
 */
export function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return getEmptyState();
  }

  const submittedCodes = StorageManager.getSubmittedCodes();
  const allQuests = ALL_QUESTS;

  const completedQuests = new Set<number>();
  // Every entry has its day: the server writes it (api/kode, api/state).
  submittedCodes.forEach((entry) => {
    if (entry.day !== undefined) completedQuests.add(entry.day);
  });

  const completedBonusOppdrag = new Set<number>();

  allQuests.forEach((quest) => {
    if (quest.bonusoppdrag) {
      const isCompleted = isBonusOppdragCompleted(quest);
      if (isCompleted) {
        completedBonusOppdrag.add(quest.dag);
      }
    }
  });

  // Compute eventyr completion using total phase count from getEventyrDays
  const eventyrIds = new Set<string>();
  allQuests.forEach((quest) => {
    if (quest.eventyr) {
      eventyrIds.add(quest.eventyr.id);
    }
  });

  const completedEventyrList: string[] = [];
  eventyrIds.forEach((eventyrId) => {
    const allDaysForEventyr = getEventyrDays(eventyrId);
    if (
      allDaysForEventyr.length > 0 &&
      allDaysForEventyr.every((day) => completedQuests.has(day))
    ) {
      completedEventyrList.push(eventyrId);
    }
  });

  return {
    completedQuests,
    submittedCodes: submittedCodes.map((c) => c.kode),
    completedBonusOppdrag,
    unlockedModules: new Set(modulesFor(completedQuests)),
    viewedMainEmails: StorageManager.getViewedEmails(),
    viewedBonusOppdragEmails: StorageManager.getViewedBonusOppdragEmails(),
    unlockedTopics: StorageManager.getUnlockedTopics(),
    santaLetters: StorageManager.getSantaLetters(),
    completedEventyr: new Set(completedEventyrList),
  };
}

function getEmptyState(): GameState {
  return {
    completedQuests: new Set(),
    submittedCodes: [],
    completedBonusOppdrag: new Set(),
    unlockedModules: new Set(),
    viewedMainEmails: new Set(),
    viewedBonusOppdragEmails: new Set(),
    unlockedTopics: new Map(),
    santaLetters: [],
    completedEventyr: new Set(),
  };
}

/**
 * Record a solved day with its server-checked code (submitCode, or
 * sim.solveUntil with the codes from /api/kode/fasit).
 */
export function recordSolve(day: number, kode: string): QuestResult {
  const currentState = loadGameState();
  const isNewCompletion = !currentState.completedQuests.has(day);

  if (!isNewCompletion) {
    // The solve may have reached this screen by sync (lost reply, other
    // screen): badges are derived, so award what is due.
    BadgeManager.checkAndAwardAllEligibleBadges();
    return {
      success: true,
      isNewCompletion: false,
      message: "KODEN ER ALLEREDE REGISTRERT",
    };
  }

  StorageManager.addSubmittedCode({
    kode,
    dato: getISOString(),
    day, // Store day for reliable matching
  });

  StorageManager.resetFailedAttempts(day);

  processContentUnlocks(day);

  BadgeManager.checkAndAwardAllEligibleBadges();

  return {
    success: true,
    isNewCompletion: true,
    message: "KODE AKSEPTERT!",
  };
}

export function isQuestCompleted(day: number): boolean {
  return loadGameState().completedQuests.has(day);
}

export function getCompletedQuestCount(): number {
  return loadGameState().completedQuests.size;
}

export function getCompletedDays(): Set<number> {
  return loadGameState().completedQuests;
}

export function isBonusOppdragCompleted(quest: Oppdrag): boolean {
  if (!quest.bonusoppdrag) return false;

  return StorageManager.isBonusOppdragCompleted(quest.dag);
}

/**
 * Julius' PS for a solved day: bonus variant once the bonus is approved,
 * "krypto mangler" variant while the day's decryption is still unsolved
 */
export function getJuliusPs(day: number): string | undefined {
  const quest = getQuestByDay(day);
  if (!quest) return undefined;
  if (quest.julius_ps_krypto_mangler) {
    // The most recent decryption before this day (day 20: stjernetegn)
    const latest = ALL_QUESTS.filter(
      (q) => q.dag <= day && q.decryption_challenge,
    ).at(-1)?.decryption_challenge;
    if (latest && !StorageManager.isDecryptionSolved(latest.challengeId)) {
      return quest.julius_ps_krypto_mangler;
    }
  }
  if (quest.julius_ps_bonus && isLyktBonusCompleted(day)) {
    return quest.julius_ps_bonus;
  }
  return quest.julius_ps;
}

// Day 11 PS follows its own bonus; days 16-19 follow the lantern (day 16)
function isLyktBonusCompleted(day: number): boolean {
  return StorageManager.isBonusOppdragCompleted(day >= 16 ? 16 : day);
}

/**
 * Derived, never stored, so a season reset on one screen applies on all:
 * a day's modules open on its morning in December (storyboard S1), or
 * once the day is solved.
 */
function modulesFor(solved: Set<number>): string[] {
  const des = getCurrentMonth() === 12;
  const day = getCurrentDay();
  return ALL_QUESTS.filter(
    (q) => solved.has(q.dag) || (des && q.dag <= day),
  ).flatMap((q) => q.reveals?.modules ?? []);
}

/** December day a module opens (its quest's reveals), null if never. */
export function getModuleUnlockDay(moduleId: string): number | null {
  return (
    ALL_QUESTS.find((q) => q.reveals?.modules?.includes(moduleId))?.dag ?? null
  );
}

export function getUnlockedModules(): string[] {
  if (typeof window === "undefined") return [];
  const solved = new Set(StorageManager.getSubmittedCodes().map((c) => c.day));
  return [...new Set(modulesFor(solved as Set<number>))];
}

/**
 * Process content unlocks when a quest is completed
 */
export function processContentUnlocks(day: number): void {
  const quest = getQuestByDay(day);
  if (!quest || !quest.reveals) return;

  if (quest.reveals.files) {
    quest.reveals.files.forEach((fileId) => {
      StorageManager.addUnlockedFile(fileId);
    });
  }

  if (quest.reveals.topics) {
    quest.reveals.topics.forEach((topic) => {
      StorageManager.unlockTopic(topic, day);
    });
  }

  // Symbols require physical collection (QR scanning or parent addition)
}

export function getNewlyUnlockedContent(day: number): ContentUnlockResult {
  const quest = getQuestByDay(day);
  if (!quest || !quest.reveals) {
    return { files: [], symbols: [], topics: [] };
  }

  return {
    files: quest.reveals.files || [],
    symbols: quest.symbol_clue ? [quest.symbol_clue] : [],
    topics: quest.reveals.topics || [],
  };
}

export function getProgressionPercentage(): number {
  return Math.round((getCompletedQuestCount() / 24) * 100);
}

export function getProgressionSummary() {
  const state = loadGameState();
  const allQuests = ALL_QUESTS;

  const bonusOppdragAvailable = allQuests.filter((q) => q.bonusoppdrag).length;
  const bonusOppdragCompleted = state.completedBonusOppdrag.size;

  // Get badge counts from BadgeManager (centralized badge system)
  const allBadges = BadgeManager.getAllBadges();
  const earnedBadges = BadgeManager.getEarnedBadges();

  return {
    mainQuests: {
      completed: state.completedQuests.size,
      total: 24,
      percentage: getProgressionPercentage(),
    },
    bonusOppdrag: {
      completed: bonusOppdragCompleted,
      available: bonusOppdragAvailable,
      percentage: Math.round(
        (bonusOppdragCompleted / bonusOppdragAvailable) * 100,
      ),
    },
    badges: {
      earned: earnedBadges.length,
      total: allBadges.length,
    },
    modules: {
      unlocked: state.unlockedModules.size,
      total: 7, // NISSEKRYPTO, SYMBOLSKANNER, NISSESPILL, SLEDEFLUKT, NISSEMUSIKK, BREVFUGLER, NISSESTATS
    },
    isComplete: getCompletedQuestCount() === 24,
  };
}

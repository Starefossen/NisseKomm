/**
 * Krypto System
 *
 * NisseKrypto challenges (symbol order puzzles) and the NisseNet files they
 * and the quests unlock.
 */

import { StorageManager } from "../storage";
import { BadgeManager } from "../badge-system";
import { findFileNode } from "../utils/file-tree-utils";
import { getAllQuests } from "../data-loader";
import type { DecryptionSymbol, FilNode } from "@/types/innhold";
import statiskInnhold from "@/data/statisk_innhold.json";
import { getAllSymbols } from "./symbol-system";
import { loadGameState } from "./quest-system";

const ALL_QUESTS = getAllQuests();

export interface DecryptionValidationResult {
  correct: boolean;
  message: string;
  correctCount: number;
}

export function getDecryptionChallenges(currentDay: number): Array<{
  challengeId: string;
  day: number;
  title: string;
  hint: string;
  requiredSymbols: DecryptionSymbol[];
  missingCount: number;
  isSolved: boolean;
}> {
  const all = getAllSymbols();
  return ALL_QUESTS.filter(
    (q) => q.decryption_challenge && q.dag <= currentDay,
  ).map((q) => {
    const c = q.decryption_challenge!;
    return {
      challengeId: c.challengeId,
      day: q.dag,
      title: q.tittel,
      hint: c.hint,
      requiredSymbols: c.requiredSymbols
        .map((id) => all.find((s) => s.symbolId === id))
        .filter((s): s is DecryptionSymbol => !!s),
      missingCount: c.requiredSymbols.filter(
        (id) => !StorageManager.hasSymbol(id),
      ).length,
      isSolved: StorageManager.isDecryptionSolved(c.challengeId),
    };
  });
}

export function validateDecryptionSequence(
  challengeId: string,
  userSequence: number[],
): DecryptionValidationResult {
  const quest = ALL_QUESTS.find(
    (q) => q.decryption_challenge?.challengeId === challengeId,
  );

  if (!quest?.decryption_challenge) {
    return {
      correct: false,
      message: "Ukjent dekrypteringsutfordring",
      correctCount: 0,
    };
  }

  const challenge = quest.decryption_challenge;

  if (StorageManager.isDecryptionSolved(challengeId)) {
    return {
      correct: true,
      message: "Allerede løst!",
      correctCount: challenge.correctSequence.length,
    };
  }

  if (userSequence.length !== challenge.correctSequence.length) {
    StorageManager.incrementDecryptionAttempts(challengeId);
    return {
      correct: false,
      message: "Feil antall symboler",
      correctCount: 0,
    };
  }

  let correctCount = 0;
  for (let i = 0; i < userSequence.length; i++) {
    if (userSequence[i] === challenge.correctSequence[i]) {
      correctCount++;
    }
  }

  const isCorrect = correctCount === challenge.correctSequence.length;

  if (isCorrect) {
    StorageManager.addSolvedDecryption(challengeId);
    if (challenge.unlocksFiles) {
      challenge.unlocksFiles.forEach((fileId) => {
        StorageManager.addUnlockedFile(fileId);
      });
    }
    BadgeManager.checkAndAwardAllEligibleBadges();
    return {
      correct: true,
      message: challenge.rewardText,
      correctCount,
    };
  } else {
    StorageManager.incrementDecryptionAttempts(challengeId);
    return {
      correct: false,
      message: `${correctCount} av ${challenge.correctSequence.length} symboler korrekt plassert!`,
      correctCount,
    };
  }
}

export function isFileUnlocked(fileId: string, currentDay: number): boolean {
  // Check if file was explicitly unlocked via reveals
  if (StorageManager.isFileUnlocked(fileId)) {
    return true;
  }

  // Check file's unlock conditions from static content
  const fileNode = findFileNode(fileId, statiskInnhold.filer as FilNode[]);
  if (!fileNode || !fileNode.unlockConditions) {
    return true; // No conditions = always accessible
  }

  const conditions = fileNode.unlockConditions;

  // Derived from the synced solve, not only the solving screen's file list.
  if (conditions.requiresSolvedDecryption) {
    return StorageManager.isDecryptionSolved(
      conditions.requiresSolvedDecryption,
    );
  }

  // Check day requirement
  if (conditions.afterDay && currentDay < conditions.afterDay) {
    return false;
  }

  // Check topic requirements
  if (conditions.requiresTopics) {
    const unlockedTopics = StorageManager.getUnlockedTopics();
    const hasAllTopics = conditions.requiresTopics.every((topic: string) =>
      unlockedTopics.has(topic),
    );
    if (!hasAllTopics) {
      return false;
    }
  }

  return true;
}

export function getUnreadFileCount(): number {
  const lastVisit = StorageManager.getNisseNetLastVisit();
  const completedQuests = loadGameState().completedQuests;

  // Count files unlocked since last visit
  let unreadCount = 0;
  ALL_QUESTS.forEach((quest) => {
    if (
      completedQuests.has(quest.dag) &&
      quest.dag > lastVisit &&
      quest.reveals?.files
    ) {
      unreadCount += quest.reveals.files.length;
    }
  });

  return unreadCount;
}

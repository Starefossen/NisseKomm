/**
 * NisseKomm Data Loader
 *
 * Centralized quest data loading and validation.
 * Separates data import/validation from game logic.
 */

import {
  validateOppdrag,
  validateFileReferences,
  validateTopicDependencies,
  validateEventyrReferences,
  validateEventyr,
  validateSymbolReferences,
  validateQuestCollection,
} from "./validators/quest-validator";
import { extractFileIds } from "./utils/file-tree-utils";
import { Oppdrag, FilNode } from "@/types/innhold";

import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";
import statiskInnhold from "@/data/statisk_innhold.json";

const week1 = uke1 as Oppdrag[];
const week2 = uke2 as Oppdrag[];
const week3 = uke3 as Oppdrag[];
const week4 = uke4 as Oppdrag[];

/**
 * Merge and validate all weekly quest files
 * Runs comprehensive build-time validation
 */
export function mergeAndValidate(): Oppdrag[] {
  week1.forEach((oppdrag) => validateOppdrag(oppdrag, 1));
  week2.forEach((oppdrag) => validateOppdrag(oppdrag, 2));
  week3.forEach((oppdrag) => validateOppdrag(oppdrag, 3));
  week4.forEach((oppdrag) => validateOppdrag(oppdrag, 4));

  const allOppdrag = [...week1, ...week2, ...week3, ...week4];

  validateQuestCollection(allOppdrag, {
    week1: week1.length,
    week2: week2.length,
    week3: week3.length,
    week4: week4.length,
  });

  try {
    const fileTree = statiskInnhold.filer as FilNode[];
    const availableFiles = extractFileIds(fileTree);

    validateFileReferences(allOppdrag, availableFiles);
    validateTopicDependencies(allOppdrag);
    validateEventyrReferences(allOppdrag);
    validateEventyr(allOppdrag);
    validateSymbolReferences(allOppdrag);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Multi-day narrative validation failed: ${error.message}`,
      );
    }
    throw error;
  }

  return allOppdrag.sort((a, b) => a.dag - b.dag);
}

const ALL_QUESTS = mergeAndValidate();

export function getAllQuests(): Oppdrag[] {
  return ALL_QUESTS;
}

export function getQuestByDay(day: number): Oppdrag | undefined {
  return ALL_QUESTS.find((q) => q.dag === day);
}

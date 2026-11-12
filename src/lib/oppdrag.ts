/**
 * The full quests, server only: day codes, parent fields and bonus parent
 * codes. Client code reads src/lib/data-loader.ts (oppdrag-klient.json),
 * which has none of them; scripts/sjekk-klientkoder.mjs fails the build check
 * if a code reaches a client bundle anyway.
 */
import "server-only";
import type { FilNode, OppdragFull } from "@/types/innhold";
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
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";
import statiskInnhold from "@/data/statisk_innhold.json";

const uker = [uke1, uke2, uke3, uke4] as OppdragFull[][];

function mergeAndValidate(): OppdragFull[] {
  uker.forEach((uke, i) => uke.forEach((o) => validateOppdrag(o, i + 1)));
  const alle = uker.flat();
  validateQuestCollection(alle, {
    week1: uke1.length,
    week2: uke2.length,
    week3: uke3.length,
    week4: uke4.length,
  });
  validateFileReferences(
    alle,
    extractFileIds(statiskInnhold.filer as FilNode[]),
  );
  validateTopicDependencies(alle);
  validateEventyrReferences(alle);
  validateEventyr(alle);
  validateSymbolReferences(alle);
  return alle.sort((a, b) => a.dag - b.dag);
}

const ALLE = mergeAndValidate();

export function getAllOppdrag(): OppdragFull[] {
  return ALLE;
}

export function getOppdrag(dag: number): OppdragFull | undefined {
  return ALLE.find((o) => o.dag === dag);
}

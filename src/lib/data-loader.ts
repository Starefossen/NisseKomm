/**
 * The quests as the kids' browser may see them: no day codes, no parent
 * fields (baked by scripts/oppdrag-klient.mjs from uke*_oppdrag.json).
 * Server code that needs the code reads src/lib/oppdrag.ts.
 */
import type { Oppdrag } from "@/types/innhold";
import klient from "@/data/oppdrag-klient.json";
import { fyllDyp, vedNavn } from "@/lib/navn";
vedNavn(() => fyllDyp(klient));

const ALL_QUESTS = klient.oppdrag as Oppdrag[];

/** Every rune letter the season teaches (all codes' letters, minus day 5 and 22). */
export const ALLE_RUNER: ReadonlySet<string> = new Set(klient.runer);

export function getAllQuests(): Oppdrag[] {
  return ALL_QUESTS;
}

export function getQuestByDay(day: number): Oppdrag | undefined {
  return ALL_QUESTS.find((q) => q.dag === day);
}

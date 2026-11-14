/**
 * Brev System
 *
 * Letters to Julius and the Nice List names. Stored names may be tokens
 * (scripts/navn-loader.cjs); reads and writes go through fyll().
 */

import { fyll } from "@/lib/navn";
import { StorageManager, type SantaLetter } from "../storage";

export function getSantaLetters(): SantaLetter[] {
  return StorageManager.getSantaLetters().map((l) =>
    l.from ? { ...l, from: fyll(l.from) } : l,
  );
}

export function addSantaLetter(
  day: number,
  content: string,
  from?: string,
): void {
  StorageManager.addSantaLetter(day, content, from && fyll(from));
}

export function getPlayerNames(): string[] {
  return StorageManager.getPlayerNames().map(fyll);
}

export function setPlayerNames(names: string[]): void {
  StorageManager.setPlayerNames(names.map(fyll));
}

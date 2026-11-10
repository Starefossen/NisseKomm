import { GameEngine } from "@/lib/game-engine";

// TODO(lane 2, frost/Frostgrad): replace this stub with
// GameEngine.getFrostLevel() when it lands.

/** Stub: frost rises 5 % a day and each solved code takes 3 % back. */
export function getFrostLevel(day: number): number {
  const solved = GameEngine.getCompletedDays().size;
  return Math.max(0, Math.min(100, day * 5 - solved * 3));
}

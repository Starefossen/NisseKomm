import data from "@/data/tidbits.json";
import { fyllDyp, vedNavn } from "@/lib/navn";
vedNavn(() => fyllDyp(data));
import type { Tidbit, Tidbits } from "@/types/tidbits";

/** Content only; schema in docs/tidbits.md. */
export const TIDBITS = data as Tidbits;

/** Entries visible on `day` (fraDag <= day <= tilDag). */
export function visible<T extends Tidbit>(list: T[], day: number): T[] {
  return list.filter((t) => t.fraDag <= day && day <= (t.tilDag ?? 24));
}

const norm = (s: string) => s.trim().toUpperCase();

/** KodeTerminal reply to a secret word, or null. */
export function secretReply(input: string, day: number): string | null {
  return (
    visible(TIDBITS.terminal.hemmeligeOrd, day).find((h) =>
      h.ord.some((o) => norm(o) === norm(input)),
    )?.tekst ?? null
  );
}

/** Line `n` of a rotating list; null when nothing is visible yet. */
export function rotate(list: Tidbit[], n: number, day: number): string | null {
  const v = visible(list, day);
  return v.length ? v[n % v.length].tekst : null;
}

export const passwordOk = (passord: string, input: string) =>
  norm(passord) === norm(input);

export const IDLE_MS = TIDBITS.idle.minutter * 60_000;
const HOUR = 3_600_000;

/** Idle Rampenissen peeks at most once an hour. */
export const peekAllowed = (lastPeek: number | null, now: number) =>
  lastPeek === null || now - lastPeek >= HOUR;

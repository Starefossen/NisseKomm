/**
 * Day-code check, server only. The kids' browser never holds a code it has
 * not typed: KodeTerminal asks POST /api/kode, which answers with this.
 */
import "server-only";
import { getAllOppdrag } from "./oppdrag";
import { effektivDag, getServerDate, testEnv } from "./date-utils";

export type KodeSvar =
  | { ok: true; dag: number; kode: string } // the day's code, canonical spelling
  | { ok: true; bonus: number } // a bonus quest's parent code, for that day
  | { ok: false };

export function sjekkKode(dag: number, kode: string): KodeSvar {
  const k = kode.trim().toUpperCase();
  if (!k) return { ok: false };
  const alle = getAllOppdrag();
  const q = alle.find((o) => o.dag === dag);
  if (q && q.kode.toUpperCase() === k)
    return { ok: true, dag, kode: q.kode.toUpperCase() };
  const b = alle.find((o) => o.bonusoppdrag?.foreldre_kode.toUpperCase() === k);
  return b ? { ok: true, bonus: b.dag } : { ok: false };
}

const VINDU_MS = 60_000;
const MAKS = 10;
// One bucket per role: one family, so a new login or a made-up cookie gives no
// fresh tries. Only wrong answers count.
// ponytail: per-process map; fine with one replica, move to the store if that changes.
const feil = new Map<string, number[]>();

const ferske = (nøkkel: string, nå: number) => {
  const t = (feil.get(nøkkel) ?? []).filter((x) => nå - x < VINDU_MS);
  if (t.length) feil.set(nøkkel, t);
  else feil.delete(nøkkel);
  return t;
};

/** Seconds to wait before the next try, or 0 when it may go ahead. */
export function ventSek(nøkkel: string, nå = Date.now()): number {
  const t = ferske(nøkkel, nå);
  return t.length >= MAKS ? Math.ceil((t[0] + VINDU_MS - nå) / 1000) : 0;
}

/** Counts a wrong answer against the bucket. */
export function feilForsøk(nøkkel: string, nå = Date.now()): void {
  feil.set(nøkkel, [...ferske(nøkkel, nå), nå]);
}

/**
 * Days whose code may be tried now: up to today's advent day (server clock,
 * MCP skip_day offset included); every day in test mode.
 */
export function åpenTilDag(dayOffset: unknown): number {
  if (testEnv(process.env.NEXT_PUBLIC_TEST_MODE) === "true") return 24;
  return effektivDag(getServerDate(dayOffset));
}

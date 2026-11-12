/**
 * Day-code check, server only. The kids' browser never holds a code it has
 * not typed: KodeTerminal asks POST /api/kode, which answers with this.
 */
import "server-only";
import { getAllOppdrag } from "./oppdrag";

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
// ponytail: per-process map; fine with one replica, move to the store if that changes.
const forsøk = new Map<string, number[]>();

/** Seconds to wait before the next try, or 0 when this one may go ahead. */
export function ventSek(nøkkel: string, nå = Date.now()): number {
  const t = (forsøk.get(nøkkel) ?? []).filter((x) => nå - x < VINDU_MS);
  if (t.length >= MAKS) {
    forsøk.set(nøkkel, t);
    return Math.ceil((t[0] + VINDU_MS - nå) / 1000);
  }
  t.push(nå);
  forsøk.set(nøkkel, t);
  return 0;
}

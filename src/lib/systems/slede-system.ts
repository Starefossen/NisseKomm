/**
 * Slede System
 *
 * IQs sledesimulator: best runs per stage for the family and per player.
 */

import { fyll } from "@/lib/navn";
import { StorageManager, type SledeResultat } from "../storage";

/** Best score and bells per stage id, and per «Navn/etappe». */
export function getSledeResultater(): Record<string, SledeResultat> {
  // Keys «Navn/etappe»: an older build may have stored a name token.
  return Object.fromEntries(
    Object.entries(StorageManager.getSledeResultater()).map(([k, v]) => [
      fyll(k),
      v,
    ]),
  );
}

/** A player's best runs by stage id (empty when nobody is chosen). */
export function getSledeResultaterFor(
  spiller: string | null,
): Record<string, SledeResultat> {
  if (!spiller) return {};
  const ut: Record<string, SledeResultat> = {};
  for (const [k, r] of Object.entries(getSledeResultater()))
    if (k.startsWith(`${spiller}/`)) ut[k.slice(spiller.length + 1)] = r;
  return ut;
}

/**
 * Keeps the best of each; a worse run never lowers a saved result. With a
 * player the run is also kept under «Navn/etappe», and a cleared challenge is
 * remembered for the day even when the run itself was not a best.
 * Returns the player's record when there is one, else the family's.
 */
export function recordSledeResultat(
  etappe: string,
  poeng: number,
  bjeller: number,
  spiller?: string | null,
  utfordringDag?: number,
): SledeResultat {
  spiller = spiller && fyll(spiller);
  const alle = getSledeResultater();
  // One whole run is kept: most bells, then most points. A failed run
  // (0 bells) still counts as a best score until a finished one beats it.
  const beste = (prev: SledeResultat | undefined) =>
    prev &&
    (prev.bjeller > bjeller ||
      (prev.bjeller === bjeller && prev.poeng >= poeng))
      ? prev
      : { poeng, bjeller };
  const fam = beste(alle[etappe]);
  if (fam !== alle[etappe]) StorageManager.setSledeResultat(etappe, fam);
  if (!spiller) return fam;
  const id = `${spiller}/${etappe}`;
  const dag = utfordringDag ?? alle[id]?.utfordringDag;
  const egen = { ...beste(alle[id]), utfordringDag: dag };
  if (dag === undefined) delete egen.utfordringDag;
  if (JSON.stringify(egen) !== JSON.stringify(alle[id]))
    StorageManager.setSledeResultat(id, egen);
  return egen;
}

/** Last player chosen on this screen; UI state, not game state. */
export function getSledeSpiller(): string | null {
  const s = StorageManager.getSledeSpiller();
  return s && fyll(s);
}

export function setSledeSpiller(navn: string | null): void {
  StorageManager.setSledeSpiller(navn && fyll(navn));
}

/**
 * Opplåsing System
 *
 * One-off intros, unlock nudges (lib/opplasinger.ts) and the daily alert
 * feed built from them.
 */

import { StorageManager } from "../storage";
import { getCurrentMonth } from "../date-utils";
import {
  convertDailyAlerts,
  sortAlertsByPriority,
  generateAlertTimestamp,
} from "../generators/alert-generator";
import {
  FJAER_MAAL,
  FJAER_VARSEL,
  OPPLASINGER,
  nivaa,
  puffTekst,
  settNokkel,
  type Nivaa,
  type Opplasing,
} from "../opplasinger";
import type { Varsel } from "@/types/innhold";
import statiskInnhold from "@/data/statisk_innhold.json";
import { isQuestCompleted } from "./quest-system";

export type IntroId =
  "boot" | "tail" | "brev-tint" | `ny-${string}` | `ugle-k${number}`;

export function isIntroSeen(id: IntroId): boolean {
  return StorageManager.getIntrosSeen().includes(id);
}

/** Nudge level for one unlock today (lib/opplasinger.ts). */
export function getOpplasingNivaa(o: Opplasing, day: number): Nivaa {
  return nivaa(o, day, isQuestCompleted(day), isIntroSeen(settNokkel(o)));
}

/** Unlocks on a day a child may see now (after-code ones wait for the code). */
export function getOpplasinger(day: number, vindu?: string): Opplasing[] {
  return OPPLASINGER.filter(
    (o) =>
      o.dag === day &&
      (!vindu || o.vindu === vindu) &&
      (!o.etterKode || isQuestCompleted(day)),
  );
}

/** Highest nudge level among a window's unlocks (home tile). */
export function getNyttNivaa(vindu: string, day: number): Nivaa {
  if (getCurrentMonth() !== 12) return 0;
  return OPPLASINGER.filter((o) => o.vindu === vindu).reduce<Nivaa>(
    (m, o) => Math.max(m, getOpplasingNivaa(o, day)) as Nivaa,
    0,
  );
}

/** Opening a window counts as having seen everything unlocked in it so far. */
export function markOpplasingerSett(vindu: string, day: number) {
  StorageManager.markIntroSeen(`ny-${vindu}`);
  OPPLASINGER.filter((o) => o.vindu === vindu && o.dag <= day).forEach((o) =>
    StorageManager.markIntroSeen(settNokkel(o)),
  );
}

/** Owl feathers found in Ugleposten (all chapters); FJAER_MAAL opens a MORO file. */
export function getUglefjaer(): number {
  return StorageManager.getEventyrSave()?.fjaer?.length ?? 0;
}

/**
 * Daily narrative alerts: the day's story lines, unlock alerts or one nudge,
 * the owl-feather line; max 8, newest day first.
 */
export function getDailyAlerts(
  day: number,
  completedDays: Set<number>,
): Varsel[] {
  const alerts: Varsel[] = [];
  const dailyAlertsData = (
    statiskInnhold as unknown as {
      daily_alerts: Array<{
        day: number;
        tekst: string;
        type: "info" | "advarsel" | "kritisk";
        etterKode?: boolean;
      }>;
    }
  ).daily_alerts.filter((a) => !a.etterKode || completedDays.has(a.day));

  alerts.push(...convertDailyAlerts(dailyAlertsData, day));

  // Unlock alerts on their day, then at most one nudge per unopened item today
  const unlocks = OPPLASINGER.filter((o) => o.varsel).map((o) => ({
    day: o.dag,
    tekst: o.varsel!,
    type: "info" as const,
    etterKode: o.etterKode,
  }));
  const synlige = unlocks.filter(
    (a) => !a.etterKode || completedDays.has(a.day),
  );
  alerts.push(...convertDailyAlerts(synlige, day));
  // One unlock line a day: today's alert if there is one, otherwise a nudge
  // for the stalest unopened item, below the day's story lines
  const puff = synlige.some((a) => a.day === day)
    ? null
    : OPPLASINGER.map((o) =>
        puffTekst(
          o,
          nivaa(o, day, completedDays.has(day), isIntroSeen(settNokkel(o))),
          day,
        ),
      ).find(Boolean);
  if (puff)
    alerts.push({
      tekst: puff,
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day,
    });
  // Eight owl feathers: Rampenissen points to the new MORO file until it is opened
  if (getUglefjaer() >= FJAER_MAAL && !isIntroSeen("ny-nissenet-fjaer"))
    alerts.push({
      tekst: FJAER_VARSEL,
      type: "info",
      tidspunkt: generateAlertTimestamp(),
      day,
    });

  // Newest day first, priority as tiebreaker
  sortAlertsByPriority(alerts);

  return alerts.slice(0, 8);
}

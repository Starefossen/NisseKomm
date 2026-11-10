/** Turns a state write (before/after) into notifications. Pure. */
import eventyrData from "@/data/eventyr.json";
import { getAllOppdrag } from "@/lib/oppdrag";
import { FROST_UNTIL_HOUR, isFrostDay } from "@/lib/frost";
import type { Notification } from "./index";

const MILESTONES: Array<{ dag: number; navn: string; tekst: string }> =
  eventyrData.eventyr.flatMap((e) => e.milepaeler ?? []);

function solvedDays(codes: unknown): Set<number> {
  const days = new Set<number>();
  if (!Array.isArray(codes)) return days;
  for (const c of codes) {
    const kode = String(c?.kode ?? "").toUpperCase();
    const dag =
      typeof c?.day === "number"
        ? c.day
        : getAllOppdrag().find((o) => o.kode.toUpperCase() === kode)?.dag;
    if (dag) days.add(dag);
  }
  return days;
}

function added(before: unknown, after: unknown): number[] {
  const b = new Set(Array.isArray(before) ? before : []);
  return (Array.isArray(after) ? after : []).filter(
    (d): d is number => typeof d === "number" && !b.has(d),
  );
}

/** Frost comes with the clock, not a write: checked when state is read. */
export function frostOnEvent(
  state: Record<string, unknown>,
  day: number,
  month: number,
  hour: number,
): Notification | null {
  if (month !== 12 || !isFrostDay(day) || hour >= FROST_UNTIL_HOUR) return null;
  if (state["nissekomm-frost-off-day"] === day) return null;
  if (solvedDays(state["nissekomm-codes"]).has(day)) return null;
  return {
    event: "frost_on",
    day,
    title: `Frost dag ${day}`,
    body: "Kulde har frosset NisseKomm.",
    audience: "parents",
  };
}

function frostOff(day: number): Notification {
  return {
    event: "frost_off",
    day,
    title: `Frosten slapp dag ${day}`,
    body: "NisseKomm er tint igjen.",
    audience: "parents",
  };
}

export function eventsForWrite(
  key: string,
  before: unknown,
  after: unknown,
): Notification[] {
  const out: Notification[] = [];
  if (key === "nissekomm-codes") {
    const old = solvedDays(before);
    for (const day of [...solvedDays(after)].filter((d) => !old.has(d))) {
      out.push({
        event: "day_solved",
        day,
        title: `Dag ${day} er løst`,
        body: `Barna løste luke ${day}.`,
        audience: "parents",
      });
      const m = MILESTONES.find((x) => x.dag === day);
      if (m) {
        out.push({
          event: "milestone",
          day,
          title: m.navn,
          body: m.tekst,
          audience: "kids",
        });
      }
      if (isFrostDay(day)) out.push(frostOff(day));
      if (day === 24) {
        out.push({
          event: "season_complete",
          day,
          title: "Sesongen er fullført",
          body: "Alle 24 luker er løst.",
          audience: "parents",
        });
      }
    }
  } else if (key === "nissekomm-bonusoppdrag-completed") {
    for (const day of added(before, after)) {
      out.push({
        event: "bonus_approved",
        day,
        title: `Bonusoppdrag dag ${day} godkjent`,
        body: `Bonusoppdraget for dag ${day} er godkjent.`,
        audience: "kids",
      });
    }
  } else if (
    key === "nissekomm-frost-off-day" &&
    typeof after === "number" &&
    after > 0 &&
    after !== before
  ) {
    out.push(frostOff(after));
  }
  return out;
}

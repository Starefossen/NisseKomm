/**
 * MCP tools (todo.md «Hjemmeintegrasjon via MCP»). `read` is kid-safe: only
 * what the kids already see today, never codes, hints or later days, and
 * every read answer passes through redact() as a last guard. There is no
 * solution tool.
 */
import uke1 from "@/data/uke1_oppdrag.json";
import uke2 from "@/data/uke2_oppdrag.json";
import uke3 from "@/data/uke3_oppdrag.json";
import uke4 from "@/data/uke4_oppdrag.json";
import eventyr from "@/data/eventyr.json";
import statisk from "@/data/statisk_innhold.json";
import merker from "@/data/merker.json";
import videoer from "@/data/julius_videoer.json";
import { getAllOppdrag } from "@/lib/oppdrag";
import { getServerDate } from "@/lib/date-utils";
import {
  FROST_UNTIL_HOUR,
  frostLevelFor,
  frostModeFor,
  isFrostDay,
} from "@/lib/frost";
import { getStore, resetState } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import {
  LANDSBY_EVENT_SECONDS,
  landsbyEventAllowed,
  landsbyEvents,
} from "@/components/windows/snofall-tv/channels";
import { createUploadTicket, mediaStatus } from "@/lib/media-server";
import type { Caller, Level } from "./auth";
import { getClip } from "./clips";

type State = Record<string, unknown>;
type Tool = {
  level: Level;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, object> };
  run(args: Record<string, unknown>, caller: Caller): Promise<unknown>;
};

/** Every value under a `kode`/`foreldre_kode` key anywhere in src/data. */
export const CODE_WORDS: string[] = (() => {
  const out = new Set<string>();
  const walk = (v: unknown, key = "") => {
    if (typeof v === "string" && /^(kode|foreldre_kode)$/.test(key) && v) {
      out.add(v);
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) walk(x, k);
    }
  };
  walk([uke1, uke2, uke3, uke4, eventyr, statisk, merker, videoer]);
  return [...out];
})();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Removes every code word except `earned` (solved days up to today). */
export function redact(text: string, earned = new Set<string>()): string {
  // Numeric codes (24, 48, 75) would mangle the JSON; kodelekkasje.test covers them.
  const words = CODE_WORDS.filter(
    (c) => !/^\d+$/.test(c) && !earned.has(c.toUpperCase()),
  );
  if (!words.length) return text;
  const re = new RegExp(words.map(escape).join("|"), "giu");
  return text.replace(re, "[…]");
}

/** Codes the kids have typed in on a day up to today; story names stay readable. */
export function earnedCodes(state: State, at?: Date): Set<string> {
  const today = adventDay(now(state, at)) ?? 0;
  const solved = solvedDays(state);
  return new Set(
    getAllOppdrag()
      .filter((q) => q.dag <= today && solved.has(q.dag))
      .map((q) => q.kode.toUpperCase()),
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

const OSLO = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Oslo",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
});
/** Wall-clock parts in Europe/Oslo, whatever TZ the server runs in. */
export function oslo(d: Date) {
  const p = Object.fromEntries(
    OSLO.formatToParts(d).map((x) => [x.type, x.value]),
  );
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    weekend: p.weekday === "Sat" || p.weekday === "Sun",
  };
}
const isoDate = (d: Date) => {
  const o = oslo(d);
  return `${o.year}-${pad(o.month)}-${pad(o.day)}`;
};
// ponytail: fixed CET offset, right for November–February; use Temporal if
// the API is ever used in summer.
const osloIso = (date: string, hour: number): string =>
  hour >= 24
    ? osloIso(
        isoDate(new Date(Date.parse(`${date}T12:00:00+01:00`) + 864e5)),
        hour - 24,
      )
    : `${date}T${pad(hour)}:00:00+01:00`;

/**
 * set_fake_now: per caller `sub`, the clock keeps running from the fake
 * start. In memory only (one LAN pod); a restart clears it.
 */
export class ArgError extends Error {}

const fakeClocks = new Map<string, { fake: number; set: number }>();
const FAKE_MIN = Date.parse("2026-11-01T00:00:00+01:00");
const FAKE_MAX = Date.parse("2027-01-31T23:59:59+01:00");
export const FAKE_NOW_TTL_MS = 24 * 3600 * 1000;
export function clockFor(sub: string): Date | undefined {
  const f = fakeClocks.get(sub);
  if (!f) return undefined;
  const elapsed = Date.now() - f.set;
  if (elapsed > FAKE_NOW_TTL_MS) {
    fakeClocks.delete(sub);
    console.info(`[mcp] set_fake_now for ${sub} expired`);
    return undefined;
  }
  return new Date(f.fake + elapsed);
}

/** Caller's fake clock, else clock plus skip_day's `day-offset`. */
const now = (state: State, at?: Date) =>
  at ?? getServerDate(state["day-offset"]);

function solvedDays(state: State): Set<number> {
  const days = new Set<number>();
  const codes = state["nissekomm-codes"];
  if (!Array.isArray(codes)) return days;
  const quests = getAllOppdrag();
  for (const c of codes) {
    const kode = String(c?.kode ?? "").toUpperCase();
    const dag =
      typeof c?.day === "number"
        ? c.day
        : quests.find((o) => o.kode.toUpperCase() === kode)?.dag;
    if (dag) days.add(dag);
  }
  return days;
}

/** When the day's code was typed in (ISO, Oslo), or null. */
function solvedAt(state: State, day: number): string | null {
  const codes = state["nissekomm-codes"];
  if (!Array.isArray(codes)) return null;
  const kode = getAllOppdrag()
    .find((q) => q.dag === day)
    ?.kode.toUpperCase();
  const c = codes.find(
    (x) => x?.day === day || String(x?.kode ?? "").toUpperCase() === kode,
  );
  const t = Date.parse(String(c?.dato ?? ""));
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const o = oslo(d);
  return `${isoDate(d)}T${pad(o.hour)}:${pad(o.minute)}:00+01:00`;
}

/** Media URL, absolute when NISSEKOMM_PUBLIC_BASE is set. */
const media = (p: string) =>
  (process.env.NISSEKOMM_PUBLIC_BASE ?? "").replace(/\/$/, "") + mediaUrl(p);

/** Closest still per tv.state; others use the rolig still. */
const TV_STILL: Record<string, string> = { storm: "feed/snøfall-storm.png" };

/** Calendar day 1–24 in December, else null. */
function adventDay(d: Date): number | null {
  const { day, month } = oslo(d);
  return month === 12 && day <= 24 ? day : null;
}

export function getState(state: State, at?: Date) {
  const d = now(state, at);
  const { day, month, hour } = oslo(d);
  const date = isoDate(d);
  const solved = solvedDays(state).has(day);
  const mode = frostModeFor({
    day,
    month,
    hour,
    solved,
    disabled: state["nissekomm-frost-off-day"] === day,
  });
  let frost = {
    active: mode.level > 0,
    until: `${date}T${FROST_UNTIL_HOUR}:00`,
    message: mode.message,
    // Skjerm shows frost from 06:00 too (historie-2026 §6).
    morning_ok: mode.level > 0,
  };
  const o = state["frost-override"] as { active?: unknown; until?: unknown };
  if (o && typeof o.until === "string" && new Date(o.until) > d) {
    frost = { ...frost, active: o.active === true, until: o.until };
    frost.morning_ok = frost.active;
  }
  // historie-2026: iMac grayscale only on Sunday Dec 20, 09–12.
  const gray = month === 12 && day === 20 && hour >= 9 && hour < 12;
  return {
    date,
    frost,
    grayscale: {
      active: gray,
      until: `${date}T12:00`,
      message: gray ? "Kulde er ved døra. I morgen trenger jeg dere." : "",
    },
    solved_today: solved,
    cards: [],
  };
}

export function getTodayQuest(state: State, at?: Date) {
  const day = adventDay(now(state, at));
  const q = day && getAllOppdrag().find((o) => o.dag === day);
  if (!q) return null;
  return {
    day,
    title: q.tittel,
    mail: q.nissemail_tekst,
    video_transcript: videoer.find((v) => v.dag === day)?.transkripsjon ?? null,
  };
}

export function getProgress(state: State, at?: Date) {
  const today = adventDay(now(state, at)) ?? 0;
  const badges = state["nissekomm-earned-badges"];
  return {
    days_solved: [...solvedDays(state)]
      .filter((d) => d <= today)
      .sort((a, b) => a - b),
    badges: Array.isArray(badges) ? badges : [],
  };
}

/** Europe/Oslo hours: natt 19–06, morgen 06–09, dag 09–15, skumring 15–19. */
function phaseAt(hour: number): { phase: Phase; next: number } {
  if (hour >= 6 && hour < 9) return { phase: "morgen", next: 9 };
  if (hour >= 9 && hour < 15) return { phase: "dag", next: 15 };
  if (hour >= 15 && hour < 19) return { phase: "skumring", next: 19 };
  return { phase: "natt", next: hour < 6 ? 6 : 30 };
}

type Phase = "morgen" | "dag" | "skumring" | "natt";
/**
 * `tv.grade` per phase. Without an entry the field is left out and Skjerm
 * grades the rolig loop from tv.phase; set "none" once a phase has its own
 * rendered loop.
 */
export const TV_GRADE_OVERRIDE: Partial<Record<Phase, string>> = {};

/** Snøfall landsby state for a story day (same rule as Snøfall TV K1). */
function tvState(day: number | null, solved: boolean) {
  if (day === 24 && solved) return "dag24";
  // NORDLYS is day 17's code: the name (and its loop URL) waits for it.
  if (day === 17) return solved ? "nordlys" : "rolig";
  if (day === 18) return "storm";
  return "rolig";
}

/**
 * Skjerm's view. `next_change_at` is the earliest of every possible change,
 * phase included: title (06), Rampenissen (09/10), phase, grayscale (12),
 * frost stop (20), midnight, or a set_frost end. It may be a no-op.
 */
export function getScreen(state: State, at?: Date) {
  const d = now(state, at);
  const o = oslo(d);
  const date = isoDate(d);
  const today = adventDay(d) ?? 0;
  const solved = solvedDays(state);
  const solvedToday = today > 0 && solved.has(today);
  const bonus = state["nissekomm-bonusoppdrag-completed"];
  const badges = state["nissekomm-earned-badges"];
  const q =
    today && o.hour >= 6 ? getAllOppdrag().find((x) => x.dag === today) : null;
  const tv = tvState(today, solvedToday);
  const { phase, next: phaseNext } = phaseAt(o.hour);
  // ponytail: weekday 09 / weekend 10, from Morgenrådet's broadcast times.
  const rampenissenHour = o.weekend ? 10 : 9;
  const nextHour = Math.min(
    phaseNext,
    ...[6, rampenissenHour, 12, FROST_UNTIL_HOUR, 24].filter((h) => h > o.hour),
  );
  let next = osloIso(date, nextHour);
  const fo = state["frost-override"] as { until?: unknown } | undefined;
  const foEnd = typeof fo?.until === "string" ? Date.parse(fo.until) : NaN;
  if (foEnd > d.getTime() && foEnd < Date.parse(next)) {
    next = fo!.until as string;
  }
  const base = getState(state, at);
  // A milestone counts once its day is solved, so no later day's name leaks.
  const milestones = eventyr.eventyr[0].milepaeler.map((m, i) => ({
    id: `M${i + 1}`,
    name: m.navn,
    day: m.dag,
  }));
  const latest = milestones
    .filter((m) => m.day <= today && solved.has(m.day))
    .at(-1);
  // Level-2 frost is warned the day before; level 1 stays a surprise.
  const frostFrom = (d: number) =>
    frostModeFor({ day: d, month: 12, hour: 0, solved: false, disabled: false })
      .level === 2
      ? d - 1
      : d;
  const nowS = (o.hour * 60 + o.minute) * 60;
  const events =
    tv === "rolig" && today
      ? landsbyEvents(today)
          .filter(
            (e) =>
              landsbyEventAllowed(e.kind, today, solvedToday) &&
              e.minute * 60 + LANDSBY_EVENT_SECONDS[e.kind] > nowS,
          )
          // ponytail: next 8 only (~115 a day would crowd 16 KB).
          .slice(0, 8)
          .map((e) => {
            const s = Math.floor(e.minute * 60);
            const hms = [s / 3600, (s / 60) % 60, s % 60]
              .map((n) => pad(Math.floor(n)))
              .join(":");
            return {
              id: `${e.kind}-${today}-${Math.floor(e.minute)}`,
              kind: "overlay" as const,
              url: null,
              at: `${date}T${hms}+01:00`,
            };
          })
      : [];
  return {
    now: `${date}T${pad(o.hour)}:${pad(o.minute)}:00+01:00`,
    day: today || null,
    season: "2026",
    countdown_days: Math.max(
      0,
      Math.round(
        (Date.parse("2026-12-24T12:00:00Z") - Date.parse(`${date}T12:00:00Z`)) /
          864e5,
      ),
    ),
    today: {
      solved: solvedToday,
      solved_at: solvedToday ? solvedAt(state, today) : null,
      milestone_reached: solvedToday && milestones.some((m) => m.day === today),
    },
    milestone_latest: latest ? { id: latest.id, name: latest.name } : null,
    doors: Array.from({ length: 24 }, (_, i) => ({
      day: i + 1,
      frost_day: isFrostDay(i + 1) && today >= frostFrom(i + 1),
      state:
        i + 1 > today
          ? "locked"
          : solved.has(i + 1)
            ? "completed"
            : "available",
    })),
    title: q?.tittel ?? null,
    // ponytail: placeholder until skjerm_teaser texts are written (todo.md).
    teaser:
      (q as { skjerm_teaser?: string } | null | undefined)?.skjerm_teaser ??
      (q ? "Nytt oppdrag venter i NisseKomm." : null),
    frost_percent: today
      ? frostLevelFor(
          today,
          solvedToday,
          Array.isArray(bonus) && bonus.includes(today),
        )
      : null,
    // Kulde gets a name once day 7 (KULDE) is solved; a key holding a code
    // word would itself be redacted.
    antagonist_name: today >= 7 && solved.has(7) ? "Kulde" : null,
    badges: Array.isArray(badges) ? badges : [],
    rampenissen_seen: today > 0 && o.hour >= rampenissenHour,
    frost: base.frost,
    grayscale: base.grayscale,
    tv: {
      state: tv,
      variant: media(`video/tv/landsby-${tv}.mp4`),
      poster_url: media(TV_STILL[tv] ?? "feed/landsby-rolig.jpg"),
      phase,
      phase_next_change_at: osloIso(date, phaseNext),
      ...(TV_GRADE_OVERRIDE[phase] && { grade: TV_GRADE_OVERRIDE[phase] }),
      // Code-drawn village overlays, only ever over the rolig loop.
      events,
    },
    next_change_at: next,
  };
}

const intArg = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ArgError(`ugyldig argument: heltall ${min}–${max}`);
  }
  return n;
};

const read = async () => getStore().getState();

export const TOOLS: Record<string, Tool> = {
  get_state: {
    level: "read",
    description: "Frost, gråtone og om dagens kode er løst.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, c) => getState(await read(), clockFor(c.sub)),
  },
  get_screen: {
    level: "read",
    description:
      "Skjerm: dører (frost_day), tittel og teaser, today (løst, tidspunkt, milepæl), milestone_latest, countdown_days, Frostgrad, merker, frost, TV (poster_url, events) og neste endring. Tider i Europe/Oslo. Medie-URL-er er absolutte når NISSEKOMM_PUBLIC_BASE er satt, ellers rot-relative.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, c) => getScreen(await read(), clockFor(c.sub)),
  },
  get_clips: {
    level: "read",
    description:
      "Rampenissens radioklipp for en dato (YYYY-MM-DD), aldri etter i dag.",
    inputSchema: {
      type: "object",
      properties: { date: { type: "string" } },
    },
    run: async ({ date }, c) => {
      const today = isoDate(now(await read(), clockFor(c.sub)));
      const d = date === undefined ? today : String(date);
      if (!/^\d{4}-\d\d-\d\d$/.test(d)) {
        throw new ArgError("ugyldig argument: date");
      }
      const m = /^2026-12-(\d\d)$/.exec(d);
      const day = m ? Number(m[1]) : 0;
      // A later date would be a spoiler; ISO dates compare as strings.
      const clips =
        day >= 1 && day <= 24 && d <= today ? [await getClip(day)] : [];
      return { date: d, clips };
    },
  },
  get_letters: {
    level: "parent",
    description: "Barnas brev til Julius med navn og dato.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const stored = (await read())["nissekomm-santa-letters"];
      // ponytail: first 50 letters; the kids write one or two each.
      const letters = Array.isArray(stored) ? stored.slice(0, 50) : [];
      // Shares ~5000 characters between the letters so 16 KB always holds.
      const max = Math.min(
        2000,
        Math.floor(5000 / Math.max(letters.length, 1)),
      );
      return {
        letters: letters.map((l) => ({
          from: typeof l?.from === "string" ? l.from.slice(0, 40) : null,
          date: `2026-12-${pad(Number(l?.day) || 0)}`,
          day: Number(l?.day) || null,
          content: String(l?.content ?? "").slice(0, max),
        })),
      };
    },
  },
  set_fake_now: {
    level: "parent",
    description:
      "Lat som klokka er `now` (ISO) i svar til deg selv. Utløper etter 24 timer; tom `now` nullstiller.",
    inputSchema: {
      type: "object",
      properties: { now: { type: "string" } },
    },
    run: async ({ now: at }, c) => {
      if (at === undefined || at === null || at === "") {
        fakeClocks.delete(c.sub);
        console.info(`[mcp] set_fake_now cleared by ${c.name}`);
        return { fake_now: null };
      }
      const t = Date.parse(String(at));
      if (!(t >= FAKE_MIN && t <= FAKE_MAX)) {
        throw new ArgError("ugyldig argument: now (2026-11-01–2027-01-31)");
      }
      fakeClocks.set(c.sub, { fake: t, set: Date.now() });
      console.info(`[mcp] set_fake_now ${c.name} -> ${String(at)}`);
      return {
        fake_now: new Date(t).toISOString(),
        expires_at: new Date(Date.now() + FAKE_NOW_TTL_MS).toISOString(),
      };
    },
  },
  preview_screen: {
    level: "parent",
    description:
      "get_screen slik en read-kaller (as_caller, f.eks. skjerm) ser den nå, med sensur. Ingen set_fake_now gjelder her.",
    inputSchema: {
      type: "object",
      properties: { as_caller: { type: "string" } },
    },
    // Read callers cannot set a fake clock, so Skjerm sees real time; no
    // parent's fake clock (the operator's or another's) applies here.
    run: async () => {
      const state = await read();
      // Same guard as a read caller gets.
      return JSON.parse(
        redact(
          JSON.stringify({ ...getScreen(state), schema_version: 1 }),
          earnedCodes(state),
        ),
      );
    },
  },
  get_today_quest: {
    level: "read",
    description: "Dagens oppdrag slik barna ser det: tittel, e-post, video.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, c) => getTodayQuest(await read(), clockFor(c.sub)),
  },
  get_progress: {
    level: "read",
    description: "Løste dager og merker.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, c) => getProgress(await read(), clockFor(c.sub)),
  },
  give_hint: {
    level: "parent",
    description: "Hint fra foreldreguiden for en dag. Aldri koden.",
    inputSchema: {
      type: "object",
      properties: { day: { type: "integer", minimum: 1, maximum: 24 } },
    },
    run: async ({ day }) => {
      const d = intArg(day, 1, 24);
      const q = getAllOppdrag().find((o) => o.dag === d);
      return { day: d, hint: redact(q?.fysisk_hint ?? "") };
    },
  },
  set_frost: {
    level: "parent",
    description:
      "Overstyr frost til et tidspunkt (ISO). Standard: 20:00 i dag.",
    inputSchema: {
      type: "object",
      properties: { active: { type: "boolean" }, until: { type: "string" } },
    },
    run: async ({ active, until }) => {
      const state = await read();
      const end =
        typeof until === "string"
          ? until
          : `${isoDate(now(state))}T${FROST_UNTIL_HOUR}:00`;
      if (Number.isNaN(Date.parse(end)))
        throw new ArgError("ugyldig argument: until");
      await getStore().putState("frost-override", {
        active: active === true,
        until: end,
      });
      return getState(await read()).frost;
    },
  },
  skip_day: {
    level: "parent",
    description: "Flytt spillets dag én dag fram.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      const offset = (await read())["day-offset"];
      const next = (typeof offset === "number" ? offset : 0) + 1;
      await getStore().putState("day-offset", next);
      return { day_offset: next };
    },
  },
  list_assets: {
    level: "read",
    description:
      "Mediefilene i manifestet med størrelse, eller null om de mangler.",
    inputSchema: { type: "object", properties: {} },
    run: async () =>
      (await mediaStatus()).map((m) => ({
        ...m,
        status: m.size === null ? "missing" : "present",
      })),
  },
  upload_asset: {
    level: "parent",
    description:
      "Gir en engangs opplastings-URL (10 min) for én manifestfil. Last opp med PUT og riktig Content-Type.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
    },
    run: async ({ path }) => {
      const p = String(path ?? "").normalize("NFC");
      const ticket = await createUploadTicket(p);
      return {
        method: "PUT",
        url: `/api/media/${p}?ticket=${ticket}`,
        expires_in_s: 600,
      };
    },
  },
  reset: {
    level: "parent",
    description: "Nullstill all delt spilltilstand.",
    inputSchema: { type: "object", properties: {} },
    run: async () => {
      await resetState();
      return { reset: true };
    },
  },
};

export const MAX_RESPONSE_BYTES = 16 * 1024;

/** Runs a tool for a caller; read answers are redacted. A bare level is a test caller. */
export async function callTool(
  who: Level | Caller,
  name: string,
  args: Record<string, unknown> = {},
): Promise<string> {
  const caller: Caller =
    typeof who === "string" ? { sub: who, name: who, level: who } : who;
  // Own keys only: "constructor" or "__proto__" must not reach a prototype.
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined;
  if (!tool || (tool.level === "parent" && caller.level !== "parent")) {
    throw new ArgError("Ukjent verktøy");
  }
  let out = await tool.run(args, caller);
  if (out && typeof out === "object" && !Array.isArray(out)) {
    out = { schema_version: 1, ...out };
  }
  let text = JSON.stringify(out);
  if (tool.level === "read") {
    text = redact(text, earnedCodes(await read(), clockFor(caller.sub)));
  }
  if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) {
    throw new Error(`Svaret fra ${name} er over 16 KB`);
  }
  return text;
}

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
import { getCurrentDate } from "@/lib/date-utils";
import { FROST_UNTIL_HOUR, frostModeFor } from "@/lib/frost";
import { STATE_KEYS, getStore } from "@/lib/db";
import type { Level } from "./auth";

type State = Record<string, unknown>;
type Tool = {
  level: Level;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, object> };
  run(args: Record<string, unknown>): Promise<unknown>;
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
const CODE_RE = new RegExp(
  CODE_WORDS.map((c) =>
    /^\d+$/.test(c) ? `(?<!\\d)${c}(?!\\d)` : escape(c),
  ).join("|"),
  "giu",
);

export function redact(text: string): string {
  return text.replace(CODE_RE, "[…]");
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Clock plus skip_day's `day-offset`. */
function now(state: State): Date {
  const d = getCurrentDate();
  const offset = state["day-offset"];
  if (typeof offset === "number") d.setDate(d.getDate() + offset);
  return d;
}

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

/** Calendar day 1–24 in December, else null. */
function adventDay(d: Date): number | null {
  const day = d.getDate();
  return d.getMonth() === 11 && day <= 24 ? day : null;
}

export function getState(state: State) {
  const d = now(state);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const hour = d.getHours();
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

export function getTodayQuest(state: State) {
  const day = adventDay(now(state));
  const q = day && getAllOppdrag().find((o) => o.dag === day);
  if (!q) return null;
  return {
    day,
    title: q.tittel,
    mail: q.nissemail_tekst,
    video_transcript: videoer.find((v) => v.dag === day)?.transkripsjon ?? null,
  };
}

export function getProgress(state: State) {
  const today = adventDay(now(state)) ?? 0;
  const badges = state["nissekomm-earned-badges"];
  return {
    days_solved: [...solvedDays(state)]
      .filter((d) => d <= today)
      .sort((a, b) => a - b),
    badges: Array.isArray(badges) ? badges : [],
  };
}

const intArg = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Må være et heltall ${min}–${max}`);
  }
  return n;
};

const read = async () => getStore().getState();

export const TOOLS: Record<string, Tool> = {
  get_state: {
    level: "read",
    description: "Frost, gråtone og om dagens kode er løst.",
    inputSchema: { type: "object", properties: {} },
    run: async () => getState(await read()),
  },
  get_clips: {
    level: "read",
    description: "Radioklipp for en dato (YYYY-MM-DD).",
    inputSchema: {
      type: "object",
      properties: { date: { type: "string" } },
    },
    // ponytail: no Rampenissen radio clips exist yet; list them from media
    // once the manifest has them, and never for a date after today.
    run: async () => [],
  },
  get_today_quest: {
    level: "read",
    description: "Dagens oppdrag slik barna ser det: tittel, e-post, video.",
    inputSchema: { type: "object", properties: {} },
    run: async () => getTodayQuest(await read()),
  },
  get_progress: {
    level: "read",
    description: "Løste dager og merker.",
    inputSchema: { type: "object", properties: {} },
    run: async () => getProgress(await read()),
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
      if (Number.isNaN(Date.parse(end))) throw new Error("Ugyldig until");
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
  reset: {
    level: "parent",
    description: "Nullstill all delt spilltilstand.",
    inputSchema: { type: "object", properties: {} },
    // ponytail: writes null (the store has no delete); clients still holding
    // local state push it back, as with any removal (db.ts mergeValue).
    run: async () => {
      for (const k of [...STATE_KEYS, "frost-override", "day-offset"]) {
        await getStore().putState(k, null);
      }
      return { reset: true };
    },
  },
};

/** Runs a tool for a caller; read answers are redacted. */
export async function callTool(
  level: Level,
  name: string,
  args: Record<string, unknown> = {},
): Promise<string> {
  const tool = TOOLS[name];
  if (!tool || (tool.level === "parent" && level !== "parent")) {
    throw new Error(`Ukjent verktøy: ${name}`);
  }
  const text = JSON.stringify(await tool.run(args));
  return tool.level === "read" ? redact(text) : text;
}

import { mediaUrl } from "@/lib/media";
import type { FrostModeLevel } from "@/lib/frost";
import { getCurrentDate } from "@/lib/date-utils";

/**
 * Snøfall TV channel map (storyboard «Avgjort 10. november») and the
 * day events from historie-2026 §9. Pure functions of day/hour/state so
 * the Tidsmaskin can show any day.
 */

export type ChannelId = 1 | 2 | 3 | 4;

export const CHANNELS: { id: ChannelId; name: string }[] = [
  { id: 1, name: "SNØFALL LANDSBY" },
  { id: 2, name: "IQS VERKSTED" },
  { id: 3, name: "JULIUS" },
  { id: 4, name: "ANTENNEN" },
];

export const FREQ_HOME = 90;
export const FREQ_KULDE = 85;
export const FREQ_MIN = 80;
export const FREQ_MAX = 100;

export const STILL = {
  antenne: mediaUrl("feed/antenne-tarn.png"),
  grotte: mediaUrl("feed/kulde-grotte.png"),
  storm: mediaUrl("feed/snøfall-storm.png"),
  landsby: mediaUrl("feed/snøfall-day.png"),
  verksted: mediaUrl("feed/iq-verksted.png"),
  kontor: mediaUrl("feed/julius-kontor.jpg"),
};

export type Phase = "morgen" | "dag" | "skumring" | "natt";

/**
 * `tv.grade` per phase. Without an entry the field is left out and Skjerm
 * grades the rolig loop from tv.phase; set "none" once a phase has its own
 * rendered loop.
 */
export const TV_GRADE_OVERRIDE: Partial<Record<Phase, string>> = {};

/**
 * Per-phase replacement loops for K1 rolig (e.g. "video/tv/landsby-natt.mp4").
 * When set, replaces both the video source and disables the CSS colour grade.
 */
export const TV_PHASE_LOOP_OVERRIDE: Partial<Record<Phase, string>> = {};

const OSLO_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Oslo",
  hourCycle: "h23",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** Wall-clock time parts in Europe/Oslo. */
export function getOsloTime(d: Date = getCurrentDate()) {
  const parts = Object.fromEntries(
    OSLO_FORMAT.formatToParts(d).map((p) => [p.type, p.value]),
  );
  return {
    hour: Number(parts.hour ?? d.getHours()),
    minute: Number(parts.minute ?? d.getMinutes()),
    second: Number(parts.second ?? d.getSeconds()),
  };
}

/** Europe/Oslo hours: natt 19–06, morgen 06–09, dag 09–15, skumring 15–19. */
export function phaseAt(timeOrHour: number | Date): {
  phase: Phase;
  next: number;
} {
  let hour: number;
  if (typeof timeOrHour === "number") {
    hour = timeOrHour;
  } else {
    hour = getOsloTime(timeOrHour).hour;
  }
  if (hour >= 6 && hour < 9) return { phase: "morgen", next: 9 };
  if (hour >= 9 && hour < 15) return { phase: "dag", next: 15 };
  if (hour >= 15 && hour < 19) return { phase: "skumring", next: 19 };
  return { phase: "natt", next: hour < 6 ? 6 : 30 };
}

export interface PhaseGrade {
  phase: Phase;
  previousPhase: Phase;
  transitionProgress: number;
  filter: string;
  vignette: number;
  brightness: number;
  saturate: number;
}

const PHASE_GRADES: Record<
  Phase,
  { brightness: number; saturate: number; vignette: number }
> = {
  // Skumring = no grade
  skumring: { brightness: 1.0, saturate: 1.0, vignette: 0 },
  // Morgen = lighter and less saturated
  morgen: { brightness: 1.1, saturate: 0.85, vignette: 0 },
  // Dag = lighter and less saturated
  dag: { brightness: 1.15, saturate: 0.8, vignette: 0 },
  // Natt = darker with a vignette
  natt: { brightness: 0.65, saturate: 0.8, vignette: 0.7 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function phaseGradeAt(
  timeOrHour: Date | number = getCurrentDate(),
  argMinute?: number,
  argSecond?: number,
): PhaseGrade {
  let hour: number;
  let minute: number;
  let second: number;

  if (typeof timeOrHour === "number") {
    hour = timeOrHour;
    minute = argMinute ?? 0;
    second = argSecond ?? 0;
  } else {
    const o = getOsloTime(timeOrHour);
    hour = o.hour;
    minute = o.minute;
    second = o.second;
  }

  const { phase } = phaseAt(hour);

  // First 60 s at phase change: smoothly cross-fade from previous phase
  let prevPhase: Phase = phase;
  let inTransition = false;
  if (minute === 0 && second < 60) {
    if (hour === 6) {
      prevPhase = "natt";
      inTransition = true;
    } else if (hour === 9) {
      prevPhase = "morgen";
      inTransition = true;
    } else if (hour === 15) {
      prevPhase = "dag";
      inTransition = true;
    } else if (hour === 19) {
      prevPhase = "skumring";
      inTransition = true;
    }
  }

  const transitionProgress = inTransition ? second / 60 : 1;

  const currBase = { ...PHASE_GRADES[phase] };
  const prevBase = { ...PHASE_GRADES[prevPhase] };

  if (TV_GRADE_OVERRIDE[phase] === "none" || TV_PHASE_LOOP_OVERRIDE[phase]) {
    currBase.brightness = 1.0;
    currBase.saturate = 1.0;
    currBase.vignette = 0;
  }
  if (
    TV_GRADE_OVERRIDE[prevPhase] === "none" ||
    TV_PHASE_LOOP_OVERRIDE[prevPhase]
  ) {
    prevBase.brightness = 1.0;
    prevBase.saturate = 1.0;
    prevBase.vignette = 0;
  }

  const brightness = inTransition
    ? lerp(prevBase.brightness, currBase.brightness, transitionProgress)
    : currBase.brightness;
  const saturate = inTransition
    ? lerp(prevBase.saturate, currBase.saturate, transitionProgress)
    : currBase.saturate;
  const vignette = inTransition
    ? lerp(prevBase.vignette, currBase.vignette, transitionProgress)
    : currBase.vignette;

  let filter = "none";
  if (
    TV_GRADE_OVERRIDE[phase] &&
    TV_GRADE_OVERRIDE[phase] !== "none" &&
    !inTransition
  ) {
    filter = TV_GRADE_OVERRIDE[phase]!;
  } else if (
    Math.abs(brightness - 1) >= 0.005 ||
    Math.abs(saturate - 1) >= 0.005
  ) {
    filter = `brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
  }

  return {
    phase,
    previousPhase: prevPhase,
    transitionProgress,
    filter,
    vignette,
    brightness,
    saturate,
  };
}

/** Fallback still image when a video loop fails to load. */
export function channelFallback(
  channel: ChannelId,
  freq: number = FREQ_HOME,
  day?: number,
): string | null {
  switch (channel) {
    case 1:
      return day === 18 ? STILL.storm : STILL.landsby;
    case 2:
      return STILL.verksted;
    case 3:
      return STILL.kontor;
    case 4:
      if (freq === FREQ_HOME) return STILL.antenne;
      if (freq === FREQ_KULDE) return STILL.grotte;
      return null;
    default:
      return null;
  }
}

/** Background loop for a live channel. */
export function channelSource(
  channel: ChannelId,
  day: number,
  hour: number,
  freq: number,
  solvedOrOpts: boolean | { solved?: boolean; juliusPlaying?: boolean } = false,
  juliusPlayingArg: boolean = false,
): string | null {
  const solved =
    typeof solvedOrOpts === "object"
      ? (solvedOrOpts.solved ?? false)
      : solvedOrOpts;
  const juliusPlaying =
    typeof solvedOrOpts === "object"
      ? (solvedOrOpts.juliusPlaying ?? false)
      : juliusPlayingArg;

  switch (channel) {
    case 1:
      if (day === 24 && solved) return mediaUrl("video/tv/landsby-dag24.mp4");
      // The lights are the answer; the sky stays quiet until the code is in.
      if (day === 17 && solved) return mediaUrl("video/tv/landsby-nordlys.mp4");
      if (day === 18) return mediaUrl("video/tv/landsby-storm.mp4");
      {
        const currentPhase = phaseAt(hour).phase;
        if (TV_PHASE_LOOP_OVERRIDE[currentPhase]) {
          return mediaUrl(TV_PHASE_LOOP_OVERRIDE[currentPhase]!);
        }
      }
      return mediaUrl("video/tv/landsby-rolig.mp4");
    case 2:
      // IQ works days; the workshop stands empty at night.
      return hour >= 7 && hour < 20
        ? mediaUrl("video/tv/verksted-iq-inne.mp4")
        : mediaUrl("video/tv/verksted-tom.mp4");
    case 3:
      if (juliusPlaying) return null;
      if (day === 14) return mediaUrl("video/tv/kontor-dag14.mp4");
      return hour >= 7 && hour < 20
        ? mediaUrl("video/tv/kontor-julius.mp4")
        : mediaUrl("video/tv/kontor-tom.mp4");
    case 4:
      if (freq === FREQ_HOME) {
        return day === 11 && !solved
          ? mediaUrl("video/tv/antenne-dag11.mp4")
          : mediaUrl("video/tv/antenne-rolig.mp4");
      }
      // Krystallgrotten is only on the air from day 3 (first ghost image).
      if (freq === FREQ_KULDE && day >= 3) {
        if (day >= 24 && solved) return mediaUrl("video/tv/grotte-dag24.mp4");
        if (day === 23) return mediaUrl("video/tv/grotte-dag23.mp4");
        if ((day === 21 && solved) || day === 22) {
          return mediaUrl("video/tv/grotte-dag21.mp4");
        }
        if (day >= 15 && day <= 20)
          return mediaUrl("video/tv/grotte-dag15.mp4");
        if ((day === 12 && solved) || day === 13 || day === 14) {
          return mediaUrl("video/tv/grotte-dag12.mp4");
        }
        return mediaUrl("video/tv/grotte-rolig.mp4");
      }
      return null;
    default:
      return null;
  }
}

/** Kulde's ghost lines on 85,0 MHz. */
export const KULDE_INTERCEPTS: Record<number, string> = {
  3: "Er det noen der? Linjen deres er varm. Jeg kjente den helt her nede.",
  7: "Orakelet deres leter etter navnet mitt. Si det, når dere finner det.",
  10: "Fargene er hos meg nå. Jeg skal passe godt på dem.",
  11: "Jeg la is på antennen deres, så den kunne høre på meg i stedet.",
  13: "Lysene deres. Jeg husker ikke når jeg så lys sist.",
  16: "Jeg snudde båndet til Winter. Nå ser han hit.",
  21: "Det er kaldt her nede. Jeg ville bare se lyset deres.",
};

/** Each ghost line airs on its own day only; after day 21 there is silence. */
export function interceptFor(day: number): string | undefined {
  return KULDE_INTERCEPTS[day];
}

export interface DayState {
  day: number;
  solved: boolean;
  frost: number;
  /** App-wide frost mode (GameEngine.getFrostMode): 1 = grey, 2 = frozen. */
  mode: FrostModeLevel;
  /** Day 21 after the code: number of channels thawed so far. */
  thawed: number;
  /** Hour of day (0–23) for previewing time-of-day */
  hour?: number;
}

/** Code effects for one channel on one day (§9 table). */
export function channelEffects(
  channel: ChannelId,
  freq: number,
  { day, solved, frost, mode, thawed, hour }: DayState,
) {
  const onKulde = channel === 4 && freq === FREQ_KULDE;
  // Kill switch and the 20:00 fail-safe clear `mode`; the thaw only follows a solve.
  const frozen = mode === 2 || (day === 21 && solved && channel > thawed);
  const isK1Rolig =
    channel === 1 &&
    day !== 18 &&
    !(day === 17 && solved) &&
    !(day === 24 && solved);
  return {
    frost: day >= 24 ? 0 : frost,
    hijack: onKulde && day >= 3,
    gray: mode === 1,
    flicker: day === 20,
    frozen,
    warm: day >= 24 || (day === 21 && solved && onKulde && !frozen),
    signature: day === 7 && solved,
    timeOfDay: isK1Rolig,
    hour,
    ghostLine: frozen
      ? "DET ER KALDT HER NEDE"
      : onKulde
        ? day === 3
          ? "…ER DET NOEN DER?"
          : undefined
        : undefined,
  };
}

/** Village overlay events, drawn in code over landsby-rolig (landsby-overlays.ts). */
export type LandsbyEventKind =
  "brevfugler" | "tarnklokke" | "blafugl" | "luciatog";

export interface LandsbyEvent {
  kind: LandsbyEventKind;
  /** Minutes after midnight. */
  minute: number;
}

export const LANDSBY_EVENT_SECONDS: Record<LandsbyEventKind, number> = {
  brevfugler: 14,
  tarnklokke: 6,
  blafugl: 20,
  luciatog: 50,
};

// mulberry32: a day's schedule is the same on every device and every reload.
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The day's village events: seeded per day, none within 5 minutes of a
 * story event (`storyMinutes`, minutes after midnight).
 * - Day 13: 06:00–09:00 Lucia procession once per 20 minutes (otherwise 10–15 min)
 * - Day 14: blue bird circling the clock tower included in the schedule
 * - Other days: letter birds and tower light every 10–15 minutes
 */
export function landsbyEvents(
  day: number,
  storyMinutes: number[] = [],
): LandsbyEvent[] {
  const rng = seeded(Math.imul(day, 2654435761));
  const events: LandsbyEvent[] = [];

  if (day === 13) {
    let m = rng() * 10;
    while (m < 360 - 10) {
      const kind: LandsbyEventKind = rng() < 0.5 ? "brevfugler" : "tarnklokke";
      if (!storyMinutes.some((s) => Math.abs(s - m) < 5)) {
        events.push({ kind, minute: m });
      }
      m += 10 + rng() * 5;
    }
    // 06:00–09:00 (minutes 360 to 540): once per 20 minutes
    for (let lm = 360; lm < 540; lm += 20) {
      if (!storyMinutes.some((s) => Math.abs(s - lm) < 5)) {
        events.push({ kind: "luciatog", minute: lm });
      }
    }
    m = 540 + rng() * 5;
    while (m < 24 * 60) {
      const kind: LandsbyEventKind = rng() < 0.5 ? "brevfugler" : "tarnklokke";
      if (!storyMinutes.some((s) => Math.abs(s - m) < 5)) {
        events.push({ kind, minute: m });
      }
      m += 10 + rng() * 5;
    }
    return events;
  }

  for (let m = rng() * 10; m < 24 * 60; m += 10 + rng() * 5) {
    let kind: LandsbyEventKind;
    if (day === 14) {
      const r = rng();
      kind = r < 0.35 ? "blafugl" : r < 0.7 ? "brevfugler" : "tarnklokke";
    } else {
      kind = rng() < 0.5 ? "brevfugler" : "tarnklokke";
    }
    if (storyMinutes.some((s) => Math.abs(s - m) < 5)) continue;
    events.push({ kind, minute: m });
  }
  return events;
}

/**
 * Event permission rules:
 * - blafugl: day 14 only
 * - luciatog: day 13 only
 * - frozen days 10 and 21: letter birds and outdoor events stay home until code
 */
export function landsbyEventAllowed(
  kind: LandsbyEventKind,
  day: number,
  solved: boolean,
): boolean {
  if (kind === "blafugl" && day !== 14) return false;
  if (kind === "luciatog" && day !== 13) return false;
  if ((day === 10 || day === 21) && !solved && kind !== "tarnklokke") {
    return false;
  }
  return true;
}

/** The village event playing at `date`, with progress 0–1, or null. */
export function activeLandsbyEvent(
  date: Date,
  day: number,
  solved: boolean,
  storyMinutes: number[] = [],
): { kind: LandsbyEventKind; progress: number } | null {
  const o = getOsloTime(date);
  const now = o.hour * 60 + o.minute + o.second / 60;
  for (const e of landsbyEvents(day, storyMinutes)) {
    const progress = ((now - e.minute) * 60) / LANDSBY_EVENT_SECONDS[e.kind];
    if (
      progress >= 0 &&
      progress < 1 &&
      landsbyEventAllowed(e.kind, day, solved)
    ) {
      return { kind: e.kind, progress };
    }
  }
  return null;
}

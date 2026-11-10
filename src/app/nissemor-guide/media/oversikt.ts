import type { MediaStatus } from "@/lib/media";
import { frostLevelFor, frostModeFor } from "@/lib/frost";
import {
  CHANNELS,
  FREQ_HOME,
  FREQ_KULDE,
  channelEffects,
  channelFallback,
  channelSource,
  latestIntercept,
  type ChannelId,
} from "@/components/windows/snofall-tv/channels";

const pad = (n: number) => String(n).padStart(2, "0");

/** TV changes per day (historie-2026 §9). Empty files = code only. */
const TV_EVENTS: Record<number, { name: string; files: string[] }> = {
  1: { name: "Innsøking 85,0 → 90,0", files: [] },
  3: { name: "Første spøkelsesbilde", files: ["video/tv/grotte-rolig.mp4"] },
  7: { name: "Kuldes signatur", files: [] },
  10: { name: "Fargene forsvinner", files: [] },
  11: { name: "Antennen jammes", files: ["video/tv/antenne-dag11.mp4"] },
  12: { name: "Sukket i isen", files: ["video/tv/grotte-dag12.mp4"] },
  14: { name: "Brevfugl fra grotten", files: ["video/tv/kontor-dag14.mp4"] },
  15: { name: "Vintervokteren", files: ["video/tv/grotte-dag15.mp4"] },
  17: { name: "Nordlys", files: ["video/tv/landsby-nordlys.mp4"] },
  18: { name: "Kastevind", files: ["video/tv/landsby-storm.mp4"] },
  20: { name: "Varselet (flimmer)", files: [] },
  21: { name: "Muren og porten", files: ["video/tv/grotte-dag21.mp4"] },
  23: { name: "Sannheten", files: ["video/tv/grotte-dag23.mp4"] },
  24: {
    name: "Tøvær",
    files: ["video/tv/landsby-dag24.mp4", "video/tv/grotte-dag24.mp4"],
  },
};

export interface ItemStatus {
  label: string;
  files: string[];
  /** Every file present (true for code-only TV events). */
  ok: boolean;
}

export interface DayRow {
  day: number;
  julius: ItemStatus;
  rampenissen: ItemStatus;
  /** null: nothing changes on TV that day. */
  tv: ItemStatus | null;
}

export function dayRows(files: MediaStatus[]): DayRow[] {
  const present = new Set(
    files.filter((f) => f.size !== null).map((f) => f.path),
  );
  const item = (label: string, paths: string[]): ItemStatus => ({
    label,
    files: paths,
    ok: paths.every((p) => present.has(p)),
  });
  return Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;
    const tv = TV_EVENTS[day];
    return {
      day,
      julius: item("Julius-video", [`video/julius/dag-${pad(day)}.mp4`]),
      rampenissen: item("Rampenissen-klipp", [
        `audio/rampenissen/dag-${pad(day)}.mp3`,
      ]),
      tv: tv
        ? item(tv.files.length ? tv.name : `${tv.name} (kode)`, tv.files)
        : null,
    };
  });
}

export interface ChannelView {
  key: string;
  label: string;
  src: string | null;
  fallback: string | null;
  fx: ReturnType<typeof channelEffects>;
  intercept?: string;
}

/**
 * What K1–K4 and 85,0 MHz show on a day, as SnøfallTV computes it.
 * K3 shows its background loop (Julius' video plays over it on the real TV).
 * Day 21 solved shows the end of the thaw: all channels thawed.
 */
export function lookThrough(
  day: number,
  hour: number,
  solved: boolean,
): ChannelView[] {
  const state = {
    day,
    solved,
    frost: frostLevelFor(day, solved) ?? 0,
    mode: frostModeFor({
      day,
      month: 12,
      hour,
      solved,
      disabled: false,
    }).level,
    thawed: day === 21 && solved ? CHANNELS.length : 0,
  };
  const views: [ChannelId, number, string][] = [
    ...CHANNELS.map(
      (c) =>
        [c.id, FREQ_HOME, `K${c.id} ${c.name}`] as [ChannelId, number, string],
    ),
    [4, FREQ_KULDE, "85,0 MHz KRYSTALLGROTTEN"],
  ];
  return views.map(([ch, freq, label]) => ({
    key: `${ch}-${freq}`,
    label,
    src: channelSource(ch, day, hour, freq, solved),
    fallback: channelFallback(ch, freq, day),
    fx: channelEffects(ch, freq, state),
    intercept:
      ch === 4 && freq === FREQ_KULDE && day >= 3
        ? latestIntercept(day)
        : undefined,
  }));
}

/** Manifest path from a /media/ URL, for status lookups. */
export const pathOf = (url: string) =>
  decodeURIComponent(url.replace(/^\/media\//, ""));

import type { MediaStatus } from "@/lib/media";
import { variantOf } from "@/lib/media-status";
import { frostLevelFor, frostModeFor } from "@/lib/frost";
import {
  CHANNELS,
  FREQ_HOME,
  FREQ_KULDE,
  channelEffects,
  channelFallback,
  channelSource,
  interceptFor,
  type ChannelId,
} from "@/components/windows/snofall-tv/channels";

const pad = (n: number) => String(n).padStart(2, "0");

/** «Versjon vK» for a Julius variant, null for the main file. */
export const variantLabel = (path: string) => {
  const k = variantOf(path);
  return k ? `Versjon v${k}` : null;
};

/** The day's Julius files in the listing: variants newest first, main file last. */
export function juliusFiles(
  day: number,
  files: MediaStatus[] | null,
): string[] {
  const main = `video/julius/dag-${pad(day)}.mp4`;
  const variants = (files ?? [])
    .map((f) => f.path)
    .filter((p) => p.startsWith(`video/julius/dag-${pad(day)}-v`))
    .sort((a, b) => variantOf(b) - variantOf(a));
  return [...variants, main];
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
    hour,
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
        ? interceptFor(day)
        : undefined,
  }));
}

/** Manifest path from a /media/ URL, for status lookups. */
export const pathOf = (url: string) =>
  decodeURIComponent(url.replace(/^\/media\//, ""));

export type ReviewKindId =
  | "julius"
  | "rampenissen"
  | "tv"
  | "port"
  | "music"
  | "stills"
  | "strek"
  | "spill"
  | "promo";

export interface ReviewGroup {
  id: ReviewKindId;
  title: string;
}

export const REVIEW_GROUPS: readonly ReviewGroup[] = [
  { id: "julius", title: "Julius per dag" },
  { id: "rampenissen", title: "Rampenissen per dag" },
  { id: "tv", title: "TV-looper og hendelser" },
  { id: "port", title: "Port" },
  { id: "music", title: "Musikk" },
  { id: "stills", title: "Stillbilder" },
  { id: "strek", title: "Rampestrek" },
  { id: "spill", title: "Spillbilder og sprites" },
  { id: "promo", title: "Promo" },
] as const;

export function reviewKind(path: string): ReviewKindId {
  if (path.startsWith("video/julius/")) return "julius";
  if (path.startsWith("audio/rampenissen/")) return "rampenissen";
  if (path.startsWith("video/tv/port-")) return "port";
  if (path.startsWith("video/tv/")) return "tv";
  if (path.startsWith("music/")) return "music";
  if (path.startsWith("feed/")) return "stills";
  if (path.startsWith("strek/")) return "strek";
  if (path.startsWith("spill/")) return "spill";
  if (path.startsWith("promo/")) return "promo";
  return "tv";
}

export function sortReviewItems<T extends { path: string }>(
  items: T[],
  kind: ReviewKindId,
): T[] {
  if (kind === "julius" || kind === "rampenissen") {
    return [...items].sort((a, b) => {
      const matchA = a.path.match(/dag-(\d+)/);
      const matchB = b.path.match(/dag-(\d+)/);
      const dayA = matchA ? Number(matchA[1]) : 0;
      const dayB = matchB ? Number(matchB[1]) : 0;
      return dayA - dayB || variantOf(b.path) - variantOf(a.path);
    });
  }
  return [...items].sort((a, b) => a.path.localeCompare(b.path));
}

export { groupVersions, versionKey } from "@/lib/media-status";

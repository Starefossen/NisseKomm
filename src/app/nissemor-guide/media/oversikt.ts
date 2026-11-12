import type { MediaStatus } from "@/lib/media";
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

export type CellState =
  | "godkjent"
  | "ikke_vurdert"
  | "lag_paa_nytt"
  | "utdatert"
  | "mangler"
  | "kode";

export interface ItemStatus {
  label: string;
  files: string[];
  /** Every file present (true for code-only TV events). */
  ok: boolean;
  state: CellState;
  /** Verdict note, or the newer version waiting («v4 klar»). */
  note?: string;
  klar?: string;
}

export interface DayRow {
  day: number;
  julius: ItemStatus;
  rampenissen: ItemStatus;
  /** null: nothing changes on TV that day. */
  tv: ItemStatus | null;
}

/** Review and inventory data the day table reads; without it every present file is «ikke vurdert». */
export interface Review {
  vurderinger: Record<string, { vurdering?: string; notat?: string }>;
  inventar: Map<string, { status: string }>;
}

const variantOf = (path: string) =>
  Number(path.match(/-v(\d+)\.mp4$/)?.[1] ?? 0);

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

// Worst first: a cell shows the state that needs attention most.
const WORST: CellState[] = [
  "mangler",
  "lag_paa_nytt",
  "utdatert",
  "ikke_vurdert",
  "godkjent",
];

export function dayRows(files: MediaStatus[], review?: Review): DayRow[] {
  const present = new Set(
    files.filter((f) => f.size !== null).map((f) => f.path),
  );
  const stateOf = (p: string): { state: CellState; note?: string } => {
    if (!present.has(p)) return { state: "mangler" };
    const v = review?.vurderinger[p];
    if (v?.vurdering === "lag_paa_nytt")
      return { state: "lag_paa_nytt", note: v.notat };
    if (review?.inventar.get(p)?.status === "stale")
      return { state: "utdatert" };
    return { state: v?.vurdering === "godkjent" ? "godkjent" : "ikke_vurdert" };
  };
  const item = (label: string, paths: string[]): ItemStatus => {
    // The plain name is what the app plays; with no plain file, the newest version stands in.
    let klar: string | undefined;
    const used = paths.map((p) => {
      if (present.has(p)) return p;
      const v = juliusVariantsOf(p, present)[0];
      if (v) klar = v.match(/-(v\d+)\.\w+$/)?.[1];
      return v ?? p;
    });
    const states = used.map(stateOf);
    const state: CellState = paths.length
      ? WORST.find((w) => states.some((s) => s.state === w))!
      : "kode";
    return {
      label,
      files: paths,
      ok: paths.every((p) => present.has(p)),
      state,
      note: states.find((s) => s.state === state)?.note,
      klar: klar ? `${klar} klar` : undefined,
    };
  };
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

/** Present -vN files beside a plain path, newest first. */
function juliusVariantsOf(path: string, present: Set<string>): string[] {
  const stem = path.replace(/(\.\w+)$/, "");
  return [...present]
    .filter((p) => p.startsWith(`${stem}-v`))
    .sort((a, b) => variantOf(b) - variantOf(a));
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

/** dag-01-v3.mp4 and dag-01.old.mp3 belong with dag-01.mp4 / dag-01.mp3. */
export const versionKey = (path: string) =>
  path.replace(/-v\d+(\.\w+)$/, "$1").replace(/\.old\d*(\.\w+)$/, "$1");

/** .old oldest, the plain name next (it is what the app plays), then -vN by N. */
const versionRank = (path: string) =>
  /\.old\d*\.\w+$/.test(path)
    ? 0
    : path === versionKey(path)
      ? 0.5
      : Number(path.match(/-v(\d+)\.\w+$/)?.[1] ?? 0);

export interface VersionGroup<T> {
  /** The path the app uses: the plain name. */
  key: string;
  newest: T;
  /** Everything but newest, newest first. */
  older: T[];
}

/** Items grouped by versionKey, in the order the keys first appear. */
export function groupVersions<T extends { path: string }>(
  items: T[],
): VersionGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = versionKey(it.path);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  return [...groups].map(([key, list]) => {
    const [newest, ...older] = list.sort(
      (a, b) => versionRank(b.path) - versionRank(a.path),
    );
    return { key, newest, older };
  });
}

import TAGGER from "@/data/vurdering-tagger.json";

/**
 * Quick tags on a verdict, a fixed list per type (src/data/vurdering-tagger.json,
 * season-independent; python reads the same file). Ids without a type get none.
 */
export type TaggType = keyof typeof TAGGER;
export { TAGGER };

export function taggType(id: string): TaggType | null {
  if (id.startsWith("video/julius/")) return "julius";
  if (id.startsWith("video/tv/")) return "tv";
  if (id.startsWith("audio/rampenissen/")) return "radio";
  if (/\/rampestrek$/.test(id) || /\.(png|jpe?g|webp)$/.test(id))
    return "bilde";
  return null;
}

export const taggerFor = (id: string): string[] => {
  const t = taggType(id);
  return t ? TAGGER[t] : [];
};

export const tidTekst = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** « [mikrofon, pause @0:36]» for one-line listings; empty without tags or time. */
export function taggLinje(v?: { tagger?: string[]; tid?: number }) {
  const deler = [
    ...(v?.tagger ?? []),
    ...(v?.tid !== undefined ? [`@${tidTekst(v.tid)}`] : []),
  ];
  return deler.length ? ` [${deler.join(", ")}]` : "";
}

/** Tag counts per type over all verdicts, for the Lærdom tab. */
export function taggTelling(
  vurd: Record<string, { tagger?: string[] }>,
): [TaggType, [string, number][]][] {
  const n = new Map<TaggType, Map<string, number>>();
  for (const [id, v] of Object.entries(vurd)) {
    const t = taggType(id);
    if (!t || !v.tagger?.length) continue;
    const m = n.get(t) ?? new Map<string, number>();
    for (const x of v.tagger) m.set(x, (m.get(x) ?? 0) + 1);
    n.set(t, m);
  }
  return [...n].map(([t, m]) => [t, [...m].sort((a, b) => b[1] - a[1])]);
}

/**
 * The server's merge rules for synced keys (/api/state). No pg here, so the
 * client (shrinks) and jsdom tests use exactly what the server does.
 */

// Lists two screens append to at once; merged per item instead of overwritten.
export const MERGED_KEYS = new Set([
  "nissekomm-codes",
  "nissekomm-julius-watched",
  "nissekomm-bonusoppdrag-completed",
  "nissekomm-santa-letters",
  "nissekomm-viewed-emails",
  "nissekomm-viewed-bonusoppdrag-emails",
  // A symbol scanned on the phone must survive the TV saving its own list.
  "nissekomm-earned-badges",
  "nissekomm-collected-symbols",
  "nissekomm-solved-decryptions",
  "nissekomm-unlocked-files",
  // Seen marks: every screen opens windows, none may un-see another's.
  "nissekomm-intros-seen",
]);

// Objects two parents (or screens) edit at once: merged per field, incoming
// wins per field. Dropping a field goes through replace (see shrinks).
export const FIELD_MERGED_KEYS = new Set([
  "nissekomm-handlet",
  "nissekomm-failed-attempts",
  "nissekomm-topic-unlocks",
  "nissekomm-foreldre-avkrysning",
]);

export const itemId = (key: string, x: unknown) => {
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    // Two kids may each write a letter the same day; old letters have no from.
    if (key === "nissekomm-santa-letters")
      return JSON.stringify([o.day, o.from ?? null]);
    return JSON.stringify(
      o.day ?? o.dag ?? o.kode ?? o.badgeId ?? o.symbolId ?? o,
    );
  }
  return JSON.stringify(x);
};

type Slede = Record<
  string,
  { poeng: number; bjeller: number; utfordringDag?: number }
>;
const rank = (r?: { poeng: number; bjeller: number }) =>
  r ? r.bjeller * 1e9 + r.poeng : -1;
const isObj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);

const unionList = (key: string, stored: unknown[], incoming: unknown[]) => {
  const byId = new Map(stored.map((x) => [itemId(key, x), x]));
  for (const x of incoming) byId.set(itemId(key, x), x);
  return [...byId.values()];
};

/** Stored value merged with an incoming write (not a replace). */
export function mergeValue(key: string, stored: unknown, incoming: unknown) {
  // Sledesimulator: two screens each keep their best run per stage
  // (same order as GameEngine.recordSledeResultat: bells, then points);
  // a passed daily challenge survives a run that ranks the same or lower.
  if (key === "nissekomm-slede" && isObj(stored) && isObj(incoming)) {
    const out: Slede = { ...(stored as Slede) };
    for (const [id, r] of Object.entries(incoming as Slede)) {
      const old = out[id];
      const best = rank(r) > rank(old) ? r : old;
      const dag = Math.max(old?.utfordringDag ?? 0, r?.utfordringDag ?? 0);
      out[id] = dag ? { ...best, utfordringDag: dag } : best;
    }
    return out;
  }
  if (FIELD_MERGED_KEYS.has(key) && isObj(stored) && isObj(incoming)) {
    if (key !== "nissekomm-foreldre-avkrysning")
      return { ...stored, ...incoming };
    // Per checklist, a union of ticked items; an untick is a replace.
    const out: Record<string, unknown> = { ...stored };
    for (const [k, v] of Object.entries(incoming))
      out[k] =
        Array.isArray(v) && Array.isArray(out[k])
          ? unionList(key, out[k] as unknown[], v)
          : v;
    return out;
  }
  if (!MERGED_KEYS.has(key) || !Array.isArray(stored)) return incoming;
  if (!Array.isArray(incoming)) return incoming;
  return unionList(key, stored, incoming);
}

/** JSON with sorted keys and list items, so equal sets compare equal. */
const canon = (x: unknown): string =>
  Array.isArray(x)
    ? `[${x.map(canon).sort().join(",")}]`
    : isObj(x)
      ? `{${Object.keys(x)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canon(x[k])}`)
          .join(",")}}`
      : JSON.stringify(x ?? null);

/**
 * True when the server's merge of `next` into `prev` would not give `next`
 * (a removed item, an untick), so the write must go as replace. An edited
 * item (same id) merges, so a sibling's item on the server survives.
 */
export const shrinks = (key: string, prev: unknown, next: unknown) =>
  prev != null && canon(mergeValue(key, prev, next)) !== canon(next);

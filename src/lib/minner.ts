/**
 * «Minner»: what a season leaves behind for next year's ARKIVET window,
 * built from an archive snapshot (db.ts Arkiv). Never codes; tolerant of
 * older data shapes (letters without `from`, codes without `day`).
 */
import type { SantaLetter, SledeResultat } from "./storage";

type Snapshot = {
  sesong: number;
  arkivert: string;
  data: Record<string, unknown>;
};

const liste = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];

export function lagMinner({ sesong, arkivert, data }: Snapshot) {
  const brev: Record<string, { dag: number; tekst: string }[]> = {};
  for (const l of liste(
    data["nissekomm-santa-letters"],
  ) as Partial<SantaLetter>[]) {
    if (typeof l.day !== "number" || typeof l.content !== "string") continue;
    (brev[l.from ?? "uten navn"] ??= []).push({ dag: l.day, tekst: l.content });
  }

  const merker = liste(data["nissekomm-earned-badges"])
    .filter((b) => typeof b.badgeId === "string")
    .map((b) => ({
      id: b.badgeId as string,
      ...(typeof b.timestamp === "number"
        ? { dato: new Date(b.timestamp).toISOString() }
        : {}),
    }));

  // Family bests under the stage id, a player's under «Navn/etappe».
  const familie: Record<string, SledeResultat> = {};
  const spillere: Record<string, Record<string, SledeResultat>> = {};
  const slede = data["nissekomm-slede"];
  if (slede && typeof slede === "object")
    for (const [k, r] of Object.entries(
      slede as Record<string, SledeResultat>,
    )) {
      if (!r || typeof r.poeng !== "number") continue;
      const i = k.indexOf("/");
      if (i < 0) familie[k] = r;
      else (spillere[k.slice(0, i)] ??= {})[k.slice(i + 1)] = r;
    }

  const løst = new Map<number, string>();
  for (const c of liste(data["nissekomm-codes"]))
    if (typeof c.day === "number" && !løst.has(c.day))
      løst.set(c.day, typeof c.dato === "string" ? c.dato : "");
  const dagerLøst = [...løst]
    .sort(([a], [b]) => a - b)
    .map(([dag, dato]) => (dato ? { dag, dato } : { dag }));

  const navn = Array.isArray(data["nissekomm-player-names"])
    ? (data["nissekomm-player-names"] as unknown[]).filter(
        (n): n is string => typeof n === "string",
      )
    : [];

  return {
    sesong,
    arkivert,
    merker,
    brev,
    rekorder: { familie, spillere },
    dagerLøst,
    navn,
  };
}

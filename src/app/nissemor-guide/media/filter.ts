import type { Celle, Familie } from "@/lib/media-status";

/**
 * The media page's filter: chips AND across groups, OR within a group.
 * Kept in the URL query (`?s=ikke_vurdert,ny_versjon&t=julius&d=5&q=…`)
 * and the last one used in localStorage.
 */

export const TILSTANDER = [
  ["ikke_vurdert", "Ikke vurdert"],
  ["ny_versjon", "Ny versjon"],
  ["lag_paa_nytt", "Lag på nytt"],
  ["ok", "OK (lærdom)"],
  ["godkjent", "Godkjent"],
] as const;

export const HANDLINGER = [
  ["klar", "Klar til Ta i bruk"],
  ["utdatert", "Utdatert"],
  ["mangler", "Mangler"],
  ["valgfri", "Valgfri"],
] as const;

export const TYPER = [
  ["julius", "Julius"],
  ["radio", "Radio"],
  ["tv", "TV"],
  ["strek", "Rampestrek"],
  ["spill", "Spillbilder"],
  ["portrett", "Portretter"],
  ["promo", "Promo"],
  ["feed", "Feed/musikk"],
] as const;

export type Gruppe = "s" | "a" | "t";
export interface Filter {
  s: string[];
  a: string[];
  t: string[];
  d: number | null;
  q: string;
}

export const GJENSTAAR = ["ikke_vurdert", "ny_versjon", "lag_paa_nytt"];
export const STANDARD: Filter = { s: GJENSTAAR, a: [], t: [], d: null, q: "" };
export const TOMT: Filter = { s: [], a: [], t: [], d: null, q: "" };
export const LAGRET = "nissekomm-guide-media-filter";

export function typeAv(path: string): string | undefined {
  if (path.startsWith("video/julius/")) return "julius";
  if (path.startsWith("audio/rampenissen/")) return "radio";
  if (path.startsWith("video/tv/")) return "tv";
  if (path.startsWith("strek/")) return "strek";
  if (path.includes("portrett")) return "portrett";
  if (path.startsWith("spill/")) return "spill";
  if (path.startsWith("promo/")) return "promo";
  if (path.startsWith("feed/") || path.startsWith("music/")) return "feed";
}

export const dagAv = (path: string) => {
  const m = path.match(/dag-?(\d{1,2})(?!\d)/);
  return m ? Number(m[1]) : undefined;
};

export interface Rad {
  path: string;
  /** Review state: the newest candidate when one exists, else the file in use. */
  tilstand: Celle;
  /** Action states. */
  handling: string[];
  type?: string;
  dag?: number;
  tekst: string;
}

export function radAv(f: Familie): Rad {
  const v = f.kandidat ?? f.iBruk;
  // A missing file has nothing to review; «utdatert» is an action, the verdict
  // underneath still counts (an old file nobody reviewed is still to do).
  const c =
    v.celle === "mangler" || v.celle === "valgfri" ? v.celle : v.vurdert;
  return {
    path: f.key,
    tilstand: c,
    handling: [
      ...(f.kanTaIBruk ? ["klar"] : []),
      ...f.versjoner
        .map((v) => v.celle)
        .filter((x) => x === "utdatert" || x === "mangler" || x === "valgfri"),
    ],
    type: typeAv(f.key),
    dag: dagAv(f.key),
    tekst: [f.key, ...f.versjoner.map((v) => `${v.path} ${v.notat ?? ""}`)]
      .join(" ")
      .toLowerCase(),
  };
}

export function passer(r: Rad, f: Filter): boolean {
  return (
    (!f.s.length || f.s.includes(r.tilstand)) &&
    (!f.a.length || f.a.some((x) => r.handling.includes(x))) &&
    (!f.t.length || (!!r.type && f.t.includes(r.type))) &&
    (f.d === null || r.dag === f.d) &&
    (!f.q || r.tekst.includes(f.q.toLowerCase()))
  );
}

/** A card reviewed in this view stays until the filter changes (festet = version keys). */
export const synlig = (r: Rad, f: Filter, key: string, festet: Set<string>) =>
  festet.has(key) || passer(r, f);

export const antall = (rader: Rad[], f: Filter) =>
  rader.filter((r) => passer(r, f)).length;

export const tilQuery = (f: Filter) => {
  const p = new URLSearchParams();
  if (f.s.length) p.set("s", f.s.join(","));
  if (f.a.length) p.set("a", f.a.join(","));
  if (f.t.length) p.set("t", f.t.join(","));
  if (f.d !== null) p.set("d", String(f.d));
  if (f.q) p.set("q", f.q);
  // An empty filter must survive a reload rather than fall back to the default.
  return p.toString() || "alle";
};

export function fraQuery(q: string): Filter | null {
  const p = new URLSearchParams(q);
  if (![...p.keys()].some((k) => "s a t d q alle".split(" ").includes(k)))
    return null;
  const liste = (k: string) => p.get(k)?.split(",").filter(Boolean) ?? [];
  const d = Number(p.get("d"));
  return {
    s: liste("s"),
    a: liste("a"),
    t: liste("t"),
    d: d >= 1 && d <= 24 ? d : null,
    q: p.get("q") ?? "",
  };
}

export const erGjenstaar = (f: Filter) =>
  f.s.length === GJENSTAAR.length && GJENSTAAR.every((x) => f.s.includes(x));

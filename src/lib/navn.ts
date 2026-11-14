/**
 * The family's names in the browser. scripts/navn-loader.cjs swaps them for
 * tokens in browser bundles, so nothing served before login names the kids.
 * lastFamilie() fetches them once after login (GET /api/familie) and fills
 * every token in the bundled data in place (lib/navn-data.ts); the app and
 * the guide render nothing until it has resolved. Outside browser bundles
 * (server, jest) the source keeps real names and fyll() is a no-op.
 */
type Familie = { barn: string[]; hjem: string };

let familie: Familie | null = null;
let laster: Promise<boolean> | null = null;
const fyllere: (() => void)[] = [];

/** Registers in-place fillers for bundled data; they run once names arrive. */
export function vedNavn(f: () => void): void {
  fyllere.push(f);
  if (familie) f();
}

export function settFamilie(f: Familie): void {
  familie = f;
  for (const fy of fyllere) fy();
}

/** Fetches the names once per page; false while logged out (retry after login). */
export function lastFamilie(): Promise<boolean> {
  if (familie) return Promise.resolve(true);
  laster ??= fetch("/api/familie", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : null))
    .then((f: Familie | null) => {
      if (f?.barn) settFamilie(f);
      return !!f;
    })
    .catch(() => false)
    .finally(() => {
      laster = null;
    });
  return laster;
}

const TEGN = /\{\{(B[123]|b[123]|HJEM|hjem)(\^?)\}\}/g;
export const harTegn = (s: string) => s.includes("{{");

/** Real names for tokens; also maps tokens an older build stored in data. */
export function fyll(s: string): string {
  if (!familie || !harTegn(s)) return s;
  const f = familie;
  return s.replace(TEGN, (m, k: string, stor: string) => {
    const v = /hjem/i.test(k) ? f.hjem : f.barn[Number(k[1]) - 1];
    if (!v) return m;
    if (stor) return v.toUpperCase();
    return k === k.toLowerCase() ? v.toLowerCase() : v;
  });
}

/** fyll() over every string in a JSON-like tree, in place. */
export function fyllDyp(o: unknown): void {
  if (!familie || !o || typeof o !== "object") return;
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const v = rec[k];
    if (typeof v === "string") {
      if (harTegn(v)) rec[k] = fyll(v);
    } else fyllDyp(v);
    if (harTegn(k) && !Array.isArray(o)) {
      rec[fyll(k)] = rec[k];
      delete rec[k];
    }
  }
}

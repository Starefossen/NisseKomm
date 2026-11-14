/**
 * Fills the name tokens that scripts/navn-loader.cjs puts in browser bundles.
 * Outside the browser bundle (server, jest) the source keeps real names and
 * fyll() is a no-op.
 */
type Familie = { barn: string[]; hjem: string };

const LAGER = "nissekomm-familie";
let familie: Familie | null = null;

function hent(): Familie | null {
  if (familie || typeof window === "undefined") return familie;
  try {
    familie = JSON.parse(localStorage.getItem(LAGER) ?? "null");
  } catch {
    familie = null;
  }
  return familie;
}

export function settFamilie(f: Familie): void {
  familie = f;
  localStorage.setItem(LAGER, JSON.stringify(f));
}

export const harTegn = (s: string) => s.includes("{{");

export function fyll(s: string): string {
  const f = harTegn(s) ? hent() : null;
  if (!f) return s;
  return s.replace(/\{\{(B[123]|HJEM)(\^?)\}\}/g, (m, k: string, stor) => {
    const v = k === "HJEM" ? f.hjem : f.barn[Number(k[1]) - 1];
    if (!v) return m;
    return stor ? v.toUpperCase() : v;
  });
}

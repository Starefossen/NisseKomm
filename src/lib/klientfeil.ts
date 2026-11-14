import type { Store } from "@/lib/db";

/** Server-only kv key (not in STATE_KEYS, so /api/state never serves it). */
export const KLIENTFEIL_KEY = "nissekomm-klientfeil";
const MAKS = 200;

export interface Klientfeil {
  tid: string;
  rolle: "kid" | "parent";
  melding: string;
  rute: string;
  ua: string;
}

const kutt = (v: unknown, n: number) =>
  typeof v === "string" ? v.slice(0, n) : "";

/** Only message, path (no query: it can carry names or tickets), user agent and time. */
export function renskFeil(
  body: Record<string, unknown>,
  rolle: Klientfeil["rolle"],
  ua: string,
  nå = new Date(),
): Klientfeil | null {
  const melding = kutt(body.melding, 500).trim();
  if (!melding) return null;
  return {
    tid: nå.toISOString(),
    rolle,
    melding,
    rute: kutt(body.rute, 200).split(/[?#]/)[0],
    ua: ua.slice(0, 200),
  };
}

export async function lesKlientfeil(store: Store): Promise<Klientfeil[]> {
  const v = (await store.getState())[KLIENTFEIL_KEY];
  return Array.isArray(v) ? (v as Klientfeil[]) : [];
}

// ponytail: read-modify-write, two errors in the same millisecond can lose one; fine for a log.
export async function lagreKlientfeil(store: Store, f: Klientfeil) {
  const liste = [f, ...(await lesKlientfeil(store))].slice(0, MAKS);
  await store.putState(KLIENTFEIL_KEY, liste);
}

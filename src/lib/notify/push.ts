/**
 * Web push to the parents' installed guide (Nissemor-guiden PWA).
 * Subscriptions live in the server-only kv key PUSH_KEY, one per device
 * (endpoint), with the types that device wants. Off without VAPID keys.
 */
import type { Store } from "@/lib/db";

/** Not in STATE_KEYS/SERVER_KEYS: never synced, survives a season reset. */
export const PUSH_KEY = "nissekomm-push";
export const PUSH_SENT_KEY = "nissekomm-push-sendt";

export const PUSH_TYPER = ["kveld", "kode", "feil", "agent"] as const;
export type PushType = (typeof PUSH_TYPER)[number];

export interface PushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  typer: PushType[];
  lagt: string;
}

const pushPå = () =>
  !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export async function lesSubs(store: Store): Promise<PushSub[]> {
  const v = (await store.getState())[PUSH_KEY];
  return Array.isArray(v) ? (v as PushSub[]) : [];
}

/** Validates a browser PushSubscription JSON plus chosen types. */
export function renskSub(body: Record<string, unknown>): PushSub | null {
  const s = body.subscription as Record<string, unknown> | undefined;
  const keys = s?.keys as Record<string, unknown> | undefined;
  const endpoint = s?.endpoint;
  if (
    typeof endpoint !== "string" ||
    !/^https:\/\//.test(endpoint) ||
    endpoint.length > 1000 ||
    typeof keys?.p256dh !== "string" ||
    typeof keys?.auth !== "string"
  )
    return null;
  const typer = Array.isArray(body.typer)
    ? PUSH_TYPER.filter((t) => (body.typer as unknown[]).includes(t))
    : [...PUSH_TYPER];
  return {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    typer,
    lagt: new Date().toISOString(),
  };
}

// ponytail: read-modify-write with replace; two devices subscribing in the same instant can lose one (re-tap fixes it).
export async function lagreSub(store: Store, sub: PushSub) {
  const liste = (await lesSubs(store)).filter(
    (s) => s.endpoint !== sub.endpoint,
  );
  await store.putState(PUSH_KEY, [...liste, sub].slice(-20), true);
}

export async function fjernSub(store: Store, endpoint: string) {
  const liste = await lesSubs(store);
  const ny = liste.filter((s) => s.endpoint !== endpoint);
  if (ny.length !== liste.length) await store.putState(PUSH_KEY, ny, true);
}

export interface PushMelding {
  type: PushType;
  title: string;
  body: string;
  /** Opened on tap; must stay inside /nissemor-guide. */
  url?: string;
}

/** Sends to every device that wants `m.type`; drops gone subscriptions. Never throws. */
export async function sendPush(
  store: Store,
  m: PushMelding,
  kunEndpoint?: string,
): Promise<number> {
  if (!pushPå()) return 0;
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:nissemor@nissekomm.no",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const subs = (await lesSubs(store)).filter((s) =>
    kunEndpoint ? s.endpoint === kunEndpoint : s.typer.includes(m.type),
  );
  const payload = JSON.stringify({
    title: m.title,
    body: m.body,
    url: m.url ?? "/nissemor-guide",
    tag: m.type,
  });
  let ok = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s, payload, { TTL: 3600 });
        ok++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await fjernSub(store, s.endpoint);
        else console.error("[push] feilet", code ?? e);
      }
    }),
  );
  return ok;
}

/** Oslo date (YYYY-MM-DD) and hour for a moment. */
export function osloNå(nå = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Oslo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(nå)
      .map((x) => [x.type, x.value]),
  );
  return {
    dato: `${p.year}-${p.month}-${p.day}`,
    måned: Number(p.month),
    dag: Number(p.day),
    time: Number(p.hour),
  };
}

/**
 * Tonight's message: the evening of 30 Nov–23 Dec sets up tomorrow's day.
 * Null outside that window, before 20:00, or when there is nothing to set up.
 */
export function kveldMelding(
  nå: Date,
  antallTing: (dag: number) => number,
): PushMelding | null {
  const o = osloNå(nå);
  if (o.time < 20) return null;
  const dag =
    o.måned === 11 && o.dag === 30
      ? 1
      : o.måned === 12 && o.dag <= 23
        ? o.dag + 1
        : null;
  if (!dag) return null;
  const n = antallTing(dag);
  if (!n) return null;
  return {
    type: "kveld",
    title: "I kveld",
    body: `I kveld: ${n} ting å sette opp til dag ${dag}.`,
    url: `/nissemor-guide/dag/${dag}#kveld`,
  };
}

/** Sends tonight's message once per Oslo date. Returns whether it sent now. */
export async function sendKveld(
  store: Store,
  antallTing: (dag: number) => number,
  nå = new Date(),
): Promise<boolean> {
  const m = kveldMelding(nå, antallTing);
  if (!m) return false;
  const dato = osloNå(nå).dato;
  // The hit counter is atomic in Postgres: the first caller of the day wins.
  if ((await store.hit(`${PUSH_SENT_KEY}:${dato}`, 36 * 3600_000)) > 1)
    return false;
  await sendPush(store, m);
  return true;
}

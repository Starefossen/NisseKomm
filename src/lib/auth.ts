/**
 * Server-side login for one family: KID_CODE and PARENT_CODE from env.
 * Normalized codes are compared as sha256 digests in constant time.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStore, type Role } from "@/lib/db";
import { isLanMode } from "@/lib/mode";

export type { Role };

// One cookie per role, so a kid login in one tab doesn't end the guide
// session in another. Browsers drop Secure cookies (and so __Host-) on plain
// http to a LAN IP, so http gets unprefixed, non-Secure names.
const COOKIE_BASE: Record<Role, string> = {
  kid: "nissekomm",
  parent: "nissekomm-guide",
};
// X-Forwarded-Proto is client-controlled unless a proxy overwrites it, so it
// only counts with TRUST_PROXY=1 (set it behind a TLS-terminating proxy).
// The public production app is always https: a client-sent "http" there must
// not downgrade the cookie or the Origin check.
function isHttps(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "production" && !isLanMode()) return true;
  const proto =
    process.env.TRUST_PROXY === "1"
      ? request.headers.get("x-forwarded-proto")?.split(",")[0].trim()
      : undefined;
  return (proto ?? request.nextUrl.protocol.replace(":", "")) === "https";
}

export const cookieName = (role: Role, https: boolean) =>
  (https ? "__Host-" : "") + COOKIE_BASE[role];

// __Host- names can't be planted by a sibling host or over http, so they are
// always read (a proxy that drops the proto must not log the kids out).
// Unprefixed names only count on http, where nothing better exists.
function sessionTokens(request: NextRequest, role: Role): string[] {
  const names = [cookieName(role, true)];
  if (!isHttps(request)) names.push(cookieName(role, false));
  return names
    .map((n) => request.cookies.get(n)?.value)
    .filter((t): t is string => !!t);
}
// The guide only exists in lan mode, on the family's own network: 12 hours
// made Hans log in again every morning, so it lasts as long as the kids'.
const MAX_AGE: Record<Role, number> = {
  kid: 45 * 24 * 60 * 60,
  parent: 45 * 24 * 60 * 60,
};
const IP_LIMIT = 10;
const GLOBAL_LIMIT = 200;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY = 16 * 1024;

/** Lowercase, trim, and treat runs of spaces or hyphens as one separator. */
export function normalizeCode(code: string): string {
  return code
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, " ");
}

// The plaintext lives in env in this process, so a slow KDF adds nothing.
const hashCode = (code: string) =>
  createHash("sha256").update(normalizeCode(code)).digest();

function matches(input: Buffer, envValue: string | undefined): boolean {
  return !!envValue && timingSafeEqual(input, hashCode(envValue));
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function isValid(token: string, role: Role): Promise<boolean> {
  const key = sha256(token);
  const s = await getStore().getSession(key);
  if (!s || s.role !== role) return false;
  if (s.expires < Date.now()) {
    await getStore().deleteSession(key);
    return false;
  }
  return role !== "parent" || isLanMode();
}

/**
 * True if the request holds a valid session for one of `roles`, read only
 * from those roles' own cookies: a guide session in the same browser never
 * lends parent rights to a request that only accepts "kid".
 */
export async function hasRole(
  request: NextRequest,
  ...roles: Role[]
): Promise<boolean> {
  for (const role of roles) {
    for (const t of sessionTokens(request, role)) {
      if (await isValid(t, role)) return true;
    }
  }
  return false;
}

/** Hash of the request's first session cookie, a stable per-session key. */
export function sessionId(request: NextRequest): string {
  const t = [
    ...sessionTokens(request, "parent"),
    ...sessionTokens(request, "kid"),
  ][0];
  return t ? sha256(t) : "ingen";
}

export const isRole = (v: unknown): v is Role => v === "kid" || v === "parent";

function clearCookies(response: NextResponse, role: Role, schemes: boolean[]) {
  for (const https of schemes) {
    response.cookies.set(cookieName(role, https), "", {
      maxAge: 0,
      path: "/",
      secure: https,
      httpOnly: true,
      sameSite: "lax",
    });
  }
}

// Every cookie name of the role, whatever the scheme, so logout and re-login
// leave no old token alive in the store.
async function dropSessions(request: NextRequest, role: Role) {
  for (const https of [true, false]) {
    const t = request.cookies.get(cookieName(role, https))?.value;
    if (t) await getStore().deleteSession(sha256(t));
  }
}

/** Ends this role's session only; the other role stays logged in. */
export async function endSessions(
  request: NextRequest,
  response: NextResponse,
  role: Role,
): Promise<void> {
  await dropSessions(request, role);
  clearCookies(response, role, [true, false]);
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

function sameOrigin(request: NextRequest, o: URL | null, host: string | null) {
  if (!o || o.host !== host) return false;
  return !isHttps(request) || o.protocol === "https:";
}

/** Same-origin check alone, for bodyless writes such as DELETE. */
export function checkOrigin(request: NextRequest): NextResponse | null {
  let o: URL | null = null;
  try {
    o = new URL(request.headers.get("origin") ?? "");
  } catch {
    // missing or malformed
  }
  return sameOrigin(request, o, request.headers.get("host"))
    ? null
    : jsonError("Ugyldig forespørsel", 403);
}

/** Same-origin POST with a small JSON object body, or an error response. */
export async function readJsonBody(
  request: NextRequest,
  maxBody = MAX_BODY,
): Promise<Record<string, unknown> | NextResponse> {
  const origin = request.headers.get("origin");
  // Host only: the gateway enforces Host == SNI; X-Forwarded-Host is client-set.
  const host = request.headers.get("host");
  let originUrl: URL | null = null;
  try {
    originUrl = origin ? new URL(origin) : null;
  } catch {
    // malformed Origin is rejected below
  }
  if (!sameOrigin(request, originUrl, host)) {
    return jsonError("Ugyldig forespørsel", 403);
  }
  const length = Number(request.headers.get("content-length"));
  if (!length || length > maxBody) {
    return jsonError("Ugyldig forespørsel", 413);
  }
  const text = await request.text();
  try {
    const body = JSON.parse(text);
    if (body && typeof body === "object") return body;
  } catch {
    // fall through to the generic error
  }
  return jsonError("Ugyldig forespørsel", 400);
}

/**
 * The client's address. Behind TRUST_PROXY=1, each of the TRUSTED_PROXY_HOPS
 * proxies (default 1) appends the address it saw to X-Forwarded-For, so the
 * client is the entry that many places from the right; everything left of it
 * is client-set. Without a trusted proxy, or with too few entries, the caller
 * is unknown and shares one bucket.
 */
export function clientIp(request: NextRequest): string {
  if (process.env.TRUST_PROXY !== "1") return DELT;
  const n = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);
  const hops = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  return (hops.length >= n && hops.at(-n)?.trim()) || DELT;
}

export type CheckResult = Role | null | { retryAfter: number };

const DELT = "delt";
const SAKTE_MS = 1000;
const SAKTE_MAKS_MS = 5000;
// Next free slot for a wrong guess per shared bucket.
// ponytail: per process; one replica in production.
const neste = new Map<string, number>();
const sov = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Checks a code against both env codes. The correct code always gets in:
 * the limits only slow down guessing. Every attempt is counted before the
 * comparison (a parallel burst can't slip past the count). A wrong code from
 * a known address past IP_LIMIT, or a new one past GLOBAL_LIMIT, gets 429
 * until its window ends. A shared bucket (no trusted proxy) never locks,
 * since that would lock the family out; wrong guesses there are answered at
 * most one a second, each waiting at most SAKTE_MAKS_MS.
 */
export async function checkCode(
  code: string,
  request: NextRequest,
  role_hint = "",
): Promise<CheckResult> {
  const ip = clientIp(request);
  const store = getStore();
  const delt = ip === DELT;
  const { n, until } = delt
    ? { n: 0, until: 0 }
    : await store.hits(`ip:${ip}`, WINDOW_MS);
  const global = await store.hits("global", WINDOW_MS);
  const input = hashCode(code);
  // Both comparisons always run so timing doesn't reveal which code matched.
  const kid = matches(input, process.env.KID_CODE);
  const parent = matches(input, process.env.PARENT_CODE) && isLanMode();
  const role = parent ? "parent" : kid ? "kid" : null;
  if (role) {
    if (!delt) await store.clearHits(`ip:${ip}`);
    return role;
  }
  console.warn(
    `[auth] feil innlogging ip=${ip} xff=${JSON.stringify(request.headers.get("x-forwarded-for") ?? "")} rolle=${role_hint || "?"} tid=${new Date().toISOString()}`,
  );
  const vent = (t: number) => ({
    retryAfter: Math.max(1, Math.ceil((t - Date.now()) / 1000)),
  });
  if (delt) {
    const nå = Date.now();
    const slot = Math.max(nå, neste.get(ip) ?? 0);
    neste.set(ip, Math.min(slot, nå + SAKTE_MAKS_MS) + SAKTE_MS);
    await sov(Math.min(slot - nå, SAKTE_MAKS_MS));
    return null;
  }
  if (n > IP_LIMIT) return vent(until);
  if (global.n > GLOBAL_LIMIT && n > 1) return vent(global.until);
  return null;
}

export async function startSession(
  request: NextRequest,
  response: NextResponse,
  role: Role,
): Promise<void> {
  const https = isHttps(request);
  await dropSessions(request, role);
  const token = randomBytes(32).toString("base64url");
  await getStore().setSession(sha256(token), {
    role,
    expires: Date.now() + MAX_AGE[role] * 1000,
  });
  response.cookies.set(cookieName(role, https), token, {
    maxAge: MAX_AGE[role],
    path: "/",
    sameSite: "lax",
    secure: https,
    httpOnly: true,
  });
  // Browsers refuse Secure cookies from http, so only https can clear the
  // other name; the old token is dead in the store either way.
  if (https) clearCookies(response, role, [false]);
}

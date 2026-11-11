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
function isHttps(request: NextRequest): boolean {
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
const MAX_AGE: Record<Role, number> = {
  kid: 45 * 24 * 60 * 60,
  parent: 12 * 60 * 60,
};
const MAX_FAILURES = 20;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY = 16 * 1024;
const THROTTLE_MS = 1000;

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

/** Same-origin POST with a small JSON object body, or an error response. */
export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | NextResponse> {
  const origin = request.headers.get("origin");
  // Host only: the gateway enforces Host == SNI; X-Forwarded-Host is client-set.
  const host = request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    // malformed Origin is rejected below
  }
  if (!originHost || originHost !== host) {
    return jsonError("Ugyldig forespørsel", 403);
  }
  const length = Number(request.headers.get("content-length"));
  if (!length || length > MAX_BODY) {
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

let throttle: Promise<void> = Promise.resolve();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Checks a code against both env codes. Past 20 failures in 10 minutes,
 * attempts queue behind one chain at 1/s: brute force stays impractical
 * and the kids still get in.
 */
export async function checkCode(code: string): Promise<Role | null> {
  if ((await getStore().failureCount(WINDOW_MS)) > MAX_FAILURES) {
    await (throttle = throttle.then(() => sleep(THROTTLE_MS)));
  }
  const input = hashCode(code);
  // Both comparisons always run so timing doesn't reveal which code matched.
  const kid = matches(input, process.env.KID_CODE);
  const parent = matches(input, process.env.PARENT_CODE) && isLanMode();
  if (parent) return "parent";
  if (kid) return "kid";
  await getStore().addFailure(WINDOW_MS);
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

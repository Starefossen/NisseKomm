/**
 * Server-side login for one family: KID_CODE and PARENT_CODE from env.
 * Normalized codes are compared as sha256 digests in constant time.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStore, type Role } from "@/lib/db";
import { isLanMode } from "@/lib/mode";

export type { Role };

export const SESSION_COOKIE = "__Host-nissekomm";
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

export async function getRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const key = sha256(token);
  const s = await getStore().getSession(key);
  if (!s) return null;
  if (s.expires < Date.now()) {
    await getStore().deleteSession(key);
    return null;
  }
  if (s.role === "parent" && !isLanMode()) return null;
  return s.role;
}

export async function deleteSession(request: NextRequest): Promise<void> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await getStore().deleteSession(sha256(token));
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/** Same-origin POST with a small JSON object body, or an error response. */
export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | NextResponse> {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
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
  response: NextResponse,
  role: Role,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await getStore().setSession(sha256(token), {
    role,
    expires: Date.now() + MAX_AGE[role] * 1000,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    maxAge: MAX_AGE[role],
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: true,
  });
}

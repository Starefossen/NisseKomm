/**
 * Server-side login for one family: KID_CODE and PARENT_CODE from env.
 * Codes are scrypt-hashed once per process and compared in constant time.
 */
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isLanMode } from "@/lib/mode";

export type Role = "kid" | "parent";

export const SESSION_COOKIE = "__Host-nissekomm";
const MAX_AGE: Record<Role, number> = {
  kid: 45 * 24 * 60 * 60,
  parent: 12 * 60 * 60,
};
const MAX_FAILURES = 20;
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

const SALT = randomBytes(16);
const hashCode = (code: string) => scryptSync(normalizeCode(code), SALT, 32);

const envHashes = new Map<string, Buffer>();
function envHash(value: string): Buffer {
  let h = envHashes.get(value);
  if (!h) envHashes.set(value, (h = hashCode(value)));
  return h;
}

function matches(input: Buffer, envValue: string | undefined): boolean {
  return !!envValue && timingSafeEqual(input, envHash(envValue));
}

// ponytail: in-memory and per pod; T5 swaps this object for Postgres.
export const authStore = {
  sessions: new Map<string, { role: Role; expires: number }>(),
  failures: [] as number[],
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function getRole(request: NextRequest): Role | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const key = sha256(token);
  const s = authStore.sessions.get(key);
  if (!s || s.expires < Date.now()) {
    authStore.sessions.delete(key);
    return null;
  }
  if (s.role === "parent" && !isLanMode()) return null;
  return s.role;
}

export function deleteSession(request: NextRequest): void {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) authStore.sessions.delete(sha256(token));
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/** Same-origin POST with a small JSON object body, or an error response. */
export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | NextResponse> {
  const origin = request.headers.get("origin");
  const allowed = [request.nextUrl.origin, process.env.NEXT_PUBLIC_URL];
  if (!origin || !allowed.includes(origin)) {
    return jsonError("Ugyldig forespørsel", 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return jsonError("Ugyldig forespørsel", 413);
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return jsonError("Ugyldig forespørsel", 413);
  try {
    const body = JSON.parse(text);
    if (body && typeof body === "object") return body;
  } catch {
    // fall through to the generic error
  }
  return jsonError("Ugyldig forespørsel", 400);
}

/** Checks a code against both env codes. Failures count toward a global limit. */
export function checkCode(
  code: string,
  now = Date.now(),
): Role | "locked" | null {
  authStore.failures = authStore.failures.filter((t) => now - t < WINDOW_MS);
  if (authStore.failures.length >= MAX_FAILURES) return "locked";
  const input = hashCode(code);
  // Both comparisons always run so timing doesn't reveal which code matched.
  const kid = matches(input, process.env.KID_CODE);
  const parent = matches(input, process.env.PARENT_CODE) && isLanMode();
  if (parent) return "parent";
  if (kid) return "kid";
  authStore.failures.push(now);
  return null;
}

export function startSession(response: NextResponse, role: Role): void {
  const token = randomBytes(32).toString("base64url");
  authStore.sessions.set(sha256(token), {
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

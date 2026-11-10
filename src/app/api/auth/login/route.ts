/**
 * POST /api/auth/login  Body: { code: string }
 * Returns { role, kidCode? } and sets the session cookie.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  checkCode,
  jsonError,
  normalizeCode,
  readJsonBody,
  startSession,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body instanceof NextResponse) return body;
    if (typeof body.code !== "string" || !body.code.trim()) {
      return jsonError("Ugyldig kode", 400);
    }
    const role = await checkCode(body.code);
    if (!role) return jsonError("Ugyldig kode", 401);

    // The kid code doubles as {{KID_CODE}} in puzzles, so the client keeps it.
    const response = NextResponse.json(
      role === "kid"
        ? { role, kidCode: normalizeCode(body.code).toUpperCase() }
        : { role },
    );
    await startSession(response, role);
    return response;
  } catch {
    return jsonError("Noe gikk galt", 500);
  }
}

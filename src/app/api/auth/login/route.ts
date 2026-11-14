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
    // Which login page the attempt came from, for the failure log only.
    const side = request.headers.get("referer")?.includes("/nissemor-guide")
      ? "parent"
      : "kid";
    const role = await checkCode(body.code, request, side);
    if (role && typeof role === "object") {
      return NextResponse.json(
        { error: "For mange forsøk. Vent litt og prøv igjen." },
        { status: 429, headers: { "Retry-After": String(role.retryAfter) } },
      );
    }
    if (!role) return jsonError("Ugyldig kode", 401);

    // The kid code doubles as {{KID_CODE}} in puzzles, so the client keeps it.
    const response = NextResponse.json(
      role === "kid"
        ? { role, kidCode: normalizeCode(body.code).toUpperCase() }
        : { role },
    );
    await startSession(request, response, role);
    return response;
  } catch {
    return jsonError("Noe gikk galt", 500);
  }
}

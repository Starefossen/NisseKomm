/**
 * POST /api/auth/logout  Body: { role: "kid" | "parent" }
 * Ends that role's session only, so the guide and the kid app log out apart.
 */
import { NextRequest, NextResponse } from "next/server";
import { endSessions, isRole, jsonError, readJsonBody } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  if (!isRole(body.role)) return jsonError("Ugyldig forespørsel", 400);
  const response = NextResponse.json({ ok: true });
  await endSessions(request, response, body.role);
  return response;
}

/** POST /api/auth/logout  Deletes the sessions and clears their cookies. */
import { NextRequest, NextResponse } from "next/server";
import { endSessions, readJsonBody } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const response = NextResponse.json({ ok: true });
  await endSessions(request, response);
  return response;
}

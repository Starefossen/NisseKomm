/** POST /api/auth/logout  Deletes the session and clears the cookie. */
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, deleteSession, readJsonBody } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  await deleteSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    maxAge: 0,
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}

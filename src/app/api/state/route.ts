/**
 * GET /api/state  Returns all synced keys as { key: value }.
 * PUT /api/state  Body: { key, value }. Returns { value } after merging.
 * Both require a kid or parent session.
 */
import { NextRequest, NextResponse } from "next/server";
import { getRole, jsonError, readJsonBody } from "@/lib/auth";
import { STATE_KEYS, getStore } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  return NextResponse.json(await getStore().getState());
}

export async function PUT(request: NextRequest) {
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const { key, value } = body;
  if (typeof key !== "string" || !STATE_KEYS.has(key) || value === undefined) {
    return jsonError("Ugyldig nøkkel", 400);
  }
  return NextResponse.json({ value: await getStore().putState(key, value) });
}

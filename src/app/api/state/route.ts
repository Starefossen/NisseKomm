/**
 * GET /api/state  Returns all synced keys as { key: value }.
 * PUT /api/state  Body: { key, value }. Returns { value } after merging.
 * Both require a kid or parent session. Writes that mark a game moment
 * (day solved, bonus approved, frost off) fan out through notify().
 */
import { NextRequest, NextResponse } from "next/server";
import { getRole, jsonError, readJsonBody } from "@/lib/auth";
import { STATE_KEYS, getStore } from "@/lib/db";
import { getCurrentDate } from "@/lib/date-utils";
import { notify } from "@/lib/notify";
import { eventsForWrite, frostOnEvent } from "@/lib/notify/events";

// ponytail: per-process dedupe; fine with one replica, persist it if that changes.
const frostNotified = new Set<number>();

export async function GET(request: NextRequest) {
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  const state = await getStore().getState();
  const now = getCurrentDate();
  const frost = frostOnEvent(
    state,
    now.getDate(),
    now.getMonth() + 1,
    now.getHours(),
  );
  if (frost && !frostNotified.has(frost.day)) {
    frostNotified.add(frost.day);
    void notify(frost);
  }
  return NextResponse.json(state);
}

export async function PUT(request: NextRequest) {
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const { key, value } = body;
  if (typeof key !== "string" || !STATE_KEYS.has(key) || value === undefined) {
    return jsonError("Ugyldig nøkkel", 400);
  }
  const store = getStore();
  const before = (await store.getState())[key];
  const stored = await store.putState(key, value);
  for (const n of eventsForWrite(key, before, stored)) void notify(n);
  return NextResponse.json({ value: stored });
}

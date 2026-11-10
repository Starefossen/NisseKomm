/**
 * GET /api/state  Returns all synced keys as { key: value }.
 * PUT /api/state  Body: { key, value, replace?, version? }. Returns
 *                 { value, version } after merging; replace overwrites.
 *                 409 when `version` is older than the stored one.
 * DELETE /api/state  Parent only: season reset for every screen (resetState).
 * GET/PUT require a kid or parent session; 204 (sync off) with STORAGE_BACKEND=localStorage.
 * Writes that mark a game moment
 * (day solved, bonus approved, frost off) fan out through notify().
 */
import { NextRequest, NextResponse } from "next/server";
import { getRole, jsonError, readJsonBody } from "@/lib/auth";
import {
  STATE_KEYS,
  VERSION_KEY,
  getStore,
  resetState,
  storageBackend,
} from "@/lib/db";
import { SERVER_KEYS } from "@/lib/storage-adapter";
import { getAllOppdrag } from "@/lib/oppdrag";
import { getServerDate } from "@/lib/date-utils";
import { notify } from "@/lib/notify";
import { eventsForWrite, frostOnEvent } from "@/lib/notify/events";

// ponytail: per-process dedupe; fine with one replica, persist it if that changes.
const frostNotified = new Set<number>();

export async function GET(request: NextRequest) {
  if (storageBackend() !== "server")
    return new NextResponse(null, { status: 204 });
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  const state = await getStore().getState();
  const now = getServerDate(state["day-offset"]);
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
  // Internal keys (upload tickets and the like) never leave the server.
  const visible = new Set<string>([...STATE_KEYS, ...SERVER_KEYS, VERSION_KEY]);
  return NextResponse.json(
    Object.fromEntries(Object.entries(state).filter(([k]) => visible.has(k))),
  );
}

export async function PUT(request: NextRequest) {
  if (storageBackend() !== "server")
    return new NextResponse(null, { status: 204 });
  if (!(await getRole(request))) return jsonError("Ikke innlogget", 401);
  const body = await readJsonBody(request);
  if (body instanceof NextResponse) return body;
  const { key, value, replace, version } = body;
  if (typeof key !== "string" || !STATE_KEYS.has(key) || value === undefined) {
    return jsonError("Ugyldig nøkkel", 400);
  }
  if (key === "nissekomm-codes" && !realCodes(value)) {
    return jsonError("Ugyldig kode", 400);
  }
  const store = getStore();
  const state = await store.getState();
  const current = Number(state[VERSION_KEY] ?? 0);
  // ponytail: check-then-write race between two PUTs; fine for one family.
  if (typeof version === "number" && version < current) {
    return NextResponse.json({ version: current }, { status: 409 });
  }
  const stored = await store.putState(key, value, replace === true);
  for (const n of eventsForWrite(key, state[key], stored)) void notify(n);
  return NextResponse.json({
    value: stored,
    version: replace === true ? current + 1 : current,
  });
}

export async function DELETE(request: NextRequest) {
  if (storageBackend() !== "server")
    return new NextResponse(null, { status: 204 });
  const role = await getRole(request);
  if (!role) return jsonError("Ikke innlogget", 401);
  if (role !== "parent") return jsonError("Bare for foreldre", 403);
  await resetState();
  return NextResponse.json({ reset: true });
}

/** Every entry must be the real code for its day, so «solved» can't be faked. */
function realCodes(value: unknown): boolean {
  if (value === null) return true;
  if (!Array.isArray(value)) return false;
  const quests = getAllOppdrag();
  return value.every((c) => {
    const kode = String(c?.kode ?? "").toUpperCase();
    return quests.some(
      (q) =>
        q.kode.toUpperCase() === kode &&
        (c.day === undefined || c.day === q.dag),
    );
  });
}

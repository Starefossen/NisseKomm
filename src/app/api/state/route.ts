/**
 * GET /api/state  Returns all synced keys as { key: value }.
 * PUT /api/state  Body: { key, value, replace?, version? }. Returns
 *                 { value, version } after merging; replace overwrites.
 *                 409 { version, reset } when `version` is older than the
 *                 stored one; `reset` is the marker of the last season reset.
 *                 Without `version` it counts as 0 once a reset has happened,
 *                 so an old screen can't write last season into this one.
 * DELETE /api/state  Parent only: archives the state (kv_arkiv), then the
 *                 season reset for every screen. No archive, no reset.
 * GET/PUT require a kid or parent session; 204 (sync off) with STORAGE_BACKEND=localStorage.
 * Writes that mark a game moment
 * (day solved, bonus approved, frost off) fan out through notify().
 */
import { NextRequest, NextResponse } from "next/server";
import {
  checkOrigin,
  hasRole,
  jsonError,
  readJsonBody,
  sessionId,
} from "@/lib/auth";
import {
  STATE_KEYS,
  VERSION_KEY,
  arkiverOgNullstill,
  getStore,
  sjekkSesong,
  storageBackend,
} from "@/lib/db";
import { RESET_KEY, SERVER_KEYS } from "@/lib/storage-adapter";
import { getServerDate } from "@/lib/date-utils";
import { notify } from "@/lib/notify";
import { eventsForWrite, frostOnEvent } from "@/lib/notify/events";

// ponytail: per-process dedupe; fine with one replica, persist it if that changes.
const frostNotified = new Set<number>();

export async function GET(request: NextRequest) {
  if (storageBackend() !== "server")
    return new NextResponse(null, { status: 204 });
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  await sjekkSesong();
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
  const visible = new Set<string>([
    ...STATE_KEYS,
    ...SERVER_KEYS,
    VERSION_KEY,
    RESET_KEY,
  ]);
  return NextResponse.json(
    Object.fromEntries(Object.entries(state).filter(([k]) => visible.has(k))),
  );
}

const PUT_PER_MIN = 60;
const MAX_KEY_BYTES = 512 * 1024;
const MAX_PUT_BODY = 600 * 1024;

export async function PUT(request: NextRequest) {
  if (storageBackend() !== "server")
    return new NextResponse(null, { status: 204 });
  if (!(await hasRole(request, "kid", "parent")))
    return jsonError("Ikke innlogget", 401);
  // One key can hold a season of letters; the other routes keep 16 KB.
  const body = await readJsonBody(request, MAX_PUT_BODY);
  if (body instanceof NextResponse) return body;
  if ((await getStore().hit(`put:${sessionId(request)}`, 60_000)) > PUT_PER_MIN)
    return jsonError("For mange lagringer", 429);
  const { key, value, replace, version } = body;
  if (typeof key !== "string" || !STATE_KEYS.has(key) || value === undefined) {
    return jsonError("Ugyldig nøkkel", 400);
  }
  // Solves are written only by POST /api/kode (and the lan fasit route), so
  // this PUT can't be used to test guesses; only a parent may clear the key.
  if (key === "nissekomm-codes") {
    if (value !== null)
      return jsonError("Løste koder skrives av /api/kode", 400);
    if (!(await hasRole(request, "parent")))
      return jsonError("Bare for foreldre", 403);
  }
  await sjekkSesong();
  const store = getStore();
  const state = await store.getState();
  const current = Number(state[VERSION_KEY] ?? 0);
  // A merge can at most add the two together.
  const size = (v: unknown) => JSON.stringify(v ?? null).length;
  if (replace !== true && size(state[key]) + size(value) > MAX_KEY_BYTES)
    return jsonError("For mye data", 413);
  // ponytail: check-then-write race between two PUTs; fine for one family.
  const v =
    typeof version === "number"
      ? version
      : state[RESET_KEY] != null
        ? 0
        : current;
  if (v < current) {
    return NextResponse.json(
      { version: current, reset: state[RESET_KEY] ?? null },
      { status: 409 },
    );
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
  if (!(await hasRole(request, "parent"))) {
    return (await hasRole(request, "kid"))
      ? jsonError("Bare for foreldre", 403)
      : jsonError("Ikke innlogget", 401);
  }
  const nei = checkOrigin(request);
  if (nei) return nei;
  const a = await arkiverOgNullstill("nullstilling");
  return NextResponse.json({ reset: true, arkivert: a?.arkivert ?? null });
}

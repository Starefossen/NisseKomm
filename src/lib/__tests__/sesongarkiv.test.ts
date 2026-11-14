/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { newDb, DataType } from "pg-mem";
import type { Pool } from "pg";
import {
  arkiverOgNullstill,
  createFileStore,
  createMemoryStore,
  createPgStore,
  glemSesongSjekk,
  migrate,
  sjekkSesong,
  type Store,
} from "../db";
import { lagMinner } from "../minner";
import { SEASON, SEASON_KEY } from "../storage-adapter";

const FJOR = SEASON - 1;
const BREV = [
  { day: 1, content: "Kjære Julius" }, // before `from` existed
  { day: 2, from: "Kristian", content: "Hei" },
  { day: 2, from: "Håkon", content: "Hallo" },
];
const SLEDE = {
  tundra: { poeng: 900, bjeller: 3 },
  "Kristian/tundra": { poeng: 900, bjeller: 3, utfordringDag: 8 },
  "Håkon/tundra": { poeng: 700, bjeller: 2 },
};

async function fyll(store: Store) {
  await store.putState("nissekomm-santa-letters", BREV, true);
  await store.putState("nissekomm-slede", SLEDE, true);
  await store.putState(
    "nissekomm-earned-badges",
    [{ badgeId: "varmeberer", timestamp: 0 }],
    true,
  );
  await store.putState(
    "nissekomm-codes",
    [
      { kode: "HEMMELIG", dato: "2025-12-01T08:00:00Z", day: 1 },
      { kode: "GAMMEL", dato: "2025-12-02T08:00:00Z" }, // old: no day
    ],
    true,
  );
  await store.putState("nissekomm-eventyr", { kapittel: 2 }, true);
  await store.putState(SEASON_KEY, FJOR);
}

function pgMemPool(): Pool {
  const db = newDb({ noAstCoverageCheck: true });
  for (const name of ["pg_advisory_lock", "pg_advisory_unlock"])
    db.public.registerFunction({
      name,
      args: [DataType.integer],
      returns: DataType.bool,
      implementation: () => true,
    });
  db.public.registerFunction({
    name: "pg_advisory_xact_lock",
    args: [DataType.integer, DataType.integer],
    returns: DataType.bool,
    implementation: () => true,
  });
  const { Pool: MemPool } = db.adapters.createPg();
  return new MemPool() as Pool;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkiv-"));
const butikker: [string, () => Promise<Store>][] = [
  ["minne", async () => createMemoryStore()],
  [
    "fil",
    async () =>
      createFileStore(
        path.join(fs.mkdtempSync(path.join(tmp, "d")), "dev-store.json"),
      ),
  ],
  [
    "postgres",
    async () => {
      const p = pgMemPool();
      await migrate(p);
      return createPgStore(p);
    },
  ],
];

beforeEach(() => glemSesongSjekk());

describe.each(butikker)("sesongskifte (%s)", (_, lag) => {
  it("archives last season once before clearing it", async () => {
    const store = await lag();
    await fyll(store);
    await sjekkSesong(store);

    const state = await store.getState();
    expect(state["nissekomm-santa-letters"]).toBeNull();
    expect(state[SEASON_KEY]).toBe(SEASON);

    const [a, ...rest] = await store.arkiv(FJOR);
    expect(rest).toEqual([]);
    expect(a.grunn).toBe("sesongskifte");
    expect(a.data["nissekomm-santa-letters"]).toEqual(BREV);
    expect(a.data["nissekomm-slede"]).toEqual(SLEDE);
    expect(a.data["nissekomm-eventyr"]).toEqual({ kapittel: 2 });

    // Idempotent: a second check, or another screen, archives nothing new.
    glemSesongSjekk();
    await sjekkSesong(store);
    expect(await store.arkiver(FJOR, "sesongskifte", true)).toEqual(a);
    expect(await store.arkiv(FJOR)).toHaveLength(1);
  });

  it("stamps an unmarked state as this season without clearing it", async () => {
    const store = await lag();
    await store.putState("nissekomm-santa-letters", BREV, true);
    await sjekkSesong(store);
    const state = await store.getState();
    expect(state["nissekomm-santa-letters"]).toEqual(BREV);
    expect(state[SEASON_KEY]).toBe(SEASON);
    expect(await store.arkiv(SEASON)).toEqual([]);
  });

  it("appends a snapshot on every reset", async () => {
    const store = await lag();
    await fyll(store);
    await arkiverOgNullstill("nullstilling", SEASON, store);
    await store.putState("nissekomm-intros-seen", ["dag1"], true);
    await arkiverOgNullstill("nullstilling", SEASON, store);
    const liste = await store.arkiv(SEASON);
    expect(liste.map((a) => Object.keys(a.data).length)).toEqual([5, 1]);
    // Nothing left: no empty snapshot.
    expect(await arkiverOgNullstill("nullstilling", SEASON, store)).toBeNull();
    expect(await store.arkiv(SEASON)).toHaveLength(2);
  });
});

it("the file store writes arkiv-<sesong>.json beside the dev store", async () => {
  const dir = fs.mkdtempSync(path.join(tmp, "f"));
  const store = createFileStore(path.join(dir, "dev-store.json"));
  await fyll(store);
  await sjekkSesong(store);
  const fil = JSON.parse(
    fs.readFileSync(path.join(dir, `arkiv-${FJOR}.json`), "utf8"),
  );
  expect(fil[0].data["nissekomm-santa-letters"]).toEqual(BREV);
  // A restart reads it back.
  expect(
    await createFileStore(path.join(dir, "dev-store.json")).arkiv(FJOR),
  ).toHaveLength(1);
});

describe("minner", () => {
  it("keeps letters per child, records per player, badges and solved days, never codes", async () => {
    const store = createMemoryStore();
    await fyll(store);
    await sjekkSesong(store);
    const m = lagMinner((await store.arkiv(FJOR))[0]);
    expect(m.sesong).toBe(FJOR);
    expect(m.brev).toEqual({
      "uten navn": [{ dag: 1, tekst: "Kjære Julius" }],
      Kristian: [{ dag: 2, tekst: "Hei" }],
      Håkon: [{ dag: 2, tekst: "Hallo" }],
    });
    expect(m.rekorder.familie).toEqual({ tundra: SLEDE.tundra });
    expect(m.rekorder.spillere.Kristian.tundra.utfordringDag).toBe(8);
    expect(m.rekorder.spillere.Håkon.tundra.poeng).toBe(700);
    expect(m.merker).toEqual([
      { id: "varmeberer", dato: "1970-01-01T00:00:00.000Z" },
    ]);
    expect(m.dagerLøst).toEqual([{ dag: 1, dato: "2025-12-01T08:00:00Z" }]);
    expect(JSON.stringify(m)).not.toMatch(/HEMMELIG|GAMMEL|kode/);
  });

  it("survives junk and missing keys", () => {
    const m = lagMinner({
      sesong: 2025,
      arkivert: "",
      data: { "nissekomm-santa-letters": "x", "nissekomm-codes": [null, 3] },
    });
    expect(m).toMatchObject({ brev: {}, merker: [], dagerLøst: [] });
  });
});

import { test, expect } from "@jest/globals";
import { familie } from "@/lib/media-status";
import {
  antall,
  GJENSTAAR,
  fraQuery,
  passer,
  radAv,
  STANDARD,
  tilQuery,
  TOMT,
} from "./filter";

const k = {
  filer: [
    { path: "video/julius/dag-05.mp4", size: 1 },
    { path: "video/julius/dag-05-v2.mp4", size: 1 },
    { path: "audio/rampenissen/dag-05.mp3", size: null },
  ],
  vurderinger: {
    "video/julius/dag-05.mp4": { vurdering: "lag_paa_nytt" },
    "video/julius/dag-05-v2.mp4": { vurdering: "ok" },
  },
};

test("chips: AND across groups, OR within, candidate counts as ready", () => {
  const j = radAv(familie("video/julius/dag-05.mp4", k));
  const r = radAv(familie("audio/rampenissen/dag-05.mp3", k));
  expect(j).toMatchObject({ tilstand: "ok", type: "julius", dag: 5 });
  expect(j.handling).toContain("klar");
  expect(r.handling).toContain("mangler");
  expect(passer(j, STANDARD)).toBe(false);
  expect(passer(r, { ...TOMT, a: ["mangler", "klar"], d: 5 })).toBe(true);
  expect(passer(r, { ...TOMT, a: ["mangler"], t: ["julius"] })).toBe(false);
  expect(passer(j, { ...TOMT, q: "DAG-05-V2" })).toBe(true);
});

test("query round trip, empty filter survives", () => {
  const f = { ...TOMT, s: ["ok"], t: ["tv", "radio"], d: 3, q: "nord" };
  expect(fraQuery(tilQuery(f))).toEqual(f);
  expect(fraQuery(tilQuery(TOMT))).toEqual(TOMT);
  expect(fraQuery("?id=x")).toBeNull();
});

test("Julius counts: one per day, outdated and missing handled", () => {
  const p = (d: number, s = "") =>
    `video/julius/dag-${String(d).padStart(2, "0")}${s}.mp4`;
  const filer: { path: string; size: number | null }[] = [];
  const vurderinger: Record<string, { vurdering?: string }> = {};
  const inventar = new Map<string, { status: string }>();
  for (let d = 1; d <= 24; d++) {
    filer.push({ path: p(d), size: d <= 12 ? 1 : null });
    if (d >= 7 && d <= 12) inventar.set(p(d), { status: "stale" });
  }
  vurderinger[p(1)] = { vurdering: "godkjent" };
  vurderinger[p(2)] = { vurdering: "ok" };
  // 4-6: candidates; 4 approved, 5 rejected, 6 unreviewed
  for (const d of [4, 5, 6]) filer.push({ path: p(d, "-v2"), size: 1 });
  filer.push({ path: p(3, ".old-1"), size: 1 });
  vurderinger[p(4, "-v2")] = { vurdering: "ok" };
  vurderinger[p(5, "-v2")] = { vurdering: "lag_paa_nytt" };
  vurderinger[p(8)] = { vurdering: "ok" }; // stale but reviewed
  const k = { filer, vurderinger, inventar };
  const rader = Array.from({ length: 24 }, (_, i) =>
    radAv(familie(p(i + 1), k)),
  );
  const n = (f: Partial<typeof TOMT>) =>
    antall(rader, { ...TOMT, t: ["julius"], ...f });
  expect(n({ s: GJENSTAAR })).toBe(8); /* 3, 5, 6, 7, 9-12 */
  expect(n({ s: ["ikke_vurdert"] })).toBe(1 + 1 + 5); // 3, 6, 7 9-12
  expect(n({ s: ["lag_paa_nytt"] })).toBe(1);
  expect(n({ a: ["mangler"] })).toBe(12);
  expect(n({ a: ["utdatert"] })).toBe(6);
  expect(n({ a: ["klar"] })).toBe(1);
});

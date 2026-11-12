import { test, expect } from "@jest/globals";
import { familie } from "@/lib/media-status";
import { fraQuery, passer, radAv, STANDARD, tilQuery, TOMT } from "./filter";

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

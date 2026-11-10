import { describe, it, expect } from "@jest/globals";
import {
  MEDIA_GROUPS,
  MEDIA_MANIFEST,
  mediaGroup,
  mediaPath,
} from "@/lib/media";
import { dayRows, lookThrough } from "./oversikt";

const paths = MEDIA_MANIFEST.map(mediaPath);

describe("manifest groups", () => {
  it("puts every manifest file in exactly one group", () => {
    expect(paths.filter((p) => !mediaGroup(p))).toEqual([]);
    expect(MEDIA_GROUPS.map((g) => g.id)).toEqual([
      "julius",
      "rampenissen",
      "tv",
      "stills",
      "music",
    ]);
  });

  it("has 24 Julius videos and 24 Rampenissen clips", () => {
    const count = (id: string) =>
      paths.filter((p) => mediaGroup(p) === id).length;
    expect(count("julius")).toBe(24);
    expect(count("rampenissen")).toBe(24);
    expect(paths).toContain("audio/rampenissen/dag-01.mp3");
    expect(paths).toContain("audio/rampenissen/dag-24.mp3");
  });
});

describe("dayRows", () => {
  const files = paths.map((path) => ({
    path,
    size:
      path === "audio/rampenissen/dag-02.mp3" ||
      path === "video/tv/grotte-dag24.mp4"
        ? null
        : 1,
  }));
  const rows = dayRows(files);

  it("maps each day to its files and status", () => {
    expect(rows).toHaveLength(24);
    expect(rows[0].julius).toMatchObject({
      files: ["video/julius/dag-01.mp4"],
      ok: true,
    });
    expect(rows[1].rampenissen.ok).toBe(false);
    expect(rows[1].tv).toBeNull();
    expect(rows[9].tv).toMatchObject({ files: [], ok: true }); // day 10: code only
    expect(rows[16].tv?.files).toEqual(["video/tv/landsby-nordlys.mp4"]);
    expect(rows[23].tv?.ok).toBe(false);
  });

  it("only references manifest files", () => {
    const all = rows.flatMap((r) => [
      r.julius,
      r.rampenissen,
      r.tv ?? r.julius,
    ]);
    for (const f of all.flatMap((i) => i.files)) expect(paths).toContain(f);
  });
});

describe("lookThrough", () => {
  const src = (day: number, solved: boolean, hour = 12) =>
    Object.fromEntries(lookThrough(day, hour, solved).map((v) => [v.key, v]));

  it("shows K1–K4 and 85,0 MHz", () => {
    expect(Object.keys(src(1, false))).toEqual([
      "1-90",
      "2-90",
      "3-90",
      "4-90",
      "4-85",
    ]);
  });

  it("day 1: calm loops, no Kulde yet", () => {
    const v = src(1, false);
    expect(v["1-90"].src).toBe("/media/video/tv/landsby-rolig.mp4");
    expect(v["4-85"].src).toBeNull();
    expect(v["4-85"].fx.hijack).toBe(false);
    expect(v["1-90"].fx.frost).toBe(0);
  });

  it("day 10: grey until solved, grey ends after 20:00", () => {
    expect(src(10, false)["2-90"].fx.gray).toBe(true);
    expect(src(10, false)["2-90"].fx.frost).toBe(71);
    expect(src(10, true)["2-90"].fx.gray).toBe(false);
    expect(src(10, false, 21)["2-90"].fx.gray).toBe(false);
  });

  it("day 17: northern lights over the village, hijack on 85,0", () => {
    const v = src(17, false);
    expect(v["1-90"].src).toBe("/media/video/tv/landsby-nordlys.mp4");
    expect(v["4-85"].src).toBe("/media/video/tv/grotte-dag15.mp4");
    expect(v["4-85"].fx.hijack).toBe(true);
  });

  it("day 21: frozen before the code, thawed with a warm gate after", () => {
    const before = src(21, false);
    expect(Object.values(before).every((v) => v.fx.frozen)).toBe(true);
    const after = src(21, true);
    expect(Object.values(after).some((v) => v.fx.frozen)).toBe(false);
    expect(after["4-85"].src).toBe("/media/video/tv/grotte-dag21.mp4");
    expect(after["4-85"].fx.warm).toBe(true);
  });

  it("day 24: warm everywhere, thaw loops after the code", () => {
    const v = src(24, true);
    expect(v["1-90"].src).toBe("/media/video/tv/landsby-dag24.mp4");
    expect(v["4-85"].src).toBe("/media/video/tv/grotte-dag24.mp4");
    expect(Object.values(v).every((x) => x.fx.warm && x.fx.frost === 0)).toBe(
      true,
    );
  });
});

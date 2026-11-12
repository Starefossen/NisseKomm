import { describe, it, expect } from "@jest/globals";
import {
  MEDIA_GROUPS,
  MEDIA_MANIFEST,
  mediaGroup,
  mediaPath,
} from "@/lib/media";
import {
  dayRows,
  groupVersions,
  juliusFiles,
  variantLabel,
  lookThrough,
  REVIEW_GROUPS,
  reviewKind,
  sortReviewItems,
} from "./oversikt";

const paths = MEDIA_MANIFEST.map(mediaPath);

describe("manifest groups", () => {
  it("puts every manifest file in exactly one group", () => {
    expect(paths.filter((p) => !mediaGroup(p))).toEqual([]);
    expect(MEDIA_GROUPS.map((g) => g.id)).toEqual([
      "julius",
      "rampenissen",
      "tv",
      "slede",
      "stills",
      "spill",
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

describe("review kinds and sorting", () => {
  it("has the review kinds", () => {
    expect(REVIEW_GROUPS.map((g) => g.id)).toEqual([
      "julius",
      "rampenissen",
      "tv",
      "port",
      "music",
      "stills",
      "strek",
      "spill",
      "promo",
    ]);
  });

  it("maps paths to the correct review kind", () => {
    expect(reviewKind("video/julius/dag-05.mp4")).toBe("julius");
    expect(reviewKind("audio/rampenissen/dag-10.mp3")).toBe("rampenissen");
    expect(reviewKind("video/tv/port-julius.mp4")).toBe("port");
    expect(reviewKind("video/tv/port-winter.mp4")).toBe("port");
    expect(reviewKind("video/tv/landsby-rolig.mp4")).toBe("tv");
    expect(reviewKind("music/Jingle Bells.mp3")).toBe("music");
    expect(reviewKind("feed/landsby-rolig.jpg")).toBe("stills");
    expect(reviewKind("promo/julius-promo-A-v3.mp4")).toBe("promo");
  });

  it("sorts julius and rampenissen by day number", () => {
    const raw = [
      { path: "video/julius/dag-10.mp4" },
      { path: "video/julius/dag-02.mp4" },
      { path: "video/julius/dag-01.mp4" },
    ];
    const sorted = sortReviewItems(raw, "julius");
    expect(sorted.map((s) => s.path)).toEqual([
      "video/julius/dag-01.mp4",
      "video/julius/dag-02.mp4",
      "video/julius/dag-10.mp4",
    ]);
  });
});

describe("Julius variants", () => {
  it("lists variants newest first, main file last", () => {
    const files = [
      "video/julius/dag-01.mp4",
      "video/julius/dag-01-v2.mp4",
      "video/julius/dag-01-v10.mp4",
      "video/julius/dag-01-v3.mp4",
      "video/julius/dag-02-v3.mp4",
    ].map((path) => ({ path, size: 1 }));
    expect(juliusFiles(1, files)).toEqual([
      "video/julius/dag-01-v10.mp4",
      "video/julius/dag-01-v3.mp4",
      "video/julius/dag-01-v2.mp4",
      "video/julius/dag-01.mp4",
    ]);
    expect(juliusFiles(3, null)).toEqual(["video/julius/dag-03.mp4"]);
    expect(variantLabel("video/julius/dag-01-v3.mp4")).toBe("Versjon v3");
    expect(variantLabel("video/julius/dag-01.mp4")).toBeNull();
  });
});

describe("versjonsgrupper", () => {
  it("nyeste først, filen appen spiller er nøkkelen", () => {
    const g = groupVersions(
      [
        "video/julius/dag-01.mp4",
        "video/julius/dag-01-v2.mp4",
        "video/julius/dag-01-v4.mp4",
        "audio/rampenissen/dag-01.old-1.mp3",
        "audio/rampenissen/dag-01.mp3",
        "audio/rampenissen/dag-01.old-2.mp3",
        "strek/dag01.v-feil.png",
      ].map((path) => ({ path })),
    );
    expect(g.map((x) => x.key)).toEqual([
      "video/julius/dag-01.mp4",
      "audio/rampenissen/dag-01.mp3",
      "strek/dag01.v-feil.png", // not the convention: a file of its own
    ]);
    expect(g[1].older.map((o) => o.path)).toEqual([
      "audio/rampenissen/dag-01.old-2.mp3",
      "audio/rampenissen/dag-01.old-1.mp3",
    ]);
    expect(g[0].newest.path).toBe("video/julius/dag-01-v4.mp4");
    expect(g[0].older.map((o) => o.path)).toEqual([
      "video/julius/dag-01-v2.mp4",
      "video/julius/dag-01.mp4",
    ]);
    expect(g[1].newest.path).toBe("audio/rampenissen/dag-01.mp3");
  });
});

describe("dagstabell", () => {
  it("viser vurdering, utdatert og ny versjon", () => {
    const f = (path: string, size: number | null = 5) => ({ path, size });
    const rows = dayRows(
      [
        f("video/julius/dag-01.mp4"),
        f("video/julius/dag-02.mp4"),
        f("video/julius/dag-03-v4.mp4"),
        f("video/julius/dag-04.mp4"),
        f("video/julius/dag-05.mp4"),
      ],
      {
        vurderinger: {
          "video/julius/dag-01.mp4": { vurdering: "godkjent" },
          "video/julius/dag-02.mp4": {
            vurdering: "lag_paa_nytt",
            notat: "munn",
          },
        },
        inventar: new Map([["video/julius/dag-04.mp4", { status: "stale" }]]),
      },
    );
    expect(rows.slice(0, 6).map((r) => r.julius.state)).toEqual([
      "godkjent",
      "lag_paa_nytt",
      "ikke_vurdert",
      "utdatert",
      "ikke_vurdert",
      "mangler",
    ]);
    expect(rows[1].julius.note).toBe("munn");
    expect(rows[2].julius.klar).toBe("v4 klar");
  });
});

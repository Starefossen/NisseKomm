import { describe, expect, it } from "@jest/globals";
import { taggLinje, taggTelling, taggType } from "./vurdering-tagger";

describe("vurdering-tagger", () => {
  it("types by id", () => {
    expect(taggType("video/julius/dag-13-v2.mp4#s3")).toBe("julius");
    expect(taggType("dag/01/rampestrek")).toBe("bilde");
    expect(taggType("strek/dag01.png")).toBe("bilde");
    expect(taggType("audio/rampenissen/dag-01.mp3")).toBe("radio");
    expect(taggType("dag/01/gaatekart")).toBeNull();
  });
  it("lines and counts", () => {
    expect(taggLinje({ tagger: ["pause"], tid: 36.4 })).toBe(" [pause, @0:36]");
    expect(taggLinje({})).toBe("");
    expect(
      taggTelling({
        "video/julius/a.mp4#s1": { tagger: ["pause", "kutt"] },
        "video/julius/b.mp4": { tagger: ["pause"] },
      }),
    ).toEqual([
      [
        "julius",
        [
          ["pause", 2],
          ["kutt", 1],
        ],
      ],
    ]);
  });
});

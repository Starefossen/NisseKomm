import { describe, it, expect } from "@jest/globals";
import { holdLastFrame, videoShouldPlay } from "./LiveCam";

describe("LiveCam video lifecycle", () => {
  it("plays only while visible, moving and not frozen", () => {
    const base = { hidden: false, frozen: false, reduceMotion: false };
    expect(videoShouldPlay(base)).toBe(true);
    expect(videoShouldPlay({ ...base, hidden: true })).toBe(false);
    expect(videoShouldPlay({ ...base, frozen: true })).toBe(false);
    expect(videoShouldPlay({ ...base, reduceMotion: true })).toBe(false);
  });

  it("holds the last frame at the loop seam instead of going black", () => {
    expect(holdLastFrame(1, true)).toBe(true);
    expect(holdLastFrame(4, true)).toBe(false);
    // Never had a picture: show snow and «INGEN BÆREBØLGE».
    expect(holdLastFrame(0, false)).toBe(false);
  });
});

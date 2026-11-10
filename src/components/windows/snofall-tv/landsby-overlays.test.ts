import { describe, it, expect } from "@jest/globals";
import {
  activeLandsbyEvent,
  landsbyEventAllowed,
  landsbyEvents,
} from "./channels";
import { LANDSBY_POINTS, SKY_BOTTOM, framePoint } from "./landsby-overlays";

describe("landsbyEvents", () => {
  it("is the same schedule for the same day and differs between days", () => {
    expect(landsbyEvents(5)).toEqual(landsbyEvents(5));
    expect(landsbyEvents(5)).not.toEqual(landsbyEvents(6));
  });

  it("spaces events 10–15 minutes apart", () => {
    for (let day = 1; day <= 24; day++) {
      const m = landsbyEvents(day).map((e) => e.minute);
      for (let i = 1; i < m.length; i++) {
        const gap = m[i] - m[i - 1];
        expect(gap).toBeGreaterThanOrEqual(10);
        expect(gap).toBeLessThanOrEqual(15);
      }
    }
  });

  it("keeps 5 minutes clear of story events", () => {
    const story = [19 * 60, 8 * 60 + 3];
    for (const e of landsbyEvents(9, story)) {
      for (const s of story)
        expect(Math.abs(e.minute - s)).toBeGreaterThan(5 - 1e-9);
    }
  });

  it("reports the event playing at a given time", () => {
    const e = landsbyEvents(3)[10];
    const at = new Date(2026, 11, 3, 0, 0, 0);
    at.setSeconds(Math.ceil(e.minute * 60) + 2);
    expect(activeLandsbyEvent(at, 3, false)?.kind).toBe(e.kind);
  });
});

describe("frost rules", () => {
  it("grounds the letter birds on frozen days 10 and 21 until solved", () => {
    expect(landsbyEventAllowed("brevfugler", 10, false)).toBe(false);
    expect(landsbyEventAllowed("brevfugler", 21, false)).toBe(false);
    expect(landsbyEventAllowed("brevfugler", 21, true)).toBe(true);
    expect(landsbyEventAllowed("brevfugler", 14, false)).toBe(true);
    expect(landsbyEventAllowed("tarnklokke", 10, false)).toBe(true);
  });

  it("never returns birds as active on day 10 before the code", () => {
    for (const e of landsbyEvents(10).filter((e) => e.kind === "brevfugler")) {
      const at = new Date(2026, 11, 10, 0, 0, 0);
      at.setSeconds(Math.ceil(e.minute * 60) + 1);
      expect(activeLandsbyEvent(at, 10, false)).toBeNull();
    }
  });
});

describe("framePoint", () => {
  it("maps frame fractions onto the drawn video rectangle", () => {
    const full = { x: 0, y: 0, w: 1280, h: 720 };
    const [px, py] = framePoint(LANDSBY_POINTS.postkasse, full);
    expect(px).toBeCloseTo(825.6);
    expect(py).toBeCloseTo(424.8);
    const [tx, ty] = framePoint(LANDSBY_POINTS.tarn, {
      x: -20,
      y: -10,
      w: 640,
      h: 360,
    });
    expect(tx).toBeCloseTo(-20 + 0.504 * 640);
    expect(ty).toBeCloseTo(-10 + 0.604 * 360);
  });

  it("puts the postkasse right of the tower and both below the sky", () => {
    expect(LANDSBY_POINTS.postkasse[0]).toBeGreaterThan(LANDSBY_POINTS.tarn[0]);
    expect(LANDSBY_POINTS.urskive[1]).toBeGreaterThan(SKY_BOTTOM);
  });
});

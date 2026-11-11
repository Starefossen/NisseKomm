import { describe, it, expect, jest } from "@jest/globals";
import {
  activeLandsbyEvent,
  channelSource,
  landsbyEventAllowed,
  landsbyEvents,
  phaseAt,
  phaseGradeAt,
  TV_GRADE_OVERRIDE,
  TV_PHASE_LOOP_OVERRIDE,
  type LandsbyEventKind,
} from "./channels";
import {
  LANDSBY_POINTS,
  SKY_BOTTOM,
  framePoint,
  drawLandsbyEvent,
} from "./landsby-overlays";

describe("landsbyEvents", () => {
  it("is the same schedule for the same day and differs between days", () => {
    expect(landsbyEvents(5)).toEqual(landsbyEvents(5));
    expect(landsbyEvents(5)).not.toEqual(landsbyEvents(6));
  });

  it("spaces events 10–15 minutes apart on standard days", () => {
    for (let day = 1; day <= 24; day++) {
      if (day === 13) continue; // day 13 has Lucia procession once per 20 min between 06–09
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

describe("overlay schedule by day (blå fugl dag 14 og luciatog dag 13)", () => {
  it("includes blafugl on day 14 only", () => {
    const d14Events = landsbyEvents(14);
    const hasBlafugl = d14Events.some((e) => e.kind === "blafugl");
    expect(hasBlafugl).toBe(true);

    // Other days must never contain blafugl
    for (const d of [1, 10, 12, 13, 15, 21, 24]) {
      const kinds = landsbyEvents(d).map((e) => e.kind);
      expect(kinds).not.toContain("blafugl");
    }
  });

  it("includes luciatog on day 13 only, 06:00–09:00, once per 20 minutes", () => {
    const d13Events = landsbyEvents(13);
    const luciaEvents = d13Events.filter((e) => e.kind === "luciatog");
    expect(luciaEvents.length).toBe(9); // 360, 380, 400, 420, 440, 460, 480, 500, 520

    for (const e of luciaEvents) {
      expect(e.minute).toBeGreaterThanOrEqual(360); // 06:00
      expect(e.minute).toBeLessThan(540); // 09:00
    }

    for (let i = 1; i < luciaEvents.length; i++) {
      expect(luciaEvents[i].minute - luciaEvents[i - 1].minute).toBe(20);
    }

    // Outside 06:00–09:00 on day 13 there are no luciatog events
    const outsideLucia = d13Events.filter(
      (e) => (e.minute < 360 || e.minute >= 540) && e.kind === "luciatog",
    );
    expect(outsideLucia).toEqual([]);

    // Other days must never contain luciatog
    for (const d of [1, 10, 12, 14, 15, 21, 24]) {
      const kinds = landsbyEvents(d).map((e) => e.kind);
      expect(kinds).not.toContain("luciatog");
    }
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

  it("enforces day gates and frost rules for blafugl and luciatog", () => {
    // blafugl: day 14 only
    expect(landsbyEventAllowed("blafugl", 14, false)).toBe(true);
    expect(landsbyEventAllowed("blafugl", 13, false)).toBe(false);
    expect(landsbyEventAllowed("blafugl", 15, true)).toBe(false);

    // luciatog: day 13 only
    expect(landsbyEventAllowed("luciatog", 13, false)).toBe(true);
    expect(landsbyEventAllowed("luciatog", 14, false)).toBe(false);
    expect(landsbyEventAllowed("luciatog", 12, true)).toBe(false);

    // Frost days block non-tarnklokke events when unsolved
    expect(landsbyEventAllowed("blafugl", 10, false)).toBe(false);
    expect(landsbyEventAllowed("luciatog", 21, false)).toBe(false);
  });

  it("never returns birds as active on day 10 before the code", () => {
    for (const e of landsbyEvents(10).filter((e) => e.kind === "brevfugler")) {
      const at = new Date(2026, 11, 10, 0, 0, 0);
      at.setSeconds(Math.ceil(e.minute * 60) + 1);
      expect(activeLandsbyEvent(at, 10, false)).toBeNull();
    }
  });
});

describe("reduced motion and drawing", () => {
  function makeMockCtx(): CanvasRenderingContext2D {
    return {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      rect: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      clip: jest.fn(),
      fillRect: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      shadowColor: "",
      shadowBlur: 0,
      lineWidth: 1,
      fillStyle: "",
      strokeStyle: "",
    } as unknown as CanvasRenderingContext2D;
  }

  it("draws all event kinds at static frame (progress 0.5) without errors", () => {
    const ctx = makeMockCtx();
    const rect = { x: 0, y: 0, w: 1280, h: 720 };

    const kinds: LandsbyEventKind[] = [
      "brevfugler",
      "tarnklokke",
      "blafugl",
      "luciatog",
    ];
    for (const kind of kinds) {
      expect(() => {
        // Reduced motion: progress 0.5, static time
        drawLandsbyEvent(ctx, kind, 0.5, rect, 0);
      }).not.toThrow();
    }
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});

describe("phaseAt and time-of-day colour grade", () => {
  it("calculates phase boundaries including midnight correctly", () => {
    // natt: 19–06
    expect(phaseAt(0).phase).toBe("natt"); // midnight
    expect(phaseAt(0).next).toBe(6);
    expect(phaseAt(5).phase).toBe("natt");
    expect(phaseAt(5).next).toBe(6);

    // morgen: 06–09
    expect(phaseAt(6).phase).toBe("morgen");
    expect(phaseAt(6).next).toBe(9);
    expect(phaseAt(8).phase).toBe("morgen");
    expect(phaseAt(8).next).toBe(9);

    // dag: 09–15
    expect(phaseAt(9).phase).toBe("dag");
    expect(phaseAt(9).next).toBe(15);
    expect(phaseAt(14).phase).toBe("dag");
    expect(phaseAt(14).next).toBe(15);

    // skumring: 15–19
    expect(phaseAt(15).phase).toBe("skumring");
    expect(phaseAt(15).next).toBe(19);
    expect(phaseAt(18).phase).toBe("skumring");
    expect(phaseAt(18).next).toBe(19);

    // natt: 19–24
    expect(phaseAt(19).phase).toBe("natt");
    expect(phaseAt(19).next).toBe(30);
    expect(phaseAt(23).phase).toBe("natt");
    expect(phaseAt(23).next).toBe(30);
  });

  it("applies correct colour grades per phase", () => {
    // skumring: no grade
    const skumring = phaseGradeAt(16, 30, 0);
    expect(skumring.phase).toBe("skumring");
    expect(skumring.filter).toBe("none");
    expect(skumring.vignette).toBe(0);

    // morgen: lighter and less saturated
    const morgen = phaseGradeAt(7, 30, 0);
    expect(morgen.phase).toBe("morgen");
    expect(morgen.brightness).toBeGreaterThan(1.0);
    expect(morgen.saturate).toBeLessThan(1.0);
    expect(morgen.vignette).toBe(0);
    expect(morgen.filter).toMatch(/brightness\(1\.100\)/);

    // dag: lighter and less saturated
    const dag = phaseGradeAt(12, 0, 0);
    expect(dag.phase).toBe("dag");
    expect(dag.brightness).toBeGreaterThan(1.0);
    expect(dag.saturate).toBeLessThan(1.0);
    expect(dag.vignette).toBe(0);
    expect(dag.filter).toMatch(/brightness\(1\.150\)/);

    // natt: darker with a vignette
    const natt = phaseGradeAt(22, 0, 0);
    expect(natt.phase).toBe("natt");
    expect(natt.brightness).toBeLessThan(1.0);
    expect(natt.vignette).toBeGreaterThan(0.5);
    expect(natt.filter).toMatch(/brightness\(0\.650\)/);
  });

  it("smoothly cross-fades over 60 s at phase changes", () => {
    // At exactly 06:00:00 (transition just starting, progress 0)
    const t0 = phaseGradeAt(6, 0, 0);
    expect(t0.phase).toBe("morgen");
    expect(t0.previousPhase).toBe("natt");
    expect(t0.transitionProgress).toBe(0);
    expect(t0.brightness).toBeCloseTo(0.65);
    expect(t0.vignette).toBeCloseTo(0.7);

    // At 06:00:30 (halfway through 60s transition)
    const t30 = phaseGradeAt(6, 0, 30);
    expect(t30.transitionProgress).toBe(0.5);
    expect(t30.brightness).toBeCloseTo((0.65 + 1.1) / 2);
    expect(t30.vignette).toBeCloseTo(0.35);

    // At 06:01:00 (transition complete)
    const t60 = phaseGradeAt(6, 1, 0);
    expect(t60.transitionProgress).toBe(1);
    expect(t60.brightness).toBeCloseTo(1.1);
    expect(t60.vignette).toBe(0);
  });

  it("honours per-phase override table for rendered loops", () => {
    try {
      TV_GRADE_OVERRIDE.morgen = "none";
      const g = phaseGradeAt(7, 0, 0);
      expect(g.filter).toBe("none");
      expect(g.vignette).toBe(0);

      TV_PHASE_LOOP_OVERRIDE.natt = "video/tv/landsby-natt.mp4";
      const src = channelSource(1, 1, 22, 90);
      expect(src).toBe("/media/video/tv/landsby-natt.mp4");

      const gnatt = phaseGradeAt(22, 0, 0);
      expect(gnatt.filter).toBe("none");
      expect(gnatt.vignette).toBe(0);
    } finally {
      delete TV_GRADE_OVERRIDE.morgen;
      delete TV_PHASE_LOOP_OVERRIDE.natt;
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

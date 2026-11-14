import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JuliusVideo } from "./JuliusVideo";
import { GameEngine } from "@/lib/game-engine";
import { getAdventDay, getCurrentDay, setTimeOverride } from "@/lib/date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("JuliusVideo", () => {
  beforeEach(() => {
    localStorage.clear();
    setTimeOverride({ day: 3, month: 12, hour: 8, minute: 0 });
  });

  it("a failed video load does not count as watched", () => {
    const day = getCurrentDay();
    const el = document.createElement("div");
    act(() => createRoot(el).render(<JuliusVideo day={day} />));

    act(() => {
      el.querySelector("video")!.dispatchEvent(new Event("error"));
    });

    expect(el.textContent).toContain("FORBINDELSEN ER SVAK");
    expect(GameEngine.isJuliusVideoWatched(day)).toBe(false);
  });
});

describe("JuliusVideo autoplay", () => {
  beforeEach(() => {
    localStorage.clear();
    setTimeOverride({ day: 5, month: 12, hour: 8, minute: 0 });
  });

  const render = (day: number) => {
    const el = document.createElement("div");
    act(() => createRoot(el).render(<JuliusVideo day={day} autoPlay />));
    return el.querySelector("video")!;
  };

  it("starts only today's unwatched video", () => {
    expect(render(5).autoplay).toBe(true);
    expect(render(4).autoplay).toBe(false);
    GameEngine.markJuliusVideoWatched(5);
    expect(render(5).autoplay).toBe(false);
  });

  it("sends nothing before December", () => {
    setTimeOverride({ day: 11, month: 11, hour: 8, minute: 0 });
    expect(render(1)).toBeNull();
  });

  it("shows all 24 after Christmas", () => {
    setTimeOverride({ day: 27, month: 12, hour: 8, minute: 0 });
    expect(render(24)).not.toBeNull();
    setTimeOverride({ day: 5, month: 1, hour: 8, minute: 0 });
    expect(render(24)).not.toBeNull();
  });
});

describe("getAdventDay", () => {
  it.each([
    [11, 30, 0],
    [12, 1, 1],
    [12, 24, 24],
    [12, 25, 24],
    [1, 10, 24],
    [3, 1, 0],
  ])("month %i day %i -> %i", (month, day, want) => {
    setTimeOverride({ day, month, hour: 8, minute: 0 });
    expect(getAdventDay()).toBe(want);
  });
});

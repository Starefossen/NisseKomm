import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JuliusVideo } from "./JuliusVideo";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, setTimeOverride } from "@/lib/date-utils";

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

    expect(el.textContent).toContain("SIGNALET ER SVAKT");
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
});

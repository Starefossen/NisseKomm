import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JuliusVideo } from "./JuliusVideo";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay } from "@/lib/date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("JuliusVideo", () => {
  beforeEach(() => localStorage.clear());

  it("a failed video load does not count as watched", () => {
    const day = Math.max(1, getCurrentDay());
    const el = document.createElement("div");
    act(() => createRoot(el).render(<JuliusVideo day={day} />));

    act(() => {
      el.querySelector("video")!.dispatchEvent(new Event("error"));
    });

    expect(el.textContent).toContain("SIGNALET ER SVAKT");
    expect(GameEngine.isJuliusVideoWatched(day)).toBe(false);
  });
});

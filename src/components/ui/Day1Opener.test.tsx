import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { BOOT_TICKS, Day1Boot, Day1Tail, TAIL_TICKS } from "./Day1Opener";
import { maskRunes, RuneText } from "./Frostrune";
import { GameEngine } from "@/lib/game-engine";
import { latestRuneLine } from "../windows/snofall-tv/runer";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount(node: React.ReactNode) {
  const el = document.createElement("div");
  act(() => createRoot(el).render(node));
  return el;
}

describe("Day-1 opener (T14)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  it("boot plays to the carrier line, then marks itself seen", () => {
    const onDone = jest.fn();
    const el = mount(<Day1Boot onDone={onDone} />);
    expect(el.textContent).toContain("KOBLER TIL SNØFALL");
    expect(GameEngine.isIntroSeen("boot")).toBe(false);
    for (let i = 0; i < BOOT_TICKS; i++)
      act(() => {
        jest.advanceTimersByTime(250);
      });
    expect(el.textContent).toContain("BÆREBØLGE 90,0: USTABIL");
    expect(el.textContent).toContain("K3 JULIUS");
    expect(onDone).toHaveBeenCalled();
    expect(GameEngine.isIntroSeen("boot")).toBe(true);
  });

  it("boot is skippable with a click", () => {
    const onDone = jest.fn();
    const el = mount(<Day1Boot onDone={onDone} />);
    act(() => (el.firstChild as HTMLElement).click());
    expect(onDone).toHaveBeenCalled();
    expect(GameEngine.isIntroSeen("boot")).toBe(true);
  });

  it("tail slips to 85,0 and back, once", () => {
    const onDone = jest.fn();
    const el = mount(<Day1Tail onDone={onDone} />);
    const seen: string[] = [];
    for (let i = 0; i < TAIL_TICKS; i++) {
      seen.push(el.textContent ?? "");
      act(() => {
        jest.advanceTimersByTime(250);
      });
    }
    expect(seen.some((t) => t.includes("85,0"))).toBe(true);
    expect(seen.at(-1)).toContain("90,0 · STABIL");
    expect(onDone).toHaveBeenCalled();
    expect(GameEngine.isIntroSeen("tail")).toBe(true);
  });
});

describe("Rune lines (T12)", () => {
  it("masks letters the kids have not learned", () => {
    expect(maskRunes("SE MEG", new Set(["S", "E"]))).toEqual([
      "S",
      "E",
      " ",
      null,
      "E",
      null,
    ]);
  });

  it("draws learned letters as runes and the rest as frost", () => {
    const el = mount(<RuneText text="ALENE" learned={new Set(["E", "L"])} />);
    expect(el.querySelectorAll("svg")).toHaveLength(3);
    expect(el.querySelectorAll("[data-frost]")).toHaveLength(2);
    expect(el.textContent).not.toMatch(/[AN]/);
  });

  it("follows the ghost image of the day", () => {
    expect(latestRuneLine(9)).toBeUndefined();
    expect(latestRuneLine(10)).toBe("SE MEG");
    expect(latestRuneLine(11)).toBeUndefined();
    expect(latestRuneLine(22)).toBe("LYSET DERES");
  });
});

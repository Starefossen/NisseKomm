import { describe, it, expect, jest } from "@jest/globals";
import { sim } from "@/lib/simulation";
import { getTimeOverride } from "@/lib/date-utils";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Tidsmaskin } from "./Tidsmaskin";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const button = (el: HTMLElement) =>
  [...el.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("TIDSMASKIN"),
  );

describe("Tidsmaskin", () => {
  it("panel replaces the button; [X] and Escape close it", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    act(() => createRoot(el).render(<Tidsmaskin />));

    act(() => button(el)!.click());
    expect(button(el)).toBeUndefined();
    expect(el.textContent).toContain("TIDSMASKIN (test)");
    act(() =>
      el.querySelector<HTMLButtonElement>('[aria-label="Lukk"]')!.click(),
    );
    expect(el.querySelector('[role="dialog"]')).toBeNull();

    act(() => button(el)!.click());
    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(button(el)).toBeDefined();
  });

  it("«Gå til dag med fremgang» solves the days before the chosen one", async () => {
    const solve = jest.spyOn(sim, "solveUntil").mockResolvedValue(undefined);
    const el = document.createElement("div");
    act(() => createRoot(el).render(<Tidsmaskin />));
    act(() => button(el)!.click());
    const select = el.querySelector("select")!;
    act(() => {
      select.value = "5";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const go = [...el.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Gå til dag med fremgang",
    )!;
    await act(async () => go.click());
    expect(getTimeOverride()?.day).toBe(5);
    expect(solve).toHaveBeenCalledWith(4);
  });
});

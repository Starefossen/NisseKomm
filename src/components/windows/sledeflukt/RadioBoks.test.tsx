import { describe, expect, it } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { RadioBoks } from "./RadioBoks";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("RadioBoks", () => {
  it("sits above the result card, so the line at the finish shows", () => {
    const el = document.createElement("div");
    act(() =>
      createRoot(el).render(
        <RadioBoks kø={[{ tekst: "Hei", id: 1 }]} onFerdig={() => {}} />,
      ),
    );
    const boks = el.querySelector("[role=status]")!;
    expect(boks.textContent).toContain("Hei");
    expect(boks.className).toMatch(/\bz-10\b/);
  });
});

import { describe, it, expect, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Puslespill } from "./Puslespill";
import type { PuslespillDef } from "./minispill";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const LAAS: PuslespillDef = {
  type: "laas",
  tittel: "Skaplås",
  flagg: "k9_skap",
  tekst: "",
  hjul: [["1", "2", "3"]],
  svar: ["3"],
};

describe("Puslespill", () => {
  it("lås løses med knappene, Avbryt og TIPS virker", () => {
    jest.useFakeTimers();
    const lost = jest.fn();
    const avbryt = jest.fn();
    const el = document.createElement("div");
    act(() =>
      createRoot(el).render(
        <Puslespill
          p={LAAS}
          onLost={lost}
          onAvbryt={avbryt}
          onTips={() => "Prøv tre."}
        />,
      ),
    );
    const knapp = (l: string) =>
      [...el.querySelectorAll("button")].find(
        (b) => b.getAttribute("aria-label") === l || b.textContent === l,
      )!;
    act(() => knapp("TIPS").click());
    expect(el.textContent).toContain("Prøv tre.");
    act(() => knapp("Hjul 1 opp").click());
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(lost).toHaveBeenCalled();
    act(() => knapp("Avbryt").click());
    expect(avbryt).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

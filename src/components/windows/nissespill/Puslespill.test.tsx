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
          onTips={() => ({ tekst: "Prøv tre." })}
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

  it("skyv: brikkene står der de stod etter Avbryt, og siste tips kan løse", () => {
    const SKYV: PuslespillDef = {
      type: "skyv",
      tittel: "Kort",
      flagg: "k9_kort",
      tekst: "",
      trekk: 14,
      seed: 7,
    };
    const vis = () => {
      const el = document.createElement("div");
      const root = createRoot(el);
      const lost = jest.fn();
      act(() =>
        root.render(
          <Puslespill
            p={SKYV}
            onLost={lost}
            onAvbryt={() => {}}
            onTips={() => ({ tekst: "Siste.", siste: true })}
          />,
        ),
      );
      const brikker = () =>
        [...el.querySelectorAll("button")]
          .map((b) => b.getAttribute("aria-label"))
          .filter((l) => l === "Tomt felt" || /^Brikke/.test(l ?? ""))
          .join(",");
      return { el, root, lost, brikker };
    };
    const a = vis();
    const flyttbar = [...a.el.querySelectorAll("button")].find(
      (b) => /^Brikke/.test(b.getAttribute("aria-label") ?? "") && !b.disabled,
    )!;
    const foer = a.brikker();
    act(() => flyttbar.click());
    const etter = a.brikker();
    act(() => a.root.unmount());
    const b = vis();
    if (etter !== foer) expect(b.brikker()).toBe(etter);
    jest.useFakeTimers();
    const knapp = (l: string) =>
      [...b.el.querySelectorAll("button")].find((x) => x.textContent === l)!;
    act(() => knapp("TIPS").click());
    act(() => knapp("La Rampenissen ta den siste biten").click());
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(b.lost).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("radio: − og + stiller ett steg og «Nesten» sier retning", () => {
    const el = document.createElement("div");
    act(() =>
      createRoot(el).render(
        <Puslespill
          p={{
            type: "radio",
            tittel: "R",
            flagg: "k9_r",
            tekst: "",
            min: 89,
            max: 91,
            maal: 90.5,
            toleranse: 0.3,
            steg: 0.1,
          }}
          onLost={() => {}}
          onAvbryt={() => {}}
          onTips={() => ({ tekst: "" })}
        />,
      ),
    );
    const knapp = (l: string) =>
      [...el.querySelectorAll("button")].find(
        (b) => b.getAttribute("aria-label") === l || b.textContent === l,
      )!;
    act(() => knapp("Litt opp").click());
    expect(el.textContent).toContain("89.1");
    act(() => knapp("LÅS FREKVENS").click());
    expect(el.textContent).toContain("Bare sus.");
    for (let i = 0; i < 4; i++) act(() => knapp("Litt opp").click());
    act(() => knapp("LÅS FREKVENS").click());
    expect(el.textContent).toContain("Nesten! Litt opp.");
  });
});

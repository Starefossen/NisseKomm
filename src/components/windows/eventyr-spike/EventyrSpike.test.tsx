import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import EventyrSpike from "./EventyrSpike";
import { GameEngine } from "@/lib/game-engine";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const el = document.createElement("div");
  act(() => createRoot(el).render(<EventyrSpike />));
  return el;
}

const tap = (el: HTMLElement, label: string) =>
  act(() => {
    const btn = [...el.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === label || b.textContent === label,
    );
    if (!btn) throw new Error(`no button ${label}`);
    btn.click();
  });

describe("Eventyr-spike core loop", () => {
  beforeEach(() => localStorage.clear());

  it("pick up, use on hotspot, lights on, saved through GameEngine", () => {
    const el = mount();
    tap(el, "Trådsnella"); // smart tap = BRUK = pick up
    expect(el.textContent).toContain("Du tar kobbertråden");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual(["kobbertraad"]);

    tap(el, "Kobbertråd");
    expect(el.textContent).toContain("Bruk Kobbertråd på");
    tap(el, "Kaffekoppen");
    expect(el.textContent).toContain("gir ikke mening");

    tap(el, "Kobbertråd");
    tap(el, "Sikringsskapet");
    expect(el.textContent).toContain("våkner til liv");
    const save = GameEngine.getEventyrSave();
    expect(save?.flags).toContain("strom_paa");
    expect(save?.inventory).toEqual([]);

    // Reload keeps the state
    const again = mount();
    expect(again.textContent).toContain("IQs verksted");
    expect(again.textContent).not.toContain("(mørkt)");
    expect(again.textContent).toContain("Sånn ja, lys!");
  });

  it("verb SE overrides smart tap; dialog choice sets a flag; tips escalate", () => {
    const el = mount();
    tap(el, "SE");
    tap(el, "Trådsnella");
    expect(el.textContent).toContain("halvt under en tang");
    expect(GameEngine.getEventyrSave()?.inventory).toEqual([]);

    tap(el, "Døra");
    expect(el.textContent).toContain("IQ (gjennom døra)");
    tap(el, "› Det er oss! Lyset er gått her inne.");
    expect(el.textContent).toContain("sikringen røket");
    expect(GameEngine.getEventyrSave()?.flags).toContain("iq_tips");
    tap(el, "Ferdig");

    tap(el, "TIPS");
    expect(el.textContent).toContain("bekmørkt");
    tap(el, "TIPS");
    tap(el, "TIPS");
    expect(el.textContent).toContain("bruk den på sikringsskapet");
    expect(GameEngine.getEventyrSave()?.hints.verksted).toBe(3);
  });
});

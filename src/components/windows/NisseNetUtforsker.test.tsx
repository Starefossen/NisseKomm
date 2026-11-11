import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { NisseNetUtforsker } from "./NisseNetUtforsker";
import { GameEngine } from "@/lib/game-engine";
import { setTimeOverride } from "@/lib/date-utils";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const vis = () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  act(() =>
    createRoot(el).render(
      <NisseNetUtforsker
        files={[]}
        missions={[]}
        currentDay={10}
        onClose={() => {}}
      />,
    ),
  );
  return el;
};

const fjaer = (n: number) =>
  GameEngine.saveEventyr({
    kapittel: 1,
    sceneId: "torget",
    inventory: [],
    flags: [],
    hints: {},
    fjaer: Array.from({ length: n }, (_, i) => `1:${i}`),
  });

describe("fjærboka i MORO", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    setTimeOverride({ day: 10, month: 12, hour: 8, minute: 0 });
  });

  it("vises låst med fjærteller før åtte fjær", () => {
    fjaer(3);
    const el = vis();
    const laast = el.querySelector('[data-testid="moro-fjaer-laast"]');
    expect(laast?.textContent).toContain("flokes_fjaerbok.txt");
    expect(laast?.textContent).toContain("LÅST · 3/8 FJÆR");
  });

  it("åpner seg ved åtte fjær", () => {
    fjaer(8);
    const el = vis();
    expect(el.querySelector('[data-testid="moro-fjaer-laast"]')).toBeNull();
    const knapp = [...el.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("flokes_fjaerbok.txt"),
    );
    expect(knapp).toBeDefined();
  });
});

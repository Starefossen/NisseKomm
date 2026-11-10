import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Kalender } from "./Kalender";
import { setTimeOverride } from "@/lib/date-utils";
import type { Oppdrag } from "@/types/innhold";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const missions = [5, 9].map(
  (dag) =>
    ({
      dag,
      tittel: `TITTEL${dag}`,
      nissemail_tekst: `HEMMELIG${dag}`,
    }) as Oppdrag,
);

describe("Kalender in test mode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    process.env.NEXT_PUBLIC_TEST_MODE = "true";
    setTimeOverride({ day: 5, month: 12, hour: 8, minute: 0 });
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_MODE;
  });

  const open = (day: number) => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    act(() =>
      createRoot(el).render(
        <Kalender
          missions={missions}
          onClose={() => {}}
          onSelectDay={() => {}}
        />,
      ),
    );
    act(() =>
      el
        .querySelector<HTMLButtonElement>(`[aria-label^="${day}. desember"]`)!
        .click(),
    );
    return document.body.textContent ?? "";
  };

  it("hides a future day's title and mail text", () => {
    const text = open(9);
    expect(text).not.toContain("TITTEL9");
    expect(text).not.toContain("HEMMELIG9");
  });

  it("shows today's title and mail text", () => {
    const text = open(5);
    expect(text).toContain("TITTEL5");
    expect(text).toContain("HEMMELIG5");
  });
});

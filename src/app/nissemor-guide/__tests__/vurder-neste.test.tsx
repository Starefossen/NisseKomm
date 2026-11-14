import { beforeEach, describe, it, expect, jest } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Vurder } from "../vurdering";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const svar = (x: unknown) =>
  ({ ok: true, json: async () => x }) as unknown as Response;

// Gjennomgang always shows the buttons; outside it (here: no pathname) the setting must be on.
beforeEach(() => localStorage.setItem("nissekomm-guide-vis-vurdering", "1"));

describe("Vurder ved Neste", () => {
  it("tømmer notatet for neste element og lagrer det ulagrede på det forrige", async () => {
    const poster: { path: string; notat?: string }[] = [];
    const lagret = { "dag/02/kveld": { notat: "Bs notat" } };
    globalThis.fetch = jest.fn(
      async (_u: string | URL | Request, init?: RequestInit) => {
        if (init?.method === "POST") {
          poster.push(JSON.parse(String(init.body)));
          return svar({ vurderinger: lagret });
        }
        return svar(lagret);
      },
    ) as typeof fetch;
    const boks = document.createElement("div");
    document.body.appendChild(boks);
    const root = createRoot(boks);
    await act(async () => root.render(<Vurder id="dag/01/kveld" />));
    const felt = () => boks.querySelector("input")!;
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!;
      set.call(felt(), "As notat");
      felt().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(felt().value).toBe("As notat");
    await act(async () => root.render(<Vurder id="dag/02/kveld" />));
    expect(felt().value).toBe("Bs notat");
    expect(poster).toEqual([
      expect.objectContaining({ path: "dag/01/kveld", notat: "As notat" }),
    ]);
    root.unmount();
  });
});

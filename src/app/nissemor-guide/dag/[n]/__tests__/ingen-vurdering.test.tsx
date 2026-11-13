import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StatusI, Vurder } from "../../../vurdering";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("dagvisningen vurderer ikke", () => {
  it("Vurder i dagvisningen er en statuscelle, ingen knapper", () => {
    const boks = document.createElement("div");
    const root = createRoot(boks);
    act(() =>
      root.render(
        <StatusI.Provider
          value={(id) => <a href={`/nissemor-guide/gjennomgang?id=${id}`}>✓</a>}
        >
          <Vurder id="dag/04/kveld" />
        </StatusI.Provider>,
      ),
    );
    expect(
      boks.querySelector("[data-verdikt], input, [data-trenger]"),
    ).toBeNull();
    expect(boks.querySelector("a")!.getAttribute("href")).toContain(
      "gjennomgang?id=dag/04/kveld",
    );
    act(() => root.unmount());
  });

  it("siden har «Vurder dag N →» til dagfilteret, og ingen mediekort", () => {
    const src = readFileSync(path.join(__dirname, "..", "page.tsx"), "utf8");
    expect(src).toContain("/nissemor-guide/gjennomgang?dag=${n}");
    expect(src).toContain("<DagStatus>");
    expect(src).not.toMatch(/MediaListe|Vurderingsknapper/);
  });
});

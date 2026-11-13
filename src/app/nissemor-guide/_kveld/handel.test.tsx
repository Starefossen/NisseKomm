import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { medVarer, useHandlet } from "./handel";
import { StorageManager } from "@/lib/storage";
import type { VareTreff } from "@/lib/guide-sesong";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const treff = [
  { id: "mel", vare: "Mel, sukker", ord: ["sukker"] },
] as unknown as VareTreff[];

function Setning() {
  const h = useHandlet();
  return <p>Ha i {medVarer(treff, h)("litt sukker nå")}</p>;
}

describe("handlechip", () => {
  it("sitter tett etter ordet og går mangler, kjøpt, hjemme, mangler", async () => {
    const el = document.createElement("div");
    document.body.append(el);
    act(() => createRoot(el).render(<Setning />));
    const knapp = () => el.querySelector("button")!;
    expect(el.textContent).toContain("sukker[○ mangler] nå");
    expect(knapp().title).toBe("Mel, sukker");
    for (const [tekst, lagret] of [
      ["[✓ kjøpt]", "kjopt"],
      ["[⌂ hjemme]", "hjemme"],
      ["[○ mangler]", undefined],
    ] as const) {
      await act(async () => knapp().click());
      expect(knapp().textContent).toBe(tekst);
      expect(StorageManager.getHandlet().mel).toBe(lagret);
    }
  });
});

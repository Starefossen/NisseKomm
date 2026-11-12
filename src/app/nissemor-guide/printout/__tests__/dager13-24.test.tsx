import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { SIDER_13_24 } from "../_print/dager13-24";
import { UTSKRIFTER } from "../filer";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// name → [code word that must never appear, content that must appear, runes that must appear]
const SPEC: Record<string, [string, string[], string[]]> = {
  "dag13-krydderkort": [
    "SAFRAN",
    ["N", "R", "F", "L", "❄"],
    ["N", "R", "F", "L"],
  ],
  "dag14-brettark": [
    "ORIGAMI",
    ["Brett. Hold en lykt bak.", "R", "G", "2", "4"],
    [],
  ],
  "dag15-redskapskort": [
    "KARAMELL",
    ["A", "M", "L", "❄", "8"],
    ["A", "M", "L"],
  ],
  "dag16-sorteringslapper": [
    "SORTERING",
    ["O", "E", "I", "K", "2", "5", "7", "9"],
    ["O", "E", "I", "K"],
  ],
};

function render(navn: string) {
  const Side = SIDER_13_24[navn];
  const el = document.createElement("div");
  act(() => createRoot(el).render(<Side />));
  // Ice crystals are drawn SVGs; count each as ❄ so the specs can name them.
  el.querySelectorAll("svg[data-iskrystall]").forEach((s) =>
    s.replaceWith("❄"),
  );
  return el;
}

describe("printables days 13–16", () => {
  it("every page is listed in filer.ts and has a spec", () => {
    for (const navn of Object.keys(SIDER_13_24)) {
      expect(UTSKRIFTER).toContain(navn);
      expect(SPEC[navn]).toBeDefined();
    }
  });

  it.each(Object.keys(SPEC))(
    "%s prints its content and not the answer",
    (navn) => {
      const [kode, innhold, runer] = SPEC[navn];
      const el = render(navn);
      const tekst = el.textContent ?? "";
      expect(tekst.toUpperCase()).not.toContain(kode);
      for (const s of innhold) expect(tekst).toContain(s);
      const tegn = [...el.querySelectorAll("svg[role=img]")].map((s) =>
        s.getAttribute("aria-label"),
      );
      for (const r of runer) expect(tegn).toContain(r);
    },
  );
});

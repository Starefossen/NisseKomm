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
  "dag13-gravskilt": ["SAFRAN", ["HER HVILER RAMPEN.", "HAN SPISTE 11."], []],
  "dag14-brettark": [
    "ORIGAMI",
    ["Brett. Hold en lykt bak.", "R", "G", "2", "4"],
    [],
  ],
  "dag14-serviettfugl": ["ORIGAMI", ["SERVIETTFUGL"], []],
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
  "dag17-baandkort": ["NORDLYS", ["❄"], ["O", "L"]],
  "dag17-losepengebrev": ["NORDLYS", ["Kosedyrene"], []],
  "dag18-rosinkort": [
    "TURBULENS",
    ["U", "B", "E", "❄", "●●●●●●●●●"],
    ["U", "B", "E"],
  ],
  "dag19-bevislapper": [
    "GULROT",
    ["U · 2", "O · 5", "❄ · 3", "BEVIS"],
    ["U", "O"],
  ],
  "dag20-putekort": ["TURBO", ["❄", "●●●●●"], ["U", "B"]],
  "dag20-fortskilt": ["TURBO", ["KUN FOR SIGMAS.", "6-7."], []],
  "dag21-portkort": ["BRANNMUR", ["R", "U · 7", "❄"], ["R", "U"]],
  "dag22-sokkelapper": [
    "LANDÅS",
    [
      "1a",
      "15",
      "1b",
      "4",
      "2a",
      "17",
      "2b",
      "7",
      "3a",
      "32",
      "3b",
      "22",
      "SOKK",
    ],
    [],
  ],
  "dag23-stjerner": [
    "STJERNEKLART",
    ["R", "K", "A", "❄", "XII", "IX"],
    ["R", "K", "A"],
  ],
  "dag24-suvenirlapper": [
    "JULEMAGI",
    ["· 2", "· 4", "· 7", "IQS KOPI"],
    ["U", "E", "G"],
  ],
  "dag24-krystallkort": [
    "JULEMAGI",
    [],
    ["T", "A", "K", "F", "O", "R", "L", "Y", "S", "E"],
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

describe("printables days 13–24", () => {
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

  it("day 22 cards have no minus sign or dash", () => {
    const el = render("dag22-sokkelapper");
    const kort = [...el.querySelectorAll(".border-dashed")].map(
      (k) => k.textContent,
    );
    for (const k of kort) expect(k).not.toMatch(/[-–−]/);
  });

  it("❄ squares never carry a rune that would spell the answer", () => {
    // Day 20: only U and B as runes, so the board cannot read the full word.
    const el = render("dag20-putekort");
    const tegn = [...el.querySelectorAll("svg[role=img]")].map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(tegn.sort()).toEqual(["B", "U"]);
  });
});

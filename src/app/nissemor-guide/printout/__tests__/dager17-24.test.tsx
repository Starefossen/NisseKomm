import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { SIDER_17_24 } from "../_print/dager17-24";
import { UTSKRIFTER } from "../filer";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// name → [code word that must never appear, content that must appear]
// (corner runes: hjorneruner.test.tsx)
const SPEC: Record<string, [string, string[]]> = {
  "dag13-gravskilt": [
    "SAFRAN",
    ["HER HVILER RAMPEN.", "HAN SPISTE 11.", "Siste ord:"],
  ],
  "dag14-serviettfugl": ["ORIGAMI", ["SERVIETTFUGL"]],
  "dag17-baandkort": ["NORDLYS", ["❄"]],
  "dag17-losepengebrev": ["NORDLYS", ["Kosedyrene"]],
  "dag18-rosinkort": ["TURBULENS", ["U", "B", "E", "❄", "RUTEKORT"]],
  "dag19-bevislapper": [
    "GULROT",
    ["U", "· 2", "O", "· 5", "❄", "· 3", "BEVIS"],
  ],
  "dag20-putekort": ["TURBO", ["❄"]],
  "dag20-fortskilt": ["TURBO", ["KUN FOR SIGMAS.", "6-7."]],
  "dag21-portkort": ["BRANNMUR", ["R", "U", "· 7", "❄", "Feil bok"]],
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
  ],
  "dag23-stjerner": ["STJERNEKLART", ["R", "K", "A", "❄", "XII", "IX"]],
  "dag24-suvenirlapper": ["JULEMAGI", ["· 2", "· 4", "· 7", "IQS KOPI"]],
  "dag24-krystallkort": ["JULEMAGI", []],
};

function render(navn: string) {
  const Side = SIDER_17_24[navn];
  const el = document.createElement("div");
  act(() => createRoot(el).render(<Side />));
  el.querySelectorAll("svg[data-iskrystall]").forEach((s) =>
    s.replaceWith("❄"),
  );
  return el;
}

describe("printables days 17–24", () => {
  it("every page is listed in filer.ts and has a spec", () => {
    for (const navn of Object.keys(SIDER_17_24)) {
      expect(UTSKRIFTER).toContain(navn);
      expect(SPEC[navn]).toBeDefined();
    }
  });

  it.each(Object.keys(SPEC))(
    "%s prints its content and not the answer",
    (navn) => {
      const [kode, innhold] = SPEC[navn];
      const el = render(navn);
      const tekst = el.textContent ?? "";
      expect(tekst.toUpperCase()).not.toContain(kode);
      for (const s of innhold) expect(tekst).toContain(s);
    },
  );

  it("rune-only days show no plain letter", () => {
    for (const [navn, l] of [
      ["dag17-baandkort", "OL"],
      ["dag20-putekort", "UB"],
      ["dag24-suvenirlapper", "UEG"],
    ]) {
      const el = render(navn);
      el.querySelectorAll("[role=img]").forEach((s) => s.remove());
      const kort = [...el.querySelectorAll("[data-ark] > div")].map(
        (k) => k.textContent ?? "",
      );
      for (const k of kort.filter((k) => !k.includes("RUTEKORT")))
        expect(k).not.toMatch(new RegExp(`[${l}]`));
    }
  });

  it("the crystal card says TAKK FOR LYSET in runes", () => {
    const labels = [
      ...render("dag24-krystallkort").querySelectorAll("[role=img]"),
    ]
      .filter((s) => s.tagName === "SPAN")
      .map((s) => s.getAttribute("aria-label"));
    expect(labels.join(" ")).toBe("TAKK FOR LYSET");
  });

  it("day 22 cards have no minus sign or dash", () => {
    const kort = [
      ...render("dag22-sokkelapper").querySelectorAll("[data-ark] > div"),
    ];
    for (const k of kort) expect(k.textContent).not.toMatch(/[-–−]/);
  });
});

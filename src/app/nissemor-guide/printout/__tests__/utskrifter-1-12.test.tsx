import { describe, it, expect } from "@jest/globals";
import type { ComponentType, ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";

import Tradkort from "../dag01-tradkort/page";
import Linjekort from "../dag01-linjekort/page";
import Frakt from "../dag01-frakt/page";
import Ferdskriver from "../dag01-ferdskriver/page";
import Flylogg from "../dag01-flylogg/page";
import Operasjonsbrett from "../operasjonsbrett/page";
import Tallkort2 from "../dag02-tallkort/page";
import Frostlapp3 from "../dag03-frostlapp/page";
import Skokort from "../dag04-skokort/page";
import Brevfugl from "../dag05-brevfugl/page";
import Alfabetstrimmel from "../alfabetstrimmel/page";
import Silhuetter from "../dag06-silhuetter/page";
import Frostlapp7 from "../dag07-frostlapp/page";
import Kretskort from "../dag08-kretskort/page";
import Krystallark from "../dag09-krystallark/page";
import Testark from "../dag10-testark/page";
import Fargekort from "../dag10-fargekort/page";
import Rodfilter from "../rodfilter-ramme/page";
import Tallkort11 from "../dag11-tallkort/page";
import Tredelt from "../dag12-frostlapp-tredelt/page";

jest.mock("@/components/nissemor/GuideAuth", () => ({
  GuideAuth: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/nissemor/GuideNavigation", () => ({
  GuideNavigation: () => null,
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// har: text that must be printed. runer: letters whose rune must be printed.
// ikke: the code, which must never appear on the sheets.
const SIDER: [string, ComponentType, { har: string[]; runer?: string[]; ikke?: string }][] = [
  ["dag01-tradkort", Tradkort, { har: ["I", "N", "E", "T"], runer: ["S", "I", "G", "N", "A", "L", "E", "T"], ikke: "SIGNAL" }],
  ["dag01-linjekort", Linjekort, { har: ["DIREKTELINJEN", "PASSORD TIL NISSEKOMM:", "K12 · H9 · H5", "LINJE 90,0"], ikke: "SIGNAL" }],
  ["dag01-frakt", Frakt, { har: ["SNØFALL FRAKT", "VITAMIN C, 2,3 KG", "90.0-SNF-0112", "SKJØRT", "TRYKKSKADET", "KONTROLLERT – IQ", "HASTER · ADVENT"], ikke: "SIGNAL" }],
  ["dag01-ferdskriver", Ferdskriver, { har: ["FERDSKRIVER", "IKKE KAST I HAVET", "SNF-FDR-2026-001", "FORSEGLET – IQ"], ikke: "SIGNAL" }],
  ["dag01-flylogg", Flylogg, { har: ["LOGG LINJE 90,0", "UNDERLAG: MYKT.", "LOGG SLUTT"], ikke: "SIGNAL" }],
  ["operasjonsbrett", Operasjonsbrett, { har: ["OPERASJON DIREKTELINJEN", "23. DES", "24"] }],
  ["dag02-tallkort", Tallkort2, { har: ["IX + III", "XIX − III", "XIV + VI"], ikke: "48" }],
  ["dag03-frostlapp", Frostlapp3, { har: ["R", "S", "ETTER KODEN – IQ"], runer: ["P", "R", "I", "S", "M", "E"], ikke: "PRISME" }],
  ["dag04-skokort", Skokort, { har: ["M", "A"], runer: ["K", "O", "M", "P", "A", "S"], ikke: "KOMPASS" }],
  ["dag05-brevfugl", Brevfugl, { har: ["X O U L N H Q"], ikke: "ULRIKEN" }],
  ["alfabetstrimmel", Alfabetstrimmel, { har: ["ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ"] }],
  ["dag06-silhuetter", Silhuetter, { har: ["Y", "A", "O"], runer: ["L", "Y", "K", "T", "A", "O"], ikke: "LYKT" }],
  ["dag07-frostlapp", Frostlapp7, { har: [], runer: ["K", "U", "L", "D", "E"], ikke: "KULDE" }],
  ["dag08-kretskort", Kretskort, { har: ["R", "S", "O", "E"], runer: ["K", "R", "E", "T", "S", "O"], ikke: "KRETSKORT" }],
  ["dag09-krystallark", Krystallark, { har: [], ikke: "24" }],
  ["dag10-testark", Testark, { har: ["X"], ikke: "SPEKTER" }],
  ["dag10-fargekort", Fargekort, { har: ["P", "T", "R", "HVIT", "INDIGO", "FIOLETT"], runer: ["S", "P", "E", "K", "T", "R"], ikke: "SPEKTER" }],
  ["rodfilter-ramme", Rodfilter, { har: ["RØDFILTER"] }],
  ["dag11-tallkort", Tallkort11, { har: ["15", "40", "25", "35", "20"], ikke: "75" }],
  ["dag12-frostlapp-tredelt", Tredelt, { har: ["E", "O", "A"], runer: ["M", "E", "L", "O", "D", "I", "A"], ikke: "MELODI" }],
];

function render(Side: ComponentType) {
  const el = document.createElement("div");
  act(() => createRoot(el).render(<Side />));
  const ark = [...el.querySelectorAll("[data-ark]")];
  return {
    tekst: ark.map((a) => a.textContent ?? "").join("\n"),
    runer: new Set(
      ark.flatMap((a) =>
        [...a.querySelectorAll("svg[role=img]")].map((s) => s.getAttribute("aria-label")),
      ),
    ),
    antallArk: ark.length,
  };
}

describe("utskrifter dag 1–12", () => {
  it.each(SIDER)("%s skriver ut det gaater-2026 krever", (_navn, Side, krav) => {
    const { tekst, runer, antallArk } = render(Side);
    expect(antallArk).toBeGreaterThan(0);
    for (const t of krav.har) expect(tekst.replace(/\s+/g, "")).toContain(t.replace(/\s+/g, ""));
    for (const r of krav.runer ?? []) expect(runer).toContain(r);
    if (krav.ikke) {
      expect(tekst.replace(/\s+/g, "").toUpperCase()).not.toContain(krav.ikke);
    }
  });

  it("frostkortet dag 7 har ingen bokstaver, bare tegn", () => {
    const { tekst } = render(Frostlapp7);
    expect(tekst.replace(/FROSTLAPP|\d|\s/g, "")).toBe("");
  });
});

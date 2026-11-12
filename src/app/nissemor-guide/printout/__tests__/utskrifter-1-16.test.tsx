import { describe, it, expect } from "@jest/globals";
import type { ComponentType } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";

import Tradkort from "../_print/dager01-12/dag01-tradkort";
import Linjekort from "../_print/dager01-12/dag01-linjekort";
import Frakt from "../_print/dager01-12/dag01-frakt";
import Ferdskriver from "../_print/dager01-12/dag01-ferdskriver";
import Flylogg from "../_print/dager01-12/dag01-flylogg";
import Operasjonsbrett from "../_print/dager01-12/operasjonsbrett";
import Tallkort2 from "../_print/dager01-12/dag02-tallkort";
import Frostlapp3 from "../_print/dager01-12/dag03-frostlapp";
import Skokort from "../_print/dager01-12/dag04-skokort";
import Brevfugl from "../_print/dager01-12/dag05-brevfugl";
import Alfabetstrimmel from "../_print/dager01-12/alfabetstrimmel";
import Silhuetter from "../_print/dager01-12/dag06-silhuetter";
import Frostlapp7 from "../_print/dager01-12/dag07-frostlapp";
import Kretskort from "../_print/dager01-12/dag08-kretskort";
import Krystallark from "../_print/dager01-12/dag09-krystallark";
import Testark from "../_print/dager01-12/dag10-testark";
import Fargekort from "../_print/dager01-12/dag10-fargekort";
import Rodfilter from "../_print/dager01-12/rodfilter-ramme";
import Tallkort11 from "../_print/dager01-12/dag11-tallkort";
import Tredelt from "../_print/dager01-12/dag12-frostlapp-tredelt";
import Krydderkort from "../_print/dager13-16/dag13-krydderkort";
import Gravskilt from "../_print/dager13-16/dag13-gravskilt";
import Brettark from "../_print/dager13-16/dag14-brettark";
import Serviettfugl from "../_print/dager13-16/dag14-serviettfugl";
import Redskapskort from "../_print/dager13-16/dag15-redskapskort";
import Sorteringslapper from "../_print/dager13-16/dag16-sorteringslapper";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// har: text that must be printed (corner runes: hjorneruner.test.tsx).
// ikke: the code, which must never appear on the sheets.
const SIDER: [string, ComponentType, { har: string[]; ikke?: string }][] = [
  ["dag01-tradkort", Tradkort, { har: ["I", "N", "E", "T"], ikke: "SIGNAL" }],
  [
    "dag01-linjekort",
    Linjekort,
    {
      har: [
        "DIREKTELINJEN",
        "PASSORD TIL NISSEKOMM:",
        "K12 · H9 · H5",
        "LINJE 90,0",
      ],
      ikke: "SIGNAL",
    },
  ],
  [
    "dag01-frakt",
    Frakt,
    {
      har: [
        "SNØFALL FRAKT",
        "VITAMIN C, 2,3 KG",
        "90.0-SNF-0112",
        "SKJØRT",
        "TRYKKSKADET",
        "KONTROLLERT – IQ",
        "HASTER · ADVENT",
      ],
      ikke: "SIGNAL",
    },
  ],
  [
    "dag01-ferdskriver",
    Ferdskriver,
    {
      har: [
        "FERDSKRIVER",
        "IKKE KAST I HAVET",
        "SNF-FDR-2026-001",
        "FORSEGLET – IQ",
      ],
      ikke: "SIGNAL",
    },
  ],
  [
    "dag01-flylogg",
    Flylogg,
    {
      har: ["LOGG LINJE 90,0", "UNDERLAG: MYKT.", "LOGG SLUTT"],
      ikke: "SIGNAL",
    },
  ],
  [
    "operasjonsbrett",
    Operasjonsbrett,
    { har: ["OPERASJON DIREKTELINJEN", "23. DES", "24"] },
  ],
  [
    "dag02-tallkort",
    Tallkort2,
    { har: ["IX + III", "XIX − III", "XIV + VI"], ikke: "48" },
  ],
  [
    "dag03-frostlapp",
    Frostlapp3,
    {
      har: ["R", "S", "ETTER KODEN – IQ"],
      ikke: "PRISME",
    },
  ],
  ["dag04-skokort", Skokort, { har: ["M", "A"], ikke: "KOMPASS" }],
  ["dag05-brevfugl", Brevfugl, { har: ["X O U L N H Q"], ikke: "ULRIKEN" }],
  [
    "alfabetstrimmel",
    Alfabetstrimmel,
    { har: ["ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ"] },
  ],
  ["dag06-silhuetter", Silhuetter, { har: ["Y", "A", "O"], ikke: "LYKT" }],
  ["dag07-frostlapp", Frostlapp7, { har: [], ikke: "KULDE" }],
  [
    "dag08-kretskort",
    Kretskort,
    {
      har: ["R", "S", "O", "E"],
      ikke: "KRETSKORT",
    },
  ],
  ["dag09-krystallark", Krystallark, { har: [], ikke: "24" }],
  ["dag10-testark", Testark, { har: ["X"], ikke: "SPEKTER" }],
  [
    "dag10-fargekort",
    Fargekort,
    {
      har: ["P", "T", "R", "HVIT", "INDIGO", "FIOLETT"],
      ikke: "SPEKTER",
    },
  ],
  ["rodfilter-ramme", Rodfilter, { har: ["RØDFILTER"] }],
  [
    "dag11-tallkort",
    Tallkort11,
    { har: ["15", "40", "25", "35", "20"], ikke: "75" },
  ],
  [
    "dag12-frostlapp-tredelt",
    Tredelt,
    { har: ["E", "O", "A"], ikke: "MELODI" },
  ],
  [
    "dag13-krydderkort",
    Krydderkort,
    { har: ["N", "R", "F", "L"], ikke: "SAFRAN" },
  ],
  [
    "dag13-gravskilt",
    Gravskilt,
    { har: ["HER HVILER RAMPEN.", "HAN SPISTE 11."], ikke: "SAFRAN" },
  ],
  [
    "dag14-brettark",
    Brettark,
    { har: ["Brett. Hold en lykt bak.", "R", "G", "2", "4"], ikke: "ORIGAMI" },
  ],
  [
    "dag14-serviettfugl",
    Serviettfugl,
    { har: ["SERVIETTFUGL"], ikke: "ORIGAMI" },
  ],
  [
    "dag15-redskapskort",
    Redskapskort,
    {
      har: ["A", "M", "L", "12345678"],
      ikke: "KARAMELL",
    },
  ],
  [
    "dag16-sorteringslapper",
    Sorteringslapper,
    {
      har: ["O", "E", "I", "K", "2", "5", "7", "123456789"],
      ikke: "SORTERING",
    },
  ],
];

function render(Side: ComponentType) {
  const el = document.createElement("div");
  act(() => createRoot(el).render(<Side />));
  const ark = [...el.querySelectorAll("[data-ark]")];
  return {
    tekst: ark.map((a) => a.textContent ?? "").join("\n"),
    antallArk: ark.length,
  };
}

describe("utskrifter dag 1–16", () => {
  it.each(SIDER)(
    "%s skriver ut det gaater-2026 krever",
    (_navn, Side, krav) => {
      const { tekst, antallArk } = render(Side);
      expect(antallArk).toBeGreaterThan(0);
      for (const t of krav.har)
        expect(tekst.replace(/\s+/g, "")).toContain(t.replace(/\s+/g, ""));
      if (krav.ikke) {
        expect(tekst.replace(/\s+/g, "").toUpperCase()).not.toContain(
          krav.ikke,
        );
      }
    },
  );

  it("frostkortet dag 7 har ingen bokstaver, bare tegn", () => {
    const { tekst } = render(Frostlapp7);
    expect(tekst.replace(/FROSTLAPP|✂ ?klipp|\d|\s/g, "")).toBe("");
  });

  // CutCard is flex-col, so the strip printed as a column over two pages
  it("alfabetstrimmelen ligger vannrett", () => {
    const el = document.createElement("div");
    act(() => createRoot(el).render(<Alfabetstrimmel />));
    const rute = [...el.querySelectorAll("div")].find(
      (d) => d.textContent === "A",
    )!;
    expect(rute.parentElement!.className.split(" ")).toContain("flex");
    expect(rute.parentElement!.className).not.toContain("flex-col");
  });
});

import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { GameEngine } from "@/lib/game-engine";
import { KULDE_RUNER } from "@/components/windows/snofall-tv/runer";
import { kortRuner, nyeRuner, runerFør } from "@/lib/runeorden";
import { SIDER_01_12 } from "../_print/dager01-12";
import { SIDER_17_24 } from "../_print/dager17-24";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * Meta 1 (gaater-2026): visible letters carry their rune; a ❄ card only when
 * the rune is new that day (`@/lib/runeorden`), and every new rune gets one
 * cut-off corner per copy. `skjult` = the letters on ❄ cards.
 */
const KORT: Record<string, { dag: number; skjult: string; kopier?: number }> = {
  "dag01-tradkort": { dag: 1, skjult: "SGAL" },
  "dag03-frostlapp": { dag: 3, skjult: "PIME" },
  "dag04-skokort": { dag: 4, skjult: "KOPSS" },
  "dag06-silhuetter": { dag: 6, skjult: "LKT" },
  "dag07-frostlapp": { dag: 7, skjult: "KUD", kopier: 2 },
  "dag08-kretskort": { dag: 8, skjult: "KEKRT" },
  "dag10-fargekort": { dag: 10, skjult: "SEKER" },
  "dag12-frostlapp-tredelt": { dag: 12, skjult: "MLDI" },
  "dag13-krydderkort": { dag: 13, skjult: "SARAN" },
  "dag14-brettark": { dag: 14, skjult: "ORIGAMI" },
  "dag15-redskapskort": { dag: 15, skjult: "" },
  "dag16-sorteringslapper": { dag: 16, skjult: "" },
  "dag17-baandkort": { dag: 17, skjult: "NRDYS" },
  "dag18-rosinkort": { dag: 18, skjult: "S" },
  "dag19-bevislapper": { dag: 19, skjult: "L" },
  "dag20-putekort": { dag: 20, skjult: "TRO" },
  "dag21-portkort": { dag: 21, skjult: "BANNMUR" },
  "dag23-stjerner": { dag: 23, skjult: "STJENELRT" },
  "dag24-suvenirlapper": { dag: 24, skjult: "" },
};

const SIDER = { ...SIDER_01_12, ...SIDER_17_24 };

function render(navn: string) {
  const el = document.createElement("div");
  const Side = SIDER[navn];
  act(() => createRoot(el).render(<Side />));
  const ark = [...el.querySelectorAll("[data-ark]")];
  const q = (s: string) => ark.flatMap((a) => [...a.querySelectorAll(s)]);
  const label = (s: Element) => s.getAttribute("aria-label")!;
  return {
    runer: q("svg[role=img]").map(label),
    skjult: q("[data-skjult] svg[role=img]").map(label),
    hjorner: q("[data-klipp]").map((s) => s.getAttribute("data-klipp")!),
  };
}

function minus(ord: string[], uten: string) {
  const l = [...ord];
  for (const c of uten) l.splice(l.indexOf(c), 1);
  return l;
}

describe("hjørnerunene (Meta 1)", () => {
  it.each(Object.keys(KORT))("%s: synlige + nye", (navn) => {
    const { dag, skjult, kopier = 1 } = KORT[navn];
    const nye = nyeRuner(dag);
    const vis = minus(kortRuner(dag), skjult);
    const forventet = new Set([
      ...vis,
      ...[...skjult].filter((c) => nye.has(c)),
    ]);
    const r = render(navn);
    expect(new Set(r.runer)).toEqual(forventet);
    // One cut-off corner per new rune and copy.
    const iPrint = [...nye].filter((c) => forventet.has(c));
    expect(r.hjorner.sort()).toEqual(
      Array.from({ length: kopier }, () => iPrint)
        .flat()
        .sort(),
    );
  });

  it.each(Object.keys(KORT))("%s: ❄-kort viser ingen gammel rune", (navn) => {
    const før = runerFør(KORT[navn].dag);
    const r = render(navn);
    for (const c of [...r.skjult, ...r.hjorner])
      expect([c, før.has(c)]).toEqual([c, false]);
  });

  it("lærerekkefølgen er den appen lærer bort", () => {
    for (let d = 1; d <= 24; d++) {
      const før = GameEngine.getLearnedRunes(d - 1);
      const app = [...GameEngine.getLearnedRunes(d)].filter((c) => !før.has(c));
      expect([d, [...nyeRuner(d)].sort()]).toEqual([d, app.sort()]);
    }
  });

  // Every rune line needs its letters on a card (and in the app) before that day.
  const LINJER: Record<number, string> = {
    7: "LE",
    ...KULDE_RUNER,
    17: "OL",
    20: "UB",
    23: "KOM NED MED LYS",
    24: "TAKK FOR LYSET UEG",
  };
  it.each(Object.entries(LINJER))("runelinje dag %s er lært før", (d, l) => {
    const før = runerFør(Number(d));
    const app = GameEngine.getLearnedRunes(Number(d) - 1);
    for (const c of l.replace(/ /g, ""))
      expect([c, før.has(c), app.has(c)]).toEqual([c, true, true]);
  });
});

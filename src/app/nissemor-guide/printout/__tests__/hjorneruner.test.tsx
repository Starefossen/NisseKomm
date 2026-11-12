import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { getAllOppdrag } from "@/lib/oppdrag";
import { SIDER_01_12 } from "../_print/dager01-12";
import { SIDER_17_24 } from "../_print/dager17-24";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * Meta 1 (gaater-2026): every card in a real skeleton carries the rune for its
 * letter, ❄ cards included; decoys carry a rune only at their visible letter.
 * Expected runes = the day's code, minus letters no card stands for (`uten`),
 * plus the decoys' letters (`ekstra`), times the printed copies.
 */
const KORT: Record<
  string,
  { dag: number; uten?: string; ekstra?: string; kopier?: number }
> = {
  "dag01-tradkort": { dag: 1, ekstra: "ET" },
  "dag03-frostlapp": { dag: 3 },
  "dag04-skokort": { dag: 4 },
  "dag06-silhuetter": { dag: 6, ekstra: "AO" },
  "dag07-frostlapp": { dag: 7, kopier: 2 },
  "dag08-kretskort": { dag: 8, uten: "T", ekstra: "E" },
  "dag10-fargekort": { dag: 10, ekstra: "R" },
  "dag12-frostlapp-tredelt": { dag: 12, ekstra: "A" },
  "dag13-krydderkort": { dag: 13, ekstra: "NRL" },
  "dag14-brettark": { dag: 14 },
  "dag15-redskapskort": { dag: 15, uten: "KAREL" },
  "dag16-sorteringslapper": { dag: 16, uten: "SRTRNG", ekstra: "K" },
  "dag17-baandkort": { dag: 17 },
  "dag18-rosinkort": { dag: 18, uten: "TRULN" },
  "dag19-bevislapper": { dag: 19, uten: "GRT" },
  "dag20-putekort": { dag: 20 },
  "dag21-portkort": { dag: 21, ekstra: "U" },
  "dag23-stjerner": { dag: 23 },
  "dag24-suvenirlapper": { dag: 24, uten: "JLMAI", kopier: 2 },
};

const SIDER = { ...SIDER_01_12, ...SIDER_17_24 };
const kode = (dag: number) => getAllOppdrag().find((o) => o.dag === dag)!.kode;

function minus(ord: string, uten: string) {
  const l = [...ord];
  for (const c of uten) {
    const i = l.indexOf(c);
    if (i < 0) throw new Error(`${c} er ikke i ${ord}`);
    l.splice(i, 1);
  }
  return l;
}

function runer(navn: string) {
  const el = document.createElement("div");
  const Side = SIDER[navn];
  act(() => createRoot(el).render(<Side />));
  return [...el.querySelectorAll("[data-ark] svg[role=img]")]
    .map((s) => s.getAttribute("aria-label"))
    .sort();
}

describe("hjørnerunene følger koden (Meta 1)", () => {
  it.each(Object.keys(KORT))("%s", (navn) => {
    const { dag, uten = "", ekstra = "", kopier = 1 } = KORT[navn];
    const ett = [...minus(kode(dag), uten), ...ekstra];
    expect(runer(navn)).toEqual(
      Array.from({ length: kopier }, () => ett)
        .flat()
        .sort(),
    );
  });
});

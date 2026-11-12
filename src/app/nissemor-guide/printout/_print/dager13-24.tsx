"use client";

import type { ReactNode } from "react";
import { Frostrune } from "@/components/ui/Frostrune";
import { CutCard, NewSheet, PrintPage } from "./PrintPage";
import { Iskrystall } from "./dager01-12/felles";

/*
 * Printables for days 13–24 and the §8 prank signs, per docs/gaater-2026.md.
 * Runes go only on letters that are visible anyway: a rune on a ❄ square would
 * let a child who keeps the rune board read the whole answer.
 */

const RETRO = "font-retro uppercase";

/** Frostlapp skeleton: "_" is a ❄ square, any other char is shown with its rune. */
function Skjelett({ m }: { m: string }) {
  return (
    <div className="flex gap-1">
      {m.split("").map((c, i) => (
        <div
          key={i}
          className="relative w-9 h-11 border-2 border-black flex items-center justify-center text-2xl"
        >
          <span className="absolute top-0 left-0.5 text-[9px] text-gray-400">
            {i + 1}
          </span>
          {c === "_" ? (
            <Iskrystall size={24} />
          ) : (
            <>
              {c}
              <span className="absolute bottom-0 right-0.5">
                <Frostrune letter={c} size={7} />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Empty numbered squares the kids fill in. */
function Rutekort({ n }: { n: number }) {
  return (
    <CutCard className={`${RETRO} col-span-full gap-2`}>
      <div className="text-lg tracking-widest">▓ NISSEKOMM ▸ RUTEKORT ▓</div>
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="relative w-12 h-14 border-4 border-black text-xs text-gray-500 p-0.5"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </CutCard>
  );
}

function Big({ children }: { children: ReactNode }) {
  return <div className={`${RETRO} text-6xl font-bold`}>{children}</div>;
}

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-3 gap-3">{children}</div>
);

function Dag13() {
  const kort = ["__N__", "__R______", "__F___", "__L___"];
  return (
    <PrintPage
      title="DAG 13 · KRYDDERKORT"
      note="Fire like kort uten navn, i rekkefølgen kanel, gurkemeie, krydderet med tråder, nellik."
    >
      <div className="grid grid-cols-2 gap-4">
        {kort.map((m) => (
          <CutCard key={m} className={`${RETRO} h-40 gap-2`}>
            <div className="tracking-widest flex items-center gap-2">
              <Iskrystall size={16} /> FROSTLAPP <Iskrystall size={16} />
            </div>
            <Skjelett m={m} />
          </CutCard>
        ))}
      </div>
    </PrintPage>
  );
}

function Dag14Brettark() {
  // Two windows in the bottom-right quarter. Letters sit mirrored across the
  // vertical fold, digits mirrored across the horizontal fold, so each shows
  // through its window only when that fold is made and held against light.
  const vinduer = [
    { x: 25, y: 30, bokstav: "R", tall: "2" },
    { x: 65, y: 60, bokstav: "G", tall: "4" },
  ];
  return (
    <PrintPage
      title="DAG 14 · BRETTEARK"
      note="Vanlig 80 g papir. Test gjennomlys med mobillykt i november. Rull arket sammen i papirbåten."
    >
      <div className={`${RETRO} relative h-[260mm] border-2 border-black`}>
        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-black" />
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-black" />
        <p className="absolute top-2 left-0 right-0 text-center text-2xl">
          Brett. Hold en lykt bak.
        </p>
        {/* Decoy scribbles */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden>
          {[
            [10, 15, 30, 22],
            [60, 12, 80, 30],
            [15, 70, 35, 85],
            [70, 80, 90, 72],
            [55, 40, 62, 45],
            [20, 40, 40, 38],
          ].map(([a, b, c, d], i) => (
            <line
              key={i}
              x1={`${a}%`}
              y1={`${b}%`}
              x2={`${c}%`}
              y2={`${d}%`}
              stroke="#999"
              strokeWidth={2}
            />
          ))}
        </svg>
        {vinduer.map((v) => (
          <div key={v.bokstav}>
            <div
              className="absolute w-12 h-14 border-2 border-black"
              style={{
                left: `${50 + v.x / 2 - 1}%`,
                top: `${50 + v.y / 2 - 1}%`,
              }}
            />
            <span
              className="absolute text-5xl text-gray-500 -scale-x-100"
              style={{
                left: `${100 - (50 + v.x / 2) - 3}%`,
                top: `${50 + v.y / 2}%`,
              }}
            >
              {v.bokstav}
            </span>
            <span
              className="absolute text-5xl text-gray-500 -scale-y-100"
              style={{
                left: `${50 + v.x / 2}%`,
                top: `${100 - (50 + v.y / 2) - 4}%`,
              }}
            >
              {v.tall}
            </span>
          </div>
        ))}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="relative w-10 h-12 border-2 border-black" />
          ))}
        </div>
      </div>
    </PrintPage>
  );
}

function Fotspor({ lang }: { lang: boolean }) {
  return (
    <div className="border-2 border-dashed border-black h-12 flex items-center gap-4 px-3 my-2">
      {Array.from({ length: lang ? 14 : 6 }, (_, i) => (
        <svg key={i} width="18" height="28" aria-hidden>
          <ellipse cx="9" cy={i % 2 ? 18 : 10} rx="6" ry="9" fill="#c8a165" />
        </svg>
      ))}
      {!lang && <span className="text-sm text-gray-500">(slutter her)</span>}
    </div>
  );
}

function Dag15() {
  return (
    <PrintPage
      title="DAG 15 · REDSKAPSKORT"
      note="Side 1 tykt papir: A under gryta, M under sleiva, L under vispen, iskrystall under kjevle og øse. Side 2 vanlig papir: fem fotsporstrimler, de to korte går mot kjevle og øse."
    >
      <Grid>
        {["A", "M", "L"].map((l) => (
          <CutCard key={l} rune={l} className="h-32">
            <Big>{l}</Big>
          </CutCard>
        ))}
        {[1, 2].map((i) => (
          <CutCard key={i} className="h-32">
            <Big>
              <Iskrystall size={56} />
            </Big>
          </CutCard>
        ))}
        <Rutekort n={8} />
      </Grid>
      <NewSheet>
        {[true, true, true, false, false].map((lang, i) => (
          <Fotspor key={i} lang={lang} />
        ))}
      </NewSheet>
    </PrintPage>
  );
}

function Dag16() {
  return (
    <PrintPage
      title="DAG 16 · RYDDELAPPER"
      note="O på fjernkontrollen, E på tannbørsteglasset, I på brødposen, K på ostehøvelen. «2» i TV-benken, «5» på badehyllen, «7» i brødboksen. Rutekortet i brødboksen."
    >
      <Grid>
        {["O", "E", "I", "K"].map((l) => (
          <CutCard key={l} rune={l} className="h-32">
            <Big>{l}</Big>
          </CutCard>
        ))}
        {["2", "5", "7"].map((n) => (
          <CutCard key={n} className="h-32">
            <Big>{n}</Big>
          </CutCard>
        ))}
        <Rutekort n={9} />
      </Grid>
    </PrintPage>
  );
}

/** Printable name (from filer.ts) → page. */
export const SIDER_13_24: Record<string, () => ReactNode> = {
  "dag13-krydderkort": Dag13,
  "dag14-brettark": Dag14Brettark,
  "dag15-redskapskort": Dag15,
  "dag16-sorteringslapper": Dag16,
};

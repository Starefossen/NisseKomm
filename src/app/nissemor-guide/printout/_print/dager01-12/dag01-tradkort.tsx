import { PrintPage, CutCard } from "../PrintPage";
import { A7, Ark, Iskrystall, Prikker, bakside } from "./felles";

// Thread order from the TV: ❄ I ❄ N ❄ ❄. Runes only on visible letters.
const TRAAD = [
  { vis: null },
  { vis: "I" },
  { vis: null },
  { vis: "N" },
  { vis: null },
  { vis: null },
];
// Loose cards in the clementine river: not on the line, so they never count.
const LOSE = [{ vis: "E" }, { vis: "T" }];
const FORSIDER = [...TRAAD, ...LOSE];
const BAKSIDER = bakside(
  FORSIDER.map((_, i) => (i < TRAAD.length ? i + 1 : 0)),
  2,
);

export default function Dag01Tradkort() {
  return (
    <PrintPage
      title="Dag 1 – trådkortene"
      paper="1 ark, tykt papir, tosidig (vend på langsiden)"
      note="Rad for rad fra TV-en: kort 1–6 på tråden. De to siste er de løse kortene i elva; de har ingen prikker bak."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {FORSIDER.map((k, i) => (
            <CutCard
              key={i}
              rune={k.vis ?? undefined}
              className={`${A7} flex items-center justify-center text-[30mm] leading-none`}
            >
              {k.vis ?? <Iskrystall size={110} />}
            </CutCard>
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {BAKSIDER.map((n, i) => (
            <CutCard
              key={i}
              className={`${A7} flex items-center justify-center`}
            >
              {n ? <Prikker n={n} /> : null}
            </CutCard>
          ))}
        </div>
      </Ark>
    </PrintPage>
  );
}

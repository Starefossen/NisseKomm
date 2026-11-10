import {
  A7,
  Ark,
  Iskrystall,
  Klipp,
  Prikker,
  Utskrift,
  bakside,
} from "../_print/Utskrift";

// Thread order from the TV: ❄ I ❄ N ❄ ❄. Every card carries the rune of its true letter.
const TRAAD = [
  { vis: null, rune: "S" },
  { vis: "I", rune: "I" },
  { vis: null, rune: "G" },
  { vis: "N", rune: "N" },
  { vis: null, rune: "A" },
  { vis: null, rune: "L" },
];
// Loose cards in the clementine river: not on the line, so they never count.
const LOSE = [
  { vis: "E", rune: "E" },
  { vis: "T", rune: "T" },
];
const FORSIDER = [...TRAAD, ...LOSE];
const BAKSIDER = bakside(
  FORSIDER.map((_, i) => (i < TRAAD.length ? i + 1 : 0)),
  2,
);

export default function Dag01Tradkort() {
  return (
    <Utskrift
      tittel="Dag 1 – trådkortene"
      papir="1 ark, tykt papir, tosidig (vend på langsiden)"
      merknad="Rad for rad fra TV-en: kort 1–6 på tråden. De to siste er de løse kortene i elva; de har ingen prikker bak."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {FORSIDER.map((k, i) => (
            <Klipp
              key={i}
              rune={k.rune}
              className={`${A7} flex items-center justify-center text-[30mm] leading-none`}
            >
              {k.vis ?? <Iskrystall size={110} />}
            </Klipp>
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {BAKSIDER.map((n, i) => (
            <Klipp key={i} className={`${A7} flex items-center justify-center`}>
              {n ? <Prikker n={n} /> : null}
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

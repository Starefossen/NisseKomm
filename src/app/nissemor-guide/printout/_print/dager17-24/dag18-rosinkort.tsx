import { klipphjorner } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { Kort, Prikker, Rutekort, midt } from "./felles";

// Raisin piles: 2 over U, 4 over B, 7 over E, 9 over ❄ (rute 9; S is not new, so no rune). B is new: cut-off corner. Dots behind = reserve.
const KORT: { l: string | null; n: number }[] = [
  { l: "U", n: 2 },
  { l: "B", n: 4 },
  { l: "E", n: 7 },
  { l: null, n: 9 },
];

const HJORNE = klipphjorner(
  18,
  KORT.map((k) => k.l),
);

export default function Dag18Rosinkort() {
  return (
    <Utskrift
      navn="dag18-rosinkort"
      papir="tykt"
      tosidig
      deler={[
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => <Kort bokstav={KORT[i].l} hjorne={!!HJORNE[i]} />,
          bakside: (i) => midt(<Prikker n={KORT[i].n} />),
        },
        { str: { b: 194, h: 40 }, forside: () => <Rutekort n={9} /> },
      ]}
      instruks={{
        hjorne: true,
        klipp:
          "fire kort og rutekortet. Prikkene bak (2, 4, 7, 9) er reserve hvis noen spiser sporet.",
        hvor: "Kvelden 17. des.: rosinspor baklengs fra kjøleskapet; fire hauger på hver sin serviett: 2 rosiner over U, 4 over B, 7 over E, 9 over iskrystallet. Rutekortet i pappas jakkelomme med Rampenissen, blått sol-kort i den andre lommen.",
      }}
    />
  );
}

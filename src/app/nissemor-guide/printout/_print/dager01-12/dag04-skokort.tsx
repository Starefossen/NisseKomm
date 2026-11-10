import { PrintPage, CutCard } from "../PrintPage";
import { A7, Ark, Iskrystall, Prikker, bakside } from "./felles";

// Shoes counted clockwise from Rampenissen: shoe 3 M, shoe 5 A, the rest ❄.
const SKO = [
  { vis: null },
  { vis: null },
  { vis: "M" },
  { vis: null },
  { vis: "A" },
  { vis: null },
  { vis: null },
];

export default function Dag04Skokort() {
  return (
    <PrintPage
      title="Dag 4 – skokortene"
      paper="1 ark, tykt papir, tosidig (vend på langsiden)"
      note="Rad for rad: kort 1–7 i skoene med klokka fra pappas sko. Prikkene bak teller med klokka og er bare reserve."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {SKO.map((k, i) => (
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
          {bakside(
            SKO.map((_, i) => i + 1),
            2,
          ).map((n, i) => (
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

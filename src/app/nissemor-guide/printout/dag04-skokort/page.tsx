import {
  A7,
  Ark,
  Iskrystall,
  Klipp,
  Prikker,
  Utskrift,
  bakside,
} from "../_print/Utskrift";

// Shoes counted clockwise from Rampenissen: shoe 3 M, shoe 5 A, the rest ❄.
const SKO = [
  { vis: null, rune: "K" },
  { vis: null, rune: "O" },
  { vis: "M", rune: "M" },
  { vis: null, rune: "P" },
  { vis: "A", rune: "A" },
  { vis: null, rune: "S" },
  { vis: null, rune: "S" },
];

export default function Dag04Skokort() {
  return (
    <Utskrift
      tittel="Dag 4 – skokortene"
      papir="1 ark, tykt papir, tosidig (vend på langsiden)"
      merknad="Rad for rad: kort 1–7 i skoene med klokka fra pappas sko. Prikkene bak teller med klokka og er bare reserve."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {SKO.map((k, i) => (
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
          {bakside(
            SKO.map((_, i) => i + 1),
            2,
          ).map((n, i) => (
            <Klipp key={i} className={`${A7} flex items-center justify-center`}>
              {n ? <Prikker n={n} /> : null}
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

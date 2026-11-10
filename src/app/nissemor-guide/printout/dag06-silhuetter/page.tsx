import type { ReactNode } from "react";
import { A6, Ark, Klipp, Ruter, Utskrift, bakside } from "../_print/Utskrift";

// Decoys carry a rune only at their visible letter; they teach no rune for ❄.
const FIGURER: {
  form: ReactNode;
  celler: (string | null)[];
  runer: (string | undefined)[];
}[] = [
  {
    form: (
      <path d="M42 40 h16 v52 h-16 z M50 12 c8 10 8 18 0 24 c-8 -6 -8 -14 0 -24 z M34 92 h32 v6 h-32 z" />
    ),
    celler: [null, "A", null, null],
    runer: [undefined, "A"],
  },
  {
    form: (
      <path d="M20 88 l60 -14 l3 8 l-60 14 z M17 76 l63 16 l-3 8 l-63 -16 z M30 76 c-6 -18 4 -26 8 -40 c4 12 8 14 10 4 c4 10 14 18 10 32 c6 -8 4 -18 2 -22 c10 10 12 22 8 30 z" />
    ),
    celler: [null, "O", null, null],
    runer: [undefined, "O"],
  },
  {
    form: (
      <path
        fillRule="evenodd"
        d="M50 4 a14 14 0 0 1 14 14 h-5 a9 9 0 0 0 -18 0 h-5 a14 14 0 0 1 14 -14 z M34 20 h32 v8 h-32 z M36 28 h28 v54 h-28 z M42 34 v42 h16 v-42 z M30 82 h40 v8 h-40 z"
      />
    ),
    celler: [null, "Y", null, null],
    runer: ["L", "Y", "K", "T"],
  },
];

export default function Dag06Silhuetter() {
  return (
    <Utskrift
      tittel="Dag 6 – skyggefigurene"
      papir="1 ark, tykt papir, tosidig (vend på langsiden)"
      merknad="Klipp langs omrisset av hver figur i november, men behold kortet bak. Teip en ispinne nederst. Alle tre i papprullen med lommelykten."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {FIGURER.map((f, i) => (
            <Klipp key={i} className={`${A6} flex items-center justify-center`}>
              <svg
                viewBox="0 0 100 100"
                className="w-[80mm] h-[80mm]"
                aria-hidden
              >
                {f.form}
              </svg>
            </Klipp>
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {bakside(FIGURER, 2).map((f, i) => (
            <Klipp key={i} className={`${A6} flex items-center justify-center`}>
              {f && (
                <Ruter
                  celler={f.celler}
                  runer={f.runer}
                  nummer
                  storrelse="w-[18mm] h-[26mm]"
                />
              )}
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

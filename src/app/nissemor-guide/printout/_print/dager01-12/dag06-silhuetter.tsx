import type { ReactNode } from "react";
import { Utskrift } from "../Utskrift";
import { Ruter } from "./felles";

// The lantern is the real skeleton: runes on all four. Decoys only at the visible letter.
const FIGURER: {
  form: ReactNode;
  celler: (string | null)[];
  runer?: string[];
}[] = [
  {
    form: (
      <path d="M42 40 h16 v52 h-16 z M50 12 c8 10 8 18 0 24 c-8 -6 -8 -14 0 -24 z M34 92 h32 v6 h-32 z" />
    ),
    celler: [null, "A", null, null],
  },
  {
    form: (
      <path d="M20 88 l60 -14 l3 8 l-60 14 z M17 76 l63 16 l-3 8 l-63 -16 z M30 76 c-6 -18 4 -26 8 -40 c4 12 8 14 10 4 c4 10 14 18 10 32 c6 -8 4 -18 2 -22 c10 10 12 22 8 30 z" />
    ),
    celler: [null, "O", null, null],
  },
  {
    form: (
      <path
        fillRule="evenodd"
        d="M50 4 a14 14 0 0 1 14 14 h-5 a9 9 0 0 0 -18 0 h-5 a14 14 0 0 1 14 -14 z M34 20 h32 v8 h-32 z M36 28 h28 v54 h-28 z M42 34 v42 h16 v-42 z M30 82 h40 v8 h-40 z"
      />
    ),
    celler: [null, "Y", null, null],
    runer: [..."LYKT"],
  },
];

export default function Dag06Silhuetter() {
  return (
    <Utskrift
      navn="dag06-silhuetter"
      papir="tykt"
      deler={[
        {
          str: "A6",
          antall: FIGURER.length,
          forside: (i) => (
            <div className="h-full flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-[80mm] h-[80mm]"
                aria-hidden
              >
                {FIGURER[i].form}
              </svg>
            </div>
          ),
        },
        {
          str: { b: 52, h: 22 },
          antall: FIGURER.length,
          forside: (i) => (
            <div className="h-full flex items-center justify-center font-retro">
              <Ruter
                celler={FIGURER[i].celler}
                runer={FIGURER[i].runer}
                nummer
                storrelse="w-[10mm] h-[15mm]"
              />
            </div>
          ),
        },
      ]}
      instruks={{
        klipp:
          "i november: klipp ut de tre figurene langs omrisset og de tre bakside-kortene langs rammen.",
        merk: "Teip en ispinne nederst på hver figur og lim bakside-kortet på ispinnen, under figuren, så det ikke lager skygge: stearinlys A, bål O, lykt Y.",
        hvor: "Kvelden før dag 6: alle tre i papprullen med lommelykten, ved det røde hjerte-kortet. Rampenissens lapp i melet.",
      }}
    />
  );
}

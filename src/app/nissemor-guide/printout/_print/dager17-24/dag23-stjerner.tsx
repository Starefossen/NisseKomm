import type { ReactNode } from "react";
import { klipphjorner, skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { HJORNE as SIDE, Klipphjorne } from "../dager01-12/felles";
import { Kort } from "./felles";

// Front: 5 R, 8 K, 10 A, the rest ❄; only the new rune J (star 3) shows, on a loose cut-off corner. Back: Roman numeral (look back to day 2).
const FORSIDE: Record<number, string> = { 5: "R", 8: "K", 10: "A" };
const ORD = ["S", "T", "J", "E", "R", "N", "E", "K", "L", "A", "R", "T"];
const RUNE = ORD.map((l, i) => FORSIDE[i + 1] ?? skjultRune(23, l));
const HJORNE = klipphjorner(23, RUNE);
const ROMER = "I II III IV V VI VII VIII IX X XI XII".split(" ");

function Stjerne({ children }: { children: ReactNode }) {
  return (
    <div className="h-full relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-[2mm]" aria-hidden>
        <polygon
          points="50,3 61,38 98,38 68,60 79,95 50,73 21,95 32,60 2,38 39,38"
          fill="none"
          stroke="black"
          strokeWidth="1.5"
        />
        <circle cx="50" cy="12" r="2.5" fill="none" stroke="black" />
      </svg>
      <div className="relative w-[26mm] h-[26mm] mt-[6mm]">{children}</div>
    </div>
  );
}

export default function Dag23Stjerner() {
  return (
    <Utskrift
      navn="dag23-stjerner"
      papir="tykt"
      tosidig
      deler={[
        {
          str: { b: 64, h: 64 },
          antall: 12,
          forside: (i) => (
            <Stjerne>
              <Kort bokstav={FORSIDE[i + 1] ?? null} tegn={RUNE[i]} stor={13} />
            </Stjerne>
          ),
          bakside: (i) => (
            <Stjerne>
              <div className="h-full flex items-center justify-center font-retro text-[9mm]">
                {ROMER[i]}
              </div>
            </Stjerne>
          ),
        },
        // A star is cut along its points, so the new rune's corner is a loose tile.
        ...HJORNE.flatMap((l) =>
          l
            ? [
                {
                  str: { b: SIDE, h: SIDE },
                  forside: () => (
                    <div className="h-full relative">
                      <Klipphjorne letter={l} />
                    </div>
                  ),
                },
              ]
            : [],
        ),
      ]}
      instruks={{
        klipp:
          "tolv stjerner langs stjernekanten, stikk hull i ringen og tre hyssing.",
        hjorne: true,
        hvor: "I november: klipp og tre. Det løse tegnhjørnet teipes på baksiden av stjerne III. Kvelden 22. des.: heng dem i treet, de laveste i Hannas høyde, Rampenissen med det blå måne-kortet.",
      }}
    />
  );
}

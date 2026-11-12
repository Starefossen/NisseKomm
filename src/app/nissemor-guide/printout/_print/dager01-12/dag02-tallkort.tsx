import { Utskrift } from "../Utskrift";
import { Iskrystall } from "./felles";

// Subtractive Roman numerals on purpose: IX, XIX and XIV are the hard part.
const STYKKER = ["IX + III", "XIX − III", "XIV + VI"];

export default function Dag02Tallkort() {
  return (
    <Utskrift
      navn="dag02-tallkort"
      papir="tykt"
      deler={[
        {
          str: "A7",
          antall: STYKKER.length,
          forside: (i) => (
            <div className="h-full relative flex items-center justify-center font-retro text-[16mm] leading-none">
              <span className="absolute top-[4mm] left-[4mm]">
                <Iskrystall size={22} />
              </span>
              {STYKKER[i]}
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "tre kort. Ingen instruks på kortene.",
        hvor: "Kvelden før dag 2: teip ett kort under hver av tre spisestoler med maskeringsteip. Rampenissens lapp i sukkerskålen.",
      }}
    />
  );
}

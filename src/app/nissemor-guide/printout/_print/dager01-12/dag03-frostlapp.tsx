import { Utskrift } from "../Utskrift";
import { Ruter } from "./felles";

const CELLER = [null, "R", null, "S", null, null];
// The envelope card teaches all six runes after the code (E is needed on day 7).
const RUNER = ["P", "R", "I", "S", "M", "E"];

export default function Dag03Frostlapp() {
  return (
    <Utskrift
      navn="dag03-frostlapp"
      papir="tykt"
      deler={[
        {
          str: "A6",
          forside: () => (
            <div className="h-full flex flex-col items-center justify-center gap-[10mm] font-retro">
              <div className="text-4xl">FROSTLAPP</div>
              <Ruter
                celler={CELLER}
                runer={RUNER}
                nummer
                storrelse="w-[13mm] h-[18mm]"
              />
            </div>
          ),
        },
        {
          str: "A6",
          forside: () => (
            <div className="h-full flex flex-col items-center justify-center gap-[10mm] font-retro">
              <div className="text-4xl">PUST PÅ MEG.</div>
              {/* Mirror image: letters flipped and order reversed, as if written from inside the mirror. */}
              <div className="-scale-x-100">
                <Ruter
                  celler={CELLER}
                  runer={[]}
                  storrelse="w-[13mm] h-[18mm]"
                />
              </div>
            </div>
          ),
        },
        {
          str: { b: 110, h: 30 },
          forside: () => (
            <div className="h-full flex items-center justify-center font-retro text-4xl">
              ETTER KODEN – IQ
            </div>
          ),
        },
      ]}
      instruks={{
        klipp:
          "to kort og konvoluttlappen. Kort 1 er rettvendt med tegn, kort 2 speilvendt uten tegn.",
        hvor: "Kvelden før dag 3: kort 1 i en liten konvolutt med lappen «ETTER KODEN – IQ» limt på, i vinduskarmen ved glassperlen og hjerte-kortet. Kort 2 er reserve hvis speilet svikter: legg det i tannkremtuben.",
      }}
    />
  );
}

import { A6, Ark, Klipp, Ruter, Utskrift } from "../_print/Utskrift";

const CELLER = [null, "R", null, "S", null, null];
const RUNER = ["P", "R", "I", "S", "M", "E"];

export default function Dag03Frostlapp() {
  return (
    <Utskrift
      tittel="Dag 3 – frostkortet"
      papir="1 ark, tykt papir"
      merknad="Kort 1 (rettvendt, med tegn) i konvolutten «ETTER KODEN – IQ» i vinduskarmen. Kort 2 (speilvendt, uten tegn) er reserve hvis speilet svikter: legg det i tannkremtuben."
    >
      <Ark>
        <div className="flex gap-[2mm]">
          <Klipp
            className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
          >
            <div className="text-4xl">FROSTLAPP</div>
            <Ruter
              celler={CELLER}
              runer={RUNER}
              nummer
              storrelse="w-[13mm] h-[18mm]"
            />
          </Klipp>
          <Klipp
            className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
          >
            <div className="text-4xl">PUST PÅ MEG.</div>
            {/* Mirror image: letters flipped and order reversed, as if written from inside the mirror. */}
            <div className="-scale-x-100">
              <Ruter celler={CELLER} storrelse="w-[13mm] h-[18mm]" />
            </div>
          </Klipp>
        </div>
        <Klipp className="mt-[4mm] w-[110mm] h-[30mm] flex items-center justify-center text-4xl">
          ETTER KODEN – IQ
        </Klipp>
      </Ark>
    </Utskrift>
  );
}

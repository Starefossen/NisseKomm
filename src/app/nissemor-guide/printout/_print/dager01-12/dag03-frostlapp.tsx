import { PrintPage, CutCard } from "../PrintPage";
import { A6, Ark, Ruter } from "./felles";

const CELLER = [null, "R", null, "S", null, null];
// The envelope card teaches all six runes after the code (E is needed on day 7).
const RUNER = ["P", "R", "I", "S", "M", "E"];

export default function Dag03Frostlapp() {
  return (
    <PrintPage
      title="Dag 3 – frostkortet"
      paper="1 ark, tykt papir"
      note="Kort 1 (rettvendt, med tegn) i konvolutten «ETTER KODEN – IQ» i vinduskarmen. Kort 2 (speilvendt, uten tegn) er reserve hvis speilet svikter: legg det i tannkremtuben."
    >
      <Ark>
        <div className="flex gap-[2mm]">
          <CutCard
            className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
          >
            <div className="text-4xl">FROSTLAPP</div>
            <Ruter
              celler={CELLER}
              runer={RUNER}
              nummer
              storrelse="w-[13mm] h-[18mm]"
            />
          </CutCard>
          <CutCard
            className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
          >
            <div className="text-4xl">PUST PÅ MEG.</div>
            {/* Mirror image: letters flipped and order reversed, as if written from inside the mirror. */}
            <div className="-scale-x-100">
              <Ruter celler={CELLER} runer={[]} storrelse="w-[13mm] h-[18mm]" />
            </div>
          </CutCard>
        </div>
        <CutCard className="mt-[4mm] w-[110mm] h-[30mm] flex items-center justify-center text-4xl">
          ETTER KODEN – IQ
        </CutCard>
      </Ark>
    </PrintPage>
  );
}

import { PrintPage, CutCard } from "../PrintPage";
import { A7, Ark, Iskrystall } from "./felles";

// Subtractive Roman numerals on purpose: IX, XIX and XIV are the hard part.
const STYKKER = ["IX + III", "XIX − III", "XIV + VI"];

export default function Dag02Tallkort() {
  return (
    <PrintPage
      title="Dag 2 – sikringskortene"
      paper="1 ark, tykt papir"
      note="Tre kort, teipes under tre spisestoler. Ingen instruks på kortene."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {STYKKER.map((s) => (
            <CutCard
              key={s}
              className={`${A7} flex items-center justify-center text-[16mm] leading-none`}
            >
              <span className="absolute top-[3mm] left-[3mm]">
                <Iskrystall size={22} />
              </span>
              {s}
            </CutCard>
          ))}
        </div>
      </Ark>
    </PrintPage>
  );
}

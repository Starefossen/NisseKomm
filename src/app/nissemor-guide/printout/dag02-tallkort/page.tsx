import { A7, Ark, Iskrystall, Klipp, Utskrift } from "../_print/Utskrift";

// Subtractive Roman numerals on purpose: IX, XIX and XIV are the hard part.
const STYKKER = ["IX + III", "XIX − III", "XIV + VI"];

export default function Dag02Tallkort() {
  return (
    <Utskrift
      tittel="Dag 2 – sikringskortene"
      papir="1 ark, tykt papir"
      merknad="Tre kort, teipes under tre spisestoler. Ingen instruks på kortene."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {STYKKER.map((s) => (
            <Klipp
              key={s}
              className={`${A7} flex items-center justify-center text-[16mm] leading-none`}
            >
              <span className="absolute top-[3mm] left-[3mm]">
                <Iskrystall size={22} />
              </span>
              {s}
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

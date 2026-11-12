import { RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";

// The hopper must be exactly three cells wide, so both use the same cell width.
const RUTE = 6.2;

export default function Alfabetstrimmel() {
  return (
    <Utskrift
      navn="alfabetstrimmel"
      papir="tykt"
      deler={[
        {
          str: { b: RUTE * RUNE_ALPHABET.length, h: 18 },
          antall: 2,
          forside: () => (
            <div className="h-full flex font-retro">
              {RUNE_ALPHABET.map((l) => (
                <div
                  key={l}
                  className="h-full border-r-[0.3mm] border-black last:border-r-0 flex items-center justify-center text-[6mm]"
                  style={{ width: `${RUTE}mm` }}
                >
                  {l}
                </div>
              ))}
            </div>
          ),
        },
        {
          str: { b: RUTE * 3, h: 24 },
          antall: 2,
          forside: () => (
            <div className="h-full flex">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="h-full border-r-[0.3mm] border-black last:border-r-0"
                  style={{ width: `${RUTE}mm` }}
                />
              ))}
            </div>
          ),
        },
      ]}
      instruks={{
        klipp:
          "to strimler og to hoppere, nøyaktig langs linjene (hopperen skal være tre ruter bred). Én av hver er reserve. Ingen tall eller piler.",
        hvor: "Dag 5: strimmelen og hopperen ved brevfuglen høyt i stua. Ta vare på dem: de brukes igjen dag 22.",
      }}
    />
  );
}

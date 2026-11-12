import { Utskrift } from "../Utskrift";

const SYMBOLDAGER = [3, 6, 9, 12, 15, 18, 20, 22, 23];
const MILEPAELER = [1, 7, 12, 15, 21, 24];

/** 194 × 550 mm (A3 as 2 × A4); leaves a 158 × 220 mm field for the A5 rune board. */
function Brett() {
  return (
    <div className="h-full p-[6mm] flex flex-col items-center font-retro border-[2mm] border-double border-black">
      <h1 className="text-[13mm] leading-none tracking-widest text-center mt-[4mm]">
        OPERASJON DIREKTELINJEN
      </h1>
      <p className="text-[6mm] mb-[8mm]">
        SNØFALL · LINJE 90,0 MHz · K12 · H9 · H5
      </p>
      <div className="grid grid-cols-3 gap-[5mm]">
        {SYMBOLDAGER.map((d) => (
          <div
            key={d}
            className="w-[48mm] h-[48mm] border-[1mm] border-black relative"
          >
            <span className="absolute top-[1mm] left-[2mm] text-[6mm]">
              {d}. DES
            </span>
          </div>
        ))}
      </div>
      <h2 className="text-[8mm] mt-[10mm] mb-[3mm]">MILEPÆLER</h2>
      <div className="relative flex gap-[6mm]">
        <div className="absolute top-[11mm] left-[11mm] right-[11mm] border-t-[1mm] border-black" />
        {MILEPAELER.map((d) => (
          <div key={d} className="flex flex-col items-center z-10">
            <div className="w-[22mm] h-[22mm] rounded-full border-[1mm] border-black bg-white" />
            <span className="text-[6mm]">{d}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto mb-[4mm] w-[158mm] h-[220mm] border-[0.8mm] border-dashed border-black flex items-center justify-center text-[8mm] text-gray-400">
        RUNETAVLE HER
      </div>
    </div>
  );
}

export default function Operasjonsbrett() {
  return (
    <Utskrift
      navn="operasjonsbrett"
      papir="tykt"
      deler={[{ str: "A3", forside: () => <Brett /> }]}
      instruks={{
        brett: "i fire når det er limt, så det får plass i ferdskriveren.",
        hvor: "I ferdskriveren med runetavla og et ark med seks runde gullklistremerker, kvelden 30. november. Etter koden dag 1 henges det opp ved skjermen, runetavla limes i feltet nederst, og sirkel 1 får sitt klistremerke. Symbolkortene festes i rutene med datoene.",
      }}
    />
  );
}

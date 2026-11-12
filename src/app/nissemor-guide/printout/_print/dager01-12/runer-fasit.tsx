import { Frostrune, RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";

/** Answer key for parents only: all 29 glyphs. */
export function RunerFasit() {
  return (
    <div className="h-full p-[5mm] flex flex-col font-sans">
      <h2 className="text-[6mm] font-bold text-center mb-[3mm]">
        RUNER – FASIT (BARE FOR NISSEMOR)
      </h2>
      <div className="grid grid-cols-5 gap-[1.5mm] flex-1">
        {RUNE_ALPHABET.map((l) => (
          <div
            key={l}
            className="border-[0.4mm] border-black flex flex-col items-center justify-center gap-[1mm]"
          >
            <div className="text-[5mm] font-bold">{l}</div>
            <Frostrune letter={l} size={28} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RunerFasitSide() {
  return (
    <Utskrift
      navn="runer-fasit"
      papir="vanlig"
      deler={[{ str: "A5", forside: () => <RunerFasit /> }]}
      instruks={{
        hvor: "I Nissemor-mappen. Aldri på brettet eller noe sted barna ser den.",
      }}
    />
  );
}

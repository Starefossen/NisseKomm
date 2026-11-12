import { RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { GameEngine } from "@/lib/game-engine";
import { Utskrift } from "../Utskrift";

/** The A5 board itself; empty boxes for the kids to draw in, never-taught letters crossed out. */
export function RunetavleKids() {
  const taught = GameEngine.getLearnedRunes(24);
  return (
    <div className="h-full p-[5mm] flex flex-col font-retro">
      <h2 className="text-[9mm] leading-none text-center">RUNETAVLE</h2>
      <p className="text-[4.2mm] leading-tight text-center my-[2mm]">
        «Tegnene i hjørnet av kortene er Snøfalls gamle skrift. Ett tegn, én
        bokstav. Fyll inn når dere vet.» – IQ
      </p>
      <div className="grid grid-cols-5 grid-rows-6 gap-[1.5mm] flex-1 min-h-0">
        {RUNE_ALPHABET.map((l) =>
          taught.has(l) ? (
            <div key={l} className="border-[0.5mm] border-black p-[1mm]">
              <div className="text-[5mm] leading-none">{l}</div>
            </div>
          ) : (
            <div
              key={l}
              data-kryss={l}
              aria-label={`${l} brukes ikke`}
              className="border-[0.5mm] border-gray-400"
            >
              <svg viewBox="0 0 10 10" className="w-full h-full" aria-hidden>
                <path d="M1 1 9 9M9 1 1 9" stroke="#555" strokeWidth="0.7" />
              </svg>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function Runetavle() {
  return (
    <Utskrift
      navn="runetavle"
      papir="tykt"
      deler={[{ str: "A5", forside: () => <RunetavleKids /> }]}
      instruks={{
        klipp: "langs den stiplede linja (A5).",
        hvor: "I ferdskriveren sammen med operasjonsbrettet, kvelden 30. november. Etter koden dag 1 limes den i feltet «RUNETAVLE HER» på brettet. Barna tegner inn tegnene etter hvert som ord løses; de krysset-ut rutene læres aldri.",
      }}
    />
  );
}

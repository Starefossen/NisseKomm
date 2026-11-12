import { Frostrune } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";
import { Rutekort } from "../dager01-12/felles";

// O, E, I are real; K (cheese slicer) has no number at its home, so it fits nowhere.
const LAPPER = ["O", "E", "I", "K", "2", "5", "7"];
const HVOR = [
  "fjernkontrollen (i brødboksen)",
  "tannbørsteglasset (i bestikkskuffen)",
  "brødposen (i TV-benken)",
  "ostehøvelen (i badeskapet)",
  "TV-benken",
  "badehyllen",
  "brødboksen",
];

export default function Dag16Sorteringslapper() {
  return (
    <Utskrift
      navn="dag16-sorteringslapper"
      papir="tykt"
      deler={[
        {
          str: { b: 64, h: 60 },
          antall: LAPPER.length,
          forside: (i) => {
            const l = LAPPER[i];
            return (
              <div className="relative h-full flex items-center justify-center font-retro text-[30mm] leading-none">
                {l}
                {/[A-Z]/.test(l) && (
                  <span className="absolute top-[2mm] right-[2mm]">
                    <Frostrune letter={l} size={24} />
                  </span>
                )}
              </div>
            );
          },
        },
        { str: { b: 194, h: 40 }, forside: () => <Rutekort n={9} /> },
      ]}
      instruks={{
        klipp: "fire bokstavlapper, tre tallapper og rutekortet.",
        hvor: `Kvelden før dag 16, under streken: ${LAPPER.map((l, i) => `«${l}» på ${HVOR[i]}`).join(", ")}. Ingen lapp i bestikkskuffen. Rutekortet i brødboksen under Rampenissen.`,
      }}
    />
  );
}

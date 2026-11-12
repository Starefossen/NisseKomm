import { Frostrune } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";
import { Iskrystall, Rutekort } from "../dager01-12/felles";

// Letters under pot, ladle, whisk; ❄ under rolling pin and scoop (no rune). No numbers.
const LAPPER = ["A", "M", "L", null, null];
const UNDER = ["gryta", "sleiva", "vispen", "kjevlen", "øsa"];
// Three trails reach their tool; the two to the decoys stop halfway.
const STRIMLER = [true, true, true, false, false];

function Fotspor({ n }: { n: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-evenly py-[4mm]">
      {Array.from({ length: n }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 12 20"
          className="w-[8mm] h-[13mm]"
          style={{ marginLeft: i % 2 ? "12mm" : "-12mm" }}
          aria-hidden
        >
          <ellipse cx="6" cy="12" rx="5" ry="7" fill="#c8913f" />
          <circle cx="3" cy="3" r="1.6" fill="#c8913f" />
          <circle cx="6.5" cy="2" r="1.6" fill="#c8913f" />
          <circle cx="10" cy="3.5" r="1.6" fill="#c8913f" />
        </svg>
      ))}
    </div>
  );
}

export default function Dag15Redskapskort() {
  return (
    <Utskrift
      navn="dag15-redskapskort"
      papir="tykt"
      farge
      deler={[
        {
          str: "A7",
          antall: LAPPER.length,
          forside: (i) => {
            const l = LAPPER[i];
            return (
              <div className="relative h-full flex items-center justify-center font-retro text-[34mm] leading-none">
                {l ? (
                  <>
                    {l}
                    <span className="absolute top-[3mm] right-[3mm]">
                      <Frostrune letter={l} size={28} />
                    </span>
                  </>
                ) : (
                  <Iskrystall size={150} />
                )}
              </div>
            );
          },
        },
        { str: { b: 194, h: 40 }, forside: () => <Rutekort n={8} /> },
        {
          str: { b: 38, h: 280 },
          antall: STRIMLER.length,
          forside: (i) => <Fotspor n={STRIMLER[i] ? 12 : 5} />,
        },
      ]}
      instruks={{
        klipp:
          "ark 1: fem lapper og rutekortet. Ark 2: fem fotsporstrimler; klipp de to korte (bare øverste halvdel har spor) av der sporene slutter.",
        hvor: `Kvelden før dag 15: ${LAPPER.map((l, i) => `${l ?? "iskrystall"} under ${UNDER[i]}`).join(", ")}. Strimlene fra sirupskålen: de tre lange til gryta, sleiva og vispen, de to korte mot kjevlen og øsa. Rutekortet og det røde sol-kortet ved skålen.`,
        merk: "Ark 2 kan skrives ut på vanlig papir. Fotsporene er sukkerbrune, så skriv ut i farge.",
      }}
    />
  );
}

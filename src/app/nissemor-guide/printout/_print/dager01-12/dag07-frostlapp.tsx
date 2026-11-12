import { Frostrune } from "@/components/ui/Frostrune";
import { klipphjorner, skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";
import { HJORNER, Klipphjorne, Ruter } from "./felles";

// No letters at all: cell 3 and 5 hold only the runes learned on day 1 and 3.
// ❄ cells carry a rune only when it is new (U, D), plus a cut-off corner each.
const RUNER = ["K", "U", undefined, "D", undefined].map((l) =>
  skjultRune(7, l),
);
const NYE = klipphjorner(7, RUNER).filter((l) => l !== undefined);
const CELLER = [
  null,
  null,
  <Frostrune key="3" letter="L" size={34} />,
  null,
  <Frostrune key="5" letter="E" size={34} />,
];

export default function Dag07Frostlapp() {
  return (
    <Utskrift
      navn="dag07-frostlapp"
      papir="tykt"
      deler={[
        {
          str: "A6",
          antall: 2,
          forside: () => (
            <div className="h-full relative flex flex-col items-center justify-center gap-[10mm] font-retro">
              {NYE.map((l, i) => (
                <Klipphjorne key={l} letter={l} hjorne={HJORNER[i]} />
              ))}
              <div className="text-4xl">FROSTLAPP</div>
              <Ruter
                celler={CELLER}
                runer={RUNER}
                nummer
                storrelse="w-[15mm] h-[22mm]"
              />
            </div>
          ),
        },
      ]}
      instruks={{
        hjorne: true,
        klipp: "to kort. Det andre er reserve.",
        hvor: "Kortet i en liten zip-pose, fryst flatt i et plastbeger med 1 cm vann, ved Rampenissens lue i fryseren. Legg begeret i fryseren senest søndag 6. kl. 20. Rampenissens lapp teipes på begeret.",
      }}
    />
  );
}

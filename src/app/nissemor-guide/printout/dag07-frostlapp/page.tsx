import { Frostrune } from "@/components/ui/Frostrune";
import { A6, Ark, Klipp, Ruter, Utskrift } from "../_print/Utskrift";

// No letters at all: cell 3 and 5 hold only the runes learned on day 1 and 3.
const CELLER = [
  null,
  null,
  <Frostrune key="3" letter="L" size={34} />,
  null,
  <Frostrune key="5" letter="E" size={34} />,
];
const RUNER = ["K", "U", undefined, "D", undefined];

export default function Dag07Frostlapp() {
  return (
    <Utskrift
      tittel="Dag 7 – frostkortet i isen"
      papir="1 ark, tykt papir"
      merknad="Kortet i en liten zip-pose, fryst i et plastbeger med 3–4 cm vann. Legg begeret i fryseren senest søndag 6. kl. 20. Det andre kortet er reserve."
    >
      <Ark>
        <div className="flex gap-[2mm]">
          {[0, 1].map((i) => (
            <Klipp
              key={i}
              className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
            >
              <div className="text-4xl">FROSTLAPP</div>
              <Ruter
                celler={CELLER}
                runer={RUNER}
                nummer
                storrelse="w-[15mm] h-[22mm]"
              />
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

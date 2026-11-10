import { Frostrune } from "@/components/ui/Frostrune";
import { PrintPage, CutCard } from "../PrintPage";
import { A6, Ark, Ruter } from "./felles";

// No letters at all: cell 3 and 5 hold only the runes learned on day 1 and 3.
// ❄ cells carry no rune.
const CELLER = [
  null,
  null,
  <Frostrune key="3" letter="L" size={34} />,
  null,
  <Frostrune key="5" letter="E" size={34} />,
];

export default function Dag07Frostlapp() {
  return (
    <PrintPage
      title="Dag 7 – frostkortet i isen"
      paper="1 ark, tykt papir"
      note="Kortet i en liten zip-pose, fryst i et plastbeger med 3–4 cm vann. Legg begeret i fryseren senest søndag 6. kl. 20. Det andre kortet er reserve."
    >
      <Ark>
        <div className="flex gap-[2mm]">
          {[0, 1].map((i) => (
            <CutCard
              key={i}
              className={`${A6} flex flex-col items-center justify-center gap-[10mm]`}
            >
              <div className="text-4xl">FROSTLAPP</div>
              <Ruter celler={CELLER} nummer storrelse="w-[15mm] h-[22mm]" />
            </CutCard>
          ))}
        </div>
      </Ark>
    </PrintPage>
  );
}

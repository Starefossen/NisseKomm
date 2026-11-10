import { PrintPage, CutCard } from "../PrintPage";
import { Ark } from "./felles";

function Ramme({ tekst }: { tekst: string }) {
  return (
    <CutCard className="w-[150mm] h-[105mm] bg-black text-white p-[10mm] flex flex-col">
      <div className="flex-1 bg-white border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xl">
        skjær ut · rødt cellofan bak
      </div>
      <div className="text-3xl text-center mt-[2mm] tracking-widest">
        {tekst}
      </div>
    </CutCard>
  );
}

export default function RodfilterRamme() {
  return (
    <PrintPage
      title="Rødfilter-ramme"
      paper="1 ark, tykt papir (lages i november)"
      note="Klipp ut begge rammene, skjær ut vinduet, teip to lag rødt cellofan mellom dem og lim sammen. Legges ved tusjene dag 10."
    >
      <Ark>
        <div className="flex flex-col items-center gap-[8mm] mt-[10mm]">
          <Ramme tekst="RØDFILTER · IQ" />
          <Ramme tekst="SNØFALL · FARGELAB" />
        </div>
      </Ark>
    </PrintPage>
  );
}

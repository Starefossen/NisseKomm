import { Utskrift } from "../Utskrift";

const TEKST = ["RØDFILTER · IQ", "SNØFALL · FARGELAB"];

export default function RodfilterRamme() {
  return (
    <Utskrift
      navn="rodfilter-ramme"
      papir="tykt"
      deler={[
        {
          str: { b: 150, h: 105 },
          antall: 2,
          forside: (i) => (
            <div className="h-full bg-black text-white p-[10mm] flex flex-col font-retro">
              <div className="flex-1 bg-white border-[0.4mm] border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-[5mm]">
                skjær ut · rødt cellofan bak
              </div>
              <div className="text-[7mm] text-center mt-[2mm] tracking-widest">
                {TEKST[i]}
              </div>
            </div>
          ),
        },
      ]}
      instruks={{
        klipp:
          "begge rammene, og skjær ut det hvite vinduet i hver med hobbykniv.",
        hvor: "I november: teip to lag rødt cellofan mellom rammene og lim dem sammen. Legg filteret ved tusjene kvelden før dag 10.",
      }}
    />
  );
}

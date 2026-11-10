import { A6, Ark, Klipp, Utskrift } from "../_print/Utskrift";

export default function Dag01Linjekort() {
  return (
    <Utskrift
      tittel="Dag 1 – linjekortet"
      papir="1 ark, tykt papir"
      merknad="Skriv passordet til appen på linja med tusj. Påskriften limes på C6-konvolutten. «LINJE 90,0» teipes under TV-foten, «RESERVE» på klementinen i ferdskriveren."
    >
      <Ark>
        <div className="flex gap-[2mm]">
          <Klipp className={`${A6} p-[2mm]`}>
            <div className="h-full border-4 border-black p-[4mm] flex flex-col gap-[5mm]">
              <div className="text-4xl text-center border-b-4 border-black pb-[2mm]">
                DIREKTELINJEN
              </div>
              <div className="text-3xl text-center">90,0 MHz</div>
              <div className="text-2xl">PASSORD TIL NISSEKOMM:</div>
              <div className="h-[22mm] border-b-2 border-black" />
              <p className="text-2xl leading-tight mt-auto">
                Skriv det inn når skjermen spør. Hvis linjen skurrer, er det
                ikke dere. Det jobber vi med.
              </p>
              <div className="text-2xl text-right">– IQ</div>
            </div>
          </Klipp>
          <div className="flex flex-col gap-[2mm]">
            <Klipp className="w-[92mm] h-[40mm] flex flex-col items-center justify-center text-3xl">
              <div>K12 · H9 · H5</div>
              <div>– ÅPNES FØRST</div>
            </Klipp>
            <Klipp className="w-[52mm] h-[37mm] flex items-center justify-center text-4xl">
              LINJE 90,0
            </Klipp>
            <Klipp className="w-[52mm] h-[25mm] flex items-center justify-center text-3xl">
              RESERVE – IQ
            </Klipp>
          </div>
        </div>
      </Ark>
    </Utskrift>
  );
}

import { Utskrift } from "../Utskrift";

const midt =
  "h-full flex flex-col items-center justify-center font-retro text-center";

export default function Dag01Linjekort() {
  return (
    <Utskrift
      navn="dag01-linjekort"
      papir="tykt"
      deler={[
        {
          str: "A6",
          forside: () => (
            <div className="h-full p-[4mm] font-retro">
              <div className="h-full border-[1mm] border-black p-[4mm] flex flex-col gap-[4mm]">
                <div className="text-[9mm] text-center border-b-[1mm] border-black pb-[2mm]">
                  DIREKTELINJEN
                </div>
                <div className="text-[7mm] text-center">90,0 MHz</div>
                <div className="text-[5.5mm]">PASSORD TIL NISSEKOMM:</div>
                <div className="h-[20mm] border-b-[0.5mm] border-black" />
                <p className="text-[5mm] leading-tight mt-auto">
                  Skriv det inn når skjermen spør. Hvis linjen skurrer, er det
                  ikke dere. Det jobber vi med.
                </p>
                <div className="text-[5mm] text-right">– IQ</div>
              </div>
            </div>
          ),
        },
        {
          str: { b: 97, h: 45 },
          forside: () => (
            <div className={`${midt} text-[7mm]`}>
              <div>K12 · H9 · H5</div>
              <div>– ÅPNES FØRST</div>
            </div>
          ),
        },
        {
          str: { b: 52, h: 37 },
          forside: () => <div className={`${midt} text-[9mm]`}>LINJE 90,0</div>,
        },
        {
          str: { b: 52, h: 25 },
          forside: () => (
            <div className={`${midt} text-[6mm]`}>RESERVE – IQ</div>
          ),
        },
      ]}
      instruks={{
        klipp: "linjekortet (A6), konvoluttpåskriften og de to små lappene.",
        hvor: "Lørdag 28. november: skriv passordet til appen på linja med tusj, legg kortet i C6-konvolutten og lim påskriften på. Konvolutten øverst i ferdskriveren. «LINJE 90,0» teipes under TV-foten mandag kveld, «RESERVE – IQ» på klementinen i ferdskriveren.",
      }}
    />
  );
}

import { Utskrift } from "../Utskrift";

// On paper the flight-recorder look is black text on orange.
const MERKE =
  "h-full m-[2mm] bg-orange-400 text-black border-[1mm] border-black flex flex-col items-center justify-center text-center font-retro";

export default function Dag01Ferdskriver() {
  return (
    <Utskrift
      navn="dag01-ferdskriver"
      papir="vanlig"
      farge
      deler={[
        {
          str: { b: 194, h: 70 },
          forside: () => (
            <div className={`${MERKE} gap-[2mm]`} style={{ height: "66mm" }}>
              <div className="text-[13mm] leading-none">FERDSKRIVER</div>
              <div className="text-[6mm]">
                SNØFALL LUFTFART · FLIGHT RECORDER
              </div>
              <div className="text-[6mm] bg-black text-orange-400 px-[3mm]">
                IKKE ÅPNE UTEN K12 · H9 · H5
              </div>
              <div className="text-[5mm] tracking-widest">SNF-FDR-2026-001</div>
            </div>
          ),
        },
        {
          str: { b: 194, h: 40 },
          forside: () => (
            <div className={`${MERKE} text-[7mm]`} style={{ height: "36mm" }}>
              <div>IKKE KAST I HAVET</div>
              <div>OM FUNNET, LEVER TIL IQ</div>
            </div>
          ),
        },
        {
          str: { b: 110, h: 45 },
          forside: () => (
            <div className={`${MERKE} text-[5.5mm]`} style={{ height: "41mm" }}>
              <div>LINJE 90,0 MHz</div>
              <div>NEDSTIGNING 01.12</div>
              <div>KL. 00:04</div>
            </div>
          ),
        },
        {
          str: { b: 84, h: 22 },
          antall: 2,
          forside: () => (
            <div className="h-full flex items-center justify-center font-retro text-[7mm]">
              FORSEGLET – IQ
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "tre merker og to «FORSEGLET»-strimler.",
        hvor: "Lørdag 28. november, når skoesken er kledd i svart med to oransje striper: toppmerket på lokket, langsidemerket på esken, kortsidemerket i enden. Mandag kveld limes én «FORSEGLET – IQ» på maskeringsteipen over lokkekanten (den andre er reserve).",
      }}
    />
  );
}

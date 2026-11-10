import { Ark, Klipp, Utskrift } from "../_print/Utskrift";

// Orange on black boxes is the flight-recorder look; on paper it is black text on orange.
const MERKE = "bg-orange-400 text-black border-4 border-black";

export default function Dag01Ferdskriver() {
  return (
    <Utskrift
      tittel="Dag 1 – merker til ferdskriveren"
      papir="1 ark, vanlig papir"
      merknad="Toppmerket på lokket, langsidemerket på esken, kortsidemerket i enden. «FORSEGLET»-strimlene limes på maskeringsteipen over lokkekanten."
    >
      <Ark>
        <div className="flex flex-col gap-[3mm] items-center">
          <Klipp className="w-[186mm] h-[70mm] p-[2mm]">
            <div
              className={`${MERKE} h-full flex flex-col items-center justify-center gap-[2mm] text-center`}
            >
              <div className="text-6xl">FERDSKRIVER</div>
              <div className="text-3xl">SNØFALL LUFTFART · FLIGHT RECORDER</div>
              <div className="text-3xl bg-black text-orange-400 px-[3mm]">
                IKKE ÅPNE UTEN K12 · H9 · H5
              </div>
              <div className="text-2xl tracking-widest">SNF-FDR-2026-001</div>
            </div>
          </Klipp>
          <Klipp className="w-[186mm] h-[40mm] p-[2mm]">
            <div
              className={`${MERKE} h-full flex flex-col items-center justify-center text-center text-3xl`}
            >
              <div>IKKE KAST I HAVET</div>
              <div>OM FUNNET, LEVER TIL IQ</div>
            </div>
          </Klipp>
          <Klipp className="w-[110mm] h-[45mm] p-[2mm]">
            <div
              className={`${MERKE} h-full flex flex-col items-center justify-center text-center text-2xl`}
            >
              <div>LINJE 90,0 MHz</div>
              <div>NEDSTIGNING 01.12</div>
              <div>KL. 00:04</div>
            </div>
          </Klipp>
          <div className="flex gap-[3mm]">
            {[0, 1].map((i) => (
              <Klipp
                key={i}
                className="w-[90mm] h-[18mm] flex items-center justify-center text-3xl"
              >
                FORSEGLET – IQ
              </Klipp>
            ))}
          </div>
          <Klipp className="w-[186mm] h-[12mm] flex items-center justify-center text-xl tracking-widest">
            SNF-FDR-2026-001 · SNF-FDR-2026-001 · SNF-FDR-2026-001
          </Klipp>
        </div>
      </Ark>
    </Utskrift>
  );
}

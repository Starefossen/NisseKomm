import { PrintPage } from "../PrintPage";
import { Ark } from "./felles";

const SYMBOLDAGER = [3, 6, 9, 12, 15, 18, 20, 22, 23];
const MILEPAELER = [1, 7, 12, 15, 21, 24];

export default function Operasjonsbrett() {
  return (
    <PrintPage
      title="Operasjonsbrettet"
      paper="2 ark A4, tykt papir (eller A3 skalert)"
      note="Lim ark 2 under ark 1 langs skjøtemerket. Ett gullklistremerke i sirkelen hver gang en milepæl er nådd; sirkel 1 får sitt etter koden dag 1."
    >
      <Ark>
        <div className="border-8 border-double border-black h-[265mm] p-[6mm] flex flex-col">
          <h1 className="text-6xl text-center tracking-widest">
            OPERASJON DIREKTELINJEN
          </h1>
          <p className="text-center text-2xl mb-[8mm]">
            SNØFALL · LINJE 90,0 MHz · K12 · H9 · H5
          </p>
          <div className="grid grid-cols-3 gap-[6mm] mx-auto">
            {SYMBOLDAGER.map((d) => (
              <div
                key={d}
                className="w-[52mm] h-[52mm] border-4 border-black relative"
              >
                <span className="absolute top-[1mm] left-[2mm] text-3xl">
                  {d}. DES
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-center text-gray-500 border-t-2 border-dashed border-gray-500 pt-[1mm]">
            ▼ SKJØT ▼ ark 2 limes her ▼
          </div>
        </div>
      </Ark>
      <Ark>
        <div className="border-8 border-double border-black border-t-0 h-[265mm] p-[6mm] flex flex-col">
          <h2 className="text-4xl text-center mt-[20mm] mb-[15mm]">
            MILEPÆLER
          </h2>
          <div className="relative flex justify-between px-[6mm]">
            <div className="absolute top-[13mm] left-[12mm] right-[12mm] border-t-4 border-black" />
            {MILEPAELER.map((d) => (
              <div
                key={d}
                className="flex flex-col items-center gap-[2mm] z-10"
              >
                <div className="w-[26mm] h-[26mm] rounded-full border-4 border-black bg-white" />
                <span className="text-3xl">{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-2xl text-center">
            RUNETAVLA HENGER HER
            <div className="mx-auto mt-[3mm] w-[120mm] h-[80mm] border-4 border-dashed border-black" />
          </div>
        </div>
      </Ark>
    </PrintPage>
  );
}

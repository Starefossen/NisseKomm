import { Utskrift } from "../Utskrift";
import { Kort } from "./felles";

// Tags on the foil packs: stue U · 2, kjøkken O · 5, gang ❄ · 3 (rune L), plus BEVIS.
const LAPPER = [
  { l: "U", n: 2, rom: "stua" },
  { l: "O", n: 5, rom: "kjøkkenet" },
  { l: null, n: 3, rom: "gangen" },
];

// GULROT: square 3 is L.
const ORD = "GULROT";

function Lapp({ l, n }: { l: string | null; n: number }) {
  return (
    <div className="h-full flex items-center justify-center gap-[3mm] font-retro text-[16mm] leading-none">
      <span className="absolute top-[3mm] left-1/2 -translate-x-1/2 w-[3mm] h-[3mm] rounded-full border-[0.4mm] border-black" />
      <div className="w-[26mm] h-[28mm] relative">
        <Kort bokstav={l} tegn={ORD[n - 1]} stor={16} />
      </div>
      <span>· {n}</span>
    </div>
  );
}

export default function Dag19Bevislapper() {
  return (
    <Utskrift
      navn="dag19-bevislapper"
      papir="tykt"
      deler={[
        {
          str: { b: 64, h: 45 },
          antall: 3,
          forside: (i) => <Lapp {...LAPPER[i]} />,
        },
        {
          str: { b: 194, h: 30 },
          forside: () => (
            <div className="h-full flex items-center justify-center font-retro text-[18mm] tracking-[4mm]">
              BEVIS
            </div>
          ),
        },
        {
          str: { b: 194, h: 200 },
          forside: () => (
            <div className="h-full p-[6mm] grid grid-cols-3 grid-rows-2 gap-[4mm] font-retro">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="border-[0.8mm] border-black flex items-start p-[2mm] text-[12mm] leading-none"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: `tre merkelapper (hull øverst for hyssing), BEVIS-lappen og rutearket. Lappene hører til ${LAPPER.map((p) => `${p.l ?? "iskrystall"} · ${p.n} i ${p.rom}`).join(", ")}.`,
        hvor: "Kvelden 18. des.: fire små gulrøtter i folie. Tre pakker med merkelapp på hyssing i hvert sitt rom; den fjerde med BEVIS-lappen ligger på rutearket i teipomrisset, med Rampenissens håndskrevne lapp. Pakkene åpnes først etter koden.",
      }}
    />
  );
}

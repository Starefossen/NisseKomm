import { Utskrift } from "../Utskrift";
import { midt } from "./felles";

// Two separate numbers per sock, never joined by a dash (reads as minus).
const KORT = [
  ["1a", "15"],
  ["1b", "4"],
  ["2a", "17"],
  ["2b", "7"],
  ["3a", "32"],
  ["3b", "22"],
];

export default function Dag22Sokkelapper() {
  return (
    <Utskrift
      navn="dag22-sokkelapper"
      papir="tykt"
      deler={[
        {
          str: { b: 64, h: 50 },
          antall: KORT.length,
          forside: (i) => (
            <div className="h-full relative flex items-center justify-center font-retro text-[26mm] leading-none">
              <span className="absolute top-[2mm] left-[3mm] text-[5mm] text-gray-500">
                {KORT[i][0]}
              </span>
              {KORT[i][1]}
            </div>
          ),
        },
        {
          str: { b: 64, h: 50 },
          antall: 3,
          forside: (i) =>
            midt(
              <div className="flex flex-col items-center font-retro leading-none">
                <span className="text-[7mm]">SOKK</span>
                <span className="text-[26mm]">{i + 1}</span>
              </div>,
            ),
        },
      ]}
      instruks={{
        klipp: "seks tallkort (a/b i hjørnet) og tre sokkemerker.",
        hvor: "Kvelden 21. des.: sokk 1 i stua med 1a og 1b, sokk 2 på kjøkkenet med 2a og 2b, sokk 3 (Hannas, i gangen) med 3a, 3b, Rampenissen og det røde måne-kortet. Sokkemerket festes på hver sokk.",
      }}
    />
  );
}

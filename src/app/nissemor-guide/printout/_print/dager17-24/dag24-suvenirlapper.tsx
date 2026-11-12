import { Utskrift } from "../Utskrift";
import { Kort, Rutekort } from "./felles";

// Runes only, no letters: perlen U · 2, filteret E · 4, båndbiten G · 7.
const LAPPER = [
  { l: "U", n: 2, ting: "perlen" },
  { l: "E", n: 4, ting: "filteret" },
  { l: "G", n: 7, ting: "båndbiten" },
];

function Lapp({ i, kopi }: { i: number; kopi: boolean }) {
  const p = LAPPER[i];
  return (
    <div className="h-full flex flex-col items-center justify-center font-retro leading-none">
      <div className="flex items-center gap-[3mm] text-[14mm]">
        <div className="w-[16mm] h-[24mm] relative">
          <Kort bokstav={p.l} vis="tegn" stor={9} />
        </div>
        · {p.n}
      </div>
      {kopi && <div className="text-[4mm] mt-[1mm]">IQS KOPI</div>}
    </div>
  );
}

export default function Dag24Suvenirlapper() {
  return (
    <Utskrift
      navn="dag24-suvenirlapper"
      papir="tykt"
      deler={[
        {
          str: { b: 64, h: 40 },
          antall: 3,
          forside: (i) => <Lapp i={i} kopi={false} />,
        },
        {
          str: { b: 64, h: 40 },
          antall: 3,
          forside: (i) => <Lapp i={i} kopi />,
        },
        { str: { b: 194, h: 40 }, forside: () => <Rutekort n={8} /> },
      ]}
      instruks={{
        klipp: `tre lapper, tre reservelapper («IQS KOPI») og rutekortet. Lappene festes på ${LAPPER.map((p) => p.ting).join(", ")} i den rekkefølgen.`,
        hvor: "Kvelden 23. des.: de tre tingene med lapp i pappesken med sløyfe ved konvolutten. I gullkonvolutten: avskjedsbrevet, rutekortet og reservelappene.",
        merk: "Mangler tavla et tegn, står bokstavene i dagsvisningen for dag 24.",
      }}
    />
  );
}

import { Frostrune } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";
import { Iskrystall } from "./felles";
import { Rodstoy } from "./Rodstoy";

// Rainbow order; ORANSJE → P, BLÅ → T. HVIT is the decoy (R). Rainbow cards carry their SPEKTER letter's rune; HVIT only R.
const KORT: {
  navn: string;
  farge: string;
  vis: string | null;
  rune: string;
}[] = [
  { navn: "RØD", farge: "#e11d48", vis: null, rune: "S" },
  { navn: "ORANSJE", farge: "#f97316", vis: "P", rune: "P" },
  { navn: "GUL", farge: "#facc15", vis: null, rune: "E" },
  { navn: "GRØNN", farge: "#16a34a", vis: null, rune: "K" },
  { navn: "BLÅ", farge: "#2563eb", vis: "T", rune: "T" },
  { navn: "INDIGO", farge: "#4338ca", vis: null, rune: "E" },
  { navn: "FIOLETT", farge: "#9333ea", vis: null, rune: "R" },
  { navn: "HVIT", farge: "#ffffff", vis: "R", rune: "R" },
];

function Kort({ i, tom }: { i: number; tom?: boolean }) {
  const k = KORT[i];
  return (
    <div className="h-full p-[2mm] font-retro">
      <div
        className="relative h-full border-[4mm] flex flex-col outline-[0.2mm] outline-solid outline-gray-400"
        style={{ borderColor: k.farge }}
      >
        <div className="text-[7mm] text-center">{k.navn}</div>
        <div className="flex-1 text-[44mm] leading-none">
          {!tom && <Rodstoy>{k.vis ?? <Iskrystall size={70} />}</Rodstoy>}
        </div>
        {!tom && (
          <span className="absolute top-[1mm] right-[1mm]">
            <Frostrune letter={k.rune} size={20} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dag10Fargekort() {
  return (
    <Utskrift
      navn="dag10-fargekort"
      papir="tykt"
      farge
      deler={[
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => <Kort i={i} />,
        },
        {
          str: "A7",
          antall: KORT.length,
          forside: (i) => <Kort i={i} tom />,
        },
      ]}
      instruks={{
        klipp:
          "åtte kort fra ark 1. Ark 2 er en blank reserve: skriv bare ut den hvis testarket viste at skriveren ikke klarer støyen.",
        hvor: "Kvelden før dag 10: gjem de åtte kortene lavt og høyt i stua. Rødfilteret ved tusjene. Test med testarket først.",
        merk: "Blank reserve: tegn bokstaven med cyan tusj (P på ORANSJE, T på BLÅ, R på HVIT, iskrystall på resten) og kruss over med rød tusj.",
      }}
    />
  );
}

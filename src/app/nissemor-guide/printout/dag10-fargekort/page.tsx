import { A7, Ark, Iskrystall, Klipp, Utskrift } from "../_print/Utskrift";
import { Rodstoy } from "../_print/Rodstoy";

// Rainbow order; ORANSJE → P, BLÅ → T. HVIT is the decoy (R) and only has a rune at its letter.
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

function Kort({ k, tom }: { k: (typeof KORT)[number]; tom?: boolean }) {
  return (
    <Klipp rune={tom ? undefined : k.rune} className={`${A7} p-[2mm]`}>
      <div
        className="h-full border-[4mm] flex flex-col"
        style={{ borderColor: k.farge, outline: "1px solid #999" }}
      >
        <div className="text-3xl text-center">{k.navn}</div>
        <div className="flex-1 text-[24mm] leading-none">
          {tom ? null : <Rodstoy>{k.vis ?? <Iskrystall size={70} />}</Rodstoy>}
        </div>
      </div>
    </Klipp>
  );
}

export default function Dag10Fargekort() {
  return (
    <Utskrift
      tittel="Dag 10 – fargekortene"
      papir="2 ark, tykt papir, fargeutskrift"
      merknad="Åtte kort gjemmes lavt og høyt i stua; rødfilteret ved tusjene. Test med dag10-testark først. Side 2 er en blank variant: tegn bokstavene selv med cyan tusj og kruss over med rød hvis skriveren ikke gjør jobben."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {KORT.map((k) => (
            <Kort key={k.navn} k={k} />
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {KORT.map((k) => (
            <Kort key={k.navn} k={k} tom />
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

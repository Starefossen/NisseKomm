import { Utskrift } from "../Utskrift";
const LOGG = [
  "SNØFALL LUFTFART",
  "LOGG LINJE 90,0",
  "================",
  "30.11 23:52",
  "LINJE ÅPNET.",
  "BÆREBØLGE 90,0 OK",
  "",
  "30.11 23:58",
  "LAST SLUPPET:",
  "VITAMIN C, 3 KOLLI",
  "",
  "01.12 00:04",
  "NISSE SLUPPET.",
  "FALLSKJERM: SERVIETT",
  "",
  "01.12 00:05",
  "LANDING.",
  "UNDERLAG: MYKT.",
  "GULT. BUET.",
  "",
  "01.12 00:06",
  "BÆREBØLGE 90,0 …",
  "90,0 … 85,0 ? …",
  "90,0",
  "",
  "01.12 00:07",
  "ORAKELET:",
  "NOE LYTTER.",
  "OVERVÅKES.",
  "",
  "01.12 00:08",
  "LOGG SLUTT",
  "================",
];
const HALV = 15;

function Strimmel({ linjer, lim }: { linjer: string[]; lim: boolean }) {
  return (
    <div className="h-full flex flex-col font-mono">
      {lim && (
        <div className="h-[15mm] border-b-[0.3mm] border-dashed border-gray-400 text-gray-400 text-[3mm] flex items-center justify-center">
          LIM DEL 1 HER
        </div>
      )}
      <pre className="p-[4mm] text-[11pt] leading-[7mm] whitespace-pre-wrap font-mono">
        {linjer.join("\n")}
      </pre>
    </div>
  );
}

export default function Dag01Flylogg() {
  return (
    <Utskrift
      navn="dag01-flylogg"
      papir="vanlig"
      deler={[
        {
          str: { b: 70, h: 270 },
          antall: 2,
          forside: (i) => (
            <Strimmel
              linjer={i ? LOGG.slice(HALV) : LOGG.slice(0, HALV)}
              lim={i === 1}
            />
          ),
        },
      ]}
      instruks={{
        klipp: "de to strimlene. Lim enden av del 1 over limfeltet på del 2.",
        brett:
          "ikke brett: rull strimmelen fra slutten og hold den med en binders.",
        hvor: "Fredag 28. november i ferdskriveren, etter IQs konvolutt.",
      }}
    />
  );
}

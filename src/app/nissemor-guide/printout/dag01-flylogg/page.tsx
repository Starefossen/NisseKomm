import { Ark, Klipp, Utskrift } from "../_print/Utskrift";

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

function Strimmel({ linjer, lim }: { linjer: string[]; lim: "topp" | "bunn" }) {
  return (
    <Klipp className="w-[70mm] h-[270mm] flex flex-col font-mono">
      {lim === "topp" && (
        <div className="h-[15mm] border-b-2 border-dashed border-gray-400 text-gray-400 text-xs flex items-center justify-center">
          LIM DEL 1 HER
        </div>
      )}
      <pre className="p-[4mm] text-[11pt] leading-[7mm] whitespace-pre-wrap font-mono">
        {linjer.join("\n")}
      </pre>
    </Klipp>
  );
}

export default function Dag01Flylogg() {
  return (
    <Utskrift
      tittel="Dag 1 – flyloggen"
      papir="1 ark, vanlig papir"
      merknad="Klipp de to strimlene, lim enden av del 1 over limfeltet på del 2, rull sammen og hold med en binders."
    >
      <Ark>
        <div className="flex gap-[10mm] justify-center">
          <Strimmel linjer={LOGG.slice(0, HALV)} lim="bunn" />
          <Strimmel linjer={LOGG.slice(HALV)} lim="topp" />
        </div>
      </Ark>
    </Utskrift>
  );
}

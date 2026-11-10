import { PrintPage, CutCard } from "../PrintPage";
import { Ark, Iskrystall } from "./felles";

const STREKKODE = "90.0-SNF-0112";

function Logo() {
  return (
    <svg viewBox="0 0 100 100" className="w-[34mm] h-[34mm]" aria-hidden>
      <defs>
        <path
          id="frakt-ring"
          d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0"
        />
      </defs>
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="black"
        strokeWidth="3"
      />
      <circle
        cx="50"
        cy="50"
        r="27"
        fill="none"
        stroke="black"
        strokeWidth="1.5"
      />
      <text fontSize="11" letterSpacing="2" fontFamily="monospace">
        <textPath href="#frakt-ring">SNØFALL FRAKT · SNØFALL FRAKT ·</textPath>
      </text>
      <g transform="translate(32 32) scale(1.5)">
        <foreignObject width="24" height="24">
          <Iskrystall size={24} />
        </foreignObject>
      </g>
    </svg>
  );
}

// Bars derived from the characters so the code looks real and prints the same every time.
function Strekkode() {
  const bredder = STREKKODE.split("").flatMap((c) => {
    const n = c.charCodeAt(0);
    return [1 + (n % 3), 1 + ((n >> 2) % 2), 1 + ((n >> 1) % 3), 1];
  });
  const startX = bredder.map((_, i) =>
    bredder.slice(0, i).reduce((a, b) => a + b, 0),
  );
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${bredder.reduce((a, b) => a + b, 0)} 20`}
        className="w-[70mm] h-[14mm]"
        preserveAspectRatio="none"
        aria-hidden
      >
        {bredder.map((b, i) =>
          i % 2 === 0 ? (
            <rect key={i} x={startX[i]} width={b} height="20" />
          ) : null,
        )}
      </svg>
      <div className="text-xl tracking-[0.3em]">{STREKKODE}</div>
    </div>
  );
}

function Fraktetikett() {
  return (
    <CutCard className="w-[186mm] h-[134mm] p-[3mm]">
      <div className="h-full border-4 border-black p-[4mm] flex flex-col gap-[3mm] text-2xl">
        <div className="flex items-center gap-[6mm] border-b-4 border-black pb-[2mm]">
          <Logo />
          <div>
            <div className="text-5xl">SNØFALL FRAKT</div>
            <div>LUFTFRAKT · ADVENTSRUTEN</div>
          </div>
        </div>
        <div>FRA: Verkstedet, Snøfall · Linje 90,0 MHz</div>
        <div>TIL: Rampenissen c/o K12 · H9 · H5, Landås</div>
        <div>INNHOLD: VITAMIN C, 2,3 KG</div>
        <div className="flex items-end justify-between mt-auto">
          <div className="text-4xl">SENDING ___ AV 4</div>
          <Strekkode />
        </div>
      </div>
    </CutCard>
  );
}

function Stempel({
  tekst,
  farge,
  rund,
}: {
  tekst: string;
  farge: string;
  rund?: boolean;
}) {
  return (
    <CutCard className="w-[90mm] h-[60mm] flex items-center justify-center">
      <div
        className={`border-[1.5mm] ${farge} ${rund ? "rounded-full w-[52mm] h-[52mm]" : "px-[4mm] py-[3mm] -rotate-6"} flex items-center justify-center text-center text-4xl leading-none`}
      >
        {tekst}
      </div>
    </CutCard>
  );
}

export default function Dag01Frakt() {
  return (
    <PrintPage
      title="Dag 1 – fraktetiketter og stempler"
      paper="3 ark, vanlig papir. Skriv ut side 1 to ganger (4 etiketter)."
      note="Nummerer etikettene for hånd: SENDING 1 AV 4 osv. «TRYKKSKADET» på den revnede esken. Stemplene limes skjevt."
    >
      <Ark>
        <div className="flex flex-col gap-[3mm]">
          <Fraktetikett />
          <Fraktetikett />
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {[0, 1, 2, 3].map((i) => (
            <CutCard key={i} className="w-[92mm] h-[134mm] p-[3mm]">
              <div className="h-full border-[3mm] border-red-600 flex flex-col items-center justify-center gap-[6mm] text-center p-[3mm]">
                <div className="text-6xl text-red-600">SKJØRT</div>
                <div className="text-3xl">VITAMIN C TIL LANDÅS</div>
                <div className="text-3xl">DENNE SIDE OPP</div>
                <div className="text-8xl leading-none">↑</div>
              </div>
            </CutCard>
          ))}
        </div>
      </Ark>
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          <Stempel tekst="TRYKKSKADET" farge="border-red-600 text-red-600" />
          <Stempel tekst="TRYKKSKADET" farge="border-red-600 text-red-600" />
          <Stempel
            tekst="KONTROLLERT – IQ"
            farge="border-blue-700 text-blue-700"
            rund
          />
          <Stempel
            tekst="KONTROLLERT – IQ"
            farge="border-blue-700 text-blue-700"
            rund
          />
          <Stempel tekst="HASTER · ADVENT" farge="border-black text-black" />
          <Stempel tekst="HASTER · ADVENT" farge="border-black text-black" />
          <Stempel tekst="HASTER · ADVENT" farge="border-black text-black" />
          <Stempel
            tekst="KONTROLLERT – IQ"
            farge="border-blue-700 text-blue-700"
            rund
          />
        </div>
      </Ark>
    </PrintPage>
  );
}

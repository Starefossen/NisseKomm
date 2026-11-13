import { Utskrift } from "../Utskrift";
import { Iskrystall } from "./felles";

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
    <div className="h-full p-[3mm] font-retro">
      <div className="h-full border-[1mm] border-black p-[4mm] flex flex-col gap-[3mm] text-[5.5mm]">
        <div className="flex items-center gap-[6mm] border-b-[1mm] border-black pb-[2mm]">
          <Logo />
          <div>
            <div className="text-[11mm] leading-none">SNØFALL FRAKT</div>
            <div>LUFTFRAKT · ADVENTSRUTEN</div>
          </div>
        </div>
        <div>FRA: Verkstedet, Snøfall · Linje 90,0 MHz</div>
        <div>TIL: Rampenissen c/o K12 · H9 · H5, Landås</div>
        <div>INNHOLD: VITAMIN C, 2,3 KG</div>
        <div className="flex items-end justify-between mt-auto">
          <div className="text-[9mm]">SENDING ___ AV 4</div>
          <Strekkode />
        </div>
      </div>
    </div>
  );
}

const STEMPLER = [
  { tekst: "TRYKKSKADET", farge: "border-red-600 text-red-600" },
  { tekst: "TRYKKSKADET", farge: "border-red-600 text-red-600" },
  {
    tekst: "KONTROLLERT – IQ",
    farge: "border-blue-700 text-blue-700",
    rund: true,
  },
  {
    tekst: "KONTROLLERT – IQ",
    farge: "border-blue-700 text-blue-700",
    rund: true,
  },
  {
    tekst: "KONTROLLERT – IQ",
    farge: "border-blue-700 text-blue-700",
    rund: true,
  },
  { tekst: "HASTER · ADVENT", farge: "border-black text-black" },
  { tekst: "HASTER · ADVENT", farge: "border-black text-black" },
  { tekst: "HASTER · ADVENT", farge: "border-black text-black" },
];

function Stempel({ i }: { i: number }) {
  const { tekst, farge, rund } = STEMPLER[i];
  return (
    <div className="h-full flex items-center justify-center font-retro">
      <div
        className={`border-[1.5mm] ${farge} ${rund ? "rounded-full w-[52mm] h-[52mm]" : "px-[4mm] py-[3mm] -rotate-6"} flex items-center justify-center text-center text-[9mm] leading-none`}
      >
        {tekst}
      </div>
    </div>
  );
}

export default function Dag01Frakt() {
  return (
    <Utskrift
      navn="dag01-frakt"
      papir="vanlig"
      farge
      deler={[
        { str: { b: 194, h: 140 }, antall: 4, forside: () => <Fraktetikett /> },
        {
          str: "A6",
          antall: 4,
          forside: () => (
            <div className="h-full p-[3mm] font-retro">
              <div className="h-full border-[3mm] border-red-600 flex flex-col items-center justify-center gap-[6mm] text-center p-[3mm]">
                <div className="text-[14mm] text-red-600">SKJØRT</div>
                <div className="text-[6mm]">VITAMIN C TIL LANDÅS</div>
                <div className="text-[6mm]">DENNE SIDE OPP</div>
                <div className="text-[20mm] leading-none">↑</div>
              </div>
            </div>
          ),
        },
        {
          str: "A7",
          antall: STEMPLER.length,
          forside: (i) => <Stempel i={i} />,
        },
      ]}
      instruks={{
        klipp: "4 fraktetiketter, 4 SKJØRT-merker og 8 stempler.",
        hvor: "Søndag 29. november: lim med limstift på klementineskene og de tomme eskene. Nummerer etikettene for hånd: SENDING 1 AV 4 osv. «TRYKKSKADET» skjevt over revnen på den revnede esken; de andre stemplene limes skjevt der det passer.",
      }}
    />
  );
}

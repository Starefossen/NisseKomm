import { Frostrune } from "@/components/ui/Frostrune";
import { skjultRune } from "@/lib/runeorden";
import { Utskrift } from "../Utskrift";

// Lamps 2, 5, 7 are powered; lamp 4 sits behind an open switch (decoy E);
// the other five are dead ends. Visible letters carry their rune; dead lamps only a new one (none on day 8).
const LAMPER: {
  vis: string | null;
  rune: string;
  ledning: "strom" | "bryter" | "dod";
  farge: string;
}[] = [
  { vis: null, rune: "K", ledning: "dod", farge: "#2563eb" },
  { vis: "R", rune: "R", ledning: "strom", farge: "#dc2626" },
  { vis: null, rune: "E", ledning: "dod", farge: "#16a34a" },
  { vis: "E", rune: "E", ledning: "bryter", farge: "#9333ea" },
  { vis: "S", rune: "S", ledning: "strom", farge: "#ea580c" },
  { vis: null, rune: "K", ledning: "dod", farge: "#0891b2" },
  { vis: "O", rune: "O", ledning: "strom", farge: "#65a30d" },
  { vis: null, rune: "R", ledning: "dod", farge: "#db2777" },
  { vis: null, rune: "T", ledning: "dod", farge: "#525252" },
];

const BATTERI = { x: 93, y: 225 };
const lampeX = (i: number) => 13 + i * 20;
const LAMPE_Y = 40;

function ledning(i: number, type: string) {
  const x = lampeX(i);
  // Control points swing to the opposite side so the wires cross into a knot.
  const c1 = 186 - x;
  const c2 = (x * 7) % 186;
  if (type === "dod") {
    const endeX = ((x * 5 + 40) % 170) + 8;
    return `M${x} ${LAMPE_Y + 10} C${c1} 110, ${c2} 70, ${endeX} 175`;
  }
  return `M${BATTERI.x} ${BATTERI.y - 12} C${c2} 120, ${c1} 160, ${x} ${LAMPE_Y + 10}`;
}

function Ark8() {
  return (
    <div className="h-full font-retro pt-[6mm]">
      <h1 className="text-4xl text-center">IQS VERKSTED · LAMPETEST</h1>
      <svg
        viewBox="0 0 186 250"
        className="w-[186mm] h-[250mm] mx-auto"
        aria-hidden
      >
        {LAMPER.map((l, i) => (
          <path
            key={i}
            d={ledning(i, l.ledning)}
            stroke={l.farge}
            strokeWidth="1.6"
            fill="none"
          />
        ))}
        {/* Open switch drawn on lamp 4's wire: two contacts and a raised lever. */}
        {(() => {
          // Midpoint (t = ½) of lamp 4's powered Bézier, so the switch sits on its wire.
          const x4 = lampeX(3);
          const x =
            (BATTERI.x + 3 * ((x4 * 7) % 186) + 3 * (186 - x4) + x4) / 8;
          const y = (BATTERI.y - 12 + 3 * 120 + 3 * 160 + LAMPE_Y + 10) / 8;
          return (
            <g>
              <rect x={x - 9} y={y - 7} width={18} height={14} fill="white" />
              <circle cx={x - 6} cy={y} r={1.6} fill="black" />
              <circle cx={x + 6} cy={y} r={1.6} fill="black" />
              <path
                d={`M${x - 6} ${y} L${x + 5} ${y - 8}`}
                stroke="black"
                strokeWidth="1.4"
              />
            </g>
          );
        })()}
        <g>
          <rect
            x={BATTERI.x - 24}
            y={BATTERI.y - 12}
            width={48}
            height={22}
            fill="white"
            stroke="black"
            strokeWidth="1.5"
          />
          <rect
            x={BATTERI.x - 4}
            y={BATTERI.y - 15}
            width={8}
            height={3}
            fill="black"
          />
          <text
            x={BATTERI.x}
            y={BATTERI.y + 4}
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
          >
            + BATTERI −
          </text>
        </g>
        {LAMPER.map((l, i) => (
          <g key={i}>
            <circle
              cx={lampeX(i)}
              cy={LAMPE_Y}
              r={8.5}
              fill="white"
              stroke="black"
              strokeWidth="1.5"
            />
            {l.vis && (
              <text
                x={lampeX(i)}
                y={LAMPE_Y + 4}
                textAnchor="middle"
                fontSize="12"
                fontFamily="monospace"
              >
                {l.vis}
              </text>
            )}
            {!l.vis && (
              <path
                d={`M${lampeX(i)} ${LAMPE_Y - 5} V${LAMPE_Y + 5} M${lampeX(i) - 4.3} ${LAMPE_Y - 2.5} L${lampeX(i) + 4.3} ${LAMPE_Y + 2.5} M${lampeX(i) - 4.3} ${LAMPE_Y + 2.5} L${lampeX(i) + 4.3} ${LAMPE_Y - 2.5}`}
                stroke="black"
                strokeWidth="1"
              />
            )}
            <text
              x={lampeX(i)}
              y={LAMPE_Y - 13}
              textAnchor="middle"
              fontSize="7"
              fontFamily="monospace"
            >
              {i + 1}
            </text>
            {(l.vis ?? skjultRune(8, l.rune)) && (
              <foreignObject
                x={lampeX(i) + 3}
                y={LAMPE_Y - 26}
                width="8"
                height="12"
                data-skjult={!l.vis || undefined}
              >
                <Frostrune letter={(l.vis ?? l.rune)!} size={7} />
              </foreignObject>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Dag08Lampekort() {
  return (
    <Utskrift
      navn="dag08-lamper"
      papir="vanlig"
      farge
      deler={[{ str: "A4", forside: () => <Ark8 /> }]}
      instruks={{
        hvor: "Kvelden før dag 8: arket øverst i Sigma-tårnet. Regelen om strøm står ikke på arket; den sier Julius.",
        merk: "Farge anbefalt, men svart-hvitt går også.",
      }}
    />
  );
}

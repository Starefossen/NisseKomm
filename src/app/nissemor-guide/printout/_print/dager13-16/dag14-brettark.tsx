import { Frostrune } from "@/components/ui/Frostrune";
import { Utskrift } from "../Utskrift";

/*
 * A4 printable area 194 × 280 mm; folds at x = 97 and y = 140. Windows sit in
 * the bottom-right quarter. Each letter is printed mirrored across the vertical
 * fold and each digit across the horizontal one, so it reads the right way
 * round through its window only when that fold is made and held against light.
 */
const B = 194;
const H = 280;
const W = 16;
const VINDUER = [
  { x: 118, y: 172, bokstav: "R", tall: "2" },
  { x: 152, y: 222, bokstav: "G", tall: "4" },
];

// Mirrored decoys in the same grey, so the real glyphs don't stand out on the flat sheet.
// None sits at a window's mirror position.
const LOKK = [
  { x: 20, y: 60, t: "K", v: "x" },
  { x: 60, y: 95, t: "S", v: "y" },
  { x: 165, y: 75, t: "7", v: "y" },
  { x: 25, y: 150, t: "B", v: "x" },
  { x: 75, y: 245, t: "N", v: "x" },
  { x: 120, y: 120, t: "3", v: "y" },
  { x: 8, y: 190, t: "E", v: "x" },
  { x: 165, y: 150, t: "P", v: "x" },
  { x: 100, y: 255, t: "5", v: "y" },
];

// Seeded, so every print has the same decoy scribbles.
function streker(n: number): string {
  let s = 1414;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => {
    const x = r() * B;
    const y = 15 + r() * (H - 30);
    return `M${x} ${y} q${r() * 16 - 8} ${r() * 16 - 8} ${r() * 20 - 10} ${r() * 16 - 8}`;
  }).join(" ");
}

const glyf =
  "absolute flex items-center justify-center text-[16mm] leading-none text-gray-500";

export default function Dag14Brettark() {
  return (
    <Utskrift
      navn="dag14-brettark"
      papir="vanlig"
      deler={[
        {
          str: "A4",
          forside: () => (
            <div className="relative h-full font-retro">
              <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                aria-hidden
              >
                <path
                  d={streker(70)}
                  stroke="#9ca3af"
                  strokeWidth="0.9"
                  fill="none"
                />
                <path
                  d={`M${B / 2} 0 V${H} M0 ${H / 2} H${B}`}
                  stroke="black"
                  strokeWidth="0.4"
                  strokeDasharray="3 2"
                />
              </svg>
              <p className="absolute top-[4mm] inset-x-0 text-center text-[8mm]">
                Brett. Hold en lykt bak.
              </p>
              <div
                className="absolute flex gap-[1mm]"
                style={{ left: "7mm", top: "30mm" }}
              >
                {/* Corner runes for the hidden word (Meta 1). */}
                {["O", "R", "I", "G", "A", "M", "I"].map((r, i) => (
                  <div
                    key={i}
                    className="relative w-[11mm] h-[14mm] border-[0.5mm] border-black bg-white"
                  >
                    <span className="absolute top-[0.5mm] right-[0.5mm]">
                      <Frostrune letter={r} size={9} />
                    </span>
                  </div>
                ))}
              </div>
              {LOKK.map((l) => (
                <span
                  key={l.t}
                  className={`${glyf} ${l.v === "x" ? "-scale-x-100" : "-scale-y-100"}`}
                  style={{
                    left: `${l.x}mm`,
                    top: `${l.y}mm`,
                    width: `${W}mm`,
                    height: `${W}mm`,
                  }}
                >
                  {l.t}
                </span>
              ))}
              {VINDUER.map((v) => (
                <div key={v.bokstav}>
                  <div
                    className="absolute border-[0.6mm] border-black"
                    style={{
                      left: `${v.x}mm`,
                      top: `${v.y}mm`,
                      width: `${W}mm`,
                      height: `${W}mm`,
                    }}
                  />
                  <span
                    className={`${glyf} -scale-x-100`}
                    style={{
                      left: `${B - v.x - W}mm`,
                      top: `${v.y}mm`,
                      width: `${W}mm`,
                      height: `${W}mm`,
                    }}
                  >
                    {v.bokstav}
                  </span>
                  <span
                    className={`${glyf} -scale-y-100`}
                    style={{
                      left: `${v.x}mm`,
                      top: `${H - v.y - W}mm`,
                      width: `${W}mm`,
                      height: `${W}mm`,
                    }}
                  >
                    {v.tall}
                  </span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
      instruks={{
        brett:
          "ikke brett arket du legger ut; det gjør barna. Test i november: brett bakover langs den loddrette streken (trykket side ut), hold mot mobillykten og se R og G i vinduene; så langs den vannrette for 2 og 4.",
        hvor: "Kvelden før dag 14: rull arket sammen og legg det i papirbåten i vasken. Serviettfuglen ved, hvis du vil.",
        merk: "Vanlig 80 g papir, ellers lyser det ikke gjennom.",
      }}
    />
  );
}

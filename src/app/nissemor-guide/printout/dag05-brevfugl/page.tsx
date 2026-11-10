import { Ark, Utskrift } from "../_print/Utskrift";

// Winter's cipher, three steps forward. No numbers, no arrows on the bird.
const CHIFFER = "X O U L N H Q";

export default function Dag05Brevfugl() {
  return (
    <Utskrift
      tittel="Dag 5 – brevfuglen"
      papir="1 ark, vanlig papir"
      merknad="Brett som et vanlig papirfly langs de stiplede linjene (midtlinja først, så de skrå). Bokstavene havner på vingene. Henges høyt i stua, med alfabetstrimmelen og trehopperen ved."
    >
      <Ark>
        <div className="relative h-[273mm]">
          <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-gray-400" />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 186 273"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M93 0 L0 70 M93 0 L186 70 M93 0 L20 273 M93 0 L166 273"
              stroke="#9ca3af"
              strokeWidth="0.5"
              strokeDasharray="3 2"
              fill="none"
            />
          </svg>
          <div className="absolute top-[8mm] inset-x-0 text-center text-2xl">
            BREVFUGL · SNØFALL
          </div>
          {["left-[2mm]", "right-[2mm]"].map((side) => (
            <div
              key={side}
              className={`absolute bottom-[25mm] ${side} w-[80mm] text-center text-[13mm] leading-none tracking-wide`}
            >
              {CHIFFER}
            </div>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

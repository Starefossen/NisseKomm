import { Utskrift } from "../Utskrift";

// Winter's cipher, three steps forward. No numbers, no arrows on the bird.
const CHIFFER = "X O U L N H Q";

function Fugl() {
  return (
    <div className="relative h-full font-retro">
      <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-gray-400" />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 194 280"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M97 0 L0 73 M97 0 L194 73 M97 0 L21 280 M97 0 L173 280"
          stroke="#9ca3af"
          strokeWidth="0.5"
          strokeDasharray="3 2"
          fill="none"
        />
      </svg>
      <div className="absolute top-[10mm] inset-x-0 text-center text-2xl">
        BREVFUGL · SNØFALL
      </div>
      {["left-[3mm]", "right-[3mm]"].map((side) => (
        <div
          key={side}
          className={`absolute bottom-[25mm] ${side} w-[82mm] text-center text-[13mm] leading-none tracking-wide`}
        >
          {CHIFFER}
        </div>
      ))}
    </div>
  );
}

export default function Dag05Brevfugl() {
  return (
    <Utskrift
      navn="dag05-brevfugl"
      papir="vanlig"
      deler={[{ str: "A4", forside: () => <Fugl /> }]}
      instruks={{
        klipp: "langs den stiplede rammen.",
        brett:
          "som et vanlig papirfly: midtlinja først, så de skrå linjene. Bokstavene havner på vingene.",
        hvor: "Kvelden før dag 5: heng fuglen høyt i stua, med alfabetstrimmelen og trehopperen ved. Rampenissens lapp ved marshmallowfortet.",
      }}
    />
  );
}

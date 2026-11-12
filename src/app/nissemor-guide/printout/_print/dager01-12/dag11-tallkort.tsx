import { Utskrift } from "../Utskrift";

// IQ's transmitters end in five; Kulde's fakes (20, 40) look exactly the same.
const TALL = [15, 40, 25, 35, 20];
const HVOR = [
  "stua, under en pute",
  "stua, under en pute",
  "brødboksen",
  "Hannas jakkelomme",
  "pappas jakkelomme",
];

function Antenne() {
  return (
    <svg
      viewBox="0 0 20 24"
      className="w-[9mm] h-[11mm]"
      fill="none"
      stroke="black"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M10 8 V23 M6 23 H14 M10 10 L5 23 M10 10 L15 23" />
      <path d="M5 4 a7 7 0 0 1 10 0 M2 1 a11 11 0 0 1 16 0" />
    </svg>
  );
}

export default function Dag11Tallkort() {
  return (
    <Utskrift
      navn="dag11-tallkort"
      papir="tykt"
      deler={[
        {
          str: "A7",
          antall: TALL.length,
          forside: (i) => (
            <div className="relative h-full flex items-center justify-center font-retro text-[34mm] leading-none">
              <span className="absolute top-[3mm] left-[3mm]">
                <Antenne />
              </span>
              {TALL[i]}
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "fem kort.",
        hvor: `Kvelden før dag 11: ${TALL.map((t, i) => `${t} i ${HVOR[i]}`).join(", ")}. Lappen fra Rampenissen på stekebrettet.`,
      }}
    />
  );
}

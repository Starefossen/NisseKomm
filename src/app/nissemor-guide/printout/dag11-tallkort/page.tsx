import { A7, Ark, Klipp, Utskrift } from "../_print/Utskrift";

// IQ's transmitters end in five; Kulde's fakes (20, 40) look exactly the same.
const TALL = [15, 40, 25, 35, 20];

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
      tittel="Dag 11 – senderkortene"
      papir="1 ark, tykt papir"
      merknad="Stua under en pute: 15 og 40. Brødboksen: 25. Hannas jakkelomme: 35. Pappas jakkelomme: 20."
    >
      <Ark>
        <div className="grid grid-cols-2 gap-[2mm]">
          {TALL.map((t) => (
            <Klipp
              key={t}
              className={`${A7} flex items-center justify-center text-[34mm] leading-none`}
            >
              <span className="absolute top-[3mm] left-[3mm]">
                <Antenne />
              </span>
              {t}
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

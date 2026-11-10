import { Ark, Klipp, Utskrift } from "../_print/Utskrift";

type Krystall = {
  armer: { vinkel: number; lengde?: number }[];
  firkant?: boolean;
};

const jevn = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ vinkel: (360 / n) * i }));

const EKTE: Krystall = { armer: jevn(6) };
// Four real, five fakes that only an honest count catches. Order is mixed and nothing is marked.
const KRYSTALLER: Krystall[] = [
  EKTE,
  { armer: jevn(5) },
  EKTE,
  { armer: jevn(6).map((a, i) => (i === 2 ? { ...a, lengde: 0.5 } : a)) },
  { armer: jevn(7) },
  EKTE,
  { armer: jevn(6), firkant: true },
  EKTE,
  { armer: [0, 28, 120, 180, 240, 300].map((vinkel) => ({ vinkel })) },
];

function Tegning({ k }: { k: Krystall }) {
  return (
    <svg viewBox="-50 -50 100 100" className="w-[54mm] h-[54mm]" aria-hidden>
      <g stroke="black" strokeWidth="4" strokeLinecap="round" fill="none">
        {k.armer.map(({ vinkel, lengde = 1 }, i) => {
          const l = 42 * lengde;
          return (
            <g key={i} transform={`rotate(${vinkel})`}>
              <path d={`M0 0 V${-l}`} />
              <path d={`M0 ${-l * 0.6} l-9 -9 M0 ${-l * 0.6} l9 -9`} />
            </g>
          );
        })}
      </g>
      {k.firkant ? (
        <rect x="-9" y="-9" width="18" height="18" fill="black" />
      ) : (
        <circle r="7" fill="black" />
      )}
    </svg>
  );
}

export default function Dag09Krystallark() {
  return (
    <Utskrift
      tittel="Dag 9 – ni krystaller"
      papir="1 ark, tykt papir"
      merknad="Klipp ut alle ni og heng dem på kjøleskapsdøra med det blå hjerte-kortet mellom. Fasit for deg: 1, 3, 6 og 8 (talt rad for rad) er ekte."
    >
      <Ark>
        <div className="grid grid-cols-3 gap-[3mm] justify-items-center mt-[6mm]">
          {KRYSTALLER.map((k, i) => (
            <Klipp
              key={i}
              className="w-[60mm] h-[85mm] flex items-center justify-center"
            >
              <Tegning k={k} />
            </Klipp>
          ))}
        </div>
      </Ark>
    </Utskrift>
  );
}

import { Utskrift } from "../Utskrift";

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
    <svg viewBox="-50 -50 100 100" className="w-[56mm] h-[56mm]" aria-hidden>
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
      navn="dag09-krystallark"
      papir="tykt"
      deler={[
        {
          str: { b: 64, h: 93 },
          antall: KRYSTALLER.length,
          forside: (i) => (
            <div className="h-full flex items-center justify-center">
              <Tegning k={KRYSTALLER[i]} />
            </div>
          ),
        },
      ]}
      instruks={{
        klipp: "ni krystaller langs de stiplede linjene.",
        hvor: "Kvelden før dag 9: heng alle ni på kjøleskapsdøra med magneter eller teip, i blandet rekkefølge, med det blå hjerte-kortet mellom dem.",
        merk: "Fasit for deg: nr. 1, 3, 6 og 8 (talt rad for rad på arket) er ekte. Falske: fem armer, én kort arm, sju armer, firkantet midte, to armer på samme side.",
      }}
    />
  );
}

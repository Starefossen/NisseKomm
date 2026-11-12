import { Utskrift } from "../Utskrift";

type Krystall = { armer: { vinkel: number }[] };

const jevn = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ vinkel: (360 / n) * i }));

const EKTE: Krystall = { armer: jevn(6) };
// Four real, five fakes. Every fake has the wrong number of arms, because the filmed Julius line
// says so ("De falske hadde feil tall"): a fake with six arms would make several codes fit.
const KRYSTALLER: Krystall[] = [
  EKTE,
  { armer: jevn(5) },
  EKTE,
  { armer: jevn(6).filter((_, i) => i !== 2) },
  { armer: jevn(7) },
  EKTE,
  { armer: jevn(8) },
  EKTE,
  { armer: [...jevn(6), { vinkel: 30 }] },
];

function Tegning({ k }: { k: Krystall }) {
  return (
    <svg viewBox="-50 -50 100 100" className="w-[56mm] h-[56mm]" aria-hidden>
      <g stroke="black" strokeWidth="4" strokeLinecap="round" fill="none">
        {k.armer.map(({ vinkel }, i) => (
          <g key={i} transform={`rotate(${vinkel})`}>
            <path d="M0 0 V-42" />
            <path d="M0 -25.2 l-9 -9 M0 -25.2 l9 -9" />
          </g>
        ))}
      </g>
      <circle r="7" fill="black" />
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
        merk: "Fasit for deg: nr. 1, 3, 6 og 8 (talt rad for rad på arket) er ekte. Falske, alle med feil antall armer: fem, fem med et hull der den sjette mangler, sju, åtte, og sju der én er klemt inn.",
      }}
    />
  );
}

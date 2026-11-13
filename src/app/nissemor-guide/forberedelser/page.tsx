"use client";

import { Vurder } from "../vurdering";
import {
  Avkrysning,
  GuideSide,
  Kort,
  medUtskrifter,
  useAvkrysning,
  useSesong,
} from "../_kveld/felles";
import { Handleliste, medVarer, useHandlet } from "../_kveld/handel";

function Forberedelser() {
  const avkrysning = useAvkrysning("forberedelser");
  const handlet = useHandlet();
  const sesong = useSesong();
  if (!sesong) return <p>Laster …</p>;
  const {
    innen25: INNEN_25_NOV,
    byggeplan: BYGGEPLAN,
    morgen1: MORGEN_1_DES,
    sjekkliste: SJEKKLISTE_DAG1,
    handleliste: {
      intro: HANDLELISTE_INTRO,
      varer: HANDLELISTE,
      sum: HANDLELISTE_SUM,
    },
    radio,
    dag1,
  } = sesong.for;
  const merk = medVarer(dag1, handlet);
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        FØR SESONGEN 24.–30. NOVEMBER
      </h1>

      <Kort tittel="Morgenrådet før 1. desember" farge="border-(--cold-blue)">
        <p>
          Birk og Lyng hinter om at noe er på vei. Rampenissen er ikke med ennå;
          han kommer ned linjen natt til 1. desember.
        </p>
        <dl className="space-y-2">
          {radio.map((r) => (
            <div key={r.dato}>
              <dt className="text-(--gold)">
                {Number(r.dato.slice(8))}. november
              </dt>
              <dd>{r.tekst}</dd>
              <Vurder id={`forsesong/${r.dato}`} />
            </div>
          ))}
        </dl>
      </Kort>

      <Kort tittel="Innen 25. november">
        <Avkrysning punkter={INNEN_25_NOV} {...avkrysning} />
      </Kort>

      <Kort tittel="Handleliste" farge="border-(--cold-blue)">
        <p className="opacity-80">{HANDLELISTE_INTRO}</p>
        <Handleliste varer={HANDLELISTE} />
        <p>
          <b>Sum:</b> {HANDLELISTE_SUM}
        </p>
      </Kort>

      {SJEKKLISTE_DAG1.map((s) => {
        // «Lør 28. nov» ↔ «Lørdag 28. (cirka 45 min …)» in the build plan.
        const plan = BYGGEPLAN.find((b) =>
          b.tittel.toLowerCase().startsWith(s.tittel.slice(0, 3).toLowerCase()),
        );
        return (
          <Kort key={s.tittel} tittel={`Dag 1-scenen: ${s.tittel}`}>
            <Avkrysning
              punkter={s.punkter}
              {...avkrysning}
              vis={medUtskrifter(merk)}
            />
            {plan && (
              <details>
                <summary className="cursor-pointer py-3 underline">
                  Steg for steg: {plan.tittel}
                </summary>
                <ol className="list-decimal pl-6 space-y-1">
                  {plan.steg.map((st) => (
                    <li key={st.tekst}>
                      {merk(st.tekst)}
                      {st.min !== "–" && ` (${st.min} min)`}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </Kort>
        );
      })}
      <p className="opacity-80">{MORGEN_1_DES}</p>
    </>
  );
}

export default function ForberedelserSide() {
  return (
    <GuideSide>
      <Forberedelser />
    </GuideSide>
  );
}

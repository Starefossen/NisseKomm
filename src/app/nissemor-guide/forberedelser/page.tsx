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

const KILDE = {
  hjemme: "text-(--neon-green)",
  lokalt: "text-(--gold)",
  nett: "text-(--christmas-red)",
} as const;

function Forberedelser() {
  const avkrysning = useAvkrysning("forberedelser");
  const handel = useAvkrysning("handleliste");
  const sesong = useSesong();
  if (!sesong) return <p>Laster …</p>;
  const {
    innen25: INNEN_25_NOV,
    byggeplan: BYGGEPLAN,
    morgen1: MORGEN_1_DES,
    sjekkliste: SJEKKLISTE_DAG1,
    handleliste: {
      intro: HANDLELISTE_INTRO,
      grupper: HANDLELISTE,
      sum: HANDLELISTE_SUM,
    },
    radio,
  } = sesong.for;
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

      {SJEKKLISTE_DAG1.map((s) => {
        // «Fre 28. nov» ↔ «Fredag 28. (cirka 50 min, …)» in the build plan.
        const plan = BYGGEPLAN.find((b) =>
          b.tittel.toLowerCase().startsWith(s.tittel.slice(0, 3).toLowerCase()),
        );
        return (
          <Kort key={s.tittel} tittel={`Dag 1-scenen: ${s.tittel}`}>
            <Avkrysning
              punkter={s.punkter}
              {...avkrysning}
              vis={medUtskrifter()}
            />
            {plan && (
              <details>
                <summary className="cursor-pointer py-3 underline">
                  Steg for steg: {plan.tittel}
                </summary>
                <ol className="list-decimal pl-6 space-y-1">
                  {plan.steg.map((st) => (
                    <li key={st.tekst}>
                      {st.tekst}
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

      <Kort tittel="Handleliste" farge="border-(--cold-blue)">
        <p className="opacity-80">{HANDLELISTE_INTRO}</p>
        {HANDLELISTE.map((g) => (
          <div key={g.navn}>
            <h3 className="text-(--gold)">{g.navn}</h3>
            <ul className="space-y-1">
              {g.varer.map((v) => (
                <li key={v.vare}>
                  <label className="flex gap-3 items-start min-h-11 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-6 h-6 shrink-0 accent-(--gold)"
                      checked={handel.krysset.includes(v.vare)}
                      onChange={() => handel.veksle(v.vare)}
                    />
                    <span
                      className={
                        handel.krysset.includes(v.vare)
                          ? "line-through opacity-60"
                          : ""
                      }
                    >
                      <span className={KILDE[v.kilde as keyof typeof KILDE]}>
                        [{v.kilde}]
                      </span>{" "}
                      {v.lenke ? (
                        <a
                          href={v.lenke}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.vare}
                        </a>
                      ) : (
                        v.vare
                      )}
                      {v.sok && " (søk)"}
                      {v.mengde && ` · ${v.mengde}`}
                      {v.pris && ` · ${v.pris}`}
                      {v.dager && ` · dag ${v.dager}`}
                      <span className="block text-base opacity-80">
                        {v.hvor}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          <b>Sum:</b> {HANDLELISTE_SUM}
        </p>
      </Kort>
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

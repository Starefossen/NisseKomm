"use client";

import {
  BYGGEPLAN,
  HANDLELISTE,
  HANDLELISTE_INTRO,
  HANDLELISTE_SUM,
  INNEN_25_NOV,
  MORGEN_1_DES,
  SJEKKLISTE_DAG1,
} from "../_kveld/data";
import { Avkrysning, GuideSide, Kort, useAvkrysning } from "../_kveld/felles";

const KILDE = {
  hjemme: "text-(--neon-green)",
  lokalt: "text-(--gold)",
  nett: "text-(--christmas-red)",
} as const;

function Forberedelser() {
  const avkrysning = useAvkrysning("forberedelser");
  const handel = useAvkrysning("handleliste");
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        FORBEREDELSER 25.–30. NOVEMBER
      </h1>

      <Kort tittel="Innen 25. november">
        <Avkrysning punkter={INNEN_25_NOV} {...avkrysning} />
      </Kort>

      {BYGGEPLAN.map((b) => (
        <Kort key={b.tittel} tittel={`Dag 1-scenen: ${b.tittel}`}>
          <Avkrysning
            punkter={b.steg.map((s) =>
              s.min === "–" ? s.tekst : `${s.tekst} (${s.min} min)`,
            )}
            {...avkrysning}
          />
        </Kort>
      ))}

      <Kort tittel="Sjekkliste dag 1" farge="border-(--gold)">
        {SJEKKLISTE_DAG1.map((s) => (
          <div key={s.tittel}>
            <h3 className="text-(--gold)">{s.tittel}</h3>
            <Avkrysning punkter={s.punkter} {...avkrysning} />
          </div>
        ))}
        <p className="opacity-80">{MORGEN_1_DES}</p>
      </Kort>

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
                      <span className={KILDE[v.kilde]}>[{v.kilde}]</span>{" "}
                      {v.vare}
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

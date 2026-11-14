"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { GuideSide } from "../_kveld/felles";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import type { SesongLinje } from "@/lib/guide-sesong";

type Dag = SesongLinje["dager"][number];
type Element = { dag: number; tittel: string; tekst: string };
type Bane = keyof SesongLinje["baner"];
type Valgt =
  | { t: "dag"; dag: Dag }
  | { t: "milepael"; m: SesongLinje["milepaeler"][number] }
  | { t: "bane"; bane: Bane; e: Element }
  | { t: "radio"; dato: string; tekst: string };

const SKJUL_KEY = "nissekomm-guide-skjul-fasit";
const FILTRE = [
  ["alt", "Alt"],
  ["rod", "Rød tråd"],
  ["side", "Sideoppdrag"],
  ["fysisk", "Fysiske ting"],
] as const;
type Filter = (typeof FILTRE)[number][0];

const BANER: {
  id: Bane;
  navn: string;
  filtre: Filter[];
  lenke: (e: Element) => string;
}[] = [
  {
    id: "ugleposten",
    navn: "Ugleposten",
    filtre: ["side"],
    lenke: (e) => `/nissemor-guide/dag/${e.dag}`,
  },
  {
    id: "sledeflukt",
    navn: "Sledeflukt",
    filtre: ["side"],
    lenke: () => "/nissemor-guide/gjennomgang",
  },
  {
    id: "symboler",
    navn: "Symboler",
    filtre: ["side", "fysisk"],
    lenke: () => "/nissemor-guide/symboler",
  },
  {
    id: "strek",
    navn: "Rampestrek",
    filtre: ["fysisk"],
    lenke: (e) =>
      `/nissemor-guide/gjennomgang?id=dag/${String(e.dag).padStart(2, "0")}/rampestrek`,
  },
];

const TYPE: Record<string, string> = {
  jakt: "Jakt",
  helg: "Helg",
  bonus: "Bonus",
};
const knapp =
  "min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

/** Frost as a bar: morning height, a gold tick where the code brings it. */
function Frost({ f }: { f: Dag["frost"] }) {
  if (f[0] === null) return <div className="h-12 text-sm opacity-60">–</div>;
  return (
    <div
      className="relative h-12 w-full border border-(--cold-blue)/60"
      title={`Frost ${f[0]} % → ${f[1]} %`}
    >
      <div
        className="absolute bottom-0 inset-x-0 bg-(--cold-blue)/50"
        style={{ height: `${f[0]}%` }}
      />
      <div
        className="absolute inset-x-0 h-0.5 bg-(--gold)"
        style={{ bottom: `${f[1]}%` }}
      />
      <span className="absolute top-0 left-1 text-sm">{f[0]}%</span>
    </div>
  );
}

function Panel({
  v,
  lukk,
  fasit,
}: {
  v: Valgt;
  lukk: () => void;
  fasit: boolean;
}) {
  let tittel = "";
  let innhold: ReactNode = null;
  const lenke = (href: string, tekst: string) => (
    <Link
      key={href}
      href={href}
      className="underline text-(--gold) inline-block min-h-11 py-2 mr-4"
    >
      {tekst}
    </Link>
  );
  if (v.t === "dag") {
    const d = v.dag;
    tittel = `${d.dag}. desember · ${d.tittel}`;
    innhold = (
      <>
        <p>
          {d.ukedag} · {TYPE[d.type]} · {d.beat}
        </p>
        {fasit && d.kode && (
          <p className="text-(--gold)">
            Kode: {d.kode}
            {d.bonusKode && ` · bonus: ${d.bonusKode}`}
          </p>
        )}
        {d.frost[0] !== null && (
          <p>
            Frost {d.frost[0]} % om morgenen, {d.frost[1]} % etter koden
            {d.frost[2] !== d.frost[1] && `, ${d.frost[2]} % med bonus`}
            {d.frostmodus > 0 && ` · frostmodus nivå ${d.frostmodus}`}.
          </p>
        )}
        <p>
          Runer: {d.antallNyeRuner} nye etter koden
          {fasit && d.nyeRuner.length > 0 && ` (${d.nyeRuner.join(" ")})`}
          {fasit && d.runelinje && ` · runelinje «${d.runelinje}»`}
        </p>
        {d.opplasinger.length > 0 && <p>Åpner: {d.opplasinger.join(" · ")}</p>}
        {d.bonus && <p>Bonusoppdrag: {d.bonus}</p>}
        {d.snilleliste && <p>Snill-listen er åpen (dag 22–24).</p>}
        <p>Rampestrek: {d.strek}</p>
        <p className="whitespace-pre-line text-lg opacity-90">{d.sammendrag}</p>
        <p>
          {lenke(`/nissemor-guide/dag/${d.dag}`, "Dagvisning")}
          {lenke(`/nissemor-guide/dag/${d.dag}#kart`, "Gåtekart")}
          {lenke(`/nissemor-guide/gjennomgang`, "Gjennomgang")}
        </p>
      </>
    );
  } else if (v.t === "milepael") {
    tittel = `${v.m.id} ${v.m.navn} · dag ${v.m.dag}`;
    innhold = (
      <>
        <p>{v.m.tekst}</p>
        <p>
          {lenke(`/nissemor-guide/dag/${v.m.dag}`, "Dagvisning")}
          {lenke("/nissemor-guide/historien", "Historien")}
        </p>
      </>
    );
  } else if (v.t === "bane") {
    const b = BANER.find((x) => x.id === v.bane)!;
    tittel = `${b.navn} · dag ${v.e.dag}`;
    innhold = (
      <>
        <p className="text-(--gold)">{v.e.tittel}</p>
        <p>{v.e.tekst}</p>
        <p>
          {lenke(b.lenke(v.e), "Åpne")}
          {lenke(`/nissemor-guide/dag/${v.e.dag}`, "Dagvisning")}
        </p>
      </>
    );
  } else {
    tittel = `Morgenrådet ${v.dato.slice(8)}. november`;
    innhold = <p>{v.tekst}</p>;
  }
  return (
    <aside
      aria-live="polite"
      className="fixed z-40 inset-x-0 bottom-0 max-h-[60vh] overflow-auto border-t-4 md:border-4 border-(--gold) bg-(--dark-crt) p-4 space-y-2 md:inset-x-auto md:right-4 md:bottom-4 md:w-[30rem]"
    >
      <div className="flex justify-between gap-2">
        <h2 className="text-2xl text-(--gold)">{tittel}</h2>
        <button type="button" onClick={lukk} className={knapp}>
          Lukk
        </button>
      </div>
      {innhold}
    </aside>
  );
}

function Kart() {
  const [fasit, setFasitState] = useState(
    () =>
      typeof window !== "undefined" && localStorage.getItem(SKJUL_KEY) === "0",
  );
  const setFasit = (v: boolean) => {
    localStorage.setItem(SKJUL_KEY, v ? "0" : "1");
    setFasitState(v);
  };
  const [data, setData] = useState<SesongLinje | null>(null);
  const [filter, setFilter] = useState<Filter>("alt");
  const [traad, setTraad] = useState<string | null>(null);
  const [valgt, setValgt] = useState<Valgt | null>(null);
  useEffect(() => {
    fetch(`/api/guide/sesongkart${fasit ? "?fasit=1" : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [fasit]);
  if (!data) return <p>Laster …</p>;
  const idag = getCurrentMonth() === 12 ? getCurrentDay() : 0;
  const vis = (f: Filter[]) => filter === "alt" || f.includes(filter);
  const baner = BANER.filter((b) => vis(b.filtre));
  const chip = (aktiv: boolean) =>
    `block w-full text-left text-sm min-h-11 px-1 border ${aktiv ? "border-(--gold) text-(--gold)" : "border-(--neon-green)/40"} hover:bg-(--neon-green)/20`;

  return (
    <>
      <p>
        {data.eventyr.navn}: {data.eventyr.beskrivelse}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        {FILTRE.map(([id, navn]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`${knapp} ${filter === id ? "bg-(--neon-green) text-black" : ""}`}
          >
            {navn}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFasit(!fasit)}
          className={`${knapp} ${fasit ? "bg-(--gold) text-black" : ""}`}
        >
          {fasit ? "Skjul fasit" : "Vis fasit"}
        </button>
      </div>
      {vis(["rod"]) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span>Tråder:</span>
          {data.traader.map((t) => (
            <button
              key={t.id}
              type="button"
              onMouseEnter={() => setTraad(t.id)}
              onMouseLeave={() => setTraad(null)}
              onFocus={() => setTraad(t.id)}
              onBlur={() => setTraad(null)}
              onClick={() => setTraad(traad === t.id ? null : t.id)}
              aria-pressed={traad === t.id}
              className={`${knapp} border-(--cold-blue) ${traad === t.id ? "bg-(--cold-blue) text-black" : ""}`}
            >
              {t.navn}
            </button>
          ))}
        </div>
      )}

      {vis(["rod"]) && (
        <section>
          <h2 className="text-2xl text-(--gold)">Før sesongen: Morgenrådet</h2>
          <div className="flex gap-2 overflow-x-auto">
            {data.forsesong.map((r) => (
              <button
                key={r.dato}
                type="button"
                onClick={() => setValgt({ t: "radio", ...r })}
                className={`${knapp} shrink-0`}
              >
                {r.dato.slice(8)}. nov
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="md:w-[calc(100vw-4rem)] md:relative md:left-1/2 md:-translate-x-1/2">
        <ol className="grid grid-cols-1 gap-2 md:grid-flow-col md:auto-cols-[minmax(6.5rem,1fr)] md:overflow-x-auto md:pb-2">
          {data.dager.map((d) => {
            const m = data.milepaeler.find((x) => x.dag === d.dag);
            const lys = traad ? d.traader.includes(traad) : true;
            return (
              <li
                key={d.dag}
                className={`border-2 p-1 space-y-1 transition-opacity ${d.dag === idag ? "border-(--gold) shadow-[0_0_12px_var(--gold)]" : "border-(--neon-green)/50"} ${lys ? "" : "opacity-30"} ${traad && lys ? "bg-(--cold-blue)/15" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setValgt({ t: "dag", dag: d })}
                  className={chip(d.dag === idag)}
                >
                  <span className="text-2xl text-(--gold)">{d.dag}</span>{" "}
                  <span>{d.ukedag.slice(0, 2)}</span>
                  {d.dag === idag && <span className="ml-1">· I DAG</span>}
                  <span className="block md:h-10 overflow-hidden">
                    {d.tittel}
                  </span>
                  {fasit && d.kode && (
                    <span className="block text-(--gold)">{d.kode}</span>
                  )}
                  <span className="block">
                    {TYPE[d.type]}
                    {d.snilleliste ? " · Snill-liste" : ""}
                  </span>
                </button>
                {vis(["rod"]) && (
                  <>
                    <div className="md:h-11">
                      {m && (
                        <button
                          type="button"
                          onClick={() => setValgt({ t: "milepael", m })}
                          className="w-full min-h-11 text-sm bg-(--gold) text-black px-1"
                        >
                          ◆ {m.id} {m.navn}
                        </button>
                      )}
                    </div>
                    <Frost f={d.frost} />
                    <div className="text-sm">ᚱ +{d.antallNyeRuner}</div>
                  </>
                )}
                {vis(["side", "fysisk"]) && d.bonus && (
                  <button
                    type="button"
                    onClick={() => setValgt({ t: "dag", dag: d })}
                    className={chip(true)}
                  >
                    ★ Bonus
                  </button>
                )}
                {vis(["side"]) && d.opplasinger.length > 0 && (
                  <div className="text-sm text-(--cold-blue)">
                    +{d.opplasinger.length} åpner
                  </div>
                )}
                {baner.map((b) => {
                  const ting = data.baner[b.id].filter((e) => e.dag === d.dag);
                  return (
                    <div key={b.id} className="md:min-h-11">
                      {ting.map((e) => (
                        <button
                          key={e.tittel}
                          type="button"
                          onClick={() => setValgt({ t: "bane", bane: b.id, e })}
                          className={chip(false)}
                          title={b.navn}
                        >
                          <span className="opacity-70 md:hidden">
                            {b.navn}:{" "}
                          </span>
                          {e.tittel}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-lg">
        Søylen er frosten om morgenen, den gule streken der koden tar den. ᚱ er
        nye runer. Banene på brede skjermer er i rekkefølgen{" "}
        {baner.map((b) => b.navn).join(", ")}.
      </p>
      {valgt && <Panel v={valgt} lukk={() => setValgt(null)} fasit={fasit} />}
    </>
  );
}

export default function SesongSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        SESONGKART
      </h1>
      <Kart />
    </GuideSide>
  );
}

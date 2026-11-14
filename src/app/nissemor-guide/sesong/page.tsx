"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Icon, symbolFarge, type IconColor } from "@/lib/icons";
import { GuideSide } from "../_kveld/felles";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import type { SesongLinje } from "@/lib/guide-sesong";

type Dag = SesongLinje["dager"][number];
type Element = {
  dag: number;
  tittel: string;
  tekst: string;
  ikon?: string;
  farge?: string;
};
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
    id: "krypto",
    navn: "NisseKrypto",
    filtre: ["side"],
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
        {d.opplasinger.length > 0 && (
          <p>Åpner: {d.opplasinger.map((o) => o.tekst).join(" · ")}</p>
        )}
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

const VINDU_IKON: Record<string, [ikon: string, navn: string]> = {
  nissekrypto: ["key", "NisseKrypto"],
  symbolskanner: ["scan-barcode", "Symbolskanner"],
  nissespill: ["book-open", "Ugleposten"],
  sledeflukt: ["gamepad", "Sledeflukt"],
  nissemusikk: ["music", "Nissemusikk"],
  brevfugler: ["mail", "Brevfugler"],
  nissestats: ["chart", "Nissestats"],
  nordpol_tv: ["tv", "Snøfall TV"],
};

const KOL = "7.5rem";
const pst = (d: number) => `${((d - 0.5) / 24) * 100}%`;

/** Frost through December as one line, milestones and today on the same axis. */
function FrostKurve({
  data,
  idag,
  velg,
  hoy,
}: {
  data: SesongLinje;
  idag: number;
  velg: (v: Valgt) => void;
  hoy: string;
}) {
  const punkter = (i: 0 | 1) =>
    data.dager
      .filter((d) => d.frost[i] !== null)
      .map((d) => `${d.dag - 0.5},${100 - (d.frost[i] as number)}`)
      .join(" ");
  return (
    <div className={`relative ${hoy}`}>
      <svg
        viewBox="0 0 24 100"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-6 bottom-5 w-full h-[calc(100%-2.75rem)]"
        aria-hidden
      >
        <polyline
          points={punkter(0)}
          fill="none"
          stroke="var(--cold-blue)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={punkter(1)}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={1}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {idag > 0 && (
        <div
          className="absolute inset-y-0 w-0.5 bg-(--gold)/60"
          style={{ left: pst(idag) }}
          aria-hidden
        />
      )}
      {data.milepaeler.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => velg({ t: "milepael", m })}
          title={`Milepæl ${m.id.slice(1)}: ${m.navn}`}
          className="absolute top-0 -translate-x-1/2 min-h-6 px-1 text-sm bg-(--gold) text-black hover:brightness-125"
          style={{ left: pst(m.dag) }}
        >
          ◆{m.id}
        </button>
      ))}
      {data.dager.map(
        (d) =>
          d.frost[0] !== null && (
            <span
              key={d.dag}
              className="absolute bottom-0 -translate-x-1/2 text-sm opacity-70"
              style={{ left: pst(d.dag) }}
              title={`Dag ${d.dag}: frost ${d.frost[0]} % → ${d.frost[1]} % etter koden`}
            >
              {d.frost[0]}
            </span>
          ),
      )}
    </div>
  );
}

function Symbol({ e }: { e: Element }) {
  return e.ikon ? (
    <Icon
      name={e.ikon}
      size={16}
      color={symbolFarge(e.farge as IconColor)}
      className="mr-1 align-middle"
    />
  ) : null;
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
  const [laast, setLaast] = useState<string | null>(null);
  const [forhånd, setForhånd] = useState<string | null>(null);
  const [valgt, setValgt] = useState<Valgt | null>(null);
  useEffect(() => {
    fetch(`/api/guide/sesongkart${fasit ? "?fasit=1" : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [fasit]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setLaast(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  if (!data) return <p>Laster …</p>;
  // A locked thread wins; hover only previews (touch has no hover, so click locks)
  const traad = laast ?? forhånd;
  const idag = getCurrentMonth() === 12 ? getCurrentDay() : 0;
  const vis = (f: Filter[]) => filter === "alt" || f.includes(filter);
  const lys = (d: Dag) => !traad || d.traader.includes(traad);
  const banerFor = (d: number) =>
    BANER.filter((b) => vis(b.filtre)).map((b) => ({
      b,
      ting: data.baner[b.id].filter((e) => e.dag === d),
    }));
  const chip = (aktiv = false) =>
    `block w-full text-left text-sm min-h-11 px-1 leading-tight border ${aktiv ? "border-(--gold) text-(--gold)" : "border-(--neon-green)/40"} hover:bg-(--neon-green)/20`;
  const gåTilIDag = () =>
    document.getElementById(`sk-dag-${idag}`)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

  const Hode = ({ d }: { d: Dag }) => {
    const m = data.milepaeler.find((x) => x.dag === d.dag);
    return (
      <div className="h-36 flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setValgt({ t: "dag", dag: d })}
            className="text-2xl text-(--gold) underline-offset-4 hover:underline min-h-11 min-w-11 text-left"
          >
            {d.dag}
          </button>
          <span className="text-sm">{d.ukedag.slice(0, 2)}</span>
          <span className="text-xs px-1 border border-(--neon-green)/50">
            {TYPE[d.type]}
          </span>
          {m && (
            <button
              type="button"
              onClick={() => setValgt({ t: "milepael", m })}
              title={`Milepæl ${m.id.slice(1)}: ${m.navn}`}
              className="text-xs px-1 bg-(--gold) text-black"
            >
              ◆{m.id}
            </button>
          )}
          {d.dag === idag && (
            <span className="text-xs text-(--gold)">I DAG</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setValgt({ t: "dag", dag: d })}
          title={d.tittel}
          className="text-left text-base leading-tight line-clamp-2 hover:text-(--gold)"
        >
          {d.tittel}
        </button>
        {fasit && d.kode && (
          <span
            className="mt-auto self-start text-xs px-1 border border-(--gold) text-(--gold)"
            title="Kode (fasit)"
          >
            ⚿ {d.kode}
          </span>
        )}
      </div>
    );
  };

  const Runer = ({ d }: { d: Dag }) =>
    d.antallNyeRuner > 0 ? (
      <span
        className="text-sm"
        title={`${d.antallNyeRuner} nye runer etter koden`}
      >
        ᚱ {fasit ? d.nyeRuner.join(" ") : `+${d.antallNyeRuner}`}
      </span>
    ) : null;

  const Aapner = ({ d }: { d: Dag }) =>
    d.opplasinger.length > 0 ? (
      <span
        className="inline-flex gap-1 items-center"
        title={`Åpner: ${d.opplasinger.map((o) => o.tekst).join(" · ")}`}
      >
        {d.opplasinger.map((o, i) => {
          const [ikon, navn] = VINDU_IKON[o.vindu] ?? ["lock", o.vindu];
          return (
            <Icon key={i} name={ikon} size={20} color="blue" title={navn} />
          );
        })}
      </span>
    ) : null;

  const Bonus = ({ d }: { d: Dag }) =>
    d.bonus ? (
      <button
        type="button"
        onClick={() => setValgt({ t: "dag", dag: d })}
        className={chip(true)}
        title={d.bonus}
      >
        ★ Bonus
      </button>
    ) : null;

  const BaneTing = ({
    b,
    e,
    navn,
  }: {
    b: (typeof BANER)[number];
    e: Element;
    navn?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => setValgt({ t: "bane", bane: b.id, e })}
      className={chip()}
      title={`${b.navn}: ${e.tittel.replace(/^K(\d+)/, "Kapittel $1:")}`}
    >
      {navn && <span className="opacity-60">{b.navn}: </span>}
      <Symbol e={e} />
      <span className="line-clamp-2 inline">{e.tittel}</span>
    </button>
  );

  // Desktop swim lanes: every row has the same cells, so lanes line up across days
  const rader: { navn: string; hoy: string; celle: (d: Dag) => ReactNode }[] = [
    ...(vis(["rod"])
      ? [{ navn: "Runer", hoy: "h-8", celle: (d: Dag) => <Runer d={d} /> }]
      : []),
    ...(vis(["side"])
      ? [{ navn: "Åpner", hoy: "h-8", celle: (d: Dag) => <Aapner d={d} /> }]
      : []),
    ...(vis(["side", "fysisk"])
      ? [{ navn: "Bonus", hoy: "h-12", celle: (d: Dag) => <Bonus d={d} /> }]
      : []),
    ...BANER.filter((b) => vis(b.filtre)).map((b) => ({
      navn: b.navn,
      hoy: "h-14",
      celle: (d: Dag) =>
        data.baner[b.id]
          .filter((e) => e.dag === d.dag)
          .map((e) => <BaneTing key={e.tittel} b={b} e={e} />),
    })),
  ];
  const etikett =
    "sticky left-0 z-10 bg-(--dark-crt) pr-2 text-sm text-(--cold-blue) border-r border-(--neon-green)/30 flex items-center";
  const celle = (d: Dag) =>
    `px-1 border-r border-(--neon-green)/15 transition-opacity ${d.dag === idag ? "bg-(--gold)/10" : ""} ${lys(d) ? "" : "opacity-25"} ${traad && lys(d) ? "bg-(--cold-blue)/15" : ""}`;
  const antallRader = 2 + (vis(["rod"]) ? 1 : 0) + rader.length;

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
        {idag > 0 && (
          <button
            type="button"
            onClick={gåTilIDag}
            className={`${knapp} hidden md:block`}
          >
            Gå til i dag
          </button>
        )}
      </div>
      <details className="border border-(--neon-green)/40 px-2">
        <summary className="min-h-11 py-2 cursor-pointer">Forklaring</summary>
        <ul className="text-lg pb-2 list-none space-y-1">
          <li>◆M1–M6: milepæl i historien (klikk for tekst)</li>
          <li>K1–K4: kapittel i Ugleposten</li>
          <li>ᚱ: nye runer etter koden (bokstavene med fasit)</li>
          <li>
            Frost: prosent om morgenen (blå linje, tallene under) og etter koden
            (gul stiplet)
          </li>
          <li>
            Ikonene i «Åpner»: moduler og kapitler som åpner den dagen (hold
            over for liste)
          </li>
          <li>★ Bonus: bonusoppdrag · ⚿: dagens kode (bare med fasit)</li>
          <li>Jakt / Helg / Bonus: dagtype · I DAG: dagens kolonne</li>
        </ul>
      </details>
      {vis(["rod"]) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span>Tråder:</span>
          {data.traader.map((t) => (
            <button
              key={t.id}
              type="button"
              data-traad={t.id}
              onMouseEnter={() => setForhånd(t.id)}
              onMouseLeave={() => setForhånd(null)}
              onClick={() => {
                setForhånd(null);
                setLaast(laast === t.id ? null : t.id);
              }}
              aria-pressed={laast === t.id}
              className={`${knapp} border-(--cold-blue) ${laast === t.id ? "bg-(--cold-blue) text-black" : forhånd === t.id ? "bg-(--cold-blue)/30" : ""}`}
            >
              {laast === t.id && "● "}
              {t.navn}
            </button>
          ))}
          {laast && (
            <span className="text-sm opacity-70">
              Esc eller klikk igjen for å slippe
            </span>
          )}
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

      {/* Wide screens: full-bleed grid, lane labels stick on the left */}
      <div className="hidden md:block w-[calc(100vw-4rem)] relative left-1/2 -translate-x-1/2 overflow-x-auto pb-2 border-y border-(--neon-green)/30">
        <div
          className="grid"
          style={{ gridTemplateColumns: `7rem repeat(24, ${KOL}) 10rem` }}
        >
          <div className={`${etikett} items-end pb-1`}>Dag</div>
          {data.dager.map((d) => (
            <div
              key={d.dag}
              id={`sk-dag-${d.dag}`}
              className={`${celle(d)} border-b border-(--neon-green)/30 py-1`}
            >
              <Hode d={d} />
            </div>
          ))}
          <div
            className="px-2 py-1 text-sm opacity-70 border-l-2 border-dashed border-(--neon-green)/40"
            style={{ gridColumn: 26, gridRow: `1 / span ${antallRader}` }}
          >
            <p className="text-(--gold) text-base">Romjul</p>
            <p>Alt er åpent som dag 24, ut januar.</p>
          </div>
          {vis(["rod"]) && (
            <>
              <div
                className={etikett}
                title="Frost om morgenen (blå) og etter koden (gul stiplet), med milepælene"
              >
                Frost
              </div>
              <div
                style={{ gridColumn: "2 / span 24" }}
                className="border-b border-(--neon-green)/15"
              >
                <FrostKurve
                  data={data}
                  idag={idag}
                  velg={setValgt}
                  hoy="h-28"
                />
              </div>
            </>
          )}
          {rader.map((r) => (
            <Fragment key={r.navn}>
              <div className={`${etikett} ${r.hoy}`}>{r.navn}</div>
              {data.dager.map((d) => (
                <div
                  key={d.dag}
                  className={`${celle(d)} ${r.hoy} flex items-center overflow-hidden border-b border-(--neon-green)/10`}
                >
                  {r.celle(d)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Narrow screens: one day per row, lanes as chips */}
      <div className="md:hidden space-y-2">
        {vis(["rod"]) && (
          <FrostKurve data={data} idag={idag} velg={setValgt} hoy="h-28" />
        )}
        <ol className="space-y-2">
          {data.dager.map((d) => (
            <li
              key={d.dag}
              className={`border-2 p-2 space-y-1 transition-opacity ${d.dag === idag ? "border-(--gold)" : "border-(--neon-green)/50"} ${lys(d) ? "" : "opacity-25"} ${traad && lys(d) ? "bg-(--cold-blue)/15" : ""}`}
            >
              <Hode d={d} />
              <div className="flex flex-wrap gap-3 items-center text-sm">
                {vis(["rod"]) && d.frost[0] !== null && (
                  <span>
                    Frost {d.frost[0]} → {d.frost[1]} %
                  </span>
                )}
                {vis(["rod"]) && <Runer d={d} />}
                {vis(["side"]) && <Aapner d={d} />}
              </div>
              {vis(["side", "fysisk"]) && <Bonus d={d} />}
              {banerFor(d.dag).flatMap(({ b, ting }) =>
                ting.map((e) => (
                  <BaneTing key={b.id + e.tittel} b={b} e={e} navn />
                )),
              )}
            </li>
          ))}
          <li className="border-2 border-dashed border-(--neon-green)/40 p-2 text-sm opacity-70">
            Romjul: alt er åpent som dag 24, ut januar.
          </li>
        </ol>
      </div>

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

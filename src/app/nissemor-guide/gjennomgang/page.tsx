"use client";

import { versionKey } from "../media/oversikt";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GuideSide, Kort, type Sesong } from "../_kveld/felles";
import { TaIBruk, kilde } from "../media/kort";
import { DagManus } from "./visning";
import { Rutenett } from "./rutenett";
import {
  CELLE,
  StatusBrikke,
  useCelle,
  useData,
  useKo,
  type CelleData,
} from "./celle";
import { brukbar, FORKLARING, MERKE } from "@/lib/media-status";
import { GJENSTAAR } from "../media/filter";
import { SkjulVurder, Vurder, taggTast, vurderTast } from "../vurdering";
import {
  KOLONNER,
  RUTENETT,
  alleElementer,
  dagElement,
  egenVurdering,
  ekstraRader,
  nesteUvurdert,
  naboI,
  tilstand,
  type Element,
  type Tilstand,
} from "./elementer";
import { Innhold } from "./visning";
import { SegmentStatus } from "./segmentstripe";
import type { VideoStatus } from "@/lib/segmenter";
import { taggTelling } from "@/lib/vurdering-tagger";
import {
  FREMDRIFT,
  type Fremdrift,
  omtak,
  type KoServer,
  type Linje,
} from "./ko";
import { Fremdriftslinjer } from "./fremdrift";
import { Forslag, Regler } from "./laerdom";

const SIDE = "/nissemor-guide/gjennomgang";
const REKKEFOLGE = "nissekomm-guide-gjennomgang-rekkefolge";
const href = (id: string, ekstra = "") =>
  `${SIDE}?id=${encodeURIComponent(id)}${ekstra}`;
const UTVALG_NOKKEL = "nissekomm-guide-gjennomgang-utvalg";

// Quick choices, the same as the media page's «Hva gjenstår» and type chips.
const UTVALG = [
  ["gjenstaar", "Hva gjenstår"],
  ["julius", "Bare Julius"],
  ["radio", "Bare Radio"],
  ["rampestrek", "Bare Rampestrek"],
  ["alle", "Alt"],
] as const;
type Utvalg = (typeof UTVALG)[number][0];

const passerUtvalg = (u: Utvalg, e: Element, celle: Tilstand) =>
  u === "alle" ||
  (u === "gjenstaar" ? GJENSTAAR.includes(celle) : e.gruppe === u);

/** From `?f=`, else the last one used, else everything. */
function useUtvalg(): [Utvalg, (u: Utvalg) => void] {
  const fraUrl = useSearchParams().get("f");
  const [u, setU] = useState<Utvalg>(() => {
    const v = fraUrl ?? localStorage.getItem(UTVALG_NOKKEL);
    return UTVALG.some(([k]) => k === v) ? (v as Utvalg) : "alle";
  });
  const sett = (ny: Utvalg) => {
    localStorage.setItem(UTVALG_NOKKEL, ny);
    const url = new URL(location.href);
    url.searchParams.set("f", ny);
    history.replaceState(history.state, "", url);
    setU(ny);
  };
  return [u, sett];
}

// N/P label when a type filter is chosen: «Neste rampestrek (N)».
const NAVN = Object.fromEntries(
  UTVALG.map(([k, n]) => [k, n.replace("Bare ", "")]),
);

function UtvalgValg({ u, sett }: { u: Utvalg; sett: (u: Utvalg) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {UTVALG.map(([k, navn]) => (
        <button
          key={k}
          type="button"
          aria-pressed={u === k}
          onClick={() => sett(k)}
          className={`${knapp} text-lg ${u === k ? "bg-(--gold) text-black border-(--gold)" : ""}`}
        >
          {navn}
        </button>
      ))}
    </div>
  );
}

const knapp =
  "inline-flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

const FANER = [
  ["venter", "Venter på deg"],
  ["agent", "Hos agent"],
  ["laerdom", "Lærdom"],
] as const;
type Fane = (typeof FANER)[number][0];

const kr = (n: number) =>
  n.toLocaleString("nb-NO", { maximumFractionDigits: 1 });

/** The queue: what waits for Hans, what waits for an agent, and the lessons. */
function Ko({ d, sesong }: { d: ReturnType<typeof useData>; sesong: Sesong }) {
  const router = useRouter();
  const { liste, ko, fd } = useKo(d, sesong);
  const fraUrl = useSearchParams().get("k");
  const fane: Fane = FANER.some(([f]) => f === fraUrl)
    ? (fraUrl as Fane)
    : "venter";
  const [valgt, setValgt] = useState(0);
  const sp = useSearchParams();
  const st = FREMDRIFT.find(([k]) => k === sp.get("s"));
  const g = sp.get("g");

  const linjer: Linje[] = !ko
    ? []
    : st
      ? fd!.poster
          .filter((p) => p.status === st[0] && (!g || p.type === g))
          .map((p) => ({ ...p, hva: `${st[1]} · ${p.type}` }))
      : ko[fane];
  const lenke = (l: Linje) =>
    liste.some((e) => e.id === l.id)
      ? href(l.id, (l.seg ? `&s=${l.seg}` : "") + (st ? "" : `&k=${fane}`))
      : "/nissemor-guide/media";

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)
      )
        return;
      const tast = ev.key.toLowerCase();
      if (tast === "j") setValgt((i) => Math.min(i + 1, linjer.length - 1));
      else if (tast === "k") setValgt((i) => Math.max(i - 1, 0));
      else if (ev.key === "Enter" && linjer[valgt])
        router.push(lenke(linjer[valgt]));
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  });
  useEffect(() => {
    document
      .querySelector(`[data-ko="${valgt}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [valgt]);

  if (!ko) return <p>Laster køen …</p>;
  const f = d.server!.forbruk;
  const grupper =
    fane === "laerdom" ? [...new Set(linjer.map((l) => l.type))] : [null];
  return (
    <>
      <p className="text-lg" data-testid="budsjett">
        Forbruk siden {Number(f.fra.slice(8))}.{Number(f.fra.slice(5, 7))}.:{" "}
        <span className="text-(--gold)">{kr(f.brukt)} kr</span> brukt,{" "}
        <span className={f.igjen < 200 ? "text-(--christmas-red)" : ""}>
          {kr(f.igjen)} kr
        </span>{" "}
        igjen av {kr(f.budsjett)} kr
      </p>
      {fd && <Fremdriftslinjer total={fd.total} typer={fd.typer} side={SIDE} />}
      {st && (
        <p className="text-lg">
          Viser {st[1].toLowerCase()}
          {g ? ` · ${g}` : ""} ({linjer.length}).{" "}
          <Link href={SIDE} className="underline text-(--gold)">
            Tilbake til køen
          </Link>
        </p>
      )}
      <nav className="flex flex-wrap gap-2" role="tablist">
        {FANER.map(([k, navn]) => (
          <Link
            key={k}
            role="tab"
            aria-selected={!st && fane === k}
            href={`${SIDE}?k=${k}`}
            onClick={() => setValgt(0)}
            className={`${knapp} text-lg ${!st && fane === k ? "bg-(--gold) text-black border-(--gold)" : ""}`}
          >
            {navn} ({ko[k].length})
          </Link>
        ))}
      </nav>
      {fane === "venter" && ko.segmenter > 0 && (
        <p className="text-base">
          Herav {ko.segmenter} manussegmenter på dager uten video.
        </p>
      )}
      {fane === "laerdom" && d.server!.laerdom && (
        <Regler d={d.server!.laerdom} ny={d.settLaerdom} />
      )}
      {fane === "laerdom" && (
        <div data-testid="tagg-telling">
          {taggTelling(d.vurd ?? {}).map(([t, n]) => (
            <p key={t}>
              <span className="text-(--gold)">Merker {t}:</span>{" "}
              {n.map(([x, k]) => `${x} ${k}`).join(" · ")}
            </p>
          ))}
        </div>
      )}
      {linjer.length === 0 && <p>Ingenting her.</p>}
      {grupper.map((g) => (
        <div key={g ?? "alle"}>
          {g && <h2 className="text-2xl text-(--gold) mt-3">{g}</h2>}
          <ul>
            {linjer.map((l, i) =>
              g && l.type !== g ? null : (
                <li
                  key={`${l.id}-${l.tittel}-${l.hva}`}
                  data-ko={i}
                  aria-current={i === valgt}
                  className={`border-b border-(--neon-green)/30 p-2 ${i === valgt ? "bg-(--neon-green)/15 border-l-4 border-l-(--gold)" : ""}`}
                >
                  <Link
                    href={lenke(l)}
                    className="underline text-(--gold) inline-block min-h-11 py-2 break-all"
                  >
                    {l.tittel}
                  </Link>{" "}
                  <span className={l.feil ? "text-(--christmas-red)" : ""}>
                    {l.hva}
                  </span>
                  {l.notat && <p className="text-base">«{l.notat}»</p>}
                  {fane === "laerdom" && <Forslag l={l} ny={d.settLaerdom} />}
                  {l.kommando && (
                    <p className="text-base">
                      <code className="break-all text-(--cold-blue)">
                        {l.kommando}
                      </code>
                      {l.pris ? ` · ca. ${kr(l.pris)} kr` : " · gratis"}
                    </p>
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
      <p className="text-base text-(--neon-green)/80">
        Tastatur: J neste · K forrige · Enter åpner
      </p>
    </>
  );
}

function Celle({
  c,
  f,
  dempet,
}: {
  c: CelleData | null;
  f: string;
  dempet?: boolean;
}) {
  // «–» only where the column doesn't apply to the day.
  if (!c)
    return (
      <td
        className="p-1 text-center opacity-40"
        title="Ikke aktuelt denne dagen"
      >
        –
      </td>
    );
  return (
    <td className="p-0.5 text-center">
      <StatusBrikke c={c} href={href(c.e.id, `&f=${f}`)} dempet={dempet} />
    </td>
  );
}

function Matrise({
  d,
  sesong,
}: {
  d: ReturnType<typeof useData>;
  sesong: Sesong;
}) {
  const vurd = d.vurd ?? {};
  const k = { ...kilde(d.media), vurderinger: vurd };
  const tt = (e: Element | null) => e && tilstand(e, k);
  const t = (e: Element | null) => tt(e)?.celle;
  const [u, settU] = useUtvalg();
  const vis = (e: Element | null): e is Element =>
    !!e && passerUtvalg(u, e, t(e)!);
  const celleData = useCelle(d, sesong);
  const data = (e: Element) => celleData(e);
  // Outside «Hva gjenstår» a finished cell is dimmed, not blanked; other filters keep their columns.
  const celle = (e: Element | null) => (
    <Celle
      key={e?.id}
      f={u}
      dempet={!!e && !vis(e)}
      c={e && (vis(e) || u === "gjenstaar") ? data(e) : null}
    />
  );
  const telling = (rad: (Element | null)[]) => {
    const n: Partial<Record<Fremdrift, number>> = {};
    for (const e of rad)
      if (e) {
        const s = data(e).status;
        n[s] = (n[s] ?? 0) + 1;
      }
    const ord: [Fremdrift, string][] = [
      ["godkjent", "✓"],
      ["ok", "◐"],
      ["venter", "se på"],
      ["agent", "fikses"],
      ["mangler", "mangler"],
      ["valgfri", "valgfri"],
    ];
    return ord
      .filter(([s]) => n[s])
      .map(([s, w]) => `${n[s]} ${w}`)
      .join(" · ");
  };
  const kolonner = KOLONNER.filter(
    ([k]) => u === "alle" || u === "gjenstaar" || u === k,
  );
  const alle = alleElementer("dag", sesong, d.media.files, d.krypto);
  const utvalgt = alle.filter(vis);
  const ok = alle.filter((e) => brukbar(t(e))).length;
  const ekstra = ekstraRader(sesong, d.media.files, d.krypto).filter(
    (e) => KOLONNER.every(([k]) => k !== u) && vis(e),
  );
  const grupper = [...new Set(ekstra.map((e) => e.gruppe))];
  const dager = Array.from({ length: 24 }, (_, i) => i + 1).filter((n) =>
    kolonner.some(([k]) => vis(dagElement(k, n, sesong, d.media.files))),
  );
  const forste = nesteUvurdert(utvalgt, "", vurd);

  return (
    <>
      <UtvalgValg u={u} sett={settU} />
      <Kort tittel={`${ok} av ${alle.length} godkjent`} farge="border-(--gold)">
        <div className="h-4 border-2 border-(--neon-green)">
          <div
            className="h-full bg-(--gold) transition-all"
            style={{ width: `${(100 * ok) / alle.length}%` }}
          />
        </div>
        <p className="text-base">
          {(Object.keys(MERKE) as Tilstand[])
            .map((c) => `${MERKE[c][0]} ${MERKE[c][2]}`)
            .join(" · ")}{" "}
          (notatet vises når du holder over). {FORKLARING}
        </p>
        {forste && (
          <Link href={href(forste.id, `&f=${u}`)} className={knapp}>
            Start: neste uvurdert ({forste.tittel})
          </Link>
        )}
      </Kort>
      <p className="flex flex-wrap gap-2 text-base" data-testid="forklaring">
        {FREMDRIFT.map(([s]) => (
          <span key={s} className={`px-2 ${CELLE[s][1]}`}>
            {CELLE[s][0]}
          </span>
        ))}
        <span className="px-2 border border-(--neon-green)/40">
          – ikke aktuelt denne dagen
        </span>
        <span className="px-2 border border-(--neon-green)/40 opacity-40">
          dempet: ferdig, skjult av «Hva gjenstår»
        </span>
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-lg w-full">
          <thead>
            <tr className="text-(--gold)">
              <th className="p-1 text-left">Dag</th>
              {kolonner.map(([k, navn]) => {
                const rad = Array.from({ length: 24 }, (_, i) =>
                  dagElement(k, i + 1, sesong, d.media.files),
                );
                return (
                  <th key={k} className="p-1">
                    {navn}
                    <span className="block text-sm text-(--neon-green)/80">
                      {telling(rad)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dager.map((n) => (
              <tr key={n} className="border-t border-(--neon-green)/30">
                <th className="p-1 text-left">
                  <Link href={`/nissemor-guide/dag/${n}`} className="underline">
                    {n}
                  </Link>
                </th>
                {kolonner.map(([k]) =>
                  celle(dagElement(k, n, sesong, d.media.files)),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {grupper.map((g) => {
        const rad = ekstra.filter((e) => e.gruppe === g);
        return (
          <Kort
            key={g}
            tittel={`${g} (${rad.filter((e) => brukbar(t(e))).length}/${rad.length})`}
          >
            {RUTENETT.has(g) ? (
              <Rutenett
                rad={rad}
                data={data}
                lenke={(e) => href(e.id, `&f=${u}&gr=${encodeURIComponent(g)}`)}
                uvurdert={(e) => !vurd[e.id]?.vurdering}
              />
            ) : (
              <table className="w-full">
                <tbody>
                  {rad.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-(--neon-green)/30"
                    >
                      <td className="p-1">
                        <Link
                          href={href(e.id, `&f=${u}`)}
                          className="underline break-all"
                        >
                          {e.tittel}
                        </Link>
                      </td>
                      {celle(e)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Kort>
        );
      })}
    </>
  );
}

function Vurdering({
  id,
  d,
  sesong,
}: {
  id: string;
  d: ReturnType<typeof useData>;
  sesong: Sesong;
}) {
  const router = useRouter();
  const [rekkefolge, setRekkefolge] = useState<"dag" | "kolonne">(() =>
    localStorage.getItem(REKKEFOLGE) === "kolonne" ? "kolonne" : "dag",
  );
  // Gjennomgang only mounts this once the verdicts have loaded.
  const vurd = d.vurd!;
  const [u, settUtvalg] = useUtvalg();
  const sp = useSearchParams();
  const fane = sp.get("k");
  // A filter counts once it is in the URL (from the overview) or has been clicked here;
  // arriving from the queue has none, so N stays «Neste i køen».
  const [valgtHer, setValgtHer] = useState(() => sp.has("f"));
  const settU = (ny: Utvalg) => {
    setValgtHer(true);
    settUtvalg(ny);
  };
  const gruppe = sp.get("gr");
  const typeFilter = !!gruppe || (valgtHer && u !== "gjenstaar");
  const lenke = useCallback(
    (x: string) =>
      href(
        x,
        (typeFilter ? `&f=${u}` : "") +
          (gruppe ? `&gr=${encodeURIComponent(gruppe)}` : "") +
          (fane ? `&k=${fane}` : ""),
      ),
    [typeFilter, u, fane, gruppe],
  );
  // A segmented Julius video: its status comes from the segments (SegmentStripe).
  const [segStatus, setSegStatus] = useState<VideoStatus | null>(null);
  const k = { ...kilde(d.media), vurderinger: vurd };
  const liste = alleElementer(rekkefolge, sesong, d.media.files, d.krypto);
  // An old link to dag-02.mp4 lands on the newest version of the group.
  const eksakt = liste.findIndex((e) => e.id === id);
  const i =
    eksakt >= 0
      ? eksakt
      : liste.findIndex((e) => versionKey(e.id) === versionKey(id));
  const e = liste[i];
  // N/P skip optional files nobody has made, unless the filter is «Alt».
  const synlige = liste.filter(
    (x) => x === e || u === "alle" || tilstand(x, k).celle !== "valgfri",
  );
  // From a grid (`gr=`): N/P stay inside that group.
  const gr = sp.get("gr");
  const filtrert = synlige.filter(
    (x) =>
      x === e ||
      (gr ? x.gruppe === gr : passerUtvalg(u, x, tilstand(x, k).celle)),
  );
  const fi = filtrert.indexOf(e);
  const si = synlige.indexOf(e);
  const forrige = typeFilter
    ? naboI(filtrert, e?.id ?? "", -1).e
    : synlige[si - 1];
  const { ko } = useKo(d, sesong);
  const koIder = (ko?.venter ?? [])
    .map((l) => l.id)
    .filter((x, j, a) => a.indexOf(x) === j && liste.some((y) => y.id === x));
  const iKo = koIder.indexOf(e?.id ?? "");
  // From the queue, «Neste» is the next line waiting for Hans.
  const nesteIKo = typeFilter
    ? undefined
    : iKo >= 0
      ? koIder[iKo + 1]
      : koIder.find((x) => x !== e?.id);
  // «Neste uvurdert» stays inside the chosen quick choice; the current item always counts.
  const nesteUv = nesteUvurdert(filtrert, e?.id ?? id, vurd);
  // N goes from where you stand in the filtered, sorted list; Shift+N jumps to the next unreviewed.
  const nabo = naboI(filtrert, e?.id ?? "", 1);
  const neste = nesteIKo ? liste.find((x) => x.id === nesteIKo) : nabo.e;
  const nesteNavn = nesteIKo
    ? "Neste i køen"
    : gruppe
      ? `Neste i ${gruppe.toLowerCase()}`
      : typeFilter && u !== "alle"
        ? `Neste ${u === "julius" ? NAVN[u] : NAVN[u].toLowerCase()}`
        : "Neste uvurdert";

  useEffect(() => {
    const ned = (ev: KeyboardEvent) => {
      const mal = ev.target as HTMLElement;
      if (
        ev.metaKey ||
        ev.ctrlKey ||
        ev.altKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(mal.tagName)
      )
        return;
      const tast = ev.key.toLowerCase();
      const alleKnapp = egenVurdering(id)
        ? null
        : document.querySelector<HTMLButtonElement>(
            `#vurdering-dagmanus [data-alle="${tast === "g" ? "godkjent" : tast === "o" ? "ok" : "-"}"]`,
          );
      // A script day: G/O approve every segment (the segment boxes take their own keys first).
      if (!ev.shiftKey && alleKnapp) {
        alleKnapp.click();
        ev.preventDefault();
      } else if (
        egenVurdering(id) &&
        (taggTast(ev, id) || (!ev.shiftKey && vurderTast(tast, id)))
      )
        ev.preventDefault();
      else if (tast === "n" && ev.shiftKey && nesteUv)
        router.push(lenke(nesteUv.id));
      else if (tast === "n" && neste) router.push(lenke(neste.id));
      else if (tast === "p" && forrige) router.push(lenke(forrige.id));
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [id, neste, nesteUv, forrige, router, lenke]);

  if (!e) return <p>Fant ikke {id}.</p>;
  const st = tilstand(e, k);
  const ikkeLaget =
    e.media.length > 0 &&
    !e.id.startsWith("dag/") &&
    !e.media.some((m) =>
      d.media.files?.some((f) => f.path === m && f.size !== null),
    );
  return (
    <>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href={fane ? `${SIDE}?k=${fane}` : SIDE} className={knapp}>
          ‹ Køen
        </Link>
        {forrige && (
          <Link href={lenke(forrige.id)} className={knapp}>
            Forrige (P)
          </Link>
        )}
        {neste && (
          <Link href={lenke(neste.id)} className={`${knapp} border-(--gold)`}>
            {nesteNavn} (N)
            {!nesteIKo && ` · ${fi + 1} av ${filtrert.length}`}
            {nabo.rundt && !nesteIKo && " · tilbake til start"}
          </Link>
        )}
        <UtvalgValg u={u} sett={settU} />
        <label className="flex items-center gap-2 min-h-11 ml-auto text-base">
          Rekkefølge
          <select
            value={rekkefolge}
            onChange={(ev) => {
              const v = ev.target.value as "dag" | "kolonne";
              localStorage.setItem(REKKEFOLGE, v);
              setRekkefolge(v);
            }}
            className="min-h-11 bg-black border-2 border-(--neon-green) px-2"
          >
            <option value="dag">dag for dag</option>
            <option value="kolonne">kolonne for kolonne</option>
          </select>
        </label>
      </nav>
      <Kort tittel={e.tittel}>
        <p className="text-base break-all">
          <span className={MERKE[st.celle][1]}>
            {st.tekst} gjeldende versjon: {MERKE[st.celle][2]}
          </span>{" "}
          · {e.id} · {i + 1} av {liste.length}
          {e.dag && (
            <>
              {" · "}
              <Link href={`/nissemor-guide/dag/${e.dag}`} className="underline">
                hele dag {e.dag}
              </Link>
            </>
          )}
        </p>
        {ikkeLaget ? (
          <IkkeLaget e={e} valgfri={st.celle === "valgfri"} server={d.server} />
        ) : segStatus ? (
          <p className="text-(--gold)">Status: {segStatus.tekst}</p>
        ) : egenVurdering(e.id) ? (
          <Vurder id={e.id} />
        ) : (
          <DagManus n={e.dag ?? Number(e.id.slice(-2))} />
        )}
        {!ikkeLaget &&
          (!segStatus || segStatus.slutt) &&
          e.media.map((p) => <TaIBruk key={p} path={p} data={d.media} />)}
        <p className="text-base text-(--neon-green)/80">
          Tastatur: G godkjent · O OK · L lag på nytt (skriv notat, Enter
          lagrer) · ⇧1–9 merke · T tidskode · N neste · ⇧N neste uvurdert · P
          forrige
        </p>
      </Kort>
      <SkjulVurder.Provider value>
        <SegmentStatus.Provider value={setSegStatus}>
          {!ikkeLaget && <Innhold key={e.id} e={e} sesong={sesong} />}
        </SegmentStatus.Provider>
      </SkjulVurder.Provider>
    </>
  );
}

/** A media element whose file doesn't exist: no player, no verdict, just what it takes to make it. */
function IkkeLaget({
  e,
  valgfri,
  server,
}: {
  e: Element;
  valgfri: boolean;
  server: KoServer | null;
}) {
  const jobber = server?.jobber ?? {};
  const jobb = jobber[versionKey(e.media[0])];
  const { kommando, pris } = omtak(e.media[0], jobber, 0);
  return (
    <div
      data-testid="ikke-laget"
      className="border-2 border-(--gray) p-3 space-y-1"
    >
      <p className="text-xl text-(--gold)">
        Ikke laget{valgfri ? " · valgfri" : ""}
      </p>
      <p className="text-base break-all">Jobb: {jobb ?? e.media[0]}</p>
      <p className="text-base">Pris ca. {pris} kr</p>
      <code className="block break-all text-(--cold-blue)">
        {jobb ? `python3 assets/bin/generer.py kjør --bare ${jobb}` : kommando}
      </code>
    </div>
  );
}

function Gjennomgang() {
  const sp = useSearchParams();
  const id = sp.get("id");
  const oversikt = sp.get("vis") === "oversikt";
  const d = useData();
  if (!d.sesong || !d.vurd || !d.media.files)
    return <p>Laster … (bare på hjemmenettet)</p>;
  if (id) return <Vurdering id={id} d={d} sesong={d.sesong} />;
  return (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        GJENNOMGANG
      </h1>
      <nav className="flex gap-2">
        <Link
          href={SIDE}
          aria-current={!oversikt}
          className={`${knapp} text-xl ${!oversikt ? "border-(--gold) text-(--gold)" : ""}`}
        >
          Kø
        </Link>
        <Link
          href={`${SIDE}?vis=oversikt`}
          aria-current={oversikt}
          className={`${knapp} text-xl ${oversikt ? "border-(--gold) text-(--gold)" : ""}`}
        >
          Oversikt
        </Link>
      </nav>
      {oversikt ? (
        <Matrise d={d} sesong={d.sesong} />
      ) : (
        <Ko d={d} sesong={d.sesong} />
      )}
    </>
  );
}

export default function GjennomgangSide() {
  return (
    <GuideSide>
      <Gjennomgang />
    </GuideSide>
  );
}

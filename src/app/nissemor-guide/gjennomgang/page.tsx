"use client";

import { versionKey } from "../media/oversikt";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GuideSide, Kort, type Sesong } from "../_kveld/felles";
import { TaIBruk, kilde } from "../media/kort";
import { DagManus } from "./visning";
import { Rutenett } from "./rutenett";
import { besøk, lesHistorikk, skrivHistorikk, tilbake } from "./historikk";
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
  naboer,
  tilstand,
  type Element,
  type Tilstand,
} from "./elementer";
import { Innhold } from "./visning";
import { SegmentStatus } from "./segmentstripe";
import type { VideoStatus } from "@/lib/segmenter";
import { taggTelling } from "@/lib/vurdering-tagger";
import { TRENGER, type TrengerHva } from "@/lib/trenger";
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

/**
 * Filter: Status (Gjenstår | Alt) and Type (an element's `gruppe`, from the
 * type registry). URL `?f=gjenstaar|alle&t=<gruppe>`; an old `?f=julius`
 * still means type Julius.
 */
interface Utvalg {
  s: "gjenstaar" | "alle";
  t: string | null;
}
const KOLONNE_NAVN: Record<string, string> = Object.fromEntries(KOLONNER);
export const typeNavn = (g: string) => KOLONNE_NAVN[g] ?? g;

const passerUtvalg = (u: Utvalg, e: Element, celle: Tilstand) =>
  (u.s === "alle" || GJENSTAAR.includes(celle)) && (!u.t || e.gruppe === u.t);

function lesUtvalg(f: string | null, t: string | null): Utvalg {
  if (f && f !== "gjenstaar" && f !== "alle") return { s: "alle", t: f };
  return { s: f === "gjenstaar" ? "gjenstaar" : "alle", t };
}
const utvalgUrl = (u: Utvalg) =>
  `&f=${u.s}${u.t ? `&t=${encodeURIComponent(u.t)}` : ""}`;

/** From `?f=`/`?t=`, else the last one used, else everything. */
function useUtvalg(): [Utvalg, (u: Utvalg) => void] {
  const sp = useSearchParams();
  const [u, setU] = useState<Utvalg>(() => {
    if (sp.has("f")) return lesUtvalg(sp.get("f"), sp.get("t"));
    const [f, t] = (localStorage.getItem(UTVALG_NOKKEL) ?? "alle").split("|");
    return lesUtvalg(f, t || null);
  });
  const sett = (ny: Utvalg) => {
    localStorage.setItem(UTVALG_NOKKEL, `${ny.s}|${ny.t ?? ""}`);
    const url = new URL(location.href);
    url.searchParams.set("f", ny.s);
    if (ny.t) url.searchParams.set("t", ny.t);
    else url.searchParams.delete("t");
    history.replaceState(history.state, "", url);
    setU(ny);
  };
  return [u, sett];
}

const liten =
  "min-h-11 appearance-none bg-black border border-(--neon-green)/60 px-2 text-base";

/** Status as a two-way switch, Type as a dropdown with what remains per type. */
function UtvalgValg({
  u,
  sett,
  liste,
  gjenstaar,
}: {
  u: Utvalg;
  sett: (u: Utvalg) => void;
  liste: Element[];
  gjenstaar: (e: Element) => boolean;
}) {
  const typer = [...new Set(liste.map((e) => e.gruppe))];
  const igjen = (g: string) =>
    liste.filter((e) => e.gruppe === g && gjenstaar(e)).length;
  return (
    <div className="flex flex-wrap items-center gap-2 text-base">
      <div role="group" aria-label="Status" className="inline-flex">
        {(
          [
            ["gjenstaar", "Gjenstår"],
            ["alle", "Alt"],
          ] as const
        ).map(([k, navn]) => (
          <button
            key={k}
            type="button"
            aria-pressed={u.s === k}
            onClick={() => sett({ ...u, s: k })}
            className={`min-h-11 px-2 border border-(--neon-green)/60 ${u.s === k ? "bg-(--gold) text-black border-(--gold)" : "hover:bg-(--neon-green)/20"}`}
          >
            {navn}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1">
        Type
        <select
          aria-label="Type"
          value={u.t ?? ""}
          onChange={(ev) => sett({ ...u, t: ev.target.value || null })}
          className={liten}
        >
          <option value="">Alle ({liste.filter(gjenstaar).length})</option>
          {typer.map((g) => (
            <option key={g} value={g}>
              {typeNavn(g)} ({igjen(g)})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const pil =
  "min-h-11 min-w-11 inline-flex items-center justify-center border border-(--neon-green)/60 text-xl hover:bg-(--neon-green)/20";
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
            {/* Same number as the progress bar: elements, not lines (a video can have several segment lines). */}
            {navn} ({k === "laerdom" ? ko[k].length : fd!.total.telling[k]})
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
          {Object.keys(ko.trengerTelling).length > 0 && (
            <p data-testid="trenger-telling">
              <span className="text-(--gold)">Trenger mer:</span>{" "}
              {Object.entries(ko.trengerTelling)
                .map(([h, n]) => `${TRENGER[h as TrengerHva]} ${n}`)
                .join(" · ")}
            </p>
          )}
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
      <StatusBrikke c={c} href={href(c.e.id, f)} dempet={dempet} />
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
      f={utvalgUrl(u)}
      dempet={!!e && !vis(e)}
      c={
        e &&
        (vis(e) ||
          (u.s === "gjenstaar" && (!u.t || (e as Element).gruppe === u.t)))
          ? data(e)
          : null
      }
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
      ["ikke", "ikke aktuelt"],
    ];
    return ord
      .filter(([s]) => n[s])
      .map(([s, w]) => `${n[s]} ${w}`)
      .join(" · ");
  };
  const kolonner = KOLONNER.filter(([k]) => !u.t || u.t === k);
  const alle = alleElementer("dag", sesong, d.media.files, d.krypto);
  const utvalgt = alle.filter(vis);
  const ok = alle.filter((e) => brukbar(t(e))).length;
  const ekstra = ekstraRader(sesong, d.media.files, d.krypto).filter(
    (e) => KOLONNER.every(([k]) => k !== u.t) && vis(e),
  );
  const grupper = [...new Set(ekstra.map((e) => e.gruppe))];
  const dager = Array.from({ length: 24 }, (_, i) => i + 1).filter((n) =>
    kolonner.some(([k]) => vis(dagElement(k, n, sesong, d.media.files))),
  );
  const forste = nesteUvurdert(utvalgt, "", vurd);

  return (
    <>
      <UtvalgValg
        u={u}
        sett={settU}
        liste={alle}
        gjenstaar={(e) => GJENSTAAR.includes(t(e)!)}
      />
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
          <Link href={href(forste.id, utvalgUrl(u))} className={knapp}>
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
                lenke={(e) =>
                  href(e.id, `${utvalgUrl(u)}&gr=${encodeURIComponent(g)}`)
                }
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
                          href={href(e.id, utvalgUrl(u))}
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
  const dagF = Number(sp.get("dag")) || 0;
  const typeFilter =
    !!dagF || !!gruppe || (valgtHer && (!!u.t || u.s === "alle"));
  const lenke = useCallback(
    (x: string) =>
      href(
        x,
        (typeFilter ? utvalgUrl(u) : "") +
          (gruppe ? `&gr=${encodeURIComponent(gruppe)}` : "") +
          (dagF ? `&dag=${dagF}` : "") +
          (fane ? `&k=${fane}` : ""),
      ),
    [typeFilter, u, fane, gruppe, dagF],
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
    (x) => x === e || u.s === "alle" || tilstand(x, k).celle !== "valgfri",
  );
  // From a grid (`gr=`): N/P stay inside that group.
  const gr = sp.get("gr");
  const filtrert = synlige.filter(
    (x) =>
      x === e ||
      (dagF
        ? x.dag === dagF
        : gr
          ? x.gruppe === gr
          : passerUtvalg(u, x, tilstand(x, k).celle)),
  );
  const fi = filtrert.indexOf(e);
  const { ko } = useKo(d, sesong);
  const cellen = useCelle(d, sesong);
  const koIder = (ko?.venter ?? [])
    .map((l) => l.id)
    .filter((x, j, a) => a.indexOf(x) === j && liste.some((y) => y.id === x));
  const iKo = koIder.indexOf(e?.id ?? "");
  // «Neste uvurdert» stays inside the chosen quick choice; the current item always counts.
  const nesteUv = nesteUvurdert(filtrert, e?.id ?? id, vurd);
  // From the queue, N/P follow the lines waiting for Hans; with a filter or under «Alt», the
  // filtered, sorted list. Either way one order, so P undoes N. Shift+N jumps to the next unreviewed.
  const nav = naboer(
    filtrert,
    liste,
    e?.id ?? "",
    typeFilter || u.s === "alle" ? null : koIder,
  );
  const { neste, forrige } = nav;
  const nesteIKo = nav.iKo;
  const nabo = { rundt: nav.rundt };
  const nesteNavn = nesteIKo
    ? "Neste i køen"
    : dagF
      ? `Neste i dag ${dagF}`
      : gruppe
        ? `Neste i ${gruppe.toLowerCase()}`
        : typeFilter && u.t
          ? `Neste ${u.t === "julius" ? "Julius" : typeNavn(u.t).toLowerCase()}`
          : "Neste uvurdert";

  const eid = e?.id;
  useEffect(() => {
    if (eid) skrivHistorikk(besøk(lesHistorikk(), eid));
  }, [eid]);
  // P: back to the item viewed before, wherever it sits in the list.
  const gåTilbake = useCallback(() => {
    const [s, mål] = tilbake(lesHistorikk());
    if (!mål) return;
    skrivHistorikk(s);
    router.push(lenke(mål));
  }, [router, lenke]);
  const harForrigeSett =
    typeof window !== "undefined" && lesHistorikk().length > 1;

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
      if ((ev.key === "[" || (tast === "p" && ev.shiftKey)) && forrige) {
        ev.preventDefault();
        router.push(lenke(forrige.id));
        return;
      }
      if (ev.key === "]" && neste) {
        ev.preventDefault();
        router.push(lenke(neste.id));
        return;
      }
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
        (taggTast(ev, id) ||
          ((!ev.shiftKey || ev.key === "?") &&
            vurderTast(ev.key === "?" ? "?" : tast, id)))
      )
        ev.preventDefault();
      else if (tast === "n" && ev.shiftKey && nesteUv)
        router.push(lenke(nesteUv.id));
      else if (tast === "n" && neste) router.push(lenke(neste.id));
      else if (tast === "p") gåTilbake();
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [id, neste, nesteUv, forrige, router, lenke, gåTilbake]);

  if (!e) return <p>Fant ikke {id}.</p>;
  const celleData = cellen;
  const st = tilstand(e, k);
  const ikkeLaget =
    e.media.length > 0 &&
    !e.id.startsWith("dag/") &&
    !e.media.some((m) =>
      d.media.files?.some((f) => f.path === m && f.size !== null),
    );
  return (
    <>
      <div className="sticky top-0 z-20 bg-black/95 border-b border-(--neon-green)/40">
        <nav
          aria-label="Gjennomgang"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1"
        >
          <div className="flex items-center gap-1 text-base">
            <Link
              href={
                dagF
                  ? `/nissemor-guide/dag/${dagF}`
                  : fane
                    ? `${SIDE}?k=${fane}`
                    : SIDE
              }
              data-testid="tilbake"
              className="min-h-11 inline-flex items-center px-2 underline"
            >
              {dagF ? `‹ Dag ${dagF}` : "‹ Kø"}
            </Link>
            <Link
              href={forrige ? lenke(forrige.id) : "#"}
              aria-disabled={!forrige}
              title="Forrige i lista ([ eller Shift+P). P går tilbake til det du så sist."
              aria-label="Forrige i lista ([)"
              className={`${pil} ${forrige ? "" : "pointer-events-none opacity-30"}`}
            >
              ‹
            </Link>
            <span className="px-1 whitespace-nowrap">
              {nesteIKo
                ? `${iKo + 1} av ${koIder.length}`
                : `${fi + 1} av ${filtrert.length}`}
            </span>
            <Link
              href={neste ? lenke(neste.id) : "#"}
              aria-disabled={!neste}
              title={`${nesteNavn} (N eller ])${nabo.rundt && !nesteIKo ? " · tilbake til start" : ""}`}
              aria-label={`${nesteNavn} (N)`}
              className={`${pil} ${neste ? "border-(--gold)" : "pointer-events-none opacity-30"}`}
            >
              ›
            </Link>
            <span className="text-sm text-(--neon-green)/70 whitespace-nowrap">
              {nesteNavn.toLowerCase()}
              {e &&
                !gr &&
                !nesteIKo &&
                !passerUtvalg(u, e, tilstand(e, k).celle) &&
                " · utenfor filteret"}
            </span>
            {e.dag && (
              <Link
                href={`/nissemor-guide/dag/${e.dag}`}
                className="min-h-11 inline-flex items-center px-1 text-sm underline"
              >
                hele dag {e.dag}
              </Link>
            )}
            {harForrigeSett && (
              <button
                type="button"
                onClick={gåTilbake}
                title="Tilbake til det du så sist (P), som nettleserens tilbake"
                className="min-h-11 px-2 text-sm underline"
              >
                ↶ Sist sett (P)
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-auto text-base">
            <UtvalgValg
              u={u}
              sett={settU}
              liste={liste}
              gjenstaar={(x) => GJENSTAAR.includes(tilstand(x, k).celle)}
            />
            <label className="flex items-center gap-1">
              Rekkefølge
              <select
                value={rekkefolge}
                onChange={(ev) => {
                  const v = ev.target.value as "dag" | "kolonne";
                  localStorage.setItem(REKKEFOLGE, v);
                  setRekkefolge(v);
                }}
                className={liten}
              >
                <option value="dag">dag</option>
                <option value="kolonne">kolonne</option>
              </select>
            </label>
          </div>
        </nav>
        <section
          aria-label="Vurdering"
          data-testid="vurderingsboks"
          className="flex flex-wrap lg:flex-nowrap items-start gap-x-3 gap-y-1 py-1 border-t border-(--neon-green)/20"
        >
          <div className="flex items-center gap-2 min-w-0 basis-full lg:basis-auto lg:max-w-[40%]">
            <h2 className="text-xl text-(--gold) truncate" title={e.id}>
              {e.tittel}
            </h2>
            <StatusBrikke c={celleData(e)} href={href(e.id, "")} />
          </div>
          <div className="flex-1 min-w-0">
            {ikkeLaget ? (
              <IkkeLaget
                e={e}
                valgfri={st.celle === "valgfri"}
                server={d.server}
              />
            ) : segStatus ? (
              <p className="text-(--gold) min-h-11 flex items-center">
                Status: {segStatus.tekst}
              </p>
            ) : egenVurdering(e.id) ? (
              <Vurder id={e.id} />
            ) : (
              <DagManus n={e.dag ?? Number(e.id.slice(-2))} />
            )}
          </div>
          <details className="relative">
            <summary
              className="list-none min-h-11 min-w-11 inline-flex items-center justify-center border border-(--neon-green)/60 cursor-pointer"
              title="Tastatur"
              aria-label="Tastatur"
            >
              Taster
            </summary>
            <p className="absolute right-0 z-30 w-80 p-2 bg-black border border-(--neon-green) text-base">
              G godkjent · O OK · L lag på nytt (skriv notat, Enter lagrer) · ?
              trenger mer · ⇧1–9 merke · T tidskode · N/] neste · ⇧N neste
              uvurdert · [ eller ⇧P forrige i lista · P tilbake til sist sett
            </p>
          </details>
        </section>
      </div>
      {vurd[e.id]?.forklaring && (
        <Kort tittel="Forklaring fra agenten" farge="border-(--cold-blue)">
          <p className="whitespace-pre-line">{vurd[e.id].forklaring}</p>
        </Kort>
      )}
      {!ikkeLaget &&
        (!segStatus || segStatus.slutt) &&
        e.media.map((p) => <TaIBruk key={p} path={p} data={d.media} />)}
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
  // «Vurder dag N →» from the day view: the day's first item, N/P inside the day.
  const dagF = Number(sp.get("dag")) || 0;
  const forsteIDag =
    dagF && !id
      ? alleElementer("dag", d.sesong, d.media.files, d.krypto).find(
          (e) => e.dag === dagF,
        )?.id
      : undefined;
  if (id || forsteIDag)
    return <Vurdering id={(id ?? forsteIDag)!} d={d} sesong={d.sesong} />;
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

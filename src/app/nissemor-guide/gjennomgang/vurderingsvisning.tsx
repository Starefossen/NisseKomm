"use client";

import { versionKey } from "../media/oversikt";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Kort, type Sesong } from "../_kveld/felles";
import { TaIBruk, kilde } from "../media/kort";
import { DagManus, DagManusFremdrift } from "./visning";
import { besøk, lesHistorikk, skrivHistorikk, tilbake } from "./historikk";
import { SegmentBar, StatusBrikke, useCelle, useData, useKo } from "./celle";
import { GJENSTAAR } from "../media/filter";
import { SkjulVurder, Vurder, taggTast, vurderTast } from "../vurdering";
import {
  alleElementer,
  egenVurdering,
  nesteUvurdert,
  naboer,
  tilstand,
  type Element,
} from "./elementer";
import { Historikk, Innhold } from "./visning";
import { SegmentStatus } from "./segmentstripe";
import type { VideoStatus } from "@/lib/segmenter";
import {
  omtak,
  arbeidTekst,
  prioritetFor,
  prioritetTekst,
  type KoServer,
} from "./ko";
import { Lagremelding, useLagring } from "../lagring";
import {
  REKKEFOLGE,
  SIDE,
  Utvalg,
  UtvalgValg,
  Valg,
  href,
  passerUtvalg,
  pil,
  useUtvalg,
  typeNavn,
  utvalgUrl,
} from "./felles";

export function Vurdering({
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
  const [filterÅpen, setFilterÅpen] = useState(false);
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
  const posisjon = nesteIKo
    ? iKo >= 0
      ? `${iKo + 1} / ${koIder.length}`
      : `utenfor køen · ${koIder.length} igjen`
    : !gr && !dagF && !passerUtvalg(u, e, st.celle)
      ? `utenfor filteret · ${filtrert.length - 1} igjen`
      : `${fi + 1} / ${filtrert.length}`;
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
          className="relative flex items-center gap-1.5 sm:gap-3 h-14 text-base"
        >
          <Link
            href={
              dagF
                ? `/nissemor-guide/dag/${dagF}`
                : fane
                  ? `${SIDE}?k=${fane}`
                  : SIDE
            }
            data-testid="tilbake"
            className="h-11 shrink-0 inline-flex items-center px-2 border border-(--neon-green)/60 hover:bg-(--neon-green)/20 whitespace-nowrap"
          >
            {dagF ? `‹ Dag ${dagF}` : "‹ Kø"}
          </Link>
          <div className="flex items-center shrink-0">
            <Link
              href={forrige ? lenke(forrige.id) : "#"}
              aria-disabled={!forrige}
              title="Forrige i lista ([ eller Shift+P). P går tilbake til det du så sist."
              aria-label="Forrige i lista ([)"
              className={`${pil} ${forrige ? "" : "pointer-events-none opacity-30"}`}
            >
              ‹
            </Link>
            <span
              data-testid="posisjon"
              title={`${nesteNavn}: N`}
              className="h-11 inline-flex items-center justify-center min-w-20 px-2 border-y border-(--neon-green)/60 tabular-nums whitespace-nowrap"
            >
              {posisjon}
            </span>
            <Link
              href={neste ? lenke(neste.id) : "#"}
              aria-disabled={!neste}
              title={`${nesteNavn} (N eller ])${nabo.rundt && !nesteIKo ? " · tilbake til start" : ""}`}
              aria-label={`${nesteNavn} (N)`}
              className={`${pil} ${neste ? "border-(--gold) text-(--gold)" : "pointer-events-none opacity-30"}`}
            >
              ›
            </Link>
          </div>
          {harForrigeSett && (
            <button
              type="button"
              onClick={gåTilbake}
              title="Tilbake til det du så sist (P), som nettleserens tilbake"
              aria-label="Sist sett (P)"
              className={pil}
            >
              ↶
            </button>
          )}
          <button
            type="button"
            aria-expanded={filterÅpen}
            onClick={() => setFilterÅpen(!filterÅpen)}
            className="sm:hidden h-11 px-2 ml-auto border border-(--neon-green)/60 whitespace-nowrap"
          >
            Filter ▾
          </button>
          <div
            className={`${filterÅpen ? "flex" : "hidden"} absolute top-full right-0 z-30 flex-col items-stretch gap-2 p-2 bg-black border border-(--neon-green) sm:static sm:flex sm:flex-row sm:items-center sm:p-0 sm:border-0 sm:bg-transparent sm:flex-1 sm:justify-end`}
          >
            <UtvalgValg
              u={u}
              sett={settU}
              liste={liste}
              gjenstaar={(x) => GJENSTAAR.includes(tilstand(x, k).celle)}
            />
            <Valg
              navn="Sortér"
              value={rekkefolge}
              onChange={(ev) => {
                const v = ev.target.value as "dag" | "kolonne";
                localStorage.setItem(REKKEFOLGE, v);
                setRekkefolge(v);
              }}
            >
              <option value="dag">dag</option>
              <option value="kolonne">kolonne</option>
            </Valg>
          </div>
          <details className="relative shrink-0">
            <summary className="list-none h-11 px-2 inline-flex items-center justify-center border border-(--neon-green)/60 cursor-pointer hover:bg-(--neon-green)/20">
              Taster
            </summary>
            <p className="absolute right-0 top-full z-30 w-80 max-w-[90vw] p-2 bg-black border border-(--neon-green) text-base">
              G godkjent · O OK · L lag på nytt (skriv notat, Enter lagrer) · ?
              trenger mer · ⇧1–9 merke · T tidskode · N/] neste · ⇧N neste
              uvurdert · [ eller ⇧P forrige i lista · P tilbake til sist sett
            </p>
          </details>
        </nav>
        <section
          aria-label="Vurdering"
          data-testid="vurderingsboks"
          className="flex flex-col gap-1 py-1 border-t border-(--neon-green)/20"
        >
          <div className="flex flex-wrap items-center gap-x-3 min-w-0">
            <h2 className="text-xl text-(--gold) truncate min-w-0" title={e.id}>
              {e.tittel}
            </h2>
            <StatusBrikke c={celleData(e)} href={href(e.id, "")} pille />
            {!ikkeLaget && segStatus?.segs ? (
              <SegmentBar
                segs={segStatus.segs}
                velg={(s) =>
                  document
                    .querySelector<HTMLButtonElement>(`[data-seg="${s}"]`)
                    ?.click()
                }
              />
            ) : (
              !ikkeLaget &&
              !segStatus &&
              !egenVurdering(e.id) && (
                <DagManusFremdrift n={e.dag ?? Number(e.id.slice(-2))} />
              )
            )}
            <span className="ml-auto flex items-center gap-3 text-sm whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  const h = document.getElementById(
                    "historikk",
                  ) as HTMLDetailsElement | null;
                  if (!h) return;
                  h.open = true;
                  h.scrollIntoView({ behavior: "smooth" });
                }}
                className="min-h-11 underline"
              >
                historikk
              </button>
              {e.dag && (
                <Link
                  href={`/nissemor-guide/dag/${e.dag}`}
                  className="min-h-11 inline-flex items-center underline"
                >
                  hele dag {e.dag}
                </Link>
              )}
            </span>
          </div>
          <div className="min-w-0">
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
        </section>
      </div>
      {vurd[e.id]?.forklaring && (
        <Kort tittel="Forklaring fra agenten" farge="border-(--cold-blue)">
          <p className="whitespace-pre-line">{vurd[e.id].forklaring}</p>
        </Kort>
      )}
      <Sloyfe id={e.id} media={e.media} d={d} />
      {!ikkeLaget &&
        (!segStatus || segStatus.slutt) &&
        e.media.map((p) => <TaIBruk key={p} path={p} data={d.media} />)}
      <SkjulVurder.Provider value>
        <SegmentStatus.Provider value={setSegStatus}>
          {!ikkeLaget && <Innhold key={e.id} e={e} sesong={sesong} />}
        </SegmentStatus.Provider>
      </SkjulVurder.Provider>
      <Historikk key={`h-${e.id}`} id={e.id} />
    </>
  );
}

async function sendSvar(body: Record<string, unknown>) {
  const r = await fetch("/api/media/svar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
}

/** Agents' replies under Hans' note, his open question and who is working on it. */
function Sloyfe({
  id,
  media,
  d,
}: {
  id: string;
  media: string[];
  d: ReturnType<typeof useData>;
}) {
  const { status, lagrer, kjør } = useLagring();
  const s = d.server;
  const tråd = s && prioritetFor(id, s.svar ?? {}, media);
  const spm = s && prioritetFor(id, s.spørsmål ?? {}, media);
  const arb = s && prioritetFor(id, s.arbeid ?? {}, media);
  const nøkkel = (x: { fil: string }) => versionKey(x.fil.replace(/#.*/, ""));
  // Opening the item is seeing the replies.
  const nytt = !!tråd?.nytt;
  const fil = tråd?.fil;
  useEffect(() => {
    if (!nytt || !fil) return;
    sendSvar({ id: fil, sett: true })
      .then(() =>
        d.settServer((x) => ({
          ...x,
          svar: Object.fromEntries(
            Object.entries(x.svar ?? {}).map(([k, t]) => [
              k,
              t.fil === fil ? { ...t, nytt: false } : t,
            ]),
          ),
        })),
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nytt, fil]);
  // Every priority on the item (a Julius video can have one per segment): «lytt: …», «gjennomlesing før generering».
  const pri = Object.values(s?.prioriteter ?? {}).filter((p) =>
    prioritetFor(id, { [p.fil]: p }, media),
  );
  if (!tråd && !spm && !arb && !pri.length) return null;
  return (
    <Kort tittel="Agent og deg" farge="border-(--cold-blue)">
      {pri.map((p) => (
        <p
          key={p.fil}
          data-testid="prioritet"
          className="text-(--christmas-red)"
        >
          {p.fil.includes("#s") ? `s${p.fil.split("#s")[1]}: ` : ""}
          {prioritetTekst(p)}
        </p>
      ))}
      {arb && (
        <p
          data-testid="under-arbeid"
          className={arb.stoppet ? "text-(--christmas-red)" : "text-(--gold)"}
        >
          Under arbeid: {arbeidTekst(arb)}
        </p>
      )}
      {spm && (
        <div
          data-testid="spørsmål"
          className="flex flex-wrap gap-2 items-center"
        >
          <span>Spørsmål fra deg: «{spm.notat}»</span>
          <button
            type="button"
            disabled={lagrer}
            className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
            onClick={() =>
              kjør(async () => {
                await sendSvar({ id: spm.fil, lukk: true });
                d.settServer((x) => ({
                  ...x,
                  spørsmål: Object.fromEntries(
                    Object.entries(x.spørsmål ?? {}).filter(
                      ([, q]) => nøkkel(q) !== nøkkel(spm),
                    ),
                  ),
                }));
              }, "✓ Lukket")
            }
          >
            Lukk spørsmål
          </button>
          <Lagremelding status={status} />
        </div>
      )}
      {tråd && (
        <ul data-testid="svar-tråd">
          {tråd.tråd.map((x) => (
            <li
              key={x.når}
              className="border-l-2 border-(--cold-blue) pl-2 my-1"
            >
              <span className="text-base text-(--cold-blue)">
                {x.av.replace(/^agent:/, "")} ·{" "}
                {new Date(x.når).toLocaleString("nb-NO", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <p className="whitespace-pre-line">{x.tekst}</p>
            </li>
          ))}
        </ul>
      )}
    </Kort>
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

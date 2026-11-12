"use client";

import { versionKey } from "../media/oversikt";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { GuideSide, Kort, useSesong, type Sesong } from "../_kveld/felles";
import { TaIBruk, kilde, useMediaData } from "../media/kort";
import { brukbar, FORKLARING, MERKE } from "@/lib/media-status";
import { GJENSTAAR } from "../media/filter";
import { SkjulVurder, Vurder, useVurderinger, vurderTast } from "../vurdering";
import {
  KOLONNER,
  alleElementer,
  dagElement,
  ekstraRader,
  nesteUvurdert,
  tilstand,
  type Element,
  type Tilstand,
} from "./elementer";
import { Innhold } from "./visning";

const SIDE = "/nissemor-guide/gjennomgang";
const REKKEFOLGE = "nissekomm-guide-gjennomgang-rekkefolge";
const href = (id: string) => `${SIDE}?id=${encodeURIComponent(id)}`;
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

function useData() {
  const sesong = useSesong();
  const media = useMediaData();
  const vurd = useVurderinger();
  const krypto = GameEngine.getAllQuests().filter(
    (q) => q.decryption_challenge,
  ).length;
  return { sesong, media, vurd, krypto };
}

function Celle({
  e,
  t,
}: {
  e: Element | null;
  t: ReturnType<typeof tilstand> | null;
}) {
  if (!e || !t) return <td className="p-1 text-center opacity-40">–</td>;
  const [, farge, navn] = MERKE[t.celle];
  return (
    <td className="p-0 text-center">
      <Link
        href={href(e.id)}
        title={`${e.tittel}: i bruk ${navn}${t.notat ? ` – ${t.notat}` : ""}`}
        className={`flex items-center justify-center min-h-11 min-w-11 px-1 whitespace-nowrap hover:bg-(--neon-green)/20 ${farge}`}
      >
        {t.tekst}
      </Link>
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
  const celle = (e: Element | null) => (
    <Celle key={e?.id} e={vis(e) ? e : null} t={vis(e) ? tt(e) : null} />
  );
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
          <Link href={href(forste.id)} className={knapp}>
            Start: neste uvurdert ({forste.tittel})
          </Link>
        )}
      </Kort>
      <div className="overflow-x-auto">
        <table className="border-collapse text-lg w-full">
          <thead>
            <tr className="text-(--gold)">
              <th className="p-1 text-left">Dag</th>
              {kolonner.map(([k, navn]) => {
                const rad = dager
                  .map((n) => dagElement(k, n, sesong, d.media.files))
                  .filter(Boolean);
                return (
                  <th key={k} className="p-1">
                    {navn}
                    <span className="block text-sm text-(--neon-green)/80">
                      {rad.filter((e) => brukbar(t(e))).length}/{rad.length}
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
            <table className="w-full">
              <tbody>
                {rad.map((e) => (
                  <tr key={e.id} className="border-t border-(--neon-green)/30">
                    <td className="p-1">
                      <Link href={href(e.id)} className="underline break-all">
                        {e.tittel}
                      </Link>
                    </td>
                    {celle(e)}
                  </tr>
                ))}
              </tbody>
            </table>
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
  const [u, settU] = useUtvalg();
  const k = { ...kilde(d.media), vurderinger: vurd };
  const liste = alleElementer(rekkefolge, sesong, d.media.files, d.krypto);
  // An old link to dag-02.mp4 lands on the newest version of the group.
  const eksakt = liste.findIndex((e) => e.id === id);
  const i =
    eksakt >= 0
      ? eksakt
      : liste.findIndex((e) => versionKey(e.id) === versionKey(id));
  const e = liste[i];
  const forrige = liste[i - 1];
  // «Neste uvurdert» stays inside the chosen quick choice; the current item always counts.
  const neste = nesteUvurdert(
    liste.filter((x) => x === e || passerUtvalg(u, x, tilstand(x, k).celle)),
    e?.id ?? id,
    vurd,
  );

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
      if (vurderTast(tast, id)) ev.preventDefault();
      else if (tast === "n" && neste) router.push(href(neste.id));
      else if (tast === "p" && forrige) router.push(href(forrige.id));
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [id, neste, forrige, router]);

  if (!e) return <p>Fant ikke {id}.</p>;
  const st = tilstand(e, k);
  return (
    <>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href={SIDE} className={knapp}>
          ‹ Oversikten
        </Link>
        {forrige && (
          <Link href={href(forrige.id)} className={knapp}>
            Forrige (P)
          </Link>
        )}
        {neste && (
          <Link href={href(neste.id)} className={`${knapp} border-(--gold)`}>
            Neste uvurdert (N)
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
        <Vurder id={e.id} />
        {e.media.map((p) => (
          <TaIBruk key={p} path={p} data={d.media} />
        ))}
        <p className="text-base text-(--neon-green)/80">
          Tastatur: G godkjent · O OK · L lag på nytt (skriv notat, Enter
          lagrer) · N neste · P forrige
        </p>
      </Kort>
      <SkjulVurder.Provider value>
        <Innhold key={e.id} e={e} sesong={sesong} />
      </SkjulVurder.Provider>
    </>
  );
}

function Gjennomgang() {
  const id = useSearchParams().get("id");
  const d = useData();
  if (!d.sesong || !d.vurd || !d.media.files)
    return <p>Laster … (bare på hjemmenettet)</p>;
  return id ? (
    <Vurdering id={id} d={d} sesong={d.sesong} />
  ) : (
    <>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        GJENNOMGANG
      </h1>
      <Matrise d={d} sesong={d.sesong} />
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

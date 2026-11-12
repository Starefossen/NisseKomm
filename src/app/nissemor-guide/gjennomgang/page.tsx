"use client";

import { versionKey } from "../media/oversikt";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { GuideSide, Kort, useSesong, type Sesong } from "../_kveld/felles";
import { TaIBruk, kilde, useMediaData } from "../media/kort";
import { FORKLARING, MERKE } from "@/lib/media-status";
import { SkjulVurder, Vurder, lagre, useVurderinger } from "../vurdering";
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
  const celle = (e: Element | null) => <Celle key={e?.id} e={e} t={tt(e)} />;
  const alle = alleElementer("dag", sesong, d.media.files, d.krypto);
  const ok = alle.filter((e) => t(e) === "godkjent").length;
  const ekstra = ekstraRader(sesong, d.media.files, d.krypto);
  const grupper = [...new Set(ekstra.map((e) => e.gruppe))];
  const dager = Array.from({ length: 24 }, (_, i) => i + 1);
  const forste = nesteUvurdert(alle, "", vurd);

  return (
    <>
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
              {KOLONNER.map(([k, navn]) => {
                const rad = dager
                  .map((n) => dagElement(k, n, sesong, d.media.files))
                  .filter(Boolean);
                return (
                  <th key={k} className="p-1">
                    {navn}
                    <span className="block text-sm text-(--neon-green)/80">
                      {rad.filter((e) => t(e) === "godkjent").length}/
                      {rad.length}
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
                {KOLONNER.map(([k]) =>
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
            tittel={`${g} (${rad.filter((e) => t(e) === "godkjent").length}/${rad.length})`}
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
  const liste = alleElementer(rekkefolge, sesong, d.media.files, d.krypto);
  // An old link to dag-02.mp4 lands on the newest version of the group.
  const eksakt = liste.findIndex((e) => e.id === id);
  const i =
    eksakt >= 0
      ? eksakt
      : liste.findIndex((e) => versionKey(e.id) === versionKey(id));
  const e = liste[i];
  const forrige = liste[i - 1];
  const neste = nesteUvurdert(liste, e?.id ?? id, vurd);

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
      const v = vurd[id];
      if (tast === "g")
        lagre(
          id,
          v?.vurdering === "godkjent" ? null : "godkjent",
          v?.notat ?? "",
        );
      else if (tast === "l") {
        ev.preventDefault();
        if (v?.vurdering !== "lag_paa_nytt")
          lagre(id, "lag_paa_nytt", v?.notat ?? "");
        document
          .querySelector<HTMLInputElement>(
            `#vurdering-${CSS.escape(id.split("/").at(-1)!)} input`,
          )
          ?.focus();
      } else if (tast === "n" && neste) router.push(href(neste.id));
      else if (tast === "p" && forrige) router.push(href(forrige.id));
    };
    window.addEventListener("keydown", ned);
    return () => window.removeEventListener("keydown", ned);
  }, [id, vurd, neste, forrige, router]);

  if (!e) return <p>Fant ikke {id}.</p>;
  const st = tilstand(e, { ...kilde(d.media), vurderinger: vurd });
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
            {st.tekst} i bruk: {MERKE[st.celle][2]}
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
          Tastatur: G godkjent · L lag på nytt (skriv notat) · N neste · P
          forrige
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

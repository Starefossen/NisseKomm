"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { GuideSide, Kort, useSesong, type Sesong } from "../_kveld/felles";
import { useMediaData } from "../media/kort";
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

const MERKE: Record<Tilstand, [string, string, string]> = {
  godkjent: ["✓", "text-(--gold)", "Godkjent"],
  ikke_vurdert: ["○", "text-(--neon-green)/50", "Ikke vurdert"],
  lag_paa_nytt: ["↻", "text-(--varm-aksent)", "Lag på nytt"],
  mangler: ["✗", "text-(--christmas-red)", "Mangler"],
};

const knapp =
  "inline-flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

function useData() {
  const sesong = useSesong();
  const media = useMediaData();
  const vurd = useVurderinger();
  const krypto = GameEngine.getAllQuests().filter(
    (q) => q.decryption_challenge,
  ).length;
  const finnes = new Set(
    (media.files ?? []).filter((f) => f.size !== null).map((f) => f.path),
  );
  return { sesong, media, vurd, krypto, finnes };
}

function Celle({
  e,
  t,
  notat,
  stale,
}: {
  e: Element | null;
  t?: Tilstand;
  notat?: string;
  stale?: boolean;
}) {
  if (!e || !t) return <td className="p-1 text-center opacity-40">–</td>;
  const [tegn, farge, navn] = MERKE[t];
  return (
    <td className="p-0 text-center">
      <Link
        href={href(e.id)}
        title={`${e.tittel}: ${navn}${stale ? " (utdatert)" : ""}${notat ? ` – ${notat}` : ""}`}
        className={`flex items-center justify-center min-h-11 min-w-11 hover:bg-(--neon-green)/20 ${farge}`}
      >
        {tegn}
        {stale && <span className="text-(--varm-aksent) text-sm">!</span>}
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
  const t = (e: Element | null) => e && tilstand(e, vurd, d.finnes);
  const celle = (e: Element | null) => (
    <Celle
      key={e?.id}
      e={e}
      t={t(e) ?? undefined}
      notat={e ? vurd[e.id]?.notat : undefined}
      stale={e?.media.some((p) => d.media.inventar.get(p)?.status === "stale")}
    />
  );
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
          ✓ godkjent · ○ ikke vurdert · ↻ lag på nytt (notatet vises når du
          holder over) · ✗ filen mangler · ! utdatert
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
  const i = liste.findIndex((e) => e.id === id);
  const e = liste[i];
  const forrige = liste[i - 1];
  const neste = nesteUvurdert(liste, id, vurd);

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
  const st = tilstand(e, vurd, d.finnes);
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
          <span className={MERKE[st][1]}>
            {MERKE[st][0]} {MERKE[st][2]}
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

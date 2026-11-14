"use client";

import Link from "next/link";
import { Kort, type Sesong } from "../_kveld/felles";
import { kilde } from "../media/kort";
import { Rutenett } from "./rutenett";
import {
  CELLE,
  StatusBrikke,
  useCelle,
  useData,
  useKo,
  type CelleData,
} from "./celle";
import { FORKLARING } from "@/lib/media-status";
import { GJENSTAAR } from "../media/filter";
import {
  KOLONNER,
  RUTENETT,
  alleElementer,
  dagElement,
  ekstraRader,
  nesteUvurdert,
  tilstand,
  type Element,
} from "./elementer";
import { FREMDRIFT, type Fremdrift } from "./ko";
import {
  UtvalgValg,
  href,
  knapp,
  passerUtvalg,
  useUtvalg,
  utvalgUrl,
} from "./felles";

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

export function Matrise({
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
    const ord = FREMDRIFT.map(([s]) => [s, CELLE[s][0]] as const);
    return ord
      .filter(([s]) => n[s])
      .map(([s, w]) => `${n[s]} ${w}`)
      .join(" · ");
  };
  const kolonner = KOLONNER.filter(([k]) => !u.t || u.t === k);
  const alle = alleElementer("dag", sesong, d.media.files, d.krypto);
  const utvalgt = alle.filter(vis);
  // Same count as the queue's bar and Filer: fremdrift() over the same list.
  const { fd } = useKo(d, sesong);
  const ferdig = (e: Element) => ["godkjent", "ok"].includes(data(e).status);
  const ok = fd ? fd.total.telling.godkjent + fd.total.telling.ok : 0;
  const n = fd?.total.n ?? alle.length;
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
      <Kort tittel={`${ok} av ${n} godkjent eller OK`} farge="border-(--gold)">
        <div className="h-4 border-2 border-(--neon-green)">
          <div
            className="h-full bg-(--gold) transition-all"
            style={{ width: `${(100 * ok) / n}%` }}
          />
        </div>
        <p className="text-base">
          Notatet vises når du holder over en celle. {FORKLARING}
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
            tittel={`${g} (${rad.filter(ferdig).length}/${rad.length})`}
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

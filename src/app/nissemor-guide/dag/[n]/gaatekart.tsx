"use client";
import { Vurder } from "../../vurdering";

import Link from "next/link";
import type { ReactNode } from "react";
import { utskriftHref, utskriftTittel } from "../../printout/filer";
import type { Bit, gaatekart, kveldDag } from "@/lib/guide-sesong";

const box = "border-2 border-(--neon-green) bg-black p-3 sm:p-4 mb-4";

/** Letter rows such as «_ R _ S _ _»: the letters go, the gaps stay. */
const skjulRad = (s: string, vis: boolean) =>
  vis
    ? s
    : s.replace(/[_A-ZÆØÅƧЯ](?: [_A-ZÆØÅƧЯ])+/g, (m) =>
        m.includes("_") ? m.replace(/[^_ ]/g, "▢") : m,
      );

/** Bold in gaater marks the letters the kids find; hidden like the code. */
function Bokstaver({ tekst, vis }: { tekst: string; vis: boolean }) {
  return (
    <>
      {skjulRad(tekst, vis)
        .split(/\*\*(.+?)\*\*/)
        .map((x, i) =>
          i % 2 ? (
            <strong key={i} className="text-(--gold)">
              {vis ? x : "▢".repeat(x.length)}
            </strong>
          ) : (
            x
          ),
        )}
    </>
  );
}

/** Marks the quoted sentence inside a longer text (mail, PS, transcript). */
function Merket({ tekst, sitat }: { tekst: string; sitat?: string }) {
  const i = sitat ? tekst.indexOf(sitat) : -1;
  if (i < 0) return <>{tekst}</>;
  return (
    <>
      {tekst.slice(0, i)}
      <mark className="bg-(--gold) text-black">{sitat}</mark>
      {tekst.slice(i + sitat!.length)}
    </>
  );
}

function Kolonne({
  tittel,
  children,
}: {
  tittel: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-(--neon-green)/50 p-2">
      <h3 className="text-xl text-(--gold) mb-2">{tittel}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

/** Where each piece of the day's riddle is, at home and in the app. `t` hides the code. */
export function Gaatekart({
  vid,
  k,
  d,
  epost,
  vis,
  t,
}: {
  vid: string;
  k: ReturnType<typeof gaatekart>;
  d: NonNullable<ReturnType<typeof kveldDag>>;
  epost: string;
  vis: boolean;
  t: (s: string) => string;
}) {
  const ids = (s: string) =>
    k.skjerm
      .filter(
        (b) =>
          (b.kilde === "julius" && /Julius|video/i.test(s)) ||
          (b.kilde === "fil" && s.includes(b.hvor.split("/").at(-1)!)) ||
          (b.kilde === "ps" && /PS/.test(s)) ||
          (b.kilde === "symbol" && /symbol|kort/i.test(s)) ||
          (b.kilde === "epost" && /e-post/i.test(s)),
      )
      .map((b) => b.id);
  const bit = (b: Bit) => (
    <li key={b.id} className="border-l-4 border-(--cold-blue) pl-2">
      <p>
        <b className="text-(--gold)">{b.id}</b> {b.hvor}
        {b.naar && <span className="text-sm"> · {b.naar}</span>}
      </p>
      {b.merk ? (
        <>
          <p className="text-sm whitespace-pre-wrap">
            {t(b.tekst)
              .split(/(?<=[.!?])\s+/)
              .map((x, i) => (
                <span key={i}>
                  {b.merk!.some((m) => t(m) === x) ? (
                    <mark className="bg-(--gold) text-black">{x}</mark>
                  ) : (
                    x
                  )}{" "}
                </span>
              ))}
          </p>
          {/* app-tekster: the mail tells what happened and who does what next. */}
          <p className="text-sm opacity-80">
            Gir: hva som skjedde i natt, og hvem gjør hva videre
          </p>
        </>
      ) : b.kilde === "epost" && b.kildeDag === d.dag ? (
        <p className="text-sm whitespace-pre-wrap">
          <Merket tekst={t(epost)} sitat={b.sitat} />
        </p>
      ) : (
        <p className="text-sm">«{t(b.tekst)}»</p>
      )}
      {!b.kilde && (
        <p className="text-sm text-(--christmas-red)">
          Sjekk teksten: sitatet fra gåteplanen er ikke funnet i appen.
        </p>
      )}
    </li>
  );

  return (
    <section id="kart" className={box}>
      <h2 className="text-2xl text-(--gold) mb-2">Gåtekart</h2>
      {k.husProsent !== null && (
        <div className="mb-3">
          <div
            className="flex h-4 border border-(--neon-green)"
            role="img"
            aria-label={`Hjemme ${k.husProsent} %, i NisseKomm ${100 - k.husProsent} %`}
          >
            <div
              className="bg-(--gold)"
              style={{ width: `${k.husProsent}%` }}
            />
            <div className="bg-(--cold-blue) flex-1" />
          </div>
          <p className="text-sm">
            Hjemme {k.husProsent} % · {t(k.andel)}
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <Kolonne tittel="Hjemme (fra Rampenissen)">
          {k.hjemme.map((b) => (
            <li key={b.id} className="border-l-4 border-(--gold) pl-2">
              <b className="text-(--gold)">{b.id}</b>{" "}
              <Bokstaver tekst={t(b.tekst)} vis={vis} />
            </li>
          ))}
          {d.utskrifter.map((u) => (
            <li key={u} className="text-sm">
              Utskrift:{" "}
              <Link href={utskriftHref(u)} className="underline">
                {utskriftTittel(u)}
              </Link>
            </li>
          ))}
        </Kolonne>
        <Kolonne tittel="I NisseKomm">
          {k.skjerm.length === 0 && <li>Ingen brikke på skjermen.</li>}
          {k.skjerm.map(bit)}
        </Kolonne>
      </div>
      <h3 className="text-xl text-(--gold) mt-3">Slik løses den</h3>
      <ol className="list-decimal pl-6 space-y-1">
        {d.slikLoses.map((s) => (
          <li key={s}>
            {ids(s).length > 0 && (
              <span className="text-(--gold)">[{ids(s).join(", ")}] </span>
            )}
            {/* Parentheses in gaater hold the blind alleys. */}
            {t(s)
              .split(/(\([^)]*\))/)
              .map((x, i) =>
                i % 2 ? (
                  <span key={i} className="opacity-60">
                    {x}
                  </span>
                ) : (
                  <Bokstaver key={i} tekst={x} vis={vis} />
                ),
              )}
          </li>
        ))}
      </ol>
      {d.reserve && (
        <p className="opacity-60 mt-2">
          <b>Reserve:</b> {t(d.reserve)}
        </p>
      )}
      <details id="hint" className="mt-3 scroll-mt-4">
        <summary className="text-xl text-(--gold) cursor-pointer min-h-11">
          Hint ({d.hint.length})
        </summary>
        <p>Gi ett hint om gangen, og vent litt før neste.</p>
        <ol className="list-decimal pl-6 space-y-2">
          {d.hint.map((s) => {
            // «[…]» at the end says where in the house or the app the step points.
            const [si, hvor] = t(s).split(/\s*\[(.*)\]$/);
            return (
              <li key={s}>
                {si}
                {hvor && (
                  <span className="block text-sm opacity-60">{hvor}</span>
                )}
              </li>
            );
          })}
        </ol>
        <p>
          <b>Hanna (hvis hun vil):</b> {t(d.hanna)}
        </p>
        <h4 className="text-lg text-(--christmas-red)">Hvis noe er borte</h4>
        <p>{t(d.reserve)}</p>
      </details>
      <Vurder id={vid} />
    </section>
  );
}

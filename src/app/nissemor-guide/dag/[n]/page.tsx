"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { MediaListe, useMediaData } from "../../media/kort";
import type { dagInnhold } from "@/lib/guide-innhold";
import { Foreldredel } from "./foreldre";

type Dag = Awaited<ReturnType<typeof dagInnhold>>;

const box = "border-2 border-(--neon-green) bg-black p-3 sm:p-4 mb-4";
const knapp =
  "flex items-center justify-center min-h-11 min-w-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";

/** Hides the day's code in every text until «Vis fasit» is on. */
function skjul(tekst: string, kode: string | undefined, vis: boolean) {
  if (vis || !kode) return tekst;
  const esc = kode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tekst.replace(new RegExp(esc, "gi"), "•".repeat(kode.length));
}

const ren = (s: string) => s.replace(/\*\*/g, "").replace(/`/g, "");

function Seksjon({
  tittel,
  children,
}: {
  tittel: string;
  children: ReactNode;
}) {
  return (
    <section className={box}>
      <h2 className="text-2xl text-(--gold) mb-2">{tittel}</h2>
      {children}
    </section>
  );
}

function DagInnhold() {
  const n = Number(useParams<{ n: string }>().n);
  const [dag, setDag] = useState<Dag | null>(null);
  const [feil, setFeil] = useState(false);
  const [vis, setVis] = useState(false);
  const media = useMediaData();

  useEffect(() => {
    let aktiv = true;
    fetch(`/api/guide/dag/${n}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => aktiv && (setDag(d), setFeil(false), setVis(false)))
      .catch(() => aktiv && setFeil(true));
    return () => {
      aktiv = false;
    };
  }, [n]);

  // Content loads after the page, so the browser misses #kveld, #fasit and the like.
  useEffect(() => {
    if (dag && location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [dag]);

  const q = dag?.oppdrag;
  const t = (s: string | undefined | null) => skjul(ren(s ?? ""), q?.kode, vis);
  const ps: [string, string | undefined][] = q
    ? [
        ["PS", q.julius_ps],
        ["PS med bonus", q.julius_ps_bonus],
        ["PS når krypto mangler", q.julius_ps_krypto_mangler],
      ]
    : [];

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-3 sm:p-4 md:p-8">
      <GuideNavigation />
      <div className="max-w-4xl mx-auto text-lg">
        <nav aria-label="Dager" className="flex items-center gap-2 mb-3">
          <Link
            href={`/nissemor-guide/dag/${Math.max(1, n - 1)}`}
            aria-label="Forrige dag"
            className={knapp}
          >
            ‹
          </Link>
          <ol className="flex gap-1 overflow-x-auto flex-1 py-1">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => (
              <li key={d}>
                <Link
                  href={`/nissemor-guide/dag/${d}`}
                  aria-current={d === n ? "page" : undefined}
                  className={`${knapp} ${d === n ? "bg-(--gold) text-black border-(--gold)" : ""}`}
                >
                  {d}
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href={`/nissemor-guide/dag/${Math.min(24, n + 1)}`}
            aria-label="Neste dag"
            className={knapp}
          >
            ›
          </Link>
        </nav>

        {feil && <p className="text-(--christmas-red)">Fant ikke dagen.</p>}
        {!dag && !feil && <p>Laster …</p>}

        {dag && (
          <>
            <header className="border-4 border-(--neon-green) bg-black p-4 mb-4">
              <h1 className="text-3xl">
                Dag {n}: {q?.tittel}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setVis(!vis)}
                  className={`${knapp} ${vis ? "bg-(--gold) text-black" : ""}`}
                >
                  {vis ? "Skjul fasit" : "Vis fasit"}
                </button>
                <span>
                  Kode:{" "}
                  <strong className="text-(--gold)">
                    {vis ? q?.kode : "•".repeat(q?.kode.length ?? 0)}
                  </strong>
                </span>
              </div>
            </header>

            <Foreldredel n={n} t={t} />

            <h2 className="text-2xl text-(--gold) mt-8 mb-2">
              Manus og media for dagen
            </h2>
            <Seksjon tittel="Julius' video">
              <MediaListe paths={[dag.medier[0]]} data={media} />
              {dag.julius ? (
                <>
                  <p className="text-sm text-(--cold-blue) whitespace-pre-wrap mb-3">
                    {t(dag.julius.intro)}
                  </p>
                  <ol className="space-y-3">
                    {dag.julius.segmenter.map((s, i) => (
                      <li
                        key={i}
                        className="border border-(--neon-green)/40 p-2"
                      >
                        <p>
                          <span className="text-(--gold)">{i + 1}.</span> «
                          {t(s.replikk)}»
                        </p>
                        <p className="text-sm mt-1">
                          {s.ord} ord · {s.sek} s{s.laast && " · låst brikke"}
                          {s.varsler.length === 0 ? (
                            <span className="text-(--gold)">
                              {" "}
                              · innenfor budsjett
                            </span>
                          ) : (
                            <span className="text-(--christmas-red)">
                              {" "}
                              · {s.varsler.join("; ")}
                            </span>
                          )}
                        </p>
                        <p className="text-sm">Handling: {t(s.handling)}</p>
                        <p className="text-sm text-(--cold-blue)">
                          Kulde: {t(s.kulde)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p>Ikke noe manus for dagen.</p>
              )}
            </Seksjon>

            <Seksjon tittel="Rampenissens radio">
              <MediaListe paths={[dag.medier[1]]} data={media} />
              {dag.radio && (
                <dl className="space-y-2">
                  {[
                    ["Strek", dag.radio.strek],
                    ["Rekvisitter", q?.materialer_nødvendig.join(" · ")],
                    ["Introlinje", dag.radio.intro_hint],
                    ["Reaksjon", dag.radio.reaksjon_hint],
                    ["Lydregi", dag.radio.lydregi],
                    ["Klipp", dag.radio.klipp],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-(--gold)">{k}</dt>
                        <dd>{t(v)}</dd>
                      </div>
                    ))}
                </dl>
              )}
            </Seksjon>

            {q && (
              <>
                <Seksjon tittel="NisseMail">
                  <p className="whitespace-pre-wrap">{t(q.nissemail_tekst)}</p>
                </Seksjon>
                <Seksjon tittel="Julius' PS">
                  {ps
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <p key={k} className="mb-2">
                        <span className="text-(--gold)">{k}: </span>
                        {t(v)}
                      </p>
                    ))}
                </Seksjon>
                <Seksjon tittel="Varsler">
                  {dag.varsler.length === 0 && <p>Ingen.</p>}
                  {dag.varsler.map((a, i) => (
                    <p key={i}>{t(a.tekst)}</p>
                  ))}
                </Seksjon>
                <Seksjon tittel="Spor og brikke">
                  <p className="mb-2">
                    <span className="text-(--gold)">Rampestrek: </span>
                    {t(q.rampenissen_rampestrek)}
                  </p>
                  <p className="mb-2">
                    <span className="text-(--gold)">Fysisk spor: </span>
                    {t(q.fysisk_hint)}
                  </p>
                  <p className="text-sm">
                    Rom: {q.beste_rom} · Oppsett: {q.oppsett_tid}
                  </p>
                </Seksjon>
              </>
            )}

            <Seksjon tittel="Låses opp i dag">
              {dag.opplasinger.length === 0 && <p>Ingenting nytt.</p>}
              {dag.opplasinger.map((o, i) => (
                <p key={i} className="mb-1">
                  {t(o.tekst)}
                  {o.varsel && (
                    <span className="block text-sm text-(--cold-blue)">
                      {t(o.varsel)}
                    </span>
                  )}
                </p>
              ))}
            </Seksjon>

            {(dag.kapitler.length > 0 || dag.etapper.length > 0) && (
              <Seksjon tittel="Spill">
                {dag.kapitler.map((k) => (
                  <div key={k.n} className="mb-3">
                    <h3 className="text-(--gold)">
                      Ugleposten kapittel {k.n}: {k.tittel}
                      {!k.klar && " (skisse)"}
                    </h3>
                    {k.intro.map((l, i) => (
                      <p key={i}>{t(l)}</p>
                    ))}
                  </div>
                ))}
                {dag.etapper.map((e) => (
                  <div key={e.id} className="mb-3">
                    <h3 className="text-(--gold)">Sledeflukt: {e.navn}</h3>
                    <p>{t(e.intro)}</p>
                  </div>
                ))}
                <MediaListe paths={dag.medier.slice(2)} data={media} />
              </Seksjon>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DagSide() {
  return (
    <GuideAuth>
      <DagInnhold />
    </GuideAuth>
  );
}

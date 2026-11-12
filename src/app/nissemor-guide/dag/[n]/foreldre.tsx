"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game-engine";
import { utskriftHref, utskriftTittel } from "../../printout/filer";
import type { forSesongen, kveldDag } from "@/lib/guide-sesong";
import { Vurder } from "../../vurdering";
import { Avkrysning, useAvkrysning, useSynk } from "../../_kveld/felles";

const box =
  "border-2 border-(--neon-green) bg-black p-3 sm:p-4 mb-4 scroll-mt-4";
const knapp =
  "inline-flex items-center min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20";
const lenke = "underline inline-block py-3";

function Seksjon({
  id,
  tittel,
  farge = "border-(--neon-green)",
  children,
}: {
  id: string;
  tittel: string;
  farge?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${box} ${farge} space-y-2`}>
      <h2 className="text-2xl text-(--gold)">{tittel}</h2>
      {children}
    </section>
  );
}

const klokka = (iso: string) =>
  new Date(iso).toLocaleString("nb-NO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Morning status, answer, tonight's preparation and bonus for one day.
 * `t` hides the code until «Vis fasit» is on.
 */
export function Foreldredel({
  n,
  d,
  t,
  plan,
}: {
  n: number;
  d: ReturnType<typeof kveldDag>;
  t: (s: string) => string;
  /** Day 1 only: the build plan for 28.–30. November. */
  plan?: ReturnType<typeof forSesongen> | null;
}) {
  useSynk();
  const q = GameEngine.getAllQuests().find((x) => x.dag === n);
  const { krysset, veksle } = useAvkrysning(`kveld-${n}`);
  const [, setTikk] = useState(0);
  if (!d || !q) return null;
  const f = t;
  const dd = String(n).padStart(2, "0");

  const lost = GameEngine.isQuestCompleted(n);
  const nar = GameEngine.getSubmittedCodes().find((c) => c.day === n)?.dato;
  const feil = GameEngine.getFailedAttempts(n);
  const symbol = q.symbol_clue;
  const funnet =
    symbol &&
    GameEngine.getCollectedSymbols().some(
      (s) => s.symbolId === symbol.symbolId,
    );
  const bonus = q.bonusoppdrag;
  const bonusOk = GameEngine.isBonusOppdragCompleted(q);

  // Same strings as the house pieces in the Gåtekart, so H1… match.
  const hus = d.hus.map((x, i) => `H${i + 1}: ${x}`);
  const punkter = [
    ...(plan?.byggeplan.flatMap((b) =>
      b.steg.map(
        (st) =>
          `${b.tittel.split(" (")[0]}: ${st.tekst}${st.min !== "–" ? ` (${st.min} min)` : ""}`,
      ),
    ) ?? []),
    ...(plan?.runetavler ? [plan.runetavler] : []),
    ...d.utskrifter.map((u) => `Skriv ut ${utskriftTittel(u)}`),
    ...(d.reservesett
      ? [
          `Skriv ut reservesett: ${utskriftTittel(d.reservesett)} (i Nissemor-mappen; kortene brukes igjen senere)`,
        ]
      : []),
    `Finn fram: ${d.materialer}`,
    ...(d.iKveld ? [`I kveld: ${d.iKveld}`] : []),
    ...hus,
    "Sett rampestreken (se Rampestrek øverst)",
    ...(symbol ? [`Gjem symbolkortet: ${symbol.description}`] : []),
    "Les «Hvis noe er borte» under Hint i Gåtekartet",
    ...(plan?.morgen1 ? [plan.morgen1] : []),
  ];

  return (
    <>
      <Seksjon
        id="status"
        tittel="Status"
        farge={lost ? "border-(--gold)" : "border-(--cold-blue)"}
      >
        <p className="text-2xl">
          {lost ? (
            <span className="text-(--gold)">
              ✓ Løst{nar && ` ${klokka(nar)}`}
            </span>
          ) : (
            <span>Ikke løst ennå</span>
          )}
        </p>
        <p>
          Feil forsøk: {feil}
          {feil >= 3 && " (terminalen viser nå tipset fra Julius)"}
        </p>
        {symbol && (
          <p>
            Symbolkort ({symbol.description}):{" "}
            {funnet ? "funnet ✓" : "ikke skannet ennå"}
          </p>
        )}
        {bonus && (
          <p>
            Bonus ({bonus.tittel}): {bonusOk ? "godkjent ✓" : "ikke godkjent"}{" "}
            <a href="#bonus" className={lenke}>
              til bonus
            </a>
          </p>
        )}
      </Seksjon>

      <Seksjon id="fasit" tittel="Fasit" farge="border-(--gold)">
        <p>
          <b>Kode:</b> <span className="text-(--gold)">{f(q.kode)}</span>
        </p>
        <p>{f(d.mekanikk)}</p>
        <p>
          <b>I huset:</b> {f(d.brikkeH)}
        </p>
        <p>
          <b>Fra Julius:</b> {f(d.brikkeS)}
        </p>
      </Seksjon>

      <Seksjon id="kveld" tittel={`I kveld: klar til dag ${n}`}>
        {d.utskrifter.length > 0 && (
          <div className="border-2 border-(--gold) p-3">
            <h3 className="text-xl text-(--gold)">Skriv ut i kveld</h3>
            <ul className="list-disc pl-6">
              {d.utskrifter.map((u) => (
                <li key={u}>
                  <Link href={utskriftHref(u)} className={lenke}>
                    {utskriftTittel(u)}
                  </Link>
                </li>
              ))}
              {d.reservesett && (
                <li>
                  <Link href={utskriftHref(d.reservesett)} className={lenke}>
                    Skriv ut reservesett: {utskriftTittel(d.reservesett)}
                  </Link>
                </li>
              )}
            </ul>
            <p>{f(d.utskrifterTekst)}</p>
          </div>
        )}
        <h3 className="text-xl text-(--gold)">Sjekkliste</h3>
        <p>Avkrysningen deles med den andre forelderen.</p>
        <Avkrysning punkter={punkter} krysset={krysset} veksle={veksle} />
        <h3 className="text-xl text-(--gold)">Gåten ({d.oppsett})</h3>
        <p>
          <b>Gjør i kveld:</b> {f(d.iKveld)}
        </p>
        <p>
          <b>Materialer:</b> {f(d.materialer)}
        </p>
        {symbol && (
          <>
            <h3 className="text-xl text-(--gold)">Symbolkort</h3>
            <p>
              Gjem {symbol.description} der barna finner det i morgen.{" "}
              <Link href="/nissemor-guide/symboler" className={lenke}>
                Skriv ut symbolkort
              </Link>
            </p>
          </>
        )}
        <Vurder id={`dag/${dd}/kveld`} />
      </Seksjon>

      {bonus && (
        <Seksjon id="bonus" tittel={`Bonus: ${bonus.tittel}`}>
          <p>{bonus.fysisk_oppgave}</p>
          <p>
            Godkjenn når dere har sett det barna har laget. Bonusen gir ingen
            merke, bare −20 % frost og en ekstra setning i Julius&apos; PS.
          </p>
          {!lost && <p>Barna må løse dagens kode før bonusen teller.</p>}
          {bonusOk ? (
            <>
              <p className="text-(--gold)">✓ {bonus.belønning_tekst}</p>
              <button
                type="button"
                className={knapp}
                onClick={() => {
                  GameEngine.revokeBonusOppdrag(n);
                  setTikk((x) => x + 1);
                }}
              >
                Angre godkjenning
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={!lost}
              className={`${knapp} disabled:opacity-60`}
              onClick={() => {
                GameEngine.completeBonusOppdrag(n);
                setTikk((x) => x + 1);
              }}
            >
              Godkjenn bonusen
            </button>
          )}
        </Seksjon>
      )}
    </>
  );
}

/** Tonight's prank, first on the page. */
export function Rampestrek({
  n,
  d,
  t,
}: {
  n: number;
  d: ReturnType<typeof kveldDag>;
  t: (s: string) => string;
}) {
  if (!d) return null;
  return (
    <Seksjon
      id="rampestrek"
      tittel={`Rampestrek (${d.strek.minutter} min, ${d.strek.type})`}
    >
      <p>{t(d.strek.tekst)}</p>
      <p>
        <b>Materialer:</b> {d.strek.materialer}
      </p>
      <p>
        <b>Bærer dagens brikke:</b> {d.strek.brikke}
      </p>
      <Vurder id={`dag/${String(n).padStart(2, "0")}/rampestrek`} />
    </Seksjon>
  );
}

"use client";

import { LysbordBilde } from "../../lysbord";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { GameEngine } from "@/lib/game-engine";
import type { kveldDag } from "@/lib/guide-sesong";
import { Vurder } from "../../vurdering";
import {
  Avkrysning,
  medUtskrifter,
  useAvkrysning,
  useSynk,
} from "../../_kveld/felles";
import { medVarer, useHandlet } from "../../_kveld/handel";

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
  bareKveld,
  kode = "",
}: {
  n: number;
  /** The day code, from the parent-only /api/guide/dag/N. */
  kode?: string;
  d: ReturnType<typeof kveldDag>;
  t: (s: string) => string;
  /** Gjennomgang: tonight's checklist only. */
  bareKveld?: boolean;
}) {
  useSynk();
  const q = GameEngine.getAllQuests().find((x) => x.dag === n);
  const { krysset, veksle } = useAvkrysning(`kveld-${n}`);
  const handlet = useHandlet();
  const [, setTikk] = useState(0);
  if (!d || !q) return null;
  const merk = medVarer(d.varer, handlet);
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

  return (
    <>
      {!bareKveld && (
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
      )}
      {!bareKveld && (
        <Seksjon id="fasit" tittel="Fasit" farge="border-(--gold)">
          <p>
            <b>Kode:</b> <span className="text-(--gold)">{f(kode)}</span>
          </p>
          <p>{f(d.mekanikk)}</p>
          <p>
            <b>I huset:</b> {f(d.brikkeH)}
          </p>
          <p>
            <b>Fra Julius:</b> {f(d.brikkeS)}
          </p>
        </Seksjon>
      )}

      <Seksjon id="kveld" tittel={`I kveld: klar til dag ${n}`}>
        <p>Avkrysningen deles med den andre forelderen.</p>
        <Avkrysning
          punkter={d.sjekkliste}
          krysset={krysset}
          veksle={veksle}
          vis={medUtskrifter((s) => merk(f(s)))}
        />
        {n === 1 && (
          <p>
            Byggeplanen 28.–30. november:{" "}
            <Link href="/nissemor-guide/forberedelser" className={lenke}>
              se Før sesongen
            </Link>
          </p>
        )}
        <h3 className="text-xl text-(--gold)">Trenger ({d.oppsett})</h3>
        <p>
          <b>Materialer:</b> {merk(f(d.materialer))}
        </p>
        <p>
          <b>Utskrifter:</b> {f(d.utskrifterTekst)}
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

      {bonus && !bareKveld && (
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
  gjennomgang,
}: {
  n: number;
  d: ReturnType<typeof kveldDag>;
  t: (s: string) => string;
  /** Review view: title, scene and checklist, and no sketch here when the comparison shows it. */
  gjennomgang?: { medVersjoner: boolean };
}) {
  const handlet = useHandlet();
  if (!d) return null;
  return (
    <Seksjon
      id="rampestrek"
      tittel={`Rampestrek (${d.strek.minutter} min, ${d.strek.type})`}
    >
      {/* Sketch floats right of the text on desktop; on a phone it sits small under it */}
      <div className="flex flex-col gap-4 md:flow-root">
        {!gjennomgang?.medVersjoner && (
          <Skisse key={n} n={n} mangler={!!gjennomgang} />
        )}
        <div className="space-y-2">
          {gjennomgang && (
            <>
              <p className="text-(--gold)">{d.strek.tittel}</p>
              <p>
                <b>Tegnbar:</b> {d.strek.tegnbar}
              </p>
              <p>
                <b>Sjekkliste:</b> {d.strek.sjekk}
              </p>
            </>
          )}
          <p>{t(d.strek.tekst)}</p>
          <p>
            <b>Materialer:</b> {medVarer(d.varer, handlet)(d.strek.materialer)}
          </p>
          <p>
            {d.strek.brikke.startsWith("ja") ? (
              <>
                <b>Gåten ligger i rampestreken:</b>{" "}
                {d.strek.brikke.match(/\((.+)\)/)?.[1]}
              </>
            ) : (
              <b>Gåten ligger et annet sted: se Gåtekart</b>
            )}
          </p>
          <p>
            <Link
              href="/nissemor-guide/printout/rampestreker"
              className="underline min-h-11 inline-flex items-center"
            >
              Alle skissene på ett ark (til deling)
            </Link>
          </p>
        </div>
      </div>
      <Vurder id={`dag/${String(n).padStart(2, "0")}/rampestrek`} />
    </Seksjon>
  );
}

/** strek/dagNN.png from MEDIA_DIR (assets/medier.json); nothing while it doesn't exist. */
function Skisse({ n, mangler }: { n: number; mangler?: boolean }) {
  const [finnes, setFinnes] = useState(true);
  const dd = String(n).padStart(2, "0");
  const src = `/media/strek/dag${dd}.png`;
  if (!finnes)
    return mangler ? (
      <div className="order-last md:float-right md:ml-4 md:w-72 border-2 border-(--christmas-red) p-2 text-base">
        <p className="text-(--christmas-red)">Skisse mangler</p>
        <p className="break-all">strek/dag{dd}</p>
        <code className="break-all text-(--cold-blue)">
          python3 assets/bin/generer.py kjør --bare strek/dag{dd} --force
        </code>
      </div>
    ) : null;
  return (
    <div className="order-last w-40 md:float-right md:mb-2 md:ml-4 md:w-60">
      <LysbordBilde
        gruppe="skisser"
        src={src}
        alt="Skisse av rampestreken"
        className="aspect-square w-full border border-(--neon-green) bg-white"
        onError={() => setFinnes(false)}
      />
    </div>
  );
}

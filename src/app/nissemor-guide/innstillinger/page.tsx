"use client";

import { useEffect, useState } from "react";
import { useGuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideSettings } from "@/components/nissemor/GuideSettings";
import { GameEngine } from "@/lib/game-engine";
import {
  getCurrentDay,
  getCurrentMonth,
  isTimeMachineEnabled,
} from "@/lib/date-utils";
import { sim } from "@/lib/simulation";
import { GuideSide, Kort } from "../_kveld/felles";
import { settVisVurdering, useVisVurdering } from "../vurdering";

function VisVurdering() {
  const på = useVisVurdering();
  return (
    <label className="flex items-center gap-2 min-h-11">
      <input
        type="checkbox"
        className="w-6 h-6 accent-(--gold)"
        checked={på}
        onChange={(e) => settVisVurdering(e.target.checked)}
      />
      Vis vurdering: statuscellene og lenkene til Gjennomgang på foreldresidene
      (bare denne skjermen)
    </label>
  );
}

function Feilforsok() {
  const dag =
    getCurrentMonth() === 12 && getCurrentDay() <= 24 ? getCurrentDay() : null;
  const [antall, setAntall] = useState(() =>
    dag ? GameEngine.getFailedAttempts(dag) : 0,
  );
  if (!dag) return <p>Ingen luke i dag.</p>;
  return (
    <>
      <p>
        Feil koder i dag (dag {dag}): {antall}. Etter tre feil viser terminalen
        et tips fra Julius.
      </p>
      <button
        onClick={() => {
          GameEngine.resetFailedAttempts(dag);
          setAntall(0);
        }}
        className="px-4 min-h-11 border-2 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue)/20"
      >
        Nullstill feilforsøk
      </button>
    </>
  );
}

function Varsler() {
  const [kanaler, setKanaler] = useState<string[] | null>(null);
  useEffect(() => {
    fetch("/api/varsler")
      .then((r) => (r.ok ? r.json() : { channels: [] }))
      .then((d) => setKanaler(d.channels ?? []))
      .catch(() => setKanaler([]));
  }, []);
  if (!kanaler) return null;
  return (
    <p>Varsler: {kanaler.length ? kanaler.join(", ") : "ingen kanaler på"}.</p>
  );
}

const knapp =
  "px-4 min-h-11 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20";
const felt =
  "bg-black border border-(--neon-green) text-(--neon-green) min-h-11 px-2";

function Nullstill() {
  const [sikker, setSikker] = useState(false);
  const [ferdig, setFerdig] = useState(false);
  if (ferdig)
    return <p className="text-(--gold)">All fremdrift er nullstilt.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="px-4 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
        onClick={async () => {
          if (!sikker) return setSikker(true);
          await sim.reset();
          setFerdig(true);
        }}
      >
        {sikker ? "Ja, nullstill alt" : "Nullstill all fremdrift"}
      </button>
      {sikker && (
        <button className={knapp} onClick={() => setSikker(false)}>
          Avbryt
        </button>
      )}
      <p className="w-full">
        Gjelder alle skjermer for hele familien. Innlogging og klokkeslett
        beholdes.
      </p>
    </div>
  );
}

function Simulering() {
  const [dag, setDag] = useState(() => Math.min(24, getCurrentDay()));
  const [tid, setTid] = useState("08:00");
  const [bonus, setBonus] = useState(false);
  const [bilde, setBilde] = useState("");
  const [melding, setMelding] = useState("");

  const kjør = async (fn: () => unknown, tekst: string) => {
    try {
      await fn();
      setMelding(tekst);
    } catch (e) {
      setMelding(`Feil: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={dag}
          onChange={(e) => setDag(Number(e.target.value))}
          className={felt}
          aria-label="Dag"
        >
          {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}. des
            </option>
          ))}
        </select>
        <input
          type="time"
          value={tid}
          onChange={(e) => setTid(e.target.value)}
          className={felt}
          aria-label="Klokkeslett"
        />
        <button
          className={knapp}
          onClick={() =>
            kjør(() => sim.goTo(dag, tid), `Hoppet til ${dag}. des kl. ${tid}.`)
          }
        >
          Hopp hit
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            className="w-6 h-6 accent-(--gold)"
            checked={bonus}
            onChange={(e) => setBonus(e.target.checked)}
          />
          Ta med bonusoppdrag
        </label>
        <button
          className={knapp}
          onClick={() =>
            kjør(() => sim.solveUntil(dag, { bonus }), `Løste dag 1–${dag}.`)
          }
        >
          Løs alle dager til og med dag {dag}
        </button>
        <button
          className={knapp}
          onClick={() =>
            kjør(() => sim.skipWeek({ bonus }), "Spolte en uke fram.")
          }
        >
          Spol en uke
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        Frost i dag:
        {(["på", "av", "nødstopp"] as const).map((f) => (
          <button
            key={f}
            className={knapp}
            onClick={() =>
              kjør(
                () => sim.setFrost(f),
                f === "nødstopp"
                  ? "Klokka er satt til 20:00, frosten slipper."
                  : `Frost ${f}.`,
              )
            }
          >
            {f === "nødstopp" ? "Nødstopp 20:00" : f === "på" ? "På" : "Av"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={knapp}
            onClick={() =>
              kjør(
                () => setBilde(sim.exportSnapshot()),
                "Øyeblikksbildet er lagret i feltet under. Kopier det.",
              )
            }
          >
            Ta øyeblikksbilde
          </button>
          <button
            className={knapp}
            onClick={() =>
              kjør(
                () => sim.importSnapshot(bilde),
                "Øyeblikksbildet er gjenopprettet.",
              )
            }
          >
            Gjenopprett
          </button>
        </div>
        <textarea
          value={bilde}
          onChange={(e) => setBilde(e.target.value)}
          rows={3}
          className="w-full bg-black border border-(--neon-green) text-(--neon-green) p-2 text-sm"
          aria-label="Øyeblikksbilde (JSON)"
        />
      </div>
      <button
        className={knapp}
        onClick={() =>
          kjør(GameEngine.resetAllBadges, "Alle merker er fjernet.")
        }
      >
        Fjern alle merker
      </button>
      {melding && <p className="text-(--gold)">{melding}</p>}
    </div>
  );
}

function LoggUt() {
  const { logout } = useGuideAuth();
  return (
    <button
      onClick={logout}
      className="px-4 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
    >
      Logg ut
    </button>
  );
}

export default function InnstillingerSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        INNSTILLINGER
      </h1>
      <GuideSettings />
      <Varsler />
      <Kort tittel="Vurdering">
        <VisVurdering />
      </Kort>
      <Kort tittel="Feil koder" farge="border-(--cold-blue)">
        <Feilforsok />
      </Kort>
      <Kort tittel="Ny sesong" farge="border-(--christmas-red)">
        <Nullstill />
      </Kort>
      {isTimeMachineEnabled() && (
        <details className="border-4 border-(--neon-green) p-4">
          <summary className="min-h-11 flex items-center cursor-pointer text-2xl font-bold text-(--gold)">
            Simulering (testmodus)
          </summary>
          <Simulering />
        </details>
      )}
      <LoggUt />
    </GuideSide>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { GuideSettings } from "@/components/nissemor/GuideSettings";
import { GameEngine } from "@/lib/game-engine";
import {
  getCurrentDay,
  getCurrentMonth,
  isTimeMachineEnabled,
} from "@/lib/date-utils";
import { sim } from "@/lib/simulation";
import { GuideSide, Kort } from "../_kveld/felles";

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

const knapp =
  "px-4 min-h-11 border-2 border-(--neon-green) text-(--neon-green) hover:bg-(--neon-green)/20";
const felt =
  "bg-black border border-(--neon-green) text-(--neon-green) min-h-11 px-2";

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
      {!isTimeMachineEnabled() && (
        <p className="text-(--christmas-red)">
          Tidsmaskinen er av i denne bygget (krever next dev eller
          NEXT_PUBLIC_TEST_MODE=true). Dag og klokkeslett virker ikke.
        </p>
      )}
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
          className="w-full bg-black border border-(--neon-green) text-(--neon-green) p-2 text-xs"
          aria-label="Øyeblikksbilde (JSON)"
        />
      </div>
      <button
        className="px-4 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20"
        onClick={() => {
          if (confirm("Nullstille all fremdrift? Klokkeslettet beholdes.")) {
            kjør(sim.reset, "All fremdrift er nullstilt.");
          }
        }}
      >
        Nullstill all fremdrift
      </button>
      {melding && <p className="text-(--gold)">{melding}</p>}
    </div>
  );
}

export default function InnstillingerSide() {
  return (
    <GuideSide>
      <h1 className="text-4xl font-bold text-(--gold) text-center">
        INNSTILLINGER
      </h1>
      <GuideSettings />
      <Kort tittel="Feil koder" farge="border-(--cold-blue)">
        <Feilforsok />
      </Kort>
      <Kort tittel="Simulering">
        <Simulering />
      </Kort>
      <Kort tittel="Mer">
        <ul className="list-disc pl-6">
          <li>
            <Link href="/nissemor-guide/merker" className="underline">
              Merker
            </Link>
          </li>
          <li>
            <Link href="/nissemor-guide/symboler" className="underline">
              Symbolkort med QR-koder
            </Link>
          </li>
        </ul>
      </Kort>
    </GuideSide>
  );
}

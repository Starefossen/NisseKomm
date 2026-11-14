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
import { PushVarsler } from "./push";
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

function Arkiver() {
  const [melding, setMelding] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={knapp}
        onClick={async () => {
          const r = await fetch("/api/state/arkiv", { method: "POST" });
          const d = await r.json().catch(() => ({}));
          setMelding(
            !r.ok
              ? `Feil: ${d.error ?? r.status}`
              : d.arkivert
                ? `Arkivert ${new Date(d.arkivert).toLocaleString("nb-NO")} (${d.nøkler} nøkler).`
                : "Ingenting å arkivere ennå.",
          );
        }}
      >
        Arkiver sesongen nå
      </button>
      {melding && <p className="w-full">{melding}</p>}
      <p className="w-full">
        Tar en kopi av hele familiens fremdrift (brev, rekorder, merker,
        Ugleposten) på serveren. Nullstilling og nytt sesongår gjør det av seg
        selv.
      </p>
    </div>
  );
}

type Kopi = {
  id: number;
  sesong: number;
  grunn: string;
  arkivert: string;
  nøkler: number;
  brev: number;
};
const GJENOPPRETT = "GJENOPPRETT";

function Gjenopprett() {
  const [liste, setListe] = useState<Kopi[] | null>(null);
  const [valgt, setValgt] = useState<number | null>(null);
  const [ord, setOrd] = useState("");
  const [melding, setMelding] = useState("");
  const hent = () =>
    fetch("/api/state/gjenopprett")
      .then((r) => (r.ok ? r.json() : []))
      .then(setListe)
      .catch(() => setListe([]));
  if (!liste)
    return (
      <button className={knapp} onClick={hent}>
        Vis arkivkopier
      </button>
    );
  return (
    <div className="space-y-2 mt-4">
      {!liste.length && <p>Ingen kopier i arkivet ennå.</p>}
      <ul className="space-y-1">
        {liste.map((k) => (
          <li key={k.id}>
            <label className="flex items-center gap-2 min-h-11">
              <input
                type="radio"
                name="kopi"
                className="w-6 h-6 accent-(--gold)"
                checked={valgt === k.id}
                onChange={() => setValgt(k.id)}
              />
              {new Date(k.arkivert).toLocaleString("nb-NO")} · {k.grunn} ·
              sesong {k.sesong} · {k.nøkler} nøkler · {k.brev} brev
            </label>
          </li>
        ))}
      </ul>
      {valgt != null && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={ord}
            onChange={(e) => setOrd(e.target.value)}
            className={felt}
            aria-label={`Skriv ${GJENOPPRETT} for å bekrefte`}
            placeholder={GJENOPPRETT}
          />
          <button
            className="px-4 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20 disabled:opacity-40"
            disabled={ord.trim().toUpperCase() !== GJENOPPRETT}
            onClick={async () => {
              const r = await fetch("/api/state/gjenopprett", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: valgt, bekreft: GJENOPPRETT }),
              });
              const d = await r.json().catch(() => ({}));
              setMelding(
                r.ok
                  ? "Gjenopprettet. Dagens fremdrift ligger som egen kopi i arkivet. Last inn skjermene på nytt."
                  : `Feil: ${d.error ?? r.status}`,
              );
              setOrd("");
              hent();
            }}
          >
            Gjenopprett denne kopien
          </button>
        </div>
      )}
      {melding && <p>{melding}</p>}
      <p>
        Erstatter all fremdrift, løste koder også, med kopien du velger.
        Serveren tar først en kopi av dagens fremdrift, så du kan angre. Skriv{" "}
        {GJENOPPRETT} for å bekrefte.
      </p>
    </div>
  );
}

const BEKREFT = "NULLSTILL";

function Nullstill() {
  const [sikker, setSikker] = useState(false);
  const [ord, setOrd] = useState("");
  const [ferdig, setFerdig] = useState(false);
  const [feil, setFeil] = useState("");
  if (ferdig)
    return (
      <p className="text-(--gold)">
        All fremdrift er nullstilt. En kopi ligger i arkivet.
      </p>
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sikker && (
        <input
          value={ord}
          onChange={(e) => setOrd(e.target.value)}
          className={felt}
          aria-label={`Skriv ${BEKREFT} for å bekrefte`}
          placeholder={BEKREFT}
          autoFocus
        />
      )}
      <button
        className="px-4 min-h-11 border-2 border-(--christmas-red) text-(--christmas-red) hover:bg-(--christmas-red)/20 disabled:opacity-40"
        disabled={sikker && ord.trim().toUpperCase() !== BEKREFT}
        onClick={async () => {
          if (!sikker) return setSikker(true);
          try {
            await sim.reset();
            setFerdig(true);
          } catch (e) {
            setFeil((e as Error).message);
          }
        }}
      >
        {sikker ? "Ja, nullstill alt" : "Nullstill all fremdrift"}
      </button>
      {sikker && (
        <button
          className={knapp}
          onClick={() => {
            setSikker(false);
            setOrd("");
          }}
        >
          Avbryt
        </button>
      )}
      {feil && <p className="w-full text-(--christmas-red)">{feil}</p>}
      <p className="w-full">
        Gjelder alle skjermer for hele familien. Serveren arkiverer alt først.
        Innlogging og klokkeslett beholdes.
        {sikker && ` Skriv ${BEKREFT} for å bekrefte.`}
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

type Klientfeil = {
  tid: string;
  rolle: string;
  melding: string;
  rute: string;
  ua: string;
};

/** Errors the screens sent to /api/klientfeil, newest first. */
function FeilFraSkjermene() {
  const [feil, setFeil] = useState<Klientfeil[] | null>(null);
  useEffect(() => {
    fetch("/api/klientfeil")
      .then((r) => (r.ok ? r.json() : []))
      .then(setFeil)
      .catch(() => setFeil([]));
  }, []);
  if (!feil) return <p>Henter …</p>;
  if (!feil.length) return <p>Ingen feil meldt.</p>;
  return (
    <ul className="flex flex-col gap-2 text-lg">
      {feil.slice(0, 30).map((f, i) => (
        <li key={i} className="border-b border-(--neon-green)/30 pb-1">
          <span className="text-(--gold)">
            {new Date(f.tid).toLocaleString("nb-NO", {
              timeZone: "Europe/Oslo",
            })}
          </span>{" "}
          {f.rolle === "kid" ? "barn" : "forelder"} · {f.rute}
          <div className="break-words">{f.melding}</div>
          <div className="opacity-60 text-sm break-words">{f.ua}</div>
        </li>
      ))}
    </ul>
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
      <Kort tittel="Varsler på telefonen" farge="border-(--gold)">
        <PushVarsler />
      </Kort>
      <Kort tittel="Vurdering">
        <VisVurdering />
      </Kort>
      <Kort tittel="Feil koder" farge="border-(--cold-blue)">
        <Feilforsok />
      </Kort>
      <Kort tittel="Feil fra skjermene" farge="border-(--christmas-red)">
        <FeilFraSkjermene />
      </Kort>
      <Kort tittel="Arkiv" farge="border-(--gold)">
        <Arkiver />
        <Gjenopprett />
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

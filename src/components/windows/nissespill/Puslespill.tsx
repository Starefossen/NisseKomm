"use client";

import { useEffect, useRef, useState } from "react";
import { SoundManager } from "@/lib/sounds";
import { mediaUrl } from "@/lib/media";
import * as P from "./minispill";

const KNAPP =
  "min-h-11 min-w-11 px-2 rounded border-2 text-lg active:scale-95 motion-reduce:active:scale-100 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)";

type Props<T> = { p: T; lost: () => void };

function Laas({ p, lost }: Props<P.PuslespillDef & { type: "laas" }>) {
  const [st, setSt] = useState(() => p.hjul.map(() => 0));
  const drei = (i: number, d: 1 | -1) => {
    SoundManager.playSound("click");
    const ny = P.laasDrei(p, st, i, d);
    setSt(ny);
    if (P.laasApen(p, ny)) lost();
  };
  return (
    <div className="flex gap-2 justify-center">
      {p.hjul.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <button
            type="button"
            aria-label={`Hjul ${i + 1} opp`}
            className={`${KNAPP} border-(--brass)`}
            onClick={() => drei(i, -1)}
          >
            ▲
          </button>
          <div
            aria-live="polite"
            aria-label={`Hjul ${i + 1}`}
            className="w-12 h-14 flex items-center justify-center border-2 border-(--gold) text-4xl text-(--gold) bg-black"
          >
            {h[st[i]]}
          </div>
          <button
            type="button"
            aria-label={`Hjul ${i + 1} ned`}
            className={`${KNAPP} border-(--brass)`}
            onClick={() => drei(i, 1)}
          >
            ▼
          </button>
        </div>
      ))}
    </div>
  );
}

// Tiles survive Avbryt and scene changes while the page lives (keyed by the puzzle's flag).
const SKYV = new Map<string, number[]>();

function Skyv({ p, lost }: Props<P.PuslespillDef & { type: "skyv" }>) {
  const [st, setStRaw] = useState(
    () => SKYV.get(p.flagg) ?? P.skyvStokk(p.trekk, p.seed),
  );
  const setSt = (ny: number[]) => {
    SKYV.set(p.flagg, ny);
    setStRaw(ny);
  };
  return (
    <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
      {st.map((v, i) => (
        <button
          key={i}
          type="button"
          aria-label={v === P.HULL ? "Tomt felt" : `Brikke ${v + 1}`}
          disabled={v === P.HULL}
          onClick={() => {
            const ny = P.skyvFlytt(st, i);
            if (ny === st) return SoundManager.playSound("error");
            SoundManager.playSound("click");
            setSt(ny);
            if (P.skyvLost(ny)) lost();
          }}
          className={`w-16 h-16 md:w-20 md:h-20 border-2 text-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold) ${v === P.HULL ? "border-transparent" : "border-(--brass) text-(--gold) bg-black"}`}
          style={
            p.bilde && v !== P.HULL
              ? {
                  backgroundImage: `url(${mediaUrl(p.bilde)})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${(v % 3) * 50}% ${Math.floor(v / 3) * 50}%`,
                }
              : undefined
          }
        >
          {!p.bilde && v !== P.HULL ? v + 1 : ""}
        </button>
      ))}
    </div>
  );
}

/** Short blip whose pitch and loudness rise with the signal. */
function blipp(styrke: number) {
  const ctx = SoundManager.isEnabled() ? SoundManager.context() : null;
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = styrke > 0.9 ? "sine" : "sawtooth";
  o.frequency.value = 180 + 700 * styrke;
  g.gain.setValueAtTime(0.03 + 0.1 * styrke, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.08);
}

function Radio({ p, lost }: Props<P.PuslespillDef & { type: "radio" }>) {
  const [v, setV] = useState(p.min);
  const [sus, setSus] = useState("");
  const styrke = P.radioSignal(p, v);
  const steg = p.steg ?? 1;
  const desimaler = steg < 1 ? 1 : 0;
  const still = (n: number) => {
    // Round away float drift from repeated ±steg
    const r = Math.min(p.max, Math.max(p.min, Math.round(n / steg) * steg));
    setV(r);
    setSus("");
    blipp(P.radioSignal(p, r));
  };
  return (
    <div className="space-y-3 max-w-md mx-auto">
      <div className="flex items-end justify-between gap-3">
        <span className="text-4xl text-(--gold) tabular-nums">
          {v.toFixed(desimaler)} {p.enhet ?? ""}
        </span>
        <span aria-label="Signalstyrke" className="flex items-end gap-1 h-10">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((t, i) => (
            <span
              key={t}
              className={`w-2 ${styrke >= t ? "bg-(--gold)" : "bg-(--brass)/30"}`}
              style={{ height: `${(i + 1) * 20}%` }}
            />
          ))}
        </span>
      </div>
      {/* Nudge buttons: a finger on an iPad slider cannot hit a 0.1 step */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Litt ned"
          className={`${KNAPP} border-(--brass)`}
          onClick={() => still(v - steg)}
        >
          −
        </button>
        <input
          type="range"
          aria-label="Frekvens"
          min={p.min}
          max={p.max}
          step={steg}
          value={v}
          onChange={(e) => still(Number(e.target.value))}
          className="flex-1 h-11 accent-(--gold)"
        />
        <button
          type="button"
          aria-label="Litt opp"
          className={`${KNAPP} border-(--brass)`}
          onClick={() => still(v + steg)}
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`${KNAPP} border-(--gold) text-(--gold)`}
          onClick={() => {
            if (P.radioInne(p, v)) return lost();
            SoundManager.playSound("error");
            const d = p.maal - v;
            setSus(
              Math.abs(d) <= 1
                ? `Nesten! Litt ${d > 0 ? "opp" : "ned"}.`
                : "Bare sus.",
            );
          }}
        >
          LÅS FREKVENS
        </button>
        {sus && <span className="text-lg text-(--cold-blue)">{sus}</span>}
      </div>
    </div>
  );
}

const STREK = ["M8 0V8", "M8 8H16", "M8 8V16", "M0 8H8"];

function Rute({ p, lost }: Props<P.PuslespillDef & { type: "rute" }>) {
  const w = p.rutenett[0].length;
  const [rot, setRot] = useState(() =>
    p.rutenett
      .join("")
      .split("")
      .map((_, i) => p.start?.[i] ?? 0),
  );
  return (
    <div
      className="grid gap-1 w-fit mx-auto"
      style={{ gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))` }}
    >
      {p.rutenett
        .join("")
        .split("")
        .map((t, i) => {
          const fast = t === "S" || t === "M" || t === ".";
          const a = P.ruteAapninger(t, rot[i]);
          return (
            <button
              key={i}
              type="button"
              disabled={fast}
              aria-label={
                t === "S"
                  ? "Start"
                  : t === "M"
                    ? "Mål"
                    : t === "."
                      ? "Tomt"
                      : `Brikke ${i + 1}, drei`
              }
              onClick={() => {
                SoundManager.playSound("click");
                const ny = rot.map((r, j) => (j === i ? (r + 1) % 4 : r));
                setRot(ny);
                if (P.ruteKoblet(p, ny)) lost();
              }}
              className="w-14 h-14 md:w-16 md:h-16 border-2 border-(--brass) bg-black flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--gold)"
            >
              {t === "S" || t === "M" ? (
                <span className="text-2xl text-(--gold)">{t}</span>
              ) : (
                <svg viewBox="0 0 16 16" className="w-full h-full" aria-hidden>
                  {STREK.map((d, k) =>
                    a & (1 << k) ? (
                      <path
                        key={k}
                        d={d}
                        stroke="var(--neon-green)"
                        strokeWidth="3"
                        strokeLinecap="square"
                      />
                    ) : null,
                  )}
                </svg>
              )}
            </button>
          );
        })}
    </div>
  );
}

/**
 * Overlay for one mini-puzzle; Escape or AVBRYT leaves without solving. After
 * the last tip level Rampenissen offers to place the last piece (solves it).
 */
export function Puslespill({
  p,
  onLost,
  onAvbryt,
  onTips,
}: {
  p: P.PuslespillDef;
  onLost: () => void;
  onAvbryt: () => void;
  onTips: () => { tekst: string; siste?: boolean };
}) {
  const [tips, setTips] = useState<{ tekst: string; siste?: boolean } | null>(
    null,
  );
  const [lost, setLost] = useState(false);
  // Refs so parent re-renders neither re-subscribe Escape nor restart the LØST beat
  const avbryt = useRef(onAvbryt);
  const ferdigRef = useRef(onLost);
  useEffect(() => {
    avbryt.current = onAvbryt;
    ferdigRef.current = onLost;
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && avbryt.current();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  // A beat to see the solved state before the overlay closes
  useEffect(() => {
    if (!lost) return;
    const t = setTimeout(() => ferdigRef.current(), 700);
    return () => clearTimeout(t);
  }, [lost]);
  const ferdig = () => {
    SKYV.delete(p.flagg);
    setLost(true);
  };

  return (
    <div
      role="dialog"
      aria-label={p.tittel}
      className="absolute inset-0 z-20 bg-black/90 overflow-y-auto p-3 flex flex-col gap-3"
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      <div className="flex items-center gap-2 border-b-2 border-(--brass) pb-2">
        <h3 className="flex-1 text-2xl text-(--gold) tracking-wider uppercase">
          {p.tittel}
        </h3>
        <button
          type="button"
          className={`${KNAPP} border-(--gold) text-(--gold)`}
          onClick={() => setTips(onTips())}
        >
          TIPS
        </button>
        <button
          type="button"
          className={`${KNAPP} border-(--brass)`}
          onClick={onAvbryt}
        >
          Avbryt
        </button>
      </div>
      <div
        className={`flex-1 flex flex-col justify-center ${lost ? "pointer-events-none" : ""}`}
      >
        {p.type === "laas" && <Laas p={p} lost={ferdig} />}
        {p.type === "skyv" && <Skyv p={p} lost={ferdig} />}
        {p.type === "radio" && <Radio p={p} lost={ferdig} />}
        {p.type === "rute" && <Rute p={p} lost={ferdig} />}
      </div>
      {lost && (
        <p className="text-center text-2xl text-(--gold) motion-safe:animate-pulse">
          LØST
        </p>
      )}
      {tips && !lost && (
        <div className="space-y-2">
          <p className="text-xl leading-tight text-(--cold-blue)">
            {tips.tekst}
          </p>
          {tips.siste && (
            <button
              type="button"
              className={`${KNAPP} border-(--gold) text-(--gold)`}
              onClick={ferdig}
            >
              La Rampenissen ta den siste biten
            </button>
          )}
        </div>
      )}
    </div>
  );
}

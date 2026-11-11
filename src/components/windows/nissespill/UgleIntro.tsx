"use client";

import { useEffect, useRef, useState } from "react";
import { SoundManager } from "@/lib/sounds";
import { mediaUrl } from "@/lib/media";
import type { Kapittel } from "./motor";

/** Brass-framed pixel portrait; the name's initial until the file exists. */
export function Portrett({ navn, stor }: { navn: string; stor?: boolean }) {
  const [mangler, setMangler] = useState(false);
  const size = stor ? "w-20 h-20" : "w-12 h-12";
  return (
    <div
      className={`${size} shrink-0 border-2 border-(--brass) bg-black flex items-center justify-center overflow-hidden`}
    >
      {mangler ? (
        <span className="text-3xl text-(--gold)">{navn[0].toUpperCase()}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(`spill/portrett-${navn}.png`)}
          alt={navn}
          draggable={false}
          className="w-full h-full pixelated"
          onError={() => setMangler(true)}
        />
      )}
    </div>
  );
}

/**
 * Typewriter line; a tap finishes it (`alt` shows it all at once). The untyped
 * rest stays in the DOM, invisible, so the box never jumps and the full text is
 * there for screen readers and tests. `onFerdig` fires once the line is complete.
 */
export function Skriv({
  tekst,
  alt,
  onFerdig,
}: {
  tekst: string;
  alt?: boolean;
  onFerdig?: () => void;
}) {
  const [n, setN] = useState(0);
  const vis = alt ? tekst.length : n;
  const ferdig = useRef(onFerdig);
  useEffect(() => {
    ferdig.current = onFerdig;
  });
  useEffect(() => {
    if (vis >= tekst.length) {
      ferdig.current?.();
      return;
    }
    const t = setTimeout(() => setN(vis + 2), 22);
    return () => clearTimeout(t);
  }, [vis, tekst]);
  return (
    <span
      onClick={(e) => {
        if (vis < tekst.length) {
          e.stopPropagation();
          setN(tekst.length);
        }
      }}
    >
      {tekst.slice(0, vis)}
      <span className="invisible">{tekst.slice(vis)}</span>
    </span>
  );
}

// Floke, 12×13 pixels: X body, L belly, B glasses, W eye, K pupil, Y beak and feet, Z closed eye.
const UGLE = [
  "..X......X..",
  ".XXXXXXXXXX.",
  "XXXXXXXXXXXX",
  "XBBBBXXBBBBX",
  "XBWWBXXBWWBX",
  "XBWKBBBBWKBX",
  "XBBBBYYBBBBX",
  ".XXXXYYXXXX.",
  ".XLLXXXXLLX.",
  ".XLXLXXLXLX.",
  ".XXLXLLXLXX.",
  "..XXXXXXXX..",
  "...YY..YY...",
];
const UGLE_SOVER = UGLE.map((r, i) =>
  i === 4 ? "XBBBBXXBBBBX" : i === 5 ? "XBZZBBBBZZBX" : r,
);
const FARGE: Record<string, string> = {
  X: "#8a7a66",
  L: "#c9b99a",
  B: "#c8a24a",
  W: "#f4f1e8",
  K: "#111",
  Y: "#e3b23c",
  Z: "#3a3128",
};

function Ugle({ vaaken }: { vaaken: boolean }) {
  const rader = vaaken ? UGLE : UGLE_SOVER;
  return (
    <svg
      viewBox="0 0 12 13"
      className="w-20 h-[86px]"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rader.flatMap((r, y) =>
        [...r].map((c, x) =>
          c === "." ? null : (
            <rect
              key={`${x},${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={FARGE[c]}
            />
          ),
        ),
      )}
    </svg>
  );
}

const SKIP_KEYS = ["Enter", " "];
const HOLD_MS = 1800;

/**
 * Chapter opener (~15–20 s): IQ's camera boots, Floke wakes in the scene, then
 * Rampenissen whispers the chapter's intro lines. Tap or Enter finishes the
 * current line or moves on; HOPP OVER ends it. Reduced motion shows every
 * step at once with shorter holds.
 */
export function UgleIntro({
  kap,
  bilde,
  sceneNavn,
  onDone,
}: {
  kap: Kapittel;
  bilde: string | undefined;
  sceneNavn: string;
  onDone: () => void;
}) {
  const [rolig] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  // 0 camera, 1 Floke wakes, 2+ intro line (steg - 2)
  const [steg, setSteg] = useState(0);
  const [vaaken, setVaaken] = useState(rolig);
  const [alt, setAlt] = useState(false);
  const [ferdig, setFerdig] = useState(false);
  const linje = steg - 2;
  const siste = linje >= kap.intro.length - 1;
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const neste = () => {
    setAlt(false);
    setFerdig(false);
    if (siste) done.current();
    else setSteg((s) => s + 1);
  };
  const trykk = () => {
    if (steg >= 2 && !ferdig && !alt) setAlt(true);
    else neste();
  };
  // Timers and the key listener call the latest closures without restarting.
  const nesteRef = useRef(neste);
  const trykkRef = useRef(trykk);
  useEffect(() => {
    nesteRef.current = neste;
    trykkRef.current = trykk;
  });

  // Camera and wake run on a clock; lines wait for the typewriter plus a hold.
  useEffect(() => {
    if (steg === 0) {
      SoundManager.playSound("boot");
      if (!rolig) SoundManager.playSound("static");
    }
    if (steg === 1) SoundManager.playSound("open");
    if (steg >= 2) {
      SoundManager.playSound("click");
      return;
    }
    const ms = steg === 0 ? (rolig ? 1500 : 3200) : rolig ? 1200 : 2600;
    const t = setTimeout(() => nesteRef.current(), ms);
    return () => clearTimeout(t);
  }, [steg, rolig]);
  useEffect(() => {
    if (steg !== 1 || vaaken) return;
    const t = setTimeout(() => setVaaken(true), 1400);
    return () => clearTimeout(t);
  }, [steg, vaaken]);
  useEffect(() => {
    if (!(ferdig || alt) || steg < 2) return;
    const t = setTimeout(() => nesteRef.current(), rolig ? 3500 : HOLD_MS);
    return () => clearTimeout(t);
  }, [ferdig, alt, steg, rolig]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") done.current();
      else if (SKIP_KEYS.includes(e.key)) {
        e.preventDefault();
        trykkRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const kamera = `UGLE-KAM 0${kap.n} · SNØFALL\nFLOKE TILKOBLET\nSIGNAL: SVAKT, MEN OK`;

  return (
    <div
      role="dialog"
      aria-label="Intro"
      className="absolute inset-0 z-20 bg-black overflow-hidden select-none cursor-pointer"
      onClick={trykk}
    >
      {steg >= 1 && bilde && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bilde}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-fill pixelated"
          style={{ animation: rolig ? undefined : "fadeIn 1.2s ease-out" }}
        />
      )}
      {/* CRT: static lines plus one travelling scanline */}
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none ${steg === 0 ? "opacity-40" : "opacity-20"} motion-safe:animate-pulse bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.25)_0px,rgba(255,255,255,0.25)_1px,transparent_1px,transparent_3px)]`}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 h-1 bg-white/30 pointer-events-none motion-reduce:hidden"
        style={{ animation: "scanline 2.4s linear infinite" }}
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

      {steg === 0 && (
        <pre className="absolute top-3 left-3 font-[inherit] text-2xl text-(--neon-green) whitespace-pre-line">
          <Skriv tekst={kamera} alt={rolig} />
        </pre>
      )}
      {steg >= 1 && (
        <div className="absolute top-2 left-2 px-2 bg-black/70 text-base text-(--cold-blue) tracking-wider uppercase pointer-events-none">
          {steg === 1
            ? `Floke våkner · ${sceneNavn}`
            : `Ugle-kam ${kap.n} · ${sceneNavn}`}
        </div>
      )}
      {steg === 1 && (
        <div className="absolute bottom-[12%] left-[8%] flex items-end gap-2">
          <Ugle vaaken={vaaken} />
          {!vaaken && (
            <span className="text-2xl text-(--brass) motion-safe:animate-pulse">
              z z
            </span>
          )}
        </div>
      )}

      {steg >= 2 && (
        <div className="absolute inset-x-0 bottom-0 flex items-start gap-3 border-t-2 border-(--brass) bg-black/80 px-3 py-2 max-h-[60%] overflow-y-auto">
          <Portrett navn="rampenissen" />
          <div className="flex-1 min-w-0">
            <p className="text-lg text-(--gold)">
              Rampenissen (hvisker fra hylla)
            </p>
            <p className="text-xl leading-tight">
              <Skriv
                key={linje}
                tekst={kap.intro[linje]}
                alt={alt || rolig}
                onFerdig={() => setFerdig(true)}
              />
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-2">
        <button
          type="button"
          className="min-h-11 px-3 rounded border-2 border-(--cold-blue) text-(--cold-blue) bg-black/70 text-lg"
          onClick={(e) => {
            e.stopPropagation();
            trykk();
          }}
        >
          VIDERE
        </button>
        <button
          type="button"
          className="min-h-11 px-3 rounded border-2 border-(--brass) bg-black/70 text-lg"
          onClick={(e) => {
            e.stopPropagation();
            done.current();
          }}
        >
          HOPP OVER
        </button>
      </div>
    </div>
  );
}

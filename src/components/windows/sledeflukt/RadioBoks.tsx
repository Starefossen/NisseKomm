"use client";

import { useEffect } from "react";
import { Portrett } from "../nissespill/UgleIntro";

/** Seconds each radio line stays up before the next in the queue. */
export const RADIO_SEK = 3;

/** A short burst of filtered noise, the radio keying up. */
function knitring() {
  try {
    const ctx = new AudioContext();
    const n = Math.floor(ctx.sampleRate * 0.18);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++)
      d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.onended = () => void ctx.close();
    src.start();
  } catch {
    // No audio (tests, old browsers): the box still shows.
  }
}

/**
 * Rampenissen on the sled radio: a small box low on the left (clear of the
 * bars, the minimap and the buttons), one line at a
 * time; lines that arrive meanwhile wait in `kø` and `onFerdig` drops the head.
 */
export function RadioBoks({
  kø,
  onFerdig,
}: {
  kø: { tekst: string; id: number }[];
  onFerdig: () => void;
}) {
  const nå = kø[0];
  useEffect(() => {
    if (!nå) return;
    knitring();
    const t = setTimeout(onFerdig, RADIO_SEK * 1000);
    return () => clearTimeout(t);
    // onFerdig is a fresh closure each render; the line's id is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nå?.id]);
  if (!nå) return null;
  return (
    <div
      key={nå.id}
      role="status"
      className="absolute bottom-2 left-12 max-w-[calc(50%-7rem)] flex gap-2 items-center border-2 border-(--brass) bg-black/85 p-1 pr-2 pointer-events-none"
    >
      <div className="@max-[720px]:hidden">
        <Portrett navn="rampenissen" />
      </div>
      <div className="text-left leading-tight">
        <div className="text-sm text-(--gold) @max-[720px]:hidden">
          RADIO · RAMPENISSEN
        </div>
        <div className="text-lg @max-[720px]:text-sm text-(--neon-green)">
          «{nå.tekst}»
        </div>
      </div>
    </div>
  );
}

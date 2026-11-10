"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { SoundManager } from "@/lib/sounds";

/**
 * T14: the day-1 opener. Day1Boot runs once after the first login of the
 * season (sweep 85,0 → 90,0, channels come in); Day1Tail is the 4 s carrier
 * slip after Julius' first video. Both skip on click and play only once.
 */

const TICK_MS = 250;
const fmt = (f: number) => f.toFixed(1).replace(".", ",");
// Tab or a modifier must not skip by accident; Enter, space and Escape do.
const SKIP_KEYS = ["Enter", " ", "Escape"];

// Snow/static over the screen; motion-safe so reduced motion gets a still image.
function Static() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none opacity-30 motion-safe:animate-pulse bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.25)_0px,rgba(255,255,255,0.25)_1px,transparent_1px,transparent_3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_2px,transparent_2px,transparent_5px)]"
    />
  );
}

function useTicks(until: number, onDone: () => void, staticEvery = 0) {
  const [tick, setTick] = useState(0);
  // Parents pass fresh callbacks each render; a ref keeps the timer from restarting.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (tick >= until) {
      done.current();
      return;
    }
    // SoundManager is a no-op when sound is switched off.
    if (staticEvery && tick % staticEvery === 0)
      SoundManager.playSound("static");
    const id = setTimeout(() => setTick((t) => t + 1), TICK_MS);
    return () => clearTimeout(id);
  }, [tick, until, staticEvery]);
  return tick;
}

// Boot timeline (ticks of 250 ms): connect, sweep, channels, carrier line. ~13 s.
const CONNECT = 4;
const SWEEP = 10; // 0,5 MHz per tick
const PER_CHANNEL = 8;
const BOOT_CHANNELS = [
  "K1 SNØFALL LANDSBY",
  "K2 IQS VERKSTED",
  "K4 ANTENNEN",
  "K3 JULIUS",
];
const HOLD = 8;
export const BOOT_TICKS =
  CONNECT + SWEEP + PER_CHANNEL * BOOT_CHANNELS.length + HOLD;

export function Day1Boot({ onDone }: { onDone: () => void }) {
  const finish = () => {
    GameEngine.markIntroSeen("boot");
    onDone();
  };
  const tick = useTicks(BOOT_TICKS, finish, 2);
  const sweepTick = Math.min(Math.max(tick - CONNECT, 0), SWEEP);
  const freq = 85 + sweepTick * 0.5;
  const channels = Math.max(
    0,
    Math.floor((tick - CONNECT - SWEEP) / PER_CHANNEL) + 1,
  );
  const carrier = channels > BOOT_CHANNELS.length;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Hopp over"
      onClick={finish}
      onKeyDown={(e) => SKIP_KEYS.includes(e.key) && finish()}
      className="fixed inset-0 z-[60] bg-(--crt-bg) flex items-center justify-center cursor-pointer"
    >
      <Static />
      <div className="relative w-[600px] max-w-[90%] space-y-2 text-(--neon-green) text-xl tracking-wider">
        <div>KOBLER TIL SNØFALL…</div>
        {tick >= CONNECT && (
          <div className="text-4xl text-center py-4">
            {sweepTick < SWEEP ? "SØKER" : "LÅST"} {fmt(freq)} MHz
          </div>
        )}
        {BOOT_CHANNELS.slice(0, channels).map((c) => (
          <div key={c}>{c} … SIGNAL</div>
        ))}
        {carrier && (
          <div className="text-(--gold) pt-2">BÆREBØLGE 90,0: USTABIL</div>
        )}
        <div className="text-base opacity-50 pt-6 text-center">
          Klikk for å hoppe over
        </div>
      </div>
    </div>
  );
}

// Tail: 4 s; frequency on 85,0 from 1,5 s to 2,5 s. No voice, no blue.
export const TAIL_TICKS = 16;

export function Day1Tail({ onDone }: { onDone: () => void }) {
  const finish = () => {
    GameEngine.markIntroSeen("tail");
    onDone();
  };
  const tick = useTicks(TAIL_TICKS, finish, 3);
  const slipped = tick >= 6 && tick < 10;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Hopp over"
      onClick={finish}
      onKeyDown={(e) => SKIP_KEYS.includes(e.key) && finish()}
      className="absolute inset-0 cursor-pointer"
    >
      <Static />
      <div className="absolute top-2 left-2 px-2 bg-black/70 text-(--gold) text-base motion-safe:animate-pulse">
        LINJE 90,0 · BÆREBØLGE USTABIL
      </div>
      <div className="absolute bottom-2 right-2 px-2 bg-black/70 text-(--neon-green) text-lg">
        {slipped ? "85,0" : tick >= 10 ? "90,0 · STABIL" : "90,0"}
      </div>
    </div>
  );
}

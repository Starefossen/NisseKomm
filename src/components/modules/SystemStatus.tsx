"use client";

import { useEffect, useState } from "react";
import { LEDIndicator } from "../ui/LEDIndicator";
import { GameEngine } from "@/lib/game-engine";

interface SystemStatusProps {
  currentDay: number;
}

/** Sidebar: Frostgraden as a standing thermometer, no box (design-revisjon P2 #9). */
export function SystemStatus({ currentDay }: SystemStatusProps) {
  const frost = GameEngine.getFrostLevel(currentDay);
  const solved = GameEngine.isQuestCompleted(currentDay);
  const [shown, setShown] = useState(frost);

  // Count down one point at a time so a solved code is felt, not just seen
  useEffect(() => {
    if (frost === null || shown === null || shown <= frost) {
      if (shown !== frost) {
        const t = setTimeout(() => setShown(frost), 0);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setShown(shown - 1), 60);
    return () => clearTimeout(t);
  }, [frost, shown]);

  if (frost === null || shown === null) {
    return (
      <div className="flex items-center gap-3 text-lg text-(--brass) tracking-wider">
        <LEDIndicator color="green" blinking />
        <span>LINJE 90,0 MHz · BÆREBØLGE</span>
      </div>
    );
  }

  const ticking = shown > frost;
  const warning = currentDay === 20 && !solved;
  const status = shown >= 70 ? "kritisk" : shown >= 45 ? "advarsel" : "normal";
  const fill =
    status === "kritisk"
      ? "bg-(--christmas-red)"
      : status === "advarsel"
        ? "bg-(--gold)"
        : "bg-(--cold-blue)";

  return (
    <div className="flex flex-col items-center gap-3 text-(--neon-green)">
      <div className="text-lg tracking-wider text-(--brass)">FROSTGRADEN</div>
      <div
        className={`text-5xl tabular-nums ${ticking ? "frost-tick" : ""} ${warning ? "text-(--christmas-red)" : ""}`}
        aria-live="polite"
      >
        {frost === 0 ? "TØVÆR" : `${shown} %`}
      </div>
      {/* Tube and bulb; the bulb carries the one breathing LED */}
      <div className="flex flex-col items-center" aria-hidden>
        <div className="relative w-4 h-40 border-2 border-(--brass)/70 rounded-t-full overflow-hidden">
          <div
            className={`absolute bottom-0 inset-x-0 ${fill}`}
            style={{ height: `${shown}%` }}
          />
        </div>
        <div className="-mt-1">
          <LEDIndicator
            color={status === "kritisk" ? "red" : solved ? "green" : "blue"}
            size={24}
            blinking
          />
        </div>
      </div>
      {currentDay === 21 && solved && (
        <div className="text-center text-(--gold)">
          <svg viewBox="0 0 40 30" className="w-16 h-12 mx-auto" aria-hidden>
            <path
              d="M4 28 V8 L12 4 V28 M36 28 V8 L28 4 V28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M14 28 V10 H26 V28" fill="currentColor" opacity="0.3" />
          </svg>
          <div className="text-lg">PORTEN STÅR ÅPEN</div>
        </div>
      )}
      <div className="text-lg">
        {solved ? "LINJEN VARMES" : "FROSTEN STIGER"}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SidebarWidget } from "../ui/SidebarWidget";
import { StatusBar } from "../ui/StatusBar";
import { LEDIndicator } from "../ui/LEDIndicator";
import { GameEngine } from "@/lib/game-engine";

interface SystemStatusProps {
  currentDay: number;
}

/** Sidebar: Frostgraden only (historie-2026 §1, storyboard H1). */
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
      <SidebarWidget title="SERVERROM">
        <div className="flex items-center gap-2 text-base">
          <LEDIndicator color="green" blinking />
          <span>ORAKELET LYTTER ...</span>
        </div>
      </SidebarWidget>
    );
  }

  const ticking = shown > frost;
  const warning = currentDay === 20 && !solved;
  const status = shown >= 70 ? "kritisk" : shown >= 45 ? "advarsel" : "normal";

  return (
    <SidebarWidget title="FROSTGRADEN">
      <div className="space-y-3">
        <div
          className={`text-5xl text-center tabular-nums ${ticking ? "frost-tick" : ""} ${warning ? "animate-pulse" : ""}`}
          aria-live="polite"
        >
          {frost === 0 ? "TØVÆR" : `${shown} %`}
        </div>
        <StatusBar label="FROST" value={shown} max={100} status={status} />
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
            <div className="text-base">PORTEN STÅR ÅPEN</div>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t-2 border-(--neon-green)/30 text-base">
          <span>{solved ? "LINJEN VARMES" : "FROSTEN STIGER"}</span>
          <LEDIndicator
            color={status === "kritisk" ? "red" : solved ? "green" : "yellow"}
            blinking
          />
        </div>
      </div>
    </SidebarWidget>
  );
}

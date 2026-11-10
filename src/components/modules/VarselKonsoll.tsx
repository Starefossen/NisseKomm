"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/lib/icons";
import { Varsel } from "@/types/innhold";
import { GameEngine } from "@/lib/game-engine";

interface VarselKonsollProps {
  alerts: Varsel[]; // Base alerts (fallback)
  currentDay?: number;
}

const COLOR = {
  kritisk: ["red", "text-(--christmas-red)", "border-(--christmas-red)/80"],
  advarsel: ["gold", "text-(--gold)", "border-(--gold)/40"],
  info: ["blue", "text-(--cold-blue)", "border-(--neon-green)/30"],
} as const;

/** The three latest alerts under the thermometer; still, no box (design-revisjon P2 #9, #11). */
export function VarselKonsoll({ alerts, currentDay }: VarselKonsollProps) {
  const [dynamicAlerts, setDynamicAlerts] = useState<Varsel[]>(() =>
    typeof window !== "undefined"
      ? GameEngine.getDailyAlerts(currentDay || 1)
      : alerts,
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      setDynamicAlerts(GameEngine.getDailyAlerts(currentDay || 1));
    });
  }, [currentDay]);

  return (
    <ul className="space-y-2 text-base" aria-label="Varsler">
      {dynamicAlerts.slice(0, 3).map((alert, index) => {
        const [icon, text, border] = COLOR[alert.type] ?? COLOR.info;
        return (
          <li
            key={`alert-${index}`}
            className={`min-h-11 flex items-start gap-2 px-2 py-1 border-l-2 ${border}`}
          >
            <Icons.Alert size={16} color={icon} className="mt-1 shrink-0" />
            <div className="min-w-0">
              <div className={text}>{alert.tekst}</div>
              <div className="opacity-60">{alert.tidspunkt}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useState, useEffect } from "react";
import { SidebarWidget } from "../ui/SidebarWidget";
import { Icons } from "@/lib/icons";
import { Varsel } from "@/types/innhold";
import { GameEngine } from "@/lib/game-engine";
import { StorageManager } from "@/lib/storage";

interface VarselKonsollProps {
  alerts: Varsel[]; // Base alerts (fallback)
  currentDay?: number; // Optional: to trigger refresh on day change
}

export function VarselKonsoll({ alerts, currentDay }: VarselKonsollProps) {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [dynamicAlerts, setDynamicAlerts] = useState<Varsel[]>(() => {
    if (typeof window !== "undefined") {
      const completedDays = new Set(
        StorageManager.getSubmittedCodes()
          .map(
            (c) =>
              GameEngine.getAllQuests().findIndex(
                (q) => q.kode.toUpperCase() === c.kode.toUpperCase(),
              ) + 1,
          )
          .filter((d) => d > 0),
      );
      return GameEngine.getDailyAlerts(currentDay || 1, completedDays);
    }
    return alerts;
  });

  useEffect(() => {
    // Refresh alerts when day changes - use requestAnimationFrame to defer setState
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const completedDays = new Set(
          StorageManager.getSubmittedCodes()
            .map(
              (c) =>
                GameEngine.getAllQuests().findIndex(
                  (q) => q.kode.toUpperCase() === c.kode.toUpperCase(),
                ) + 1,
            )
            .filter((d) => d > 0),
        );
        const newAlerts = GameEngine.getDailyAlerts(
          currentDay || 1,
          completedDays,
        );
        setDynamicAlerts(newAlerts);
      });
    }
  }, [currentDay]); // Only run when day changes, not on mount

  const handleAlertClick = (index: number) => {
    setSelectedAlert(selectedAlert === index ? null : index);
  };

  const getAlertColor = (type: Varsel["type"]) => {
    switch (type) {
      case "kritisk":
        return "red";
      case "advarsel":
        return "gold";
      default:
        return "blue";
    }
  };

  return (
    <SidebarWidget title="VARSLER">
      <div className="space-y-2 flex-1 overflow-y-auto">
        {dynamicAlerts.slice(0, 8).map((alert, index) => {
          const isCrisis = alert.type === "kritisk";

          return (
            <button
              key={`alert-${index}`}
              onClick={() => handleAlertClick(index)}
              className={`
                w-full text-left px-2 py-1 border-2 transition-all text-xs
                animate-slide-down
                ${isCrisis ? "border-(--christmas-red) shadow-[0_0_10px_rgba(255,0,0,0.3)]" : ""}
                ${
                  selectedAlert === index
                    ? "border-(--gold) bg-(--gold)/10"
                    : isCrisis
                      ? "border-(--christmas-red)/80 hover:border-(--christmas-red)"
                      : "border-(--neon-green)/30 hover:border-(--neon-green)"
                }
              `}
              style={{
                animation:
                  selectedAlert === index
                    ? "gold-flash 0.3s ease-out"
                    : isCrisis
                      ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      : "none",
              }}
            >
              <div className="flex items-start gap-2">
                <Icons.Alert
                  size={12}
                  color={
                    getAlertColor(alert.type) as
                      | "red"
                      | "green"
                      | "blue"
                      | "gray"
                      | "gold"
                  }
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={`
                    font-bold truncate
                    ${
                      alert.type === "kritisk"
                        ? "text-(--christmas-red)"
                        : alert.type === "advarsel"
                          ? "text-(--gold)"
                          : "text-(--cold-blue)"
                    }
                  `}
                  >
                    {alert.tekst}
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">
                    {alert.tidspunkt}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SidebarWidget>
  );
}

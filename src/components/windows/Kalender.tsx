"use client";

import { useState, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { RetroModal } from "../ui/RetroModal";
import { Icons } from "@/lib/icons";
import { StorageManager } from "@/lib/storage";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import type { Oppdrag } from "@/types/innhold";

interface KalenderProps {
  missions: Oppdrag[];
  onClose: () => void;
  onSelectDay: (day: number) => void;
}

export function Kalender({ missions, onClose, onSelectDay }: KalenderProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getCompletedDaysForMissions(missions);
    }
    return new Set();
  });

  // Refresh completed days when window regains focus or on mount
  useEffect(() => {
    const updateCompletedDays = () => {
      if (typeof window !== "undefined") {
        setCompletedDays(StorageManager.getCompletedDaysForMissions(missions));
      }
    };

    // Update on mount
    updateCompletedDays();

    // Update when window regains focus (e.g., after closing KodeTerminal)
    window.addEventListener("focus", updateCompletedDays);

    // Also poll every 2 seconds while calendar is open
    const interval = setInterval(updateCompletedDays, 2000);

    return () => {
      window.removeEventListener("focus", updateCompletedDays);
      clearInterval(interval);
    };
  }, [missions]);

  const isDayLocked = (day: number) => {
    const currentDay = getCurrentDay();
    const month = getCurrentMonth();

    // In test mode, allow all days
    if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
      return false;
    }

    // Lock future days in December
    if (month === 12 && day > currentDay) {
      return true;
    }

    return false;
  };

  const getDayStatus = (day: number): "locked" | "available" | "completed" => {
    if (completedDays.has(day)) return "completed";
    if (isDayLocked(day)) return "locked";
    return "available";
  };

  const handleDayClick = (day: number) => {
    const status = getDayStatus(day);
    if (status !== "locked") {
      setSelectedDay(day);
    }
  };

  const selectedMission = missions.find((m) => m.dag === selectedDay);

  return (
    <>
      <RetroWindow title="KALENDER" onClose={onClose}>
        <div className="p-6 space-y-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
            <Icons.Calendar size={32} color="gold" />
            <div>
              <div className="text-2xl font-bold tracking-wider">
                DESEMBER 2025
              </div>
              <div className="text-sm opacity-70">
                JULEKALENDER - 24 OPPDRAG
              </div>
            </div>
          </div>

          {/* Calendar grid (4 rows × 6 cols = 24 days) */}
          <div className="grid grid-cols-6 gap-3 p-4 pb-8">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
              const status = getDayStatus(day);
              const mission = missions.find((m) => m.dag === day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={status === "locked"}
                  className={`
                    aspect-square flex flex-col items-center justify-center p-2
                    border-4 font-bold text-xl transition-all relative
                    ${
                      status === "locked"
                        ? "border-(--gray) bg-black/30 opacity-50 cursor-not-allowed"
                        : status === "completed"
                          ? "border-(--gold) bg-(--gold)/30 text-(--gold) shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:shadow-[0_0_25px_rgba(255,215,0,0.7)] cursor-pointer"
                          : "border-(--neon-green) bg-(--neon-green)/10 text-(--neon-green) hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] cursor-pointer"
                    }
                  `}
                >
                  {/* Day number */}
                  <span className="text-2xl">{day}</span>

                  {/* Status icon */}
                  <div className="absolute top-1 right-1">
                    {status === "locked" && (
                      <Icons.Lock size={12} color="gray" />
                    )}
                    {status === "completed" && (
                      <Icons.CheckCircle size={16} color="gold" />
                    )}
                  </div>

                  {/* Event indicator (small text below) */}
                  {mission?.hendelse && status !== "locked" && (
                    <div className="absolute bottom-1 left-0 right-0 text-[11px] opacity-80 truncate px-1 text-center">
                      {mission.hendelse.substring(0, 15)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs py-4 border-t-2 border-(--neon-green)/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-(--gray) bg-black/30" />
              <span className="opacity-70">Låst</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-(--neon-green) bg-(--neon-green)/10" />
              <span className="opacity-70">Tilgjengelig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-(--gold) bg-(--gold)/20" />
              <span className="opacity-70">Fullført</span>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* Day detail modal */}
      {selectedDay && selectedMission && (
        <RetroModal
          title={`DAG ${selectedDay} - ${selectedMission.tittel}`}
          onClose={() => setSelectedDay(null)}
        >
          <div className="space-y-4">
            {/* Public event */}
            {selectedMission.hendelse && (
              <div className="p-3 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.Alert size={16} color="blue" />
                  <span className="text-sm font-bold text-(--cold-blue)">
                    HENDELSE
                  </span>
                </div>
                <div className="text-sm text-(--cold-blue)">
                  {selectedMission.hendelse}
                </div>
              </div>
            )}

            {/* Mission preview */}
            <div className="text-sm">
              {selectedMission.nissemail_tekst.substring(0, 150)}...
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedDay(null);
                  onSelectDay(selectedDay);
                }}
                className="flex-1 px-4 py-3 bg-(--neon-green) text-black font-bold border-4 border-(--neon-green) hover:bg-transparent hover:text-(--neon-green) transition-colors"
              >
                VIS OPPDRAG
              </button>
            </div>
          </div>
        </RetroModal>
      )}
    </>
  );
}

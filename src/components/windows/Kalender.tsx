"use client";

import { useState, useCallback } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { RetroModal } from "../ui/RetroModal";
import { TIDBITS, visible } from "@/lib/tidbits";
import { Icons } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import type { Oppdrag, CalendarEvent } from "@/types/innhold";

interface KalenderProps {
  missions: Oppdrag[];
  customCalendarEvents?: CalendarEvent[];
  onClose: () => void;
  onSelectDay: (day: number) => void;
}

const STATUS_LABEL = {
  locked: "låst",
  available: "tilgjengelig",
  completed: "fullført",
};

export function Kalender({
  missions,
  customCalendarEvents = [],
  onClose,
  onSelectDay,
}: KalenderProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Only one window is open at a time, so a code submitted in KodeTerminal
  // shows up here on the next open; no polling needed.
  const [completedDays] = useState(() => GameEngine.getCompletedDays());

  /**
   * Get hendelse for a specific day
   * Merges file-based mission hendelser with custom family events
   * Custom events take precedence (override file-based)
   */
  const getHendelseForDay = useCallback(
    (day: number): string | undefined => {
      // Check custom events first (take precedence)
      const customEvent = customCalendarEvents.find((e) => e.dag === day);
      if (customEvent) {
        return customEvent.hendelse;
      }

      // Fall back to file-based mission hendelse
      const mission = missions.find((m) => m.dag === day);
      return mission?.hendelse;
    },
    [customCalendarEvents, missions],
  );

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

  // Titles and mail text can leak codes, so never show them before their day, even in test mode
  const isDayRevealed = (day: number) =>
    completedDays.has(day) ||
    (getCurrentMonth() === 12 && day <= getCurrentDay());

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
        <div className="p-4 space-y-3 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-4 pb-3 border-b-4 border-(--neon-green)/30">
            <Icons.Calendar size={32} color="gold" />
            <div>
              <div className="text-2xl font-bold tracking-wider">
                DESEMBER 2026
              </div>
              <div className="text-lg opacity-70">
                JULEKALENDER - 24 OPPDRAG
              </div>
            </div>
          </div>

          {/* Calendar grid - responsive (3/4/6 columns) */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 p-2">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
              const status = getDayStatus(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={status === "locked"}
                  aria-label={`${day}. desember, ${STATUS_LABEL[status]}`}
                  className={`
                    aspect-square landscape:aspect-[3/2] min-h-12 flex flex-col items-center justify-center p-1 md:p-2
                    border-4 font-bold text-lg md:text-xl lg:text-2xl transition-all relative
                    ${
                      status === "locked"
                        ? "border-(--gray) bg-black/30 opacity-50 cursor-not-allowed"
                        : status === "completed"
                          ? "border-(--gold) bg-(--gold)/30 text-(--gold) shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:shadow-[0_0_25px_rgba(255,215,0,0.7)] cursor-pointer"
                          : "border-(--neon-green) bg-(--neon-green)/10 text-(--neon-green) hover:shadow-[0_0_20px_color-mix(in_oklab,var(--brass)_40%,transparent)] cursor-pointer active:scale-95"
                    }
                  `}
                >
                  {/* Day number */}
                  <span className="text-xl md:text-2xl">{day}</span>

                  {/* Status icon */}
                  <div className="absolute top-1 right-1">
                    {status === "locked" && (
                      <Icons.Lock size={12} color="gray" />
                    )}
                    {status === "completed" && (
                      <Icons.CheckCircle size={14} color="gold" />
                    )}
                  </div>

                  {/* Event indicator (small text below) - hidden on mobile for space */}
                  {(() => {
                    const hendelse = getHendelseForDay(day);
                    if (!hendelse || status === "locked") return null;
                    return (
                      <div className="hidden md:block absolute bottom-1 left-0 right-0 text-base opacity-80 truncate px-1 text-center">
                        {hendelse.substring(0, 15)}
                      </div>
                    );
                  })()}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-base py-2 border-t-2 border-(--neon-green)/30">
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
          title={
            isDayRevealed(selectedDay)
              ? `DAG ${selectedDay} - ${selectedMission.tittel}`
              : `DAG ${selectedDay}`
          }
          onClose={() => setSelectedDay(null)}
        >
          <div className="space-y-4">
            {/* Public event (merged: custom events override file-based) */}
            {(() => {
              const hendelse = getHendelseForDay(selectedDay);
              if (!hendelse) return null;
              return (
                <div className="p-3 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Alert size={16} color="blue" />
                    <span className="text-lg font-bold text-(--cold-blue)">
                      HENDELSE
                    </span>
                  </div>
                  <div className="text-lg text-(--cold-blue)">{hendelse}</div>
                </div>
              );
            })()}

            {isDayRevealed(selectedDay) && (
              <div className="text-lg">
                {selectedMission.nissemail_tekst.substring(0, 150)}...
              </div>
            )}

            {/* Small extra behind an already-opened door (tidbits.json) */}
            {completedDays.has(selectedDay) &&
              visible(TIDBITS.kalender, getCurrentDay())
                .filter((t) => t.dag === selectedDay)
                .map((t) => (
                  <div
                    key={t.tekst}
                    role="status"
                    className="text-lg text-(--gold) italic"
                  >
                    {t.tekst}
                  </div>
                ))}

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

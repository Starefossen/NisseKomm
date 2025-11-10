"use client";

import { useState, useCallback, useMemo } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { Oppdrag } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";

interface NisseMailProps {
  missions: Oppdrag[];
  onClose: () => void;
  onOpenKodeTerminal: (day: number) => void;
  currentDay: number;
  initialDay?: number | null;
}

export function NisseMail({
  missions,
  onClose,
  onOpenKodeTerminal,
  currentDay,
  initialDay,
}: NisseMailProps) {
  const [viewedEmails, setViewedEmails] = useState<Set<number>>(() => {
    // Initialize with data from storage immediately
    if (typeof window !== "undefined") {
      return StorageManager.getViewedEmails();
    }
    return new Set();
  });

  const markAsViewed = useCallback(
    (dag: number) => {
      if (!viewedEmails.has(dag)) {
        StorageManager.markEmailAsViewed(dag);
        const updated = new Set(viewedEmails);
        updated.add(dag);
        setViewedEmails(updated);
      }
    },
    [viewedEmails],
  );

  // Calculate initial mission selection
  const initialMission = useMemo(() => {
    if (missions.length === 0) return null;

    // If initialDay is provided (from calendar), use that
    if (initialDay) {
      const dayMission = missions.find((m) => m.dag === initialDay);
      if (dayMission) return dayMission;
    }

    // Otherwise try to find today's mission
    const todayMission = missions.find((m) => m.dag === currentDay);
    if (todayMission) return todayMission;

    // Find first unread mission
    const unreadMission = missions.find((m) => !viewedEmails.has(m.dag));
    if (unreadMission) return unreadMission;

    // Default to first mission
    return missions[0];
  }, [missions, currentDay, initialDay, viewedEmails]);

  const [selectedMission, setSelectedMission] = useState<Oppdrag | null>(() => {
    if (initialMission) {
      // Mark as viewed on initial render
      if (typeof window !== "undefined") {
        StorageManager.markEmailAsViewed(initialMission.dag);
      }
      return initialMission;
    }
    return null;
  });

  const handleSelectMission = (mission: Oppdrag) => {
    SoundManager.playSound("click");
    setSelectedMission(mission);
    markAsViewed(mission.dag);
  };

  const getUnreadCount = () => {
    return StorageManager.getUnreadEmailCount(currentDay, missions.length);
  };

  // Filter missions up to current day
  const availableMissions = missions.filter((m) => m.dag <= currentDay);

  return (
    <RetroWindow title="NISSEMAIL" onClose={onClose}>
      <div className="flex h-full gap-4 p-6">
        {/* Inbox List - Left 30% */}
        <div className="w-[30%] border-r-4 border-(--neon-green)/30 flex flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Inbox header */}
            <div className="flex items-center gap-2 pb-2 border-b-2 border-(--neon-green)/30 shrink-0">
              <Icons.File size={20} color="green" />
              <span className="text-xl font-bold">INNBOKS</span>
              {getUnreadCount() > 0 && (
                <span className="ml-auto px-2 py-1 text-sm bg-(--christmas-red) text-white border-2 border-(--christmas-red)">
                  {getUnreadCount()} NY
                </span>
              )}
            </div>

            {/* Email list */}
            <div className="space-y-2 overflow-y-auto flex-1 mt-2 pb-2">
              {[...availableMissions].reverse().map((mission) => {
                const isUnread = !viewedEmails.has(mission.dag);
                const isSelected = selectedMission?.dag === mission.dag;

                return (
                  <button
                    key={mission.dag}
                    onClick={() => handleSelectMission(mission)}
                    className={`
                      w-full text-left p-3 border-2 transition-all
                      ${isSelected
                        ? "border-(--neon-green) bg-(--neon-green)/20"
                        : "border-(--neon-green)/30 hover:border-(--neon-green) hover:bg-black/30"
                      }
                      ${isUnread ? "font-bold" : "opacity-70"}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <div className="w-2 h-2 mt-2 bg-(--christmas-red) rounded-full shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm ${isUnread ? "text-(--gold)" : ""}`}
                        >
                          RAMPENISSEN 🎅
                        </div>
                        <div
                          className={`text-base truncate ${isUnread ? "text-(--neon-green)" : ""}`}
                        >
                          {mission.tittel}
                        </div>
                        <div className="text-xs opacity-50 mt-1">
                          DAG {mission.dag}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Content - Right 70% */}
        <div className="w-[70%] flex flex-col min-h-0">
          {selectedMission ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Email Header */}
              <div className="space-y-3 pb-4 border-b-4 border-(--neon-green)/30 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold tracking-wider">
                    {selectedMission.tittel}
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-70">
                    <Icons.Calendar size={16} color="green" />
                    <span>DAG {selectedMission.dag}</span>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex gap-3">
                    <span className="opacity-70 w-16">FRA:</span>
                    <span className="text-(--gold)">RAMPENISSEN 🎅</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="opacity-70 w-16">TIL:</span>
                    <span>NISSEHJELPER</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="opacity-70 w-16">EMNE:</span>
                    <span>{selectedMission.tittel}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="opacity-70 w-16">DATO:</span>
                    <span>DESEMBER {selectedMission.dag}, 2025</span>
                  </div>
                </div>
              </div>

              {/* Email Body - Scrollable */}
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                {/* Mission description */}
                <div className="p-4 border-2 border-(--neon-green)/50 bg-black/30">
                  <div className="text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedMission.beskrivelse}
                  </div>
                </div>

                {/* Public event if exists */}
                {selectedMission.hendelse && (
                  <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.Alert size={20} color="blue" />
                      <span className="text-sm font-bold text-(--cold-blue)">
                        OFFENTLIG HENDELSE
                      </span>
                    </div>
                    <div className="text-sm text-(--cold-blue)">
                      {selectedMission.hendelse}
                    </div>
                  </div>
                )}

                {/* Mission instructions */}
                <div className="p-4 border-2 border-(--gold)/30 bg-(--gold)/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Help size={16} color="gold" />
                    <span className="text-sm font-bold text-(--gold)">
                      INSTRUKSJONER:
                    </span>
                  </div>
                  <div className="text-sm opacity-90">
                    Når du har løst oppdraget og funnet koden, klikk på knappen
                    under for å sende inn svaret i KODETERMINAL.
                  </div>
                </div>
              </div>

              {/* Open KODETERMINAL button */}
              <div className="mt-4 pt-4 border-t-4 border-(--neon-green)/30 shrink-0">
                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    onOpenKodeTerminal(selectedMission.dag);
                  }}
                  className="w-full px-6 py-3 bg-(--cold-blue) text-black text-xl tracking-wider font-bold border-4 border-(--cold-blue) hover:bg-transparent hover:text-(--cold-blue) transition-colors flex items-center justify-center gap-3"
                >
                  <Icons.Code size={24} color="blue" />
                  <span>ÅPNE KODETERMINAL</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center opacity-50">
              <div>
                <Icons.File size={48} color="green" />
                <div className="mt-4">INGEN E-POST VALGT</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}

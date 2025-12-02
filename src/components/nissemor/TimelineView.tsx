"use client";

import { useMemo, useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";
import { getAllEventyr, getEventyrDays, getEventyr } from "@/lib/eventyr";

interface TimelineViewProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

interface TimelineEvent {
  day: number;
  title: string;
  code: string;
  isCompleted: boolean;
  isAccessible: boolean;
  hasBonusOppdrag: boolean;
  bonusCompleted: boolean;
  hasSymbol: boolean;
  symbolCollected: boolean;
  hasModule: boolean;
  hasDecryption: boolean;
  decryptionSolved: boolean;
  eventyrPhases: EventyrPhaseInfo[];
}

interface EventyrPhaseInfo {
  eventyrId: string;
  eventyrName: string;
  phase: number;
  totalPhases: number;
  color: string;
  isFirstPhase: boolean;
  isLastPhase: boolean;
}

interface EventyrBranch {
  eventyrId: string;
  name: string;
  color: string;
  startDay: number;
  endDay: number;
  days: number[];
  laneIndex: number;
}

export function TimelineView({ selectedDay, onSelectDay }: TimelineViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for storage changes to auto-update
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("nissekomm-")) {
        setRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Scroll selected day into view
  useEffect(() => {
    const dayElement = document.querySelector(
      `[data-timeline-day="${selectedDay}"]`,
    );
    if (dayElement) {
      dayElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedDay]);

  // Build timeline data
  const timelineData = useMemo(() => {
    const quests = GameEngine.getAllQuests();
    const gameState = GameEngine.loadGameState();
    const collectedSymbols = GameEngine.getCollectedSymbols();

    return quests.map((quest): TimelineEvent => {
      const isCompleted = gameState.completedQuests.has(quest.dag);
      const isAccessible = GameEngine.isMissionAccessible(quest.dag);

      // Aggregate eventyr phases for this day
      const eventyrPhases: EventyrPhaseInfo[] = [];
      if (quest.eventyr) {
        const eventyr = getEventyr(quest.eventyr.id);
        const eventyrDays = getEventyrDays(quest.eventyr.id);
        if (eventyr) {
          eventyrPhases.push({
            eventyrId: quest.eventyr.id,
            eventyrName: eventyr.navn,
            phase: quest.eventyr.phase,
            totalPhases: eventyrDays.length,
            color: eventyr.farge,
            isFirstPhase: quest.eventyr.phase === 1,
            isLastPhase: quest.eventyr.phase === eventyrDays.length,
          });
        }
      }

      return {
        day: quest.dag,
        title: quest.tittel,
        code: quest.kode,
        isCompleted,
        isAccessible,
        hasBonusOppdrag: !!quest.bonusoppdrag,
        bonusCompleted: quest.bonusoppdrag
          ? GameEngine.isBonusOppdragCompleted(quest)
          : false,
        hasSymbol: !!quest.symbol_clue,
        symbolCollected: quest.symbol_clue
          ? collectedSymbols.some(
              (s) => s.symbolId === quest.symbol_clue!.symbolId,
            )
          : false,
        hasModule: !!(
          quest.reveals?.modules && quest.reveals.modules.length > 0
        ),
        hasDecryption: !!quest.decryption_challenge,
        decryptionSolved: quest.decryption_challenge
          ? GameEngine.isDecryptionSolved(
              quest.decryption_challenge.challengeId,
            )
          : false,
        eventyrPhases,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Build eventyr branch data for visual rendering
  const eventyrBranches = useMemo((): EventyrBranch[] => {
    const allEventyr = getAllEventyr();
    const branches: EventyrBranch[] = [];

    // Track which lane each eventyr should use
    const laneAssignments = new Map<string, number>();
    const activeBranches: Array<{ eventyrId: string; endDay: number }> = [];

    allEventyr.forEach((eventyr) => {
      const days = getEventyrDays(eventyr.id);
      if (days.length === 0) return;

      const startDay = Math.min(...days);
      const endDay = Math.max(...days);

      // Find available lane (check for overlapping branches)
      let laneIndex = 0;
      while (true) {
        const hasOverlap = activeBranches.some(
          (branch) =>
            branch.endDay >= startDay &&
            laneAssignments.get(branch.eventyrId) === laneIndex,
        );
        if (!hasOverlap) break;
        laneIndex++;
      }

      laneAssignments.set(eventyr.id, laneIndex);
      activeBranches.push({ eventyrId: eventyr.id, endDay });

      branches.push({
        eventyrId: eventyr.id,
        name: eventyr.navn,
        color: eventyr.farge,
        startDay,
        endDay,
        days,
        laneIndex,
      });
    });

    return branches;
  }, []);

  // Calculate SVG dimensions
  const dayHeight = 40; // Height per day node
  const svgHeight = 24 * dayHeight;
  const laneWidth = 24; // Width per eventyr lane
  const maxLanes =
    eventyrBranches.length > 0
      ? Math.max(...eventyrBranches.map((b) => b.laneIndex)) + 1
      : 0;
  const branchAreaWidth = maxLanes * laneWidth + 40; // Add extra 40px padding on right
  const mainLineX = 80; // X position of main timeline (left-aligned with space for icons)
  const dayCircleRadius = 12;

  return (
    <div className="sticky top-4 border-4 border-(--neon-green) bg-(--dark-crt) p-3 h-[calc(100vh-2rem)] flex flex-col">
      <h2 className="text-2xl font-bold text-(--neon-green) mb-4 text-center shrink-0">
        📅 TIDSLINJE
      </h2>

      <div className="relative overflow-y-auto flex-1 min-h-0">
        {/* SVG for eventyr branches and main timeline */}
        <svg
          className="absolute top-0 left-0"
          width={mainLineX + branchAreaWidth + 20}
          height={svgHeight}
        >
          {/* Main timeline vertical line */}
          <line
            x1={mainLineX}
            y1={0}
            x2={mainLineX}
            y2={svgHeight}
            stroke="var(--neon-green)"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Eventyr branch lines */}
          {eventyrBranches.map((branch) => {
            const branchX = mainLineX + 30 + branch.laneIndex * laneWidth;
            const gameState = GameEngine.loadGameState();
            const completedCount = branch.days.filter((d) =>
              gameState.completedQuests.has(d),
            ).length;
            const progressPercent = Math.round(
              (completedCount / branch.days.length) * 100,
            );

            return (
              <g key={branch.eventyrId} className="group">
                {/* Branch line through all days */}
                {branch.days.map((day, idx) => {
                  if (idx === branch.days.length - 1) return null;
                  const nextDay = branch.days[idx + 1];
                  const y1 = (day - 1) * dayHeight + dayHeight / 2 - 2;
                  const y2 = (nextDay - 1) * dayHeight + dayHeight / 2 - 2;

                  return (
                    <g key={`${branch.eventyrId}-${day}-${nextDay}`}>
                      <title>
                        {branch.name}: {completedCount}/{branch.days.length}{" "}
                        dager ({progressPercent}%)
                      </title>
                      <line
                        x1={branchX}
                        y1={y1}
                        x2={branchX}
                        y2={y2}
                        stroke={branch.color}
                        strokeWidth="2"
                        opacity="0.8"
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ pointerEvents: "stroke" }}
                      />
                    </g>
                  );
                })}

                {/* Branch merge lines to main timeline */}
                {branch.days.map((day) => {
                  const y = (day - 1) * dayHeight + dayHeight / 2 - 2;
                  const controlPointX = (mainLineX + branchX) / 2;
                  const dayNodeX = mainLineX;

                  return (
                    <g key={`merge-${branch.eventyrId}-${day}`}>
                      <title>
                        {branch.name} (Dag {day})
                      </title>
                      <path
                        d={`M ${dayNodeX} ${y} Q ${controlPointX} ${y}, ${branchX} ${y}`}
                        stroke={branch.color}
                        strokeWidth="2"
                        fill="none"
                        opacity="0.8"
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ pointerEvents: "stroke" }}
                      />
                    </g>
                  );
                })}

                {/* Branch start/end circles */}
                {[branch.startDay, branch.endDay].map((day) => {
                  const y = (day - 1) * dayHeight + dayHeight / 2 - 2;
                  const isStart = day === branch.startDay;
                  const circleType = isStart ? "start" : "end";
                  return (
                    <g key={`branch-circle-${branch.eventyrId}-${day}-${circleType}`}>
                      <title>
                        {branch.name} - {isStart ? "Start" : "Slutt"} (Dag {day}
                        )
                      </title>
                      <circle
                        cx={branchX}
                        cy={y}
                        r="4"
                        fill={branch.color}
                        opacity="0.9"
                        className="hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ pointerEvents: "all" }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Day nodes */}
        <div
          className="relative"
          style={{ marginLeft: `${mainLineX - dayCircleRadius}px` }}
        >
          {timelineData.map((event) => {
            const y = (event.day - 1) * dayHeight;
            const isSelected = event.day === selectedDay;

            // Determine day circle color
            let circleColor = "bg-(--gray)";
            let textColor = "text-black";
            let borderColor = "border-(--gray)";

            if (event.isCompleted) {
              circleColor = "bg-(--gold)";
              textColor = "text-black";
              borderColor = "border-(--gold)";
            } else if (event.isAccessible) {
              circleColor = "bg-(--neon-green)";
              textColor = "text-black";
              borderColor = "border-(--neon-green)";
            }

            return (
              <div
                key={event.day}
                className="absolute left-0 group flex items-center"
                style={{
                  top: `${y}px`,
                  height: `${dayHeight}px`,
                }}
                data-timeline-day={event.day}
              >
                {/* Day circle */}
                <button
                  onClick={() => onSelectDay(event.day)}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    text-xs font-bold transition-all
                    ${circleColor} ${textColor}
                    ${isSelected ? "border-4 border-(--neon-green) shadow-[0_0_10px_var(--neon-green)]" : `border-2 ${borderColor}`}
                    hover:scale-110 cursor-pointer
                  `}
                  title={`Dag ${event.day}: ${event.title}`}
                >
                  {event.day}
                </button>

                {/* Event indicators (emojis) - now on LEFT */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm flex-row-reverse">
                  {/* Bonus quest */}
                  {event.hasBonusOppdrag && (
                    <span
                      title={`Bonusoppdrag ${event.bonusCompleted ? "(fullført)" : ""}`}
                      className={
                        event.bonusCompleted ? "opacity-100" : "opacity-50"
                      }
                    >
                      🏅
                    </span>
                  )}

                  {/* Symbol reward */}
                  {event.hasSymbol && (
                    <span
                      title={`Symbol ${event.symbolCollected ? "(samlet)" : ""}`}
                      className={
                        event.symbolCollected ? "opacity-100" : "opacity-50"
                      }
                    >
                      💎
                    </span>
                  )}

                  {/* Module unlock */}
                  {event.hasModule && <span title="Modul-opplåsing">🔓</span>}

                  {/* Decryption challenge */}
                  {event.hasDecryption && (
                    <span
                      title={`Dekryptering ${event.decryptionSolved ? "(løst)" : ""}`}
                      className={
                        event.decryptionSolved ? "opacity-100" : "opacity-50"
                      }
                    >
                      🔐
                    </span>
                  )}
                </div>

                {/* Hover tooltip - now on RIGHT side with more space */}
                <div
                  className="absolute left-full ml-4 top-0 hidden group-hover:block
                    bg-black border-2 border-(--neon-green) p-3 min-w-[300px] max-w-[400px]"
                  style={{ pointerEvents: "none", zIndex: 9999 }}
                >
                  <div className="text-(--gold) font-bold text-lg mb-2">
                    DAG {event.day}: {event.title}
                  </div>

                  <div className="text-(--neon-green) text-sm space-y-1">
                    <div>
                      🎄 Kode:{" "}
                      <span className="text-(--cold-blue)">{event.code}</span>
                    </div>

                    {event.hasBonusOppdrag && (
                      <div>
                        🏅 Bonusoppdrag{" "}
                        {event.bonusCompleted ? (
                          <span className="text-(--gold)">✓ Fullført</span>
                        ) : (
                          <span className="text-(--gray)">Tilgjengelig</span>
                        )}
                      </div>
                    )}

                    {event.hasSymbol && (
                      <div>
                        💎 Symbol{" "}
                        {event.symbolCollected ? (
                          <span className="text-(--gold)">✓ Samlet</span>
                        ) : (
                          <span className="text-(--gray)">Tilgjengelig</span>
                        )}
                      </div>
                    )}

                    {event.hasModule && (
                      <div className="text-(--cold-blue)">
                        🔓 Modul låses opp
                      </div>
                    )}

                    {event.hasDecryption && (
                      <div>
                        🔐 Dekryptering{" "}
                        {event.decryptionSolved ? (
                          <span className="text-(--gold)">✓ Løst</span>
                        ) : (
                          <span className="text-(--gray)">Tilgjengelig</span>
                        )}
                      </div>
                    )}

                    {event.eventyrPhases.map((phase) => (
                      <div key={phase.eventyrId} style={{ color: phase.color }}>
                        📖 {phase.eventyrName} (Fase {phase.phase}/
                        {phase.totalPhases})
                      </div>
                    ))}

                    <div className="mt-2 pt-2 border-t border-(--neon-green)/30">
                      Status:{" "}
                      {event.isCompleted ? (
                        <span className="text-(--gold)">✓ FULLFØRT</span>
                      ) : event.isAccessible ? (
                        <span className="text-(--neon-green)">
                          TILGJENGELIG
                        </span>
                      ) : (
                        <span className="text-(--gray)">LÅST</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t-2 border-(--neon-green)/30 shrink-0">
        <div className="text-(--gold) font-bold text-xs mb-2 text-center">
          FORKLARING:
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
          <div>🏅 Bonusoppdrag</div>
          <div>💎 Symbol</div>
          <div>🔓 Modul</div>
          <div>🔐 Dekryptering</div>
        </div>
      </div>
    </div>
  );
}

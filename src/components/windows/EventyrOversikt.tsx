"use client";

import { RetroWindow } from "../ui/RetroWindow";
import { Icons, Icon } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getAllEventyr, getEventyrDays } from "@/lib/eventyr";
import { BadgeManager } from "@/lib/badge-system";
import { useState, useEffect } from "react";
import type { Eventyr } from "@/types/innhold";

interface EventyrOversiktProps {
  onClose: () => void;
}

/**
 * EventyrOversikt - Story Arc Progress Tracker
 *
 * Kid-friendly interface showing:
 * - Story arc cards with colorful icons
 * - Progress bars showing completed chapters
 * - Unlocked badges for finished stories
 * - Visual indication of current/next story phases
 */
export function EventyrOversikt({ onClose }: EventyrOversiktProps) {
  const [eventyrList, setEventyrList] = useState<Eventyr[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [completedEventyr, setCompletedEventyr] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<
    Array<{ badgeId: string; eventyrId: string }>
  >([]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const allEventyr = getAllEventyr();
      const gameState = GameEngine.loadGameState();
      const completed = GameEngine.getCompletedEventyr();
      const earnedBadgesList = BadgeManager.getEarnedBadges();

      // Map earned badges to eventyr IDs
      const eventyrBadges = earnedBadgesList
        .map((eb) => {
          const badge = BadgeManager.getBadge(eb.badgeId);
          if (badge?.unlockCondition?.type === "eventyr") {
            return {
              badgeId: eb.badgeId,
              eventyrId: badge.unlockCondition.eventyrId,
            };
          }
          return null;
        })
        .filter((b): b is { badgeId: string; eventyrId: string } => b !== null);

      setEventyrList(allEventyr);
      setCompletedDays(gameState.completedQuests);
      setCompletedEventyr(completed);
      setEarnedBadges(eventyrBadges);
    });
  }, []);

  const getIconName = (eventyrIcon: string): string => {
    const iconMap: Record<string, string> = {
      alert: "alert",
      zap: "zap",
      mail: "mail",
      pin: "pin",
      eye: "eye",
      calendar: "calendar",
      book: "book",
      award: "trophy",
      truck: "truck",
    };
    return iconMap[eventyrIcon] || "help-circle";
  };

  const calculateProgress = (
    eventyr: Eventyr,
  ): {
    completed: number;
    total: number;
    percentage: number;
  } => {
    const days = getEventyrDays(eventyr.id);
    const completedCount = days.filter((day) => completedDays.has(day)).length;
    return {
      completed: completedCount,
      total: days.length,
      percentage:
        days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0,
    };
  };

  const isEventyrComplete = (eventyrId: string): boolean => {
    return completedEventyr.includes(eventyrId);
  };

  const hasBadge = (eventyrId: string): boolean => {
    return earnedBadges.some((b) => b.eventyrId === eventyrId);
  };

  return (
    <RetroWindow title="EVENTYR-OVERSIKT" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.ScriptText size={32} color="green" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              EVENTYRENE I SNØFALL
            </div>
            <div className="text-sm opacity-70">
              Følg med på eventyrene gjennom desember
            </div>
          </div>
          <div className="text-right">
            <div className="text-(--gold) font-bold text-xl">
              {completedEventyr.length}/{eventyrList.length}
            </div>
            <div className="text-xs opacity-70">FULLFØRT</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 border-2 border-(--cold-blue)/50 bg-(--cold-blue)/10 text-(--cold-blue) text-sm">
          <div className="font-bold mb-2 flex items-center gap-2">
            <Icons.ScriptText size={16} color="blue" />
            <span>OM EVENTYRENE</span>
          </div>
          <div className="opacity-90">
            Hvert eventyr i Snøfall strekker seg over flere dager i kalenderen.
            Fullfør alle dagene i et eventyr for å låse opp merker og bonuser!
          </div>
        </div>

        {/* Eventyr Cards */}
        <div className="space-y-4">
          {eventyrList.map((eventyr) => {
            const progress = calculateProgress(eventyr);
            const isComplete = isEventyrComplete(eventyr.id);
            const hasBadgeReward = hasBadge(eventyr.id);
            const days = getEventyrDays(eventyr.id);

            return (
              <div
                key={eventyr.id}
                className={`
                  border-4 p-4 transition-all
                  ${
                    isComplete
                      ? "border-(--gold) bg-(--gold)/10 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                      : progress.completed > 0
                        ? "border-(--neon-green) bg-(--neon-green)/5"
                        : "border-(--gray)/30 bg-(--gray)/5"
                  }
                `}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  {/* Icon */}
                  <div
                    className={`
                      flex items-center justify-center w-16 h-16 border-2
                      ${
                        isComplete
                          ? "border-(--gold) bg-(--gold)/20"
                          : progress.completed > 0
                            ? "border-(--neon-green) bg-(--neon-green)/10"
                            : "border-(--gray) bg-(--gray)/5"
                      }
                    `}
                  >
                    <Icon
                      name={getIconName(eventyr.ikon)}
                      size={32}
                      color={
                        isComplete
                          ? "gold"
                          : progress.completed > 0
                            ? "green"
                            : "gray"
                      }
                    />
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`
                          text-xl font-bold tracking-wider
                          ${isComplete ? "text-(--gold)" : "text-(--neon-green)"}
                        `}
                      >
                        {eventyr.navn}
                      </div>
                      {hasBadgeReward && (
                        <Icons.Trophy
                          size={20}
                          color="gold"
                          className="animate-[gold-flash_2s_ease-in-out_infinite]"
                        />
                      )}
                    </div>
                    <div className="text-sm opacity-80 mb-2">
                      {eventyr.beskrivelse}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {eventyr.tema.slice(0, 3).map((tema, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 border border-(--neon-green)/30 bg-(--neon-green)/5"
                        >
                          {tema}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    {isComplete ? (
                      <div className="flex flex-col items-center gap-1">
                        <Icons.CheckCircle size={24} color="gold" />
                        <div className="text-(--gold) text-xs font-bold">
                          FULLFØRT!
                        </div>
                      </div>
                    ) : progress.completed > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <Icons.Calendar size={24} color="green" />
                        <div className="text-(--neon-green) text-xs font-bold">
                          I GANG
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Icons.Lock size={24} color="gray" />
                        <div className="text-(--gray) text-xs font-bold">
                          VENTER
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={
                        isComplete ? "text-(--gold)" : "text-(--neon-green)"
                      }
                    >
                      FREMGANG
                    </span>
                    <span
                      className={
                        isComplete ? "text-(--gold)" : "text-(--neon-green)"
                      }
                    >
                      {progress.completed}/{progress.total} DAGER
                    </span>
                  </div>
                  <div className="h-4 border-2 border-(--neon-green)/30 bg-black relative overflow-hidden">
                    <div
                      className={`
                        h-full transition-all duration-500
                        ${
                          isComplete
                            ? "bg-(--gold) animate-[gold-flash_2s_ease-in-out_infinite]"
                            : "bg-(--neon-green)"
                        }
                      `}
                      style={{ width: `${progress.percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs">
                      {progress.percentage}%
                    </div>
                  </div>
                </div>

                {/* Days List */}
                <div className="flex flex-wrap gap-1">
                  {days.map((day) => {
                    const isDayCompleted = completedDays.has(day);
                    return (
                      <div
                        key={day}
                        className={`
                          w-8 h-8 flex items-center justify-center text-xs font-bold border-2
                          ${
                            isDayCompleted
                              ? "border-(--gold) bg-(--gold)/20 text-(--gold)"
                              : "border-(--gray)/30 bg-(--gray)/5 text-(--gray)"
                          }
                        `}
                        title={`Dag ${day}`}
                      >
                        {isDayCompleted ? "✓" : day}
                      </div>
                    );
                  })}
                </div>

                {/* Reward Info */}
                {eventyr.belønning && (
                  <div className="mt-3 pt-3 border-t-2 border-(--neon-green)/20">
                    <div className="flex items-center gap-2 text-xs">
                      <Icons.Gift
                        size={16}
                        color={isComplete ? "gold" : "green"}
                      />
                      <span
                        className={
                          isComplete ? "text-(--gold)" : "text-(--neon-green)"
                        }
                      >
                        BELØNNING: {eventyr.belønning.beskrivelse}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="pt-4 border-t-4 border-(--neon-green)/30 text-center">
          <div className="text-(--cold-blue) text-sm opacity-80">
            💫 Fortsett å løse oppdrag for å fullføre alle eventyrene! 💫
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}

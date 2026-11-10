"use client";

import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { GameEngine } from "@/lib/game-engine";
import { getAllEventyr, getEventyrProgress } from "@/lib/eventyr";
import { useState, useEffect } from "react";

interface EventyrOversiktProps {
  onClose: () => void;
}

/**
 * EventyrOversikt - one story, one progress line with its milestones (M1–M6)
 */
export function EventyrOversikt({ onClose }: EventyrOversiktProps) {
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const eventyr = getAllEventyr()[0];

  useEffect(() => {
    requestAnimationFrame(() =>
      setCompletedDays(GameEngine.getCompletedDays()),
    );
  }, []);

  const progress = getEventyrProgress(eventyr.id, completedDays);
  const isComplete = progress === 100;

  return (
    <RetroWindow
      title={`EVENTYR — ${eventyr.navn.toUpperCase()}`}
      onClose={onClose}
    >
      <div className="p-6 h-full overflow-y-auto space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.ScriptText size={32} color={isComplete ? "gold" : "green"} />
          <div className="flex-1">
            <div
              className={`text-2xl font-bold tracking-wider ${isComplete ? "text-(--gold)" : ""}`}
            >
              {eventyr.navn.toUpperCase()}
            </div>
            {/* The description names Kulde, the day 7 code */}
            {completedDays.has(7) && (
              <div className="text-base opacity-80">{eventyr.beskrivelse}</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-base mb-1">
            <span>FREMGANG</span>
            <span>{progress}%</span>
          </div>
          <div className="h-4 border-2 border-(--neon-green)/30 bg-black overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isComplete ? "bg-(--gold)" : "bg-(--neon-green)"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ol className="space-y-3">
          {eventyr.milepaeler.map((m) => {
            const reached = completedDays.has(m.dag);
            return (
              <li
                key={m.dag}
                className={`flex gap-3 items-start p-3 border-2 ${
                  reached
                    ? "border-(--gold) bg-(--gold)/10"
                    : "border-(--gray)/30 text-(--gray)"
                }`}
              >
                <span className="w-16 shrink-0 font-bold">DAG {m.dag}</span>
                {reached ? (
                  <span>
                    <span className="font-bold text-(--gold)">{m.navn}.</span>{" "}
                    {m.tekst}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.Lock size={16} color="gray" /> Låst
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </RetroWindow>
  );
}

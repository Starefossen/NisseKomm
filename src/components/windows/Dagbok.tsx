"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Oppdrag } from "@/types/innhold";
import { StorageManager } from "@/lib/storage";
import { GameEngine } from "@/lib/game-engine";
import { getEventyr } from "@/lib/eventyr";

interface DagbokProps {
  missions: Oppdrag[];
  onClose: () => void;
}

export function Dagbok({ missions, onClose }: DagbokProps) {
  const [lastReadDay, setLastReadDay] = useState<number>(() =>
    StorageManager.getDagbokLastRead(),
  );
  const entryRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Get completed quests to filter diary entries
  const completedQuests =
    typeof window !== "undefined"
      ? GameEngine.loadGameState().completedQuests
      : new Set<number>();

  // Filter missions to only show completed quests with diary entries
  const completedEntries = missions
    .filter((m) => completedQuests.has(m.dag) && m.dagbokinnlegg)
    .sort((a, b) => a.dag - b.dag);

  // Set up IntersectionObserver to mark entries as read
  useEffect(() => {
    if (typeof window === "undefined" || completedEntries.length === 0) return;

    // Create observer to track when entries are viewed
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const day = parseInt(
              entry.target.getAttribute("data-day") || "0",
              10,
            );
            if (day > 0) {
              // Mark as read after 3 seconds of visibility
              setTimeout(() => {
                if (entry.isIntersecting && day > lastReadDay) {
                  StorageManager.setDagbokLastRead(day);
                  setLastReadDay(day);
                }
              }, 3000);
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    // Observe all entry elements
    entryRefs.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [completedEntries.length, lastReadDay]);

  // Auto-scroll to first unread entry on mount
  useEffect(() => {
    if (completedEntries.length === 0) return;

    // Find first unread entry
    const firstUnread = completedEntries.find((m) => m.dag > lastReadDay);

    if (firstUnread) {
      // Scroll to first unread entry (centered)
      const element = entryRefs.current.get(firstUnread.dag);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 100);
      }
    } else {
      // All entries read, scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Callback to set entry ref
  const setEntryRef = useCallback(
    (day: number, element: HTMLDivElement | null) => {
      if (element) {
        entryRefs.current.set(day, element);
      } else {
        entryRefs.current.delete(day);
      }
    },
    [],
  );

  return (
    <RetroWindow title="JULIUS' DAGBOK" onClose={onClose}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6"
      >
        {completedEntries.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md space-y-4">
              <div className="text-4xl opacity-30">📖</div>
              <div className="text-lg opacity-70">
                Julius' dagbok er tom. Fullfør oppdrag for å låse opp innlegg.
              </div>
            </div>
          </div>
        ) : (
          // Dagbok entries
          completedEntries.map((mission, index) => {
            const isUnread = mission.dag > lastReadDay;
            const eventyr = mission.eventyr
              ? getEventyr(mission.eventyr.id)
              : null;

            return (
              <div
                key={mission.dag}
                ref={(el) => setEntryRef(mission.dag, el)}
                data-day={mission.dag}
                className={`
                  ${index > 0 ? "pt-6 border-t-2 border-dotted border-(--neon-green)/50" : ""}
                  ${isUnread ? "opacity-100 border-l-4 border-(--gold) pl-4" : "opacity-70 pl-1"}
                `}
              >
                {/* Entry content */}
                <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {mission.dagbokinnlegg}
                </div>

                {/* Eventyr badge at end */}
                {eventyr && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-(--gold) opacity-70">
                      📜 {eventyr.navn}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </RetroWindow>
  );
}

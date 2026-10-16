"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { RetroWindow } from "../ui/RetroWindow";
import { Oppdrag } from "@/types/innhold";
import { StorageManager } from "@/lib/storage";
import { GameEngine } from "@/lib/game-engine";
import { getEventyr } from "@/lib/eventyr";
import { trackEvent } from "@/lib/analytics";
import { resolveTemplate } from "@/lib/template-resolver";
import { getCurrentDate } from "@/lib/date-utils";

interface DagbokProps {
  missions: Oppdrag[];
  onClose: () => void;
}

export function Dagbok({ missions, onClose }: DagbokProps) {
  const [lastReadDay, setLastReadDay] = useState<number>(() =>
    StorageManager.getDagbokLastRead(),
  );
  const [playerNames] = useState<string[]>(() => GameEngine.getPlayerNames());
  const [currentTime, setCurrentTime] = useState<Date>(() => getCurrentDate());
  const entryRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

                  // Track diary entry read
                  trackEvent("dagbok_entry_read", { day });
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

  const scrollToDay = (day: number) => {
    const element = entryRefs.current.get(day);
    if (element) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  return (
    <RetroWindow title="JULIUS' DAGBOK — SNØFALL-KRØNIKEN" onClose={onClose}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-(--dark-crt)"
      >
        {/* LIVE CRT ARCHIVE CAMERA FEED OF JULIUS' TIMBER STUDY */}
        <div className="relative w-full h-48 md:h-56 border-4 border-(--gold)/60 bg-black overflow-hidden shadow-[0_0_24px_rgba(255,215,0,0.2)]">
          {/* Painterly Study Feed with Slow Pan */}
          <div className="absolute inset-0 animate-[tv-camera-pan_30s_ease-in-out_infinite]">
            <Image
              src="/feed/julius-kontor.png"
              alt="Julius' Kontor og Snøfall-krøniken"
              fill
              className="object-cover"
              style={{ filter: "contrast(1.08) saturate(1.1)" }}
              priority
            />

            {/* Live Falling Snow Clipped Inside Julius' Arched Timber Window */}
            <div
              className="absolute overflow-hidden pointer-events-none opacity-85"
              style={{
                left: "41.5%",
                top: "14%",
                width: "17%",
                height: "40%",
                borderRadius: "48% 48% 0 0",
              }}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`dagbok-snow-${i}`}
                  className="absolute bg-white rounded-full"
                  style={
                    {
                      width: `${2 + (i % 2)}px`,
                      height: `${2 + (i % 2)}px`,
                      left: `${(i * 19) % 100}%`,
                      opacity: 0.75,
                      animation: `snowfall ${3.2 + (i % 3)}s -${i * 0.4}s linear infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            {/* Warm Flickering Candle & Lantern Blooms */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen animate-[flicker_2.4s_infinite]"
              style={{
                background:
                  "radial-gradient(circle at 31.5% 24%, rgba(255, 195, 70, 0.5) 0%, transparent 10%), radial-gradient(circle at 70.8% 34.5%, rgba(255, 190, 65, 0.45) 0%, transparent 10%), radial-gradient(circle at 56.8% 50.5%, rgba(255, 200, 80, 0.5) 0%, transparent 8%), radial-gradient(circle at 86.5% 52.5%, rgba(255, 185, 60, 0.55) 0%, transparent 9%)",
              }}
            />

            {/* Golden Illumination over Open Snøfall-krøniken Book on Desk */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen animate-pulse"
              style={{
                background:
                  "radial-gradient(ellipse 20% 14% at 48% 76%, rgba(255, 215, 90, 0.7) 0%, rgba(255, 170, 40, 0.3) 55%, transparent 85%)",
              }}
            />
          </div>

          {/* CRT Scanlines & Vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Top & Bottom Camera OSD */}
          <div className="absolute inset-0 z-20 p-3 flex flex-col justify-between pointer-events-none font-mono">
            <div className="flex items-center justify-between">
              <div className="bg-black/80 border border-(--gold)/60 px-2.5 py-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                <span className="text-xs font-bold text-(--gold)">
                  ARKIV-KAMERA 05 // JULIUS&apos; KONTOR
                </span>
              </div>
              <div className="bg-black/80 border border-(--neon-green)/50 px-2.5 py-1 text-xs text-(--neon-green)">
                {currentTime.toLocaleTimeString("no-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="bg-black/85 border border-(--gold)/50 px-3 py-1.5">
                <div className="text-xs font-bold text-(--gold)">
                  📖 SNØFALL-KRØNIKEN — HÅNDSKREVNE NOTATER FRA JULIUS
                </div>
                <div className="text-[11px] text-(--neon-green)/90">
                  Hver løst dagskode låser opp en ny side fra boken på pulten
                </div>
              </div>
              <div className="bg-black/85 border border-(--gold) px-2.5 py-1 text-xs font-bold text-(--gold)">
                KAPITLER: {completedEntries.length} / 24
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Quick-Jump Bar */}
        {completedEntries.length > 0 && (
          <div className="p-2.5 border-2 border-(--gold)/40 bg-black/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-(--gold) mr-1">
              HOPP TIL DAG:
            </span>
            {completedEntries.map((m) => {
              const unread = m.dag > lastReadDay;
              return (
                <button
                  key={m.dag}
                  onClick={() => scrollToDay(m.dag)}
                  className={`px-2 py-0.5 text-xs font-mono font-bold border cursor-pointer transition-colors ${
                    unread
                      ? "border-(--gold) bg-(--gold) text-black animate-pulse"
                      : "border-(--neon-green)/40 text-(--neon-green) hover:border-(--gold) hover:text-(--gold)"
                  }`}
                >
                  {m.dag}. des{unread ? " ★" : ""}
                </button>
              );
            })}
          </div>
        )}

        {completedEntries.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-12 text-center border-2 border-dashed border-(--gold)/30 bg-black/40">
            <div className="max-w-md space-y-3 p-4">
              <div className="text-4xl">📖</div>
              <div className="text-lg text-(--gold) font-bold">
                Snøfall-krøniken venter på første kode
              </div>
              <div className="text-sm text-(--neon-green)/80">
                Julius&apos; dagbok er låst med julemagi. Løs dagens oppdrag i
                NisseMail og tast inn koden i KodeTerminal for å åpne første
                kapittel!
              </div>
            </div>
          </div>
        ) : (
          // Dagbok entries
          <div className="space-y-5">
            {completedEntries.map((mission) => {
              const isUnread = mission.dag > lastReadDay;
              const eventyr = mission.eventyr
                ? getEventyr(mission.eventyr.id)
                : null;

              return (
                <div
                  key={mission.dag}
                  ref={(el) => setEntryRef(mission.dag, el)}
                  data-day={mission.dag}
                  className={`p-4 md:p-5 border-2 transition-all bg-black/65 ${
                    isUnread
                      ? "border-(--gold) shadow-[0_0_18px_rgba(255,215,0,0.2)]"
                      : "border-(--neon-green)/35 opacity-85"
                  }`}
                >
                  {/* Entry Chronicle Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-(--gold)/30">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-(--gold)/20 border border-(--gold) text-(--gold) text-xs font-bold font-mono">
                        DAG {mission.dag}. DESEMBER
                      </span>
                      <span className="text-sm md:text-base font-bold text-(--gold)">
                        {mission.tittel}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 border ${
                        isUnread
                          ? "border-(--gold) bg-(--gold) text-black font-bold"
                          : "border-(--neon-green)/40 text-(--neon-green)/70"
                      }`}
                    >
                      {isUnread ? "★ NYTT DAGBOKINNLEGG" : "✓ ARKIVERT"}
                    </span>
                  </div>

                  {/* Entry content */}
                  <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-(--neon-green)">
                    {resolveTemplate(mission.dagbokinnlegg || "", {
                      playerNames,
                    })}
                  </div>

                  {/* Eventyr badge & signature footer */}
                  <div className="mt-4 pt-3 border-t border-(--neon-green)/20 flex flex-wrap items-center justify-between gap-2">
                    {eventyr ? (
                      <span className="text-xs text-(--gold) font-mono">
                        📜 EVENTYR-TRÅD: {eventyr.navn}
                      </span>
                    ) : (
                      <span className="text-xs text-(--neon-green)/60 font-mono">
                        📜 SNØFALL-KRØNIKEN
                      </span>
                    )}
                    <span className="text-xs text-(--gold)/80 italic">
                      — Julius, Juleverkstedet i Snøfall
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RetroWindow>
  );
}

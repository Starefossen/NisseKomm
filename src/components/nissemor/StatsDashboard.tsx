"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { GameEngine } from "@/lib/game-engine";
import { BadgeManager } from "@/lib/badge-system";
import { getEventyrProgress } from "@/lib/eventyr";
import { Icon } from "@/lib/icons";

interface StatsDashboardProps {
  refreshCounter?: number;
}

export function StatsDashboard({ refreshCounter = 0 }: StatsDashboardProps) {
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);

  // Listen for storage changes to auto-update
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("nissekomm-")) {
        setInternalRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Combine external refreshCounter with internal storage listener
  const effectiveRefreshKey = refreshCounter + internalRefreshKey;

  const progression = useMemo(
    () => GameEngine.getProgressionSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRefreshKey],
  );

  const completedDays = useMemo(
    () => GameEngine.getCompletedDays(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRefreshKey],
  );

  const collectedSymbols = useMemo(
    () => GameEngine.getCollectedSymbols(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRefreshKey],
  );

  const solvedDecryptions = useMemo(
    () => GameEngine.getSolvedDecryptions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRefreshKey],
  );

  const eventyrProgress = useMemo(() => {
    const completedSet = new Set(completedDays);
    const eventyr1 = getEventyrProgress("morkets-voktere", completedSet);
    const eventyr2 = getEventyrProgress("iq-test", completedSet);
    return { eventyr1, eventyr2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRefreshKey, completedDays]);

  const badges = useMemo(
    () => BadgeManager.getEarnedBadges(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRefreshKey],
  );

  // Symbol icons matching actual QR cards (heart/sun/moon × green/red/blue)
  const symbolMapping = [
    { id: "heart-green", icon: "heart", color: "green" as const },
    { id: "heart-red", icon: "heart", color: "red" as const },
    { id: "heart-blue", icon: "heart", color: "blue" as const },
    { id: "sun-green", icon: "sun", color: "green" as const },
    { id: "sun-red", icon: "sun", color: "red" as const },
    { id: "sun-blue", icon: "sun", color: "blue" as const },
    { id: "moon-green", icon: "moon", color: "green" as const },
    { id: "moon-red", icon: "moon", color: "red" as const },
    { id: "moon-blue", icon: "moon", color: "blue" as const },
  ];
  const symbolsWithStatus = symbolMapping.map(({ id, icon, color }) => ({
    icon,
    color,
    collected: collectedSymbols.some((s) => s.symbolId === id),
  }));

  // Badge icons (simplified)
  const badgeSlots = 7;
  const earnedCount = badges.length;

  return (
    <div className="space-y-4">
      {/* Top Row: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Quests */}
        <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 animate-[scale-in_0.3s_ease-out]">
          <div className="text-center space-y-2">
            <div className="text-3xl flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://unpkg.com/pixelarticons@1.8.1/svg/calendar.svg"
                alt="Oppdrag"
                className="w-12 h-12 pixelated"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(80%) sepia(62%) saturate(1523%) hue-rotate(359deg) brightness(104%) contrast(104%)",
                }}
              />
            </div>
            <h3 className="text-lg font-bold text-(--neon-green)">OPPDRAG</h3>
            <div className="text-3xl font-bold text-(--gold)">
              {progression.mainQuests.completed} /{" "}
              {progression.mainQuests.total}
            </div>
            <div className="w-full bg-(--dark-crt) border-2 border-(--neon-green)/50 h-3">
              <div
                className="h-full bg-(--neon-green) transition-all duration-1000"
                style={{ width: `${progression.mainQuests.percentage}%` }}
              />
            </div>
            <Link
              href="/nissemor-guide/oppdrag"
              className="text-sm text-(--neon-green) hover:text-(--gold) transition-colors underline"
            >
              Se detaljer →
            </Link>
          </div>
        </div>

        {/* Badges */}
        <div className="border-4 border-(--gold) bg-(--gold)/5 p-4 animate-[scale-in_0.3s_ease-out_0.1s]">
          <div className="text-center space-y-2">
            <div className="text-3xl flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/badges/trophy.svg"
                alt="Merker"
                className="w-12 h-12 pixelated"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(80%) sepia(62%) saturate(1523%) hue-rotate(359deg) brightness(104%) contrast(104%)",
                }}
              />
            </div>
            <h3 className="text-lg font-bold text-(--gold)">MERKER</h3>
            <div className="text-3xl font-bold text-(--gold)">
              {earnedCount} / {badgeSlots}
            </div>
            <div className="flex justify-center gap-1 text-xl flex-wrap">
              {Array.from({ length: badgeSlots }).map((_, idx) => (
                <span key={idx}>
                  {idx < earnedCount ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/badges/trophy.svg"
                      alt="Badge"
                      className="w-6 h-6 inline pixelated"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(80%) sepia(62%) saturate(1523%) hue-rotate(359deg) brightness(104%) contrast(104%)",
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="https://unpkg.com/pixelarticons@1.8.1/svg/lock.svg"
                      alt="Locked"
                      className="w-6 h-6 inline pixelated"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(44%) sepia(0%) saturate(0%) hue-rotate(199deg) brightness(92%) contrast(88%)",
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
            <Link
              href="/nissemor-guide/merker"
              className="text-sm text-(--gold) hover:text-(--neon-green) transition-colors underline"
            >
              Se detaljer →
            </Link>
          </div>
        </div>

        {/* Symbols */}
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/5 p-4 animate-[scale-in_0.3s_ease-out_0.2s]">
          <div className="text-center space-y-2">
            <div className="text-3xl flex justify-center">
              <Icon name="heart" size={48} color="blue" />
            </div>
            <h3 className="text-lg font-bold text-(--cold-blue)">SYMBOLER</h3>
            <div className="text-3xl font-bold text-(--gold)">
              {collectedSymbols.length} / 9
            </div>
            <div className="grid grid-cols-3 gap-1 text-xl">
              {symbolsWithStatus.map(({ icon, color, collected }, idx) => (
                <span key={idx} className={collected ? "" : "opacity-30"}>
                  <Icon name={icon} size={24} color={color} />
                </span>
              ))}
            </div>
            <Link
              href="/nissemor-guide/symboler"
              className="text-sm text-(--cold-blue) hover:text-(--gold) transition-colors underline"
            >
              Se detaljer →
            </Link>
          </div>
        </div>

        {/* Eventyr */}
        <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 animate-[scale-in_0.3s_ease-out_0.3s]">
          <div className="text-center space-y-2">
            <div className="text-3xl flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://unpkg.com/pixelarticons@1.8.1/svg/script-text.svg"
                alt="Eventyr"
                className="w-12 h-12 pixelated"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(75%) sepia(71%) saturate(2234%) hue-rotate(151deg) brightness(104%) contrast(101%)",
                }}
              />
            </div>
            <h3 className="text-lg font-bold text-(--neon-green)">EVENTYR</h3>
            <div className="space-y-1 text-sm">
              <div>
                <div className="text-purple-400 font-bold">Mørkets Voktere</div>
                <div className="w-full bg-(--dark-crt) border border-(--neon-green)/50 h-2">
                  <div
                    className="h-full bg-purple-500 transition-all duration-1000"
                    style={{ width: `${eventyrProgress.eventyr1}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-orange-400 font-bold">IQ-Test</div>
                <div className="w-full bg-(--dark-crt) border border-(--neon-green)/50 h-2">
                  <div
                    className="h-full bg-orange-500 transition-all duration-1000"
                    style={{ width: `${eventyrProgress.eventyr2}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              href="/nissemor-guide/eventyr"
              className="text-sm text-(--neon-green) hover:text-(--gold) transition-colors underline text-center block"
            >
              Se detaljer →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Bonus & Decryptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bonus Quests */}
        <div className="border-4 border-(--gold) bg-(--gold)/5 p-4 animate-[scale-in_0.3s_ease-out_0.4s]">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Icon name="alert" size={32} color="gold" />
              <h3 className="text-xl font-bold text-(--gold)">BONUSOPPDRAG</h3>
            </div>
            <div className="text-2xl font-bold text-center text-(--gold)">
              {progression.bonusOppdrag.completed} /{" "}
              {progression.bonusOppdrag.available}
            </div>
            <div className="flex gap-2 justify-center">
              <div
                className={`border-2 p-2 flex-1 text-center text-xs ${
                  progression.bonusOppdrag.completed >= 1
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-gray-600 bg-gray-600/10 opacity-50"
                }`}
              >
                <div className="font-bold mb-1">
                  {progression.bonusOppdrag.completed >= 1 ? "✓" : "🔒"}
                </div>
                <div>Antenne-krise</div>
                <div className="text-xs opacity-70">(Dag 11)</div>
              </div>
              <div
                className={`border-2 p-2 flex-1 text-center text-xs ${
                  progression.bonusOppdrag.completed >= 2
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-gray-600 bg-gray-600/10 opacity-50"
                }`}
              >
                <div className="font-bold mb-1">
                  {progression.bonusOppdrag.completed >= 2 ? "✓" : "🔒"}
                </div>
                <div>Inventar-kaos</div>
                <div className="text-xs opacity-70">(Dag 16)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decryptions */}
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/5 p-4 animate-[scale-in_0.3s_ease-out_0.5s]">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Icon name="lock" size={32} color="blue" />
              <h3 className="text-xl font-bold text-(--cold-blue)">
                DEKRYPTERINGER
              </h3>
            </div>
            <div className="text-2xl font-bold text-center text-(--gold)">
              {solvedDecryptions.length} / 3
            </div>
            <div className="flex gap-2 justify-center">
              <div
                className={`border-2 p-2 flex-1 text-center text-xs ${
                  solvedDecryptions.includes("decryption-1")
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-gray-600 bg-gray-600/10 opacity-50"
                }`}
              >
                <div className="font-bold mb-1">
                  {solvedDecryptions.includes("decryption-1") ? "✓" : "🔒"}
                </div>
                <div>ALFA</div>
                <div className="text-xs opacity-70">(Dag 9)</div>
              </div>
              <div
                className={`border-2 p-2 flex-1 text-center text-xs ${
                  solvedDecryptions.includes("decryption-2")
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-gray-600 bg-gray-600/10 opacity-50"
                }`}
              >
                <div className="font-bold mb-1">
                  {solvedDecryptions.includes("decryption-2") ? "✓" : "🔒"}
                </div>
                <div>BETA</div>
                <div className="text-xs opacity-70">(Dag 15)</div>
              </div>
              <div
                className={`border-2 p-2 flex-1 text-center text-xs ${
                  solvedDecryptions.includes("decryption-3")
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-gray-600 bg-gray-600/10 opacity-50"
                }`}
              >
                <div className="font-bold mb-1">
                  {solvedDecryptions.includes("decryption-3") ? "✓" : "🔒"}
                </div>
                <div>GAMMA</div>
                <div className="text-xs opacity-70">(Dag 21)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

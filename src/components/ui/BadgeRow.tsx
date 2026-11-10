"use client";

import Image from "next/image";
import { Icons } from "@/lib/icons";
import { BadgeManager } from "@/lib/badge-system";
import { useEffect, useState } from "react";
import type { Badge } from "@/types/innhold";

/**
 * Horizontal badge row: Varmebærer (day 12 decryption), Portvokter (day 21),
 * Snøfalls venn (all 24 days). A new badge shows its opplasingstekst in gold.
 *
 * Badges are loaded dynamically from merker.json via BadgeManager
 */
export function BadgeRow() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(
    new Set<string>(),
  );
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<string | null>(null);

  // Load badges and earned status on mount and when storage changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadBadges = () => {
      const allBadges = BadgeManager.getAllBadges();
      const earned = BadgeManager.getEarnedBadges();
      const earnedIds = new Set(earned.map((b) => b.badgeId));

      setBadges(allBadges);
      setEarnedBadgeIds(earnedIds);
    };

    // Load initially
    loadBadges();

    // Subscribe to badge award notifications for animations
    const handleBadgeAwarded = (badge: Badge) => {
      setNewlyEarnedBadge(badge.id);
      setEarnedBadgeIds((prev) => new Set([...prev, badge.id]));

      // Long enough to read the unlock text aloud
      setTimeout(() => {
        setNewlyEarnedBadge(null);
      }, 10000);
    };

    BadgeManager.onBadgeAwarded(handleBadgeAwarded);

    // Listen for storage changes (for Nissemor Guide updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nissekomm-earned-badges") {
        loadBadges();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      BadgeManager.offBadgeAwarded(handleBadgeAwarded);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (badges.length === 0) {
    return null; // Don't render until badges loaded
  }

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-6 bg-(--dark-crt)/50 border-t-4 border-(--neon-green)/30">
      {/* Trophy label */}
      <div className="flex items-center gap-2 mr-2">
        <Icons.Trophy className="w-5 h-5 text-(--gold)" />
        <span className="text-(--gold) font-bold text-base">MERKER:</span>
      </div>

      {/* Badge slots */}
      {badges.map((badge) => {
        const isEarned = earnedBadgeIds.has(badge.id);
        const isNewlyEarned = newlyEarnedBadge === badge.id;
        const isTrophy = badge.id === "snofalls-venn";

        const getLockedTooltip = () => {
          const c = badge.unlockCondition;
          if (c.type === "decryptionSolved") {
            return `🔒 ${badge.navn} - Løs den første dekrypteringen i NisseKrypto`;
          } else if (c.type === "dayCompleted") {
            return `🔒 ${badge.navn} - Løs dag ${c.day}`;
          }
          return `🔒 ${badge.navn} - Fullfør alle 24 dager`;
        };

        return (
          <div
            key={badge.id}
            className={`
              relative flex items-center justify-center
              ${isTrophy && isEarned ? "w-16 h-16" : "w-12 h-12"}
              border-2 transition-all duration-300
              ${
                isTrophy && isEarned
                  ? "border-4 border-(--gold) bg-(--gold)/20 shadow-[0_0_30px_rgba(255,215,0,0.6)] scale-110"
                  : isEarned
                    ? "border-(--gold) bg-(--gold)/10"
                    : "border-(--gray)/50 bg-(--gray)/5 opacity-30 grayscale"
              }
              ${isNewlyEarned ? "animate-[scale-in_0.5s_ease-out]" : ""}
              hover:opacity-100 hover:scale-105
            `}
            title={
              isEarned
                ? `✨ ${badge.navn} - ${badge.beskrivelse}`
                : getLockedTooltip()
            }
          >
            {/* SVG Badge Icon */}
            <Image
              src={`/badges/${badge.ikon}`}
              alt={isEarned ? badge.navn : `${badge.navn} (låst)`}
              width={isTrophy && isEarned ? 52 : 40}
              height={isTrophy && isEarned ? 52 : 40}
              className={`transition-all duration-300 ${
                isEarned ? "" : "opacity-50"
              }`}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />

            {/* Lock overlay for locked badges */}
            {!isEarned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Icons.Lock className="w-5 h-5 text-(--gray) opacity-80" />
              </div>
            )}

            {/* Shine effect for newly earned badges */}
            {isNewlyEarned && (
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_ease-in-out]" />
            )}
          </div>
        );
      })}
      {newlyEarnedBadge && (
        <div
          role="status"
          className="ml-3 max-w-md text-base text-(--gold) animate-[gold-flash_0.6s_ease-out]"
        >
          {badges.find((b) => b.id === newlyEarnedBadge)?.opplasingstekst}
        </div>
      )}
    </div>
  );
}

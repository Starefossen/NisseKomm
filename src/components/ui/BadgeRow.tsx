"use client";

import Image from "next/image";
import { Icons } from "@/lib/icons";
import { BadgeManager } from "@/lib/badge-system";
import { useEffect, useState } from "react";
import type { Badge } from "@/types/innhold";

/**
 * Horizontal badge row showing locked/unlocked achievements
 * - Bonusoppdrag badges: Side-quest resolutions (antenna, inventory)
 * - Eventyr badges: Story arc completions (Mørket, IQ, etc.)
 * - Decryption badges: Crypto challenges and symbol collection
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

      // Clear animation after 3 seconds
      setTimeout(() => {
        setNewlyEarnedBadge(null);
      }, 3000);
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
        <span className="text-(--gold) font-bold text-sm">MERKER:</span>
      </div>

      {/* Badge slots */}
      {badges.map((badge) => {
        const isEarned = earnedBadgeIds.has(badge.id);
        const isNewlyEarned = newlyEarnedBadge === badge.id;
        const isTrophy = badge.id === "julekalender-fullfort";

        // Determine tooltip text based on badge type
        const getLockedTooltip = () => {
          if (badge.unlockCondition.type === "bonusoppdrag") {
            return `🔒 ${badge.navn} - Løs bonusoppdraget på dag ${badge.unlockCondition.day}`;
          } else if (badge.unlockCondition.type === "eventyr") {
            return `🔒 ${badge.navn} - Fullfør ${badge.unlockCondition.eventyrId.replace(/-/g, " ")} eventyret`;
          } else if (badge.unlockCondition.type === "allDecryptionsSolved") {
            return `🔒 ${badge.navn} - Løs alle dekrypteringsutfordringer`;
          } else if (badge.unlockCondition.type === "allSymbolsCollected") {
            return `🔒 ${badge.navn} - Samle alle 9 symbolene`;
          } else if (badge.unlockCondition.type === "allQuestsCompleted") {
            return `🔒 ${badge.navn} - Fullfør alle 24 oppdrag`;
          }
          return `🔒 ${badge.navn} - Låst`;
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
                  ? "border-4 border-(--gold) bg-(--gold)/20 shadow-[0_0_30px_rgba(255,215,0,0.6)] scale-110 animate-[pulse-led_2s_ease-in-out_infinite]"
                  : isEarned
                    ? "border-(--gold) bg-(--gold)/10"
                    : "border-(--gray)/50 bg-(--gray)/5 opacity-30 grayscale"
              }
              ${isNewlyEarned ? "animate-[scale-in_0.5s_ease-out]" : ""}
              ${isEarned && !isNewlyEarned && !isTrophy ? "animate-[gold-flash_2s_ease-in-out_infinite]" : ""}
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
              alt={badge.navn}
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
    </div>
  );
}

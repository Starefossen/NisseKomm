"use client";

import { Icons } from "@/lib/icons";
import { StorageManager } from "@/lib/storage";

interface BadgeSlot {
  icon: keyof typeof Icons;
  name: string;
  unlocked: boolean;
}

/**
 * Horizontal badge row showing locked/unlocked side-quest achievements
 * Displayed at bottom of home screen as collectibles
 */
export function BadgeRow() {
  // Compute badges directly from storage
  const earnedBadges =
    typeof window !== "undefined" ? StorageManager.getSideQuestBadges() : [];

  // Define all 6 badge slots (2 active, 4 future)
  const badges: BadgeSlot[] = [
    {
      icon: "Zap",
      name: "ANTENNE-INGENIØR",
      unlocked: earnedBadges.some((b) => b.icon === "zap"),
    },
    {
      icon: "Coin",
      name: "INVENTAR-EKSPERT",
      unlocked: earnedBadges.some((b) => b.icon === "coin"),
    },
    {
      icon: "Heart",
      name: "???",
      unlocked: false,
    },
    {
      icon: "Trophy",
      name: "???",
      unlocked: false,
    },
    {
      icon: "Gift",
      name: "???",
      unlocked: false,
    },
    {
      icon: "Star",
      name: "???",
      unlocked: false,
    },
  ];

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-6 bg-(--dark-crt)/50 border-t-4 border-(--neon-green)/30">
      {/* Trophy label */}
      <div className="flex items-center gap-2 mr-2">
        <Icons.Trophy className="w-5 h-5 text-(--gold)" />
        <span className="text-(--gold) font-bold text-sm">MERKER:</span>
      </div>

      {/* Badge slots */}
      {badges.map((badge, index) => {
        const IconComponent = Icons[badge.icon];
        return (
          <div
            key={index}
            className={`
              relative flex items-center justify-center w-12 h-12 border-2
              transition-all duration-300
              ${
                badge.unlocked
                  ? "border-(--gold) bg-(--gold)/10 animate-[gold-flash_2s_ease-in-out_infinite]"
                  : "border-(--gray)/50 bg-(--gray)/5 opacity-30 grayscale"
              }
            `}
            title={badge.unlocked ? badge.name : "LÅST"}
          >
            {/* Icon */}
            <IconComponent
              className={`w-8 h-8 ${
                badge.unlocked ? "text-(--gold)" : "text-(--gray)"
              }`}
            />

            {/* Lock overlay for locked badges */}
            {!badge.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icons.Lock className="w-5 h-5 text-(--gray) opacity-50" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

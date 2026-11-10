"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { BadgeManager } from "@/lib/badge-system";
import { GameEngine } from "@/lib/game-engine";
import { Icon } from "@/lib/icons";

/**
 * Merker (Badges) Management Page
 *
 * Provides overview and management of the badge system:
 * - View all 7 badges with descriptions and unlock conditions
 * - See which badges are earned vs locked
 * - Manually award/revoke badges for testing
 * - View badge statistics
 */

function MerkerContent() {
  const [, forceUpdate] = useState({});

  // Listen for storage changes to auto-update when badges are awarded elsewhere
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // Re-render when badges, quests, or other relevant data changes
      if (
        e.key === "nissekomm-earned-badges" ||
        e.key === "nissekomm-submitted-codes" ||
        e.key === "nissekomm-solved-decryptions" ||
        e.key === "nissekomm-collected-symbols"
      ) {
        forceUpdate({});
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const allBadges = BadgeManager.getAllBadges();
  const earnedBadges = BadgeManager.getEarnedBadges();
  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));

  // Calculate stats
  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const percentage = Math.round((earnedCount / totalCount) * 100);

  const handleAwardBadge = (badgeId: string) => {
    const badge = BadgeManager.getBadge(badgeId);
    if (!badge) return;

    const confirmed = confirm(
      `Tildel merket:\n\n"${badge.navn}"\n\n${badge.beskrivelse}\n\nDette vil markere merket som opptjent.`,
    );

    if (confirmed) {
      GameEngine.addEarnedBadge(badgeId);
      alert(`✓ Merke tildelt: ${badge.navn}`);
      forceUpdate({});
    }
  };

  const handleRevokeBadge = (badgeId: string) => {
    const badge = BadgeManager.getBadge(badgeId);
    if (!badge) return;

    const confirmed = confirm(
      `Fjern merket:\n\n"${badge.navn}"\n\nEr du sikker på at du vil fjerne dette merket?`,
    );

    if (confirmed) {
      GameEngine.removeEarnedBadge(badgeId);
      alert(`Merke fjernet: ${badge.navn}`);
      forceUpdate({});
    }
  };

  const handleResetAll = () => {
    const confirmed = confirm(
      "Er du sikker på at du vil fjerne ALLE merker?\n\nDette kan ikke angres!",
    );

    if (confirmed) {
      BadgeManager.resetAllBadges();
      alert("Alle merker fjernet");
      forceUpdate({});
    }
  };

  const getUnlockConditionText = (badge: (typeof allBadges)[0]): string => {
    const c = badge.unlockCondition;
    if (c.type === "decryptionSolved") {
      return `Løs dekrypteringen «${c.challengeId}» i NisseKrypto (dag 12)`;
    }
    if (c.type === "dayCompleted") return `Løs dag ${c.day}`;
    return "Fullfør alle 24 dager";
  };

  const getUnlockStatus = (badge: (typeof allBadges)[0]): string => {
    const c = badge.unlockCondition;
    if (c.type === "decryptionSolved") {
      return GameEngine.isDecryptionSolved(c.challengeId)
        ? "✓ Dekryptert"
        : "⏳ Ikke dekryptert ennå";
    }
    if (c.type === "dayCompleted") {
      return GameEngine.isQuestCompleted(c.day)
        ? `✓ Dag ${c.day} løst`
        : `⏳ Dag ${c.day} ikke løst`;
    }
    const completedCount = GameEngine.getCompletedQuestCount();
    return `${completedCount >= 24 ? "✓" : "⏳"} ${completedCount}/24 dager`;
  };

  const getBadgeTypeColor = (type: string) =>
    type === "decryption"
      ? "text-blue-400 border-blue-600"
      : "text-(--gold) border-(--gold)";

  const getBadgeTypeLabel = (type: string) =>
    type === "decryption" ? "DEKRYPTERING" : "FULLFØRING";

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="merker" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🏆 MERKER (BADGES) 🏆
        </h1>
        <p className="text-center text-xl opacity-70">
          Oversikt over alle merker og opptjeningsstatus
        </p>
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-3 text-center">
            ℹ️ OM MERKESYSTEMET
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-lg">
            <div>
              <h3 className="font-bold text-(--neon-green) mb-2">
                Hva er merker?
              </h3>
              <ul className="space-y-1 ml-4">
                <li>
                  • Synlige prestasjoner som vises nederst på hjemskjermen
                </li>
                <li>• 3 merker kan opptjenes gjennom desember</li>
                <li>• Merker er permanente (lagres i localStorage)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-(--neon-green) mb-2">Merkene:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Varmebærer: første dekryptering (dag 12)</li>
                <li>• Portvokter: dag 21 løst</li>
                <li>• Snøfalls venn: alle 24 dager løst</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Progress */}
          <div className="col-span-2 border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-(--neon-green) mb-2">
                {earnedCount}/{totalCount}
              </div>
              <div className="text-xl mb-2">Merker Opptjent</div>
              <div className="text-3xl font-bold text-(--gold)">
                {percentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleResetAll}
            className="px-6 py-3 bg-(--christmas-red) text-white font-bold border-4 border-(--christmas-red) hover:opacity-80 transition-opacity"
          >
            ❌ Fjern alle merker
          </button>
        </div>
      </div>

      {/* Badge List */}
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <h2 className="text-3xl font-bold text-center mb-4">📋 ALLE MERKER</h2>

        {allBadges.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          const earnedBadge = earnedBadges.find((b) => b.badgeId === badge.id);
          const unlockCondition = getUnlockConditionText(badge);
          const unlockStatus = getUnlockStatus(badge);

          return (
            <div
              key={badge.id}
              className={`border-4 p-6 ${
                isEarned
                  ? "border-(--gold) bg-(--gold)/10"
                  : "border-(--gray) bg-black/30"
              }`}
            >
              {/* Header with badge icon */}
              <div className="flex items-start gap-6 mb-4">
                {/* Badge Visual */}
                <div
                  className={`shrink-0 w-20 h-20 border-4 flex items-center justify-center ${
                    isEarned
                      ? "border-(--gold) bg-(--gold)/20"
                      : "border-(--gray) bg-(--gray)/10 grayscale opacity-50"
                  }`}
                >
                  <Image
                    src={`/badges/${badge.ikon}`}
                    alt={badge.navn}
                    width={64}
                    height={64}
                    style={{ imageRendering: "pixelated" }}
                    unoptimized
                  />
                </div>

                {/* Badge Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className={`text-2xl font-bold ${
                        isEarned ? "text-(--gold)" : "text-(--gray)"
                      }`}
                    >
                      {badge.navn}
                    </h3>
                    <span
                      className={`px-3 py-1 text-sm border-2 ${getBadgeTypeColor(
                        badge.type,
                      )}`}
                    >
                      {getBadgeTypeLabel(badge.type)}
                    </span>
                    {isEarned && (
                      <span className="text-2xl text-(--gold)">✓</span>
                    )}
                  </div>

                  <p className="text-lg mb-3 opacity-90">{badge.beskrivelse}</p>

                  {/* Unlock Condition */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Icon name="lock-open" size={20} />
                      <div>
                        <span className="font-bold text-(--cold-blue)">
                          Betingelse:
                        </span>{" "}
                        {unlockCondition}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon name="chart" size={20} />
                      <div>
                        <span className="font-bold text-(--cold-blue)">
                          Status:
                        </span>{" "}
                        {unlockStatus}
                      </div>
                    </div>

                    {isEarned && earnedBadge && (
                      <div className="flex items-start gap-2">
                        <Icon name="calendar" size={20} />
                        <div>
                          <span className="font-bold text-(--gold)">
                            Opptjent:
                          </span>{" "}
                          {new Date(earnedBadge.timestamp).toLocaleString(
                            "nb-NO",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-4 pt-4 border-t-2 border-(--gray)/30">
                {!isEarned ? (
                  <button
                    onClick={() => handleAwardBadge(badge.id)}
                    className="px-6 py-2 bg-(--gold) text-black font-bold hover:opacity-80 transition-opacity"
                  >
                    ⭐ Tildel merke manuelt
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevokeBadge(badge.id)}
                    className="px-6 py-2 bg-(--christmas-red) text-white font-bold hover:opacity-80 transition-opacity"
                  >
                    ❌ Fjern merke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Merker Management</p>
        <p className="mt-2">
          💡 Tips: Merker tildeles automatisk når barnet oppfyller betingelsene
        </p>
      </div>
    </div>
  );
}

export default function MerkerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <MerkerContent />
      </GuideAuth>
    </Suspense>
  );
}

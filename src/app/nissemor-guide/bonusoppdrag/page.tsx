"use client";

import { Suspense, useState, useEffect } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import { StorageManager } from "@/lib/storage";
import { BadgeManager } from "@/lib/badge-system";
import type { Oppdrag } from "@/types/innhold";

/**
 * Bonusoppdrag Management Page
 *
 * Parents can manually validate bonus quest completions.
 * This is for crisis resolution missions that require parent approval.
 *
 * NOTE: The current system supports 2 hardcoded crises:
 * - Day 11: Antenna crisis (badge: "Antenne-ingeniør")
 * - Day 16: Inventory chaos (badge: "Inventar-ekspert")
 */

const allOppdrag = GameEngine.getAllQuests();

// Map day numbers to crisis types (based on current quest data)
const DAY_TO_CRISIS: Record<number, "antenna" | "inventory"> = {
  11: "antenna",
  16: "inventory",
};

function BonusoppdragContent() {
  const [, forceUpdate] = useState({});

  // Listen for storage changes to auto-update when badges/quests change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "nissekomm-earned-badges" ||
        e.key === "nissekomm-bonusoppdrag-badges" ||
        e.key === "nissekomm-crisis-status"
      ) {
        forceUpdate({});
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Find all bonus quests
  const bonusQuests = allOppdrag.filter((q) => q.bonusoppdrag);

  const handleValidate = (quest: Oppdrag) => {
    if (!quest.bonusoppdrag) return;

    const crisisType = DAY_TO_CRISIS[quest.dag];
    if (!crisisType) {
      alert("Feil: Ukjent krisetype for denne dagen");
      return;
    }

    const confirmed = confirm(
      `Bekreft at barnet har fullført bonusoppdraget:\n\n` +
        `"${quest.bonusoppdrag.tittel}"\n\n` +
        `${quest.bonusoppdrag.beskrivelse}\n\n` +
        `Dette vil tildele merket og markere krisen som løst.`,
    );

    if (confirmed) {
      // Award badge and resolve crisis (bypass condition check - parent has validated)
      const badgeId =
        crisisType === "antenna" ? "antenne-ingenior" : "inventar-ekspert";
      BadgeManager.checkAndAwardBadge(badgeId, true);
      alert(
        `✓ Bonusoppdrag fullført!\n\nMerke tildelt: ${quest.bonusoppdrag.badge_navn}`,
      );
      forceUpdate({});
    }
  };

  const handleRevoke = (quest: Oppdrag) => {
    if (!quest.bonusoppdrag) return;

    const confirmed = confirm(
      `Er du sikker på at du vil tilbakestille bonusoppdraget for dag ${quest.dag}?\n\n` +
        `Dette vil fjerne merket "${quest.bonusoppdrag.badge_navn}".`,
    );

    if (confirmed) {
      // Remove the badge from unified system
      if (quest.bonusoppdrag.badge_id) {
        StorageManager.removeEarnedBadge(quest.bonusoppdrag.badge_id);
      }

      alert("Bonusoppdrag tilbakestilt");
      forceUpdate({});
    }
  };

  // Calculate stats
  const completedCount = bonusQuests.filter((q) =>
    GameEngine.isBonusOppdragCompleted(q),
  ).length;

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="bonusoppdrag" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🏅 BONUSOPPDRAG
        </h1>
        <p className="text-center text-xl opacity-70">
          Manuell validering av kriseløsninger
        </p>
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-3 text-center">
            ⚠️ OM BONUSOPPDRAG
          </h2>
          <ul className="space-y-2 text-lg">
            <li>
              ✓ Bonusoppdrag er valgfrie utfordringer utover hovedoppdraget
            </li>
            <li>✓ De handler om kriser i Snøfall som må løses</li>
            <li>
              ✓ Krever forelder-validering fordi løsningene er åpne/kreative
            </li>
            <li>✓ Ved godkjenning får barnet et spesielt merke</li>
            <li>✓ Bonusoppdrag må fullføres ETTER hovedoppdraget for dagen</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--neon-green) mb-2">
                {bonusQuests.length}
              </div>
              <div className="text-lg">Totalt Bonusoppdrag</div>
            </div>
          </div>
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--gold) mb-2">
                {completedCount}
              </div>
              <div className="text-lg">Fullførte</div>
            </div>
          </div>
          <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--christmas-red) mb-2">
                {bonusQuests.length - completedCount}
              </div>
              <div className="text-lg">Gjenstående</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Quests List */}
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <h2 className="text-3xl font-bold text-center mb-4">
          📋 ALLE BONUSOPPDRAG
        </h2>

        {bonusQuests.map((quest) => {
          const bonus = quest.bonusoppdrag!;
          const isMainCompleted = GameEngine.isQuestCompleted(quest.dag);
          const isBonusCompleted = GameEngine.isBonusOppdragCompleted(quest);
          const isAccessible = GameEngine.isBonusOppdragAccessible(quest.dag);

          return (
            <div
              key={quest.dag}
              className={`border-4 p-6 ${
                isBonusCompleted
                  ? "border-(--gold) bg-(--gold)/10"
                  : isAccessible
                    ? "border-(--neon-green) bg-(--neon-green)/10"
                    : "border-(--gray) bg-black/30 opacity-60"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold">Dag {quest.dag}</span>
                    {isBonusCompleted && (
                      <span className="text-2xl text-(--gold)">✓</span>
                    )}
                    {!isMainCompleted && (
                      <span className="text-sm px-3 py-1 bg-(--christmas-red) text-white">
                        HOVEDOPPDRAG MÅ FULLFØRES FØRST
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-(--gold) mb-2">
                    {bonus.tittel}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="text-lg font-bold text-(--cold-blue) mb-2">
                  📖 BESKRIVELSE:
                </h4>
                <p className="text-lg bg-black/50 p-4 border-2 border-(--cold-blue)/50">
                  {bonus.beskrivelse}
                </p>
              </div>

              {/* Badge Info */}
              <div className="mb-4">
                <h4 className="text-lg font-bold text-(--gold) mb-2">
                  🏅 MERKE:
                </h4>
                <div className="bg-black/50 p-4 border-2 border-(--gold)/50">
                  <p className="text-xl font-bold">{bonus.badge_navn}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-4">
                {!isBonusCompleted && isAccessible && (
                  <button
                    onClick={() => handleValidate(quest)}
                    className="flex-1 px-6 py-3 bg-(--gold) text-black font-bold text-xl hover:opacity-80 border-4 border-(--gold)"
                  >
                    ✓ GODKJENN BONUSOPPDRAG
                  </button>
                )}
                {isBonusCompleted && (
                  <button
                    onClick={() => handleRevoke(quest)}
                    className="px-6 py-3 bg-(--christmas-red) text-white font-bold hover:opacity-80 border-4 border-(--christmas-red)"
                  >
                    ❌ Tilbakestill
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Bonusoppdrag Management</p>
      </div>
    </div>
  );
}

export default function BonusoppdragPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <BonusoppdragContent />
      </GuideAuth>
    </Suspense>
  );
}

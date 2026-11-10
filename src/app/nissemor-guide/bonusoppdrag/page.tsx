"use client";

import { Suspense, useState, useEffect } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import type { Oppdrag } from "@/types/innhold";

/**
 * Bonusoppdrag Management Page
 *
 * Parents approve the two bonus quests (day 11 antenna, day 16 lantern).
 * Approval gives no badge: Frostgraden drops 20 % and Julius' PS gets a
 * bonus variant.
 */

const allOppdrag = GameEngine.getAllQuests();

function BonusoppdragContent() {
  const [, forceUpdate] = useState({});

  // Listen for storage changes to auto-update when badges/quests change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "nissekomm-bonusoppdrag-completed" ||
        e.key === "nissekomm-codes"
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

    const confirmed = confirm(
      `Bekreft at barna har fullført bonusoppdraget:\n\n` +
        `"${quest.bonusoppdrag.tittel}"\n\n` +
        `${quest.bonusoppdrag.fysisk_oppgave}`,
    );

    if (confirmed) {
      GameEngine.completeBonusOppdrag(quest.dag);
      alert(`✓ ${quest.bonusoppdrag.belønning_tekst}`);
      forceUpdate({});
    }
  };

  const handleRevoke = (quest: Oppdrag) => {
    if (!quest.bonusoppdrag) return;

    const confirmed = confirm(
      `Er du sikker på at du vil tilbakestille bonusoppdraget for dag ${quest.dag}?`,
    );

    if (confirmed) {
      GameEngine.revokeBonusOppdrag(quest.dag);
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
      <GuideNavigation />

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
            <li>✓ Godkjenn her når dere har sett det barna har laget</li>
            <li>
              ✓ Bonusen gir ingen merke, bare −20 % frost og en ekstra setning i
              Julius&apos; PS
            </li>
            <li>
              ✓ Fristen fredag 18. for lykten nevnes i historien, men håndheves
              ikke. Bruk batterilys, aldri levende lys i vinduet.
            </li>
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

              {/* Task */}
              <div className="mb-4">
                <h4 className="text-lg font-bold text-(--gold) mb-2">
                  🛠️ OPPGAVE:
                </h4>
                <p className="text-lg bg-black/50 p-4 border-2 border-(--gold)/50">
                  {bonus.fysisk_oppgave}
                </p>
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

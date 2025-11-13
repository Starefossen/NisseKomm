"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import {
  getAllEventyr,
  getEventyrDays,
  getEventyrProgress,
  isEventyrComplete,
  getRewardIcon,
} from "@/lib/historier";
import { GameEngine } from "@/lib/game-engine";
import { Icon } from "@/lib/icons";
import { GuideAuth, useGuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";

/**
 * Eventyr Visualization Page (Subpage of Nissemor Guide)
 *
 * This page displays all eventyr for parents/adults to understand
 * the narrative structure behind the 24-day advent calendar.
 *
 * Features:
 * - Visual timeline of all eventyr
 * - Progress tracking for each eventyr
 * - Parent guidance and themes
 * - Day assignments for each eventyr
 * - Authentication via ?kode= parameter
 */

function HistorierContent() {
  const { kode } = useGuideAuth();
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      return GameEngine.loadGameState().completedQuests;
    }
    return new Set();
  });

  // Listen for storage changes to auto-update eventyr progress
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nissekomm-submitted-codes") {
        setCompletedDays(GameEngine.loadGameState().completedQuests);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const allEventyr = getAllEventyr();

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="eventyr" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🎄 NISSEKOMM HISTORIER 🎄
        </h1>
        <p className="text-center text-xl opacity-70">
          Oversikt over eventyr i desemberkalenderen
        </p>
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-3 text-center">
            📖 OM EVENTYR-SYSTEMET
          </h2>
          <ul className="space-y-2 text-lg">
            <li>
              ✓ Eventyr er flerukersfortellinger som utspiller seg over flere
              dager
            </li>
            <li>
              ✓ Hver dag har sitt eget hovedoppdrag, men bidrar til større
              fortelling
            </li>
            <li>
              ✓ Barna opplever sammenheng mellom dagenes oppdrag og karakterer
            </li>
            <li>
              ✓ Ved fullføring av alle dager i eventyret låses spesielle merker
              opp
            </li>
            <li>
              ✓ 2 parallelle eventyr: "Mørkets Trussel" (dag 3-12) og "Nattens
              Magi" (dag 14-24)
            </li>
            <li>
              ✓ Denne siden er for foreldre som vil forstå den større
              fortellingen
            </li>
          </ul>
        </div>
      </div>

      {/* Eventy Grid */}
      <div className="max-w-7xl mx-auto space-y-8">
        {allEventyr.map((arc) => {
          const eventyrDays = getEventyrDays(arc.id);
          const progress = getEventyrProgress(arc.id, completedDays);
          const complete = isEventyrComplete(arc.id, completedDays);

          return (
            <div
              key={arc.id}
              className="border-4 border-(--neon-green) p-6 bg-black/50 relative"
              style={{ borderColor: arc.farge }}
            >
              {/* Eventyr Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-4xl" style={{ color: arc.farge }}>
                      <Icon name={String(arc.ikon)} size={40} />
                    </div>
                    <h2
                      className="text-4xl font-bold"
                      style={{ color: arc.farge }}
                    >
                      {arc.navn}
                    </h2>
                    {complete && (
                      <span className="text-3xl text-(--gold) animate-[gold-flash_2s_ease-in-out_infinite]">
                        ✓ FULLFØRT
                      </span>
                    )}
                  </div>
                  <p className="text-2xl text-(--cold-blue) mb-4">
                    {arc.beskrivelse}
                  </p>
                </div>

                {/* Progress Badge */}
                <div className="text-right">
                  <div
                    className="text-5xl font-bold mb-1"
                    style={{
                      color: progress === 100 ? "var(--gold)" : arc.farge,
                    }}
                  >
                    {progress}%
                  </div>
                  <div className="text-xl text-(--gray)">Fremgang</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 h-4 border-2 border-(--neon-green) bg-black">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      progress === 100 ? "var(--gold)" : arc.farge,
                  }}
                />
              </div>

              {/* Days Timeline */}
              <div className="mb-6">
                <h3 className="text-2xl text-(--neon-green) mb-3 flex items-center gap-2">
                  <Icon name="calendar" size={24} />
                  DAGER I DENNE FORTELLINGEN:
                </h3>
                <div className="flex flex-wrap gap-3">
                  {eventyrDays.map((day) => {
                    const isCompleted = completedDays.has(day);
                    return (
                      <div
                        key={day}
                        className={`
                          text-2xl font-bold px-4 py-2 border-2
                          ${
                            isCompleted
                              ? "bg-(--gold) text-black border-(--gold)"
                              : "bg-black text-(--gray) border-(--gray)"
                          }
                        `}
                      >
                        DAG {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Themes */}
              <div className="mb-6">
                <h3 className="text-2xl text-(--neon-green) mb-3 flex items-center gap-2">
                  <Icon name="gift" size={24} />
                  TEMAER:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {arc.tema.map((tema: string, index: number) => (
                    <span
                      key={index}
                      className="text-xl px-3 py-1 border-2 border-(--cold-blue) text-(--cold-blue) bg-black/50"
                    >
                      {tema}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parent Guidance */}
              {arc.foreldreveiledning && (
                <div className="mb-6 border-2 border-(--cold-blue) p-4 bg-(--crt-dark)">
                  <h3 className="text-2xl text-(--cold-blue) mb-3 flex items-center gap-2">
                    <Icon name="contact" size={24} />
                    FORELDREVEILEDNING:
                  </h3>
                  <div className="space-y-2">
                    <p className="text-xl text-(--neon-green)">
                      <strong>Sammendrag:</strong>{" "}
                      {arc.foreldreveiledning.sammendrag}
                    </p>
                    {arc.foreldreveiledning.tips && (
                      <div>
                        <p className="text-xl text-(--neon-green) mb-2">
                          <strong>Tips til voksne:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-lg text-(--cold-blue) ml-4">
                          {arc.foreldreveiledning.tips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reward */}
              {arc.belønning && (
                <div className="border-2 border-(--gold) p-4 bg-black/50">
                  <h3 className="text-2xl text-(--gold) mb-2 flex items-center gap-2">
                    <Icon name={getRewardIcon(arc.belønning.type)} size={24} />
                    BELØNNING VED FULLFØRING:
                  </h3>
                  <p className="text-xl text-(--neon-green)">
                    <strong>{arc.belønning.type}</strong>
                  </p>
                  <p className="text-lg text-(--cold-blue)">
                    {arc.belønning.beskrivelse}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12 text-center">
        <div className="border-4 border-(--neon-green) p-6 bg-black/50">
          <p className="text-2xl text-(--cold-blue) mb-4">
            💡 Barna oppdager disse historiene gradvis gjennom kalenderen.
          </p>
          <p className="text-xl text-(--gray)">
            Hver dag avslører nye hint og koblinger mellom oppdragene.
            <br />
            Fortellingene veves sammen gjennom Julius' dagbok og NisseNet-filer.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={`/nissemor-guide?kode=${kode}`}
            className="inline-block text-3xl px-8 py-4 border-4 border-(--neon-green) bg-black text-(--neon-green) hover:bg-(--neon-green) hover:text-black transition-colors"
          >
            ← TILBAKE TIL NISSEMOR GUIDE
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HistorierPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--crt-dark) text-(--neon-green) font-(family-name:--font-vt323) flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <HistorierContent />
      </GuideAuth>
    </Suspense>
  );
}

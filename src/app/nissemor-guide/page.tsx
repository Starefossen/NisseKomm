"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { GameEngine } from "@/lib/game-engine";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { TimelineView } from "@/components/nissemor/TimelineView";
import { ProgressionStats } from "@/components/nissemor/ProgressionStats";
import { DayPlanning } from "@/components/nissemor/DayPlanning";
import { EventyrProgress } from "@/components/nissemor/EventyrProgress";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { getAllOppdrag } from "@/lib/oppdrag";

const allOppdrag = getAllOppdrag();

function NissemorGuideContent() {
  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();
  const isDecember = currentMonth === 12;
  const relevantDay =
    isDecember && currentDay >= 1 && currentDay <= 24 ? currentDay : 1;

  const relevantWeek = Math.ceil(relevantDay / 7);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([relevantWeek]);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(relevantDay);

  // Counter to force useMemo recalculation when data changes
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const completedDays = useMemo(() => {
    return new Set(GameEngine.getCompletedDays());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshCounter intentionally triggers recalculation
  }, [refreshCounter]);

  // Initialize storage with sessionId for Nissemor Guide
  useEffect(() => {
    async function initializeStorage() {
      try {
        console.log("[NissemorGuide] Initializing storage for guide access...");

        // Get sessionId from cookie (same way the main app does)
        const sessionId = document.cookie
          .split("; ")
          .find((row) => row.startsWith("nissekomm-session="))
          ?.split("=")[1];

        if (sessionId) {
          console.log(
            `[NissemorGuide] Found sessionId: ${sessionId.substring(0, 8)}...`,
          );
          // Initialize storage with the sessionId so it uses the correct backend
          const { StorageManager } = await import("@/lib/storage");
          await StorageManager.setAuthenticated(true, sessionId);
          console.log("[NissemorGuide] Storage initialized with sessionId");
        } else {
          console.warn(
            "[NissemorGuide] No sessionId found in cookie, storage will use localStorage fallback",
          );
        }
      } catch (error) {
        console.error("[NissemorGuide] Failed to initialize storage:", error);
      }
    }

    initializeStorage();
  }, []);

  // Calculate progression summary (refreshes when storage changes)
  const progression = useMemo(
    () => GameEngine.getProgressionSummary(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshCounter intentionally triggers recalculation
    [refreshCounter],
  );

  // Auto-refresh progression data every 30 seconds to catch child progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((c) => c + 1);
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds (less aggressive)

    return () => clearInterval(interval);
  }, []);

  // Listen for storage changes to auto-update progression stats
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("nissekomm-")) {
        setRefreshCounter((c) => c + 1);
        setLastUpdated(new Date());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const weeks = useMemo(
    () => [
      { num: 1, days: allOppdrag.slice(0, 7), title: "Uke 1: Oppdagelse" },
      {
        num: 2,
        days: allOppdrag.slice(7, 14),
        title: "Uke 2: Etterforskning",
      },
      { num: 3, days: allOppdrag.slice(14, 21), title: "Uke 3: Detektiv" },
      { num: 4, days: allOppdrag.slice(21, 24), title: "Uke 4: Finale" },
    ],
    [],
  );

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    );
  };

  const toggleDay = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "h":
          e.preventDefault();
          setSelectedDay((prev) => Math.max(1, prev - 1));
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          setSelectedDay((prev) => Math.min(24, prev + 1));
          break;
        case "Home":
        case "g":
          e.preventDefault();
          setSelectedDay(1);
          break;
        case "End":
        case "G":
          e.preventDefault();
          setSelectedDay(24);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setSelectedDay(relevantDay);
          break;
        case "?":
          e.preventDefault();
          alert(
            "⌨️ TASTATURSNARVEIER:\n\n" +
            "← / h : Forrige dag\n" +
            "→ / l : Neste dag\n" +
            "Home / g : Første dag\n" +
            "End / G : Siste dag\n" +
            "t : Gå til dagens dato\n" +
            "? : Vis denna hjelpen",
          );
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [relevantDay]);

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="hovedside" />

      {/* Introduction */}
      <div className="max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-(--gold) mb-3">
          🎄 NISSEMOR-GUIDEN 🎄
        </h1>
        <p className="text-lg text-(--neon-green)/80 leading-relaxed">
          Velkommen til kontrollpanelet for NisseKomm-adventuren! Her finner du alt du trenger
          for å følge med på barnets progresjon, forberede dagens oppdrag, og holde styr på
          fysiske ledetekster og koder. Bruk menyen over for å navigere mellom de ulike verktøyene.
        </p>
      </div>

      <ProgressionStats
        progression={progression}
        onRefresh={() => {
          setRefreshCounter((c) => c + 1);
          setLastUpdated(new Date());
        }}
        lastUpdated={lastUpdated}
      />

      {/* MAIN CONTENT GRID: Timeline + Planning Sections */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Column: Timeline */}
          <TimelineView
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          {/* Right Column: Rest of content */}
          <div className="space-y-6">
            <DayPlanning
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              completedDays={completedDays}
            />
          </div>
        </div>
      </div>

      <EventyrProgress completedDays={completedDays} />

      {/* Weekly Breakdown (Collapsible) */}
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <h2 className="text-3xl font-bold text-center mb-4">
          📅 UKEOVERSIKT (Kronologisk)
        </h2>

        {weeks.map((week) => (
          <div key={week.num} className="border-4 border-(--neon-green)">
            {/* Week Header */}
            <button
              onClick={() => toggleWeek(week.num)}
              className="w-full p-4 bg-(--neon-green) text-black font-bold text-2xl flex items-center justify-between hover:opacity-90"
            >
              <span>{week.title}</span>
              <span className="text-3xl">
                {expandedWeeks.includes(week.num) ? "▼" : "▶"}
              </span>
            </button>

            {/* Week Content */}
            {expandedWeeks.includes(week.num) && (
              <div className="p-4 space-y-4">
                {week.days.map((dag) => (
                  <div
                    key={dag.dag}
                    className="border-2 border-(--neon-green)/50"
                  >
                    {/* Day Header */}
                    <button
                      onClick={() => toggleDay(dag.dag)}
                      className="w-full p-3 bg-(--dark-crt) flex flex-col items-start hover:bg-(--neon-green)/10"
                    >
                      <div className="w-full flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">
                            Dag {dag.dag}
                          </span>
                          <span className="text-xl">{dag.tittel}</span>
                          {completedDays.has(dag.dag) && (
                            <span className="text-(--neon-green) font-bold">
                              ✓ FULLFØRT
                            </span>
                          )}
                        </div>
                        <span className="text-xl">
                          {expandedDays.includes(dag.dag) ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>

                    {/* Day Details */}
                    {expandedDays.includes(dag.dag) && (
                      <div className="p-4 space-y-4 bg-(--dark-crt)/50">
                        <div>
                          <h4 className="text-lg font-bold mb-2">
                            📧 Misjonsbeskrivelse:
                          </h4>
                          <p>{dag.nissemail_tekst}</p>
                        </div>

                        <div className="border-2 border-(--cold-blue)/50 p-3">
                          <h4 className="text-lg font-bold mb-2 text-(--cold-blue)">
                            🔑 Kode:
                          </h4>
                          <p className="font-mono text-xl text-(--gold) bg-black p-2 border border-(--gold)">
                            {dag.kode}
                          </p>
                        </div>

                        <div className="border-2 border-(--christmas-red) p-3 bg-(--christmas-red)/10">
                          <h4 className="text-lg font-bold mb-2 text-(--christmas-red)">
                            🎭 Rampestrek:
                          </h4>
                          <p>{dag.rampenissen_rampestrek}</p>
                        </div>

                        {dag.bonusoppdrag && (
                          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
                            <h4 className="text-lg font-bold text-(--gold) mb-2">
                              🏅 BONUSOPPDRAG
                            </h4>
                            <p>
                              Denne dagen har et bonusoppdrag som krever
                              foreldrenes hjelp for å validere.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progression Visualization Section */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <details className="border-4 border-(--neon-green) bg-(--dark-crt)/90 overflow-hidden">
          <summary className="cursor-pointer p-6 bg-(--neon-green)/10 hover:bg-(--neon-green)/20 transition-colors font-bold text-xl">
            📊 SYSTEMSTATUS PROGRESJON (Forklaring for foreldre)
          </summary>
          <div className="p-6 space-y-6">
            <p className="text-(--neon-green)/80">
              Denna grafen viser hvordan systemmetrikker bygges opp gradvis
              gjennom kalenderen (1. til 24. desember). Dette er normalt
              oppførsel - systemet starter lavt og vokser naturlig mot jul. 🎄
            </p>

            {/* Simplified progression charts would go here */}
            <div className="border-2 border-(--neon-green)/30 bg-(--neon-green)/5 p-4">
              <h4 className="font-bold text-(--gold) mb-2">
                📌 Viktig for foreldre:
              </h4>
              <ul className="space-y-2 text-(--neon-green)/80 text-sm">
                <li>
                  • Verdiene starter lavt (10-25) og vokser mot 100 gjennom
                  desember
                </li>
                <li>
                  • NISSEKRAFT og BREVFUGL-SVERM får "kriser" som fryser
                  verdiene til bonusoppdrag løses
                </li>
                <li>
                  • Nye metrikker låses opp progressivt (dag 1, 4, 7, 10) for å
                  ikke overvelde barnet
                </li>
                <li>
                  • Hvis barnet spør "hvorfor er det så lavt?", kan du forklare:
                  "Snøfall bygger opp systemer gradvis mot julaften!"
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Nissemor Control Panel</p>
        <p>Hold denna siden hemmelig fra barna! 🤫</p>
      </div>
    </div>
  );
}

export default function NissemorGuide() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <NissemorGuideContent />
      </GuideAuth>
    </Suspense>
  );
}

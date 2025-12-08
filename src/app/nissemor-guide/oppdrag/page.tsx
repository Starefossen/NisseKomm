"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { GameEngine } from "@/lib/game-engine";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { TimelineView } from "@/components/nissemor/TimelineView";
import { DayPlanning } from "@/components/nissemor/DayPlanning";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { Icon } from "@/lib/icons";

function OppdragContent() {
  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();
  const isDecember = currentMonth === 12;
  const relevantDay =
    isDecember && currentDay >= 1 && currentDay <= 24 ? currentDay : 1;

  const [selectedDay, setSelectedDay] = useState<number>(relevantDay);

  // Counter to force useMemo recalculation when data changes
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Ensure selectedDay updates when relevantDay changes (e.g., date changes)
  useEffect(() => {
    setSelectedDay(relevantDay);
  }, [relevantDay]);

  const completedDays = useMemo(() => {
    return new Set(GameEngine.getCompletedDays());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshCounter intentionally triggers recalculation
  }, [refreshCounter]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((c) => c + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
      <GuideNavigation currentPage="oppdrag" />

      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Icon name="calendar" size={48} color="gold" />
          <h1 className="text-4xl md:text-5xl font-bold text-(--gold)">
            DAGENS OPPDRAG
          </h1>
        </div>

        <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 md:p-6">
          <p className="text-base md:text-lg text-(--neon-green)/90 mb-3">
            Planlegg og forbered dagens oppdrag. Se detaljer om kode,
            materialer, og hvordan du setter opp Rampenissens rampestreker!
          </p>
          <p className="text-sm md:text-base text-(--neon-green)/70">
            💡 <strong>Tips:</strong> Bruk piltastene (← →) eller h/l for å
            navigere mellom dager. Trykk "t" for å hoppe til dagens dato.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT GRID: Timeline + Planning */}
      <div className="max-w-7xl mx-auto mb-6">
        {/* Mobile Layout: Vertical Stack */}
        <div className="lg:hidden space-y-6">
          {/* Mobile: Day Planning First (Primary Content) */}
          <DayPlanning
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            completedDays={completedDays}
          />

          {/* Mobile: Timeline in Collapsible Section */}
          <details className="border-4 border-(--neon-green) bg-(--dark-crt) p-3">
            <summary className="text-xl font-bold text-(--neon-green) mb-2 cursor-pointer list-none flex items-center justify-between">
              <span>📅 TIDSLINJE</span>
              <span className="text-sm opacity-70">(Klikk for å vise)</span>
            </summary>
            <div className="mt-4">
              <TimelineView
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </div>
          </details>
        </div>

        {/* Desktop Layout: Side-by-Side Grid */}
        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Column: Timeline */}
          <TimelineView
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          {/* Right Column: Day Planning */}
          <div className="space-y-6">
            <DayPlanning
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              completedDays={completedDays}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Nissemor Control Panel</p>
        <p>Hold denna siden hemmelig fra barna! 🤫</p>
      </div>
    </div>
  );
}

export default function Oppdrag() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <OppdragContent />
      </GuideAuth>
    </Suspense>
  );
}

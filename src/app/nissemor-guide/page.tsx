"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { GameEngine } from "@/lib/game-engine";
import { GuideAuth, useGuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { TimelineView } from "@/components/nissemor/TimelineView";
import { Icon } from "@/lib/icons";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import {
  getAllEventyr,
  getEventyrDays,
  getEventyrProgress,
  isEventyrComplete,
} from "@/lib/eventyr";

const allOppdrag = GameEngine.getAllQuests();

function NissemorGuideContent() {
  const { kode } = useGuideAuth();

  // Get current date context (for Dec 1-24 relevance)
  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();
  const isDecember = currentMonth === 12; // December is month 12 (1-based)
  const relevantDay =
    isDecember && currentDay >= 1 && currentDay <= 24 ? currentDay : 1;

  // Calculate which week contains the relevant day
  const relevantWeek = Math.ceil(relevantDay / 7);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([relevantWeek]);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(relevantDay);

  // Get completed days for eventyr progress
  const completedDays = useMemo(() => {
    const state = GameEngine.loadGameState();
    return state.completedQuests;
  }, []);

  // Get all eventyr
  const allEventyr = useMemo(() => getAllEventyr(), []);

  // Listen for storage changes to auto-update progression stats
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // Trigger re-render when any game-related storage changes
      if (e.key?.startsWith("nissekomm-")) {
        setSelectedDay((prev) => prev); // Force re-render
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Group quests by week
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

  // Calculate progression summary (refreshes when storage changes)
  const progression = useMemo(() => GameEngine.getProgressionSummary(), []);

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
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "h":
          // Previous day
          e.preventDefault();
          setSelectedDay((prev) => Math.max(1, prev - 1));
          break;
        case "ArrowRight":
        case "l":
          // Next day
          e.preventDefault();
          setSelectedDay((prev) => Math.min(24, prev + 1));
          break;
        case "Home":
        case "g":
          // Go to first day
          e.preventDefault();
          setSelectedDay(1);
          break;
        case "End":
        case "G":
          // Go to last day
          e.preventDefault();
          setSelectedDay(24);
          break;
        case "t":
        case "T":
          // Go to today
          e.preventDefault();
          setSelectedDay(relevantDay);
          break;
        case "?":
          // Show keyboard shortcuts help
          e.preventDefault();
          alert(
            "⌨️ TASTATURSNARVEIER:\n\n" +
              "← / h : Forrige dag\n" +
              "→ / l : Neste dag\n" +
              "Home / g : Første dag\n" +
              "End / G : Siste dag\n" +
              "t : Gå til dagens dato\n" +
              "? : Vis denne hjelpen",
          );
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [relevantDay]);

  const getSetupBadgeColor = (tid: string) => {
    switch (tid) {
      case "enkel":
        return "bg-green-600";
      case "moderat":
        return "bg-yellow-600";
      case "avansert":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  // Get selected day's quest details
  const selectedQuest = allOppdrag.find((q) => q.dag === selectedDay);

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="hovedside" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🎄 NISSEMOR GUIDE 🎄
        </h1>
        <p className="text-center text-xl opacity-70">
          Planleggings- og oversiktspanel for NisseKomm-kalenderen
        </p>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Main Quests */}
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--neon-green) mb-2">
                {progression.mainQuests.completed}/
                {progression.mainQuests.total}
              </div>
              <div className="text-lg">Hovedoppdrag</div>
            </div>
          </div>

          {/* Bonus Quests */}
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--gold) mb-2">
                {progression.bonusOppdrag.completed}/
                {progression.bonusOppdrag.available}
              </div>
              <div className="text-lg">Bonusoppdrag</div>
            </div>
          </div>

          {/* Modules */}
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--cold-blue) mb-2">
                {progression.modules.unlocked}/{progression.modules.total}
              </div>
              <div className="text-lg">Moduler Låst Opp</div>
            </div>
          </div>

          {/* Badges */}
          <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--christmas-red) mb-2">
                {progression.badges.earned}/{progression.badges.total}
              </div>
              <div className="text-lg">Badges Tildelt</div>
            </div>
          </div>
        </div>
      </div>

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
            {/* TODAY'S PLANNING SECTION */}
            <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-(--gold) flex items-center gap-2">
                  <Icon name="calendar" size={32} />
                  DAGENS OPPDRAG (Dag {selectedDay})
                </h2>
                <button
                  onClick={() =>
                    alert(
                      "⌨️ TASTATURSNARVEIER:\n\n" +
                        "← / h : Forrige dag\n" +
                        "→ / l : Neste dag\n" +
                        "Home / g : Første dag\n" +
                        "End / G : Siste dag\n" +
                        "t : Gå til dagens dato\n" +
                        "? : Vis denne hjelpen",
                    )
                  }
                  className="text-sm px-4 py-2 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20 transition-colors"
                  title="Vis tastatursnarveier"
                >
                  ⌨️ Snarveier (?)
                </button>
              </div>

              {selectedQuest ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column: Setup Instructions */}
                  <div className="space-y-4">
                    {/* Rampenissen Scene */}
                    <div className="border-2 border-(--neon-green) bg-black/50 p-4">
                      <h3 className="text-xl font-bold text-(--neon-green) mb-2">
                        🎭 RAMPESTREK-SCENE:
                      </h3>
                      <p className="text-lg">
                        {selectedQuest.rampenissen_rampestrek}
                      </p>
                    </div>

                    {/* Physical Note */}
                    <div className="border-2 border-(--cold-blue) bg-black/50 p-4">
                      <h3 className="text-xl font-bold text-(--cold-blue) mb-2">
                        📝 FYSISK LAPP:
                      </h3>
                      <p className="text-lg italic">
                        &quot;{selectedQuest.fysisk_hint}&quot;
                      </p>
                    </div>

                    {/* Materials */}
                    <div className="border-2 border-(--gold) bg-black/50 p-4">
                      <h3 className="text-xl font-bold text-(--gold) mb-2">
                        📦 MATERIALER:
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedQuest.materialer_nødvendig.map((mat, i) => (
                          <li key={i} className="text-lg">
                            {mat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Symbol Clue - Physical Card to Hide */}
                    {selectedQuest.symbol_clue && (
                      <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/20 p-4">
                        <h3 className="text-xl font-bold text-(--cold-blue) mb-2 flex items-center gap-2">
                          💎 SYMBOL Å GJEMME:
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Icon
                              name={selectedQuest.symbol_clue.symbolIcon}
                              size={32}
                              className={`text-(--${selectedQuest.symbol_clue.symbolColor === "green" ? "neon-green" : selectedQuest.symbol_clue.symbolColor === "red" ? "christmas-red" : selectedQuest.symbol_clue.symbolColor === "blue" ? "cold-blue" : "gold"})`}
                            />
                            <div>
                              <p className="text-xl font-bold">
                                {selectedQuest.symbol_clue.description}
                              </p>
                              <p className="text-sm opacity-70">
                                Kode: {selectedQuest.symbol_clue.symbolId}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm italic opacity-80 mt-2">
                            🎯 Gjem dette symbolkortet et sted barnet kan finne
                            det i dag. De skanner QR-koden eller skriver inn
                            koden manuelt.
                          </p>
                          <Link
                            href={`/nissemor-guide/symboler?kode=${kode}`}
                            className="inline-block mt-2 px-4 py-2 bg-(--cold-blue) text-black font-bold text-sm hover:opacity-80"
                          >
                            Print symbolkort →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Context & Code */}
                  <div className="space-y-4">
                    {/* Digital Quest */}
                    <div className="border-2 border-(--neon-green)/50 bg-black/50 p-4">
                      <h3 className="text-xl font-bold text-(--neon-green)/70 mb-2">
                        💻 VISES I APPEN:
                      </h3>
                      <p className="text-lg italic opacity-80">
                        {selectedQuest.nissemail_tekst}
                      </p>
                    </div>

                    {/* Setup Details */}
                    <div className="border-2 border-(--gray) bg-black/50 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-(--gold) font-bold">
                            📍 ROM:
                          </span>
                          <br />
                          {selectedQuest.beste_rom}
                        </div>
                        <div>
                          <span className="text-(--gold) font-bold">
                            🔍 HINT:
                          </span>
                          <br />
                          {selectedQuest.hint_type}
                        </div>
                        <div>
                          <span className="text-(--gold) font-bold">
                            ⏱️ TID:
                          </span>
                          <br />
                          <span
                            className={`${getSetupBadgeColor(selectedQuest.oppsett_tid)} px-2 py-1 text-white text-sm`}
                          >
                            {selectedQuest.oppsett_tid.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expected Code */}
                    <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/20 p-4">
                      <h3 className="text-2xl font-bold text-(--christmas-red) mb-2">
                        🔐 RIKTIG KODE:
                      </h3>
                      <p className="text-4xl font-bold text-center">
                        {selectedQuest.kode}
                      </p>
                    </div>

                    {/* Bonus Quest */}
                    {selectedQuest.bonusoppdrag && (
                      <div className="border-4 border-(--gold) bg-(--gold)/20 p-4">
                        <h3 className="text-xl font-bold text-(--gold) mb-2">
                          🏅 BONUSOPPDRAG:
                        </h3>
                        <p className="font-bold text-lg mb-1">
                          {selectedQuest.bonusoppdrag.tittel}
                        </p>
                        <p className="text-sm italic mb-3">
                          {selectedQuest.bonusoppdrag.beskrivelse}
                        </p>
                        <Link
                          href={`/nissemor-guide/bonusoppdrag?kode=${kode}`}
                          className="inline-block px-4 py-2 bg-(--gold) text-black font-bold text-sm hover:opacity-80"
                        >
                          Gå til validering →
                        </Link>
                      </div>
                    )}

                    {/* Special Features */}
                    {(selectedQuest.reveals?.modules ||
                      selectedQuest.decryption_challenge) && (
                      <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/20 p-4">
                        <h3 className="text-xl font-bold text-(--cold-blue) mb-2">
                          ⭐ SPESIELLE FUNKSJONER:
                        </h3>
                        <div className="space-y-2">
                          {selectedQuest.reveals?.modules?.map((module) => (
                            <div
                              key={module}
                              className="flex items-center gap-2"
                            >
                              <span className="text-lg">🔓</span>
                              <span className="text-lg">
                                Låser opp: <strong>{module}</strong>
                              </span>
                            </div>
                          ))}
                          {selectedQuest.decryption_challenge && (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🔐</span>
                              <span className="text-lg">
                                Dekrypterings-utfordring
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-2xl">
                  Velg en dag for å se detaljer
                </p>
              )}

              {/* Day Selector */}
              <div className="mt-6 border-t-2 border-(--gold)/30 pt-4">
                <h3 className="text-xl font-bold text-(--gold) mb-3 text-center">
                  Velg dag å vise:
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {allOppdrag.map((quest) => {
                    const hasBonus = !!quest.bonusoppdrag;
                    const hasModule = !!quest.reveals?.modules?.length;
                    const hasDecryption = !!quest.decryption_challenge;

                    return (
                      <button
                        key={quest.dag}
                        onClick={() => setSelectedDay(quest.dag)}
                        className={`relative p-2 text-lg font-bold border-2 transition-all ${
                          selectedDay === quest.dag
                            ? "bg-(--gold) text-black border-(--gold) scale-110"
                            : "bg-black text-(--neon-green) border-(--neon-green) hover:bg-(--neon-green)/20"
                        }`}
                      >
                        {quest.dag}
                        {/* Indicators */}
                        {(hasBonus || hasModule || hasDecryption) && (
                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                            {hasBonus && (
                              <span className="text-xs" title="Bonusoppdrag">
                                🏅
                              </span>
                            )}
                            {hasModule && (
                              <span className="text-xs" title="Låser opp modul">
                                🔓
                              </span>
                            )}
                            {hasDecryption && (
                              <span className="text-xs" title="Dekryptering">
                                🔐
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Links Navigation Grid */}
            <div>
              <h2 className="text-3xl font-bold text-center mb-4">
                🔗 HURTIGLENKER
              </h2>

              {/* First Row */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Shopping List */}
                <Link
                  href={`/nissemor-guide/handleliste?kode=${kode}`}
                  className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6 hover:bg-(--cold-blue)/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-(--cold-blue) mb-2 text-center">
                    🛒 HANDLEKURV-LISTE
                  </h3>
                  <p className="text-center text-sm">
                    Alle materialer som trengs for desember
                  </p>
                </Link>

                {/* Printout */}
                <Link
                  href={`/nissemor-guide/printout?kode=${kode}`}
                  className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-6 hover:bg-(--neon-green)/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-(--neon-green) mb-2 text-center">
                    🖨️ UTSKRIFTER
                  </h3>
                  <p className="text-center text-sm">
                    Alle fysiske ledetekster for hele desember, klare for
                    utskrift!
                  </p>
                </Link>

                {/* Symbols */}
                <Link
                  href={`/nissemor-guide/symboler?kode=${kode}`}
                  className="border-4 border-purple-600 bg-purple-600/10 p-6 hover:bg-purple-600/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-purple-400 mb-2 text-center">
                    🎁 SYMBOLER
                  </h3>
                  <p className="text-center text-sm">
                    QR-kort for symbolsamling og dekryptering
                  </p>
                </Link>
              </div>

              {/* Second Row */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Eventyr */}
                <Link
                  href={`/nissemor-guide/eventyr?kode=${kode}`}
                  className="border-4 border-(--gold) bg-(--gold)/10 p-6 hover:bg-(--gold)/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-(--gold) mb-2 text-center">
                    📖 EVENTYR
                  </h3>
                  <p className="text-center text-sm">
                    Oversikt over alle 6 eventyr og deres fremdrift
                  </p>
                </Link>

                {/* Merker */}
                <Link
                  href={`/nissemor-guide/merker?kode=${kode}`}
                  className="border-4 border-(--gold) bg-(--gold)/10 p-6 hover:bg-(--gold)/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-(--gold) mb-2 text-center">
                    🏆 MERKER
                  </h3>
                  <p className="text-center text-sm">
                    Oversikt og administrasjon av merkesystemet
                  </p>
                </Link>

                {/* Development/Testing */}
                <Link
                  href={`/nissemor-guide/utvikling?kode=${kode}`}
                  className="border-4 border-(--christmas-red) bg-(--christmas-red)/10 p-6 hover:bg-(--christmas-red)/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-(--christmas-red) mb-2 text-center">
                    ⚙️ UTVIKLING
                  </h3>
                  <p className="text-center text-sm">
                    Test-verktøy og admin-funksjoner (kun for testing)
                  </p>
                </Link>

                {/* Brevfugler */}
                <Link
                  href={`/nissemor-guide/brevfugler?kode=${kode}`}
                  className="border-4 border-pink-600 bg-pink-600/10 p-6 hover:bg-pink-600/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-pink-400 mb-2 text-center">
                    ✉️ BREVFUGLER
                  </h3>
                  <p className="text-center text-sm">
                    Skriv personlige brev fra Julius til barnet
                  </p>
                </Link>

                {/* Bonusoppdrag */}
                <Link
                  href={`/nissemor-guide/bonusoppdrag?kode=${kode}`}
                  className="border-4 border-orange-600 bg-orange-600/10 p-6 hover:bg-orange-600/20 transition-colors"
                >
                  <h3 className="text-2xl font-bold text-orange-400 mb-2 text-center">
                    🏅 BONUSOPPDRAG
                  </h3>
                  <p className="text-center text-sm">
                    Valider kriseløsninger og tildel merker
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eventyr Progress Summary */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-4">
            📖 EVENTYR-FREMGANG
          </h2>
          <p className="text-lg mb-4 opacity-80">
            Oversikt over hvordan barna dine ligger an med historiene:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEventyr.map((arc) => {
              const days = getEventyrDays(arc.id);
              const progress = getEventyrProgress(arc.id, completedDays);
              const complete = isEventyrComplete(arc.id, completedDays);

              return (
                <div
                  key={arc.id}
                  className="border-2 p-4 bg-black/30"
                  style={{ borderColor: arc.farge }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{arc.ikon}</span>
                    <div className="flex-1">
                      <div
                        className="text-xl font-bold"
                        style={{ color: arc.farge }}
                      >
                        {arc.navn}
                      </div>
                      <div className="text-sm text-(--gray)">
                        Dager: {days.join(", ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: complete ? "var(--gold)" : arc.farge }}
                      >
                        {progress}%
                      </div>
                      {complete && (
                        <div className="text-xs text-(--gold)">✓ FULLFØRT</div>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-black border border-(--neon-green)/30">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: complete ? "var(--gold)" : arc.farge,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link
              href={`/nissemor-guide/eventyr?kode=${kode}`}
              className="inline-block px-6 py-2 border-4 border-(--gold) text-(--gold) font-bold text-xl hover:bg-(--gold)/10"
            >
              SE FULL EVENTYR-OVERSIKT →
            </Link>
          </div>
        </div>
      </div>

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
                        <span className="text-xl font-bold">
                          DAG {dag.dag}: {dag.tittel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-sm ${getSetupBadgeColor(dag.oppsett_tid)} text-white`}
                          >
                            {dag.oppsett_tid.toUpperCase()}
                          </span>
                          <span className="text-2xl">
                            {expandedDays.includes(dag.dag) ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Day Details */}
                    {expandedDays.includes(dag.dag) && (
                      <div className="p-4 space-y-4 bg-(--dark-crt)/50">
                        <div>
                          <h3 className="text-lg font-bold text-(--gold) mb-2">
                            🎭 OPPSETT AV RAMPENISSEN-SCENE:
                          </h3>
                          <p className="mb-2">{dag.rampenissen_rampestrek}</p>
                        </div>

                        <div className="border-2 border-(--cold-blue)/50 p-3">
                          <h3 className="text-sm font-bold text-(--cold-blue) mb-2">
                            📝 FYSISK LAPP (Skriv dette på lappen):
                          </h3>
                          <p className="text-(--cold-blue) text-sm italic">
                            &quot;{dag.fysisk_hint}&quot;
                          </p>
                        </div>

                        <div className="border-2 border-(--christmas-red) p-3 bg-(--christmas-red)/10">
                          <span className="text-(--christmas-red) font-bold">
                            🔐 RIKTIG KODE:
                          </span>{" "}
                          <span className="text-2xl font-bold">{dag.kode}</span>
                        </div>

                        {dag.bonusoppdrag && (
                          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
                            <h3 className="text-xl font-bold text-(--gold)">
                              ⚠️ BONUSOPPDRAG: {dag.bonusoppdrag.tittel}
                            </h3>
                            <p className="text-(--gold)/90">
                              {dag.bonusoppdrag.beskrivelse}
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
              Denne grafen viser hvordan systemmetrikker bygges opp gradvis
              gjennom kalenderen (1. til 24. desember). Dette er normalt
              oppførsel - systemet starter lavt og vokser naturlig mot jul. 🎄
            </p>

            <div className="space-y-8">
              {/* NISSEKRAFT Chart */}
              <div>
                <h3 className="text-lg font-bold mb-2 text-(--neon-green)">
                  ⚡ NISSEKRAFT
                </h3>
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-auto border-2 border-(--neon-green)/30"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={180 - y * 1.3}
                      x2="590"
                      y2={180 - y * 1.3}
                      stroke="rgba(0, 255, 0, 0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <text
                      key={y}
                      x="35"
                      y={185 - y * 1.3}
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {y}
                    </text>
                  ))}
                  {/* X-axis labels */}
                  {[1, 6, 11, 16, 21, 24].map((day) => (
                    <text
                      key={day}
                      x={50 + (day - 1) * 23.5}
                      y="195"
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {day}
                    </text>
                  ))}
                  {/* Progression curve */}
                  <polyline
                    points={Array.from({ length: 24 }, (_, i) => {
                      const day = i + 1;
                      const value = Math.min(
                        100,
                        20 +
                          (80 / (1 + Math.exp(-0.4 * (day - 12)))) *
                            (day >= 11 ? 0.5 : 1),
                      );
                      return `${50 + i * 23.5},${180 - value * 1.3}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="3"
                  />
                  {/* Crisis marker at Day 11 */}
                  <line
                    x1={50 + 10 * 23.5}
                    y1="20"
                    x2={50 + 10 * 23.5}
                    y2="180"
                    stroke="#ff0000"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={50 + 10 * 23.5}
                    y="15"
                    fill="#ff0000"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    Antenne-krise
                  </text>
                </svg>
                <p className="text-xs text-(--neon-green)/60 mt-2">
                  Note: Faller kraftig dag 11 (antenne-krise) til den repareres
                </p>
              </div>

              {/* BREVFUGL-SVERM Chart */}
              <div>
                <h3 className="text-lg font-bold mb-2 text-(--neon-green)">
                  🕊️ BREVFUGL-SVERM
                </h3>
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-auto border-2 border-(--neon-green)/30"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={180 - y * 1.3}
                      x2="590"
                      y2={180 - y * 1.3}
                      stroke="rgba(0, 255, 0, 0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <text
                      key={y}
                      x="35"
                      y={185 - y * 1.3}
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {y}
                    </text>
                  ))}
                  {/* X-axis labels */}
                  {[1, 6, 11, 16, 21, 24].map((day) => (
                    <text
                      key={day}
                      x={50 + (day - 1) * 23.5}
                      y="195"
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {day}
                    </text>
                  ))}
                  {/* Progression curve */}
                  <polyline
                    points={Array.from({ length: 24 }, (_, i) => {
                      const day = i + 1;
                      const value = Math.min(
                        100,
                        15 +
                          (85 / (1 + Math.exp(-0.4 * (day - 12)))) *
                            (day >= 16 ? 0.4 : 1),
                      );
                      return `${50 + i * 23.5},${180 - value * 1.3}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="3"
                  />
                  {/* Crisis marker at Day 16 */}
                  <line
                    x1={50 + 15 * 23.5}
                    y1="20"
                    x2={50 + 15 * 23.5}
                    y2="180"
                    stroke="#ff0000"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={50 + 15 * 23.5}
                    y="15"
                    fill="#ff0000"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    Inventar-kaos
                  </text>
                </svg>
                <p className="text-xs text-(--neon-green)/60 mt-2">
                  Note: Faller kraftig dag 16 (inventar-kaos) til den løses
                </p>
              </div>

              {/* VERKSTED-VARME Chart */}
              <div>
                <h3 className="text-lg font-bold mb-2 text-(--neon-green)">
                  🔥 VERKSTED-VARME
                </h3>
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-auto border-2 border-(--neon-green)/30"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={180 - y * 1.3}
                      x2="590"
                      y2={180 - y * 1.3}
                      stroke="rgba(0, 255, 0, 0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <text
                      key={y}
                      x="35"
                      y={185 - y * 1.3}
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {y}
                    </text>
                  ))}
                  {/* X-axis labels */}
                  {[1, 6, 11, 16, 21, 24].map((day) => (
                    <text
                      key={day}
                      x={50 + (day - 1) * 23.5}
                      y="195"
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {day}
                    </text>
                  ))}
                  {/* Progression curve */}
                  <polyline
                    points={Array.from({ length: 24 }, (_, i) => {
                      const day = i + 1;
                      const value = Math.min(
                        100,
                        25 + 75 / (1 + Math.exp(-0.4 * (day - 12))),
                      );
                      return `${50 + i * 23.5},${180 - value * 1.3}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="3"
                  />
                </svg>
                <p className="text-xs text-(--neon-green)/60 mt-2">
                  Note: Gradvis økning uten kriser
                </p>
              </div>

              {/* SLEDE-TURBO Chart */}
              <div>
                <h3 className="text-lg font-bold mb-2 text-(--neon-green)">
                  🚀 SLEDE-TURBO
                </h3>
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-auto border-2 border-(--neon-green)/30"
                >
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="50"
                      y1={180 - y * 1.3}
                      x2="590"
                      y2={180 - y * 1.3}
                      stroke="rgba(0, 255, 0, 0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <text
                      key={y}
                      x="35"
                      y={185 - y * 1.3}
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {y}
                    </text>
                  ))}
                  {/* X-axis labels */}
                  {[1, 6, 11, 16, 21, 24].map((day) => (
                    <text
                      key={day}
                      x={50 + (day - 1) * 23.5}
                      y="195"
                      fill="#00ff00"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {day}
                    </text>
                  ))}
                  {/* Progression curve */}
                  <polyline
                    points={Array.from({ length: 24 }, (_, i) => {
                      const day = i + 1;
                      const value = Math.min(
                        100,
                        10 + 90 / (1 + Math.exp(-0.4 * (day - 12))),
                      );
                      return `${50 + i * 23.5},${180 - value * 1.3}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="3"
                  />
                </svg>
                <p className="text-xs text-(--neon-green)/60 mt-2">
                  Note: Låses opp dag 10, gradvis økning uten kriser
                </p>
              </div>
            </div>

            <div className="border-2 border-(--neon-green)/30 bg-(--neon-green)/5 p-4">
              <h4 className="font-bold text-(--gold) mb-2">
                📌 Viktig for foreldre:
              </h4>
              <ul className="space-y-2 text-(--neon-green)/80 text-sm">
                <li>
                  • Verdiene starter <strong>lavt</strong> (10-25) og vokser mot
                  100 gjennom desember
                </li>
                <li>
                  • <strong>NISSEKRAFT</strong> og{" "}
                  <strong>BREVFUGL-SVERM</strong> får "kriser" som fryser
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
        <p>Hold denne siden hemmelig fra barna! 🤫</p>
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

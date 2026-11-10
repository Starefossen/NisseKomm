"use client";

import { useState, useSyncExternalStore } from "react";
import { CRTFrame } from "@/components/ui/CRTFrame";
import { BootSequence } from "@/components/ui/BootSequence";
import { PasswordPrompt } from "@/components/ui/PasswordPrompt";
import { Day1Boot } from "@/components/ui/Day1Opener";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useSounds } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";
import { useAppState } from "@/lib/app-context";
import { DesktopIcon } from "@/components/ui/DesktopIcon";
import { SystemStatus } from "@/components/modules/SystemStatus";
import { VarselKonsoll } from "@/components/modules/VarselKonsoll";
import { NisseMail } from "@/components/windows/NisseMail";
import { KodeTerminal } from "@/components/windows/KodeTerminal";
import { NisseNetUtforsker } from "@/components/windows/NisseNetUtforsker";
import { Kalender } from "@/components/windows/Kalender";
import { NisseMusikk } from "@/components/windows/NisseMusikk";
import { SnøfallTV } from "@/components/windows/SnøfallTV";
import { Brevfugler } from "@/components/windows/Brevfugler";
import { NisseStats } from "@/components/windows/NisseStats";
import { NisseKrypto } from "@/components/windows/NisseKrypto";
import { SymbolScanner } from "@/components/windows/SymbolScanner";
import { EventyrOversikt } from "@/components/windows/EventyrOversikt";
import { Dagbok } from "@/components/windows/Dagbok";
import { RuneTavle } from "@/components/windows/RuneTavle";
import { FROST_OPEN_WINDOWS } from "@/lib/frost";
import { GrandFinaleModal } from "@/components/ui/GrandFinaleModal";
import { BadgeRow } from "@/components/ui/BadgeRow";
import { NameEntryModal } from "@/components/ui/NameEntryModal";
import { HamburgerMenu } from "@/components/ui/HamburgerMenu";
import { GameEngine } from "@/lib/game-engine";
import { useHourTick } from "@/lib/use-clock";
import {
  getCurrentDay,
  isCalendarActive as isDateCalendarActive,
} from "@/lib/date-utils";
import statiskInnholdData from "@/data/statisk_innhold.json";
import { Varsel, FilNode } from "@/types/innhold";

const oppdrag = GameEngine.getAllQuests();
const { varsler, filer } = statiskInnholdData as {
  varsler: Varsel[];
  filer: FilNode[];
};

const emptySubscribe = () => () => {};

/**
 * Check if current date is within the calendar period (December 1-24)
 * Delegates to centralized date utility
 */
function isCalendarActive(testMode: boolean): boolean {
  return isDateCalendarActive(testMode);
}

export default function Home() {
  // Get app state from context (handles initialization, session, and data loading)
  const {
    isAuthenticated,
    isInitializing,
    familyData,
    unlockedModules,
    unreadEmailCount,
    unreadFileCount,
    unreadDagbokCount,
    authenticate,
    refreshGameState,
  } = useAppState();

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Local UI state
  const [bootFinished, setBootFinished] = useState(false);
  const [openWindow, setOpenWindow] = useState<string | null>(null);
  const [musicAutoPlay, setMusicAutoPlay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showGrandFinale, setShowGrandFinale] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [thawing, setThawing] = useState(false);
  const [aurora, setAurora] = useState(false);

  const { playSound, playJingle } = useSounds();

  useHourTick(refreshGameState);

  const bootDuration = parseInt(
    process.env.NEXT_PUBLIC_BOOT_ANIMATION_DURATION || "2",
  );
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  // Update unlocked modules when codes are submitted
  const handleCodeSubmitted = () => {
    // Day 10/21 thaw and the day 17 northern-light wash (storyboard «Intensitetskurven»)
    if (frostMode.level > 0 && GameEngine.getFrostMode().level === 0) {
      setThawing(true);
    }
    if (getCurrentDay() === 17 && GameEngine.isQuestCompleted(17)) {
      setAurora(true);
    }
    // Day 12: the jukebox thaws and is heard at once
    if (getCurrentDay() === 12 && GameEngine.isQuestCompleted(12)) {
      setTimeout(() => {
        setMusicAutoPlay(true);
        setOpenWindow("nissemusikk");
      }, 2000);
    }
    refreshGameState();

    // Check if Day 22 just completed and names not yet entered
    if (
      GameEngine.isQuestCompleted(22) &&
      GameEngine.getPlayerNames().length === 0
    ) {
      // Delay to let success animation play
      setTimeout(() => setShowNameEntry(true), 2000);
    }

    // Check if all 24 quests completed for grand finale
    if (GameEngine.isGameComplete()) {
      // Delay to let success animation play
      setTimeout(() => setShowGrandFinale(true), 2000);
    }
  };

  // Date validation for production mode
  const isDateValid = () => isCalendarActive(testMode);

  const handleBootComplete = () => {
    setBootFinished(true);
  };

  const handleAuthSuccess = async (sessionId: string) => {
    // Delegate to AppContext for full initialization
    await authenticate(sessionId);

    playSound("success");
    // Play jingle after a short delay
    setTimeout(() => playJingle(), 500);
  };

  const handleIconClick = (windowId: string) => {
    setMusicAutoPlay(false);
    if (openWindow === windowId) {
      setOpenWindow(null);
      playSound("close");
    } else {
      setOpenWindow(windowId);
      setSelectedDay(null);
      playSound("open");
    }
  };

  const handleCloseWindow = () => {
    setMusicAutoPlay(false);
    if (openWindow) {
    }
    setOpenWindow(null);
    setSelectedDay(null);
    playSound("close");
    // Refresh game state when closing windows
    refreshGameState();
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setOpenWindow("nissemail");
  };

  const getCurrentMission = () => {
    const day = selectedDay || getCurrentDay();
    return oppdrag.find((m) => m.dag === day) || oppdrag[0];
  };

  const handleNameEntryComplete = (names: string[]) => {
    GameEngine.setPlayerNames(names);
    setShowNameEntry(false);
    playSound("success");
  };

  // Compute effective authenticated state only after hydration to match SSR HTML
  const effectiveAuthenticated = isHydrated
    ? isInitializing
      ? StorageManager.isAuthenticated()
      : isAuthenticated
    : false;
  const bootComplete = bootFinished || effectiveAuthenticated;

  const frostMode = effectiveAuthenticated
    ? GameEngine.getFrostMode()
    : { level: 0, message: "" };
  const isFrozen = (windowId: string) =>
    frostMode.level === 2 && !FROST_OPEN_WINDOWS.includes(windowId);

  // Today's Julius video opens by itself once per visit and day until it has been watched
  const [autoOpenedDay, setAutoOpenedDay] = useState(0);
  if (
    autoOpenedDay !== getCurrentDay() &&
    bootComplete &&
    effectiveAuthenticated &&
    !isInitializing
  ) {
    setAutoOpenedDay(getCurrentDay());
    if (!GameEngine.isJuliusVideoWatched(getCurrentDay())) {
      setOpenWindow("dagbok");
    }
  }

  // T14: first login of the season on 1 December gets the tune-in, once
  const [day1BootDone, setDay1BootDone] = useState(false);
  const showDay1Boot =
    bootComplete &&
    effectiveAuthenticated &&
    !isInitializing &&
    !day1BootDone &&
    getCurrentDay() === 1 &&
    !GameEngine.isIntroSeen("boot");

  // Show access denied if outside December 1-24 in production mode
  if (isHydrated && !isDateValid()) {
    return (
      <CRTFrame>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-8 border-4 border-(--christmas-red) max-w-2xl">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-3xl font-bold text-(--christmas-red) tracking-wider">
              TILGANG NEKTET
            </div>
            <div className="text-xl text-(--neon-green)">
              SYSTEMET ER STENGT UTENFOR JULESONEN
            </div>
            <div className="text-sm opacity-70 pt-4">
              NisseKomm er kun tilgjengelig 1. - 24. desember
            </div>
          </div>
        </div>
      </CRTFrame>
    );
  }

  return (
    <CRTFrame>
      {/* Sound toggle button */}
      {bootComplete && effectiveAuthenticated && <SoundToggle />}

      {/* Boot sequence */}
      {!bootComplete && (
        <BootSequence onComplete={handleBootComplete} duration={bootDuration} />
      )}

      {showDay1Boot && <Day1Boot onDone={() => setDay1BootDone(true)} />}

      {/* Password prompt */}
      {bootComplete && !effectiveAuthenticated && (
        <PasswordPrompt onSuccess={handleAuthSuccess} />
      )}

      {/* Main application */}
      {bootComplete && effectiveAuthenticated && (
        <div
          className={`flex h-full ${frostMode.level === 1 ? "frost-colors-leak" : ""}`}
        >
          {/* Hamburger menu button for mobile */}
          <HamburgerMenu
            isOpen={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/80 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - hidden on mobile, overlay on tablet, static on desktop */}
          <div
            className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              fixed lg:static
              inset-y-0 left-0
              w-64 lg:w-1/4
              p-4 flex flex-col gap-4
              border-r-4 border-(--neon-green)/30
              bg-(--dark-crt)
              overflow-hidden
              z-40
              transition-transform duration-300
            `}
          >
            <SystemStatus currentDay={getCurrentDay()} />
            <VarselKonsoll alerts={varsler} currentDay={getCurrentDay()} />
          </div>

          {/* Main workspace - 75% */}
          <div className="flex-1 relative flex flex-col">
            <div className="flex-1 overflow-auto">
              {!openWindow ? (
                // Desktop with icons
                <div className="flex items-center justify-center h-full p-4 md:p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl">
                    <DesktopIcon
                      icon="file"
                      label="NISSEMAIL"
                      color="green"
                      unreadCount={unreadEmailCount}
                      onClick={() => handleIconClick("nissemail")}
                    />
                    <DesktopIcon
                      icon="code"
                      label="KODETERMINAL"
                      color="blue"
                      onClick={() => handleIconClick("kodeterminal")}
                    />
                    <DesktopIcon
                      icon="folder"
                      label="NISSENET"
                      color="green"
                      unreadCount={unreadFileCount}
                      onClick={() => handleIconClick("nissenet")}
                    />
                    <DesktopIcon
                      icon="calendar"
                      label="KALENDER"
                      color="gold"
                      disabled={isFrozen("kalender")}
                      onClick={() => handleIconClick("kalender")}
                    />
                    <DesktopIcon
                      icon="script-text"
                      label="EVENTYR"
                      color="blue"
                      disabled={isFrozen("eventyr-oversikt")}
                      onClick={() => handleIconClick("eventyr-oversikt")}
                    />
                    <DesktopIcon
                      icon="book"
                      label="DAGBOK"
                      color="gold"
                      unreadCount={unreadDagbokCount}
                      onClick={() => handleIconClick("dagbok")}
                    />
                    <DesktopIcon
                      icon="grid"
                      label="RUNETAVLE"
                      color="blue"
                      disabled={isFrozen("runetavle")}
                      onClick={() => handleIconClick("runetavle")}
                    />
                    <DesktopIcon
                      icon="image"
                      label="SNØFALL TV"
                      color="green"
                      disabled={isFrozen("nordpol_tv")}
                      onClick={() => handleIconClick("nordpol_tv")}
                    />

                    {/* Unlockable modules - display in unlock order */}
                    {(() => {
                      const moduleOrder = [
                        {
                          key: "NISSEKRYPTO",
                          icon: "lock" as const,
                          label: "NISSEKRYPTO",
                          color: "gold" as const,
                          windowKey: "nissekrypto",
                        },
                        {
                          key: "SYMBOLSKANNER",
                          icon: "key" as const,
                          label: "SYMBOLSKANNER",
                          color: "green" as const,
                          windowKey: "symbolskanner",
                        },
                        {
                          key: "NISSEMUSIKK",
                          icon: "music" as const,
                          label: "NISSEMUSIKK",
                          color: "blue" as const,
                          windowKey: "nissemusikk",
                        },
                        {
                          key: "BREVFUGLER",
                          icon: "mail" as const,
                          label: "BREVFUGLER",
                          color: "gold" as const,
                          windowKey: "brevfugler",
                        },
                        {
                          key: "NISSESTATS",
                          icon: "chart" as const,
                          label: "NISSESTATS",
                          color: "blue" as const,
                          windowKey: "nissestats",
                        },
                      ];

                      const unlockedInOrder = moduleOrder.filter((m) =>
                        unlockedModules.includes(m.key),
                      );

                      // Show all unlocked modules or locked placeholders
                      return moduleOrder.slice(0, 5).map((module, index) => {
                        const unlockedModule = unlockedInOrder[index];
                        if (unlockedModule) {
                          return (
                            <DesktopIcon
                              key={unlockedModule.key}
                              icon={unlockedModule.icon}
                              label={unlockedModule.label}
                              color={unlockedModule.color}
                              disabled={isFrozen(unlockedModule.windowKey)}
                              onClick={() =>
                                handleIconClick(unlockedModule.windowKey)
                              }
                            />
                          );
                        } else {
                          return (
                            <DesktopIcon
                              key={`locked-${index}`}
                              icon="lock"
                              label="LÅST"
                              color="gray"
                              disabled
                              onClick={() => {}}
                            />
                          );
                        }
                      });
                    })()}
                  </div>
                </div>
              ) : (
                // Active window
                <>
                  {openWindow === "nissemail" && (
                    <NisseMail
                      missions={oppdrag}
                      currentDay={getCurrentDay()}
                      initialDay={selectedDay}
                      customCalendarEvents={familyData.calendarEvents}
                      onClose={handleCloseWindow}
                      onOpenKodeTerminal={(day) => {
                        setSelectedDay(day);
                        setOpenWindow("kodeterminal");
                        playSound("open");
                      }}
                    />
                  )}
                  {openWindow === "kodeterminal" && (
                    <KodeTerminal
                      onClose={handleCloseWindow}
                      expectedCode={getCurrentMission().kode}
                      currentDay={selectedDay || getCurrentDay()}
                      allMissions={oppdrag}
                      onCodeSubmitted={handleCodeSubmitted}
                    />
                  )}
                  {openWindow === "nissenet" && (
                    <NisseNetUtforsker
                      files={filer}
                      missions={oppdrag}
                      currentDay={getCurrentDay()}
                      onClose={handleCloseWindow}
                    />
                  )}
                  {openWindow === "kalender" && (
                    <Kalender
                      missions={oppdrag}
                      customCalendarEvents={familyData.calendarEvents}
                      onClose={handleCloseWindow}
                      onSelectDay={handleSelectDay}
                    />
                  )}
                  {openWindow === "nissemusikk" && (
                    <NisseMusikk
                      onClose={handleCloseWindow}
                      autoPlay={musicAutoPlay}
                    />
                  )}
                  {openWindow === "nissekrypto" && (
                    <NisseKrypto onClose={handleCloseWindow} />
                  )}
                  {openWindow === "symbolskanner" && (
                    <SymbolScanner onClose={handleCloseWindow} />
                  )}
                  {openWindow === "nordpol_tv" && (
                    <SnøfallTV
                      onClose={handleCloseWindow}
                      currentDay={getCurrentDay()}
                    />
                  )}
                  {openWindow === "brevfugler" && (
                    <Brevfugler onClose={handleCloseWindow} />
                  )}
                  {openWindow === "nissestats" && (
                    <NisseStats
                      onClose={handleCloseWindow}
                      currentDay={getCurrentDay()}
                    />
                  )}
                  {openWindow === "eventyr-oversikt" && (
                    <EventyrOversikt onClose={handleCloseWindow} />
                  )}
                  {openWindow === "runetavle" && (
                    <RuneTavle onClose={handleCloseWindow} />
                  )}
                  {openWindow === "dagbok" && (
                    <Dagbok
                      missions={oppdrag}
                      onClose={handleCloseWindow}
                      onWatched={refreshGameState}
                    />
                  )}
                </>
              )}
            </div>

            {/* Badge row at bottom of main workspace */}
            {!openWindow && <BadgeRow />}
          </div>
        </div>
      )}

      {/* Frost overlays sit above windows but never take clicks */}
      {bootComplete && effectiveAuthenticated && (
        <>
          {frostMode.level === 1 && (
            <div className="fixed inset-0 pointer-events-none z-60 frost-vhs" />
          )}
          {frostMode.level === 2 && (
            <div className="fixed inset-0 pointer-events-none z-60 frost-edge">
              {!openWindow && (
                <div className="absolute inset-x-0 top-1/3 text-center text-2xl text-white/90 px-8">
                  {frostMode.message}
                </div>
              )}
            </div>
          )}
          {thawing && (
            <div
              className="fixed inset-0 pointer-events-none z-60 frost-edge frost-thaw"
              onAnimationEnd={() => setThawing(false)}
            />
          )}
          {aurora && (
            <div
              className="fixed inset-0 pointer-events-none z-60 aurora-wash"
              onAnimationEnd={() => setAurora(false)}
            />
          )}
        </>
      )}

      {/* Grand finale modal */}
      {showGrandFinale && (
        <GrandFinaleModal onClose={() => setShowGrandFinale(false)} />
      )}

      {/* Day 23 name entry modal */}
      {showNameEntry && <NameEntryModal onComplete={handleNameEntryComplete} />}
    </CRTFrame>
  );
}

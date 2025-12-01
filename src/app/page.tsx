"use client";

import { useState, useEffect } from "react";
import { CRTFrame } from "@/components/ui/CRTFrame";
import { BootSequence } from "@/components/ui/BootSequence";
import { PasswordPrompt } from "@/components/ui/PasswordPrompt";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useSounds } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";
import { getSessionId } from "@/lib/session-manager";
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
import { GrandFinaleModal } from "@/components/ui/GrandFinaleModal";
import { BadgeRow } from "@/components/ui/BadgeRow";
import { NameEntryModal } from "@/components/ui/NameEntryModal";
import { HamburgerMenu } from "@/components/ui/HamburgerMenu";
import { GameEngine } from "@/lib/game-engine";
import {
  getCurrentDay,
  isCalendarActive as isDateCalendarActive,
} from "@/lib/date-utils";
import { trackWindowInteraction } from "@/lib/analytics";
import statiskInnholdData from "@/data/statisk_innhold.json";
import { Varsel, FilNode } from "@/types/innhold";

const oppdrag = GameEngine.getAllQuests();
const { varsler, filer } = statiskInnholdData as {
  varsler: Varsel[];
  filer: FilNode[];
};

/**
 * Check if current date is within the calendar period (December 1-24)
 * Delegates to centralized date utility
 */
function isCalendarActive(testMode: boolean): boolean {
  return isDateCalendarActive(testMode);
}

/**
 * Get count of unread emails for current day
 */
function getUnreadEmailCount(): number {
  if (typeof window === "undefined") return 0;
  const currentDay = getCurrentDay();
  return GameEngine.getUnreadEmailCount(currentDay);
}

/**
 * Get count of unread files in NisseNet
 */
function getUnreadFileCount(): number {
  if (typeof window === "undefined") return 0;
  return GameEngine.getUnreadFileCount();
}

/**
 * Get count of unread diary entries
 */
function getUnreadDagbokCount(): number {
  if (typeof window === "undefined") return 0;
  const completedQuests = GameEngine.loadGameState().completedQuests;
  return StorageManager.getUnreadDagbokCount(completedQuests);
}

export default function Home() {
  const [bootComplete, setBootComplete] = useState(() => {
    if (typeof window !== "undefined") {
      return StorageManager.isAuthenticated();
    }
    return false;
  });
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return StorageManager.isAuthenticated();
    }
    return false;
  });
  const [openWindow, setOpenWindow] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadEmailCount());
  const [unreadFileCount, setUnreadFileCount] = useState(() =>
    getUnreadFileCount(),
  );
  const [unreadDagbokCount, setUnreadDagbokCount] = useState(() =>
    getUnreadDagbokCount(),
  );
  const [unlockedModules, setUnlockedModules] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getUnlockedModules();
    }
    return [];
  });
  const [showGrandFinale, setShowGrandFinale] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { playSound, playJingle } = useSounds();

  const bootDuration = parseInt(
    process.env.NEXT_PUBLIC_BOOT_ANIMATION_DURATION || "2",
  );
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  // Restore session from cookie on mount
  useEffect(() => {
    const restoreSession = async () => {
      const existingSessionId = getSessionId();
      if (existingSessionId && !authenticated) {
        console.debug(
          "[App] Restoring session:",
          existingSessionId.substring(0, 8) + "...",
        );
        // Session cookie exists, restore it and wait for initialization
        await StorageManager.setAuthenticated(true, existingSessionId);

        // Refresh all UI state from loaded session data
        setUnlockedModules(GameEngine.getUnlockedModules());
        setUnreadCount(getUnreadEmailCount());
        setUnreadFileCount(getUnreadFileCount());
        setUnreadDagbokCount(getUnreadDagbokCount());

        setAuthenticated(true);
        setBootComplete(true);
        console.debug("[App] Session restored successfully");
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount, authenticated intentionally excluded

  // Note: Module unlocks are now handled by GameEngine automatically on code submission
  // The unlockedModules state is initialized from GameEngine and updated via handleCodeSubmitted
  // Crisis state is checked within the respective module components
  // (SnøfallTV for antenna, NisseStats for inventory) to keep crisis logic co-located with UI

  // Update unlocked modules when codes are submitted
  const handleCodeSubmitted = () => {
    setUnlockedModules(GameEngine.getUnlockedModules());
    setUnreadCount(getUnreadEmailCount());

    // Check if Day 22 just completed and names not yet entered
    if (
      GameEngine.isQuestCompleted(22) &&
      StorageManager.getPlayerNames().length === 0
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
    setBootComplete(true);
  };

  const handleAuthSuccess = async (sessionId: string) => {
    // CRITICAL: Wait for adapter initialization before updating state
    await StorageManager.setAuthenticated(true, sessionId);
    setAuthenticated(true);

    // Refresh all UI state from newly loaded session data
    setUnlockedModules(GameEngine.getUnlockedModules());
    setUnreadCount(getUnreadEmailCount());
    setUnreadFileCount(getUnreadFileCount());
    setUnreadDagbokCount(getUnreadDagbokCount());

    playSound("success");
    // Play jingle after a short delay
    setTimeout(() => playJingle(), 500);
  };

  const handleIconClick = (windowId: string) => {
    if (openWindow === windowId) {
      setOpenWindow(null);
      trackWindowInteraction(windowId, "closed");
      playSound("close");
    } else {
      setOpenWindow(windowId);
      setSelectedDay(null);
      trackWindowInteraction(windowId, "opened");
      playSound("open");

      // Reset NisseNet unread count when opening
      if (windowId === "nissenet" && typeof window !== "undefined") {
        setUnreadFileCount(0);
      }
    }
  };

  const handleCloseWindow = () => {
    if (openWindow) {
      trackWindowInteraction(openWindow, "closed");
    }
    setOpenWindow(null);
    setSelectedDay(null);
    playSound("close");
    // Refresh unread counts when closing windows
    if (typeof window !== "undefined") {
      setUnreadCount(getUnreadEmailCount());
      setUnreadFileCount(getUnreadFileCount());
      setUnreadDagbokCount(getUnreadDagbokCount());
    }
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
    StorageManager.setPlayerNames(names);
    setShowNameEntry(false);
    playSound("success");
  };

  // Show access denied if outside December 1-24 in production mode
  if (!isDateValid()) {
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
      {bootComplete && authenticated && <SoundToggle />}

      {/* Boot sequence */}
      {!bootComplete && (
        <BootSequence onComplete={handleBootComplete} duration={bootDuration} />
      )}

      {/* Password prompt */}
      {bootComplete && !authenticated && (
        <PasswordPrompt onSuccess={handleAuthSuccess} />
      )}

      {/* Main application */}
      {bootComplete && authenticated && (
        <div className="flex h-full">
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
                      unreadCount={unreadCount}
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
                      onClick={() => handleIconClick("kalender")}
                    />
                    <DesktopIcon
                      icon="script-text"
                      label="EVENTYR"
                      color="blue"
                      onClick={() => handleIconClick("eventyr-oversikt")}
                    />
                    <DesktopIcon
                      icon="book"
                      label="DAGBOK"
                      color="gold"
                      unreadCount={unreadDagbokCount}
                      onClick={() => handleIconClick("dagbok")}
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
                          key: "SNØFALL_TV",
                          icon: "image" as const,
                          label: "SNØFALL TV",
                          color: "green" as const,
                          windowKey: "nordpol_tv",
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
                      onClose={handleCloseWindow}
                      onSelectDay={handleSelectDay}
                    />
                  )}
                  {openWindow === "nissemusikk" && (
                    <NisseMusikk onClose={handleCloseWindow} />
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
                  {openWindow === "dagbok" && (
                    <Dagbok missions={oppdrag} onClose={handleCloseWindow} />
                  )}
                </>
              )}
            </div>

            {/* Badge row at bottom of main workspace */}
            {!openWindow && <BadgeRow />}
          </div>
        </div>
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

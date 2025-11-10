"use client";

import { useState, useEffect } from "react";
import { CRTFrame } from "@/components/ui/CRTFrame";
import { BootSequence } from "@/components/ui/BootSequence";
import { PasswordPrompt } from "@/components/ui/PasswordPrompt";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useSounds } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";
import { DesktopIcon } from "@/components/ui/DesktopIcon";
import { SystemStatus } from "@/components/modules/SystemStatus";
import { VarselKonsoll } from "@/components/modules/VarselKonsoll";
import { NisseMail } from "@/components/windows/NisseMail";
import { KodeTerminal } from "@/components/windows/KodeTerminal";
import { NisseNetUtforsker } from "@/components/windows/NisseNetUtforsker";
import { Kalender } from "@/components/windows/Kalender";
import { NisseMusikk } from "@/components/windows/NisseMusikk";
import { NordpolTV } from "@/components/windows/NordpolTV";
import { NisseBrev } from "@/components/windows/NisseBrev";
import { NisseStats } from "@/components/windows/NisseStats";
import { GrandFinaleModal } from "@/components/ui/GrandFinaleModal";
import { getAllOppdrag, getCompletionCount } from "@/lib/oppdrag-loader";
import statiskInnholdData from "@/data/statisk_innhold.json";
import { Varsel, FilNode, SystemMetrikk, KalenderDag } from "@/types/innhold";

const oppdrag = getAllOppdrag();
const { varsler, filer, systemMetrikker } = statiskInnholdData as {
  varsler: Varsel[];
  filer: FilNode[];
  systemMetrikker: SystemMetrikk[];
  kalender: KalenderDag[];
};

/**
 * Get current calendar day (1-31)
 */
function getCurrentDay(): number {
  return new Date().getDate();
}

/**
 * Check if current date is within the calendar period (December 1-24)
 * @param testMode - If true, bypass date restrictions for development
 */
function isCalendarActive(testMode: boolean): boolean {
  if (testMode) return true;

  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const day = now.getDate();

  return month === 12 && day >= 1 && day <= 24;
}

/**
 * Get count of unread emails for current day
 */
function getUnreadEmailCount(): number {
  if (typeof window === "undefined") return 0;
  const currentDay = getCurrentDay();
  return StorageManager.getUnreadEmailCount(currentDay, oppdrag.length);
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
  const [unlockedModules, setUnlockedModules] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getUnlockedModules();
    }
    return [];
  });
  const [showGrandFinale, setShowGrandFinale] = useState(false);
  const { playSound, playJingle } = useSounds();

  const bootPassword = process.env.NEXT_PUBLIC_BOOT_PASSWORD || "NISSEKODE2025";
  const bootDuration = parseInt(
    process.env.NEXT_PUBLIC_BOOT_ANIMATION_DURATION || "2",
  );
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  // Check for module unlocks and crisis triggers when component mounts or codes change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const codes = StorageManager.getSubmittedCodes();
    const completedCount = getCompletionCount(codes.map((c) => c.kode));

    // Module unlock thresholds
    const MODULE_UNLOCK_DAYS = [
      { day: 7, module: "NISSEMUSIKK" },
      { day: 10, module: "NORDPOL_TV" },
      { day: 14, module: "NISSEBREV" },
      { day: 16, module: "NISSESTATS" },
    ] as const;

    MODULE_UNLOCK_DAYS.forEach(({ day, module }) => {
      if (completedCount >= day && !StorageManager.isModuleUnlocked(module)) {
        StorageManager.unlockModule(module);
        // TODO: Show celebration animation when module unlocks
      }
    });

    // Note: Crisis state is checked within the respective module components
    // (NordpolTV for antenna, NisseStats for inventory) to keep crisis logic
    // co-located with the UI that displays it
  }, []);

  // Update unlocked modules when codes are submitted
  const handleCodeSubmitted = () => {
    setUnlockedModules(StorageManager.getUnlockedModules());
    setUnreadCount(getUnreadEmailCount());

    // Check if Day 24 just completed for grand finale
    const codes = StorageManager.getSubmittedCodes();
    const completedCount = getCompletionCount(codes.map((c) => c.kode));
    if (completedCount === 24) {
      // Delay to let success animation play
      setTimeout(() => setShowGrandFinale(true), 2000);
    }
  };

  // Date validation for production mode
  const isDateValid = () => isCalendarActive(testMode);

  const handleBootComplete = () => {
    setBootComplete(true);
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    StorageManager.setAuthenticated(true);
    playSound("success");
    // Play jingle after a short delay
    setTimeout(() => playJingle(), 500);
  };

  const handleIconClick = (windowId: string) => {
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
    setOpenWindow(null);
    setSelectedDay(null);
    playSound("close");
    // Refresh unread count when closing NisseMail
    if (typeof window !== "undefined") {
      setUnreadCount(getUnreadEmailCount());
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
        <PasswordPrompt
          onSuccess={handleAuthSuccess}
          expectedPassword={bootPassword}
        />
      )}

      {/* Main application */}
      {bootComplete && authenticated && (
        <div className="flex h-full">
          {/* Sidebar - 25% */}
          <div className="w-1/4 p-4 flex flex-col gap-4 border-r-4 border-(--neon-green)/30 overflow-hidden">
            <SystemStatus metrics={systemMetrikker} />
            <VarselKonsoll alerts={varsler} />
          </div>

          {/* Main workspace - 75% */}
          <div className="flex-1 relative">
            {!openWindow ? (
              // Desktop with icons
              <div className="flex items-center justify-center h-full p-8">
                <div className="grid grid-cols-3 gap-8 max-w-3xl">
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
                    onClick={() => handleIconClick("nissenet")}
                  />
                  <DesktopIcon
                    icon="calendar"
                    label="KALENDER"
                    color="gold"
                    onClick={() => handleIconClick("kalender")}
                  />

                  {/* Unlockable modules - show first unlocked module */}
                  {unlockedModules.includes("NISSESTATS") ? (
                    <DesktopIcon
                      icon="chart"
                      label="NISSESTATS"
                      color="blue"
                      onClick={() => handleIconClick("nissestats")}
                    />
                  ) : unlockedModules.includes("NISSEBREV") ? (
                    <DesktopIcon
                      icon="mail"
                      label="NISSEBREV"
                      color="gold"
                      onClick={() => handleIconClick("nissebrev")}
                    />
                  ) : unlockedModules.includes("NORDPOL_TV") ? (
                    <DesktopIcon
                      icon="image"
                      label="NORDPOL TV"
                      color="green"
                      onClick={() => handleIconClick("nordpol_tv")}
                    />
                  ) : unlockedModules.includes("NISSEMUSIKK") ? (
                    <DesktopIcon
                      icon="music"
                      label="NISSEMUSIKK"
                      color="blue"
                      onClick={() => handleIconClick("nissemusikk")}
                    />
                  ) : (
                    <DesktopIcon
                      icon="lock"
                      label="LÅST"
                      color="gray"
                      disabled
                      onClick={() => {}}
                    />
                  )}

                  {/* Second unlockable slot - show second unlocked module */}
                  {unlockedModules.length >= 2 ? (
                    unlockedModules.includes("NISSESTATS") &&
                    unlockedModules.includes("NISSEBREV") ? (
                      <DesktopIcon
                        icon="chart"
                        label="NISSESTATS"
                        color="blue"
                        onClick={() => handleIconClick("nissestats")}
                      />
                    ) : unlockedModules.includes("NISSEBREV") &&
                      unlockedModules.includes("NORDPOL_TV") ? (
                      <DesktopIcon
                        icon="mail"
                        label="NISSEBREV"
                        color="gold"
                        onClick={() => handleIconClick("nissebrev")}
                      />
                    ) : unlockedModules.includes("NORDPOL_TV") &&
                      unlockedModules.includes("NISSEMUSIKK") ? (
                      <DesktopIcon
                        icon="image"
                        label="NORDPOL TV"
                        color="green"
                        onClick={() => handleIconClick("nordpol_tv")}
                      />
                    ) : (
                      <DesktopIcon
                        icon="lock"
                        label="LÅST"
                        color="gray"
                        disabled
                        onClick={() => {}}
                      />
                    )
                  ) : (
                    <DesktopIcon
                      icon="lock"
                      label="LÅST"
                      color="gray"
                      disabled
                      onClick={() => {}}
                    />
                  )}
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
                    onOpenKodeTerminal={() => handleIconClick("kodeterminal")}
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
                {openWindow === "nordpol_tv" && (
                  <NordpolTV
                    onClose={handleCloseWindow}
                    currentDay={getCurrentDay()}
                  />
                )}
                {openWindow === "nissebrev" && (
                  <NisseBrev onClose={handleCloseWindow} />
                )}
                {openWindow === "nissestats" && (
                  <NisseStats
                    onClose={handleCloseWindow}
                    currentDay={getCurrentDay()}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Grand Finale Modal */}
      {showGrandFinale && (
        <GrandFinaleModal onClose={() => setShowGrandFinale(false)} />
      )}
    </CRTFrame>
  );
}

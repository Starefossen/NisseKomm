'use client';

import { useState, useEffect } from 'react';
import { CRTFrame } from '@/components/ui/CRTFrame';
import { BootSequence } from '@/components/ui/BootSequence';
import { PasswordPrompt } from '@/components/ui/PasswordPrompt';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useSounds } from '@/lib/sounds';
import { StorageManager } from '@/lib/storage';
import { DesktopIcon } from '@/components/ui/DesktopIcon';
import { SystemStatus } from '@/components/modules/SystemStatus';
import { VarselKonsoll } from '@/components/modules/VarselKonsoll';
import { PixelKart } from '@/components/modules/PixelKart';
import { NisseMail } from '@/components/windows/NisseMail';
import { KodeTerminal } from '@/components/windows/KodeTerminal';
import { NisseNetUtforsker } from '@/components/windows/NisseNetUtforsker';
import { Kalender } from '@/components/windows/Kalender';
import innholdData from '@/data/innhold.json';
import { Innhold } from '@/types/innhold';

const innhold = innholdData as Innhold;

export default function Home() {
  const [bootComplete, setBootComplete] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [openWindow, setOpenWindow] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { playSound, playJingle } = useSounds();

  const bootPassword = process.env.NEXT_PUBLIC_BOOT_PASSWORD || 'NISSEKODE2025';
  const bootDuration = parseInt(process.env.NEXT_PUBLIC_BOOT_ANIMATION_DURATION || '2');
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

  // Check authentication from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (StorageManager.isAuthenticated()) {
        setAuthenticated(true);
        setBootComplete(true);
      }
      // Update unread count
      setUnreadCount(getUnreadEmailCount());
    }
  }, []);

  // Date validation for production mode
  const isDateValid = () => {
    if (testMode) return true;

    const now = new Date();
    const month = now.getMonth() + 1; // 1-based
    const day = now.getDate();

    return month === 12 && day >= 1 && day <= 24;
  };

  const handleBootComplete = () => {
    setBootComplete(true);
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    StorageManager.setAuthenticated(true);
    playSound('success');
    // Play jingle after a short delay
    setTimeout(() => playJingle(), 500);
  };

  const handleIconClick = (windowId: string) => {
    if (openWindow === windowId) {
      setOpenWindow(null);
      playSound('close');
    } else {
      setOpenWindow(windowId);
      setSelectedDay(null);
      playSound('open');
    }
  };

  const handleCloseWindow = () => {
    setOpenWindow(null);
    setSelectedDay(null);
    playSound('close');
    // Refresh unread count when closing NisseMail
    if (typeof window !== 'undefined') {
      setUnreadCount(getUnreadEmailCount());
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setOpenWindow('nissemail');
  };

  const getCurrentDay = () => {
    return new Date().getDate();
  };

  const getUnreadEmailCount = () => {
    if (typeof window === 'undefined') return 0;
    const currentDay = getCurrentDay();
    return StorageManager.getUnreadEmailCount(currentDay, innhold.oppdrag.length);
  };

  const getCurrentMission = () => {
    const day = selectedDay || getCurrentDay();
    return innhold.oppdrag.find(m => m.dag === day) || innhold.oppdrag[0];
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
        <PasswordPrompt onSuccess={handleAuthSuccess} expectedPassword={bootPassword} />
      )}

      {/* Main application */}
      {bootComplete && authenticated && (
        <div className="flex h-full">
          {/* Sidebar - 25% */}
          <div className="w-1/4 p-4 flex flex-col gap-4 border-r-4 border-(--neon-green)/30 overflow-hidden">
            <SystemStatus metrics={innhold.systemMetrikker} />
            <VarselKonsoll alerts={innhold.varsler} />
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
                    onClick={() => handleIconClick('nissemail')}
                  />
                  <DesktopIcon
                    icon="code"
                    label="KODETERMINAL"
                    color="blue"
                    onClick={() => handleIconClick('kodeterminal')}
                  />
                  <DesktopIcon
                    icon="folder"
                    label="NISSENET"
                    color="green"
                    onClick={() => handleIconClick('nissenet')}
                  />
                  <DesktopIcon
                    icon="calendar"
                    label="KALENDER"
                    color="gold"
                    onClick={() => handleIconClick('kalender')}
                  />
                  <DesktopIcon
                    icon="lock"
                    label="LÅST"
                    color="gray"
                    disabled
                    onClick={() => { }}
                  />
                  <DesktopIcon
                    icon="lock"
                    label="LÅST"
                    color="gray"
                    disabled
                    onClick={() => { }}
                  />
                </div>
              </div>
            ) : (
              // Active window
              <>
                {openWindow === 'nissemail' && (
                  <NisseMail
                    missions={innhold.oppdrag}
                    currentDay={getCurrentDay()}
                    initialDay={selectedDay}
                    onClose={handleCloseWindow}
                    onOpenKodeTerminal={() => handleIconClick('kodeterminal')}
                  />
                )}
                {openWindow === 'kodeterminal' && (
                  <KodeTerminal
                    onClose={handleCloseWindow}
                    expectedCode={getCurrentMission().kode}
                    currentDay={selectedDay || getCurrentDay()}
                    allMissions={innhold.oppdrag}
                  />
                )}
                {openWindow === 'nissenet' && (
                  <NisseNetUtforsker
                    files={innhold.filer}
                    missions={innhold.oppdrag}
                    currentDay={getCurrentDay()}
                    onClose={handleCloseWindow}
                  />
                )}
                {openWindow === 'kalender' && (
                  <Kalender
                    missions={innhold.oppdrag}
                    onClose={handleCloseWindow}
                    onSelectDay={handleSelectDay}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </CRTFrame>
  );
}

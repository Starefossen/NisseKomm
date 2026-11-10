"use client";

import { useState, useCallback, useMemo } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { Oppdrag, CalendarEvent } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";

/**
 * Email types for inbox display
 */
type EmailType = "main" | "side-quest";

interface Email {
  type: EmailType;
  mission: Oppdrag;
  day: number;
}

interface NisseMailProps {
  missions: Oppdrag[];
  customCalendarEvents?: CalendarEvent[];
  onClose: () => void;
  onOpenKodeTerminal: (day: number) => void;
  currentDay: number;
  initialDay?: number | null;
}

export function NisseMail({
  missions,
  customCalendarEvents = [],
  onClose,
  onOpenKodeTerminal,
  currentDay,
  initialDay,
}: NisseMailProps) {
  const [viewedEmails, setViewedEmails] = useState<Set<number>>(() => {
    // Initialize with data from storage immediately
    if (typeof window !== "undefined") {
      const state = GameEngine.loadGameState();
      return state.viewedMainEmails;
    }
    return new Set();
  });

  const [viewedBonusOppdrag, setViewedBonusOppdrag] = useState<Set<number>>(
    () => {
      if (typeof window !== "undefined") {
        const state = GameEngine.loadGameState();
        return state.viewedBonusOppdragEmails;
      }
      return new Set();
    },
  );

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showInbox, setShowInbox] = useState(true);
  /**
   * Get hendelse for a specific day
   * Merges file-based mission hendelser with custom family events
   * Custom events take precedence (override file-based)
   */
  const getHendelseForDay = useCallback(
    (day: number): string | undefined => {
      // Check custom events first (take precedence)
      const customEvent = customCalendarEvents.find((e) => e.dag === day);
      if (customEvent) {
        return customEvent.hendelse;
      }

      // Fall back to file-based mission hendelse
      const mission = missions.find((m) => m.dag === day);
      return mission?.hendelse;
    },
    [customCalendarEvents, missions],
  );

  const markAsViewed = useCallback(
    (dag: number, isBonusOppdrag: boolean = false) => {
      if (isBonusOppdrag) {
        if (!viewedBonusOppdrag.has(dag)) {
          GameEngine.markEmailAsViewed(dag, true);
          const updated = new Set(viewedBonusOppdrag);
          updated.add(dag);
          setViewedBonusOppdrag(updated);
        }
      } else {
        if (!viewedEmails.has(dag)) {
          GameEngine.markEmailAsViewed(dag, false);
          const updated = new Set(viewedEmails);
          updated.add(dag);
          setViewedEmails(updated);
        }
      }
    },
    [viewedEmails, viewedBonusOppdrag],
  );

  // Calculate initial mission selection
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const initialEmail = useMemo<Email | null>(() => {
    if (missions.length === 0) return null;

    // Get completed days for side-quest check
    const gameState = GameEngine.loadGameState();
    const completedDays = gameState.completedQuests;

    // If initialDay is provided (from calendar), use that
    if (initialDay) {
      const dayMission = missions.find((m) => m.dag === initialDay);
      if (dayMission) {
        return { type: "main", mission: dayMission, day: initialDay };
      }
    }

    // Otherwise try to find today's mission
    const todayMission = missions.find((m) => m.dag === currentDay);
    if (todayMission) {
      return { type: "main", mission: todayMission, day: currentDay };
    }

    // Find first unread mission (main or side-quest)
    for (const mission of missions) {
      // Check main email
      if (!viewedEmails.has(mission.dag)) {
        return { type: "main", mission, day: mission.dag };
      }
      // Check side-quest email if main is completed and has side-quest
      if (
        mission.bonusoppdrag &&
        completedDays.has(mission.dag) &&
        !viewedBonusOppdrag.has(mission.dag)
      ) {
        return { type: "side-quest", mission, day: mission.dag };
      }
    }

    // Default to first mission
    return { type: "main", mission: missions[0], day: missions[0].dag };
  }, [missions, currentDay, initialDay, viewedEmails, viewedBonusOppdrag]);

  const [selectedMission, setSelectedMission] = useState<Oppdrag | null>(() => {
    if (initialEmail) {
      // Mark as viewed on initial render
      if (typeof window !== "undefined") {
        if (initialEmail.type === "main") {
          GameEngine.markEmailAsViewed(initialEmail.day, false);
        }
      }
      return initialEmail.mission;
    }
    return null;
  });

  const handleSelectMission = (
    mission: Oppdrag,
    emailType: EmailType = "main",
  ) => {
    SoundManager.playSound("click");

    setSelectedMission(mission);
    setSelectedEmail({ type: emailType, mission, day: mission.dag });
    markAsViewed(mission.dag, emailType === "side-quest");
    // Auto-collapse inbox on mobile after selecting email
    setShowInbox(false);
  };

  const getUnreadCount = () => {
    return GameEngine.getUnreadEmailCount(currentDay);
  };

  // Filter missions up to current day and build email list
  const availableMissions = missions.filter((m) => m.dag <= currentDay);

  // Build combined email list (main + side-quests)
  const emails: Email[] = [];

  for (const mission of availableMissions) {
    // Always add main email
    emails.push({ type: "main", mission, day: mission.dag });

    // Add side-quest email if main quest completed and has side-quest
    if (
      mission.bonusoppdrag &&
      GameEngine.isBonusOppdragAccessible(mission.dag)
    ) {
      emails.push({ type: "side-quest", mission, day: mission.dag });
    }
  }

  return (
    <RetroWindow title="NISSEMAIL" onClose={onClose}>
      <div className="flex flex-col lg:flex-row h-full gap-4 p-4 md:p-6">
        {/* Inbox List - Collapsible on mobile, left 30% on desktop */}
        <div className="w-full lg:w-[30%] lg:border-r-4 border-(--neon-green)/30 flex flex-col overflow-hidden shrink-0">
          <div className="flex flex-col h-full">
            {/* Inbox header - Clickable toggle on mobile */}
            <button
              onClick={() => {
                SoundManager.playSound("click");
                setShowInbox(!showInbox);
              }}
              className="lg:cursor-default flex items-center gap-2 pb-2 border-b-2 border-(--neon-green)/30 shrink-0 lg:pointer-events-none"
            >
              <Icons.File size={20} color="green" />
              <span className="text-xl font-bold">INNBOKS</span>
              {getUnreadCount() > 0 && (
                <span className="px-2 py-1 text-sm bg-(--christmas-red) text-white border-2 border-(--christmas-red)">
                  {getUnreadCount()} NY
                </span>
              )}
              {/* Chevron indicator for mobile */}
              <Icons.ChevronDown
                size={20}
                className="lg:hidden ml-auto"
                style={{
                  transform: showInbox ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {/* Email list - Collapsible on mobile, always visible on desktop */}
            <div
              className={`space-y-2 overflow-y-auto mt-2 pb-2 transition-all lg:flex-1 ${
                showInbox
                  ? "max-h-[40vh] lg:max-h-full"
                  : "max-h-0 lg:max-h-full"
              }`}
            >
              {[...emails].reverse().map((email, index) => {
                const isBonusOppdrag = email.type === "side-quest";
                const isUnread = isBonusOppdrag
                  ? !viewedBonusOppdrag.has(email.day)
                  : !viewedEmails.has(email.day);
                const isSelected =
                  selectedEmail?.type === email.type &&
                  selectedEmail?.day === email.day;

                const BadgeIcon = isBonusOppdrag ? Icons.Gift : null;

                return (
                  <button
                    key={`${email.day}-${email.type}-${index}`}
                    onClick={() =>
                      handleSelectMission(email.mission, email.type)
                    }
                    className={`
                      w-full text-left p-3 border-2 transition-all
                      ${
                        isBonusOppdrag
                          ? isSelected
                            ? "border-(--gold) bg-(--gold)/20"
                            : "border-(--gold)/50 hover:border-(--gold) hover:bg-black/30"
                          : isSelected
                            ? "border-(--neon-green) bg-(--neon-green)/20"
                            : "border-(--neon-green)/30 hover:border-(--neon-green) hover:bg-black/30"
                      }
                      ${isUnread ? "font-bold" : "opacity-70"}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <div className="w-2 h-2 mt-2 bg-(--christmas-red) rounded-full shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm flex items-center gap-1 ${isUnread ? (isBonusOppdrag ? "text-(--gold)" : "text-(--gold)") : ""}`}
                        >
                          <span>
                            {isBonusOppdrag
                              ? "KRISE-VARSEL ⚠️"
                              : "RAMPENISSEN 🎅"}
                          </span>
                          {BadgeIcon && (
                            <BadgeIcon className="w-4 h-4 inline-block" />
                          )}
                        </div>
                        <div
                          className={`text-base truncate ${
                            isUnread
                              ? isBonusOppdrag
                                ? "text-(--gold)"
                                : "text-(--neon-green)"
                              : ""
                          }`}
                        >
                          {isBonusOppdrag && email.mission.bonusoppdrag
                            ? email.mission.bonusoppdrag.tittel
                            : email.mission.tittel}
                        </div>
                        <div className="text-xs opacity-50 mt-1">
                          DAG {email.day}
                          {isBonusOppdrag && " • BONUSOPPDRAG"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Content - Stacks below inbox on mobile, right 70% on desktop */}
        <div className="w-full lg:w-[70%] flex flex-col min-h-0 flex-1 overflow-hidden">
          {selectedMission && selectedEmail ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Render side-quest email */}
              {selectedEmail.type === "side-quest" &&
              selectedMission.bonusoppdrag ? (
                <>
                  {/* Bonusoppdrag Email Header */}
                  <div className="space-y-3 pb-4 border-b-4 border-(--gold) mb-4 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold tracking-wider text-(--gold)">
                          {selectedMission.bonusoppdrag.tittel}
                        </div>
                        <Icons.Gift className="w-8 h-8 text-(--gold) animate-[pulse-led_1.5s_ease-in-out_infinite]" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-(--gold)">
                        <Icons.Alert size={16} color="gold" />
                        <span>KRITISK</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">FRA:</span>
                        <span className="text-(--christmas-red) font-bold">
                          KRISE-VARSEL ⚠️
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">TIL:</span>
                        <span>NISSEHJELPER (HASTER!)</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">DATO:</span>
                        <span>DESEMBER {selectedMission.dag}, 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Bonusoppdrag Body */}
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                    {/* CRT Crisis Surveillance Feed */}
                    <div className="relative h-28 w-full overflow-hidden border-2 border-(--christmas-red) bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          selectedMission.dag === 11
                            ? "/feed/antenne-tarn.png"
                            : "/feed/iq-verksted.png"
                        }
                        alt="Krise-overvåkning"
                        className="w-full h-full object-cover contrast-125 saturate-90 opacity-85 select-none pointer-events-none"
                        style={{ objectPosition: "center 45%" }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none opacity-45"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)",
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, transparent 40%, rgba(255,0,55,0.22) 75%, rgba(0,0,0,0.92) 100%)",
                        }}
                      />
                      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest">
                        <div className="flex items-center gap-1.5 bg-black/80 px-2 py-0.5 border border-(--christmas-red)/60 text-(--christmas-red)">
                          <span className="w-2 h-2 rounded-full bg-(--christmas-red) animate-pulse" />
                          <span>
                            {selectedMission.dag === 11
                              ? "CAM 04 // ANTENNETÅRNET [KRISE]"
                              : "CAM 02 // PAKKE-SORTERER [KRISE]"}
                          </span>
                        </div>
                        <div className="bg-black/80 px-2 py-0.5 border border-(--gold)/50 text-(--gold)">
                          ALARM NIVÅ 1
                        </div>
                      </div>
                    </div>

                    {/* Crisis description */}
                    <div className="p-4 border-2 border-(--gold) bg-(--gold)/10">
                      <div className="text-lg leading-relaxed whitespace-pre-wrap text-(--gold)">
                        {selectedMission.bonusoppdrag.beskrivelse}
                      </div>
                    </div>

                    {/* Task and reward */}
                    <div className="p-4 border-2 border-(--gold) bg-black/30 space-y-2">
                      <div className="flex items-center gap-3">
                        <Icons.Gift size={20} color="gold" />
                        <span className="text-sm font-bold text-(--gold)">
                          OPPGAVE:
                        </span>
                      </div>
                      <div className="text-sm">
                        {selectedMission.bonusoppdrag.fysisk_oppgave}
                      </div>
                      {GameEngine.isBonusOppdragCompleted(selectedMission) && (
                        <div className="text-sm font-bold text-(--gold)">
                          {selectedMission.bonusoppdrag.belønning_tekst}
                        </div>
                      )}
                    </div>

                    {/* Validation instructions */}
                    {selectedMission.bonusoppdrag.validering === "forelder" ? (
                      <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Help size={16} color="blue" />
                          <span className="text-sm font-bold text-(--cold-blue)">
                            VALIDERING:
                          </span>
                        </div>
                        <div className="text-sm text-(--cold-blue)">
                          Denne krisen må løses så raskt som mulig i din
                          virkelige verden!
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-(--gold)/30 bg-(--gold)/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Help size={16} color="gold" />
                          <span className="text-sm font-bold text-(--gold)">
                            INSTRUKSJONER:
                          </span>
                        </div>
                        <div className="text-sm opacity-90">
                          Løs krisen og send inn koden i KODETERMINAL.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {(() => {
                    // Use GameEngine to check completion
                    const isCompleted =
                      GameEngine.isBonusOppdragCompleted(selectedMission);

                    if (
                      selectedMission.bonusoppdrag?.validering === "forelder"
                    ) {
                      return (
                        <div className="mt-4 pt-4 border-t-4 border-(--gold) shrink-0">
                          <button
                            disabled
                            className={`w-full px-6 py-3 text-xl tracking-wider font-bold border-4 flex items-center justify-center gap-3 ${
                              isCompleted
                                ? "bg-(--neon-green) border-(--neon-green) text-black opacity-100 cursor-default"
                                : "bg-(--gray) border-(--gray) text-black opacity-50 cursor-not-allowed"
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <Icons.CheckCircle size={24} color="green" />
                                <span>FULLFØRT</span>
                              </>
                            ) : (
                              <>
                                <Icons.Lock size={24} color="gray" />
                                <span>VENTER PÅ VERIFIKASJON</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-4 pt-4 border-t-4 border-(--gold) shrink-0">
                        <button
                          onClick={() => {
                            SoundManager.playSound("click");
                            onOpenKodeTerminal(selectedMission.dag);
                          }}
                          className="w-full px-6 py-3 bg-(--gold) text-black text-xl tracking-wider font-bold border-4 border-(--gold) hover:bg-transparent hover:text-(--gold) transition-colors flex items-center justify-center gap-3"
                        >
                          <Icons.Code size={24} color="gold" />
                          <span>ÅPNE KODETERMINAL</span>
                        </button>
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* Regular mission email */
                <>
                  {/* Email Header */}
                  <div className="space-y-3 pb-4 border-b-4 border-(--neon-green)/30 mb-4 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold tracking-wider">
                        {selectedMission.tittel}
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Icons.Calendar size={16} color="green" />
                        <span>DAG {selectedMission.dag}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">FRA:</span>
                        <span className="text-(--gold)">RAMPENISSEN 🎅</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">TIL:</span>
                        <span>NISSEHJELPER</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">DATO:</span>
                        <span>DESEMBER {selectedMission.dag}, 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Email Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                    {/* Mission description */}
                    <div className="p-4 border-2 border-(--neon-green)/50 bg-black/30">
                      <div className="text-lg leading-relaxed whitespace-pre-wrap">
                        {selectedMission.nissemail_tekst}
                      </div>
                    </div>

                    {/* Public event if exists (merged: custom events override file-based) */}
                    {(() => {
                      const hendelse = getHendelseForDay(selectedMission.dag);
                      if (!hendelse) return null;
                      return (
                        <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Icons.Alert size={20} color="blue" />
                            <span className="text-sm font-bold text-(--cold-blue)">
                              DETTE SKJER I DAG
                            </span>
                          </div>
                          <div className="text-sm text-(--cold-blue)">
                            {hendelse}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mission instructions */}
                    <div className="p-4 border-2 border-(--gold)/30 bg-(--gold)/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Icons.Help size={16} color="gold" />
                        <span className="text-sm font-bold text-(--gold)">
                          INSTRUKSJONER:
                        </span>
                      </div>
                      <div className="text-sm opacity-90">
                        Når du har løst oppdraget og funnet koden, klikk på
                        knappen under for å sende inn svaret i KODETERMINAL.
                      </div>
                    </div>
                  </div>

                  {/* Open KODETERMINAL button */}
                  <div className="mt-4 pt-4 border-t-4 border-(--neon-green)/30 shrink-0">
                    <button
                      onClick={() => {
                        SoundManager.playSound("click");
                        onOpenKodeTerminal(selectedMission.dag);
                      }}
                      className="w-full px-6 py-3 bg-(--cold-blue) text-black text-xl tracking-wider font-bold border-4 border-(--cold-blue) hover:bg-transparent hover:text-(--cold-blue) transition-colors flex items-center justify-center gap-3"
                    >
                      <Icons.Code size={24} color="blue" />
                      <span>ÅPNE KODETERMINAL</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center opacity-50">
              <div>
                <Icons.File size={48} color="green" />
                <div className="mt-4">INGEN E-POST VALGT</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RetroWindow>
  );
}

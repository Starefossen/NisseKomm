"use client";

import { useState, useCallback, useMemo } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { Oppdrag } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";
import { isSideQuestAccessible } from "@/lib/oppdrag-loader";

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
  onClose: () => void;
  onOpenKodeTerminal: (day: number) => void;
  currentDay: number;
  initialDay?: number | null;
}

export function NisseMail({
  missions,
  onClose,
  onOpenKodeTerminal,
  currentDay,
  initialDay,
}: NisseMailProps) {
  const [viewedEmails, setViewedEmails] = useState<Set<number>>(() => {
    // Initialize with data from storage immediately
    if (typeof window !== "undefined") {
      return StorageManager.getViewedEmails();
    }
    return new Set();
  });

  const [viewedSideQuests, setViewedSideQuests] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      const viewed = new Set<number>();
      // Mark as viewed if badge earned
      const badges = StorageManager.getSideQuestBadges();
      badges.forEach((b) => viewed.add(b.day));
      return viewed;
    }
    return new Set();
  });

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const markAsViewed = useCallback(
    (dag: number, isSideQuest: boolean = false) => {
      if (isSideQuest) {
        if (!viewedSideQuests.has(dag)) {
          const updated = new Set(viewedSideQuests);
          updated.add(dag);
          setViewedSideQuests(updated);
        }
      } else {
        if (!viewedEmails.has(dag)) {
          StorageManager.markEmailAsViewed(dag);
          const updated = new Set(viewedEmails);
          updated.add(dag);
          setViewedEmails(updated);
        }
      }
    },
    [viewedEmails, viewedSideQuests],
  );

  // Calculate initial mission selection
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const initialEmail = useMemo<Email | null>(() => {
    if (missions.length === 0) return null;

    // Get completed days for side-quest check
    const completedDays = StorageManager.getCompletedDaysForMissions(missions);

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
        mission.sideoppdrag &&
        completedDays.has(mission.dag) &&
        !viewedSideQuests.has(mission.dag)
      ) {
        return { type: "side-quest", mission, day: mission.dag };
      }
    }

    // Default to first mission
    return { type: "main", mission: missions[0], day: missions[0].dag };
  }, [missions, currentDay, initialDay, viewedEmails, viewedSideQuests]);

  const [selectedMission, setSelectedMission] = useState<Oppdrag | null>(() => {
    if (initialEmail) {
      // Mark as viewed on initial render
      if (typeof window !== "undefined") {
        if (initialEmail.type === "main") {
          StorageManager.markEmailAsViewed(initialEmail.day);
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
  };

  const getUnreadCount = () => {
    return StorageManager.getUnreadEmailCount(currentDay, missions.length);
  };

  // Filter missions up to current day and build email list
  const availableMissions = missions.filter((m) => m.dag <= currentDay);

  // Build combined email list (main + side-quests)
  const emails: Email[] = [];
  const completedCodes = StorageManager.getSubmittedCodes().map((c) => c.kode);

  for (const mission of availableMissions) {
    // Always add main email
    emails.push({ type: "main", mission, day: mission.dag });

    // Add side-quest email if main quest completed and has side-quest
    if (
      mission.sideoppdrag &&
      isSideQuestAccessible(mission.dag, completedCodes)
    ) {
      emails.push({ type: "side-quest", mission, day: mission.dag });
    }
  }

  return (
    <RetroWindow title="NISSEMAIL" onClose={onClose}>
      <div className="flex h-full gap-4 p-6">
        {/* Inbox List - Left 30% */}
        <div className="w-[30%] border-r-4 border-(--neon-green)/30 flex flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Inbox header */}
            <div className="flex items-center gap-2 pb-2 border-b-2 border-(--neon-green)/30 shrink-0">
              <Icons.File size={20} color="green" />
              <span className="text-xl font-bold">INNBOKS</span>
              {getUnreadCount() > 0 && (
                <span className="ml-auto px-2 py-1 text-sm bg-(--christmas-red) text-white border-2 border-(--christmas-red)">
                  {getUnreadCount()} NY
                </span>
              )}
            </div>

            {/* Email list */}
            <div className="space-y-2 overflow-y-auto flex-1 mt-2 pb-2">
              {[...emails].reverse().map((email, index) => {
                const isSideQuest = email.type === "side-quest";
                const isUnread = isSideQuest
                  ? !viewedSideQuests.has(email.day)
                  : !viewedEmails.has(email.day);
                const isSelected =
                  selectedEmail?.type === email.type &&
                  selectedEmail?.day === email.day;

                // Get badge icon for side-quests
                const BadgeIcon =
                  isSideQuest && email.mission.sideoppdrag
                    ? Icons[
                        (email.mission.sideoppdrag.badge_icon
                          .charAt(0)
                          .toUpperCase() +
                          email.mission.sideoppdrag.badge_icon.slice(
                            1,
                          )) as keyof typeof Icons
                      ]
                    : null;

                return (
                  <button
                    key={`${email.day}-${email.type}-${index}`}
                    onClick={() =>
                      handleSelectMission(email.mission, email.type)
                    }
                    className={`
                      w-full text-left p-3 border-2 transition-all
                      ${
                        isSideQuest
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
                          className={`text-sm flex items-center gap-1 ${isUnread ? (isSideQuest ? "text-(--gold)" : "text-(--gold)") : ""}`}
                        >
                          <span>
                            {isSideQuest ? "KRISE-VARSEL ⚠️" : "RAMPENISSEN 🎅"}
                          </span>
                          {BadgeIcon && (
                            <BadgeIcon className="w-4 h-4 inline-block" />
                          )}
                        </div>
                        <div
                          className={`text-base truncate ${
                            isUnread
                              ? isSideQuest
                                ? "text-(--gold)"
                                : "text-(--neon-green)"
                              : ""
                          }`}
                        >
                          {isSideQuest && email.mission.sideoppdrag
                            ? email.mission.sideoppdrag.tittel
                            : email.mission.tittel}
                        </div>
                        <div className="text-xs opacity-50 mt-1">
                          DAG {email.day}
                          {isSideQuest && " • SIDEOPPDRAG"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Content - Right 70% */}
        <div className="w-[70%] flex flex-col min-h-0">
          {selectedMission && selectedEmail ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Render side-quest email */}
              {selectedEmail.type === "side-quest" &&
              selectedMission.sideoppdrag ? (
                <>
                  {/* Side-Quest Email Header */}
                  <div className="space-y-3 pb-4 border-b-4 border-(--gold) mb-4 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold tracking-wider text-(--gold)">
                          {selectedMission.sideoppdrag.tittel}
                        </div>
                        {selectedMission.sideoppdrag.badge_icon && (
                          <>
                            {(() => {
                              const iconKey =
                                selectedMission.sideoppdrag.badge_icon
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedMission.sideoppdrag.badge_icon.slice(1);
                              const BadgeIcon =
                                Icons[iconKey as keyof typeof Icons];
                              return (
                                <BadgeIcon className="w-8 h-8 text-(--gold) animate-[pulse-led_1.5s_ease-in-out_infinite]" />
                              );
                            })()}
                          </>
                        )}
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
                        <span className="opacity-70 w-16">EMNE:</span>
                        <span className="text-(--gold)">
                          {selectedMission.sideoppdrag.tittel}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">DATO:</span>
                        <span>DESEMBER {selectedMission.dag}, 2025</span>
                      </div>
                    </div>
                  </div>

                  {/* Side-Quest Body */}
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                    {/* Crisis description */}
                    <div className="p-4 border-2 border-(--gold) bg-(--gold)/10">
                      <div className="text-lg leading-relaxed whitespace-pre-wrap text-(--gold)">
                        {selectedMission.sideoppdrag.beskrivelse}
                      </div>
                    </div>

                    {/* Badge showcase */}
                    <div className="p-4 border-2 border-(--gold) bg-black/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Icons.Trophy size={20} color="gold" />
                        <span className="text-sm font-bold text-(--gold)">
                          MERKE-BELØNNING:
                        </span>
                      </div>
                      <div className="flex items-center gap-4 p-3 bg-(--gold)/5 border-2 border-(--gold)/30">
                        {selectedMission.sideoppdrag.badge_icon && (
                          <>
                            {(() => {
                              const iconKey =
                                selectedMission.sideoppdrag.badge_icon
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedMission.sideoppdrag.badge_icon.slice(1);
                              const BadgeIcon =
                                Icons[iconKey as keyof typeof Icons];
                              return (
                                <BadgeIcon className="w-12 h-12 text-(--gold)" />
                              );
                            })()}
                          </>
                        )}
                        <div>
                          <div className="text-lg font-bold text-(--gold)">
                            {selectedMission.sideoppdrag.badge_navn}
                          </div>
                          <div className="text-sm opacity-70">
                            Låses opp ved fullføring
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validation instructions */}
                    {selectedMission.sideoppdrag.validering === "forelder" ? (
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
                  {selectedMission.sideoppdrag.validering === "forelder" ? (
                    <div className="mt-4 pt-4 border-t-4 border-(--gold) shrink-0">
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-(--gray) text-black text-xl tracking-wider font-bold border-4 border-(--gray) opacity-50 cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <Icons.Lock size={24} color="gray" />
                        <span>VENTER PÅ GODKJENNING</span>
                      </button>
                    </div>
                  ) : (
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
                  )}
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
                        <span className="opacity-70 w-16">EMNE:</span>
                        <span>{selectedMission.tittel}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="opacity-70 w-16">DATO:</span>
                        <span>DESEMBER {selectedMission.dag}, 2025</span>
                      </div>
                    </div>
                  </div>

                  {/* Email Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2">
                    {/* Mission description */}
                    <div className="p-4 border-2 border-(--neon-green)/50 bg-black/30">
                      <div className="text-lg leading-relaxed whitespace-pre-wrap">
                        {selectedMission.beskrivelse}
                      </div>
                    </div>

                    {/* Public event if exists */}
                    {selectedMission.hendelse && (
                      <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Icons.Alert size={20} color="blue" />
                          <span className="text-sm font-bold text-(--cold-blue)">
                            OFFENTLIG HENDELSE
                          </span>
                        </div>
                        <div className="text-sm text-(--cold-blue)">
                          {selectedMission.hendelse}
                        </div>
                      </div>
                    )}

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

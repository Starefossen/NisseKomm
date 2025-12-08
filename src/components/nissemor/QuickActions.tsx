"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay, getCurrentMonth } from "@/lib/date-utils";
import { Icon } from "@/lib/icons";

interface QuickActionsProps {
  refreshCounter?: number;
}

export function QuickActions({ refreshCounter = 0 }: QuickActionsProps) {
  const router = useRouter();
  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();
  const isDecember = currentMonth === 12;

  const [internalRefreshKey, setInternalRefreshKey] = useState(0);

  // Listen for storage changes to auto-update
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("nissekomm-")) {
        setInternalRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Combine external refreshCounter with internal storage listener
  const effectiveRefreshKey = refreshCounter + internalRefreshKey;

  const quickStats = useMemo(() => {
    const crisisStatus = GameEngine.getCrisisStatus();
    const activeCrises = Object.values(crisisStatus).filter(
      (status) => !status,
    ).length;

    const completedDays = GameEngine.getCompletedDays();

    return {
      activeCrises,
      currentDayCompleted: completedDays.has(currentDay),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRefreshKey, currentDay]);

  const actions = [
    {
      icon: "calendar" as const,
      iconColor: "green" as const,
      label:
        isDecember && currentDay >= 1 && currentDay <= 24
          ? `Dagens oppdrag (${currentDay}. des)`
          : "Dagens oppdrag",
      description: "Se detaljer og forbered dagens oppsett",
      onClick: () => router.push("/nissemor-guide/oppdrag"),
      color:
        "border-(--neon-green) bg-(--neon-green)/5 hover:bg-(--neon-green)/10",
      disabled: !isDecember || currentDay < 1 || currentDay > 24,
    },
    {
      icon: "key" as const,
      iconColor: "blue" as const,
      label: "Skriv ut QR-kort",
      description: "Print symbolkort for skattejakt",
      onClick: () => router.push("/nissemor-guide/symboler"),
      color:
        "border-(--cold-blue) bg-(--cold-blue)/5 hover:bg-(--cold-blue)/10",
      disabled: false,
    },
    {
      icon: "alert" as const,
      iconColor:
        quickStats.activeCrises > 0 ? ("red" as const) : ("green" as const),
      label: `Aktive kriser (${quickStats.activeCrises})`,
      description: "Bonusoppdrag som trenger validering",
      onClick: () => router.push("/nissemor-guide/bonusoppdrag"),
      color:
        quickStats.activeCrises > 0
          ? "border-(--christmas-red) bg-(--christmas-red)/10 hover:bg-(--christmas-red)/20 animate-[pulse-led_2s_ease-in-out_infinite]"
          : "border-(--neon-green) bg-(--neon-green)/5 hover:bg-(--neon-green)/10",
      disabled: false,
    },
    {
      icon: "book" as const,
      iconColor: "gold" as const,
      label: `Julius' dagbok`,
      description: "Les historien som barna låser opp",
      onClick: () => router.push("/?module=dagbok"),
      color: "border-(--gold) bg-(--gold)/5 hover:bg-(--gold)/10",
      disabled: false,
    },
  ];

  return (
    <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 md:p-6">
      <h3 className="text-xl md:text-2xl font-bold text-(--neon-green) mb-2 text-center">
        HURTIGVALG
      </h3>
      <p className="text-sm text-(--neon-green)/70 text-center mb-4">
        Vanlige daglige oppgaver
      </p>

      <div className="space-y-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full border-4 ${action.color} p-3 md:p-4 font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-3">
              <Icon name={action.icon} size={28} color={action.iconColor} />
              <div className="flex-1 text-left">
                <div className="text-base md:text-lg">{action.label}</div>
                <div className="text-xs md:text-sm opacity-70 font-normal">
                  {action.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {quickStats.currentDayCompleted && isDecember && (
        <div className="mt-4 text-center text-(--gold) text-sm animate-[gold-flash_2s_ease-in-out_infinite]">
          ✓ Dagens oppdrag fullført!
        </div>
      )}
    </div>
  );
}

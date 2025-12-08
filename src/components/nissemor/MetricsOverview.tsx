"use client";

import { useMemo, useEffect, useState } from "react";
import { GameEngine } from "@/lib/game-engine";

interface MetricsOverviewProps {
  refreshCounter?: number;
}

export function MetricsOverview({ refreshCounter = 0 }: MetricsOverviewProps) {
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

  const metrics = useMemo(() => {
    const completedDays = GameEngine.getCompletedDays();
    const currentDay = new Date().getDate();
    const allMetrics = GameEngine.getGlobalProductionMetrics(
      currentDay,
      completedDays.size,
    );

    // Select 4 key metrics to display
    const keyMetricNames = [
      "GAVEPRODUKSJON",
      "NISSEKRAFT",
      "REINSDYR FLYTIMER",
      "BREVFUGL-SVERM",
    ];

    return allMetrics.filter((m) => keyMetricNames.includes(m.navn));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRefreshKey]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "kritisk":
        return "text-(--christmas-red) border-(--christmas-red)";
      case "advarsel":
        return "text-(--gold) border-(--gold)";
      default:
        return "text-(--neon-green) border-(--neon-green)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "kritisk":
        return "🚨";
      case "advarsel":
        return "⚠️";
      default:
        return "✓";
    }
  };

  return (
    <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 md:p-6">
      <h3 className="text-xl md:text-2xl font-bold text-(--neon-green) mb-4 text-center">
        📊 SYSTEMSTATUS
      </h3>

      <div className="space-y-4">
        {metrics.map((metric, idx) => {
          const percentage =
            metric.maks > 0 ? (metric.verdi / metric.maks) * 100 : 0;
          const statusColor = getStatusColor(metric.status);
          const statusIcon = getStatusIcon(metric.status);

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{statusIcon}</span>
                  <span className="font-bold text-sm md:text-base">
                    {metric.navn}
                  </span>
                </div>
                <div
                  className={`text-sm md:text-base font-bold ${statusColor.split(" ")[0]}`}
                >
                  {metric.displayType === "percentage"
                    ? `${metric.verdi}%`
                    : metric.verdi.toLocaleString("nb-NO")}
                  {metric.unit && ` ${metric.unit}`}
                </div>
              </div>

              <div
                className={`w-full bg-(--dark-crt) border-2 ${statusColor.split(" ")[1]} h-3 relative overflow-hidden`}
              >
                <div
                  className={`h-full transition-all duration-1000 ${metric.status === "kritisk"
                      ? "bg-(--christmas-red) animate-[pulse-led_2s_ease-in-out_infinite]"
                      : metric.status === "advarsel"
                        ? "bg-(--gold)"
                        : "bg-(--neon-green)"
                    }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {metric.inCrisis && metric.crisisText && (
                <div className="text-xs text-(--christmas-red) bg-(--christmas-red)/10 border border-(--christmas-red)/30 p-2">
                  {metric.crisisText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-(--neon-green)/30 text-xs text-(--neon-green)/60 text-center">
        <p>
          💡 Tips: Verdiene bygges gradvis opp mot jul. Kriser fryser enkelte
          systemer til bonusoppdrag løses.
        </p>
      </div>
    </div>
  );
}

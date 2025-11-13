"use client";

import { useState, useEffect } from "react";
import { SidebarWidget } from "../ui/SidebarWidget";
import { StatusBar } from "../ui/StatusBar";
import { LEDIndicator } from "../ui/LEDIndicator";
import { Icons } from "@/lib/icons";
import { SystemMetrikk } from "@/types/innhold";
import { GameEngine } from "@/lib/game-engine";

interface SystemStatusProps {
  currentDay?: number; // Optional: to trigger refresh on day change
}

export function SystemStatus({ currentDay }: SystemStatusProps) {
  const [dynamicMetrics, setDynamicMetrics] = useState<SystemMetrikk[]>(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getCurrentSystemMetrics();
    }
    return [];
  });
  const [criticalStatus, setCriticalStatus] = useState<{
    text: string;
    hasIssue: boolean;
  }>(() => {
    if (typeof window !== "undefined") {
      const merged = GameEngine.getCurrentSystemMetrics();
      const hasKritisk = merged.some((m) => m.status === "kritisk");
      const hasAdvarsel = merged.some((m) => m.status === "advarsel");

      if (hasKritisk) {
        const kritiskMetric = merged.find((m) => m.status === "kritisk");
        return { text: `${kritiskMetric?.navn}: KRITISK`, hasIssue: true };
      } else if (hasAdvarsel) {
        const advarselMetric = merged.find((m) => m.status === "advarsel");
        return { text: `${advarselMetric?.navn}: USTABIL`, hasIssue: true };
      }
    }
    return { text: "ALLE SYSTEMER OPERATIONAL", hasIssue: false };
  });

  useEffect(() => {
    // Refresh metrics when day changes - use requestAnimationFrame to defer setState
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const merged = GameEngine.getCurrentSystemMetrics();
        setDynamicMetrics(merged);

        const hasKritisk = merged.some((m) => m.status === "kritisk");
        const hasAdvarsel = merged.some((m) => m.status === "advarsel");

        if (hasKritisk) {
          const kritiskMetric = merged.find((m) => m.status === "kritisk");
          setCriticalStatus({
            text: `${kritiskMetric?.navn}: KRITISK`,
            hasIssue: true,
          });
        } else if (hasAdvarsel) {
          const advarselMetric = merged.find((m) => m.status === "advarsel");
          setCriticalStatus({
            text: `${advarselMetric?.navn}: USTABIL`,
            hasIssue: true,
          });
        } else {
          setCriticalStatus({
            text: "ALLE SYSTEMER OPERATIONAL",
            hasIssue: false,
          });
        }
      });
    }
  }, [currentDay]); // Only run when day changes, not on mount

  return (
    <SidebarWidget title="SYSTEMSTATUS">
      <div className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 pb-3 border-b-2 border-(--neon-green)/30">
          <LEDIndicator
            color={criticalStatus.hasIssue ? "red" : "green"}
            blinking={criticalStatus.hasIssue}
          />
          <span className="text-xs">{criticalStatus.text}</span>
          {criticalStatus.hasIssue && <Icons.Warning size={16} color="red" />}
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          {dynamicMetrics.map((metric, index) => (
            <StatusBar
              key={index}
              label={metric.navn}
              value={metric.verdi}
              max={metric.maks}
              status={metric.status}
            />
          ))}
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-(--neon-green)/30 text-xs">
          <span>ENISSEKJERNE 3.8]</span>
          <LEDIndicator color="green" blinking />
        </div>
      </div>
    </SidebarWidget>
  );
}

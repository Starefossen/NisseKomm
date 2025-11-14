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
      return GameEngine.getProgressiveMetrics(currentDay || 1);
    }
    return [];
  });

  const [previousMetrics, setPreviousMetrics] = useState<SystemMetrikk[]>([]);
  const [improvingMetrics, setImprovingMetrics] = useState<Set<string>>(
    new Set(),
  );

  const [criticalStatus, setCriticalStatus] = useState<{
    text: string;
    hasIssue: boolean;
    ledColor: "red" | "yellow" | "green";
  }>(() => {
    if (typeof window !== "undefined") {
      const merged = GameEngine.getProgressiveMetrics(currentDay || 1);
      const hasKritisk = merged.some((m) => m.status === "kritisk");
      const hasAdvarsel = merged.some((m) => m.status === "advarsel");

      if (hasKritisk) {
        const kritiskMetric = merged.find((m) => m.status === "kritisk");
        return {
          text: `${kritiskMetric?.navn}: KRITISK`,
          hasIssue: true,
          ledColor: "red",
        };
      } else if (hasAdvarsel) {
        const advarselMetric = merged.find((m) => m.status === "advarsel");
        return {
          text: `${advarselMetric?.navn}: USTABIL`,
          hasIssue: true,
          ledColor: "yellow",
        };
      }
    }
    return {
      text: "ALLE SYSTEMER OPERATIONAL",
      hasIssue: false,
      ledColor: "green",
    };
  });

  useEffect(() => {
    // Refresh metrics when day changes - use requestAnimationFrame to defer setState
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const merged = GameEngine.getProgressiveMetrics(currentDay || 1);

        // Detect improvements (>10 point increase)
        const improving = new Set<string>();
        merged.forEach((metric) => {
          const previous = previousMetrics.find((p) => p.navn === metric.navn);
          if (previous && metric.verdi - previous.verdi > 10) {
            improving.add(metric.navn);
            // Clear improving state after animation
            setTimeout(() => {
              setImprovingMetrics((prev) => {
                const next = new Set(prev);
                next.delete(metric.navn);
                return next;
              });
            }, 2000);
          }
        });
        setImprovingMetrics(improving);

        setPreviousMetrics(dynamicMetrics);
        setDynamicMetrics(merged);

        const hasKritisk = merged.some((m) => m.status === "kritisk");
        const hasAdvarsel = merged.some((m) => m.status === "advarsel");

        if (hasKritisk) {
          const kritiskMetric = merged.find((m) => m.status === "kritisk");
          setCriticalStatus({
            text: `${kritiskMetric?.navn}: KRITISK`,
            hasIssue: true,
            ledColor: "red",
          });
        } else if (hasAdvarsel) {
          const advarselMetric = merged.find((m) => m.status === "advarsel");
          setCriticalStatus({
            text: `${advarselMetric?.navn}: USTABIL`,
            hasIssue: true,
            ledColor: "yellow",
          });
        } else {
          setCriticalStatus({
            text: "ALLE SYSTEMER OPERATIONAL",
            hasIssue: false,
            ledColor: "green",
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDay]); // Only run when day changes, not on mount

  return (
    <SidebarWidget title="SYSTEMSTATUS">
      <div
        className={`space-y-4 ${criticalStatus.hasIssue && criticalStatus.ledColor === "red" ? "animate-crt-shake" : ""}`}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-2 pb-3 border-b-2 border-(--neon-green)/30">
          <LEDIndicator
            color={criticalStatus.ledColor}
            blinking={criticalStatus.hasIssue}
          />
          <span className="text-xs">{criticalStatus.text}</span>
          {criticalStatus.hasIssue && <Icons.Warning size={16} color="red" />}
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          {dynamicMetrics.map((metric, index) => (
            <div
              key={index}
              className={
                improvingMetrics.has(metric.navn) ? "animate-pulse" : ""
              }
            >
              <StatusBar
                label={metric.navn}
                value={metric.verdi}
                max={metric.maks}
                status={metric.status}
              />
            </div>
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

"use client";

import { useMemo } from "react";
import { GameEngine } from "@/lib/game-engine";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

interface ActivityFeedProps {
  refreshCounter?: number;
  maxItems?: number;
}

export function ActivityFeed({
  refreshCounter = 0,
  maxItems = 10,
}: ActivityFeedProps) {
  const activities = useMemo(() => {
    const submittedCodes = GameEngine.getSubmittedCodes();
    const completedDays = GameEngine.getCompletedDays();

    // Just use submission history for now (simplified)
    const combined: Array<{
      timestamp: Date;
      type: "code";
      day: number;
      code: string;
    }> = [];

    // Add code submissions
    submittedCodes.forEach((entry) => {
      combined.push({
        timestamp: new Date(entry.dato),
        type: "code",
        day:
          parseInt(entry.kode.match(/dag-(\d+)/)?.[1] || "0", 10) ||
          completedDays.size,
        code: entry.kode,
      });
    });

    // Sort by timestamp (newest first) and limit
    return combined
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter, maxItems]);

  if (activities.length === 0) {
    return (
      <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-6">
        <h3 className="text-xl md:text-2xl font-bold text-(--neon-green) mb-4 text-center">
          📜 AKTIVITETSLOGG
        </h3>
        <div className="text-center text-(--neon-green)/50 py-8">
          <p className="text-lg">Ingen aktivitet ennå...</p>
          <p className="text-sm mt-2">
            Når barna løser oppdrag vil fremgangen vises her!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-4 md:p-6">
      <h3 className="text-xl md:text-2xl font-bold text-(--neon-green) mb-4 text-center">
        📜 AKTIVITETSLOGG
      </h3>

      <div className="space-y-3">
        {activities.map((activity, idx) => {
          const timeAgo = formatDistanceToNow(activity.timestamp, {
            addSuffix: true,
            locale: nb,
          });

          return (
            <div
              key={idx}
              className="border-2 border-(--neon-green)/30 bg-(--dark-crt) p-3 hover:bg-(--neon-green)/5 transition-colors animate-[scale-in_0.3s_ease-out]"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0">✓</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-(--gold)">
                    Dag {activity.day} fullført!
                  </div>
                  <div className="text-sm text-(--neon-green)/80 font-mono">
                    Kode: {activity.code}
                  </div>
                  <div className="text-xs text-(--neon-green)/50 mt-1">
                    🕐 {timeAgo}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length >= maxItems && (
        <div className="mt-4 text-center">
          <div className="text-sm text-(--neon-green)/60">
            Viser de {maxItems} siste hendelsene
          </div>
        </div>
      )}
    </div>
  );
}

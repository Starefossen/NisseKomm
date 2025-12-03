"use client";

import { useState, useEffect, Suspense } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { WelcomeCard } from "@/components/nissemor/WelcomeCard";
import { StatsDashboard } from "@/components/nissemor/StatsDashboard";
import { ChristmasCountdown } from "@/components/nissemor/ChristmasCountdown";
import { QuickActions } from "@/components/nissemor/QuickActions";
import { ActivityFeed } from "@/components/nissemor/ActivityFeed";
import { MetricsOverview } from "@/components/nissemor/MetricsOverview";

function NissemorGuideContent() {
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Auto-refresh data every 30 seconds to catch child progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter((c) => c + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="hovedside" />

      {/* Page Title */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-(--gold) text-center mb-8">
          NISSEMOR-GUIDEN
        </h1>

        {/* Welcome Card */}
        <WelcomeCard />
      </div>

      {/* Christmas Countdown */}
      <div className="max-w-7xl mx-auto mb-6">
        <ChristmasCountdown />
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto mb-6">
        <StatsDashboard refreshCounter={refreshCounter} />
      </div>

      {/* Two-Column Grid: Left sidebar + Right main content */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Column: Quick Actions */}
          <div className="space-y-6">
            <QuickActions refreshCounter={refreshCounter} />
          </div>

          {/* Right Column: Metrics + Activity Feed */}
          <div className="space-y-6">
            <MetricsOverview refreshCounter={refreshCounter} />
            <ActivityFeed refreshCounter={refreshCounter} maxItems={8} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8 pt-8">
        <p>NisseKomm v1.0 - Nissemor Kontrollpanel</p>
        <p className="text-(--christmas-red) font-bold mt-1">
          🔒 Hold denna siden hemmelig fra barna!
        </p>
      </div>
    </div>
  );
}

export default function NissemorGuide() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <NissemorGuideContent />
      </GuideAuth>
    </Suspense>
  );
}

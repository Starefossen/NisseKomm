"use client";

import { Suspense } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GuideSettings } from "@/components/nissemor/GuideSettings";

function AvansertContent() {
  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="innstillinger" />
      <GuideSettings />
    </div>
  );
}

export default function AvansertPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster innstillinger...</div>
        </div>
      }
    >
      <GuideAuth>
        <AvansertContent />
      </GuideAuth>
    </Suspense>
  );
}

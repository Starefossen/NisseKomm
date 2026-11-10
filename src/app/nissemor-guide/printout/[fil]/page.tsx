"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { UTSKRIFTER } from "../filer";

// ponytail: placeholder for printouts not yet designed; each gets its own page when made
function StubContent() {
  const { fil } = useParams<{ fil: string }>();
  const kjent = (UTSKRIFTER as readonly string[]).includes(fil);
  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <GuideNavigation currentPage="printout" />
        <h1 className="text-4xl font-bold text-center">🖨️ {fil}.pdf</h1>
        <p className="text-xl text-center opacity-80">
          {kjent
            ? "Denne utskriften er ikke laget ennå. Se docs/gaater-2026.md for innholdet."
            : "Fant ingen utskrift med dette navnet."}
        </p>
      </div>
    </div>
  );
}

export default function UtskriftStub() {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <StubContent />
      </GuideAuth>
    </Suspense>
  );
}

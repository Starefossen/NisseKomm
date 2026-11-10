"use client";

import { Suspense } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { Frostrune, RuneText, RUNE_ALPHABET } from "@/components/ui/Frostrune";

/** runetavle.pdf (kids, empty) and runer-fasit.pdf (parents only), gaater-2026 meta 1. */
function RunerContent() {
  return (
    <>
      <div className="print:hidden min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <GuideNavigation />
          <h1 className="text-4xl font-bold text-center">FROSTRUNENE</h1>
          <div className="flex justify-center text-(--cold-blue)">
            <RuneText text="SNØFALLS GAMLE SKRIFT" size={22} />
          </div>
          <p className="text-lg opacity-80">
            Side 1 er runetavla med 29 tomme ruter, til ferdskriveren dag 1.
            Side 2 er fasiten. Den er bare for deg og skal aldri på brettet.
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">
            {RUNE_ALPHABET.map((l) => (
              <div
                key={l}
                className="flex flex-col items-center border-2 border-(--neon-green)/40 p-2"
              >
                <span>{l}</span>
                <Frostrune letter={l} size={22} />
              </div>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 min-h-11 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
          >
            SKRIV UT (2 SIDER)
          </button>
        </div>
      </div>

      <div className="hidden print:block text-black font-sans">
        <section className="break-after-page p-8">
          <h1 className="text-3xl font-bold text-center">RUNETAVLE</h1>
          <p className="text-center italic my-4">
            «Tegnene i hjørnet av kortene er Snøfalls gamle skrift. Ett tegn, én
            bokstav. Fyll inn når dere vet.» – IQ
          </p>
          <div className="grid grid-cols-6 gap-3">
            {RUNE_ALPHABET.map((l) => (
              <div key={l} className="border-2 border-black h-28 p-1">
                <div className="text-xl font-bold">{l}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="p-8">
          <h1 className="text-3xl font-bold text-center">
            RUNER – FASIT (BARE FOR NISSEMOR)
          </h1>
          <div className="grid grid-cols-6 gap-3 mt-6">
            {RUNE_ALPHABET.map((l) => (
              <div
                key={l}
                className="border-2 border-black h-28 flex flex-col items-center justify-center gap-1"
              >
                <div className="text-xl font-bold">{l}</div>
                <Frostrune letter={l} size={32} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function RunerPrintPage() {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <RunerContent />
      </GuideAuth>
    </Suspense>
  );
}

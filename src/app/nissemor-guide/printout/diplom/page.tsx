"use client";

import { Suspense, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";

/** Diploma «Snøfalls venn», one page per child, handed out on day 24. */
function DiplomContent() {
  const [navn] = useState<string[]>(() => {
    const lagret = GameEngine.getPlayerNames();
    return lagret.length > 0 ? lagret : ["Kristian", "Håkon", "Hanna"];
  });

  return (
    <>
      <div className="print:hidden min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <GuideNavigation />
          <h1 className="text-4xl font-bold text-center">
            🖨️ DIPLOM «SNØFALLS VENN»
          </h1>
          <p className="text-lg opacity-80">
            Ett diplom per barn ({navn.join(", ")}). Skriv ut på tykt papir og
            legg dem under treet julaften.
          </p>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 min-h-11 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
          >
            SKRIV UT ({navn.length} SIDER)
          </button>
        </div>
      </div>

      <div className="hidden print:block text-black font-serif">
        {navn.map((n) => (
          <section
            key={n}
            className="break-after-page h-screen flex flex-col items-center justify-center text-center gap-8 border-8 border-double border-black p-12"
          >
            <div className="text-2xl tracking-widest">DIPLOM</div>
            <h1 className="text-6xl font-bold">Snøfalls venn</h1>
            <div className="text-5xl italic">{n}</div>
            <p className="text-xl max-w-xl">
              Du holdt lyset tent i 24 dager og hjalp Snøfall gjennom frosten.
              Nå står du i Snøfalls historie.
            </p>
            <div className="text-xl mt-8">Julius · Julaften 2026</div>
          </section>
        ))}
      </div>
    </>
  );
}

export default function DiplomPage() {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <DiplomContent />
      </GuideAuth>
    </Suspense>
  );
}

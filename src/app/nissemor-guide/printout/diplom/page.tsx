"use client";

import { fyll } from "@/lib/navn";
import { Suspense, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import { Utskrift } from "../_print/Utskrift";

/** Diploma «Snøfalls venn», one A4 per child, handed out on day 24. */
export function Diplom() {
  const [navn] = useState<string[]>(() => {
    const lagret = GameEngine.getPlayerNames();
    return lagret.length > 0 ? lagret : ["Kristian", "Håkon", "Hanna"].map(fyll);
  });
  return (
    <Utskrift
      navn="diplom"
      papir="tykt"
      deler={[
        {
          str: "A4",
          antall: navn.length,
          forside: (i) => (
            <div className="h-full p-[10mm]">
              <div className="h-full flex flex-col items-center justify-center text-center gap-[10mm] border-[3mm] border-double border-black p-[12mm] font-serif">
                <div className="text-[8mm] tracking-[2mm]">DIPLOM</div>
                <h2 className="text-[18mm] font-bold leading-none">
                  Snøfalls venn
                </h2>
                <div className="text-[15mm] italic leading-none">{navn[i]}</div>
                <p className="text-[6mm] leading-snug max-w-[140mm]">
                  Du holdt lyset tent i 24 dager og hjalp Snøfall gjennom
                  frosten. Nå står du i Snøfalls historie.
                </p>
                <div className="text-[6mm] mt-[10mm]">
                  Julius · Julaften 2026
                </div>
              </div>
            </div>
          ),
        },
      ]}
      instruks={{
        hvor: `Julaften: ett diplom per barn (${navn.join(", ")}), under treet.`,
      }}
    />
  );
}

export default function DiplomPage() {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <div className="min-h-screen bg-(--dark-crt) p-8 print:min-h-0 print:bg-white print:p-0">
          <div className="max-w-4xl mx-auto mb-6 print:hidden">
            <GuideNavigation />
          </div>
          <Diplom />
        </div>
      </GuideAuth>
    </Suspense>
  );
}

"use client";

import { fyll } from "@/lib/navn";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import { Bare, Utskrift } from "../_print/Utskrift";
import { Frostrune } from "@/components/ui/Frostrune";
import { Iskrystall } from "@/components/ui/Iskrystall";

const HJORNER = [
  "top-[4mm] left-[4mm]",
  "top-[4mm] right-[4mm]",
  "bottom-[4mm] left-[4mm]",
  "bottom-[4mm] right-[4mm]",
];

/** Diploma «Snøfalls venn», one A4 per child, handed out on day 24. */
export function Diplom() {
  const [navn] = useState<string[]>(() => {
    const lagret = GameEngine.getPlayerNames();
    return lagret.length > 0
      ? lagret
      : ["Kristian", "Håkon", "Hanna"].map(fyll);
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
              <div className="relative h-full flex flex-col items-center justify-between text-center border-[1.2mm] border-black outline-[0.4mm] outline-black outline-offset-[1.5mm] px-[14mm] py-[16mm] font-retro leading-none">
                {HJORNER.map((h) => (
                  <span key={h} className={`absolute ${h}`}>
                    <Iskrystall size={34} />
                  </span>
                ))}
                <div className="text-[5.5mm] tracking-[1.2mm]">
                  SNØFALL · DIREKTELINJE 90,0 MHz
                </div>
                <div className="flex flex-col items-center gap-[7mm]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- print: plain img, no lazy loading */}
                  <img
                    src="/badges/trophy.svg"
                    alt=""
                    className="w-[34mm] h-[34mm] [image-rendering:pixelated]"
                  />
                  <div className="text-[9mm] tracking-[3mm]">DIPLOM</div>
                  <h2 className="text-[24mm] uppercase tracking-[1mm]">
                    Snøfalls venn
                  </h2>
                  <div className="w-full border-y-[0.6mm] border-black py-[5mm]">
                    <div className="text-[20mm] uppercase tracking-[1.5mm]">
                      {navn[i]}
                    </div>
                    <div className="mt-[3mm] flex justify-center gap-[1.5mm] text-gray-600">
                      {[...navn[i]].map((b, k) => (
                        <Frostrune key={k} letter={b} size={22} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[7mm] leading-tight max-w-[150mm]">
                    Du holdt lyset tent i 24 dager og hjalp Snøfall gjennom
                    frosten. Nå står du i Snøfalls historie.
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="font-serif italic text-[13mm] px-[14mm] pb-[1mm] border-b-[0.4mm] border-black">
                    Julius
                  </div>
                  <div className="mt-[3mm] text-[5.5mm] tracking-[1.2mm]">
                    JULAFTEN 2026
                  </div>
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

function Side() {
  const bare = !!useSearchParams().get("bare");
  if (bare)
    return (
      <Bare>
        <Diplom />
      </Bare>
    );
  return (
    <div className="min-h-screen bg-(--dark-crt) p-8 print:min-h-0 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <GuideNavigation />
      </div>
      <Diplom />
    </div>
  );
}

export default function DiplomPage() {
  return (
    <Suspense fallback={<div className="p-8">Laster ...</div>}>
      <GuideAuth>
        <Side />
      </GuideAuth>
    </Suspense>
  );
}

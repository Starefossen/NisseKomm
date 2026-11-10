"use client";

import { useEffect, useState } from "react";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { BadgeManager } from "@/lib/badge-system";
import Image from "next/image";

interface GrandFinaleModalProps {
  onClose: () => void;
}

/**
 * Day 24 finale: thaw (tøvær), four stages. Text from app-tekster-2026.md A9.
 */
export function GrandFinaleModal({ onClose }: GrandFinaleModalProps) {
  const [stage, setStage] = useState(1);

  const playerNames = GameEngine.getPlayerNames();
  const symbols = GameEngine.getCollectedSymbols().length;
  const decryptions = GameEngine.getSolvedDecryptions().length;
  const bonus = GameEngine.getProgressionSummary().bonusOppdrag.completed;
  const badge = BadgeManager.getBadge("snofalls-venn");

  useEffect(() => {
    SoundManager.playSound("success");

    const timers = [2000, 4000, 6000].map((ms, i) =>
      setTimeout(() => setStage(i + 2), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative max-w-3xl w-full max-h-full overflow-y-auto border-8 border-(--gold) bg-(--dark-crt) p-8 animate-[scale-in_0.5s_ease-out]">
        <div className="space-y-6 text-center">
          {/* 1: Thaw */}
          <div>
            <h1 className="text-6xl font-bold text-(--gold) tracking-widest animate-[gold-flash_2s_ease-in-out_infinite]">
              TØVÆR
            </h1>
            <div className="text-xl text-(--cold-blue) mt-2">
              24. desember · Frostgrad 0 %
            </div>
          </div>

          {/* 2: The nice list */}
          {stage >= 2 && (
            <div className="animate-[scale-in_0.5s_ease-out] space-y-3">
              <div className="text-2xl text-(--neon-green)">
                JULIUS SKREV NAVNENE SELV
              </div>
              {playerNames.length > 0 && (
                <div className="text-2xl text-(--gold) border-4 border-(--gold) p-4 bg-(--gold)/10">
                  {playerNames.join(" · ")}
                </div>
              )}
              <div className="text-sm opacity-80">
                22. desember, for hånd, én gang.
              </div>
            </div>
          )}

          {/* 3: What happened */}
          {stage >= 3 && (
            <div className="animate-[scale-in_0.5s_ease-out] border-4 border-(--cold-blue) p-6 bg-(--cold-blue)/10 space-y-2 text-lg">
              <p>Linjen holdt. 24 dager.</p>
              <p>Isen sukket, og dere hørte det.</p>
              <p>Muren holder. Porten står åpen.</p>
              <p>
                Sleden fløy over grotten med alle lysene på. Noe blått fløy opp
                og møtte den.
              </p>
              <p className="text-base opacity-70 pt-2">
                {symbols} symboler · {decryptions} dekrypteringer · {bonus}{" "}
                bonus
              </p>
            </div>
          )}

          {/* 4: The badge and goodbye */}
          {stage >= 4 && (
            <div className="animate-[fadeIn_1s_ease-out] space-y-4">
              {badge && (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={`/badges/${badge.ikon}`}
                    alt={badge.navn}
                    width={96}
                    height={96}
                  />
                  <div className="text-3xl font-bold text-(--gold) tracking-wider">
                    {badge.navn.toUpperCase()}
                  </div>
                </div>
              )}
              <p className="text-xl">Det er ikke kaldt der nede lenger.</p>
              <p className="text-xl">
                Under treet ligger noe fra Vintervokteren. Det smelter ikke.
              </p>
              <p className="text-sm opacity-70">
                Diplom: Nissemor-guiden → Utskrifter
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-8 py-4 min-h-11 bg-(--gold) border-4 border-(--gold) text-black font-bold text-2xl hover:opacity-80"
              >
                GOD JUL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

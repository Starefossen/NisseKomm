"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface GrandFinaleModalProps {
  onClose: () => void;
}

export function GrandFinaleModal({ onClose }: GrandFinaleModalProps) {
  const [stage, setStage] = useState(1);
  const playerNames =
    process.env.NEXT_PUBLIC_PLAYER_NAMES || "Georg,Viljar,Marcus,Amund";
  const names = playerNames
    .split(",")
    .map((n) => n.trim())
    .join(", ");

  useEffect(() => {
    // Play celebration sound
    SoundManager.playSound("success");

    // Stage progression
    const timer1 = setTimeout(() => setStage(2), 2000);
    const timer2 = setTimeout(() => setStage(3), 4000);
    const timer3 = setTimeout(() => setStage(4), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative max-w-3xl w-full border-8 border-(--gold) bg-(--dark-crt) p-8 animate-[scale-in_0.5s_ease-out]">
        {/* Animated corner decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-(--gold) animate-[pulse-led_1s_ease-in-out_infinite]" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-(--gold) animate-[pulse-led_1s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-(--gold) animate-[pulse-led_1s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-(--gold) animate-[pulse-led_1s_ease-in-out_infinite]" />

        {/* Content */}
        <div className="space-y-6 text-center">
          {/* Stage 1: Initial celebration */}
          <div
            className={`transition-opacity duration-1000 ${stage >= 1 ? "opacity-100" : "opacity-0"}`}
          >
            <div className="text-6xl mb-4 animate-[gold-flash_1s_ease-in-out_infinite]">
              🎄
            </div>
            <h1 className="text-5xl font-bold text-(--gold) tracking-wider mb-4 animate-[gold-flash_1s_ease-in-out_infinite]">
              JULAFTEN BERGET!
            </h1>
          </div>

          {/* Stage 2: Nice List confirmation */}
          {stage >= 2 && (
            <div className="animate-[scale-in_0.5s_ease-out] space-y-4">
              <div className="text-3xl text-(--neon-green)">
                ⭐ OFFISIELT PÅ SNILL-LISTEN ⭐
              </div>
              <div className="text-xl text-(--cold-blue) border-4 border-(--cold-blue) p-4 bg-(--cold-blue)/10">
                {names}
              </div>
            </div>
          )}

          {/* Stage 3: Achievement unlocked */}
          {stage >= 3 && (
            <div className="animate-[scale-in_0.5s_ease-out] space-y-3 border-4 border-(--christmas-red) p-6 bg-(--christmas-red)/10">
              <div className="text-2xl text-(--christmas-red) font-bold">
                🏆 ACHIEVEMENT UNLOCKED 🏆
              </div>
              <div className="text-lg text-(--neon-green)">
                ✓ 24/24 Oppdrag fullført
                <br />
                ✓ Alle moduler låst opp
                <br />
                ✓ Nordpolen reddet
                <br />✓ Julenissen imponert
              </div>
            </div>
          )}

          {/* Stage 4: Brainrot finale + stats */}
          {stage >= 4 && (
            <div className="animate-[scale-in_0.5s_ease-out] space-y-4">
              <div className="text-2xl text-(--gold) border-4 border-(--gold) p-4 bg-(--gold)/10">
                <div className="mb-2">💾 GYATT Storage Unlocked</div>
                <div className="mb-2">🎮 Christmas Buff +100</div>
                <div className="mb-2">✨ Sigma Level: MAX</div>
                <div className="text-lg italic">
                  &quot;Julenissen approved fr fr no cap&quot; 💯
                </div>
              </div>

              <div className="text-lg text-(--neon-green)/70 space-y-2">
                <p>Nordpol TV viser Julenissen som vinker</p>
                <p>med navnene deres på tavla bak ham!</p>
                <p className="text-(--gold) font-bold">
                  100% Gaveproduksjon oppnådd! 🎁
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="mt-6 px-8 py-4 bg-(--gold) border-4 border-(--gold) text-(--dark-crt) font-bold text-2xl hover:opacity-80 flex items-center gap-3 mx-auto"
              >
                <Icons.CheckCircle size={32} color="green" />
                FULLFØR JULEKALENDER
              </button>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 text-4xl animate-[pulse_2s_ease-in-out_infinite]">
          ⭐
        </div>
        <div className="absolute -top-2 -right-2 text-4xl animate-[pulse_2s_ease-in-out_infinite_0.5s]">
          ⭐
        </div>
        <div className="absolute -bottom-2 -left-2 text-4xl animate-[pulse_2s_ease-in-out_infinite_1s]">
          🎁
        </div>
        <div className="absolute -bottom-2 -right-2 text-4xl animate-[pulse_2s_ease-in-out_infinite_1.5s]">
          🎁
        </div>
      </div>
    </div>
  );
}

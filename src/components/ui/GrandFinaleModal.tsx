"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { StorageManager } from "@/lib/storage";
import { getEventyr } from "@/lib/eventyr";
import { BadgeManager } from "@/lib/badge-system";
import Image from "next/image";

interface GrandFinaleModalProps {
  onClose: () => void;
}

export function GrandFinaleModal({ onClose }: GrandFinaleModalProps) {
  const [stage, setStage] = useState(1);

  // Get player names from storage
  const playerNames = StorageManager.getPlayerNames();
  const names =
    playerNames.length > 0 ? playerNames.join(", ") : "Kristian, Håkon, Hanna";

  // Calculate game statistics
  const completedEventyr = GameEngine.getCompletedEventyr();
  const totalEventyr = GameEngine.getTotalEventyr();
  const solvedDecryptions = StorageManager.getSolvedDecryptions();
  const collectedSymbols = StorageManager.getCollectedSymbols();

  // Get trophy badge
  const trophyBadge = BadgeManager.getBadge("julekalender-fullfort");

  // Generate eventyr completion messages dynamically from eventyr.json
  const eventyrMessages = completedEventyr
    .map((eventyrId) => {
      const eventyr = getEventyr(eventyrId);
      if (!eventyr) return null;

      // Rotate through player names for personalization
      const nameIndex =
        completedEventyr.indexOf(eventyrId) % Math.max(playerNames.length, 1);
      const playerName = playerNames[nameIndex] || "Barna";

      return {
        id: eventyrId,
        icon:
          eventyr.ikon === "alert"
            ? "🌑"
            : eventyr.ikon === "zap"
              ? "⚙️"
              : eventyr.ikon === "mail"
                ? "🕊️"
                : eventyr.ikon === "pin"
                  ? "❄️"
                  : eventyr.ikon === "eye"
                    ? "🌈"
                    : "✨",
        message: `${eventyr.navn} fullført! ${playerName} gjorde en fantastisk jobb!`,
      };
    })
    .filter(Boolean);

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

          {/* Stage 3: Achievement unlocked + Eventy completions */}
          {stage >= 3 && (
            <div className="animate-[scale-in_0.5s_ease-out] space-y-4">
              {/* Main achievements */}
              <div className="border-4 border-(--christmas-red) p-6 bg-(--christmas-red)/10 space-y-3">
                <div className="text-2xl text-(--christmas-red) font-bold">
                  🏆 ACHIEVEMENT UNLOCKED 🏆
                </div>
                <div className="text-lg text-(--neon-green)">
                  ✓ 24/24 Oppdrag fullført
                  <br />
                  ✓ Alle moduler låst opp
                  <br />
                  ✓ Snøfall reddet
                  <br />✓ Julius imponert
                </div>
              </div>

              {/* Eventy completions */}
              {eventyrMessages.length > 0 && (
                <div className="border-4 border-(--cold-blue) p-4 bg-(--cold-blue)/10 space-y-2">
                  <div className="text-xl text-(--cold-blue) font-bold">
                    📖 HISTORIER FULLFØRT ({completedEventyr.length}/
                    {totalEventyr})
                  </div>
                  <div className="text-sm text-(--neon-green) space-y-1">
                    {eventyrMessages.map((arc) => (
                      <div key={arc?.id}>
                        {arc?.icon} {arc?.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decryption & Symbol stats */}
              {(solvedDecryptions.length > 0 ||
                collectedSymbols.length > 0) && (
                <div className="border-4 border-(--gold) p-4 bg-(--gold)/10 space-y-2">
                  <div className="text-xl text-(--gold) font-bold">
                    🔐 DEKRYPTERING & SYMBOLER
                  </div>
                  <div className="text-sm text-black space-y-1">
                    {collectedSymbols.length > 0 && (
                      <div>✓ {collectedSymbols.length} symboler samlet</div>
                    )}
                    {solvedDecryptions.length > 0 && (
                      <div>✓ {solvedDecryptions.length} koder dekryptert</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 4: Trophy reveal + Brainrot finale + stats */}
          {stage >= 4 && (
            <div className="animate-[fadeIn_1s_ease-out] space-y-6">
              {/* Trophy Badge - Dramatic Reveal */}
              {trophyBadge && (
                <div className="border-8 border-(--gold) p-6 bg-(--dark-crt) shadow-[0_0_50px_rgba(255,215,0,0.8)] animate-[pulse-led_2s_ease-in-out_infinite]">
                  <div className="flex flex-col items-center gap-4">
                    <Image
                      src="/badges/trophy.svg"
                      alt="Trophy"
                      width={96}
                      height={96}
                      className="animate-[pulse_2s_ease-in-out_infinite]"
                    />
                    <div className="text-4xl font-bold text-(--gold) tracking-wider">
                      🏆 JULEKALENDER-MESTER 🏆
                    </div>
                    <div className="text-xl text-(--gold) border-t-4 border-b-4 border-(--gold)/50 py-3">
                      {names}
                    </div>
                    <div className="text-sm text-(--neon-green) max-w-md text-center">
                      {trophyBadge.beskrivelse}
                    </div>
                  </div>
                </div>
              )}

              {/* Nice List Hint */}
              <div className="border-4 border-(--cold-blue) p-4 bg-(--cold-blue)/10 space-y-2">
                <div className="text-xl text-(--cold-blue) font-bold flex items-center justify-center gap-2">
                  <Icons.Mail size={24} color="blue" />
                  Julius sin personlige melding venter!
                </div>
                <div className="text-sm text-(--neon-green)">
                  NISSENET → HEMMELIGHETER → 🔴 snill_slem_liste.txt
                </div>
                <div className="text-xs opacity-70">
                  &quot;For å lese min siste hilsen...&quot; - Julius
                </div>
              </div>

              {/* Brainrot stats */}
              <div className="text-2xl text-(--gold) border-4 border-(--gold) p-4 bg-(--gold)/10">
                <div className="mb-2">💾 GYATT Storage Unlocked</div>
                <div className="mb-2">🎮 Christmas Buff +100</div>
                <div className="mb-2">✨ Sigma Level: MAX</div>
                <div className="text-lg italic">
                  &quot;Julius approved fr fr no cap&quot; 💯
                </div>
              </div>

              <div className="text-lg text-(--neon-green)/70 space-y-2">
                <p>Snøfall TV viser Julius som vinker</p>
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

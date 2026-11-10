"use client";

import { Iskrystall } from "@/components/ui/Iskrystall";
import { RetroWindow } from "../ui/RetroWindow";
import { Frostrune, RUNE_ALPHABET } from "../ui/Frostrune";
import { GameEngine } from "@/lib/game-engine";

export function RuneTavle({ onClose }: { onClose: () => void }) {
  const learned = GameEngine.getLearnedRunes();
  const taught = GameEngine.getLearnedRunes(24);

  return (
    <RetroWindow title="RUNETAVLE" onClose={onClose}>
      <div className="p-6 space-y-6 h-full overflow-auto">
        <p className="text-lg text-(--cold-blue)">
          «Tegnene i hjørnet av kortene er Snøfalls gamle skrift. Ett tegn, én
          bokstav. Fyll inn når dere vet.» – IQ
        </p>
        <div className="text-base opacity-70">
          {learned.size} AV {taught.size} TEGN LÆRT
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {RUNE_ALPHABET.map((letter) => {
            const isTaught = taught.has(letter);
            if (!isTaught) {
              return (
                <div
                  key={letter}
                  className="flex flex-col items-center justify-center p-2 border-2 min-h-24 border-(--neon-green)/20 text-(--neon-green)/30"
                >
                  <span className="text-2xl opacity-30 select-none">?</span>
                </div>
              );
            }
            const known = learned.has(letter);
            return (
              <div
                key={letter}
                className={`flex flex-col items-center gap-1 p-2 border-2 min-h-24 ${
                  known
                    ? "border-(--cold-blue) text-(--cold-blue)"
                    : "border-(--neon-green)/30 text-(--neon-green)/40"
                }`}
              >
                <span className="text-xl">{letter}</span>
                {known ? (
                  <Frostrune letter={letter} size={24} />
                ) : (
                  <Iskrystall size={24} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </RetroWindow>
  );
}

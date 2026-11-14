"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface NameEntryModalProps {
  onComplete: (names: string[]) => void;
}

export function NameEntryModal({ onComplete }: NameEntryModalProps) {
  const [names, setNames] = useState<string[]>(["Kristian", "Håkon", "Hanna"]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleNext = () => {
    if (currentIndex < names.length - 1 && names[currentIndex].trim()) {
      SoundManager.playSound("click");
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    // Filter out empty names
    const validNames = names.filter((n) => n.trim()).map((n) => n.trim());

    if (validNames.length > 0) {
      SoundManager.playSound("success");
      onComplete(validNames);
    }
  };

  const handleSkip = () => {
    SoundManager.playSound("click");
    // No placeholder name: it would end up on the finale and the diplomas.
    // Empty means the modal asks again after the next solved day.
    onComplete([]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Snill-listen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 md:p-4"
    >
      <div className="w-full max-w-2xl max-h-full overflow-y-auto border-8 border-(--gold) bg-black px-6 pt-4 space-y-3 animate-[scale-in_0.3s_ease-out]">
        {/* Header */}
        <div className="text-center space-y-1 pb-2 border-b-4 border-(--gold)/30">
          <div className="flex items-center justify-center gap-3">
            <Icons.Gift size={32} color="gold" />
            <div className="text-3xl font-bold text-(--gold) tracking-wider">
              GRATULERER!
            </div>
            <Icons.Star size={32} color="gold" />
          </div>
          <div className="text-(--neon-green) text-lg">Dag 22 er løst!</div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1 p-2 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
          <div className="text-(--cold-blue) text-base">
            Julius vil gjerne legge navnene deres øverst på den snille listen!
          </div>
          <div className="text-base opacity-70">
            Sjekk navnene, rett dem hvis noe er feil
          </div>
        </div>

        {/* Name entry fields */}
        <div className="space-y-2">
          {names.map((name, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-4 p-2 border-4 transition-all
                ${
                  index === currentIndex
                    ? "border-(--gold) bg-(--gold)/10"
                    : index < currentIndex && names[index].trim()
                      ? "border-(--neon-green) bg-(--neon-green)/10"
                      : "border-(--neon-green)/30"
                }
              `}
            >
              <div className="text-2xl font-bold text-(--gold) w-8">
                {index + 1}.
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                onFocus={(e) => {
                  setCurrentIndex(index);
                  // iPad keyboard covers the lower half; keep the field and buttons in view
                  const el = e.currentTarget;
                  setTimeout(() => el.scrollIntoView({ block: "center" }), 300);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (index < names.length - 1) {
                      handleNext();
                    } else {
                      handleSubmit();
                    }
                  }
                }}
                placeholder={`Navn ${index + 1} (valgfritt)`}
                aria-label={`Navn ${index + 1}`}
                maxLength={30}
                className="flex-1 px-4 py-3 bg-black border-2 border-(--neon-green) text-xl font-retro text-(--neon-green) focus:outline-none focus:border-(--gold) focus:shadow-[0_0_20px_rgba(255,215,0,0.5)] uppercase"
              />
              {names[index].trim() && (
                <Icons.CheckCircle size={24} color="gold" />
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 flex gap-4 bg-black py-3 border-t-2 border-(--gold)/30">
          <button
            onClick={handleSkip}
            className="flex-1 min-h-12 px-6 py-3 border-4 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue) hover:text-black font-bold tracking-wider transition-colors"
          >
            HOPP OVER
          </button>
          <button
            onClick={handleSubmit}
            disabled={!names.some((n) => n.trim())}
            className="flex-1 min-h-12 px-6 py-3 border-4 border-(--gold) bg-(--gold) text-black hover:bg-transparent hover:text-(--gold) font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            LEGG TIL SNILL-LISTEN
          </button>
        </div>
      </div>
    </div>
  );
}

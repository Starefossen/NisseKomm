"use client";

import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface NameEntryModalProps {
  onComplete: (names: string[]) => void;
}

export function NameEntryModal({ onComplete }: NameEntryModalProps) {
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleNext = () => {
    if (currentIndex < 3 && names[currentIndex].trim()) {
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
    // Use default names
    onComplete(["Georg", "Viljar", "Marcus", "Amund"]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl mx-4 border-8 border-(--gold) bg-black p-8 space-y-6 animate-[scale-in_0.3s_ease-out]">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b-4 border-(--gold)/30">
          <div className="flex items-center justify-center gap-3">
            <Icons.Gift size={32} color="gold" />
            <div className="text-3xl font-bold text-(--gold) tracking-wider">
              GRATULERER!
            </div>
            <Icons.Star size={32} color="gold" />
          </div>
          <div className="text-(--neon-green) text-lg">
            Dere har fullført alle 23 oppdrag!
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2 p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10">
          <Icons.Help size={24} color="blue" className="mx-auto" />
          <div className="text-(--cold-blue) text-sm">
            Julius vil gjerne legge navnene deres øverst på den snille listen!
          </div>
          <div className="text-xs opacity-70">
            Skriv inn navnet til hvert barn (maks 4 navn)
          </div>
        </div>

        {/* Name entry fields */}
        <div className="space-y-4">
          {names.map((name, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-4 p-4 border-4 transition-all
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
                onFocus={() => setCurrentIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (index < 3) {
                      handleNext();
                    } else {
                      handleSubmit();
                    }
                  }
                }}
                placeholder={`Navn ${index + 1} (valgfritt)`}
                maxLength={30}
                className="flex-1 px-4 py-3 bg-black border-2 border-(--neon-green) text-xl font-mono text-(--neon-green) focus:outline-none focus:border-(--gold) focus:shadow-[0_0_20px_rgba(255,215,0,0.5)] uppercase"
                autoFocus={index === 0}
              />
              {names[index].trim() && (
                <Icons.CheckCircle size={24} color="gold" />
              )}
            </div>
          ))}
        </div>

        {/* Navigation hints */}
        <div className="text-xs text-center opacity-70 space-y-1">
          <div>Trykk ENTER for å gå videre til neste felt</div>
          <div>
            Du kan hoppe over tomme felt - kun utfylte navn legges til listen
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border-4 border-(--cold-blue) text-(--cold-blue) hover:bg-(--cold-blue) hover:text-black font-bold tracking-wider transition-colors"
          >
            HOPP OVER
          </button>
          <button
            onClick={handleSubmit}
            disabled={!names.some((n) => n.trim())}
            className="flex-1 px-6 py-3 border-4 border-(--gold) bg-(--gold) text-black hover:bg-transparent hover:text-(--gold) font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            LEGG TIL SNILL-LISTEN
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs opacity-50 pt-4 border-t-2 border-(--neon-green)/30">
          Navnene lagres lokalt og vises i Julius' snille liste i NISSENET
        </div>
      </div>
    </div>
  );
}

"use client";

import { fyll } from "@/lib/navn";
import { useState } from "react";
import { Icons } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { RetroModal } from "./RetroModal";

interface NameEntryModalProps {
  onComplete: (names: string[]) => void;
}

export function NameEntryModal({ onComplete }: NameEntryModalProps) {
  const [names, setNames] = useState<string[]>(() =>
    ["Kristian", "Håkon", "Hanna"].map(fyll),
  );
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
    <RetroModal title="SNILL-LISTEN" onClose={handleSkip} gull>
      <div className="space-y-3">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Icons.Gift size={32} color="gold" />
            <div className="text-4xl leading-none text-(--gold) tracking-widest [text-shadow:0_0_24px_color-mix(in_oklab,var(--gold)_60%,transparent)]">
              GRATULERER!
            </div>
            <Icons.Gift size={32} color="gold" />
          </div>
          <div className="text-lg">Dag 22 er løst!</div>
        </div>

        {/* Instructions */}
        <div className="text-center px-4 py-2 border-2 border-(--brass) bg-(--crt-bg)">
          <div className="text-(--cold-blue) text-lg">
            Julius vil gjerne legge navnene deres øverst på den snille listen!
          </div>
          <div className="text-base opacity-80">
            Sjekk navnene, rett dem hvis noe er feil
          </div>
        </div>

        {/* Name entry fields */}
        <div className="space-y-2">
          {names.map((name, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-3 py-2 border-2 transition-colors ${
                index === currentIndex
                  ? "border-(--gold) bg-(--gold)/10"
                  : "border-(--brass)/50"
              }`}
            >
              <div className="text-2xl text-(--gold) w-7">{index + 1}.</div>
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
                className="flex-1 min-w-0 min-h-12 px-4 bg-(--crt-bg) border-2 border-(--brass) text-2xl tracking-wider font-retro text-(--neon-green) focus:outline-none focus:border-(--gold) focus:shadow-[0_0_16px_color-mix(in_oklab,var(--gold)_50%,transparent)] uppercase"
              />
              <span className={names[index].trim() ? "" : "invisible"}>
                <Icons.CheckCircle size={24} color="gold" />
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons: stay in view above the iPad keyboard */}
        <div className="sticky -bottom-4 md:-bottom-6 -mx-4 md:-mx-6 -mb-4! md:-mb-6! px-4 md:px-6 py-3 flex flex-col-reverse sm:flex-row gap-3 bg-(--dark-crt) border-t-2 border-(--brass)">
          <button
            onClick={handleSkip}
            className="flex-1 min-h-12 px-6 border-2 border-(--brass) text-xl tracking-wider hover:bg-(--brass)/30 transition-colors"
          >
            HOPP OVER
          </button>
          <button
            onClick={handleSubmit}
            disabled={!names.some((n) => n.trim())}
            className="flex-1 min-h-12 px-6 border-2 border-(--gold) bg-(--gold) text-black hover:bg-transparent hover:text-(--gold) font-bold text-xl tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            LEGG TIL SNILL-LISTEN
          </button>
        </div>
      </div>
    </RetroModal>
  );
}

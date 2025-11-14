"use client";

import { useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { StorageManager } from "@/lib/storage";

interface Letter {
  day: number;
  content: string;
}

interface BrevfuglerProps {
  onClose: () => void;
}

export function Brevfugler({ onClose }: BrevfuglerProps) {
  const [letters] = useState<Letter[]>(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getSantaLetters();
    }
    return [];
  });
  const [selectedLetter, setSelectedLetter] = useState<number | null>(null);
  const [status] = useState<"pending" | "processed">(() => {
    if (typeof window !== "undefined") {
      const completedCodes = StorageManager.getSubmittedCodes();
      return completedCodes.length >= 14 ? "processed" : "pending";
    }
    return "pending";
  });

  const selectedLetterData = selectedLetter
    ? letters.find((l) => l.day === selectedLetter)
    : null;

  return (
    <RetroWindow title="BREVFUGLER - DIREKTEPOST FRA JULIUS" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Mail size={32} color="gold" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              PERSONLIGE MELDINGER
            </div>
            <div className="text-sm opacity-70">BREV FRA SNØFALL TIL DEG</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 14
            </span>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`p-4 border-2 ${
            status === "processed"
              ? "border-(--neon-green) bg-(--neon-green)/10"
              : "border-(--gold) bg-(--gold)/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {status === "processed" ? (
              <>
                <Icons.CheckCircle size={24} color="green" />
                <div>
                  <div className="text-sm font-bold text-(--neon-green)">
                    ✓ BEHANDLET
                  </div>
                  <div className="text-xs text-(--neon-green)/70">
                    Alle brev er klare til visning
                  </div>
                </div>
              </>
            ) : (
              <>
                <Icons.Alert size={24} color="gold" />
                <div>
                  <div className="text-sm font-bold text-(--gold)">
                    UNDER BEHANDLING...
                  </div>
                  <div className="text-xs text-(--gold)/70">
                    Julius skriver fortsatt brev
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {letters.length === 0 ? (
          // No letters yet
          <div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-(--neon-green)/30">
            <Icons.Mail size={48} color="gray" />
            <div className="text-center space-y-2">
              <div className="text-lg text-(--neon-green)">Ingen brev ennå</div>
              <div className="text-sm text-(--neon-green)/70 max-w-md">
                Julius vil sende personlige brev til dere etter hvert som dere
                løser oppdrag. Hold utkikk!
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Letter List */}
            <div className="col-span-1 space-y-2">
              <div className="text-sm text-(--neon-green)/70 mb-2">
                INNBOKS ({letters.length})
              </div>
              {letters.map((letter) => (
                <button
                  key={letter.day}
                  onClick={() => setSelectedLetter(letter.day)}
                  className={`
                    w-full p-3 text-left border-2 transition-all
                    ${
                      selectedLetter === letter.day
                        ? "border-(--gold) bg-(--gold)/20"
                        : "border-(--neon-green)/30 hover:border-(--neon-green) hover:bg-(--neon-green)/10"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icons.Mail size={16} color="gold" />
                    <div className="text-sm font-bold text-(--gold)">
                      DAG {letter.day}
                    </div>
                  </div>
                  <div className="text-xs text-(--neon-green)/70 mt-1">
                    Fra: Julius
                  </div>
                </button>
              ))}
            </div>

            {/* Letter Content */}
            <div className="col-span-2">
              {selectedLetterData ? (
                <div className="border-2 border-(--gold) p-6 space-y-4">
                  {/* Letter Header */}
                  <div className="pb-4 border-b-2 border-(--gold)/30">
                    <div className="text-xs text-(--gold)/70">FRA:</div>
                    <div className="text-lg font-bold text-(--gold)">
                      🎅 Julius, Snøfall
                    </div>
                    <div className="text-xs text-(--gold)/70 mt-2">
                      DAG {selectedLetterData.day}
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="text-sm text-(--neon-green) leading-relaxed whitespace-pre-wrap">
                    {selectedLetterData.content}
                  </div>

                  {/* Letter Footer */}
                  <div className="pt-4 border-t-2 border-(--gold)/30">
                    <div className="text-xs text-(--gold)/70">
                      Med vennlig hilsen,
                    </div>
                    <div className="text-sm text-(--gold) font-bold mt-1">
                      Julius 🎄
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-(--neon-green)/30">
                  <div className="text-center text-(--neon-green)/70">
                    <Icons.Mail size={48} color="gray" />
                    <div className="text-sm mt-4">Velg et brev fra listen</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="p-4 border-2 border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
          <div className="font-bold mb-1">✉️ PERSONLIGE MELDINGER</div>
          <div className="opacity-80">
            Julius sender spesielle brev til dere! Disse brevene vises her etter
            hvert som dere fullfører oppdrag.
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}

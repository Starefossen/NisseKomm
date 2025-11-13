"use client";

import { Suspense, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { StorageManager } from "@/lib/storage";

/**
 * Brevfugler Management Page
 *
 * Parents can add personal letters from Julius to children.
 * Letters are stored per day (1-24) and shown in the BREVFUGLER module (unlocked day 14).
 */

function BrevfuglerContent() {
  const [letters, setLetters] = useState<Map<number, string>>(() => {
    const allLetters = new Map<number, string>();
    const savedLetters = StorageManager.getSantaLetters();
    savedLetters.forEach((letter) => {
      allLetters.set(letter.day, letter.content);
    });
    return allLetters;
  });
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [letterContent, setLetterContent] = useState("");

  const handleStartEdit = (day: number) => {
    setEditingDay(day);
    setLetterContent(letters.get(day) || "");
  };

  const handleSave = () => {
    if (editingDay === null) return;

    if (letterContent.trim()) {
      StorageManager.addSantaLetter(editingDay, letterContent.trim());
      setLetters((prev) => {
        const newMap = new Map(prev);
        newMap.set(editingDay, letterContent.trim());
        return newMap;
      });
    } else {
      // If empty, remove the letter by saving letters without this day
      const allLetters = StorageManager.getSantaLetters().filter(
        (l) => l.day !== editingDay,
      );
      StorageManager.saveSantaLetters(allLetters);
      setLetters((prev) => {
        const newMap = new Map(prev);
        newMap.delete(editingDay);
        return newMap;
      });
    }

    setEditingDay(null);
    setLetterContent("");
  };

  const handleCancel = () => {
    setEditingDay(null);
    setLetterContent("");
  };

  const handleDelete = (day: number) => {
    if (confirm(`Er du sikker på at du vil slette brevet for dag ${day}?`)) {
      const allLetters = StorageManager.getSantaLetters().filter(
        (l) => l.day !== day,
      );
      StorageManager.saveSantaLetters(allLetters);
      setLetters((prev) => {
        const newMap = new Map(prev);
        newMap.delete(day);
        return newMap;
      });
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="brevfugler" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          ✉️ BREVFUGLER
        </h1>
        <p className="text-center text-xl opacity-70">
          Personlige brev fra Julius til barna
        </p>
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6">
          <h2 className="text-2xl font-bold text-(--cold-blue) mb-3 text-center">
            📖 OM BREVFUGLER
          </h2>
          <ul className="space-y-2 text-lg">
            <li>✓ BREVFUGLER-modulen låses opp dag 14 i appen</li>
            <li>✓ Her kan du legge til personlige brev fra Julius til barna</li>
            <li>
              ✓ Brevene kan inneholde oppfordringer, komplimenter eller
              hemmeligheter
            </li>
            <li>
              ✓ Barna finner brevene i appen når de åpner BREVFUGLER-modulen
            </li>
            <li>✓ Du kan legge til/endre brev når som helst</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--neon-green) mb-2">
                {letters.size}
              </div>
              <div className="text-lg">Brev Skrevet</div>
            </div>
          </div>
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--gold) mb-2">
                {24 - letters.size}
              </div>
              <div className="text-lg">Dager Igjen</div>
            </div>
          </div>
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--cold-blue) mb-2">
                24
              </div>
              <div className="text-lg">Totalt Dager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Letter Grid */}
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <h2 className="text-3xl font-bold text-center mb-4">
          📅 BREV FOR HVER DAG
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
            const hasLetter = letters.has(day);
            const isEditing = editingDay === day;

            return (
              <div
                key={day}
                className={`border-4 p-4 ${
                  hasLetter
                    ? "border-(--gold) bg-(--gold)/10"
                    : "border-(--neon-green)/30 bg-black/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold">
                    Dag {day} {hasLetter && "✓"}
                  </h3>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(day)}
                        className="px-3 py-1 bg-(--neon-green) text-black text-sm font-bold hover:opacity-80"
                      >
                        {hasLetter ? "Rediger" : "Skriv"}
                      </button>
                      {hasLetter && (
                        <button
                          onClick={() => handleDelete(day)}
                          className="px-3 py-1 bg-(--christmas-red) text-white text-sm font-bold hover:opacity-80"
                        >
                          Slett
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={letterContent}
                      onChange={(e) => setLetterContent(e.target.value)}
                      placeholder="Kjære [navn],&#10;&#10;Skriv et personlig brev fra Julius her...&#10;&#10;Hilsen Julius"
                      className="w-full h-48 bg-black border-2 border-(--neon-green) text-(--neon-green) p-3 font-['VT323',monospace] text-lg resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-(--gold) text-black font-bold hover:opacity-80"
                      >
                        Lagre
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 border-2 border-(--neon-green) text-(--neon-green) font-bold hover:bg-(--neon-green)/20"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : hasLetter ? (
                  <div className="bg-black/50 p-3 border-2 border-(--gold)/50">
                    <p className="whitespace-pre-wrap text-sm line-clamp-4">
                      {letters.get(day)}
                    </p>
                  </div>
                ) : (
                  <p className="text-center opacity-50 py-8">Ingen brev ennå</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Brevfugler Management</p>
      </div>
    </div>
  );
}

export default function BrevfuglerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <BrevfuglerContent />
      </GuideAuth>
    </Suspense>
  );
}

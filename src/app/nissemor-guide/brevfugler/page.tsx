"use client";

import { Suspense, useState } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";

/**
 * The children's letters to Julius, written in the BREVFUGLER module (from day 7),
 * with writer and date. Julius reads one of them on video between day 20 and 23,
 * so this page prints cleanly for the recording.
 */

function BrevfuglerContent() {
  const [letters, setLetters] = useState(() => GameEngine.getSantaLetters());
  const [editing, setEditing] = useState<number | null>(null);
  const [tekst, setTekst] = useState("");

  const lagre = (neste: typeof letters) => {
    GameEngine.saveSantaLetters(neste);
    setLetters(neste);
    setEditing(null);
  };

  const handleSave = (i: number) => {
    const t = tekst.trim();
    lagre(
      t
        ? letters.map((l, j) => (j === i ? { ...l, content: t } : l))
        : letters.filter((_, j) => j !== i),
    );
  };

  const handleDelete = (i: number) => {
    if (confirm(`Slette brevet fra dag ${letters[i].day}?`)) {
      lagre(letters.filter((_, j) => j !== i));
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) p-4 md:p-8 print:bg-white print:text-black print:p-0">
      <div className="print:hidden">
        <GuideNavigation />
      </div>

      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          BREVFUGLER
        </h1>
        <p className="text-center text-xl opacity-70">
          Barnas brev til Julius ({letters.length})
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-6 border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4 text-lg space-y-1 print:hidden">
        <p>
          Barna skriver brev i BREVFUGLER fra dag 7. Hvert brev har navn og
          dato.
        </p>
        <p>
          Julius leser ett av brevene på video mellom dag 20 og 23. Skriv ut
          brevene innen 18. desember.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-2 min-h-12 px-4 bg-(--gold) text-black font-bold hover:opacity-80"
        >
          Skriv ut brevene
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 pb-8">
        {letters.length === 0 && (
          <p className="text-center opacity-60 py-8">Ingen brev ennå.</p>
        )}
        {letters.map((l, i) => (
          <article
            key={`${l.day}-${l.from ?? ""}-${i}`}
            className="border-4 border-(--gold) bg-(--gold)/10 p-4 break-inside-avoid print:border-2 print:border-black print:bg-white"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-2xl font-bold">
                {l.from ?? "Ukjent"} · {l.day}. desember
              </h2>
              {editing !== i && (
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => {
                      setEditing(i);
                      setTekst(l.content);
                    }}
                    className="px-3 min-h-11 bg-(--neon-green) text-black text-base font-bold hover:opacity-80"
                  >
                    Rediger
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="px-3 min-h-11 bg-(--christmas-red) text-white text-base font-bold hover:opacity-80"
                  >
                    Slett
                  </button>
                </div>
              )}
            </div>
            {editing === i ? (
              <div className="space-y-3">
                <textarea
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  className="w-full h-48 bg-black border-2 border-(--neon-green) text-(--neon-green) p-3 text-lg resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(i)}
                    className="flex-1 min-h-11 px-4 bg-(--gold) text-black font-bold hover:opacity-80"
                  >
                    Lagre
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 min-h-11 px-4 border-2 border-(--neon-green) text-(--neon-green) font-bold hover:bg-(--neon-green)/20"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-xl">{l.content}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default function BrevfuglerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) flex items-center justify-center">
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

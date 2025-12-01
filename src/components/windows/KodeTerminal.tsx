"use client";

import { useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { Oppdrag, InnsendelseLog } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getISOString } from "@/lib/date-utils";
import { trackEvent, trackCodeSubmission } from "@/lib/analytics";

interface KodeTerminalProps {
  onClose: () => void;
  expectedCode: string;
  currentDay: number;
  allMissions: Oppdrag[];
  onCodeSubmitted?: () => void;
}

export function KodeTerminal({
  onClose,
  expectedCode,
  currentDay,
  allMissions,
  onCodeSubmitted,
}: KodeTerminalProps) {
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<{
    files: string[];
    symbols: Array<{
      symbolId: string;
      symbolIcon: string;
      description: string;
    }>;
    topics: string[];
  } | null>(null);
  const [submittedCodes, setSubmittedCodes] = useState<InnsendelseLog[]>(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getSubmittedCodes();
    }
    return [];
  });
  const [isAlreadySolved, setIsAlreadySolved] = useState(() => {
    if (typeof window !== "undefined") {
      return GameEngine.isQuestCompleted(currentDay);
    }
    return false;
  });
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getFailedAttempts(currentDay);
    }
    return 0;
  });

  // Get the solved code for display if already solved
  const solvedCode = (() => {
    if (typeof window !== "undefined" && isAlreadySolved) {
      const codes = GameEngine.getSubmittedCodes();
      const dayMission = allMissions.find((m) => m.dag === currentDay);
      const entry = codes.find((c) => c.kode === dayMission?.kode);
      return entry?.kode || "";
    }
    return "";
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || processing || isAlreadySolved) return;

    setProcessing(true);
    setFeedback(null);

    // Track code submission attempt
    trackEvent("code_submitted", { day: currentDay });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Submit code through GameEngine (now async to handle placeholders)
    const result = await GameEngine.submitCode(code, expectedCode, currentDay);

    if (result.success) {
      // Success!
      setFeedback("success");
      SoundManager.playSound("success");

      // Track successful code submission
      const currentAttempts = GameEngine.getFailedAttempts(currentDay) + 1;
      trackCodeSubmission(currentDay, true, currentAttempts);

      if (result.isNewCompletion) {
        // Track quest completion
        trackEvent("quest_completed", {
          day: currentDay,
          attempts: currentAttempts,
        });

        // Update local state
        const newEntry: InnsendelseLog = {
          kode: code.trim().toUpperCase(),
          dato: getISOString(),
        };
        const updated = [...submittedCodes, newEntry];
        setSubmittedCodes(updated);

        // Mark as solved
        setIsAlreadySolved(true);

        // Reset failed attempts
        setFailedAttempts(0);

        // Check for content unlocks
        const newContent = GameEngine.getNewlyUnlockedContent(currentDay);
        if (
          newContent.files.length > 0 ||
          newContent.symbols.length > 0 ||
          newContent.topics.length > 0
        ) {
          setUnlockedContent(newContent);
          // No timeout - let user dismiss by closing terminal or submitting again
        }

        // Notify parent of code submission
        if (onCodeSubmitted) {
          onCodeSubmitted();
        }
      }

      setCode("");
    } else {
      // Error - update failed attempts
      setFeedback("error");
      SoundManager.playSound("error");

      const currentFailedAttempts =
        typeof window !== "undefined"
          ? GameEngine.getFailedAttempts(currentDay)
          : 0;

      setFailedAttempts(currentFailedAttempts);

      // Track failed code submission
      trackCodeSubmission(currentDay, false, currentFailedAttempts);
    }

    setProcessing(false);

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <RetroWindow title="KODETERMINAL" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Code size={32} color="blue" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              TERMINAL TILGANG
            </div>
            <div className="text-sm opacity-70">
              SKRIV INN KODE FOR DAG {currentDay}
            </div>
          </div>
          {isAlreadySolved && (
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-(--gold) bg-(--gold)/20 text-(--gold)">
              <Icons.CheckCircle size={20} color="gold" />
              <span className="text-sm font-bold">LØST</span>
            </div>
          )}
        </div>

        {/* Code input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={isAlreadySolved ? solvedCode : code}
              onChange={(e) => setCode(e.target.value)}
              disabled={processing || isAlreadySolved}
              readOnly={isAlreadySolved}
              className={`
                w-full px-4 py-3 bg-black border-4 text-2xl tracking-widest font-mono
                focus:outline-none uppercase
                ${
                  isAlreadySolved
                    ? "border-(--gold) text-(--gold)"
                    : feedback === "success"
                      ? "border-(--gold)"
                      : feedback === "error"
                        ? "border-(--christmas-red)"
                        : "border-(--neon-green) focus:shadow-[0_0_20px_rgba(0,255,0,0.5)]"
                }
                ${isAlreadySolved ? "cursor-not-allowed" : ""}
              `}
              style={{
                animation:
                  feedback === "success"
                    ? "gold-flash 0.5s ease-out"
                    : feedback === "error"
                      ? "red-shake 0.5s ease-out"
                      : "none",
                color: "var(--neon-green)",
                caretColor: "var(--neon-green)",
              }}
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={processing || !code.trim() || isAlreadySolved}
            className={`
              w-full px-6 py-3 text-xl tracking-wider font-bold border-4 transition-colors
              ${
                feedback === "success"
                  ? "bg-(--gold) border-(--gold) text-black"
                  : feedback === "error"
                    ? "bg-(--christmas-red) border-(--christmas-red) text-white"
                    : "bg-(--cold-blue) border-(--cold-blue) text-black hover:bg-transparent hover:text-(--cold-blue)"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              animation:
                feedback === "success"
                  ? "gold-flash 0.5s ease-out"
                  : feedback === "error"
                    ? "red-shake 0.5s ease-out"
                    : "none",
            }}
          >
            {processing ? (
              "SJEKKER......"
            ) : isAlreadySolved ? (
              "RIKTIG LØSNING"
            ) : feedback === "success" ? (
              <span className="flex items-center justify-center gap-2">
                <Icons.CheckCircle size={24} color="gray" />
                KODE AKSEPTERT!
              </span>
            ) : feedback === "error" ? (
              <span className="flex items-center justify-center gap-2">
                <Icons.Alert size={24} color="gray" />
                FEIL KODE - PRØV IGJEN
              </span>
            ) : (
              "SEND"
            )}
          </button>
        </form>

        {/* Julius' terminal note after 3 failed attempts */}
        {failedAttempts >= 3 && !isAlreadySolved && (
          <div className="space-y-3">
            <div className="p-4 border-2 border-(--cold-blue) bg-(--cold-blue)/10 text-(--cold-blue)">
              <div className="flex items-start gap-3">
                <Icons.BookOpen
                  size={24}
                  color="blue"
                  className="mt-1 shrink-0"
                />
                <div className="space-y-2">
                  <div className="text-sm font-bold">TIPS FRA JULIUS:</div>
                  <div className="text-sm leading-relaxed">
                    Sjekk DAGBOK-modulen! Julius skriver daglige notater som kan
                    inneholde ledetråder til dagens oppgave. Kombinert med
                    fysiske hint hjemme, finner du løsningen!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content unlock notification */}
        {unlockedContent && (
          <div className="p-4 border-4 border-(--neon-green) bg-(--neon-green)/20 text-(--neon-green) space-y-3 animate-[gold-flash_0.5s_ease-out]">
            <div className="flex items-center gap-2 text-lg font-bold border-b-2 border-(--neon-green)/30 pb-2">
              <Icons.CheckCircle size={24} color="green" />
              <span>NYTT INNHOLD LÅST OPP!</span>
            </div>

            {unlockedContent.files.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Icons.File size={16} color="green" />
                  <span>FILER I NISSENET:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.files.map((file, i) => (
                    <div key={i} className="text-sm">
                      • {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unlockedContent.symbols.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Icons.Key size={16} color="green" />
                  <span>KRYPTO-SYMBOLER:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.symbols.map((symbol, i) => (
                    <div key={i} className="text-sm">
                      • {symbol.symbolIcon.toUpperCase()} - {symbol.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unlockedContent.topics.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Icons.BookOpen size={16} color="green" />
                  <span>EMNER:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.topics.map((topic, i) => (
                    <div key={i} className="text-sm">
                      • {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs opacity-90 pt-2 border-t-2 border-(--neon-green)/30">
              Sjekk NISSENET eller NISSEKRYPTO for å se det nye innholdet!
            </div>
          </div>
        )}

        {/* Submitted codes list */}
        <div className="mt-8 space-y-2">
          <div className="text-xl font-bold border-b-2 border-(--neon-green)/30 pb-2">
            INNSENDTE KODER ({submittedCodes.length})
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {submittedCodes.length === 0 ? (
              <div className="text-sm opacity-50 text-center py-4">
                Ingen koder innsendt ennå
              </div>
            ) : (
              submittedCodes.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border-2 border-(--gold) bg-(--gold)/10"
                >
                  <div className="flex items-center gap-2">
                    <Icons.CheckCircle size={16} color="gold" />
                    <span className="font-mono text-lg text-(--gold)">
                      {entry.kode}
                    </span>
                  </div>
                  <span className="text-xs opacity-70">
                    {new Date(entry.dato).toLocaleDateString("no-NO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}

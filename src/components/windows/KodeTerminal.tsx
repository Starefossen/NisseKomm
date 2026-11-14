"use client";

import { useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { InnsendelseLog } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { getCurrentDay } from "@/lib/date-utils";
import { TIDBITS, rotate, secretReply } from "@/lib/tidbits";

interface KodeTerminalProps {
  onClose: () => void;
  currentDay: number;
  /** `day` is set only when a day was newly solved (not for bonus approvals). */
  onCodeSubmitted?: (day?: number) => void;
  onOpenDagbok?: () => void;
}

export function KodeTerminal({
  onClose,
  currentDay,
  onCodeSubmitted,
  onOpenDagbok,
}: KodeTerminalProps) {
  // Julius' PS right after a new solve, so the kids see where to go next
  const [juliusPs, setJuliusPs] = useState<string | null>(null);
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
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  // Secret-word reply or wrong-code joke (tidbits.json); never a hint
  const [tull, setTull] = useState<string | null>(null);
  const [jokeIndex, setJokeIndex] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== "undefined") {
      return GameEngine.getFailedAttempts(currentDay);
    }
    return 0;
  });

  // Get the solved code for display if already solved
  const solvedCode = (() => {
    if (typeof window !== "undefined" && isAlreadySolved) {
      const entry = GameEngine.getSubmittedCodes().find(
        (c) => c.day === currentDay,
      );
      return entry?.kode || "";
    }
    return "";
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || processing) return;

    setProcessing(true);
    setFeedback(null);
    setTull(null);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // A secret word is never a real or bonus code (tidbits.test.ts) and never
    // reaches the server, so it does not count as a failed attempt.
    const secret = secretReply(code, getCurrentDay());
    if (secret) {
      setTull(secret);
      setCode("");
      setProcessing(false);
      return;
    }

    // The server checks the code (POST /api/kode); the browser knows none.
    const result = await GameEngine.submitCode(code, currentDay);

    // Parents approve bonus quests (day 11 and 16) here too, also after the
    // day's main code is solved
    if (result.bonusDag) {
      const dag = result.bonusDag;
      const ok = GameEngine.isBonusOppdragAccessible(dag);
      if (ok) {
        GameEngine.completeBonusOppdrag(dag);
        const tekst = GameEngine.getAllQuests().find((m) => m.dag === dag)
          ?.bonusoppdrag?.belønning_tekst;
        if (tekst) setBonusMessage(tekst);
        onCodeSubmitted?.();
        setCode("");
      }
      setFeedback(ok ? "success" : "error");
      SoundManager.playSound(ok ? "success" : "error");
      setProcessing(false);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    if (result.success) {
      // Success!
      setFeedback("success");
      SoundManager.playSound("success");

      if (result.isNewCompletion) {
        // Update local state
        setSubmittedCodes(GameEngine.getSubmittedCodes());

        // Mark as solved
        setIsAlreadySolved(true);
        setJuliusPs(GameEngine.getJuliusPs(currentDay) ?? "");

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
          onCodeSubmitted(currentDay);
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
      if (result.utlogget) {
        setTull("Logg inn på nytt.");
      } else if (result.nettfeil) {
        setTull("Linjen hakker, prøv igjen.");
      } else if (result.ventSek) {
        setTull("FOR MANGE FORSØK. KODETERMINALEN MÅ KJØLE SEG NED ET MINUTT.");
      } else {
        setTull(rotate(TIDBITS.terminal.feilKode, jokeIndex, getCurrentDay()));
        setJokeIndex((n) => n + 1);
      }
    }

    setProcessing(false);

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <RetroWindow title="KODETERMINAL" onClose={onClose}>
      <div className="p-4 h-full overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Code size={32} color="blue" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              TERMINAL TILGANG
            </div>
            <div className="text-base opacity-70">
              SKRIV INN KODE FOR DAG {currentDay}
            </div>
          </div>
          {isAlreadySolved && (
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-(--gold) bg-(--gold)/20 text-(--gold)">
              <Icons.CheckCircle size={20} color="gold" />
              <span className="text-base font-bold">LØST</span>
            </div>
          )}
        </div>

        {/* Code input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={processing}
              className={`
                w-full px-4 py-3 bg-black border-4 text-2xl tracking-widest font-retro
                focus:outline-none uppercase
                ${
                  isAlreadySolved
                    ? "border-(--gold) text-(--gold)"
                    : feedback === "success"
                      ? "border-(--gold)"
                      : feedback === "error"
                        ? "border-(--christmas-red)"
                        : "border-(--neon-green) focus:shadow-[0_0_20px_color-mix(in_oklab,var(--brass)_50%,transparent)]"
                }
              `}
              style={{
                animation:
                  feedback === "success"
                    ? "gold-flash 0.5s ease-out"
                    : feedback === "error"
                      ? "red-shake 0.5s ease-out"
                      : "none",
                color: isAlreadySolved ? "var(--gold)" : "var(--neon-green)",
                caretColor: "var(--neon-green)",
              }}
              placeholder={isAlreadySolved ? solvedCode : "_ _ _ _ _ _ _ _"}
              aria-label={`Kode for dag ${currentDay}`}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={processing || !code.trim()}
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
                  ? "gold-glow 0.5s ease-out"
                  : feedback === "error"
                    ? "red-shake 0.5s ease-out"
                    : "none",
            }}
          >
            {processing ? (
              "SJEKKER......"
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
            ) : isAlreadySolved ? (
              "RIKTIG LØSNING"
            ) : (
              "SEND"
            )}
          </button>
          <div role="status" aria-live="polite" className="sr-only">
            {feedback === "success"
              ? "Kode akseptert"
              : feedback === "error"
                ? "Feil kode, prøv igjen"
                : ""}
          </div>
          {tull && (
            <div
              role="status"
              aria-live="polite"
              className="border-2 border-(--cold-blue) bg-(--cold-blue)/10 p-3 text-base text-(--cold-blue)"
            >
              {tull}
            </div>
          )}
          {bonusMessage && (
            <div
              role="status"
              className="border-4 border-(--gold) bg-(--gold)/10 p-3 text-(--gold)"
            >
              ✓ BONUS GODKJENT: {bonusMessage}
            </div>
          )}
        </form>

        {juliusPs !== null && (
          <div className="p-4 border-4 border-(--gold) bg-black text-(--gold) space-y-3">
            {juliusPs && (
              <>
                <div className="text-lg font-bold">PS FRA JULIUS:</div>
                <div className="text-xl leading-relaxed">{juliusPs}</div>
              </>
            )}
            {onOpenDagbok && (
              <button
                type="button"
                onClick={onOpenDagbok}
                className="w-full min-h-12 px-4 py-2 text-xl font-bold tracking-wider border-4 border-(--gold) bg-(--gold) text-black hover:bg-transparent hover:text-(--gold)"
              >
                ÅPNE DAGBOK
              </button>
            )}
          </div>
        )}

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
                  <div className="text-base font-bold">TIPS FRA JULIUS:</div>
                  <div className="text-base leading-relaxed">
                    Les dagens e-post fra Rampenissen i NISSEMAIL én gang til,
                    og let etter lappen han har gjemt hjemme. Svaret får dere
                    først når dere setter de to sammen.
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
                <div className="flex items-center gap-2 text-base font-bold">
                  <Icons.File size={16} color="green" />
                  <span>FILER I NISSENET:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.files.map((file, i) => (
                    <div key={i} className="text-base">
                      • {file}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unlockedContent.symbols.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Icons.Key size={16} color="green" />
                  <span>KRYPTO-SYMBOLER:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.symbols.map((symbol, i) => (
                    <div key={i} className="text-base">
                      • {symbol.symbolIcon.toUpperCase()} - {symbol.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unlockedContent.topics.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Icons.BookOpen size={16} color="green" />
                  <span>EMNER:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {unlockedContent.topics.map((topic, i) => (
                    <div key={i} className="text-base">
                      • {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-base opacity-90 pt-2 border-t-2 border-(--neon-green)/30">
              Sjekk NISSENET eller NISSEKRYPTO for å se det nye innholdet!
            </div>
          </div>
        )}

        {/* Submitted codes list */}
        <div className="mt-8 space-y-2">
          <div className="text-xl font-bold border-b-2 border-(--neon-green)/30 pb-2">
            INNSENDTE KODER ({submittedCodes.length})
          </div>

          <div className="space-y-2">
            {submittedCodes.length === 0 ? (
              <div className="text-base opacity-50 text-center py-4">
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
                    <span className="font-retro text-lg text-(--gold)">
                      {entry.kode}
                    </span>
                  </div>
                  <span className="text-base opacity-70">
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

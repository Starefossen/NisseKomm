"use client";

import { useState } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { Oppdrag, InnsendelseLog } from "@/types/innhold";
import { SoundManager } from "@/lib/sounds";
import { StorageManager } from "@/lib/storage";

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
  const [submittedCodes, setSubmittedCodes] = useState<InnsendelseLog[]>(() => {
    if (typeof window !== "undefined") {
      return StorageManager.getSubmittedCodes();
    }
    return [];
  });
  const isAlreadySolved = (() => {
    if (typeof window !== "undefined") {
      const codes = StorageManager.getSubmittedCodes();
      const dayMission = allMissions.find((m) => m.dag === currentDay);
      return codes.some((c) => c.kode === dayMission?.kode);
    }
    return false;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || processing) return;

    setProcessing(true);
    setFeedback(null);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if code is correct
    const isCorrect = code.trim().toUpperCase() === expectedCode.toUpperCase();

    if (isCorrect) {
      // Success!
      setFeedback("success");
      SoundManager.playSound("success");

      // Save to localStorage (only correct codes)
      const newEntry: InnsendelseLog = {
        kode: code.trim().toUpperCase(),
        dato: new Date().toISOString(),
      };

      StorageManager.addSubmittedCode(newEntry);
      const updated = [...submittedCodes, newEntry];
      setSubmittedCodes(updated);

      setCode("");

      // Notify parent of code submission (for module unlocks)
      if (onCodeSubmitted) {
        onCodeSubmitted();
      }
    } else {
      // Error
      setFeedback("error");
      SoundManager.playSound("error");
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={processing}
              className={`
                w-full px-4 py-3 bg-black border-4 text-2xl tracking-widest font-mono
                focus:outline-none uppercase
                ${
                  feedback === "success"
                    ? "border-(--gold)"
                    : feedback === "error"
                      ? "border-(--christmas-red)"
                      : "border-(--neon-green) focus:shadow-[0_0_20px_rgba(0,255,0,0.5)]"
                }
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
            disabled={processing || !code.trim()}
            className="w-full px-6 py-3 bg-(--cold-blue) text-black text-xl tracking-wider font-bold border-4 border-(--cold-blue) hover:bg-transparent hover:text-(--cold-blue) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "BEHANDLER..." : "SEND"}
          </button>
        </form>

        {/* Feedback messages */}
        {feedback === "success" && (
          <div className="p-4 border-2 border-(--gold) bg-(--gold)/20 text-(--gold) text-center font-bold">
            <div className="flex items-center justify-center gap-2">
              <Icons.CheckCircle size={24} color="gold" />
              <span>KODE AKSEPTERT!</span>
            </div>
          </div>
        )}

        {feedback === "error" && (
          <div className="p-4 border-2 border-(--christmas-red) bg-(--christmas-red)/20 text-(--christmas-red) text-center font-bold">
            <div className="flex items-center justify-center gap-2">
              <Icons.Alert size={24} color="red" />
              <span>FEIL KODE - PRØV IGJEN</span>
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

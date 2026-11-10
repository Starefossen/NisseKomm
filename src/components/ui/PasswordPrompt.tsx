"use client";

import { useState } from "react";
import { setSessionId } from "@/lib/auth-cookies";
import { mediaUrl } from "@/lib/media";

// Julius' office from media; the village still underneath shows if the feed is missing
const OFFICE_BG = `linear-gradient(rgba(10,6,4,0.55), rgba(10,6,4,0.8)), url("${mediaUrl("feed/julius-kontor.png")}"), url("/village-day.jpg")`;

interface PasswordPromptProps {
  onSuccess: (sessionId: string) => void;
}

const errorMessages = [
  "FEIL KODE",
  "TILGANG NEKTET - PRØV IGJEN",
  "ADVARSEL: SIKKERHETSBRUDD REGISTRERT",
];

export function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [code, setCode] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.kidCode) {
        // Failed attempt
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        const errorIndex = Math.min(
          newAttemptCount - 1,
          errorMessages.length - 1,
        );
        setError(
          response.status === 429
            ? "FOR MANGE FORSØK - VENT TI MINUTTER"
            : errorMessages[errorIndex],
        );

        // Trigger shake animation
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        // Clear code
        setCode("");
      } else {
        setSessionId(data.kidCode);
        onSuccess(data.kidCode);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("TILKOBLINGSFEIL - PRØV IGJEN");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-(--crt-bg) bg-cover bg-center flex items-center justify-center z-50"
      style={{ backgroundImage: OFFICE_BG }}
    >
      <div
        className={`w-[600px] max-w-[90%] space-y-6 p-6 md:p-8 bg-(--dark-crt)/85 border-2 border-(--brass) rounded-md shadow-[0_8px_40px_rgba(0,0,0,0.7)] ${isShaking ? "animate-[crt-shake_0.3s_ease-in-out]" : ""}`}
      >
        {/* Header */}
        <div className="text-(--neon-green) text-3xl tracking-wider font-retro text-center mb-8">
          <div>SNØFALL · DIREKTELINJE 90,0 MHz</div>
          <div className="text-xl mt-2 text-(--cold-blue)">
            SKRIV INN DIN HEMMELIGE KODE
          </div>
        </div>

        {/* Code form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 bg-(--crt-bg) border-2 border-(--brass) text-(--cold-blue) text-2xl tracking-widest font-retro focus:outline-none focus:shadow-[0_0_20px_color-mix(in_oklab,var(--brass)_50%,transparent)] uppercase"
              autoComplete="off"
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
              disabled={isLoading}
              style={{ caretColor: "var(--cold-blue)" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 min-h-12 bg-(--brass) text-black text-2xl tracking-wider border-2 border-(--brass) hover:bg-transparent hover:text-(--neon-green) transition-colors disabled:opacity-50"
          >
            {isLoading ? "SJEKKER..." : "LOGG INN"}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div
            className="text-(--christmas-red) text-center text-lg tracking-wider border-2 border-(--christmas-red) px-4 py-2"
            style={{ animation: "error-pulse 0.5s ease-in-out" }}
          >
            {error}
          </div>
        )}

        {/* Attempt counter */}
        {attemptCount > 0 && (
          <div className="text-(--gold) text-center text-lg">
            Forsøk: {attemptCount}
          </div>
        )}
      </div>
    </div>
  );
}

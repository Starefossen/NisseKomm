"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface PasswordPromptProps {
  onSuccess: (sessionId: string) => void;
}

const errorMessages = [
  "FEIL KODE",
  "TILGANG NEKTET - PRØV IGJEN",
  "ADVARSEL: SIKKERHETSBRUDD REGISTRERT",
];

export function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [code, setCode] = useState(() => {
    // Check for pre-filled code from registration
    if (typeof window !== "undefined") {
      const prefillCode = sessionStorage.getItem("PREFILL_CODE");
      if (prefillCode) {
        sessionStorage.removeItem("PREFILL_CODE");
        return prefillCode;
      }
    }
    return "";
  });
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    // Track login attempt
    trackEvent("login_attempt", { authType: "kid" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Failed attempt
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        const errorIndex = Math.min(
          newAttemptCount - 1,
          errorMessages.length - 1,
        );
        setError(errorMessages[errorIndex]);

        // Trigger shake animation
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);

        // Clear code
        setCode("");
      } else {
        // Success! Pass the sessionId
        trackEvent("login_success", { authType: "kid" });
        trackEvent("session_started", { authType: "kid" });
        onSuccess(data.sessionId);
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
    <div className="fixed inset-0 bg-(--crt-bg) flex items-center justify-center z-50">
      <div
        className={`w-[600px] max-w-[90%] space-y-6 ${isShaking ? "animate-[crt-shake_0.3s_ease-in-out]" : ""}`}
      >
        {/* Header */}
        <div className="text-(--neon-green) text-2xl tracking-wider font-mono text-center mb-8">
          <div>TILGANGSKONTROLL</div>
          <div className="text-sm mt-2 opacity-70">
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
              className="w-full px-4 py-3 bg-black border-4 border-(--neon-green) text-(--neon-green) text-xl tracking-widest font-mono focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,0,0.5)] uppercase"
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
              disabled={isLoading}
              style={{ caretColor: "var(--neon-green)" }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-(--neon-green) text-black text-xl tracking-wider font-bold border-4 border-(--neon-green) hover:bg-transparent hover:text-(--neon-green) transition-colors disabled:opacity-50"
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
          <div className="text-(--gold) text-center text-sm opacity-70">
            Forsøk: {attemptCount}
          </div>
        )}
      </div>
    </div>
  );
}

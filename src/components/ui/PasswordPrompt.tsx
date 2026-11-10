"use client";

import { useEffect, useRef, useState } from "react";
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

/** Words in a typed or pasted code; a trailing separator yields a final "". */
export function splitCode(value: string): string[] {
  return value.trimStart().split(/[\s-]+/);
}

/** auth.ts normalizeCode treats spaces as the separator, so old codes still match. */
export function joinCode(words: string[]): string {
  return words.map((w) => w.trim()).join(" ");
}

export function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [words, setWords] = useState(["", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, value: string) => {
    const parts = splitCode(value);
    const next = [...words];
    if (parts.length === 1) {
      next[i] = parts[0];
      setWords(next);
      return;
    }
    // A whole pasted code fills from field 1; otherwise a space or «-» moves on
    const start = parts.filter(Boolean).length >= 3 ? 0 : i;
    let j = start;
    for (const part of parts.filter(Boolean)) {
      if (j > 2) break;
      next[j++] = part;
    }
    setWords(next);
    refs.current[Math.min(Math.max(j, i + 1), 2)]?.focus();
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && words[i] === "" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    }
  };
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Inputs are disabled while checking, so focus can only return once they are enabled
  useEffect(() => {
    if (!isLoading && error) refs.current[0]?.focus();
  }, [isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode(words) }),
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

        setWords(["", "", ""]);
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
          <div className="flex items-center gap-2">
            {words.map((word, i) => (
              <div key={i} className="contents">
                {i > 0 && (
                  <span className="text-(--brass) text-2xl font-retro">-</span>
                )}
                <input
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="text"
                  value={word}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Ord ${i + 1} av 3`}
                  className="min-w-0 flex-1 min-h-12 px-2 py-3 bg-(--crt-bg) border-2 border-(--brass) text-(--cold-blue) text-2xl text-center tracking-widest font-retro focus:outline-none focus:shadow-[0_0_20px_color-mix(in_oklab,var(--brass)_50%,transparent)] uppercase"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="_ _ _"
                  autoFocus={i === 0}
                  disabled={isLoading}
                  style={{ caretColor: "var(--cold-blue)" }}
                />
              </div>
            ))}
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

"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  isParentAuthenticated,
  clearParentAuth,
  setParentAuthenticated,
  setSessionId,
} from "@/lib/session-manager";
import { useEffect } from "react";

/**
 * GuideAuth Component
 *
 * Centralized authentication check for all nissemor-guide pages.
 * Shows a login form when not authenticated.
 *
 * Validates parent code via /api/auth/login and /api/auth/verify.
 * On successful login, sets session cookie and persists parent auth.
 *
 * Usage:
 * Wrap page content in <GuideAuth>{content}</GuideAuth>
 * or use useGuideAuth() hook for more control.
 */

export function useGuideAuth(): {
  authenticated: boolean;
  isLoading: boolean;
  logout: () => void;
} {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearParentAuth();
    setAuthenticated(false);
    // Force a full page reload to reset all component state
    window.location.href = "/nissemor-guide";
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      // Check if we have a valid parent session cookie
      const hasParentSession = isParentAuthenticated();

      if (hasParentSession) {
        // Validate with server that session is still valid
        try {
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // Empty body = check session cookie
            credentials: "include",
          });

          if (response.ok) {
            const data = (await response.json()) as { isParent: boolean };
            if (data.isParent) {
              setAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Session validation failed
        }
        // Session invalid, clear it
        clearParentAuth();
      }

      setAuthenticated(false);
      setIsLoading(false);
    }

    verifyAuth();
  }, []);

  return { authenticated, isLoading, logout };
}

interface GuideAuthProps {
  children: React.ReactNode;
  loadingMessage?: string;
  showLogout?: boolean;
}

/**
 * Login form for parent authentication
 */
function ParentLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Vennligst skriv inn foreldrekoden");
      setIsSubmitting(false);
      return;
    }

    try {
      // First, login with the parent code to set session
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
        credentials: "include",
      });

      if (!loginResponse.ok) {
        const loginData = await loginResponse.json();
        setError(loginData.error || "Ugyldig kode");
        setIsSubmitting(false);
        return;
      }

      const loginData = await loginResponse.json();

      // Check if this was a parent code login
      if (loginData.role !== "parent") {
        setError(
          "Dette er en barnekode. Bruk foreldrekoden (starter med NORDPOL-)",
        );
        setIsSubmitting(false);
        return;
      }

      // Login already set both cookies (session + parent auth)
      // Set client-side parent auth for isParentAuthenticated() check
      if (loginData.sessionId) {
        setSessionId(loginData.sessionId);
        setParentAuthenticated(loginData.sessionId);
      }

      onSuccess();
      return;
    } catch {
      setError("Nettverksfeil. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-(--neon-green) bg-(--dark-crt) p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          🎅 NISSEMOR GUIDE
        </h1>
        <p className="text-center text-(--neon-green)/70 mb-6">
          Kun for foreldre - logg inn med foreldrekoden
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="parentCode" className="block text-lg mb-2">
              Foreldrekode:
            </label>
            <input
              id="parentCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NORDPOL-XXXXX"
              className="w-full p-3 bg-black border-2 border-(--neon-green) text-(--neon-green) font-mono text-xl uppercase placeholder:text-(--neon-green)/30 focus:outline-none focus:border-(--gold)"
              autoComplete="off"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 border-2 border-(--christmas-red) bg-(--christmas-red)/20 text-(--christmas-red)">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-4 bg-(--neon-green) text-black font-bold text-xl hover:bg-(--gold) hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logger inn..." : "🔑 LOGG INN"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-(--neon-green)/30 text-center text-sm text-(--neon-green)/60">
          <p>Foreldrekoden ble sendt til e-posten du registrerte.</p>
          <p className="mt-2">Den starter med "NORDPOL-"</p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-(--cold-blue) hover:underline">
            ← Tilbake til hovedsiden
          </Link>
        </div>
      </div>
    </div>
  );
}

export function GuideAuth({
  children,
  loadingMessage = "Sjekker tilgang...",
  showLogout = false,
}: GuideAuthProps) {
  const { authenticated, isLoading, logout } = useGuideAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Handle successful login
  const handleLoginSuccess = useCallback(() => {
    setLoginSuccess(true);
  }, []);

  // Derive showContent from authenticated state or successful login
  // Note: logout triggers a full page reload, so no need to reset loginSuccess
  const showContent = useMemo(
    () => authenticated || loginSuccess,
    [authenticated, loginSuccess],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
        <div className="text-2xl">{loadingMessage}</div>
      </div>
    );
  }

  if (!showContent) {
    return <ParentLoginForm onSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {showLogout && (
        <div className="fixed top-4 right-4 z-50 print:hidden">
          <button
            onClick={logout}
            className="px-4 py-2 bg-(--christmas-red) text-white border-2 border-white hover:bg-(--christmas-red)/80 transition-colors font-bold"
          >
            🚪 LOGG UT
          </button>
        </div>
      )}
      {children}
    </>
  );
}

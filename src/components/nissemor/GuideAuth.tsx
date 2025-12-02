"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isParentAuthenticated,
  clearParentAuth,
  setParentAuthenticated,
  getSessionId,
} from "@/lib/session-manager";

/**
 * GuideAuth Component
 *
 * Centralized authentication check for all nissemor-guide pages.
 * Supports two authentication modes:
 * 1. Session-based: Parent auth cookie from previous login or registration
 * 2. Code-based: ?kode= parameter validated via /api/auth/verify
 *
 * When code is provided via URL, it's validated and persisted to cookie.
 * Redirects to home if authentication fails.
 *
 * Usage:
 * Wrap page content in <GuideAuth>{content}</GuideAuth>
 * or use useGuideAuth() hook for more control.
 */

export function useGuideAuth(): {
  authenticated: boolean;
  kode: string | null;
  isLoading: boolean;
  logout: () => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode");
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearParentAuth();
    router.push("/");
  }, [router]);

  useEffect(() => {
    async function verifyAuth() {
      // First, check if we have a valid parent session cookie
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
              console.log(
                "[GuideAuth] Authenticated via parent session cookie",
              );
              setAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("[GuideAuth] Session validation error:", error);
        }
        // Session invalid, clear it
        clearParentAuth();
      }

      // If no valid session, try code from URL
      if (!kode) {
        console.warn("[GuideAuth] Access denied: No parent code or session");
        setAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Validate code via API
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: kode }),
          credentials: "include",
        });

        if (response.ok) {
          const data = (await response.json()) as { isParent: boolean };
          setAuthenticated(data.isParent);

          if (data.isParent) {
            // Code was valid - server set the cookie, also set client-side
            const sessionId = getSessionId();
            if (sessionId) {
              setParentAuthenticated(sessionId);
            }
            console.log(
              "[GuideAuth] Authenticated via parent code, session persisted",
            );
          } else {
            console.warn(
              `[GuideAuth] Access denied: Invalid parent code '${kode.substring(0, 4)}...'`,
            );
          }
        } else {
          console.error(
            `[GuideAuth] Authentication failed: HTTP ${response.status} ${response.statusText}`,
          );
          setAuthenticated(false);
        }
      } catch (error) {
        console.error(
          "[GuideAuth] Network error during authentication:",
          error,
        );
        setAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [kode]);

  return { authenticated, kode, isLoading, logout };
}

interface GuideAuthProps {
  children: React.ReactNode;
  loadingMessage?: string;
  showLogout?: boolean;
}

export function GuideAuth({
  children,
  loadingMessage = "Sjekker tilgang...",
  showLogout = false,
}: GuideAuthProps) {
  const router = useRouter();
  const { authenticated, isLoading, logout } = useGuideAuth();

  useEffect(() => {
    if (!isLoading && !authenticated) {
      router.push("/");
    }
  }, [authenticated, isLoading, router]);

  if (isLoading || !authenticated) {
    return (
      <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
        <div className="text-2xl">{loadingMessage}</div>
      </div>
    );
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

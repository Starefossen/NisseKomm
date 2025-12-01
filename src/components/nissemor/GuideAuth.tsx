"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * GuideAuth Component
 *
 * Centralized authentication check for all nissemor-guide pages.
 * Validates the ?kode= parameter via /api/auth/verify endpoint.
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
} {
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode");
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyParentCode() {
      if (!kode) {
        console.warn("[GuideAuth] Access denied: No parent code provided");
        setAuthenticated(false);
        setIsLoading(false);
        return;
      }

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
          if (!data.isParent) {
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

    verifyParentCode();
  }, [kode]);

  return { authenticated, kode, isLoading };
}

interface GuideAuthProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export function GuideAuth({
  children,
  loadingMessage = "Sjekker tilgang...",
}: GuideAuthProps) {
  const router = useRouter();
  const { authenticated, isLoading } = useGuideAuth();

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

  return <>{children}</>;
}

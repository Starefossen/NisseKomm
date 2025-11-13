"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * GuideAuth Component
 *
 * Centralized authentication check for all nissemor-guide pages.
 * Validates the ?kode= parameter against environment variable.
 * Redirects to home if authentication fails.
 *
 * Usage:
 * Wrap page content in <GuideAuth>{content}</GuideAuth>
 * or use useGuideAuth() hook for more control.
 */

export function useGuideAuth(): {
  authenticated: boolean;
  kode: string | null;
} {
  const searchParams = useSearchParams();
  const expectedKode =
    process.env.NEXT_PUBLIC_PARENT_GUIDE_KEY || "NORDPOL2025";
  const kode = searchParams.get("kode");
  const authenticated = kode === expectedKode;

  return { authenticated, kode };
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
  const { authenticated } = useGuideAuth();

  useEffect(() => {
    if (!authenticated) {
      router.push("/");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
        <div className="text-2xl">{loadingMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Lagrestatus =
  | { s: "lagrer" }
  | { s: "lagret"; tekst: string }
  | { s: "feil"; grunn: string }
  | null;

/**
 * Feedback for every guide action that saves: «Lagrer…» at once, «✓ Lagret»
 * (or the result) for two seconds, «Ikke lagret: grunn» on an error.
 * `kjør` never throws; it resolves false on an error.
 */
export function useLagring() {
  const [status, setStatus] = useState<Lagrestatus>(null);
  const tidtaker = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(tidtaker.current), []);
  const kjør = useCallback(
    async (f: () => Promise<unknown>, ok = "✓ Lagret"): Promise<boolean> => {
      clearTimeout(tidtaker.current);
      setStatus({ s: "lagrer" });
      try {
        await f();
        setStatus({ s: "lagret", tekst: ok });
        tidtaker.current = setTimeout(() => setStatus(null), 2000);
        return true;
      } catch (e) {
        setStatus({
          s: "feil",
          grunn: e instanceof Error ? e.message : "ukjent feil",
        });
        return false;
      }
    },
    [],
  );
  return { status, lagrer: status?.s === "lagrer", kjør };
}

export function Lagremelding({
  status,
  className = "text-sm",
}: {
  status: Lagrestatus;
  className?: string;
}) {
  return (
    <span
      aria-live="polite"
      data-lagring={status?.s ?? ""}
      className={className}
    >
      {status?.s === "lagrer" ? (
        <span className="text-(--gold) animate-pulse">Lagrer…</span>
      ) : status?.s === "lagret" ? (
        <span className="text-(--gold)">{status.tekst}</span>
      ) : status?.s === "feil" ? (
        <span className="text-(--christmas-red)">
          Ikke lagret: {status.grunn}
        </span>
      ) : null}
    </span>
  );
}

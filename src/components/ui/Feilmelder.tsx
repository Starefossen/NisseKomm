"use client";

import { useEffect } from "react";
import { meldFeil } from "@/lib/meld-feil";

/** Sends uncaught errors outside React (event handlers, promises) to the guide. */
export function Feilmelder() {
  useEffect(() => {
    const feil = (e: ErrorEvent) => meldFeil(e.error ?? e.message);
    const løfte = (e: PromiseRejectionEvent) => meldFeil(e.reason);
    window.addEventListener("error", feil);
    window.addEventListener("unhandledrejection", løfte);
    return () => {
      window.removeEventListener("error", feil);
      window.removeEventListener("unhandledrejection", løfte);
    };
  }, []);
  return null;
}

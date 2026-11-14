"use client";

import { useEffect } from "react";

/** Registers the guide's service worker (scope /nissemor-guide/ only; the kids' app gets none). */
export function PwaRegistrering() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker
      .register("/nissemor-guide/sw.js", { scope: "/nissemor-guide/" })
      .catch(() => {});
  }, []);
  return null;
}

"use client";

let sendt = 0;

/** Reports a client error to /api/klientfeil; at most 5 per page load, never throws. */
export function meldFeil(feil: unknown) {
  if (sendt >= 5 || typeof window === "undefined") return;
  sendt++;
  const melding =
    feil instanceof Error
      ? `${feil.name}: ${feil.message}${"digest" in feil && feil.digest ? ` (digest ${String(feil.digest)})` : ""}`
      : String(feil);
  fetch("/api/klientfeil", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ melding, rute: window.location.pathname }),
    keepalive: true,
  }).catch(() => {});
}

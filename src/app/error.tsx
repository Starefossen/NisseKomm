"use client";

import { useEffect } from "react";
import { meldFeil } from "@/lib/meld-feil";

export default function Feil({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => meldFeil(error), [error]);
  return (
    <main className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-6 flex flex-col items-center justify-center gap-4 text-xl text-center">
      <h1 className="text-4xl text-(--christmas-red)">SYSTEMFEIL</h1>
      <p>Noe gikk galt hos Rampenissen. IQ har fått beskjed.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 px-4 border-2 border-(--gold) text-(--gold) hover:bg-(--gold)/20"
      >
        Prøv igjen
      </button>
    </main>
  );
}

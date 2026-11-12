"use client";

/** The print button: the only client part of a printout (codes stay on the server). */
export function SkrivUt() {
  return (
    <button
      onClick={() => window.print()}
      className="px-6 py-3 min-h-11 bg-(--neon-green) text-black font-bold hover:opacity-80"
    >
      SKRIV UT
    </button>
  );
}

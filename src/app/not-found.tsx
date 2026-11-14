import Link from "next/link";

export default function IkkeFunnet() {
  return (
    <main className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-retro p-6 flex flex-col items-center justify-center gap-4 text-xl text-center">
      <h1 className="text-4xl text-(--gold)">Fant ikke siden</h1>
      <p>Adressen finnes ikke. Kanskje lenka er gammel?</p>
      <nav className="flex flex-wrap gap-2 justify-center">
        <Link
          href="/"
          className="flex items-center min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
        >
          Til NisseKomm
        </Link>
        <Link
          href="/nissemor-guide"
          className="flex items-center min-h-11 px-3 border-2 border-(--neon-green) hover:bg-(--neon-green)/20"
        >
          Til Nissemor-guiden
        </Link>
      </nav>
    </main>
  );
}

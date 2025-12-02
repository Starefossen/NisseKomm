import Link from "next/link";

export function EssentialTools() {
  return (
    <div className="max-w-7xl mx-auto mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shopping List */}
        <Link
          href="/nissemor-guide/handleliste"
          className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6 hover:bg-(--cold-blue)/20 transition-colors"
        >
          <h3 className="text-2xl font-bold text-(--cold-blue) mb-2 text-center">
            🛒 HANDLEKURV-LISTE
          </h3>
          <p className="text-center text-sm">
            Alle materialer som trengs for desember
          </p>
        </Link>

        {/* Printout */}
        <Link
          href="/nissemor-guide/printout"
          className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-6 hover:bg-(--neon-green)/20 transition-colors"
        >
          <h3 className="text-2xl font-bold text-(--neon-green) mb-2 text-center">
            🖨️ UTSKRIFTER
          </h3>
          <p className="text-center text-sm">
            Alle fysiske ledetekster for hele desember, klare for utskrift!
          </p>
        </Link>
      </div>
    </div>
  );
}

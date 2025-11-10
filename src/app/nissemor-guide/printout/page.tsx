"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllOppdrag } from "@/lib/oppdrag-loader";

const allOppdrag = getAllOppdrag();

function PrintoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const expectedKey = process.env.NEXT_PUBLIC_PARENT_GUIDE_KEY || "NORDPOL2025";
  const key = searchParams.get("key");
  const authenticated = key === expectedKey;

  useEffect(() => {
    if (!authenticated) {
      router.push("/");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null;
  }

  // Split into pages of 6 cards each (2 columns × 3 rows)
  const cardsPerPage = 6;
  const pages: (typeof allOppdrag)[] = [];
  for (let i = 0; i < allOppdrag.length; i += cardsPerPage) {
    pages.push(allOppdrag.slice(i, i + cardsPerPage));
  }

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">
            🖨️ NISSEMOR UTSKRIFTER
          </h1>
          <p className="text-center text-xl mb-6 opacity-70">
            Alle fysiske ledetekster for hele desember - 6 kort per side
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80"
            >
              SKRIV UT ALLE ({pages.length} SIDER)
            </button>
            <button
              onClick={() => router.push(`/nissemor-guide?key=${key}`)}
              className="px-6 py-3 border-4 border-(--neon-green) text-(--neon-green) font-bold text-xl hover:bg-(--neon-green)/10"
            >
              TILBAKE TIL GUIDE
            </button>
          </div>
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-(--gold) mb-3">
              📋 UTSKRIFTSINSTRUKSJONER:
            </h2>
            <ul className="space-y-2 text-lg">
              <li>✓ 6 kort per side (2 kolonner × 3 rader)</li>
              <li>✓ Skriv ut på vanlig A4-papir</li>
              <li>✓ Klipp ut langs de stiplede linjene</li>
              <li>
                ✓ Hvert kort er passe størrelse for Rampenissen (ca. 7×10 cm)
              </li>
              <li>✓ Brett eller rull kortene for ekstra spenning</li>
              <li>✓ Gjemt tekstene på riktige steder som beskrevet i guiden</li>
            </ul>
          </div>

          {/* Preview Section */}
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6 mb-8">
            <h2 className="text-2xl font-bold text-(--cold-blue) mb-4">
              👁️ FORHÅNDSVISNING
            </h2>
            <p className="text-lg mb-4 opacity-80">
              Slik vil kortene se ut når de er printet (scrolle ned for å se
              alle):
            </p>
          </div>

          {/* Screen Preview */}
          {pages.map((pageCards, pageIndex) => (
            <div
              key={pageIndex}
              className="mb-12 border-4 border-(--neon-green)/30 p-8 bg-(--dark-crt)"
            >
              <div className="text-center text-xl font-bold text-(--gold) mb-6">
                SIDE {pageIndex + 1} av {pages.length}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {pageCards.map((dag) => (
                  <div
                    key={dag.dag}
                    className="border-4 border-dashed border-(--neon-green) p-4 bg-(--dark-crt)"
                  >
                    {/* Parent info - outside the final note */}
                    <div className="text-center mb-3">
                      <div className="text-lg font-bold uppercase text-(--gold) py-1">
                        {dag.tittel}
                      </div>
                    </div>

                    {/* THE FINAL NOTE FOR KIDS - solid border */}
                    <div className="border-4 border-solid border-(--neon-green) p-3 bg-(--neon-green)/5 relative mb-3">
                      {/* Day number badge - smaller, inside note */}
                      <div className="absolute top-2 right-2 w-8 h-8 bg-(--christmas-red) border-2 border-(--neon-green) flex items-center justify-center">
                        <span className="text-lg font-bold text-(--gold)">
                          {dag.dag}
                        </span>
                      </div>

                      {/* NisseKomm branding header */}
                      <div className="text-center mb-3 pb-2 border-b-2 border-(--neon-green)">
                        <div className="text-base font-bold text-(--neon-green) tracking-wider">
                          ▬▬ NISSEKOMM ▬▬
                        </div>
                        <div className="text-[10px] text-(--cold-blue) font-mono">
                          [NORDPOL KOMMUNIKASJONSSYSTEM]
                        </div>
                      </div>

                      {/* Message only */}
                      <div className="text-center text-base leading-snug font-bold">
                        &quot;{dag.fysisk_ledetekst}&quot;
                      </div>
                    </div>

                    {/* Parent reference - outside the final note */}
                    <div className="text-center text-xs opacity-70 pt-2 border-t border-(--neon-green)/30">
                      📍 Gjemt i: {dag.beste_rom}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block">
        {pages.map((pageCards, pageIndex) => (
          <div key={pageIndex} className="print:break-after-page print:p-8">
            <div className="print:grid print:grid-cols-2 print:gap-6">
              {pageCards.map((dag) => (
                <div
                  key={dag.dag}
                  className="print:border-4 print:border-dashed print:border-gray-400 print:p-3 print:h-64 print:flex print:flex-col"
                >
                  {/* Parent info - outside the final note */}
                  <div className="print:text-center print:mb-2">
                    <div className="print:text-sm print:font-bold print:uppercase">
                      {dag.tittel}
                    </div>
                  </div>

                  {/* THE FINAL NOTE FOR KIDS - solid border */}
                  <div className="print:border-4 print:border-solid print:border-black print:p-3 print:bg-gray-50 print:flex-1 print:flex print:flex-col print:relative">
                    {/* Day number badge - smaller, inside note */}
                    <div className="print:absolute print:top-2 print:right-2 print:w-8 print:h-8 print:bg-red-600 print:border-2 print:border-black print:flex print:items-center print:justify-center">
                      <span className="print:text-lg print:font-bold print:text-yellow-400">
                        {dag.dag}
                      </span>
                    </div>

                    {/* NisseKomm branding header */}
                    <div className="print:text-center print:mb-3 print:pb-2 print:border-b-2 print:border-black">
                      <div className="print:text-sm print:font-bold print:tracking-wider">
                        ▬▬ NISSEKOMM ▬▬
                      </div>
                      <div className="print:text-[8px] print:font-mono print:text-gray-600">
                        [NORDPOL KOMMUNIKASJONSSYSTEM]
                      </div>
                    </div>

                    {/* Message only */}
                    <div className="print:text-center print:flex-1 print:flex print:items-center print:justify-center">
                      <div className="print:text-base print:leading-snug print:font-bold">
                        &quot;{dag.fysisk_ledetekst}&quot;
                      </div>
                    </div>
                  </div>

                  {/* Parent reference - outside the final note */}
                  <div className="print:text-center print:text-xs print:text-gray-600 print:mt-2 print:pt-1 print:border-t print:border-gray-300">
                    📍 Gjemt i: {dag.beste_rom}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Print instructions page at the end */}
        <div className="print:break-after-page print:p-12">
          <div className="print:max-w-2xl print:mx-auto">
            <h1 className="print:text-4xl print:font-bold print:text-center print:mb-6">
              📋 OPPSETTSINSTRUKSJONER
            </h1>

            <div className="print:mb-6">
              <h2 className="print:text-2xl print:font-bold print:mb-3">
                🎯 Hvordan bruke disse kortene:
              </h2>
              <ol className="print:space-y-2 print:text-base print:list-decimal print:list-inside">
                <li>Klipp ut hvert kort langs de stiplede linjene</li>
                <li>Gjør deg kjent med dagens oppsett i Nissemor-guiden</li>
                <li>Sett opp Rampenissen-scenen som beskrevet</li>
                <li>Plasser det fysiske kortet på angitt sted</li>
                <li>Sørg for at barna sjekker NISSEMAIL i appen hver morgen</li>
              </ol>
            </div>

            <div className="print:mb-6">
              <h2 className="print:text-2xl print:font-bold print:mb-3">
                💡 Tips for best resultat:
              </h2>
              <ul className="print:space-y-2 print:text-base print:list-disc print:list-inside">
                <li>Bruk farget papir (rødt/grønt) for ekstra julestemning</li>
                <li>
                  Brett kortene som små brev for å gjøre dem mer spennende
                </li>
                <li>Rull dem sammen og fest med bånd eller teip</li>
                <li>Skjul kortene godt - det er moro å lete litt!</li>
                <li>Hold denne utskriften skjult fra barna</li>
              </ul>
            </div>

            <div className="print:border-4 print:border-black print:p-4 print:bg-gray-100">
              <h2 className="print:text-xl print:font-bold print:mb-2">
                ⚠️ VIKTIG PÅMINNELSE:
              </h2>
              <p className="print:text-base">
                Hvert kort må settes opp kvelden før eller tidlig om morgenen.
                Sjekk Nissemor-guiden for detaljer om hvordan Rampenissen skal
                ha rotet til! Kodene barna finner må tastes inn i KodeTerminal i
                appen.
              </p>
            </div>

            <div className="print:text-center print:mt-8 print:text-gray-500">
              <p className="print:text-sm">NisseKomm v1.0 - God Jul! 🎅</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PrintoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <PrintoutContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useMemo } from "react";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";

const allOppdrag = GameEngine.getAllQuests();

function HandlelisteContent() {
  // Aggregate all materials with day tracking
  const materialerMedDager = useMemo(() => {
    const materialMap = new Map<
      string,
      { material: string; dager: number[]; kategori: string }
    >();

    allOppdrag.forEach((quest) => {
      quest.materialer_nødvendig.forEach((material) => {
        const normalized = material.toLowerCase().trim();

        // Determine category based on material type
        let kategori = "Diverse";
        if (
          normalized.includes("papir") ||
          normalized.includes("lapp") ||
          normalized.includes("kort") ||
          normalized.includes("brev")
        ) {
          kategori = "Papir & Skriving";
        } else if (
          normalized.includes("pynt") ||
          normalized.includes("julepynt") ||
          normalized.includes("glitter") ||
          normalized.includes("bånd") ||
          normalized.includes("snor")
        ) {
          kategori = "Julepynt & Dekorasjon";
        } else if (
          normalized.includes("godteri") ||
          normalized.includes("sjokolade") ||
          normalized.includes("kakao") ||
          normalized.includes("pepperkake")
        ) {
          kategori = "Mat & Godteri";
        } else if (
          normalized.includes("leke") ||
          normalized.includes("figur") ||
          normalized.includes("dukke")
        ) {
          kategori = "Leker & Figurer";
        } else if (
          normalized.includes("tape") ||
          normalized.includes("saks") ||
          normalized.includes("lim") ||
          normalized.includes("penn") ||
          normalized.includes("tusj")
        ) {
          kategori = "Verktøy & Utstyr";
        } else if (
          normalized.includes("klær") ||
          normalized.includes("sko") ||
          normalized.includes("sokk") ||
          normalized.includes("vott")
        ) {
          kategori = "Klær & Tekstiler";
        }

        if (materialMap.has(normalized)) {
          const existing = materialMap.get(normalized)!;
          existing.dager.push(quest.dag);
        } else {
          materialMap.set(normalized, {
            material,
            dager: [quest.dag],
            kategori,
          });
        }
      });
    });

    // Group by category
    const grouped = new Map<string, typeof materialMap>();
    materialMap.forEach((value, key) => {
      if (!grouped.has(value.kategori)) {
        grouped.set(value.kategori, new Map());
      }
      grouped.get(value.kategori)!.set(key, value);
    });

    return grouped;
  }, []);

  // Sort categories by importance
  const sortedCategories = useMemo(() => {
    const order = [
      "Papir & Skriving",
      "Verktøy & Utstyr",
      "Julepynt & Dekorasjon",
      "Mat & Godteri",
      "Leker & Figurer",
      "Klær & Tekstiler",
      "Diverse",
    ];

    return Array.from(materialerMedDager.keys()).sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [materialerMedDager]);

  // Calculate total unique items
  const totalItems = useMemo(() => {
    let count = 0;
    materialerMedDager.forEach((items) => {
      count += items.size;
    });
    return count;
  }, [materialerMedDager]);

  // Get category icon
  const getCategoryIcon = (kategori: string) => {
    switch (kategori) {
      case "Papir & Skriving":
        return "📝";
      case "Verktøy & Utstyr":
        return "🔧";
      case "Julepynt & Dekorasjon":
        return "🎄";
      case "Mat & Godteri":
        return "🍬";
      case "Leker & Figurer":
        return "🧸";
      case "Klær & Tekstiler":
        return "👕";
      default:
        return "📦";
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="handleliste" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🛒 HANDLEKURV-LISTE
        </h1>
        <p className="text-center text-xl opacity-70">
          Alle materialer for hele desember samlet på ett sted
        </p>
      </div>

      {/* Summary Stats */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--neon-green) mb-2">
                {totalItems}
              </div>
              <div className="text-lg">Unike Materialer</div>
            </div>
          </div>

          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--cold-blue) mb-2">
                {sortedCategories.length}
              </div>
              <div className="text-lg">Kategorier</div>
            </div>
          </div>

          <div className="border-4 border-(--gold) bg-(--gold)/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-(--gold) mb-2">24</div>
              <div className="text-lg">Dager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Box */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
          <h2 className="text-2xl font-bold text-(--gold) mb-3 text-center">
            💡 HANDLETIPS
          </h2>
          <ul className="space-y-2 text-lg">
            <li>
              ✓ Handle inn generelle materialer (papir, tape, penn) med en gang
            </li>
            <li>
              ✓ Mat og godteri kan kjøpes nærmere aktuelle dager (se dagnummer)
            </li>
            <li>
              ✓ Spesielle gjenstander (f.eks. spesifikke leker) må planlegges i
              forveien
            </li>
            <li>✓ Sjekk hva dere allerede har hjemme før du handler!</li>
          </ul>
        </div>
      </div>

      {/* Materials by Category */}
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {sortedCategories.map((kategori) => {
          const items = materialerMedDager.get(kategori)!;
          const sortedItems = Array.from(items.entries()).sort((a, b) =>
            a[1].material.localeCompare(b[1].material),
          );

          return (
            <div key={kategori} className="border-4 border-(--neon-green)">
              {/* Category Header */}
              <div className="p-4 bg-(--neon-green) text-black">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <span>{getCategoryIcon(kategori)}</span>
                  <span>{kategori}</span>
                  <span className="text-xl opacity-70">
                    ({items.size} {items.size === 1 ? "item" : "items"})
                  </span>
                </h2>
              </div>

              {/* Category Items */}
              <div className="p-4 space-y-2">
                {sortedItems.map(([key, { material, dager }]) => (
                  <div
                    key={key}
                    className="border-2 border-(--neon-green)/50 bg-black/30 p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <span className="text-xl font-bold">{material}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {dager.length > 1 && (
                        <span className="text-(--christmas-red) text-sm font-bold">
                          Brukes {dager.length}x
                        </span>
                      )}
                      <div className="flex gap-1">
                        {dager.slice(0, 5).map((dag) => (
                          <span
                            key={dag}
                            className="bg-(--gold) text-black px-2 py-1 text-sm font-bold"
                          >
                            {dag}
                          </span>
                        ))}
                        {dager.length > 5 && (
                          <span className="text-(--gold) px-2 py-1 text-sm">
                            +{dager.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Button */}
      <div className="max-w-7xl mx-auto text-center pb-8">
        <button
          onClick={() => window.print()}
          className="bg-(--neon-green) text-black font-bold text-2xl py-4 px-8 border-4 border-(--neon-green) hover:opacity-80 transition-opacity"
        >
          🖨️ SKRIV UT LISTE
        </button>
        <p className="mt-3 text-sm opacity-70">
          Du kan skrive ut denne listen og ta den med deg til butikken
        </p>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto text-center opacity-70 text-sm pb-8">
        <p>NisseKomm v1.0 - Handlekurv-liste</p>
      </div>
    </div>
  );
}

export default function Handleliste() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <HandlelisteContent />
      </GuideAuth>
    </Suspense>
  );
}

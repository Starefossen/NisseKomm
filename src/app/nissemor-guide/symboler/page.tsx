"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import {
  getAllSymbols,
  collectSymbolByCode,
  getCollectedSymbols,
  clearCollectedSymbols,
  addCollectedSymbol,
} from "@/lib/systems/symbol-system";
import { GameEngine } from "@/lib/game-engine";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { Icon } from "@/lib/icons";

/**
 * Symbol Management & Printout Page
 *
 * Central hub for symbol collection system:
 * - Print QR code cards with embedded symbol icons
 * - Manual symbol addition (parent controls)
 * - View collection status
 * - Instructions for physical treasure hunt
 */

type SymbolColor = "green" | "red" | "blue";

function SymbolerContent() {
  const [collectedSymbols, setCollectedSymbols] = useState(() =>
    getCollectedSymbols(),
  );
  const [qrCodes, setQrCodes] = useState<Map<string, QRCodeStyling>>(new Map());
  const qrRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allSymbols = getAllSymbols();

  // Listen for storage changes to auto-update symbol collection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nissekomm-collected-symbols") {
        setCollectedSymbols(getCollectedSymbols());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Generate QR codes on mount
  useEffect(() => {
    const newQrCodes = new Map<string, QRCodeStyling>();

    allSymbols.forEach(async (symbol) => {
      const color =
        symbol.symbolColor === "green"
          ? "#00ff00"
          : symbol.symbolColor === "red"
            ? "#ff0000"
            : symbol.symbolColor === "blue"
              ? "#00ddff"
              : "#ffd700";

      // Fetch the SVG and color it
      const iconUrl = `https://unpkg.com/pixelarticons@1.8.1/svg/${symbol.symbolIcon}.svg`;

      try {
        const response = await fetch(iconUrl);
        const svgText = await response.text();
        // Replace black with the symbol color and remove any white/fill
        const coloredSvg = svgText
          .replace(/fill="[^"]*"/g, `fill="${color}"`)
          .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
          .replace(/#000000/g, color)
          .replace(/#ffffff/g, "none");

        const blob = new Blob([coloredSvg], { type: "image/svg+xml" });
        const coloredIconUrl = URL.createObjectURL(blob);

        const qrCode = new QRCodeStyling({
          width: 200,
          height: 200,
          type: "svg",
          data: symbol.symbolId, // The code to scan (e.g., "heart-green")
          dotsOptions: {
            color: "#000000", // Black QR code dots
            type: "square",
          },
          cornersSquareOptions: {
            color: "#000000", // Black corners
            type: "square",
          },
          cornersDotOptions: {
            color: "#000000", // Black corner dots
            type: "square",
          },
          backgroundOptions: {
            color: "#ffffff", // White background for contrast
          },
          image: coloredIconUrl,
          imageOptions: {
            crossOrigin: "anonymous",
            margin: 2,
            imageSize: 0.6, // 60% of QR code
            hideBackgroundDots: true,
            saveAsBlob: false,
          },
          qrOptions: {
            errorCorrectionLevel: "H", // High error correction to allow for image overlay
          },
        });

        newQrCodes.set(symbol.symbolId, qrCode);
        setQrCodes(new Map(newQrCodes));
      } catch (error) {
        console.error(`Failed to load icon for ${symbol.symbolId}:`, error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Render QR codes when refs are ready
  useEffect(() => {
    qrCodes.forEach((qrCode, symbolId) => {
      const container = qrRefs.current.get(symbolId);
      if (container) {
        container.innerHTML = ""; // Clear previous render
        qrCode.append(container);
      }
    });
  }, [qrCodes]);

  const handleAddSymbol = () => {
    const remaining = allSymbols.filter(
      (s) => !collectedSymbols.some((c) => c.symbolId === s.symbolId),
    );

    if (remaining.length === 0) {
      alert("✓ Alle symboler er allerede samlet!");
      return;
    }

    const symbolList = remaining
      .map((s, i) => `${i + 1}. ${s.description} (${s.symbolId})`)
      .join("\n");

    const choice = prompt(
      `Velg symbol å legge til:\n\n${symbolList}\n\nSkriv inn symbolId (f.eks. "heart-green"):`,
    );

    if (choice) {
      const result = collectSymbolByCode(choice);
      if (result.success) {
        alert(`✓ ${result.message}`);
        setCollectedSymbols(getCollectedSymbols());
      } else {
        alert(`✗ ${result.message}`);
      }
    }
  };

  const handleViewStatus = () => {
    const symbolStatus = allSymbols.map((s) => {
      const isCollected = collectedSymbols.some(
        (c) => c.symbolId === s.symbolId,
      );
      return `${isCollected ? "✓" : "☐"} ${s.description} (${s.symbolId})`;
    });

    alert(
      `📊 SYMBOLSAMLING (${collectedSymbols.length}/9):\n\n${symbolStatus.join("\n")}\n\n${
        collectedSymbols.length === 9
          ? "🎉 Alle symboler samlet!"
          : `Mangler ${9 - collectedSymbols.length} symboler.`
      }`,
    );
  };

  const toggleSymbolCollection = (symbolId: string) => {
    const symbol = allSymbols.find((s) => s.symbolId === symbolId);
    if (!symbol) return;

    const isCollected = collectedSymbols.some((c) => c.symbolId === symbolId);

    if (isCollected) {
      // Remove symbol
      clearCollectedSymbols();
      const remaining = collectedSymbols.filter((c) => c.symbolId !== symbolId);
      remaining.forEach((s) => addCollectedSymbol(s));
      setCollectedSymbols(remaining);
    } else {
      // Add symbol
      addCollectedSymbol(symbol);
      setCollectedSymbols([...collectedSymbols, symbol]);
    }
  };

  const getColorClass = (color: SymbolColor): string => {
    switch (color) {
      case "green":
        return "text-(--neon-green) border-(--neon-green)";
      case "red":
        return "text-(--christmas-red) border-(--christmas-red)";
      case "blue":
        return "text-(--cold-blue) border-(--cold-blue)";
    }
  };

  return (
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-4 md:p-8">
      <GuideNavigation currentPage="symboler" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          🎁 SYMBOLSAMLING & NISSEKRYPTO
        </h1>
        <p className="text-center text-xl opacity-70">
          QR-kort for skattejakt og dekryptering
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Info Box */}
        <div className="mb-6">
          <div className="border-4 border-(--gold) bg-(--gold)/10 p-6">
            <h2 className="text-2xl font-bold text-(--gold) mb-3 text-center">
              🔐 OM SYMBOLSAMLING & NISSEKRYPTO
            </h2>
            <ul className="space-y-2 text-lg">
              <li>✓ Fysisk skattejakt kombinert med digital dekryptering</li>
              <li>✓ Foreldre printer og gjemmer 9 symbolkort rundt i huset</li>
              <li>
                ✓ Barna finner kort og scanner QR-koder (eller skriver koder
                manuelt)
              </li>
              <li>
                ✓ Når nok symboler er samlet, låses dekrypteringsutfordringer
                opp
              </li>
              <li>
                ✓ 3 økende vanskelighetsgrader: 3 symboler → 6 symboler → 9
                symboler
              </li>
              <li>✓ Fullføring av alle utfordringer gir "Kode-Mester" merke</li>
            </ul>
          </div>
        </div>

        {/* Symbol Hiding Schedule */}
        <div className="mb-6 print:hidden">
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6">
            <h2 className="text-2xl font-bold text-(--cold-blue) mb-3 text-center">
              📅 GJEMMESKJEMA (Når skal hvert symbol gjemmes?)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allSymbols.map((symbol) => {
                const questWithSymbol = GameEngine.getAllQuests().find(
                  (q) => q.symbol_clue?.symbolId === symbol.symbolId,
                );
                const isCollected = collectedSymbols.some(
                  (c) => c.symbolId === symbol.symbolId,
                );

                return (
                  <div
                    key={symbol.symbolId}
                    className={`border-2 ${isCollected ? "border-(--gold) bg-(--gold)/20" : "border-(--gray) bg-black/30"} p-3`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name={symbol.symbolIcon}
                        size={24}
                        className={`text-(--${symbol.symbolColor === "green" ? "neon-green" : symbol.symbolColor === "red" ? "christmas-red" : "cold-blue"})`}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm">
                          {symbol.description}
                        </p>
                        {questWithSymbol && (
                          <p className="text-xs opacity-70">
                            Gjem dag {questWithSymbol.dag} -{" "}
                            {questWithSymbol.tittel}
                          </p>
                        )}
                      </div>
                      {isCollected && (
                        <span className="text-(--gold) text-xl">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm opacity-70 mt-4">
              💡 Tips: Du kan gjemme alle symbolene på dag 1, eller gjemme dem
              gradvis når hvert oppdrag starter
            </p>
          </div>
        </div>

        {/* Parent Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
          <button
            onClick={handleAddSymbol}
            className="p-4 bg-purple-700 hover:bg-purple-600 text-white font-bold text-lg border-2 border-black transition-colors"
          >
            ➕ LEGG TIL ETT SYMBOL
            <p className="text-sm font-normal mt-2 opacity-80">
              Manuell tillegg hvis QR ikke virker
            </p>
          </button>

          <button
            onClick={handleViewStatus}
            className="p-4 bg-purple-800 hover:bg-purple-700 text-white font-bold text-lg border-2 border-black transition-colors"
          >
            📊 VIS STATUS
            <p className="text-sm font-normal mt-2 opacity-80">
              {collectedSymbols.length}/9 symboler samlet
            </p>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  "Print alle 9 symbolkort? Sørg for at skriveren er klar.",
                )
              ) {
                window.print();
              }
            }}
            className="p-4 bg-(--neon-green) hover:bg-(--gold) text-black font-bold text-lg border-2 border-black transition-colors"
          >
            🖨️ PRINT ALLE KORT
            <p className="text-sm font-normal mt-2 opacity-80">
              Åpner print-dialog
            </p>
          </button>
        </div>

        {/* Symbol Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-3">
          {allSymbols.map((symbol) => {
            const parts = symbol.symbolId.split("-");
            const symbolType = parts[0];
            const color = parts[1] as SymbolColor;
            const colorClass = getColorClass(color);
            const isCollected = collectedSymbols.some(
              (c) => c.symbolId === symbol.symbolId,
            );

            // Find which day this symbol appears
            const questWithSymbol = GameEngine.getAllQuests().find(
              (q) => q.symbol_clue?.symbolId === symbol.symbolId,
            );

            const label = `${
              symbolType === "heart"
                ? "Hjerte"
                : symbolType === "sun"
                  ? "Sol"
                  : "Måne"
            } (${
              color === "green" ? "Grønn" : color === "red" ? "Rød" : "Blå"
            })`;

            return (
              <div
                key={symbol.symbolId}
                onClick={() => toggleSymbolCollection(symbol.symbolId)}
                className={`border-4 border-dashed ${colorClass} p-6 bg-black/50 rounded-lg print:break-inside-avoid print:p-3 relative cursor-pointer hover:opacity-80 transition-opacity print:cursor-default ${
                  isCollected ? "ring-4 ring-(--gold)" : ""
                }`}
              >
                {/* Collection Status Badge (screen only) */}
                <div className="absolute top-2 right-2 print:hidden">
                  {isCollected ? (
                    <div className="bg-(--gold) text-black px-2 py-1 text-xs font-bold rounded">
                      ✓ SAMLET
                    </div>
                  ) : (
                    <div className="bg-gray-700 text-(--gray) px-2 py-1 text-xs font-bold rounded">
                      ☐ IKKE SAMLET
                    </div>
                  )}
                </div>

                {/* Day Number (subtle, top-left) */}
                {questWithSymbol && (
                  <div className="absolute top-2 left-2 text-xs text-(--gray) opacity-50">
                    {questWithSymbol.dag}
                  </div>
                )}

                {/* Card Header */}
                <div className="text-center mb-4">
                  <h3 className={`text-2xl font-bold ${colorClass} mb-2`}>
                    {label}
                  </h3>
                </div>

                {/* QR Code with embedded colored symbol */}
                <div className="flex justify-center mb-4">
                  <div
                    ref={(el) => {
                      if (el) qrRefs.current.set(symbol.symbolId, el);
                    }}
                    className="flex items-center justify-center"
                  />
                </div>

                {/* Manual Code */}
                <div className="text-center">
                  <p className="text-sm text-(--gray) mb-1">Manuell kode:</p>
                  <p
                    className={`text-lg font-bold ${colorClass} tracking-wider`}
                  >
                    {symbol.symbolId.toUpperCase()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-12 text-center text-(--gray) print:hidden">
          <p>
            Trykk <strong>Ctrl+P</strong> (Windows) eller <strong>Cmd+P</strong>{" "}
            (Mac) for å skrive ut
          </p>
          <p className="mt-2 text-xs">
            Tips: Print på tykt papir eller laminer kortene for bedre holdbarhet
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SymbolerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] flex items-center justify-center">
          <div className="text-2xl">Laster...</div>
        </div>
      }
    >
      <GuideAuth>
        <SymbolerContent />
      </GuideAuth>
    </Suspense>
  );
}

"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { GameEngine } from "@/lib/game-engine";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { Icon, iconSrc } from "@/lib/icons";

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
    GameEngine.getCollectedSymbols(),
  );
  const [qrCodes, setQrCodes] = useState<Map<string, QRCodeStyling>>(new Map());
  const qrRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allSymbols = GameEngine.getAllSymbols();

  // Listen for storage changes to auto-update symbol collection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nissekomm-collected-symbols") {
        setCollectedSymbols(GameEngine.getCollectedSymbols());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Generate QR codes on mount
  useEffect(() => {
    const newQrCodes = new Map<string, QRCodeStyling>();

    const loadQRCode = async (symbol: (typeof allSymbols)[0]) => {
      const color =
        symbol.symbolColor === "green"
          ? "#00ff00"
          : symbol.symbolColor === "red"
            ? "#ff0000"
            : symbol.symbolColor === "blue"
              ? "#00ddff"
              : "#ffd700";

      // Fetch the SVG and color it
      const iconUrl = iconSrc(symbol.symbolIcon);

      // Without the icon the card still needs a scannable QR
      let dataUrl: string | undefined;
      try {
        const response = await fetch(iconUrl);
        const svgText = await response.text();
        // Replace black with the symbol color and remove any white/fill
        const coloredSvg = svgText
          .replace(/fill="[^"]*"/g, `fill="${color}"`)
          .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
          .replace(/#000000/g, color)
          .replace(/#ffffff/g, "none");

        // Convert SVG to data URL for better canvas compatibility
        const svgBase64 = btoa(unescape(encodeURIComponent(coloredSvg)));
        dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

        // Pre-load the image to ensure it's ready before QR code renders
        const img = new Image();
        img.src = dataUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } catch (error) {
        console.warn(
          `Ikon mangler for ${symbol.symbolId}, QR uten ikon`,
          error,
        );
        dataUrl = undefined;
      }

      const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        type: "canvas", // Use canvas instead of SVG for better print compatibility
        data: GameEngine.getSymbolQrPayload(symbol.symbolId),
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
        image: dataUrl, // Use data URL instead of blob URL
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 2,
          imageSize: 0.4, // larger icons made phones miss the code
          hideBackgroundDots: true,
          saveAsBlob: false,
        },
        qrOptions: {
          errorCorrectionLevel: "H", // High error correction to allow for image overlay
        },
      });

      newQrCodes.set(symbol.symbolId, qrCode);
      setQrCodes(new Map(newQrCodes));
    };

    // Load all QR codes
    allSymbols.forEach(loadQRCode);
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

  const toggleSymbolCollection = (symbolId: string) => {
    const symbol = allSymbols.find((s) => s.symbolId === symbolId);
    if (!symbol) return;

    const isCollected = collectedSymbols.some((c) => c.symbolId === symbolId);

    if (isCollected) {
      // Remove symbol
      GameEngine.clearCollectedSymbols();
      const remaining = collectedSymbols.filter((c) => c.symbolId !== symbolId);
      remaining.forEach((s) => GameEngine.addCollectedSymbol(s));
      setCollectedSymbols(remaining);
    } else {
      // Add symbol
      GameEngine.addCollectedSymbol(symbol);
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
    <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) p-4 md:p-8 print:p-0 print:bg-white">
      <div className="print:hidden">
        <GuideNavigation />
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-wider">
          SYMBOLKORT
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Symbol Hiding Schedule */}
        <div className="mb-6 print:hidden">
          <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-6">
            <h2 className="text-2xl font-bold text-(--cold-blue) mb-3 text-center">
              GJEMMESKJEMA
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
                        className={
                          symbol.symbolColor === "green"
                            ? "text-(--neon-green)"
                            : symbol.symbolColor === "red"
                              ? "text-(--christmas-red)"
                              : "text-(--cold-blue)"
                        }
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm">
                          {symbol.description}
                        </p>
                        {questWithSymbol && (
                          <p className="text-sm">
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
            <p className="text-center mt-4">
              Tips: Du kan gjemme alle symbolene på dag 1, eller gjemme dem
              gradvis når hvert oppdrag starter
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="min-h-11 px-4 bg-(--neon-green) hover:bg-(--gold) text-black font-bold text-lg"
          >
            Skriv ut alle kort
          </button>
          <p>
            {collectedSymbols.length}/9 samlet. Trykk på et kort for å merke det
            som funnet eller ikke funnet.
          </p>
        </div>

        {/* Symbol Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-3 print:gap-1">
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
                className={`border-4 border-dashed ${colorClass} p-6 bg-black/50 rounded-lg print:break-inside-avoid print:p-2 print:h-[90mm] print:flex print:flex-col print:justify-center print:bg-white print:rounded-none relative cursor-pointer hover:opacity-80 transition-opacity print:cursor-default ${
                  isCollected ? "ring-4 ring-(--gold)" : ""
                } print:ring-0`}
              >
                {/* Collection Status Badge (screen only) */}
                <div className="absolute top-2 right-2 print:hidden">
                  {isCollected ? (
                    <div className="bg-(--gold) text-black px-2 py-1 text-sm font-bold rounded">
                      ✓ SAMLET
                    </div>
                  ) : (
                    <div className="bg-gray-700 text-(--gray) px-2 py-1 text-sm font-bold rounded">
                      ☐ IKKE SAMLET
                    </div>
                  )}
                </div>

                {/* Day Number (subtle, top-left) */}
                {questWithSymbol && (
                  <div className="absolute top-2 left-2 text-sm text-(--gray) print:hidden">
                    {questWithSymbol.dag}
                  </div>
                )}

                {/* Card Header */}
                <div className="text-center mb-4 print:mb-2">
                  <h3
                    className={`text-2xl font-bold ${colorClass} mb-2 print:text-black print:text-xl`}
                  >
                    {label}
                  </h3>
                </div>

                {/* QR Code with embedded colored symbol */}
                <div className="flex justify-center mb-4 print:mb-2">
                  <div
                    ref={(el) => {
                      if (el) qrRefs.current.set(symbol.symbolId, el);
                    }}
                    className="flex items-center justify-center print:scale-90"
                  />
                </div>

                {/* Manual Code */}
                <div className="text-center">
                  <p className="text-sm text-(--gray) mb-1 print:hidden">
                    Kode uten kamera:
                  </p>
                  <p
                    data-kortkode={symbol.symbolId}
                    className={`text-3xl font-bold ${colorClass} tracking-[0.3em] print:text-black print:text-2xl`}
                  >
                    {GameEngine.getSymbolShortCode(symbol.symbolId)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center print:hidden">
          Skriv ut på tykt papir eller laminer kortene.
        </p>
      </div>
    </div>
  );
}

export default function SymbolerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--dark-crt) text-(--neon-green) flex items-center justify-center">
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

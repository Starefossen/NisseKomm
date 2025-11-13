"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons, Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";

interface SymbolScannerProps {
  onClose: () => void;
}

/**
 * SymbolScanner - QR Code Scanner and Manual Entry for Symbol Collection
 *
 * PARENT SETUP:
 * - Print 9 symbol cards from /nissemor-guide/symboler page
 * - Each card has QR code + manual entry code (e.g., "heart-green")
 * - Hide cards around house (treasure hunt style)
 * - Kids use camera to scan QR codes OR manually enter codes
 *
 * SCANNING FLOW:
 * 1. Scanner auto-starts on component mount
 * 2. Camera accesses back-facing camera ("environment" mode)
 * 3. QR viewport shows 70% of smaller screen dimension
 * 4. On successful scan:
 *    - Stops camera immediately
 *    - Validates code with GameEngine
 *    - Adds to collection if valid and new
 *    - Shows success feedback for 5 seconds
 *
 * SYMBOL CODES (9 total):
 * - heart-green, heart-red, heart-blue
 * - sun-green, sun-red, sun-blue
 * - moon-green, moon-red, moon-blue
 *
 * CAMERA MANAGEMENT:
 * - Properly stops MediaStream tracks on unmount
 * - Clears DOM elements to prevent memory leaks
 * - Handles permission errors gracefully
 *
 * @see /src/app/nissemor-guide/symboler/page.tsx - Parent QR generation page
 * @see /src/lib/game-engine.ts - collectSymbolByCode() validation logic
 */
export function SymbolScanner({ onClose }: SymbolScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastCollected, setLastCollected] = useState<{
    symbolIcon: string;
    symbolColor: string;
    description: string;
  } | null>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const processingQRRef = useRef(false);

  // Auto-start scanning on mount
  useEffect(() => {
    startScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrReaderRef.current) {
        try {
          const state = qrReaderRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            qrReaderRef.current
              .stop()
              .then(() => {
                // Clear the instance after stopping
                if (qrReaderRef.current) {
                  qrReaderRef.current.clear();
                }
              })
              .catch(() => {
                // Still try to clear even if stop fails
                if (qrReaderRef.current) {
                  try {
                    qrReaderRef.current.clear();
                  } catch {
                    /* Ignore */
                  }
                }
              });
          }
        } catch {
          // Ignore state check errors
        }
      }
    };
  }, []);

  const handleQRScan = async (decodedText: string) => {
    // Prevent multiple simultaneous scans
    if (processingQRRef.current) {
      return;
    }
    processingQRRef.current = true;

    // Stop scanning first
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
        // Clear the instance to release camera
        qrReaderRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      // Set to null for garbage collector
      qrReaderRef.current = null;

      // Clear DOM to remove video elements
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
      }

      setIsScanning(false);
    }

    // Process the scanned code
    await processCode(decodedText);
    processingQRRef.current = false;
  };

  const startScanning = async () => {
    setScannerError(null); // Clear previous errors
    try {
      // Ensure any previous instance is fully stopped
      if (qrReaderRef.current) {
        try {
          await qrReaderRef.current.stop();
          qrReaderRef.current.clear();
        } catch {
          // Ignore errors from stopping previous instance
        }
        qrReaderRef.current = null;
      }

      // Clear DOM element to ensure clean start
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
      }

      setIsScanning(true);

      // Wait for DOM to render the qr-reader element
      await new Promise((resolve) => setTimeout(resolve, 100));

      const qrReader = new Html5Qrcode("qr-reader");
      qrReaderRef.current = qrReader;

      await qrReader.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: (width, height) => {
            const smallerDimension = Math.min(width, height);
            const boxSize = Math.floor(smallerDimension * 0.7); // 70% of smaller dimension
            return { width: boxSize, height: boxSize };
          },
        },
        handleQRScan,
        () => {}, // Ignore scan errors (just keep trying)
      );

      SoundManager.playSound("click");
    } catch (error) {
      console.error("Failed to start QR scanner:", error);
      SoundManager.playSound("error");
      setIsScanning(false);

      // User-friendly error messages
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("Permission") ||
        errorMessage.includes("NotAllowedError")
      ) {
        setScannerError(
          "⚠️ Kamera-tilgang nektet. Vennligst gi tillatelse i nettleserens innstillinger.",
        );
      } else if (
        errorMessage.includes("NotFoundError") ||
        errorMessage.includes("No camera")
      ) {
        setScannerError("📷 Fant ikke kamera. Sjekk at enheten har et kamera.");
      } else {
        setScannerError(
          "❌ Kunne ikke starte kamera. Prøv å laste siden på nytt.",
        );
      }
    }
  };

  const stopScanning = async () => {
    if (qrReaderRef.current) {
      try {
        // First, manually stop the video stream by accessing the video element
        const qrReaderElement = document.getElementById("qr-reader");
        if (qrReaderElement) {
          const videoElement = qrReaderElement.querySelector("video");
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              track.stop();
              stream.removeTrack(track);
            });
            videoElement.srcObject = null;
          }
        }

        // Now call the library's stop method
        await qrReaderRef.current.stop();
        qrReaderRef.current.clear();
      } catch (error) {
        console.error("Failed to stop QR scanner:", error);
        // Force clear even on error
        try {
          if (qrReaderRef.current) {
            qrReaderRef.current.clear();
          }
        } catch {
          // Ignore
        }
      }
      // Set to null to signal garbage collector
      qrReaderRef.current = null;

      // Clear the DOM element completely to remove any remaining video elements
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        qrReaderElement.innerHTML = "";
      }

      SoundManager.playSound("click");
      setIsScanning(false);
    }
  };

  const processCode = async (inputCode: string) => {
    setIsProcessing(true);
    SoundManager.playSound("click");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = GameEngine.collectSymbolByCode(inputCode.trim());

    if (result.success && result.symbol) {
      SoundManager.playSound("success");
      setLastCollected({
        symbolIcon: result.symbol.symbolIcon,
        symbolColor: result.symbol.symbolColor,
        description: result.symbol.description,
      });
      setTimeout(() => {
        setLastCollected(null);
      }, 5000);
    } else {
      SoundManager.playSound("error");
    }

    setIsProcessing(false);
  };

  return (
    <RetroWindow title="SYMBOLSKANNER - QR KODE LESER" onClose={onClose}>
      <style jsx global>{`
        #qr-reader {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        #qr-reader > div {
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        #qr-reader canvas {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
        }
      `}</style>
      <div className="flex flex-col h-full p-4 space-y-4">
        {/* Error Display */}
        {scannerError && (
          <div className="border-4 border-(--christmas-red) bg-(--christmas-red)/20 p-4 text-(--christmas-red) animate-[red-shake_0.5s_ease-in-out]">
            <div className="font-bold mb-1">KAMERA-FEIL</div>
            <div className="text-sm">{scannerError}</div>
            <button
              onClick={() => {
                setScannerError(null);
                startScanning();
              }}
              className="mt-3 px-4 py-2 border-2 border-(--christmas-red) hover:bg-(--christmas-red)/10 text-sm font-bold"
            >
              PRØV IGJEN
            </button>
          </div>
        )}

        {/* QR Scanner - Full height */}
        <div className="flex-1 flex flex-col min-h-0">
          {isScanning ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div
                id="qr-reader"
                className="flex-1 border-4 border-(--neon-green) overflow-hidden relative"
                style={{
                  maxHeight: "calc(100vh - 200px)",
                }}
              ></div>
              <button
                onClick={stopScanning}
                className="w-full px-6 py-3 bg-(--christmas-red) hover:bg-(--christmas-red)/80 text-white font-bold border-4 border-black transition-colors shrink-0"
              >
                STOPP SKANNING
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-(--neon-green)/30 p-8">
              <div className="text-center space-y-2">
                <div className="text-(--neon-green) text-lg font-bold">
                  📷 KLAR FOR Å SKANNE?
                </div>
                <div className="text-(--neon-green)/70 text-sm max-w-md">
                  Hold QR-koden fra symbolkortet foran kameraet. Skanningen
                  starter automatisk når koden oppdages.
                </div>
              </div>
              <button
                onClick={startScanning}
                disabled={isProcessing}
                className="px-8 py-6 bg-(--cold-blue) hover:bg-(--cold-blue)/80 disabled:bg-(--gray) text-black font-bold text-xl border-4 border-black transition-colors flex items-center gap-3"
              >
                <Icons.Camera size={32} color="gray" />
                START KAMERA
              </button>
              <div className="text-xs text-(--neon-green)/50 text-center max-w-xs">
                Tips: Sørg for god belysning og hold kameraet støtt
              </div>
            </div>
          )}
        </div>

        {/* Last Collected Symbol Preview */}
        {lastCollected && (
          <div className="border-4 border-(--gold) bg-(--gold)/20 p-4 animate-[gold-flash_1s_ease-in-out]">
            <div className="flex items-center gap-3">
              <Icon
                name={lastCollected.symbolIcon}
                size={48}
                color={
                  lastCollected.symbolColor as
                    | "green"
                    | "red"
                    | "blue"
                    | "gold"
                    | "gray"
                }
              />
              <div>
                <div className="text-lg font-bold text-(--gold)">
                  NYTT SYMBOL!
                </div>
                <div className="text-xs opacity-80">
                  {lastCollected.description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RetroWindow>
  );
}

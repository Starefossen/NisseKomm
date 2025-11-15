"use client";

import { useState, useEffect, DragEvent, TouchEvent } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons, Icon } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";
import { GameEngine } from "@/lib/game-engine";
import { DecryptionSymbol } from "@/types/innhold";
import { SymbolScanner } from "./SymbolScanner";

/**
 * NisseKrypto - Symbol Decryption Challenge System
 *
 * GAME MECHANIC:
 * 1. Kids collect 9 physical symbol cards (printed with QR codes)
 * 2. Scan cards using SymbolScanner to add to digital collection
 * 3. Solve 3 progressive decryption challenges by arranging symbols:
 *    - Challenge 1 (Day 12): 3 hearts → "Frosne Koder"
 *    - Challenge 2 (Day 18): 6 symbols (hearts + suns) → "Stjernetegn"
 *    - Challenge 3 (Day 23): All 9 symbols → "Hjertets Hemmelighet"
 * 4. Each solved challenge unlocks secret files in NisseNet
 *
 * SYMBOLS:
 * - 3 Hearts (green, red, blue) - Represents love/connection
 * - 3 Suns (green, red, blue) - Represents hope/light
 * - 3 Moons (green, red, blue) - Represents calm/mystery
 *
 * MODULE UNLOCK:
 * - Desktop icon appears after completing Day 9 quest
 * - Challenges become available as symbols are collected
 *
 * DESIGN PHILOSOPHY:
 * - Physical-digital bridge (treasure hunt + puzzle solving)
 * - Progressive difficulty (3 → 6 → 9 symbols)
 * - Family collaboration (parents hide cards, kids solve puzzles)
 * - Narrative integration (challenges tied to Snøfall storyline)
 */

interface NisseKryptoProps {
  onClose: () => void;
}

interface Challenge {
  challengeId: string;
  day: number;
  title: string;
  hint: string;
  requiredSymbols: DecryptionSymbol[];
  sequenceLength: number;
  isSolved: boolean;
  attempts: number;
}

export function NisseKrypto({ onClose }: NisseKryptoProps) {
  const [collectedSymbols, setCollectedSymbols] = useState<DecryptionSymbol[]>(
    [],
  );
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>(
    [],
  );
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const [challengeGrid, setChallengeGrid] = useState<
    (DecryptionSymbol | null)[]
  >(Array(9).fill(null));
  const [draggedSymbol, setDraggedSymbol] = useState<DecryptionSymbol | null>(
    null,
  );
  const [touchedSymbol, setTouchedSymbol] = useState<DecryptionSymbol | null>(
    null,
  );
  const [touchIdentifier, setTouchIdentifier] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [positionFeedback, setPositionFeedback] = useState<
    Array<"correct" | "wrong" | "empty">
  >([]);
  const [showScanner, setShowScanner] = useState(false);

  // Define loadData function for reuse
  const loadData = () => {
    // Load collected symbols
    const symbols = GameEngine.getCollectedSymbols();
    setCollectedSymbols(symbols);

    // Load available challenges
    const allQuests = GameEngine.getAllQuests();
    const challenges: Challenge[] = [];

    allQuests.forEach((quest) => {
      if (quest.decryption_challenge) {
        const challenge = quest.decryption_challenge;

        // Check if all required symbols are collected
        const requiredSymbols = symbols.filter((s) =>
          challenge.requiredSymbols.includes(s.symbolId),
        );

        if (requiredSymbols.length === challenge.requiredSymbols.length) {
          const isSolved = GameEngine.isDecryptionSolved(challenge.challengeId);

          challenges.push({
            challengeId: challenge.challengeId,
            day: quest.dag,
            title: quest.tittel,
            hint: challenge.messageWhenSolved || "Plasser symbolene riktig",
            requiredSymbols,
            sequenceLength: challenge.correctSequence.length,
            isSolved,
            attempts: 0,
          });
        }
      }
    });

    setAvailableChallenges(challenges);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
    });
  }, []);

  const handleChallengeSelect = (challenge: Challenge) => {
    SoundManager.playSound("click");
    setSelectedChallenge(challenge);
    setChallengeGrid(Array(9).fill(null));
    setFeedback("");
    setAttemptCount(0);
    setPositionFeedback([]);
  };

  // Drag and drop handlers
  const handleDragStart = (symbol: DecryptionSymbol) => {
    setDraggedSymbol(symbol);
    SoundManager.playSound("click");
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (position: number) => {
    if (!draggedSymbol || !selectedChallenge) return;

    const newGrid = [...challengeGrid];
    newGrid[position] = draggedSymbol;
    setChallengeGrid(newGrid);
    setDraggedSymbol(null);
    setPositionFeedback([]);
    SoundManager.playSound("click");
  };

  // Touch event handlers for mobile/tablet support
  const handleTouchStart = (
    e: TouchEvent<HTMLDivElement>,
    symbol: DecryptionSymbol,
  ) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      setTouchedSymbol(symbol);
      setTouchIdentifier(touch.identifier);
      SoundManager.playSound("click");
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Touch move is handled to prevent scrolling during drag
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchedSymbol || !selectedChallenge || touchIdentifier === null)
      return;

    const touch = e.changedTouches[0];
    if (touch && touch.identifier === touchIdentifier) {
      // Check if touch ended over a valid drop zone
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.hasAttribute("data-drop-zone")) {
        const dropPosition = parseInt(
          element.getAttribute("data-drop-zone") || "-1",
          10,
        );
        if (
          dropPosition >= 0 &&
          dropPosition < selectedChallenge.sequenceLength
        ) {
          const newGrid = [...challengeGrid];
          newGrid[dropPosition] = touchedSymbol;
          setChallengeGrid(newGrid);
          setPositionFeedback([]);
          SoundManager.playSound("click");
        }
      }
    }

    setTouchedSymbol(null);
    setTouchIdentifier(null);
  };

  const handleTouchCancel = () => {
    setTouchedSymbol(null);
    setTouchIdentifier(null);
  };

  const handleClearGrid = () => {
    SoundManager.playSound("click");
    setChallengeGrid(Array(9).fill(null));
    setFeedback("");
    setPositionFeedback([]);
  };

  const handleCheckCode = async () => {
    if (!selectedChallenge) return;

    // Check if grid is complete
    const filledCount = challengeGrid.filter((s) => s !== null).length;
    if (filledCount < selectedChallenge.sequenceLength) {
      setFeedback(
        `⚠️ Fyll ut ${selectedChallenge.sequenceLength} posisjoner først!`,
      );
      SoundManager.playSound("error");
      return;
    }

    setIsProcessing(true);
    SoundManager.playSound("click");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Convert grid to sequence indices
    const userSequence = challengeGrid
      .slice(0, selectedChallenge.sequenceLength)
      .map((symbol) => {
        if (!symbol) return -1;
        return selectedChallenge.requiredSymbols.findIndex(
          (s) => s.symbolId === symbol.symbolId,
        );
      });

    const result = GameEngine.validateDecryptionSequence(
      selectedChallenge.challengeId,
      userSequence,
    );

    setAttemptCount((prev) => prev + 1);

    if (result.correct) {
      SoundManager.playSound("success");
      setFeedback(`✅ ${result.message}`);
      setPositionFeedback(
        Array(selectedChallenge.sequenceLength).fill("correct"),
      );

      // Reload data to update solved status
      setTimeout(() => {
        loadData();
        setSelectedChallenge(null);
        setChallengeGrid(Array(9).fill(null));
        setAttemptCount(0);
      }, 3000);
    } else {
      SoundManager.playSound("error");
      setFeedback(
        `❌ ${result.correctCount || 0}/${selectedChallenge.sequenceLength} riktig plassert`,
      );

      // Show position feedback (for now just mark all as wrong, could be enhanced)
      setPositionFeedback(
        challengeGrid
          .slice(0, selectedChallenge.sequenceLength)
          .map(() => "wrong"),
      );
    }

    setIsProcessing(false);
  };

  // Show scanner overlay
  if (showScanner) {
    return (
      <SymbolScanner
        onClose={() => {
          setShowScanner(false);
          loadData(); // Reload symbols after scanning
        }}
      />
    );
  }

  return (
    <RetroWindow title="NISSEKRYPTO - SYMBOLDEKRYPTERING" onClose={onClose}>
      <div className="p-6 h-full overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Key size={32} color="gold" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">
              DEKRYPTERINGSSENTER
            </div>
            <div className="text-sm opacity-70">Klarer du å løse koden?</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-(--gold) bg-(--gold)/20">
            <div className="w-2 h-2 bg-(--gold) rounded-full animate-pulse-led"></div>
            <span className="text-(--gold) text-xs tracking-wider">
              LÅST OPP DAG 9
            </span>
          </div>
        </div>

        {/* Challenge Selector */}
        {!selectedChallenge && (
          <div className="space-y-3">
            <div className="text-sm tracking-wider text-(--neon-green) border-b-2 border-(--neon-green)/30 pb-2">
              📋 VELG DEKRYPTERINGSUTFORDRING
            </div>

            {availableChallenges.length === 0 ? (
              <div className="text-center py-8 border-2 border-(--neon-green)/20 text-(--neon-green)/50 text-sm">
                <div className="mb-2">🔒</div>
                <div className="font-bold mb-1">
                  Ingen utfordringer tilgjengelig
                </div>
                <div className="text-xs mt-2 opacity-70">
                  Samle flere symboler for å låse opp utfordringer!
                </div>
                <div className="text-xs mt-1">
                  Samlet: {collectedSymbols.length}/9 symboler
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {availableChallenges.map((challenge) => (
                  <button
                    key={challenge.challengeId}
                    onClick={() => handleChallengeSelect(challenge)}
                    disabled={challenge.isSolved}
                    className={`
                      w-full p-4 text-left border-2 transition-all
                      ${
                        challenge.isSolved
                          ? "border-(--gold) bg-(--gold)/10 text-(--gold) cursor-not-allowed"
                          : "border-(--neon-green)/30 hover:border-(--neon-green) hover:bg-(--neon-green)/10 text-(--neon-green)"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {challenge.isSolved ? (
                          <Icons.CheckCircle size={24} color="gold" />
                        ) : (
                          <Icons.LockClosed size={24} color="green" />
                        )}
                        <div className="flex-1">
                          <div className="font-bold tracking-wider text-lg">
                            DAG {challenge.day}: {challenge.title}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            Krever {challenge.sequenceLength} symboler i riktig
                            rekkefølge
                          </div>
                          {/* Show required symbol types */}
                          <div className="flex gap-1 mt-2">
                            {challenge.requiredSymbols
                              .slice(0, 6)
                              .map((symbol, idx) => (
                                <Icon
                                  key={idx}
                                  name={symbol.symbolIcon}
                                  size={16}
                                  color={symbol.symbolColor}
                                />
                              ))}
                            {challenge.requiredSymbols.length > 6 && (
                              <span className="text-xs opacity-50">
                                +{challenge.requiredSymbols.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold">
                        {challenge.isSolved ? "✓ LØST" : "→ START"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Symbol Collection Status */}
            <div className="border-2 border-(--neon-green)/30 bg-(--neon-green)/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-(--neon-green)">
                  <Icons.Chart size={16} color="green" />
                  DIN SAMLING: {collectedSymbols.length}/9 SYMBOLER
                </div>
                <button
                  onClick={() => {
                    SoundManager.playSound("click");
                    setShowScanner(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-(--cold-blue) bg-(--cold-blue)/20 hover:bg-(--cold-blue)/30 text-(--cold-blue) font-bold text-sm transition-all"
                >
                  <Icon name="camera-add" size={16} color="blue" />
                  SKANN SYMBOLER
                </button>
              </div>
              <div className="grid grid-cols-9 gap-1">
                {Array.from({ length: 9 }).map((_, i) => {
                  const symbol = collectedSymbols[i];
                  return (
                    <div
                      key={i}
                      className={`aspect-square border flex items-center justify-center ${
                        symbol
                          ? "border-(--neon-green) bg-(--neon-green)/10"
                          : "border-(--gray)/30 bg-(--gray)/5"
                      }`}
                    >
                      {symbol ? (
                        <Icon
                          name={symbol.symbolIcon}
                          size={24}
                          color={symbol.symbolColor}
                        />
                      ) : (
                        <Icons.Lock size={16} color="gray" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dual Grid Interface */}
        {selectedChallenge && (
          <div className="space-y-4 animate-scale-in">
            {/* Challenge Header */}
            <div className="border-4 border-(--cold-blue) bg-(--cold-blue)/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg text-(--cold-blue)">
                    🔐 {selectedChallenge.title}
                  </div>
                  <div className="text-xs text-(--cold-blue)/60 mt-1">
                    DAG {selectedChallenge.day} •{" "}
                    {selectedChallenge.sequenceLength} symboler nødvendig
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedChallenge(null);
                    setChallengeGrid(Array(9).fill(null));
                    setAttemptCount(0);
                    setFeedback("");
                    setPositionFeedback([]);
                  }}
                  className="text-xs border border-(--cold-blue) px-3 py-1 hover:bg-(--cold-blue)/20 transition-all tracking-wider"
                >
                  ← AVBRYT
                </button>
              </div>
              <div className="text-sm text-(--cold-blue)/80 bg-(--cold-blue)/5 p-2 border-l-2 border-(--cold-blue)">
                💡 <span className="font-bold">Hint:</span>{" "}
                {selectedChallenge.hint}
              </div>
              {attemptCount > 0 && (
                <div className="text-xs text-(--cold-blue)/60 mt-2 flex items-center gap-2">
                  <span>🎯 Forsøk:</span>
                  <span className="font-bold">{attemptCount}</span>
                  {attemptCount > 2 && (
                    <span className="text-(--christmas-red)">
                      • Fortsett å prøve!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Dual 3×3 Grids - responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Left: Inventory Grid */}
              <div className="border-4 border-(--neon-green) bg-black p-3 md:p-4">
                <div className="text-sm tracking-wider text-(--neon-green) mb-3 text-center font-bold">
                  📦 SYMBOLSAMLING
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {collectedSymbols.slice(0, 9).map((symbol, index) => (
                    <div
                      key={symbol?.symbolId || `empty-${index}`}
                      draggable={!!symbol}
                      onDragStart={() => symbol && handleDragStart(symbol)}
                      onTouchStart={(e) =>
                        symbol && handleTouchStart(e, symbol)
                      }
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => symbol && handleTouchEnd(e)}
                      onTouchCancel={handleTouchCancel}
                      className={`
                        aspect-square min-w-12 min-h-12 md:min-w-16 md:min-h-16 border-2 flex flex-col items-center justify-center p-1 md:p-2
                        touch-none
                        ${
                          symbol
                            ? "border-(--neon-green) bg-(--neon-green)/10 cursor-grab active:cursor-grabbing hover:bg-(--neon-green)/20 active:scale-95"
                            : "border-(--gray)/20 bg-(--gray)/5"
                        }
                      `}
                      style={symbol ? {} : { opacity: 0.2 }}
                    >
                      {symbol ? (
                        <>
                          <Icon
                            name={symbol.symbolIcon}
                            size={32}
                            color={symbol.symbolColor}
                            className="md:w-10 md:h-10"
                          />
                          <div className="text-[7px] md:text-[8px] text-(--neon-green) mt-1 text-center uppercase tracking-tight">
                            {symbol.symbolColor}
                          </div>
                        </>
                      ) : (
                        <Icons.Lock
                          size={20}
                          color="gray"
                          className="md:w-6 md:h-6"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-(--neon-green)/60 mt-3 text-center">
                  {collectedSymbols.length}/9 funnet
                </div>
              </div>

              {/* Right: Challenge Grid */}
              <div className="border-4 border-(--cold-blue) bg-black p-3 md:p-4">
                <div className="text-sm tracking-wider text-(--cold-blue) mb-3 text-center font-bold">
                  🔓 DEKRYPTERINGSGITTER
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {challengeGrid.map((symbol, position) => {
                    const isUsed = position < selectedChallenge.sequenceLength;
                    const positionFb = positionFeedback[position];

                    return (
                      <div
                        key={position}
                        data-drop-zone={isUsed ? position : undefined}
                        onDragOver={handleDragOver}
                        onDrop={() => isUsed && handleDrop(position)}
                        onTouchMove={handleTouchMove}
                        className={`
                          aspect-square min-w-12 min-h-12 md:min-w-16 md:min-h-16 border-2 flex flex-col items-center justify-center p-1 md:p-2 relative
                          touch-none
                          ${
                            !isUsed
                              ? "border-(--gray)/20 bg-(--gray)/5"
                              : symbol
                                ? positionFb === "correct"
                                  ? "border-(--gold) bg-(--gold)/20 animate-[gold-flash_1s_ease-in-out]"
                                  : positionFb === "wrong"
                                    ? "border-(--christmas-red) bg-(--christmas-red)/20 animate-[red-shake_0.5s_ease-in-out]"
                                    : "border-(--cold-blue) bg-(--cold-blue)/10"
                                : "border-(--cold-blue) border-dashed bg-(--cold-blue)/5 hover:bg-(--cold-blue)/10"
                          }
                        `}
                      >
                        {/* Position Number */}
                        {isUsed && (
                          <div className="absolute top-1 left-1 text-[10px] text-(--cold-blue)/40">
                            {position + 1}
                          </div>
                        )}

                        {/* Symbol or Placeholder */}
                        {symbol ? (
                          <>
                            <Icon
                              name={symbol.symbolIcon}
                              size={32}
                              color={symbol.symbolColor}
                              className="md:w-10 md:h-10"
                            />
                            <div className="text-[7px] md:text-[8px] text-(--cold-blue) mt-1 uppercase tracking-tight">
                              {symbol.symbolColor}
                            </div>
                          </>
                        ) : isUsed ? (
                          <div className="text-(--cold-blue)/50 text-xl md:text-2xl">
                            ?
                          </div>
                        ) : (
                          <Icons.Lock
                            size={14}
                            color="gray"
                            className="md:w-4 md:h-4"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-(--cold-blue)/60 mt-3 text-center">
                  Dra symboler hit for å løse
                </div>
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`
                p-4 border-2 text-center font-bold tracking-wider
                ${
                  feedback.startsWith("✅")
                    ? "border-(--gold) bg-(--gold)/20 text-(--gold) animate-[gold-flash_1s_ease-in-out]"
                    : feedback.startsWith("⚠️")
                      ? "border-(--cold-blue) bg-(--cold-blue)/20 text-(--cold-blue)"
                      : "border-(--christmas-red) bg-(--christmas-red)/20 text-(--christmas-red) animate-[red-shake_0.5s_ease-in-out]"
                }
              `}
              >
                {feedback}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClearGrid}
                disabled={isProcessing}
                className="flex-1 p-3 border-2 border-(--gray) text-(--gray) hover:bg-(--gray)/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
              >
                NYTT FORSØK
              </button>
              <button
                onClick={handleCheckCode}
                disabled={
                  isProcessing ||
                  challengeGrid.filter((s) => s !== null).length <
                    selectedChallenge.sequenceLength
                }
                className="flex-1 p-3 border-2 border-(--cold-blue) text-black bg-(--cold-blue) hover:shadow-[0_0_15px_rgba(0,221,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wider"
              >
                {isProcessing ? "SJEKKER......" : "TEST KODE"}
              </button>
            </div>

            {/* Help Text */}
            <div className="p-3 border border-(--cold-blue)/30 bg-(--cold-blue)/5 text-(--cold-blue) text-xs">
              <div className="font-bold mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>HVORDAN LØSE UTFORDRINGEN:</span>
              </div>
              <div className="opacity-80 space-y-1">
                <div>
                  1. Dra symboler fra{" "}
                  <span className="text-(--neon-green) font-bold">
                    SYMBOLSAMLING
                  </span>{" "}
                  (venstre)
                </div>
                <div>
                  2. Slipp dem i{" "}
                  <span className="text-(--cold-blue) font-bold">
                    DEKRYPTERINGSGITTER
                  </span>{" "}
                  (høyre)
                </div>
                <div>3. Bruk hintet til å finne riktig rekkefølge</div>
                <div>
                  4. Klikk <span className="font-bold">TEST KODE</span> for å
                  sjekke løsningen
                </div>
                <div className="mt-2 pt-1 border-t border-(--cold-blue)/20">
                  <span className="text-(--gold)">✓ Gull ramme</span> = Riktig
                  plassert •{" "}
                  <span className="text-(--christmas-red)">✗ Rød ramme</span> =
                  Feil
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RetroWindow>
  );
}

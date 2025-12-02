"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { GuideAuth } from "@/components/nissemor/GuideAuth";
import { GuideNavigation } from "@/components/nissemor/GuideNavigation";
import { GameEngine } from "@/lib/game-engine";
import type { Oppdrag, PrintMaterial } from "@/types/innhold";

const allOppdrag = GameEngine.getAllQuests();

// Generate checkpoint cards dynamically from print_materials
interface CheckpointCard {
  dag: number;
  tittel: string;
  checkpoint: number;
  totalCheckpoints: number;
  location: string;
  challenge?: string;
  letters: string;
}

/**
 * Parse checkpoint information from print_materials
 * Looks for "checkpoint_cards" type materials with structured checkpoint data
 */
function generateCheckpointCards(quest: Oppdrag): CheckpointCard[] {
  if (!quest.print_materials) return [];

  const checkpoints: CheckpointCard[] = [];

  // Type for checkpoint_cards material (extension of PrintMaterial)
  type CheckpointMaterial = {
    type: string;
    checkpoints: Array<{
      checkpoint: number;
      location: string;
      challenge: string;
      letters: string;
    }>;
  };

  // Find checkpoint material - use type assertion since TypeScript can't infer the extended type
  const materials = quest.print_materials as Array<
    PrintMaterial | CheckpointMaterial
  >;
  const checkpointMaterial = materials.find(
    (m): m is CheckpointMaterial =>
      "type" in m && "checkpoints" in m && m.type === "checkpoint_cards",
  );

  if (checkpointMaterial) {
    const checkpointData = checkpointMaterial.checkpoints;
    const totalCheckpoints = checkpointData.length;

    checkpointData.forEach((cp) => {
      checkpoints.push({
        dag: quest.dag,
        tittel: `Dag ${quest.dag} - Checkpoint ${cp.checkpoint}`,
        checkpoint: cp.checkpoint,
        totalCheckpoints,
        location: cp.location,
        challenge: cp.challenge,
        letters: cp.letters,
      });
    });
  }

  return checkpoints;
}

// Print material card type
interface PrintMaterialCard {
  dag: number;
  tittel: string;
  isPrintMaterial: true;
  content: string;
  materialTitle?: string;
  beste_rom: string;
  estimatedSize: "small" | "medium" | "large";
}

// Build separate lists for different card types
type Card = (typeof allOppdrag)[0] | CheckpointCard | PrintMaterialCard;

/**
 * Generate cards for selected days
 */
function generateCardsForDays(selectedDays: number[]): Card[] {
  const filteredQuests = allOppdrag.filter((q) => selectedDays.includes(q.dag));

  // Group 1: Main quest cards (fysisk_hint)
  const mainQuestCards: Card[] = [...filteredQuests];

  // Group 2: Checkpoint cards
  const checkpointCards: CheckpointCard[] = filteredQuests.flatMap(
    generateCheckpointCards,
  );

  // Group 3: Print material cards
  const printMaterialCards: PrintMaterialCard[] = [];
  filteredQuests.forEach((oppdrag) => {
    if (oppdrag.print_materials && oppdrag.print_materials.length > 0) {
      oppdrag.print_materials.forEach((material, index) => {
        // Only add cards with valid content
        if (material.content && material.content.trim().length > 0) {
          printMaterialCards.push({
            dag: oppdrag.dag,
            tittel:
              material.title || `Dag ${oppdrag.dag} - Ekstra lapp ${index + 1}`,
            isPrintMaterial: true,
            content: material.content,
            materialTitle: material.title,
            beste_rom: oppdrag.beste_rom,
            estimatedSize: estimateCardSize(material.content),
          });
        }
      });
    }
  });

  return [...mainQuestCards, ...checkpointCards, ...printMaterialCards];
}

/**
 * Estimate card size based on content characteristics
 * Small: < 200 chars, < 8 lines
 * Medium: < 500 chars, < 15 lines
 * Large: > 500 chars or > 15 lines
 */
function estimateCardSize(
  content: string | undefined,
): "small" | "medium" | "large" {
  // Safety check for undefined or empty content
  if (!content || content.trim().length === 0) {
    return "small";
  }

  const lineCount = content.split("\n").length;
  const charCount = content.length;

  // Check for special indicators of complex content
  const hasMultipleSections = content.split("\n\n").length > 3;
  const hasBulletPoints = (content.match(/[-•*]/g) || []).length > 5;
  const hasLongLines = content.split("\n").some((line) => line.length > 80);

  if (
    charCount > 500 ||
    lineCount > 15 ||
    hasMultipleSections ||
    hasBulletPoints
  ) {
    return "large";
  }
  if (charCount > 200 || lineCount > 8 || hasLongLines) {
    return "medium";
  }
  return "small";
}

function PrintoutContent() {
  const router = useRouter();

  // State for day selection
  const [selectedDays, setSelectedDays] = useState<number[]>(
    Array.from({ length: 24 }, (_, i) => i + 1),
  );

  // Toggle individual day
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };

  // Select/deselect all
  const selectAll = () =>
    setSelectedDays(Array.from({ length: 24 }, (_, i) => i + 1));
  const deselectAll = () => setSelectedDays([]);

  // Generate cards based on selected days
  const allCards = generateCardsForDays(selectedDays);

  // Split into pages of 6 cards each (2 columns × 3 rows)
  const cardsPerPage = 6;
  const pages: Card[][] = [];
  for (let i = 0; i < allCards.length; i += cardsPerPage) {
    pages.push(allCards.slice(i, i + cardsPerPage));
  }

  // Type guards
  const isCheckpoint = (card: Card): card is CheckpointCard => {
    return "checkpoint" in card;
  };

  const isPrintMaterial = (card: Card): card is PrintMaterialCard => {
    return "isPrintMaterial" in card && card.isPrintMaterial === true;
  };

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden min-h-screen bg-(--dark-crt) text-(--neon-green) font-['VT323',monospace] p-8">
        <div className="max-w-6xl mx-auto">
          <GuideNavigation currentPage="printout" />

          <h1 className="text-4xl font-bold text-center mb-4">
            🖨️ NISSEMOR UTSKRIFTER
          </h1>
          <p className="text-center text-xl mb-6 opacity-70">
            Velg hvilke dager du vil skrive ut - 6 kort per side
          </p>

          {/* Day Selection Grid */}
          <div className="border-4 border-(--neon-green) bg-(--neon-green)/5 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-(--neon-green)">
                VELG DAGER:
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 border-2 border-(--neon-green) text-(--neon-green) text-sm hover:bg-(--neon-green)/10"
                >
                  VELG ALLE
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 border-2 border-(--christmas-red) text-(--christmas-red) text-sm hover:bg-(--christmas-red)/10"
                >
                  FJERN ALLE
                </button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      aspect-square border-4 font-bold text-xl
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-(--neon-green) border-(--neon-green) text-black"
                          : "bg-transparent border-(--neon-green)/30 text-(--neon-green)/50 hover:border-(--neon-green)/60"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 text-center text-lg">
              <span className="text-(--gold) font-bold">
                {selectedDays.length}
              </span>{" "}
              {selectedDays.length === 1 ? "dag" : "dager"} valgt (
              {allCards.length} kort, {pages.length}{" "}
              {pages.length === 1 ? "side" : "sider"})
            </div>
          </div>

          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => window.print()}
              disabled={selectedDays.length === 0}
              className="px-6 py-3 bg-(--neon-green) border-4 border-(--neon-green) text-black font-bold text-xl hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              SKRIV UT ({pages.length} {pages.length === 1 ? "SIDE" : "SIDER"})
            </button>
            <button
              onClick={() => router.push("/nissemor-guide")}
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
              <li>✓ Scroll ned for å se forhåndsvisning av alle kort</li>
              <li>✓ Skriv ut på vanlig A4-papir</li>
              <li>✓ Klipp ut langs de stiplede linjene</li>
              <li>✓ Brett eller rull kortene for ekstra spenning</li>
            </ul>
          </div>

          {/* Screen Preview */}
          {selectedDays.length === 0 ? (
            <div className="text-center py-20 border-4 border-(--neon-green)/30 bg-(--dark-crt)">
              <p className="text-2xl text-(--neon-green)/50 mb-4">
                Ingen dager valgt
              </p>
              <p className="text-lg text-(--neon-green)/30">
                Velg minst én dag for å se forhåndsvisning
              </p>
            </div>
          ) : (
            pages.map((pageCards, pageIndex) => (
              <div
                key={pageIndex}
                className="mb-12 border-4 border-(--neon-green)/30 p-8 bg-(--dark-crt)"
              >
                <div className="text-center text-xl font-bold text-(--gold) mb-6">
                  SIDE {pageIndex + 1} av {pages.length}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {pageCards.map((card, cardIndex) => {
                    const isCheckpointCard = isCheckpoint(card);
                    const isPrintMaterialCard = isPrintMaterial(card);
                    const dag = card.dag;
                    const tittel = card.tittel;

                    // Dynamic height based on content size
                    const screenHeightClass = isPrintMaterialCard
                      ? card.estimatedSize === "large"
                        ? "min-h-[600px]"
                        : card.estimatedSize === "medium"
                          ? "min-h-[400px]"
                          : "min-h-[300px]"
                      : "min-h-[300px]";

                    return (
                      <div
                        key={`${dag}-${cardIndex}`}
                        className={`border-4 border-dashed border-(--neon-green) p-4 bg-(--dark-crt) ${screenHeightClass}`}
                      >
                        {/* Parent info - outside the final note */}
                        <div className="text-center mb-3">
                          <div className="text-lg font-bold uppercase text-(--gold) py-1">
                            {tittel}
                          </div>
                        </div>

                        {/* THE FINAL NOTE FOR KIDS - solid border */}
                        <div className="border-4 border-solid border-(--neon-green) p-3 bg-(--neon-green)/5 relative mb-3">
                          {/* Day number badge - smaller, inside note */}
                          <div className="absolute top-2 right-2 w-8 h-8 bg-(--christmas-red) border-2 border-(--neon-green) flex items-center justify-center">
                            <span className="text-lg font-bold text-(--gold)">
                              {dag}
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

                          {/* Message content */}
                          {isCheckpointCard ? (
                            <div className="space-y-2">
                              <div className="text-center text-lg font-bold text-(--gold)">
                                CHECKPOINT {card.checkpoint}/
                                {card.totalCheckpoints}
                              </div>
                              {card.challenge && (
                                <div className="text-center text-sm mb-2 text-(--cold-blue)">
                                  {card.challenge}
                                </div>
                              )}
                              <div className="text-center text-2xl font-bold text-(--neon-green)">
                                BOKSTAV: {card.letters}
                              </div>
                              <div className="text-center text-xs mt-2 opacity-70">
                                → Gå til neste checkpoint
                              </div>
                            </div>
                          ) : isPrintMaterialCard ? (
                            <div
                              className={`text-center leading-snug whitespace-pre-line ${
                                card.estimatedSize === "large"
                                  ? "text-xs"
                                  : "text-sm"
                              }`}
                            >
                              {card.content}
                            </div>
                          ) : (
                            <div className="text-center text-sm leading-snug">
                              <div className="font-bold">
                                {card.fysisk_hint}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Parent reference - outside the final note */}
                        <div className="text-center text-xs opacity-70 pt-2 border-t border-(--neon-green)/30">
                          📍 Gjemt i:{" "}
                          {isCheckpointCard ? card.location : card.beste_rom}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block">
        {pages.map((pageCards, pageIndex) => (
          <div key={pageIndex} className="print:break-after-page print:p-8">
            <div className="print:grid print:grid-cols-2 print:gap-6">
              {pageCards.map((card, cardIndex) => {
                const isCheckpointCard = isCheckpoint(card);
                const isPrintMaterialCard = isPrintMaterial(card);
                const dag = card.dag;
                const tittel = card.tittel;

                // Dynamic print height based on content size
                const printHeightClass = isPrintMaterialCard
                  ? card.estimatedSize === "large"
                    ? "print:h-[400px]"
                    : card.estimatedSize === "medium"
                      ? "print:h-80"
                      : "print:h-64"
                  : "print:h-64";

                return (
                  <div
                    key={`${dag}-${cardIndex}-print`}
                    className={`print:border-4 print:border-dashed print:border-gray-400 print:p-3 print:flex print:flex-col ${printHeightClass}`}
                  >
                    {/* Parent info - outside the final note */}
                    <div className="print:text-center print:mb-2">
                      <div className="print:text-sm print:font-bold print:uppercase">
                        {tittel}
                      </div>
                    </div>

                    {/* THE FINAL NOTE FOR KIDS - solid border */}
                    <div className="print:border-4 print:border-solid print:border-black print:p-3 print:bg-gray-50 print:flex-1 print:flex print:flex-col print:relative">
                      {/* Day number badge - smaller, inside note */}
                      <div className="print:absolute print:top-2 print:right-2 print:w-8 print:h-8 print:bg-red-600 print:border-2 print:border-black print:flex print:items-center print:justify-center">
                        <span className="print:text-lg print:font-bold print:text-yellow-400">
                          {dag}
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

                      {/* Message content */}
                      {isCheckpointCard ? (
                        <div className="print:text-center print:flex-1 print:flex print:flex-col print:justify-center print:space-y-2">
                          <div className="print:text-lg print:font-bold">
                            CHECKPOINT {card.checkpoint}/{card.totalCheckpoints}
                          </div>
                          {card.challenge && (
                            <div className="print:text-sm print:text-gray-600">
                              {card.challenge}
                            </div>
                          )}
                          <div className="print:text-xl print:font-bold">
                            BOKSTAV: {card.letters}
                          </div>
                          <div className="print:text-xs print:text-gray-500 print:mt-1">
                            → Gå til neste checkpoint
                          </div>
                        </div>
                      ) : isPrintMaterialCard ? (
                        <div className="print:text-center print:flex-1 print:flex print:items-center print:justify-center print:px-2">
                          <div
                            className={`print:leading-tight print:whitespace-pre-line ${
                              card.estimatedSize === "large"
                                ? "print:text-[10px]"
                                : "print:text-sm"
                            }`}
                          >
                            {card.content}
                          </div>
                        </div>
                      ) : (
                        <div className="print:text-center print:flex-1 print:flex print:items-center print:justify-center print:px-2">
                          <div className="print:text-base print:leading-snug print:font-bold">
                            {card.fysisk_hint}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Parent reference - outside the final note */}
                    <div className="print:text-center print:text-xs print:text-gray-600 print:mt-2 print:pt-1 print:border-t print:border-gray-300">
                      📍 Gjemt i:{" "}
                      {isCheckpointCard ? card.location : card.beste_rom}
                    </div>
                  </div>
                );
              })}
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
                💡 Tips:
              </h2>
              <ul className="print:space-y-2 print:text-base print:list-disc print:list-inside">
                <li>Bruk farget papir (rødt/grønt) for ekstra julestemning</li>
                <li>
                  Brett kortene som små brev eller rull dem sammen med bånd
                </li>
                <li>Skjul kortene godt - det er moro å lete!</li>
                <li>Hold denne utskriften skjult fra barna</li>
              </ul>
            </div>

            <div className="print:border-4 print:border-black print:p-4 print:bg-gray-100">
              <h2 className="print:text-xl print:font-bold print:mb-2">
                ⚠️ VIKTIG:
              </h2>
              <p className="print:text-base print:mb-2">
                Hvert kort må settes opp kvelden før eller tidlig om morgenen.
                Sjekk Nissemor-guiden for detaljer om hvordan Rampenissen skal
                ha rotet til!
              </p>
              <p className="print:text-base">
                Kodene barna finner må tastes inn i KodeTerminal i appen.
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
      <GuideAuth>
        <PrintoutContent />
      </GuideAuth>
    </Suspense>
  );
}

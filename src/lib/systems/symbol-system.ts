/**
 * Symbol System
 *
 * Physical-digital bridge for symbol collection and decryption puzzles.
 * 9 physical cards with QR codes (3 hearts, 3 suns, 3 moons × 3 colors each).
 * Collected via QR scanning or parent addition, used in NisseKrypto challenges.
 */

import type { DecryptionSymbol } from "@/types/innhold";
import { StorageManager } from "../storage";
import { getAllQuests } from "../data-loader";

/**
 * Short codes printed under each QR, for typing when there is no camera.
 * No 0/O/1/I so a 9-year-old can't misread them. Never change a code once
 * cards are printed: old cards must keep working.
 */
const SHORT_CODES: Record<string, string> = {
  "heart-green": "HG4K",
  "heart-red": "HR7P",
  "heart-blue": "HB3X",
  "sun-green": "SG8M",
  "sun-red": "SR2W",
  "sun-blue": "SB6T",
  "moon-green": "MG5D",
  "moon-red": "MR9F",
  "moon-blue": "MB2H",
};

export function getSymbolShortCode(symbolId: string): string {
  return SHORT_CODES[symbolId];
}

/** The QR payload printed on each card. The scanner must accept exactly this. */
export function getSymbolQrPayload(symbolId: string): string {
  return symbolId;
}

/**
 * Turn a QR payload or a typed code into a symbolId, or null if it's not a card.
 * Accepts the symbolId in any case (2025 cards print "HEART-GREEN") and the
 * short code with stray spaces or dashes.
 */
export function parseSymbolCode(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  if (id in SHORT_CODES) return id;
  const short = raw.toUpperCase().replace(/[\s-]/g, "");
  return Object.keys(SHORT_CODES).find((k) => SHORT_CODES[k] === short) ?? null;
}

/** The December day the card is handed out (symbol_clue in the quest data). */
export function getSymbolDay(symbolId: string): number | undefined {
  return getAllQuests().find((q) => q.symbol_clue?.symbolId === symbolId)?.dag;
}

export function getAllSymbols(): DecryptionSymbol[] {
  return [
    {
      symbolId: "heart-green",
      symbolIcon: "heart",
      symbolColor: "green",
      description: "Grønt hjerte",
    },
    {
      symbolId: "heart-red",
      symbolIcon: "heart",
      symbolColor: "red",
      description: "Rødt hjerte",
    },
    {
      symbolId: "heart-blue",
      symbolIcon: "heart",
      symbolColor: "blue",
      description: "Blått hjerte",
    },
    // Suns (green, red, blue)
    {
      symbolId: "sun-green",
      symbolIcon: "sun",
      symbolColor: "green",
      description: "Grønn sol",
    },
    {
      symbolId: "sun-red",
      symbolIcon: "sun",
      symbolColor: "red",
      description: "Rød sol",
    },
    {
      symbolId: "sun-blue",
      symbolIcon: "sun",
      symbolColor: "blue",
      description: "Blå sol",
    },
    // Moons (green, red, blue)
    {
      symbolId: "moon-green",
      symbolIcon: "moon",
      symbolColor: "green",
      description: "Grønn måne",
    },
    {
      symbolId: "moon-red",
      symbolIcon: "moon",
      symbolColor: "red",
      description: "Rød måne",
    },
    {
      symbolId: "moon-blue",
      symbolIcon: "moon",
      symbolColor: "blue",
      description: "Blå måne",
    },
  ];
}

/**
 * Collect a symbol by its code (from QR scan or manual entry)
 * Validates code, checks for duplicates, and adds to storage
 */
export function collectSymbolByCode(
  code: string,
  currentDay = 24,
): {
  success: boolean;
  status: "ny" | "allerede" | "ukjent" | "for-tidlig";
  message: string;
  symbol?: DecryptionSymbol;
} {
  const id = parseSymbolCode(code);
  const symbol = getAllSymbols().find((s) => s.symbolId === id);

  if (!symbol) {
    return {
      success: false,
      status: "ukjent",
      message: "Ukjent kode. Er det et symbolkort?",
    };
  }

  if (StorageManager.hasSymbol(symbol.symbolId)) {
    return {
      success: false,
      status: "allerede",
      message: "Dette symbolet har dere allerede!",
      symbol,
    };
  }

  // A card found early (printouts lying around) must not unlock ahead of the story
  if (currentDay < (getSymbolDay(symbol.symbolId) ?? 1)) {
    return {
      success: false,
      status: "for-tidlig",
      message: "Dette kortet er ikke klart ennå. Legg det tilbake!",
    };
  }

  StorageManager.addCollectedSymbol(symbol);

  return {
    success: true,
    status: "ny",
    message: `✓ Symbol funnet!\n\n${symbol.description}`,
    symbol,
  };
}

export function getCollectedSymbols(): DecryptionSymbol[] {
  return StorageManager.getCollectedSymbols();
}

/**
 * Check if a specific symbol has been collected
 *
 * @param symbolId - Symbol identifier to check (e.g., "heart-green")
 * @returns True if symbol is in collection, false otherwise
 * @public Used by UI to show collected/uncollected states
 */
export function hasSymbol(symbolId: string): boolean {
  return StorageManager.hasSymbol(symbolId);
}

/**
 * Clear all collected symbols from storage
 *
 * USAGE:
 * - Parent guide reset functionality
 * - Testing and demo modes
 *
 * WARNING: This is a destructive operation - use with caution
 *
 * @public Called by parent guide for collection management
 */
export function clearCollectedSymbols(): void {
  StorageManager.clearCollectedSymbols();
}

/**
 * Manually add a symbol to the collection (bypassing validation)
 *
 * USAGE:
 * - Parent guide manual addition when QR codes are lost
 * - Testing and demo scenarios
 * - Fallback for technical issues
 *
 * NOTE: Does not validate if symbol exists in system - caller's responsibility
 *
 * @param symbol - DecryptionSymbol object to add to collection
 * @public Called by parent guide for manual symbol management
 */
export function addCollectedSymbol(symbol: DecryptionSymbol): void {
  StorageManager.addCollectedSymbol(symbol);
}

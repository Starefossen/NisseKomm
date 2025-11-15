/**
 * Symbol System
 *
 * Physical-digital bridge for symbol collection and decryption puzzles.
 * 9 physical cards with QR codes (3 hearts, 3 suns, 3 moons × 3 colors each).
 * Collected via QR scanning or parent addition, used in NisseKrypto challenges.
 */

import type { DecryptionSymbol } from "@/types/innhold";
import { StorageManager } from "../storage";

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
export function collectSymbolByCode(code: string): {
  success: boolean;
  message: string;
  symbol?: DecryptionSymbol;
} {
  const allSymbols = getAllSymbols();
  const symbol = allSymbols.find((s) => s.symbolId === code);

  if (!symbol) {
    return {
      success: false,
      message: "Ugyldig symbolkode. Prøv igjen!",
    };
  }

  if (StorageManager.hasSymbol(code)) {
    return {
      success: false,
      message: "Du har allerede samlet dette symbolet!",
      symbol,
    };
  }

  StorageManager.addCollectedSymbol(symbol);

  return {
    success: true,
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

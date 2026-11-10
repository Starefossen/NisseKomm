/**
 * Symbol card payloads: what the printouts carry must be what the scanner accepts.
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getAllSymbols,
  collectSymbolByCode,
  parseSymbolCode,
  getSymbolShortCode,
  getSymbolQrPayload,
  getSymbolDay,
  hasSymbol,
} from "../systems/symbol-system";
import { StorageManager } from "../storage";

process.env.NEXT_PUBLIC_STORAGE_BACKEND = "localStorage";

describe("symbolskanner", () => {
  beforeEach(async () => {
    localStorage.clear();
    await StorageManager.setAuthenticated(true);
  });

  it.each(getAllSymbols().map((s) => s.symbolId))(
    "%s: printed QR and short code parse back to the card",
    (id) => {
      expect(parseSymbolCode(getSymbolQrPayload(id))).toBe(id);
      expect(parseSymbolCode(getSymbolShortCode(id))).toBe(id);
      expect(getSymbolShortCode(id)).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
      expect(getSymbolDay(id)).toBeGreaterThan(0);
    },
  );

  it("short codes are unique", () => {
    const codes = getAllSymbols().map((s) => getSymbolShortCode(s.symbolId));
    expect(new Set(codes).size).toBe(9);
  });

  it("card days follow the storyboard", () => {
    expect(getAllSymbols().map((s) => getSymbolDay(s.symbolId))).toEqual([
      3, 6, 9, 12, 15, 18, 20, 22, 23,
    ]);
  });

  it("the printout page renders the parser's payload and short code", () => {
    const page = readFileSync(
      join(__dirname, "../../app/nissemor-guide/symboler/page.tsx"),
      "utf8",
    );
    expect(page).toContain("data: GameEngine.getSymbolQrPayload(");
    expect(page).toContain("GameEngine.getSymbolShortCode(");
  });

  it("accepts typed codes loosely and 2025 card text", () => {
    expect(parseSymbolCode(" hg4k ")).toBe("heart-green");
    expect(parseSymbolCode("HG-4K")).toBe("heart-green");
    expect(parseSymbolCode("HEART-GREEN")).toBe("heart-green");
  });

  it("rejects a wrong QR", () => {
    expect(parseSymbolCode("https://example.com")).toBeNull();
    expect(parseSymbolCode("")).toBeNull();
    const r = collectSymbolByCode("NISSEKRAFT2026", 24);
    expect(r).toMatchObject({ success: false, status: "ukjent" });
  });

  it("collects a valid card by short code", () => {
    const r = collectSymbolByCode("hg4k", 3);
    expect(r).toMatchObject({ success: true, status: "ny" });
    expect(hasSymbol("heart-green")).toBe(true);
  });

  it("refuses a card from a future day without storing it", () => {
    const r = collectSymbolByCode("heart-red", 5);
    expect(r).toMatchObject({ success: false, status: "for-tidlig" });
    expect(hasSymbol("heart-red")).toBe(false);
    expect(collectSymbolByCode("heart-red", 6).success).toBe(true);
  });

  it("reports a duplicate scan without storing twice", () => {
    collectSymbolByCode("moon-blue", 24);
    const r = collectSymbolByCode("MB2H", 24);
    expect(r).toMatchObject({ success: false, status: "allerede" });
    expect(StorageManager.getCollectedSymbols()).toHaveLength(1);
  });
});

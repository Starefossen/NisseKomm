import { describe, it, expect } from "@jest/globals";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { GameEngine } from "@/lib/game-engine";
import { RUNE_ALPHABET } from "@/components/ui/Frostrune";
import { RunetavleKids } from "../_print/dager01-12/runetavle";
import { RunerFasit } from "../_print/dager01-12/runer-fasit";
import { RuneTavle } from "@/components/windows/RuneTavle";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("Runetavle (kids' board vs answer key)", () => {
  it("derives exactly 19 taught runes and 10 untaught letters for day 24", () => {
    const taught = GameEngine.getLearnedRunes(24);
    expect(taught.size).toBe(19);

    const untaught = RUNE_ALPHABET.filter((l) => !taught.has(l));
    expect(untaught).toEqual([
      "C",
      "H",
      "Q",
      "V",
      "W",
      "X",
      "Z",
      "Æ",
      "Ø",
      "Å",
    ]);
  });

  it("kids' printable board hides exactly the untaught letters and crosses out exactly the untaught squares", () => {
    const el = document.createElement("div");
    act(() => createRoot(el).render(<RunetavleKids />));

    const taught = GameEngine.getLearnedRunes(24);
    const untaught = RUNE_ALPHABET.filter((l) => !taught.has(l));

    // Untaught letters must not be rendered anywhere on the kids' board
    for (const letter of untaught) {
      const matchingLetters = [...el.querySelectorAll("div")].filter(
        (d) => d.textContent === letter,
      );
      expect(matchingLetters).toHaveLength(0);
    }

    // Taught letters must all be present
    for (const letter of taught) {
      const matchingLetters = [...el.querySelectorAll("div")].filter(
        (d) => d.textContent === letter,
      );
      expect(matchingLetters.length).toBeGreaterThanOrEqual(1);
    }

    const kryss = [...el.querySelectorAll("[data-kryss]")].map((d) =>
      d.getAttribute("data-kryss"),
    );
    expect(kryss).toEqual(untaught);
    expect(el.textContent).not.toContain("?");

    // Kids' board has no glyphs (Frostrune)
    const glyphs = [...el.querySelectorAll("svg[role=img]")];
    expect(glyphs).toHaveLength(0);
  });

  it("answer key shows all 29 letters and all 29 rune glyphs", () => {
    const el = document.createElement("div");
    act(() => createRoot(el).render(<RunerFasit />));

    // All 29 letters must be present
    for (const letter of RUNE_ALPHABET) {
      const matchingLetters = [...el.querySelectorAll("div")].filter(
        (d) => d.textContent === letter,
      );
      expect(matchingLetters.length).toBeGreaterThanOrEqual(1);
    }

    // All 29 rune glyphs must be rendered with role=img and aria-label
    const glyphs = [...el.querySelectorAll("svg[role=img]")].map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(glyphs).toHaveLength(29);
    expect(new Set(glyphs)).toEqual(new Set(RUNE_ALPHABET));
  });

  it("in-app RuneTavle window hides exactly the untaught letters with question marks and shows taught runes out of 19", () => {
    const el = document.createElement("div");
    act(() => createRoot(el).render(<RuneTavle onClose={() => {}} />));

    const taught = GameEngine.getLearnedRunes(24);
    const untaught = RUNE_ALPHABET.filter((l) => !taught.has(l));

    // Counter shows X AV 19 TEGN LÆRT
    expect(el.textContent).toContain(`AV ${taught.size} TEGN LÆRT`);

    // Untaught letters must not be rendered
    for (const letter of untaught) {
      const matchingLetters = [...el.querySelectorAll("span")].filter(
        (s) => s.textContent === letter,
      );
      expect(matchingLetters).toHaveLength(0);
    }

    // Exactly 10 question marks for the untaught letters
    const questionMarks = [...el.querySelectorAll("span")].filter(
      (s) => s.textContent === "?",
    );
    expect(questionMarks).toHaveLength(10);

    // No glyphs for untaught letters
    const glyphs = [...el.querySelectorAll("svg[role=img]")].map((s) =>
      s.getAttribute("aria-label"),
    );
    for (const letter of untaught) {
      expect(glyphs).not.toContain(letter);
    }
  });
});

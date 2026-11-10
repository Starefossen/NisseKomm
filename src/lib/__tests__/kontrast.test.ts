/**
 * WCAG AA (4.5:1) for body text in globals.css at --frost 0 (varm) and 1 (kald).
 * At the endpoints color-mix() returns the pure warm or cold value.
 */
import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`--${name} mangler`);
  return m[1];
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(["varm", "kald"])("frost %s", (temp) => {
  const fg = [`${temp}-tekst`, `${temp}-aksent`, "gold", "christmas-red"];
  const bg = [`${temp}-bg`, `${temp}-flate`];
  it.each(fg.flatMap((f) => bg.map((b) => [f, b])))(
    "%s på %s er minst 4.5:1",
    (f, b) => {
      expect(contrast(token(f), token(b))).toBeGreaterThanOrEqual(4.5);
    },
  );
  it("svart tekst på messingknapp er minst 4.5:1", () => {
    expect(contrast("#000000", token(`${temp}-kant`))).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

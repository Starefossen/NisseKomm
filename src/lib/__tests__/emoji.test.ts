import { describe, it, expect } from "@jest/globals";
import fs from "fs";
import path from "path";

/*
 * Pictographic characters render as colour emoji on iPad Safari and break the
 * CRT look. Use pixel icons (lib/icons.tsx), Iskrystall, or plain characters
 * VT323 draws monochrome (★ ● ✓ ✗ ✱ †) instead.
 */

const PICTO = /\p{Extended_Pictographic}/u;
// "file:char" pairs that must stay; empty for now.
const ALLOW = new Set<string>();

const ROOT = path.join(__dirname, "../..");

function files(dir: string, ext: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : files(p, ext);
    return ext.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

function hits(file: string): string[] {
  const rel = path.relative(ROOT, file);
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => {
      const t = line.trim();
      // Code comments are not shown to anyone.
      if (/^(\/\/|\/?\*|\{\/\*)/.test(t)) return [];
      return [...line]
        .filter((c) => PICTO.test(c) && !ALLOW.has(`${rel}:${c}`))
        .map((c) => `${rel}:${i + 1} ${c}`);
    });
}

describe("no emoji in visible text", () => {
  it("src/data/*.json", () => {
    const found = files(path.join(ROOT, "data"), /\.json$/).flatMap(hits);
    expect(found).toEqual([]);
  });

  it("components, pages and lib", () => {
    const found = ["components", "app", "lib"]
      .flatMap((d) => files(path.join(ROOT, d), /\.tsx?$/))
      .flatMap(hits);
    expect(found).toEqual([]);
  });
});

import { describe, it, expect } from "@jest/globals";
import fs from "fs";
import path from "path";

// Codes live only in src/data. A code in component source leaks the answer.
const root = path.join(__dirname, "../../..");
const dataDir = path.join(root, "src/data");

const codes = fs
  .readdirSync(dataDir)
  .filter((f) => /^uke\d_oppdrag\.json$/.test(f))
  .flatMap((f) =>
    (
      JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8")) as {
        kode: string;
      }[]
    ).map((o) => o.kode.toUpperCase()),
  )
  // ponytail: numeric codes ("24", "48") are skipped; they collide with ordinary numbers
  .filter((k) => /^\p{L}{3,}$/u.test(k))
  // Names of the world itself (villain, places, a common word).
  .filter((k) => !["KULDE", "SIGNAL", "ULRIKEN", "LANDÅS"].includes(k));

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : walk(p);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });
}

const files = [
  ...walk(path.join(root, "src/components")),
  ...walk(path.join(root, "src/app")),
];

// The code as an uppercase word, or spelled out ("O-R-I-G-A-M-I").
function pattern(code: string): RegExp {
  const spelled = [...code].join("[\\s\\-_.·]+");
  return new RegExp(`(?<!\\p{L})(?:${code}|${spelled})(?!\\p{L})`, "u");
}

// Kid-visible text: string literals and JSX text, outside the parent guide.
// Matched case-insensitively ("gulrot" leaks as much as "GULROT"); identifiers are skipped.
const tekst = (src: string) =>
  (
    src.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`|>[^<>{}]+</g) ??
    []
  ).join("\n");
// Parent guide is not kid-visible; slede.ts and channels.ts text is checked per day
// in synlig-tekst.ts.
const barnefiler = files.filter(
  (f) => !/nissemor-guide|snofall-tv\/(slede|channels)\.ts$/.test(f),
);

describe("kodelekkasje", () => {
  it("finds codes to check", () => {
    expect(codes.length).toBeGreaterThan(10);
  });

  it.each(codes)("%s appears in no component source", (code) => {
    const re = pattern(code);
    const hits = files.filter((f) => re.test(fs.readFileSync(f, "utf8")));
    expect(hits.map((f) => path.relative(root, f))).toEqual([]);
  });

  it.each(codes)("%s appears in no kid-visible string, any case", (code) => {
    const re = new RegExp(pattern(code).source, "iu");
    const hits = barnefiler.filter((f) =>
      re.test(tekst(fs.readFileSync(f, "utf8"))),
    );
    expect(hits.map((f) => path.relative(root, f))).toEqual([]);
  });
});

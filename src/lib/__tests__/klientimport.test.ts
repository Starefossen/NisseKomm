import { describe, it, expect } from "@jest/globals";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/*
 * No module a "use client" file reaches (static or dynamic imports) may load the
 * codes: lib/oppdrag, lib/kode or the uke*_oppdrag.json files. The build check
 * (scripts/sjekk-klientkoder.mjs) catches leaks after the fact; this names the
 * import chain.
 */
const SRC = join(process.cwd(), "src");
const FORBUDT = /(lib\/oppdrag|lib\/kode|data\/uke\d_oppdrag\.json)$/;

const alle = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) return n === "__tests__" ? [] : alle(p);
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });

function løs(fra: string, spec: string): string | null {
  const base = spec.startsWith("@/")
    ? join(SRC, spec.slice(2))
    : spec.startsWith(".")
      ? join(dirname(fra), spec)
      : null;
  if (!base) return null;
  for (const e of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"])
    if (existsSync(base + e) && statSync(base + e).isFile()) return base + e;
  return null;
}

const importer = (f: string) =>
  [
    ...readFileSync(f, "utf8").matchAll(
      /^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm,
    ),
  ].map((m) => m[1] ?? m[2] ?? m[3]);

describe("klientkode laster ingen koder", () => {
  it("ingen 'use client'-fil når lib/oppdrag, lib/kode eller uke*_oppdrag.json", () => {
    const klient = alle(SRC).filter((f) =>
      /^\s*["']use client["']/.test(readFileSync(f, "utf8")),
    );
    expect(klient.length).toBeGreaterThan(10);
    const brudd: string[] = [];
    const sett = new Map<string, string[]>();
    const kø: [string, string[]][] = klient.map((f) => [f, [f]]);
    while (kø.length) {
      const [f, vei] = kø.shift()!;
      if (sett.has(f)) continue;
      sett.set(f, vei);
      for (const spec of importer(f)) {
        const mål = løs(f, spec);
        const navn = (mål ?? spec).replace(/\.tsx?$/, "");
        if (FORBUDT.test(navn)) {
          brudd.push([...vei, navn].map((x) => relative(SRC, x)).join(" → "));
          continue;
        }
        if (mål && /\.tsx?$/.test(mål)) kø.push([mål, [...vei, mål]]);
      }
    }
    expect(brudd).toEqual([]);
  });
});

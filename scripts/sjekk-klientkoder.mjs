#!/usr/bin/env node
/**
 * Fails when a day code reaches the client: any code (case-insensitive, whole
 * word), a `"kode":"…"` pair or a `foreldre_kode` key in .next/static or in
 * the prerendered HTML. Codes are never printed, only the day and file.
 *
 * Not searched as words: number codes (every minified constant would match;
 * the "kode" pair still catches the data), and the codes in STORYORD, which
 * are names and words the story itself uses after their day (the villain,
 * places, the bonus lantern). kodelekkasje.test.ts keeps those out of what
 * the kids see before the day is solved.
 *
 *   node scripts/sjekk-klientkoder.mjs          # checks the existing .next
 *   node scripts/sjekk-klientkoder.mjs --build  # NISSEKOMM_MODE=public build first
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const rot = new URL("..", import.meta.url).pathname;
if (process.argv.includes("--build")) {
  execSync("pnpm build", {
    cwd: rot,
    stdio: "inherit",
    env: { ...process.env, NISSEKOMM_MODE: "public" },
  });
}

const STORYORD = new Set([
  "SIGNAL",
  "KOMPASS",
  "ULRIKEN",
  "LYKT",
  "KULDE",
  "NORDLYS",
  "TURBO",
  "LANDÅS",
]);

const søk = [1, 2, 3, 4]
  .flatMap((u) =>
    JSON.parse(
      readFileSync(join(rot, `src/data/uke${u}_oppdrag.json`), "utf8"),
    ),
  )
  .flatMap((o) => [
    [`dag ${o.dag}`, o.kode],
    [`bonus dag ${o.dag}`, o.bonusoppdrag?.foreldre_kode],
  ])
  .filter(([, k]) => k && !/^\d+$/.test(k) && !STORYORD.has(k.toUpperCase()))
  .map(([navn, k]) => {
    const e = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [
      navn,
      new RegExp(`(?<![\\p{L}\\p{N}_])${e}(?![\\p{L}\\p{N}_])`, "iu"),
    ];
  });
// A data pair `kode: "…"` / `"kode":"…"` (not `x.kode:"•"`, the guide's mask).
søk.push([
  '"kode"-felt',
  /[{,]\s*["']?kode["']?\s*:\s*["'`](?!•)[^"'`]+["'`]/u,
]);
søk.push(["foreldre_kode", /foreldre_kode/u]);

const filer = [];
const gå = (d) => {
  if (!existsSync(d)) return;
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) gå(p);
    else if (/\.(js|html|json|txt|rsc|body)$/.test(n)) filer.push(p);
  }
};
gå(join(rot, ".next/static"));
gå(join(rot, ".next/server/app")); // prerendered HTML/RSC of public pages
const html = filer.filter(
  (f) => f.includes("/static/") || /\.(html|rsc|body)$/.test(f),
);
if (!html.some((f) => f.includes("/static/"))) {
  console.error("Fant ingen .next/static: kjør med --build");
  process.exit(2);
}

const avkod = (s) =>
  s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
let funn = 0;
for (const f of html) {
  const tekst = avkod(readFileSync(f, "utf8"));
  for (const [navn, re] of søk) {
    if (re.test(tekst)) {
      funn++;
      console.error(`LEKKASJE: ${navn} i ${f.slice(rot.length)}`);
    }
  }
}
if (funn) {
  console.error(`${funn} lekkasje(r) av dagskoder til klienten.`);
  process.exit(1);
}
console.log(`OK: ingen dagskoder i ${html.length} klientfiler.`);

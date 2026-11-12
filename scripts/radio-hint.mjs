// Bakes Birk and Lyng's hints for get_clips from the radio script into
// src/data/radio-hint.json (the image has no docs/). `--sjekk` exits 1 when stale.
import { readFileSync, writeFileSync } from "node:fs";

const UT = "src/data/radio-hint.json";
const md = readFileSync("docs/manus/rampenissen-radio-2026.md", "utf8");
const [dager, forsesong] = md.split("## Førsesongen");
const uten = (s) => s.trim().replace(/^«|»$/g, "");

const dag = {};
for (const blokk of dager.split(/^## Dag /m).slice(1)) {
  const n = parseInt(blokk, 10);
  const felt = {};
  for (const m of blokk.matchAll(
    /^\*\*(intro_hint|reaksjon_hint|rampestrek_hint|utfordring_hint):\*\* (.+)$/gm,
  ))
    felt[m[1]] = uten(m[2]);
  if (Object.keys(felt).length) dag[n] = felt;
}

// A pre-season date is a short exchange: join it as «Birk: … Lyng: …».
const host = {};
for (const blokk of forsesong.split(/^### /m).slice(1)) {
  const d = parseInt(blokk, 10);
  host[`2026-11-${d}`] = [...blokk.matchAll(/^\*\*(\w+):\*\* (.+)$/gm)]
    .map((m) => `${m[1]}: ${uten(m[2])}`)
    .join(" ");
}

const json = JSON.stringify({ dag, host }, null, 2) + "\n";
if (process.argv.includes("--sjekk")) {
  if (readFileSync(UT, "utf8") !== json) {
    console.error(`${UT} er utdatert: kjør node scripts/radio-hint.mjs`);
    process.exit(1);
  }
} else writeFileSync(UT, json);

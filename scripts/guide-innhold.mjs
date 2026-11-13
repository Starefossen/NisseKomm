// Bakes the parent guide's source texts (docs/manus, historie, storyboard,
// gaater, assets/*/entitet.md,
// medier.json and its templates) into src/data/guide-innhold.json, because the
// Docker image has neither docs/ nor assets/. Only git-tracked files, so the
// output is the same on the dev box and in CI. `--sjekk` exits 1 when stale.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const UT = "src/data/guide-innhold.json";
const sporet = execFileSync("git", ["ls-files", "docs", "assets"], {
  encoding: "utf8",
}).split("\n");
const ENTITET =
  /^assets\/(characters|locations|objects)\/[a-z0-9-]+\/(entitet\.md|beskrivelse\.txt)$/;
const MANUS = [
  "julius-2026",
  "rampenissen-radio-2026",
  "app-tekster-2026",
  "julius-promo",
].map((n) => `docs/manus/${n}.md`);
const DOKS = ["historie-2026", "storyboard-2026", "gaater-2026"].map(
  (n) => `docs/${n}.md`,
);
const medier = JSON.parse(readFileSync("assets/medier.json", "utf8"));
const maler = Object.values(medier).flatMap((j) => (j.mal ? [j.mal] : []));
const filer = [
  ...new Set([
    ...MANUS,
    ...DOKS,
    "assets/medier.json",
    ...maler,
    ...sporet.filter((f) => ENTITET.test(f)),
    // Review reports for the guide's Gjennomganger page.
    ...sporet.filter((f) => /^docs\/gjennomganger\/[\w-]+\.md$/.test(f)),
  ]),
]
  .filter((f) => sporet.includes(f))
  .sort();
const json =
  JSON.stringify(
    Object.fromEntries(filer.map((f) => [f, readFileSync(f, "utf8")])),
    null,
    2,
  ) + "\n";

if (process.argv.includes("--sjekk")) {
  if (readFileSync(UT, "utf8") !== json) {
    console.error(`${UT} er utdatert: kjør node scripts/guide-innhold.mjs`);
    process.exit(1);
  }
} else writeFileSync(UT, json);

// Bakes src/data/oppdrag-klient.json: the quests as the kids' browser may see
// them, without the day code, the parent fields or the bonus parent code.
// The uke*_oppdrag.json files stay the server's source (src/lib/oppdrag.ts).
// `runer` is every letter the season teaches (GameEngine.getLearnedRunes(24)).
// `--sjekk` exits 1 when stale.
import { readFileSync, writeFileSync } from "node:fs";

const UT = "src/data/oppdrag-klient.json";
const KLIENT = [
  "dag",
  "tittel",
  "skjerm_teaser",
  "nissemail_tekst",
  "julius_ps",
  "julius_ps_bonus",
  "julius_ps_krypto_mangler",
  "hendelse",
  "bonusoppdrag",
  "eventyr",
  "reveals",
  "requires",
  "symbol_clue",
  "decryption_challenge",
];
const alle = [1, 2, 3, 4]
  .flatMap((u) =>
    JSON.parse(readFileSync(`src/data/uke${u}_oppdrag.json`, "utf8")),
  )
  .sort((a, b) => a.dag - b.dag);
const oppdrag = alle.map((o) => {
  const k = Object.fromEntries(
    KLIENT.filter((f) => f in o).map((f) => [f, o[f]]),
  );
  if (k.bonusoppdrag) {
    k.bonusoppdrag = { ...k.bonusoppdrag };
    delete k.bonusoppdrag.foreldre_kode;
  }
  return k;
});
// Same rule as GameEngine.getLearnedRunes: day 5 and 22 teach none, day 1 adds E and T.
const runer = new Set(["E", "T"]);
for (const o of alle)
  if (o.dag !== 5 && o.dag !== 22)
    for (const c of o.kode.toUpperCase()) if (/[A-ZÆØÅ]/.test(c)) runer.add(c);
const ut =
  JSON.stringify({ runer: [...runer].sort().join(""), oppdrag }, null, 2) +
  "\n";

if (process.argv.includes("--sjekk")) {
  if (readFileSync(UT, "utf8") !== ut) {
    console.error(`${UT} er utdatert: kjør node scripts/oppdrag-klient.mjs`);
    process.exit(1);
  }
} else writeFileSync(UT, ut);

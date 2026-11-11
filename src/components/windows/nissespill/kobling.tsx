/**
 * Ugleposten's windows into the rest of NisseKomm, read through GameEngine
 * only. Chapter text stays static (kodelekkasje.test.ts scans it); the live
 * values come in at render time through three markers:
 * - `{{brev}}`: the kids' letters to Julius (writer and a short excerpt)
 * - `{{rekorder}}`: Sledeflukt bests per player, on Winter's list
 * - `ᚱ:ORD` at the end of a line: drawn in frostrunes, unlearned letters frosted
 *   (same marker as NisseNet files)
 */
import { GameEngine } from "@/lib/game-engine";
import type { SantaLetter, SledeResultat } from "@/lib/storage";
import { RuneText } from "@/components/ui/Frostrune";
import { ETAPPER, SPILLERE } from "@/components/windows/snofall-tv/slede";
import { Skriv } from "./UgleIntro";

export const RUNE_LINE = "ᚱ:";

const utdrag = (s: string, n = 60) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n).replace(/\s\S*$/, "")}…`;
};

/** Narrator, bokmål. Newest letter per writer. */
export function brevTekst(brev: SantaLetter[]): string {
  const siste = new Map<string, SantaLetter>();
  for (const b of brev) siste.set(b.from ?? "noen uten navn", b);
  if (siste.size === 0)
    return "Øverst ligger en tom plass med en lapp: «Her legger jeg brevene fra huset til Rampenissen. – J.» Plassen venter.";
  const deler = [...siste].map(
    ([navn, b]) => `ett fra ${navn} («${utdrag(b.content)}»)`,
  );
  const liste =
    deler.length === 1
      ? deler[0]
      : `${deler.slice(0, -1).join(", ")} og ${deler.at(-1)}`;
  return `Øverst, løst fra tråden, ligger brevene fra huset til Rampenissen: ${liste}. Julius har lest dem. Hjørnene er myke av tomler.`;
}

// Spaces between thousands so no score reads as a number code (48, 24, 75).
const tall = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Winter's voice, light Bergen. Each player's best run across the stages. */
export function rekordTekst(alle: Record<string, SledeResultat>): string {
  const linjer = SPILLERE.flatMap((navn) => {
    const egne = Object.entries(alle)
      .filter(([k]) => k.startsWith(`${navn}/`))
      .map(([k, r]) => ({
        etappe: ETAPPER.find((e) => e.id === k.slice(navn.length + 1))?.navn,
        ...r,
      }))
      .filter((r) => r.etappe)
      .sort((a, b) => b.poeng - a.poeng);
    const b = egne[0];
    return b
      ? [
          `${navn}: ${tall(b.poeng)} poeng på ${b.etappe}, ${tall(b.bjeller)} bjeller.`,
        ]
      : [];
  });
  if (linjer.length === 0)
    return "Tomme linjer. Ingen har fløyet IQs simulator ennå. Eg liker ikkje tomme linjer.";
  return `${linjer.join(" ")} Eg har kontrollert tallene. To ganger.`;
}

/** Replaces the live markers in a chapter line. */
export function fyll(tekst: string): string {
  return tekst
    .replace("{{brev}}", () => brevTekst(GameEngine.getSantaLetters()))
    .replace("{{rekorder}}", () =>
      rekordTekst(GameEngine.getSledeResultater()),
    );
}

/** A chapter line in the panel: typed text, then the rune word if there is one. */
export function Tekst({ tekst }: { tekst: string }) {
  const [t, runer] = fyll(tekst).split(RUNE_LINE);
  return (
    <>
      <Skriv key={t} tekst={t} />
      {runer !== undefined && (
        <RuneText
          text={runer}
          size={18}
          className="ml-2 align-middle text-(--cold-blue)"
          learned={GameEngine.getLearnedRunes()}
        />
      )}
    </>
  );
}

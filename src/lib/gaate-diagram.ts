/**
 * Which pieces each «Slik løses den» step uses, for the Gåtekart flow diagram.
 * Pure: takes the step texts and the piece list of `gaatekart(n)`.
 */
export interface DiagramBit {
  id: string;
  tekst: string;
  hvor?: string;
  kilde?: string;
}
export interface Kant {
  steg: number;
  bit: string;
  /** false: guessed from one shared word; drawn dashed. */
  sikker: boolean;
}

// Display text now says «Håkon (9)», but raw docs still use H9/K12; they are the kids (Håkon 9, Kristian 12), never piece ids.
const BARN = new Set(["H9", "K12", "K4", "K1", "K2", "K3"]);
const STOPP = new Set(
  "det som med for til fra har den dem ved alle uten eller men når hva hvor kan skal vil ikke hun han seg sin sine der her hos inn opp ned nok bak foran hele etter julius rampenissen koden tegnene tegn føres tavla bokstaver bokstav hver finner legger leser ordet skriver husker åpnes åpner lappen kortet kortene ligger under ruter rutene samme første andre tredje alltid aldri noen ingen bare også mellom inntil etterpå deres hvert hvilken uansett sammen begge håkon kristian hanna".split(
    " ",
  ),
);
const stamme = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/\*\*|`/g, "")
      .match(/[a-zæøå]{3,}/g)
      ?.filter((w) => !STOPP.has(w))
      .map((w) => w.slice(0, 4)) ?? [],
  );
// «sko 3», «bok 5», «sokk 3», «lampe 4»: a numbered thing named in both texts.
const nummerert = (s: string) =>
  new Set(
    [...s.toLowerCase().matchAll(/\b([a-zæøå]{3,})\s+(\d+)\b/g)].map(
      (m) => `${m[1].slice(0, 3)} ${m[2]}`,
    ),
  );

function skjermTreff(s: string, b: DiagramBit) {
  const fil = b.hvor?.split("/").at(-1) ?? "";
  return (
    (b.kilde === "julius" && /Julius|video/i.test(s)) ||
    (b.kilde === "fil" && !!fil && s.includes(fil)) ||
    (b.kilde === "ps" && /\bPS\b/.test(s)) ||
    (b.kilde === "symbol" && /symbol|kort \d\/9/i.test(s)) ||
    (b.kilde === "epost" && /e-post|NisseMail/i.test(s))
  );
}

export function diagramKanter(
  steg: string[],
  hjemme: DiagramBit[],
  skjerm: DiagramBit[],
) {
  const kanter: Kant[] = [];
  const alle = [...hjemme, ...skjerm];
  steg.forEach((s, i) => {
    const legg = (bit: string, sikker: boolean) => {
      const k = kanter.find((x) => x.steg === i && x.bit === bit);
      if (k) k.sikker ||= sikker;
      else kanter.push({ steg: i, bit, sikker });
    };
    for (const [, id] of s.matchAll(/\b([HS]\d+)\b/g))
      if (!BARN.has(id) && alle.some((b) => b.id === id)) legg(id, true);
    for (const b of skjerm) if (skjermTreff(s, b)) legg(b.id, true);
    const ord = stamme(s);
    const num = nummerert(s);
    // A letter row «_ _ M _ A _ _» uses the house pieces whose bold letters it holds.
    const rad = new Set(
      [...s.matchAll(/(?:[_A-ZÆØÅ] ){2,}[_A-ZÆØÅ]/g)].flatMap(
        (m) => m[0].match(/[A-ZÆØÅ]/g) ?? [],
      ),
    );
    for (const b of hjemme) {
      const fet = [...b.tekst.matchAll(/\*\*([A-ZÆØÅ])\*\*/g)].map((m) => m[1]);
      if (fet.length && fet.every((x) => rad.has(x))) legg(b.id, true);
    }
    for (const b of alle) {
      if (b.id === "S0") continue;
      if ([...nummerert(b.tekst)].some((x) => num.has(x))) {
        legg(b.id, true);
        continue;
      }
      const felles = [...stamme(b.tekst)].filter((w) => ord.has(w)).length;
      if (felles >= 2) legg(b.id, true);
      else if (felles === 1) legg(b.id, false);
    }
  });
  // S0 is the whole day's mail: context, not a riddle piece, so never «unused».
  const ubrukt = alle
    .filter((b) => b.id !== "S0" && !kanter.some((k) => k.bit === b.id))
    .map((b) => b.id);
  const stegUten = steg
    .map((_, i) => i)
    .filter((i) => !kanter.some((k) => k.steg === i));
  return { kanter, ubrukt, stegUten };
}

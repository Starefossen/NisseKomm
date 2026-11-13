/**
 * Solution board for the Gåtekart: where each character of the code comes from.
 * Pure: takes the code (parent-only), the pieces of `gaatekart(n)` and «Slik løses den».
 * Letters a step's row `_ _ M _ A _ _` shows come from the house (or the screen, when only an
 * S piece holds them); the rest is reasoned out in the first step that names the code.
 */
import { diagramKanter, type DiagramBit } from "./gaate-diagram";

export type Kilde = "hus" | "skjerm" | "resonnert" | "ukjent";
export interface Celle {
  tegn: string;
  kilde: Kilde;
  bit?: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const gir = (tekst: string, x: string) =>
  new RegExp(
    `\\*\\*${esc(x)}\\*\\*|tegn ${esc(x)}(?![A-ZÆØÅa-zæøå])|_ ${esc(x)}(?![A-ZÆØÅa-zæøå])`,
  ).test(tekst);

export function losningstavle(
  kode: string,
  steg: string[],
  hjemme: DiagramBit[],
  skjerm: DiagramBit[],
) {
  const tegn = [...kode.toUpperCase()];
  const uten = tegn.filter((c) => c !== " ");
  // The first letter row in the steps that fits the code, character by character.
  let rad: string[] | null = null;
  let radSteg = -1;
  steg.forEach((s, i) => {
    for (const m of s.matchAll(/(?:[_A-ZÆØÅ0-9] )+[_A-ZÆØÅ0-9]/g)) {
      const r = m[0].split(" ");
      if (
        !rad &&
        r.length === uten.length &&
        r.some((c) => c !== "_") &&
        r.every((c, j) => c === "_" || c === uten[j])
      ) {
        rad = r;
        radSteg = i;
      }
    }
  });
  const lukkSteg = steg.findIndex(
    (s, i) =>
      i >= Math.max(radSteg, 0) &&
      // «U L R I K E N» and «JULE + MAGI» name the code too.
      new RegExp(
        `(^|[^A-ZÆØÅ0-9])${uten.map(esc).join("[\\s+]*")}([^A-ZÆØÅ0-9]|$)`,
      ).test(s.toUpperCase()),
  );
  const { kanter } = diagramKanter(steg, hjemme, skjerm);
  const lukkBiter = kanter
    .filter(
      (k) => k.steg === lukkSteg && k.bit.startsWith("S") && k.bit !== "S0",
    )
    .sort((a, b) => Number(b.sikker) - Number(a.sikker))
    .map((k) => k.bit);

  let j = 0;
  const celler: Celle[] = tegn.map((c) => {
    if (c === " ") return { tegn: c, kilde: "resonnert" };
    const vist = (rad as string[] | null)?.[j++];
    if (vist && vist !== "_") {
      const h = hjemme.find((b) => gir(b.tekst, c));
      if (h) return { tegn: c, kilde: "hus", bit: h.id };
      const s = skjerm.find((b) => b.id !== "S0" && gir(b.tekst, c));
      if (s) return { tegn: c, kilde: "skjerm", bit: s.id };
      // A row in the steps is the kids' reading of what they hold: home, unnamed piece.
      return { tegn: c, kilde: "hus" };
    }
    return { tegn: c, kilde: lukkSteg >= 0 ? "resonnert" : "ukjent" };
  });

  const ekte = celler.filter((c) => c.tegn !== " ");
  const hus = ekte.filter((c) => c.kilde === "hus").length;
  const skj = ekte.filter((c) => c.kilde === "skjerm").length;
  const åpne = ekte.filter(
    (c) => c.kilde === "resonnert" || c.kilde === "ukjent",
  ).length;
  const varsler: { niva: "rod" | "gul"; tekst: string }[] = [];
  if (lukkSteg < 0)
    varsler.push({
      niva: "rod",
      tekst: "Ingen steg i «Slik løses den» forklarer koden: kilde ukjent.",
    });
  else if (rad && ekte.length >= 3 && åpne <= 1)
    varsler.push({
      niva: "gul",
      tekst:
        "Kan gjettes for tidlig: hjemme gir nesten hele koden før skjermen.",
    });
  return {
    celler,
    kjent: celler
      .map((c) =>
        c.tegn === " "
          ? " "
          : c.kilde === "hus" || c.kilde === "skjerm"
            ? c.tegn
            : "_",
      )
      .join(" "),
    hus,
    skjerm: skj,
    lengde: ekte.length,
    lukk:
      lukkSteg >= 0
        ? {
            steg: lukkSteg + 1,
            biter: lukkBiter,
            sitat: skjerm.find((b) => b.id === lukkBiter[0])?.tekst,
          }
        : null,
    varsler,
  };
}

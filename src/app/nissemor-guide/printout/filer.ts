/** Print list from docs/gaater-2026.md §(b), served at /nissemor-guide/printout/<navn>. */
const INFO = {
  runetavle: ["Runetavla", 1],
  "runer-fasit": ["Runefasit (bare for Nissemor)", 0],
  "dag01-tradkort": ["Trådkort", 1],
  "dag01-linjekort": ["Linjekort og konvoluttpåskrift", 1],
  "dag01-frakt": ["Fraktetiketter og stempler", 1],
  "dag01-ferdskriver": ["Merker til ferdskriveren", 1],
  "dag01-flylogg": ["Flyloggen", 1],
  operasjonsbrett: ["Operasjonsbrettet", 1],
  "dag02-tallkort": ["Romertallkort", 2],
  "dag03-frostlapp": ["Frostlapp (speilvendt)", 3],
  "dag04-skokort": ["Skokort", 4],
  "dag05-brevfugl": ["Brevfuglen", 5],
  alfabetstrimmel: ["Alfabetstrimmel", 5],
  "dag06-silhuetter": ["Silhuetter", 6],
  "dag07-frostlapp": ["Frostkortet i fryseren", 7],
  "dag08-kretskort": ["Kretskortarket", 8],
  "dag09-krystallark": ["Krystallarket", 9],
  "dag10-testark": ["Testark for rødfilter", 10],
  "dag10-fargekort": ["Fargekort", 10],
  "rodfilter-ramme": ["Rødfilter-ramme", 10],
  "dag11-tallkort": ["Tallkort", 11],
  "dag12-frostlapp-tredelt": ["Tredelt frostlapp", 12],
  "dag13-krydderkort": ["Krydderkort", 13],
  "dag14-brettark": ["Brettarket", 14],
  "dag15-redskapskort": ["Redskapskort", 15],
  "dag16-sorteringslapper": ["Sorteringslapper", 16],
  "dag17-baandkort": ["Båndkort", 17],
  "dag18-rosinkort": ["Rosinkort", 18],
  "dag19-bevislapper": ["Bevislapper", 19],
  "dag20-putekort": ["Putekort", 20],
  "dag21-portkort": ["Portkort", 21],
  "dag22-sokkelapper": ["Sokkelapper", 22],
  "dag23-stjerner": ["Stjerner", 23],
  "dag24-suvenirlapper": ["Suvenirlapper", 24],
  "dag24-krystallkort": ["Krystallkortet", 24],
  diplom: ["Diplom «Snøfalls venn»", 24],
  "dag14-serviettfugl": ["Serviettfugl (valgfri)", 14],
  "dag17-losepengebrev": ["Løsepengebrev (valgfritt)", 17],
  "dag13-gravskilt": ["Gravskilt", 13],
  "dag20-fortskilt": ["Fortskilt", 20],
} as const satisfies Record<string, readonly [string, number]>;

export type Utskriftnavn = keyof typeof INFO;
export const UTSKRIFTER = Object.keys(INFO) as Utskriftnavn[];

/** Day the print is used (0 = all season). */
export const utskriftDag = (navn: string) =>
  (INFO as Record<string, readonly [string, number]>)[navn]?.[1];

/** Readable name, e.g. «Trådkort (dag 1)». */
export function utskriftTittel(navn: string) {
  const i = (INFO as Record<string, readonly [string, number]>)[navn];
  if (!i) return navn;
  return i[1] ? `${i[0]} (dag ${i[1]})` : i[0];
}

/** Printouts that have their own page instead of [fil]. */
export const FERDIGE: Record<string, string> = {
  diplom: "/nissemor-guide/printout/diplom",
};

export const utskriftHref = (navn: string) =>
  FERDIGE[navn] ?? `/nissemor-guide/printout/${navn}`;

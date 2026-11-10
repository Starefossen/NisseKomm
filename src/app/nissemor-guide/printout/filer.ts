/** Print list from docs/gaater-2026.md §(b), served at /nissemor-guide/printout/<navn>. */
export const UTSKRIFTER = [
  "runetavle",
  "runer-fasit",
  "dag01-tradkort",
  "dag01-linjekort",
  "dag01-frakt",
  "dag01-ferdskriver",
  "dag01-flylogg",
  "operasjonsbrett",
  "dag02-tallkort",
  "dag03-frostlapp",
  "dag04-skokort",
  "dag05-brevfugl",
  "alfabetstrimmel",
  "dag06-silhuetter",
  "dag07-frostlapp",
  "dag08-kretskort",
  "dag09-krystallark",
  "dag10-testark",
  "dag10-fargekort",
  "rodfilter-ramme",
  "dag11-tallkort",
  "dag12-frostlapp-tredelt",
  "dag13-krydderkort",
  "dag14-brettark",
  "dag15-redskapskort",
  "dag16-sorteringslapper",
  "dag17-baandkort",
  "dag18-rosinkort",
  "dag19-bevislapper",
  "dag20-putekort",
  "dag21-portkort",
  "dag22-sokkelapper",
  "dag23-stjerner",
  "dag24-suvenirlapper",
  "dag24-krystallkort",
  "diplom",
  "dag14-serviettfugl",
  "dag17-losepengebrev",
] as const;

/** Printouts that already have their own page. */
export const FERDIGE: Record<string, string> = {
  runetavle: "/nissemor-guide/printout/runer",
  "runer-fasit": "/nissemor-guide/printout/runer",
  diplom: "/nissemor-guide/printout/diplom",
};

export const utskriftHref = (navn: string) =>
  FERDIGE[navn] ?? `/nissemor-guide/printout/${navn}`;

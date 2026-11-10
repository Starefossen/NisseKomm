# Tidbits

Small surprises in `src/data/tidbits.json` (type: `src/types/tidbits.ts`,
helpers: `src/lib/tidbits.ts`). Every entry has `fraDag` (first day, 1-24),
optional `tilDag` and `tekst`. The text is kid-visible:
`kodelekkasje.test.ts` fails if it names a code, and `tidbits.test.ts` fails if
a secret word is a real or bonus code.

| Key                     | Extra fields                     | Where                                                                                                                                                 |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`                  | `minutter`, `linjer[]`           | Rampenissen peeks from a corner after `minutter` idle on the desktop, at most once an hour; not with reduced motion, frost mode, day-1 boot or finale |
| `terminal.hemmeligeOrd` | `ord[]`                          | KodeTerminal reply instead of «Feil kode»; never counts as an attempt                                                                                 |
| `terminal.feilKode`     |                                  | Rotating line under a wrong code; never a hint                                                                                                        |
| `tv`                    | `frekvens`, `bilde?`, `lyd?`     | Snøfall TV K4 frequency wheel; media paths from the library, text over static if missing                                                              |
| `spam`                  | `fra`, `emne`                    | NisseMail SPAM folder, read-only, no unread badge                                                                                                     |
| `kalender`              | `dag`                            | Extra line in a completed door's modal                                                                                                                |
| `stats`                 | `navn`, `verdi`                  | NisseStats «Snøfall-statistikk»                                                                                                                       |
| `musikk.skjultSpor`     | `path`, `tittel`, `etterLøstDag` | Hidden NisseMusikk track once that day is solved and the file exists in the media library                                                             |
| `nissenet.filer`        | `navn`, `passord?`               | NisseNet MORO folder; not counted as hemmeligheter                                                                                                    |
| `nissenet.feilPassord`  |                                  | Rotating reply to a wrong password                                                                                                                    |

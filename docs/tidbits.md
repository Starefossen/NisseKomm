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
| `nissenet.filer`        | `navn`, `passord?`, `fjaer?`     | NisseNet MORO folder; not counted as hemmeligheter. `fjaer` hides the file until that many owl feathers are found in Ugleposten                       |
| `nissenet.feilPassord`  |                                  | Rotating reply to a wrong password                                                                                                                    |

## Slang til sjekk

Rampenissen prøver å høres kul ut og bommer litt med vilje. Ordene under er
brukt i `tidbits.json`; sjekk med guttene om de fortsatt er i bruk (desember
2026). «seks sju» er allerede brukt i radiomanuset (dag 20).

- seks sju (terminal, fra dag 20)
- sigma (idle dag 8, terminal fra dag 8; også i radiomanuset dag 8 og 20)
- skibidi (terminal)
- rizz (idle dag 17)
- aura (dagbok, dag 8-innslaget)
- cooked (feil kode, fra dag 8)
- goated (kalender dag 14)
- aura, cooked, locked in, yappe, glaze, crash out, rizz, chat (2026-11-13:
  SLEDEFLUKT-radioen og resultatskjermen, Ugleposten K2–K4, feil kode fra dag
  12 og 15, MORO-fila `iqs_ordbok.txt` fra dag 12; skibidi bare som «det sier
  ingen lenger»)

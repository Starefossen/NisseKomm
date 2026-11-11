# IQs sledesimulator mot sjangeren

Kort gap-analyse av `snofall-tv/SledeSimulator.tsx` + `slede.ts` mot det
arkade-racere og flyspill gjør for at de skal kjennes gode. Spillere: Håkon (9)
og Kristian (12), iPad Safari og tastatur. Eget design, ingen kopi av et
bestemt spill.

| Konvensjon                      | Hadde                                                          | Nå                                                                              | Rest                                                                                  |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Nedtelling før start            | Nei, rett inn i løpet                                          | 3–2–1–FLY med tikk, sleden ruller mens tallene står                             | –                                                                                     |
| Akselerasjon/driv i styringen   | Konstant sidefart, ingen treghet                               | Styrefart med glidning (`s.vx`), bank følger                                    | –                                                                                     |
| Vanskelighetsramp i etappen     | Flat fart hele veien                                           | Farten stiger 20 % mot mål (`ramp`)                                             | Tettere hindre mot slutten                                                            |
| Nær-miss-bonus                  | Nei                                                            | «NÆRE PÅ!» +40 og litt kraft når et tre/en tind passeres tett                   | –                                                                                     |
| Kombo/multiplikator             | Nei, flate 100 per varde                                       | Rekke av varder uten bom gir x1–x4 på varder og stjerner; bom nullstiller       | –                                                                                     |
| Fartslinjer/skjermristing       | Bare under sprang / krasj                                      | Fartslinjer skalerer med fart over marsjfart (sprang, løft, ramp)               | –                                                                                     |
| Klare mål per etappe (medaljer) | 0–3 bjeller uten forklart terskel                              | Startskjermen viser tersklene, resultatet sier hva som mangler til neste bjelle | –                                                                                     |
| Resultatskjerm med oppsummering | Poeng + beste                                                  | Varder, stjerner, beste rekke, nære på, tidsbonus, krasj, bjeller               | –                                                                                     |
| «Én gang til» på ett trykk      | IGJEN-knapp                                                    | Samme, pluss Enter/mellomrom på resultatskjermen                                | –                                                                                     |
| Touch som kjennes god           | Absolutt posisjon i soner (fingeren må stå på et bestemt sted) | Relativ stikke: der fingeren lander er null, dra for å styre                    | –                                                                                     |
| Spøkelse av beste runde         | Nei                                                            | Nei                                                                             | Lagre `px` per 0,1 s per etappe (ca. 1 KB) og tegne en blek slede; krever synk-nøkkel |
| Sjekkpunkter                    | Nei                                                            | Nei                                                                             | Etappene er 45–75 s, tre forsøk dekker behovet                                        |
| Pickups (boost)                 | Kraft fra varder, sprang på full måler                         | Uendret                                                                         | Egne boost-ringer kan komme i julenatt                                                |
| Lesbare hindre med forvarsel    | Trær/tinder synlige 2 600 enheter unna, port gløder i tåka     | Uendret                                                                         | Skygge på bakken under høye tinder                                                    |

Prinsipp: simuleringen (`slede.ts`) er ren og testet (`slede.test.ts`);
komponenten tegner og lytter. Ingen allokering per bilde i tegneløkka, 60 fps
på iPad. Etappenavn og HUD-tekst har ingen dagskoder (`kodelekkasje.test.ts`,
`komponentlekkasje.test.ts`).

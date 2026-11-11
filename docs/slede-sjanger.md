# IQs sledesimulator mot sjangeren

Kort gap-analyse av `snofall-tv/SledeSimulator.tsx` + `slede.ts` mot det
arkade-racere og flyspill gjør for at de skal kjennes gode. Spillere: Håkon (9)
og Kristian (12), iPad Safari og tastatur. Eget design, ingen kopi av et
bestemt spill.

| Konvensjon                      | Hadde                                                          | Nå                                                                                              | Rest                                                                                  |
| ------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Nedtelling før start            | Nei, rett inn i løpet                                          | 3–2–1–FLY med tikk; «FLY!» overlapper det første sekundet                                       | –                                                                                     |
| Akselerasjon/driv i styringen   | Konstant sidefart, ingen treghet                               | Styrefart med glidning (`s.vx`), bank følger                                                    | –                                                                                     |
| Vanskelighetsramp i etappen     | Flat fart hele veien                                           | Farten stiger 20 % mot mål (`RAMP`)                                                             | Tettere hindre mot slutten                                                            |
| Progresjon gjennom desember     | Fire etapper (18, 20, 21, 24)                                  | Ni etapper fra 8. desember (8, 9, 12, 14, 18, 19, 20, 21, 24), hver skrur én knott (`blanding`) | Egne horisontbilder for de nye etappene                                               |
| Dagens utfordring               | Nei                                                            | Én av seks per dato (`dagensUtfordring`), mål skalert til etappen, +500 ved mål                 | Logg over klarte utfordringer (krever lagring)                                        |
| Nær-miss-bonus                  | Nei                                                            | «NÆRE PÅ!» +40 og litt kraft når et tre/en tind passeres tett                                   | –                                                                                     |
| Kombo/multiplikator             | Nei, flate 100 per varde                                       | Rekke av varder uten bom gir x1–x4 på varder og stjerner; bom nullstiller                       | –                                                                                     |
| Fartslinjer/skjermristing       | Bare under sprang / krasj                                      | Fartslinjer skalerer med fart over marsjfart (sprang, løft, ramp)                               | –                                                                                     |
| Klare mål per etappe (medaljer) | 0–3 bjeller uten forklart terskel                              | Startskjermen viser tersklene, resultatet sier hva som mangler til neste bjelle                 | –                                                                                     |
| Resultatskjerm med oppsummering | Poeng + beste                                                  | Varder, stjerner, beste rekke, nære på, tidsbonus, krasj, utfordring, bjeller                   | –                                                                                     |
| «Én gang til» på ett trykk      | IGJEN-knapp (kunne havne under rullekanten)                    | Kompakt panel som får plass i TV-ruta, pluss Enter på resultatskjermen                          | –                                                                                     |
| Touch som kjennes god           | Absolutt posisjon i soner (fingeren må stå på et bestemt sted) | Relativ stikke: der fingeren lander er null, dra for å styre                                    | –                                                                                     |
| Spøkelse av beste runde         | Nei                                                            | Nei                                                                                             | Lagre `px` per 0,1 s per etappe (ca. 1 KB) og tegne en blek slede; krever synk-nøkkel |
| Sjekkpunkter                    | Nei                                                            | Nei                                                                                             | Etappene er 40–75 s, tre forsøk dekker behovet                                        |
| Pickups (boost)                 | Kraft fra varder, sprang på full måler                         | Uendret                                                                                         | Egne boost-ringer kan komme i julenatt                                                |
| Lesbare hindre med forvarsel    | Trær/tinder synlige 2 600 enheter unna, port gløder i tåka     | Trær står aldri utenfor rekkevidde (±1,25)                                                      | Skygge på bakken under høye tinder                                                    |
| Toppliste                       | Beste poeng og bjeller per etappe                              | Uendret                                                                                         | Bevisst utsatt                                                                        |

## Etappene

| Dag | Etappe                | Knott                                 | Horisont   |
| --- | --------------------- | ------------------------------------- | ---------- |
| 8   | Tundra-testen         | Grunnkurset                           | tundra     |
| 9   | Vardeløypa            | Varde annenhver seksjon, færre trær   | tundra     |
| 12  | Granskogen            | Trær på 60 % av frie seksjoner        | tundra     |
| 14  | Stjernedrysset        | Stjerner i alle høyder                | julenatt   |
| 18  | Kastevind-dalen       | Vind på 40 % av seksjonene, 1,6× kast | tundra     |
| 19  | Tindeflukten          | Tinder uten lysbånd                   | nordtoppen |
| 20  | Nordlys-strømmen      | Tinder og lysbånd (historie)          | nordtoppen |
| 21  | Muren og porten       | Tåke, tre porter (historie)           | muren      |
| 24  | Julenatt over grotten | Grotte, vind (historie)               | julenatt   |

Dagens utfordring sykler med datoen: varder (60 % av etappens), ren flyging,
stjerner (50 %), tid (1,15 × marsjtid rundet til 10 s), seks på rad, tre nære
på. Målet 24 og 75 er dagskoder og nudges til 25/76 (`trygtTall`).

Prinsipp: simuleringen (`slede.ts`) er ren og testet (`slede.test.ts`);
komponenten tegner og lytter. Ingen allokering per bilde i tegneløkka, 60 fps
på iPad. Etappenavn, intro, bjellekrav og utfordringstekst har ingen dagskoder
(`kodelekkasje.test.ts`, `komponentlekkasje.test.ts`). Nordlys-strømmen kan
ikke åpne før 18. desember (koden NORDLYS på dag 17).

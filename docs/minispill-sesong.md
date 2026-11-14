# Minispillene gjennom sesongen 2026

Vurdering av sidespillene mot den låste historien (`historie-2026.md`, `gaater-2026.md`, `eventyr.json`). Spillere: Kristian (12) og Håkon (9). Kjernen er dagens gåte med brikke i huset og brikke på skjermen; spillene er lek ved siden av, aldri en snarvei til koden.

**Det som finnes (11. november):**

- **Ugleposten** (`windows/nissespill/`, på main): fire kapitler, åpner dag 4, 10, 16 og 22, 6–9 gåter og to puslespill hver, åtte uglefjær til sammen. Modulen åpner etter koden dag 4; kapitlene åpner etter dato, ikke etter dagens kode.
- **IQs sledesimulator** (`snofall-tv/slede.ts`): på main ni etapper fra dag 8 (Tundra-testen 8, Ringløypa 9, Granskogen 12, Stjernedrysset 14, Kastevind-dalen 18, Tindeflukten 19, Himmelstrømmen 20, Muren og porten 21, Julenatt 24), ny hver 2.–3. dag, og én daglig utfordring (varder, renflyging, stjerner, tid, rekke, nære på) med 500 bonuspoeng. Beste poeng og bjeller lagres per etappe (`nissekomm-slede`, synket).
- **TEKNISK HUD** (`snofall-tv/MiniGames.tsx`): Kretsløp dag 8, Sorterer 16, Sentrifuge 19 (K2), Porten 21. Hvert er 30–60 sekunder med knapper, uten lagring. Grenen `fix/teknisk-hud` viser knappen grå før dagens kode og flytter sleden til dag 8.

## 1. Plan og tempo, dag for dag

«Nytt» er det som åpner den dagen. Sledeetappene er fra `slede.ts`; U = daglig sledeutfordring (finnes fra dag 8 uansett).

| Dag | Gåte / beat                  | Nytt å spille                                                    | Vurdering                                                                              |
| --- | ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | SIGNAL, M1, dag 1-åpning     | –                                                                | Riktig. Dagen er full.                                                                 |
| 2   | 48, jakt                     | –                                                                | Tomt, men jakt under stolene.                                                          |
| 3   | PRISME, første symbolkort    | Symbolskanner                                                    | Ritualet starter.                                                                      |
| 4   | KOMPASS, jakt (fr)           | **Ugleposten K1** «Senga i postkassen», NisseKrypto              | Godt plassert: fredag, før helgen.                                                     |
| 5   | ULRIKEN, jakt (lø)           | –                                                                | K1 fortsetter. Greit.                                                                  |
| 6   | LYKT, jakt (sø)              | –                                                                | Greit, stor jakt.                                                                      |
| 7   | KULDE, M2                    | NisseMusikk, Brevfugler, Frostgraden                             | Ikke spill, men nytt. Riktig på milepæl.                                               |
| 8   | KRETSKORT                    | Kretsløp (HUD), **Slede: Tundra-testen**, U                      | Første spilldag på TV. Begge etter koden.                                              |
| 9   | 24                           | **Slede: Ringløypa**, U                                          | Flyttet hit fra dag 10.                                                                |
| 10  | SPEKTER, frost 1, jakt       | **Ugleposten K2** «Antenna i permafrost», U                      | Frostdag, sju kort i stua, vanskegrad 4; etappen er flyttet til dag 9.                 |
| 11  | 75, bonus antenne, jakt (fr) | U                                                                | Bonusoppdraget er dagens ekstra.                                                       |
| 12  | MELODI, M3, krypto 1 (lø)    | **Slede: Granskogen**, U                                         | Helg, etter koden. Greit.                                                              |
| 13  | SAFRAN (sø)                  | U                                                                | Rolig søndag. Greit.                                                                   |
| 14  | ORIGAMI                      | **Slede: Stjernedrysset**, Brevfugler-radar med blå fugl         | –                                                                                      |
| 15  | KARAMELL, M4                 | U                                                                | Riktig stille på avsløringsdagen.                                                      |
| 16  | SORTERING, bonus lykt        | **Ugleposten K3** «Gufset fra dypet», Sorterer (HUD), NisseStats | Fire nye ting på en onsdag; etappen er flyttet til dag 18 (den heter det dagen heter). |
| 17  | NORDLYS                      | U                                                                | –                                                                                      |
| 18  | TURBULENS, krypto 2 (fr)     | **Slede: Kastevind-dalen**, U                                    | –                                                                                      |
| 19  | GULROT, pusterom (lø)        | Sentrifuge (K2), **Slede: Tindeflukten**                         | Pusterommet har det svakeste leketøyet, så etappen ligger her.                         |
| 20  | TURBO, 4. advent             | **Slede: Himmelstrømmen**                                        | –                                                                                      |
| 21  | BRANNMUR, M5, frost 2        | Porten (HUD), **Slede: Muren og porten**                         | Begge etter koden og begge om porten. Riktig.                                          |
| 22  | LANDÅS, jakt, Snill-listen   | **Ugleposten K4** «Klar til avgang»                              | Største kapittel (9 gåter) på en skoledag, men det kan spilles 22–24.                  |
| 23  | STJERNEKLART, krypto 3       | U                                                                | Riktig stille før finalen.                                                             |
| 24  | JULEMAGI, M6                 | **Slede: Julenatt over grotten**, brevet tiner, finale           | –                                                                                      |

**Konklusjon.** Uke 1 har ingen spill utover Ugleposten K1, og det er riktig: da læres kjerneløkka. Fra dag 8 er det noe nytt å gjøre hver dag, men bare hvis sledegrenen lander. Uten den er dag 8–17 tomme bortsett fra K2 og to knappeleker. Hullene (2, 5, 6, 13, 15, 17, 23) er jaktdager eller milepæler og skal være hull. Opphopningene er dag 10 og 16, og begge løses ved å flytte en sledeetappe.

## 2. Integrasjon med historien og appen

**Det som virker.** Ugleposten følger kunnskapstidslinjen: K2 handler om den frosne antenna (dag 10–11), K3 åpner dag 16 og vet hvem Vintervokteren er (barna lærte det dag 15), og gir et lys til grotta før muren dag 21; K4 har porten åpen og sleden pakket. Sledeetappene heter det historien heter (Himmelstrømmen, Muren og porten, Julenatt over grotten). HUD-lekene speiler dagens kode (Kretsløp 8, Sorterer 16, Porten 21) og åpner først etter den. `kodelekkasje.test.ts` leser hvert kapittel fra sin dag og hver etappes navn og introlinje; ingen av spillene gir bokstaver eller tall.

**Det som mangler.** Ingen av spillene gir noe tilbake til appen:

- **Fjærene** (8 stk.) belønnes bare med én replikk fra Rampenissen. Floke, ugla og fjærene finnes ikke noe annet sted i appen (null treff utenfor `nissespill/`).
- **Sleden** lagrer poeng og bjeller, men ingenting leser dem: ikke NisseStats, ikke PS, ikke NisseNet.
- **HUD-lekene** husker ingenting.
- **Lykkebjella** i Ugleposten (K1 finner den, K4 mister den igjen) og **bjellene** i sleden er samme ord uten kobling.

**Det som ikke kan endres.** Frostgraden er en fast tabell per dag (`frost.ts`: morgen, etter kode, etter bonus); radio og video er spilt inn på forhånd. Det eneste betingede innholdet er tekst: PS fra Julius, NisseMail, NisseNet-filer og Skjerm-kort (historien §3.6b). Spillbelønninger må derfor være tekst og filer, aldri frost, aldri lyd.

## 3. Anbefalinger, rangert

| #   | Tiltak                                                                                                                                                                                                                                                                                                                                         | Verdi   | Innsats |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 1   | **Land det som finnes.** Commit og merge sledeworktreen (dag 8, ni etapper, daglig utfordring) og `fix/teknisk-hud`. Dette er forskjellen på «noe nytt hver dag fra dag 8» og ti tomme dager, og ingenting av det rører gåtene.                                                                                                                | Høy     | S       |
| 2   | **Gjort:** tre etapper flyttet ut av opphopningene: Ringløypa 10 → 9, Kastevind-dalen 16 → 18 (TURBULENS), Tindeflukten 18 → 19 (pusterom, lørdag).                                                                                                                                                                                            | Høy     | S       |
| 3   | **Søskentavle i sleden.** Navneknapper Kristian/Håkon som i Brev til Julius, beste per etappe per spiller på startskjermen, dagens utfordring per spiller. Står i `todo.md` som «etter sesongen»; den bør fram, fordi det er dette som gjør daglig utfordring til noe en 9-åring og en 12-åring kommer tilbake til uten å konkurrere om gåten. | Høy     | M       |
| 4   | **Fjærene gir en fil.** Åtte fjær funnet → `MORO/floke.txt` i NisseNet (Winters notat om ugla), og én PS-variant dag 24 («Floke leverte åtte fjær …»). Samme mønster som `julius_ps_bonus`. PS-teksten er låst i steg 2 og trenger ja fra Hans.                                                                                                | Middels | M       |
| 5   | **Lykkebjella som kryssgjenstand.** Når K4 er fullført, får sleden bjellelyden fra K1 og HUD-linjen «LYKKEBJELLA OM BORD» på Julenatt-etappen. Én flagg-sjekk mot `EventyrSave`, ingen ny grafikk.                                                                                                                                             | Middels | S       |
| 6   | **Foreldreguiden «I kveld»** får én linje på dag 4, 10, 16 og 22: nytt kapittel i Ugleposten, forslag til roller (Håkon styrer, Kristian leser). Ren tekst i `_kveld/data.ts`.                                                                                                                                                                 | Lav     | S       |

**Ikke gjør før 1. desember (eller aldri):**

- **Spill som senker frosten eller gir merker.** Frosten faller bare med koder og bonus; det er historiens løfte. Tre merker er valgt fordi sju betydde ingenting. Spillpoeng i samme valuta gjør gåten valgfri.
- **Ukentlige hendelser i spillene knyttet til milepælene.** Krever nye bilder og loops (L), og videoene og radioen kan uansett ikke svare. Milepælene bærer seg selv.
- **Nye HUD-leker eller mer tid på Sorterer og Sentrifuge.** De er 30 sekunder, og det er greit. Ikke bygg dem ut.
- **Ugleposten bak dagens kode.** Kapitlene er 20–40 minutter og passer best på kveld eller helg. En sperre gir mas om koden i stedet for leting i huset.
- **Mer innhold i Ugleposten.** Fire kapitler er nok; K4 er allerede størst på en skoledag. Bruk tiden på bilder som mangler (gjenstår i `ugleposten-sjanger.md`), ikke nye scener.

# NisseKomm 2026 – Storyboard «Spøkelseskoden»

Utkast 10. november 2026. Kilde: `docs/historie-2026.md` (låst historie), dagens JSON i `src/data/`, komponentene i `src/components/` og `src/lib/game-engine.ts`. Repoet er ikke endret.

Beslutninger som er nyere enn deler av historiedokumentet, og som dette storyboardet følger:

- Én eventyr-ID `spokelseskoden`, tre merker.
- Julius-video hver dag (30–60 s) erstatter dagboken, åpner ved innlogging, brikke S ligger bare der og er indirekte.
- Rampenissen har et Morgenrådet-klipp hver dag. Hjemmeintegrasjoner (Skjerm, iMac, kalender) beskrives som kroker; rørleggingen designes senere.
- Rampestrekene er tull, ikke gåter. Åtte jaktdager: 2, 4, 5, 6, 10, 11, 19, 22.
- Frost dag 10 og 21 varer til koden er inne (nødstopp 20:00).
- Lokal kjøring (localhost/hjemmeserver), én familie: ingen familiekoder, ingen Sanity, ingen e-postregistrering.
- Snøfall TV: Gemini-videoloop per kanal, kodeeffekter (frost/Kulde) oppå, hendelser som i §9.

Innhold: 1 Flateoversikt · 2 Faste regler · 3 Dag for dag · 4 Hull og motsigelser · 5 Byggeliste · 6 Avgjørelser for mennesket.

---

## 1. Flateoversikt

Status: **finnes** (brukes som i dag), **endres**, **ny**, **fjernes**.

| Flate                                                                                | Hva den gjør i dag (kode)                                                                                                                                                                                                                                                           | Hva den må gjøre i 2026                                                                                                                                                                                                                                                                                                                                                                              | Status                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **NisseMail** (`windows/NisseMail.tsx`)                                              | Innboks 30/70, ulest-sporing, «NY», åpner KodeTerminal. Tekst fra `nissemail_tekst` i oppdrag-JSON; dagens tekster staver bokstaver og filnavn.                                                                                                                                     | Samme komponent. 24 nye tekster på 60–100 ord: hva skjedde, hvem gjør hva. Ingen bokstaver, ingen filnavn med svar, ingen «hvor». Bonusoppdrag-e-post dag 11 og 16 beholdes.                                                                                                                                                                                                                         | endres (innhold)        |
| **Dagbok** (`windows/Dagbok.tsx`)                                                    | Rulleliste med `dagbokinnlegg` for løste dager, lesesporing med IntersectionObserver, rød teller.                                                                                                                                                                                   | Blir **videoarkiv**: dagens video øverst med autostart, transkript under når den er ferdig, «PS fra Julius» (2–3 setninger) låses opp når koden er inne. Alle sette dager under. Åpner seg selv ved innlogging når dagens video ikke er sett («NY MELDING FRA JULIUS»), rød prikk på ikonet til den er sett ferdig. Ingen videospiller finnes i koden i dag (`<video>` brukes bare av QR-skanneren). | endres (M)              |
| **Julius' video** (ekstern produksjon, 24 filer)                                     | Finnes ikke. Kanal 3 har tekstlige «VLOG»-innslag (`VLOG_ENTRIES` i `SnøfallTV.tsx`) som staver svaret, og dag 2 har IQ som taler.                                                                                                                                                  | 24 klipp à 30–60 s: lore (15–30 s), i natt (10–15 s), brikke S indirekte (5–10 s). Julius alle dager. Transkript i JSON som reserve. Spilles i Dagbok og på Kanal 3 fra samme spiller.                                                                                                                                                                                                               | ny                      |
| **Kalender** (`windows/Kalender.tsx`)                                                | 24 luker, tre tilstander, modal → NisseMail.                                                                                                                                                                                                                                        | Uendret. Titlene må ikke inneholde dagens kode (dag 21 gjør det).                                                                                                                                                                                                                                                                                                                                    | finnes (tittelfiks)     |
| **KodeTerminal** (`windows/KodeTerminal.tsx`)                                        | Validering, 1,5 s, gullblink, foreldrekode for bonus, kaller `/api/home-bridge` (POST).                                                                                                                                                                                             | Uendret. Ingen sperre mot video. Bonusgodkjenning gir −20 % frost i stedet for merke. Fjern utgående home-bridge-kall (Skjerm poller i stedet).                                                                                                                                                                                                                                                      | endres (S)              |
| **Snøfall TV** (`windows/SnøfallTV.tsx`, 2 955 linjer)                               | Fire fotofeeder (PNG) med SVG-effekter, frekvenshjul 85,0–108,0, spøkelsesbilde (`PIRATE_INTERCEPTS`, 7 dager: 3, 7, 10, 11, 13, 16, 21), fire minispill (kretskort, sorterer, slede, zapper), tekst-TV, 7 scenarioknapper synlige for barna. Kanal 3 viser VLOG-tekst med fasit.   | Kanal 3 = videospilleren. Kanal 1/2/4 = loop + minispill som lek/bekreftelse etter koden, aldri brikke. Loops erstatter PNG (fem faste + ca. ti hendelsesloops, §9). Kodeeffekter styrt av Frostgraden. Spøkelsestekstene skrives om fra hån til lengsel. Scenarioknappene flyttes til Nissemor-guiden.                                                                                              | endres (L)              |
| **NisseNet** (`windows/NisseNetUtforsker.tsx` + `statisk_innhold.json › filer`)      | Filtre med 30 filer. Mange inneholder fasit (eks. `julesanger-samling.txt`: «KODEORD PÅ 6 BOKSTAVER», `om-snofall.txt`: N-A-L). `hint_arkiv.txt` viser `hint`-feltet, som staver koden. Verktøyfiler for dag 7, 9, 10, 16, 22 låses opp først **etter** dagens kode (topic-vilkår). | Verktøy og arkiv: `alfabet.txt` (dag 5), `krystallformel.txt` (dag 9), `farge-koder.txt` (dag 10, rekkefølge), `alfabet.txt` igjen (dag 22), Fargesamlerens arkiv (dag 10, 15, 23), tre DEKRYPTERT-filer = de tre avsløringene. Alle verktøy åpner på dato (`afterDay`), ikke etter kode. `hint_arkiv.txt` fjernes.                                                                                  | endres (M)              |
| **NisseMusikk** (`windows/NisseMusikk.tsx`)                                          | 13 chiptune-spor, bunnpanel med «DEL 2: O - D - I» hardkodet.                                                                                                                                                                                                                       | Åpner dag 7 som «varmekilden». Dag 12: «FROSSET» til koden er inne. Hardkodet brikke fjernes.                                                                                                                                                                                                                                                                                                        | endres (S)              |
| **Brevfugler** (`windows/Brevfugler.tsx`)                                            | Radar, skriv brev til Julius (lagres lokalt), faseliste for `brevfugl-mysteriet` (1, 5, 12, 14) hardkodet, lover «Julius' svar kommer neste dag i NisseMail» (ingen svarmekanisme finnes).                                                                                          | Åpner dag 14. Radar med én blå fugl fra grotten og et fryst brev som tiner dag 24. Faselisten og svar-løftet fjernes; brevskriving kan stå.                                                                                                                                                                                                                                                          | endres (M)              |
| **NisseKrypto** (`windows/NisseKrypto.tsx`)                                          | Tre dekrypteringer (dag 12, 18, 23) med rekkefølgehint, låser opp DEKRYPTERT-filer.                                                                                                                                                                                                 | Uendret mekanikk. Nye tekster i `rewardText` og i de tre filene (avsløringene). Dag 12 gir merket Varmebærer.                                                                                                                                                                                                                                                                                        | endres (innhold)        |
| **SymbolScanner** (`windows/SymbolScanner.tsx`) + QR-side i Nissemor-guiden          | QR + manuell kode for ni kort.                                                                                                                                                                                                                                                      | Uendret. Ni kort skrives ut som før.                                                                                                                                                                                                                                                                                                                                                                 | finnes                  |
| **EventyrOversikt** (`windows/EventyrOversikt.tsx`)                                  | Ni eventyr med faser og kamerametadata per ID (`eventyr.ts`).                                                                                                                                                                                                                       | Én fremdriftslinje med seks milepæler (M1–M6). Kamerametadata faller til standard.                                                                                                                                                                                                                                                                                                                   | endres (M)              |
| **Sidepanel** (`modules/SystemStatus.tsx`, `VarselKonsoll.tsx`)                      | Fire metrikker (NISSEKRAFT, BREVFUGL-SVERM, VERKSTED-VARME, SLEDE-TURBO), dagsvarsler fra `daily_alerts` (flere staver koden: dag 9, 11, 13, 14, 18, 19, 20, 21, 23).                                                                                                               | **Frostgraden** som hovedtall fra dag 7, faller ved kode og bonus. Dag 21: åpen port tegnes når koden er inne. Varslene skrives om uten kodeord.                                                                                                                                                                                                                                                     | endres (M)              |
| **NisseStats** (`windows/NisseStats.tsx`)                                            | Produksjonstall med sigmoid, åpner dag 16.                                                                                                                                                                                                                                          | Uendret, åpner dag 16.                                                                                                                                                                                                                                                                                                                                                                               | finnes                  |
| **GrandFinaleModal** (`ui/GrandFinaleModal.tsx`) + `NameEntryModal` + `/snill-liste` | Navneregistrering, finale dag 24 med navn.                                                                                                                                                                                                                                          | Finale med Julius' hilsen (video 24 + tekst). Navneregistrering dag 22.                                                                                                                                                                                                                                                                                                                              | endres (innhold)        |
| **Nissemor-guiden** (`app/nissemor-guide/*`)                                         | Dagplan, handleliste, QR-kort, utskrifter med diplom, bonusoppdrag, innstillinger, statistikk.                                                                                                                                                                                      | Pluss: «Frost av»-bryter, scenariovelger for Snøfall TV, «marker video som sett». Diplomtekst «Snøfalls venn». Rampestrek-feltet fra §8.                                                                                                                                                                                                                                                             | endres (S)              |
| **Frosttilstand / endepunkt** (`app/api/home-bridge/route.ts`)                       | Bare POST med utgående webhooks (`SKJERM_WEBHOOK_URL`, `FLEET_WEBHOOK_URL`). IMPLEMENTATION.md beskriver en GET som ikke finnes.                                                                                                                                                    | GET `/api/frost` (eller home-bridge) som returnerer `{frost, level, until, message, solved_today}`. Avledet av dato og løst-status, ikke lagret. Skjerm poller.                                                                                                                                                                                                                                      | ny (S)                  |
| **Frostmodus i appen**                                                               | Finnes ikke (bare `ghostOverlay` i TV).                                                                                                                                                                                                                                             | Dag 10 nivå 1: fargeløst med glimt, VHS-striper, spøkelsesbilde på alle kanaler «KROMATISK DRENERING 71 %». Dag 21 nivå 2: rimkant, Kuldes linje, bare NisseMail, Dagbok/Kanal 3 og KodeTerminal åpne. Tøvær ved kode.                                                                                                                                                                               | ny (M)                  |
| **Innlogging** (`api/auth/*`, `api/family`, `api/session`, Sanity, Resend, cron)     | Familiekoder, registrering, e-post, Sanity-synk.                                                                                                                                                                                                                                    | Lokal enbrukerdrift: ett oppstartspassord i `.env` eller ingen. Alt annet fjernes.                                                                                                                                                                                                                                                                                                                   | fjernes (M)             |
| **Boot og innsøking** (`ui/BootSequence.tsx`, `ui/PasswordPrompt.tsx`)               | 2 s fremdriftslinje «ENISSEKJERNE 3.8 / LASTER…», så passord, så «KOBLER TIL SNØFALL…» som tekstlinje.                                                                                                                                                                              | Dag 1: etter passordet en innsøking 85,0 → 90,0 der K1, K2, K4 og K3 kommer inn én etter én med stillbilde og støy, siste linje «BÆREBØLGE 90,0: USTABIL»; 4 s hale med 85,0 etter Julius' video. Fra dag 2 som i dag. Se T14.                                                                                                                                                                       | endres (S)              |
| **Merker** (`merker.json`, `badge-system.ts`)                                        | Sju merker; vilkårstyper bonusoppdrag, eventyr, allDecryptionsSolved, allSymbolsCollected, allQuestsCompleted.                                                                                                                                                                      | Tre: Varmebærer (én bestemt dekryptering), Portvokter (dag 21 løst), Snøfalls venn (24 dager). Ny vilkårstype `decryptionSolved` og `dayCompleted`.                                                                                                                                                                                                                                                  | endres (S)              |
| **Morgenrådet-klipp** (ekstern)                                                      | –                                                                                                                                                                                                                                                                                   | 24 klipp à 45–60 s med Rampenissens stemme. Aldri brikker, aldri «hvor». Leveres til radioproduksjonen.                                                                                                                                                                                                                                                                                              | ny                      |
| **Rampestrek** (fysisk)                                                              | `rampenissen_rampestrek` i JSON beskriver gåteoppstilling.                                                                                                                                                                                                                          | Streken fra §8, ren moro. Feltet i JSON skrives om. Lappen ligger i scenen på ikke-jaktdager.                                                                                                                                                                                                                                                                                                        | endres (innhold)        |
| **Fysisk brikke H** (utskrifter)                                                     | Lapper beskrevet i `materialer_nødvendig`.                                                                                                                                                                                                                                          | Standardisert «frostlapp» (se §2) per dag, ni symbolkort, tallapper. Én PDF fra `printout`-siden.                                                                                                                                                                                                                                                                                                    | endres (M)              |
| **Skjerm (kjøkken + gang)** via Varden                                               | Ikke koblet til NisseKomm.                                                                                                                                                                                                                                                          | Frost dag 10 og 21 (poller endepunktet), Orakel-kort dag 7, julehilsen dag 24, iCal med 24 hendelser.                                                                                                                                                                                                                                                                                                | ny (senere)             |
| **iMac gråtone** via Varden                                                          | Finnes (Fleet).                                                                                                                                                                                                                                                                     | Dag 20 kl. 09–12 med melding fra Rampenissen.                                                                                                                                                                                                                                                                                                                                                        | finnes (konfig, senere) |

---

## 2. Faste regler som gjelder hver dag

Disse står én gang her, så dagene under slipper å gjenta dem.

**Frostlappen (brikke H på orddager).** Lappen i huset viser kodeordet med noen bokstaver synlige og resten «iset over» (trykt som iskrystaller). Eksempel dag 7: `K _ _ _ E`. Julius' setning peker på ordet uten å si det. Hver for seg skal de være for svake; sammen gir de ett ord. Kristian trenger begge; Hanna og Håkon skaffer lappen. Lappene trykkes fra Nissemor-guiden (én PDF for hele måneden). Tall-dager (2, 9, 11) og kodedager (5, 22) har egne lapper, se dagen.

**Brikketaket (gjelder alle dager).** Ingen enkelt flate skal gi mer enn 40 % av koden. For ord: huset viser høyst 40 % av bokstavene (rundet ned; 5–7 bokstaver → 2, 8–9 → 3, 12 → 4), aldri både første og siste bokstav, aldri en sammenhengende stavelse. Julius' setning inneholder aldri ordet, et synonym eller ordets første lyd; den beskriver bruken eller hvem som sier det. Verktøyfiler gir regel, aldri bokstaver. For tall: huset gir tallene, Julius gir regneregelen, og regelen står ikke på lappen. Skjelettene i §3 er skrevet før taket ble satt og bryter det på dag 3, 4, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23 og 24 (de gir 50–80 %); de **merkes «steg 1»** og strammes i gåtegjennomgangen med taket som hard grense. Dag 1, 2, 5, 7, 9, 11 og 22 holder taket slik de står. Alternativ til færre bokstaver, der ordet blir for vanskelig for et 12-årig øye: bokstavene gis i feil rekkefølge (som dag 1) eller spres på flere ting som må hentes (som dag 19).

**Betinget innhold.** Video og radio er spilt inn på forhånd og kan ikke forgrene seg. Alt som avhenger av om barna gjorde noe (bonus løst, kode inne, navn registrert) ligger derfor bare i tekst som koden kan velge mellom: PS fra Julius, NisseMail, spøkelsesbildet, Skjerm-kort. Julius snakker om bonusene i fremtid eller på en måte som er sann uansett.

**Kunnskapstidslinje.** Hvem vet hva, så ingen flate sier noe avsenderen ikke kan vite:

| Dag | Barna vet                                                                         | Rampenissen vet                                                                               | Julius vet                             | IQ vet                                  |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| 1–6 | Noe hakker på linjen                                                              | Det samme, sett fra gulvet                                                                    | Orakelet hører noe på 85,0             | Linjen er bygd riktig; noe annet sender |
| 7   | Navnet: Kulde. Frostgraden                                                        | Navnet (hørte Julius si det på linjen)                                                        | Navnet                                 | Navnet                                  |
| 12  | Kulde høres alene ut (avsløring 1)                                                | Hørte sukket selv, blir ikke trodd                                                            | Tviler: sorg, ikke sinne               | Vil ikke høre om det                    |
| 15  | Hvem Kulde er: Vintervokteren, bygd av IQ (notatboken)                            | Det samme, samme kveld: han sitter i stua når barna leser. Fra nå kaller ingen Kulde «fiende» | Det samme, IQ fortalte ham om morgenen | Fant notatboken i natt, sier én setning |
| 17  | Grotten svarte med lys                                                            | Så det grønne over Ulriken                                                                    | Første kontakt                         | Begynner å tegne en mur med port        |
| 20  | Kulde når huset i morgen; muren er for å holde varmen inne, ikke for å stenge ute | Han skal holde huset varmt (bøker, lokk) og vet at porten skal stå åpen                       | Bestemmer porten                       | Bygger muren                            |
| 21  | Porten står åpen                                                                  | Det samme                                                                                     | –                                      | –                                       |
| 23  | Hele historien (avsløring 3)                                                      | Det samme, men ikke hva som ligger under treet i morgen                                       | –                                      | –                                       |
| 24  | Alt                                                                               | Alt                                                                                           | –                                      | –                                       |

Konsekvens for tonen etter dag 15: Rampenissen rigger ikke til krig. Bokmuren dag 21 er «for å holde huset varmt», grytelokket er mot trekken, og han sier selv at porten skal stå åpen. Julius bruker aldri «fiende», «slå» eller «knuse» etter dag 12.

**Hvordan lappen hentes.** Historien krever at brikke H «må hentes, telles, sorteres, lyses på eller ses gjennom filter, aldri bare leses av». Dagene under sier hva barna faktisk gjør. På jaktdager ligger den utenfor scenen; ellers i scenen.

**Video (brikke S).** Tre deler i fast rekkefølge: lore → i natt → brikken. Brikken er alltid siste setning, så Kristian vet hvor han skal spole. Transkriptet vises når videoen er ferdig. «PS fra Julius» (2–3 setninger, tidligere dagbokinnlegg) åpner under når koden er inne. Kulde-forstyrrelse i videoen: **0** ren, **1** lett snø/striper, **2** bildet fryser 1–2 s midt i, **3** lyd og bilde hakker, Julius må gjenta brikken.

**Radio.** Rampenissens klipp bærer tre ting: hva som skjedde i natt (fra gulvet på Landås), hvordan han har det, og bekreftelse av gårsdagen. Aldri brikker, bokstaver, tall eller «hvor». Hvis et klipp mangler, mangler barna ingenting.

**Roller (revidert 10. november).** Gåtene er for Kristian og Håkon. Håkon henter, krabber, teller, sorterer og bretter (**H9**). Kristian slår opp, dekoder, regner, ser videoen med de andre og taster (**K12**). Hanna (**H5**) er med gjennom rampestreken, symbolkortene, radioen, historien og videoene; der dagene under sier «H5», leses det som «Hanna, hvis hun vil», og Håkon eller Kristian kan alltid gjøre det samme. Gjeldende rollebeskrivelser per dag står i `gaater-2026.md`.

**Hannas dager (revidert 10. november).** Det tidligere kravet om at Hannas handling skal gi noe koden trenger, er opphevet: fjorårets gåter var for lette, og nivået er nå lagt for en 12-åring med en 9-åring på slep. Hanna har ingen kodebærende steg noen dag. Hun er med gjennom rampestreken (hun finner den først), symbolkortene (hun skanner dem som ritual på dag 3, 6, 9, 12, 15, 18, 20, 22, 23; hvem som helst kan skanne), Morgenrådet og Julius' videoer. Hver dag har i tillegg én valgfri «Hanna, hvis du vil»-rolle (puste på speilet, telle sko, krype inn i fortet, lukte på posene), og ingen tekst sier «bare du» eller «din jobb». Listen står i `gaater-2026.md` per dag.

**Frostgraden.** Vises i sidepanelet fra dag 7. Tabellen er fasit for koden (statisk per dag i JSON, ingen formel):

| Dag               | 7   | 8   | 9   | 10     | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20     | 21     | 22  | 23  | 24  |
| ----------------- | --- | --- | --- | ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | ------ | ------ | --- | --- | --- |
| Morgen (før kode) | 30  | 34  | 40  | **71** | 62  | 55  | 44  | 50  | 56  | 63  | 52  | 60  | 68  | **88** | **94** | 40  | 30  | 12  |
| Etter kode        | 22  | 28  | 32  | 45     | 48  | 32  | 36  | 40  | 46  | 50  | 42  | 48  | 56  | 76     | 32     | 24  | 10  | 0   |
| Etter bonus       |     |     |     |        | 28  |     |     |     |     | 30  |     |     |     |        |        |     |     |     |

Dag 1–6 vises ingen prosent (Orakelet har ikke navnet ennå). Dag 10 og 21 er angrepsdager med hopp. Dag 20 er varselet. Uløste dager står på morgenverdien til de løses.

**Snøfall TV-kanaler (avgjort 10. november).** K1 Snøfall landsby/ute, K2 IQs verksted (sikringer, kolbe, sentrifuge, trykkmåler), K3 Julius' video, K4 antennen ved tjernet (frekvenshjul, HUD, minispill). 85,0 MHz på hjulet = Krystallgrotten (Kuldes spøkelsesbilde). Koden endres til å følge kartet (hull 20).

---

## 3. Dag for dag

Mal per dag: **Morgen** (strek, radio) · **Innlogging** (video) · **Gåte** (H, S, kode, hvem) · **Flater** · **Belønning** · **Kontinuitet**.

### Dag 1 (ti) – Direktelinjen · SIGNAL · M1 Linjen

**Morgen.** Strek (stor, åpneren): Rampenissen har kommet ned linjen sammen med Nissemors proviant. Fra TV-benken velter et skred av klementiner utover gulvet i en smal elv mot stuedøra, med revnede fraktesker «SNØFALL FRAKT · VITAMIN C TIL LANDÅS» på toppen. I enden stikker bare nisseluen og én vinkende arm opp av haugen; banan som pute, serviettfallskjerm bak. Halvveis nede i skredet ligger en svart ferdskriver med oransje striper, forseglet av IQ. Den røde garntråden går fra TV-en («LINJE 90,0») over skredet til håndleddet hans. Scene og bygging: «Dag 1: byggeplan» i `gaater-2026.md`. Radio: «Jeg er tilbake! Jeg sov i en garnkurv på loftet i Snøfall hele året. IQ sendte meg ned i natt. Noe knitrer på linjen, og det er ikke meg.» Bananen i haugen gjør at «noe gult og buet» stemmer. Stemning: glad, litt søvnig.

**Innlogging.** Boot dag 1 (T14): strøm på, passordskjerm (A1), og etter riktig passord fra IQs konvolutt blir «KOBLER TIL SNØFALL…» til en innsøking: frekvenstall ruller 85,0 → 90,0 og låser, så kommer K1, K2, K4 og K3 inn én etter én med stillbilde og støy mellom, siste linje i gult «BÆREBØLGE 90,0: USTABIL». Så skrivebordet, og videoen åpner seg selv: «NY MELDING FRA JULIUS». Tema: advent betyr ankomst; hvorfor vi venter og teller dager i stedet for å hoppe rett til julaften. Velkomst: hele Snøfall har ventet; IQ sendte forsyninger ned linjen i natt («mest se-vitamin, sier Nissemor. Og én nisse»). I natt: IQ åpnet direktelinjen 90,0 MHz, men bærebølgen hakker; Orakelet hører noe under den. Brikke S: «Når linjen bærer, roper IQ ett ord fra verkstedet. Det er det ordet radioen deres leter etter når den skurrer, rett før stemmen kommer gjennom.» Kulde-nivå 1 (lett snø). Etter mikrofon-klikket legger appen på en 4 s hale (T14): bildet står, lampen flakker, snø stiger, HUD «LINJE 90,0 · BÆREBØLGE USTABIL», frekvensen sklir til 85,0 i ett sekund og tilbake til «90,0 · STABIL». Ingen stemme, ingen blåfarge; første spøkelsesbilde er fortsatt dag 3.

**Gåte.** Som i `gaater-2026.md` dag 1: seks A7-kort med klesklyper på tråden, talt fra TV-en ❄ I ❄ N ❄ ❄, tegn i hjørnet, prikker 1–6 bak; to løse kort E og T uten klype i klementinelva (blindspor: bare det som henger på linjen, teller). Håkon følger tråden fra TV-en til luen og tar av kortene i rekkefølge (H9), Kristian ser `_ I _ N _ _` og hører Julius (K12). Kode **SIGNAL**. I ferdskriveren: IQs konvolutt med passordet, flyloggen, runetavla (meta 1) og operasjonsbrettet. Hanna, hvis hun vil: graver fram Rampenissen og tar kortene av mens Håkon holder tråden.

**Flater.** Mail: tilbake, proviant, linjen hakker, «følg tråden, bare det som henger på linjen teller, heng opp tavla». Ingen bokstaver. NisseNet: `SYSTEM/om-snofall.txt` skrives om uten N-A-L (bare velkomst og kart over Snøfall); `sikkerhet.log` nevner 85,0 som «overvåkes». Snøfall TV: innsøkingen over, K3 viser video. NisseMusikk, Brevfugler, NisseKrypto: låst. Frost: ikke synlig («ORAKELET LYTTER …»).

**Belønning.** PS fra Julius: kommenterer skredet og varsler kaffetrakteren (dag 2). Operasjonsbrettet henges opp med runetavla; første gullmerke i milepælsirkel 1. Appen og Snøfall TV er åpne.

**Kontinuitet.** Setter opp: hakkingen (dag 3 blir et glimt, dag 7 et navn), 85,0 som et tall som rullet forbi. Klementinene er Nissemors forsyning mot mørket; at oransje er den varme siden, sies først dag 7 (PS) og dag 10 (det eneste i stua med farge). Fraktesken «SNØFALL FORRÅD» står ved TV-en til den er spist; den tomme esken er kofferten dag 24, og den siste klementinen ligger ved krystallet. Garnkurven som Rampenissen takker for dag 24.

### Dag 2 (on) – Sikringsboksen til IQ · 48 · jakt

**Morgen.** Strek: sitter midt i sukkerskålen med sukker rundt munnen og teskje i hånden. Radio: «Det smalt i Snøfall i natt. Tre sikringer. IQ sier det ikke var kaffetrakteren. Det var kaffetrakteren. Jeg fikk sukkersjokk av skrekk.» _Ikke_ «under stolene» (se hull 8).

**Innlogging.** Tema: Snøfalls verksted, hvorfor nissene reparerer i stedet for å kaste. I natt: tre sikringer gikk da IQ koblet trakteren på forsterkeren; Kanal 2 er mørk. Brikke S: «IQ sier man aldri bytter én sikring. Man legger alle sammen.» Kulde 1.

**Gåte.** H: tre lapper teipet under tre spisestoler med bare et tall hver: 12, 16, 20 (ingen instruks). Hanna og Håkon krabber (H5 finner den under sin egen stol, H9 de to andre). S: legg sammen. Kristian regner 48 (K12). Kode **48**. Uten S prøver de gjerne «20» eller «121620» og går tilbake til videoen.

**Flater.** Mail: smellet, Kanal 2 mørk, «krabb». K2 sikringsboks lyser opp når koden er inne (eksisterende `fuses`-tilstand). Frost: ikke synlig.

**Belønning.** K2 får strøm. PS: «Tre sikringer. Én kaffetrakter. Én IQ.»

**Kontinuitet.** IQ som bygger alt, også feil. Pekes tilbake på dag 15 («IQ er stille»).

### Dag 3 (to) – Rimfrost på Ruten · PRISME + grønt hjerte · første spor

**Morgen.** Strek: tannkrem på badespeilet «RAMPEN VAR HER. NO CAP.» og surt fjes. Radio: «Jeg så et blått glimt på stueruten klokka tre. Orakelet sier noen lytter på linjen. Jeg sier det var en bil. Jeg tror ikke det var en bil.»

**Innlogging.** Tema: hvordan rimfrost og iskrystaller blir til (vanndamp som fester seg på kaldt glass). I natt: krystallmønster på linjen, Orakelet så et blått glimt på 85,0 MHz. Brikke S: «Pil holdt glassbiten mot lyset, og hele regnbuen falt på gulvet. IQ sa ordet for en sånn glassbit tre ganger. Jeg husker det nesten.» Kulde 1, med ett kort blått blaff i bildet.

**Gåte.** H: frostlapp `P _ I _ M _` teipet på speilet under tannkremen; en glassperle (innkjøp) i vinduskarmen sammen med grønt hjerte-kort. Hanna holder perlen i lyset og lager regnbue på gulvet (H5), skanner kortet. Håkon henter lappen (H9). S: glassbit som lager regnbue. Kristian: PRISME (K12). Kode **PRISME**.

**Flater.** Mail: ber dem se etter «noe som blør gjennom» på TV. Snøfall TV: første spøkelsesbilde på 85,0 MHz, et blått glimt i isen (kode + grotte-loop). Teksten skrives om til lengsel. NisseNet: ingen fil nødvendig (`snowflake-patterns.txt` fjernes eller blir ren lore). Symbol 1/9.

**Belønning.** PS: Julius om tannkrem. Symbolkort på brettet.

**Kontinuitet.** Første glimt av Kulde. Grotten vises første gang (uten navn).

### Dag 4 (fr) – Skotoget i Gangen · KOMPASS · jakt

**Morgen.** Strek: pappas solbriller og pappas sko, kosedyr på rekke bak. Radio: «Rudolf fløy rett i snøfonna i natt. Han sa han fant veien med nesen. Jeg har laget en pil. Av noe. Ikke si hva.»

**Innlogging.** Tema: Barbro-dagen, grener i vann som blomstrer til jul. I natt: Rudolf mistet retningen i Kuldes tåke over fjorden. Brikke S: «Rudolf trenger det samme som sjøfolk alltid hadde med: nålen som finner nord uansett vær.» Kulde 1.

**Gåte.** H: skotoget går ut av scenen (gangen) og inn i et annet rom; i den siste skoen ligger frostlappen `K _ M _ A _ S`. Hanna følger toget (H5), Håkon tar lappen ut av skoen (H9). S: nålen som finner nord. Kristian: KOMPASS (K12). Kode **KOMPASS**.

**Flater.** Mail: Rudolf, tåke, «følg skoene». NisseKrypto åpner (neste morgen eller ved kode). K1: Rudolf-stall-overlegg kan stå som lek. Frost: ikke synlig.

**Belønning.** NisseKrypto på skrivebordet; de to kortene så langt kan skannes.

**Kontinuitet.** Kuldes tåke = første gang Kulde gjør noe ute. Sleden og Rudolf forberedes (dag 18, 23).

### Dag 5 (lø) – Brevfuglen over Byfjellene · ULRIKEN · jakt

**Morgen.** Strek (helg, større): marshmallow-krig mellom Rampenissen og kosedyrene fra hvert sitt putefort, én bamse med plaster. Radio: «Det har vært krig i stua. Vi vant. Og: en brevfugl landet i natt, første på Bergen i år. Den hadde skrevet noe rart på vingen. Winter er paranoid.» _Ikke_ «på lampen».

**Innlogging.** Tema: den første brevfuglen til Bergen (lore: Winter sendte den for 40 år siden, den landet på Fløyen og nektet å fly videre i regnet). I natt: Winter krypterer alt fordi noen lytter. Brikke S: «Winter flyttet hver bokstav ett skritt fram i alfabetet. Dere må gå ett tilbake.» Kulde 1.

**Gåte.** H: papirfugl gjemt høyt (bokhylle/lampe) med «V M S J L F O» på vingen; Håkon finner og henter den (H9), Hanna holder alfabetstrimmelen (trykt, med Æ Ø Å) og peker på bokstaven foran hver gang (H5). S: ett tilbake. Kristian dekoder (K12): ULRIKEN. Kode **ULRIKEN**. Verktøy: `SNOFALL-HISTORIER/alfabet.txt` (åpner dag 5 på dato) er bare alfabetet, ingen regel.

**Flater.** Mail: brevfugl, Winter, «finn fuglen». NisseNet: `alfabet.txt`. K1: Ulriken-radar-overlegg som lek. Frost: ikke synlig.

**Belønning.** PS: Julius om marshmallows.

**Kontinuitet.** Winter og brevfuglene (dag 14, 24). Ulriken er landingsmerket dag 22–23.

### Dag 6 (sø) – Skyggene i Gangen · LYKT + rødt hjerte · 2. advent · jakt

**Morgen.** Strek (helg): snøengler i mel på kjøkkenbordet, Rampenissen midt i den største. Radio: «Jeg fant lommelykten deres. Og en papprull. Jeg har laget noe til dere. Det er ikke rot. Det er et instrument. Melet er rot.»

**Innlogging.** Tema: St. Nikolaus, gaver i sko, lyktene folk bar mellom gårdene. I natt: Orakelet sier lys er det Kulde ikke tåler; IQ hengte lykter rundt antennen. Brikke S: «Det barna bar mellom gårdene da det var som mørkest. Ikke et bål, ikke et stearinlys. Det med håndtak.» Kulde 1.

**Gåte.** H: lommelykt + papprull med bakepapir og sjablong i enden, gjemt utenfor scenen (gang/soverom) sammen med rødt hjerte-kort. Sjablongen er skjelettet `L _ K _` skåret ut, så bokstavene står på veggen når Håkon lyser (H9); Hanna sier hva hun ser og leser bokstavene (H5). S: det med håndtak. Kristian: LYKT (K12). Kode **LYKT**. **Steg 1:** utskårne bokstaver i bakepapir gir bare diffust lys med en vanlig lommelykt; bokstavprojeksjon er ikke pålitelig. Bruk skyggefigurer (silhuett som kan være lykt, lampe eller fakkel; Julius' «med håndtak» avgjør) eller en lapp som bare kan leses med lykt under bordet, innenfor brikketaket.

**Flater.** Mail: lys er våpenet, «finn lommelykten». Ingen fil. K1 «lyktefest»-overlegg som lek. Symbol 2/9.

**Belønning.** PS: Julius om mel.

**Kontinuitet.** Lys som våpen → dag 16-bonus (lykt i vinduet mot nord), dag 24 (sleden med lys).

### Dag 7 (ma) – Inntrengeren i Fryseren · KULDE · M2 Navnet

**Morgen.** Strek: fastfryst i fryserdøra, lua inne i fryseren, vottene stive. (Nikker til historien.) Radio: «Lua mi sitter fast i fryseren deres. Jeg prøvde å kjøle ned modemet, for Orakelet sa at noe varmt skurret. Det var feil. Det som skurrer er kaldt. Orakelet fant navnet i natt. Jeg sier det ikke på radio.» Skjerm-kort 06:00–08:30: «ORAKELET: ukjent signatur på 85,0 MHz».

**Innlogging.** Tema: mørketid; hvorfor sola ikke står opp nord for polarsirkelen, og at kulde ikke er ondskap, bare fravær av varme. I natt: Orakelet fanget signaturen. Det har et navn. Frostgraden kan måles nå. Brikke S: «Navnet er det motsatte av det Nissemor har i ovnen akkurat nå. Ikke bollene. Det som kommer ut når hun åpner døra.» Kulde 2 (bildet fryser 1–2 s idet han sier navnet, så han sier det ikke).

**Gåte.** H: frostlappen `K _ _ _ E` ligger i en liten pose fryst inn i et glass vann i fryseren; Hanna holder glasset under varmt vann med en voksen til posen slipper (H5): varme smelter kulde, uten at noen sier det. Håkon tørker og leser (H9). S: motsatt av varme. Kristian: KULDE (K12). Kode **KULDE**.

**Flater.** Mail: Orakelet har navnet, «redd lua mi». Sidepanel: **Frostgraden 30 %** vises første gang. Snøfall TV: signaturen brenner seg inn et øyeblikk på alle kanaler (kode); spøkelsesbilde dag 7 («-42,8 °C»). NisseMusikk åpner («varmekilden», liten tekst i vinduet). NisseNet: `snofall_fakta.txt` skrives om til Orakelets rapport uten D-E, åpner på dato.

**Belønning.** Frost 30 → 22. NisseMusikk. PS: «Nå har det et navn. Ting med navn kan man snakke til.»

**Kontinuitet.** M2. Fra nå teller Frostgraden. «Kan snakke til» peker mot dag 21 (porten) og 23.

### Dag 8 (ti) – Floken i Verkstedet · KRETSKORT

**Morgen.** Strek: tårn av frokostblandingspakker, skilt «SIGMA-TÅRN», sitter på toppen med suppeøse. Radio: «Uke én er ferdig! IQ feirer med å bygge noe. Jeg feiret med å bygge noe. Mitt er høyere. Hilsen fra toppen.»

**Innlogging.** Tema: IQ og de som bygger; hvordan Snøfall fikk strøm (lore: en foss, et vannhjul og tre år med feil). I natt: IQ lodder et sikkerhetskort som skal holde Kulde ute av Kanal 1–4. Brikke S: «Den lille grønne plata alle ledningene sitter på. IQ sover på én.» Kulde 1.

**Gåte.** H: frostlapp `K R _ T S _ _ R T` teipet på tårnet, høyt oppe; Håkon klatrer ikke (regel), men tårnet må rives forsiktig, pakke for pakke (H9); Hanna teller pakkene høyt og får lappen når den faller (H5). S: grønn plate med ledninger. Kristian: KRETSKORT (K12). Kode **KRETSKORT**.

**Flater.** Mail: uke én, IQ lodder. K4 Kretskort-Kobler åpner som lek etter koden. NisseNet: `IQ-VERKSTED/magisk-sekk-test.txt` → ren feilrapport uten K-O-R-T. Frost 34 → 28.

**Belønning.** Minispill. PS: Julius om Sigma-tårnet (han spør Nissemor hva sigma betyr).

**Kontinuitet.** Sikkerhetskortet er det Kulde bryter dag 10. Slang brukt (1 av 3).

### Dag 9 (on) – Krystall-Matematikk · 24 + blått hjerte

**Morgen.** Strek: krøpet inn i grønnsaksskuffen for å «bli ekte iskrystall», bare beina ut. (Nikker til historien.) Radio: «Kulde har begynt å lage krystaller som ser ekte ut, men ikke er det. Pil ble lurt to ganger. Jeg ligger i kjøleskapet for å lære forskjellen. Det går dårlig.» _Ikke_ «på kjøleskapet».

**Innlogging.** Tema: hvorfor hvert snøkrystall har seks armer (vannmolekylet), og Wilson Bentley som fotograferte 5 000 av dem. I natt: Kulde legger falske krystaller i radaren så Orakelet mister tellingen. Brikke S: «Pil telte armene tre ganger. Seks hver gang. De falske hadde feil tall, og de var lette å kjenne igjen når man først så det.» Kulde 1.

**Gåte.** H: sju papirkrystaller på kjøleskapsdøra: fire ekte (seks armer) og tre tydelig falske (fire armer, åtte armer, én firkantet), pluss blått hjerte-kort. Hanna sorterer ekte og falske etter å ha talt armer med Håkon (H5: «denne er feil»), Håkon teller (H9). Verktøy: `krystallformel.txt` (NisseNet, åpner dag 9 på dato): «Krystallsum = antall ekte krystaller × armer per ekte krystall». S: seks armer, falske har feil tall. Kristian: 4 × 6 = 24 (K12). Kode **24**. Tallet 4 står ingen steder; de må telle.

**Flater.** Mail: falske krystaller, «Hanna er krystallsjef». NisseNet: `krystallformel.txt` (erstatter `julekuleblasing.txt`). K1 krystallupe-overlegg som lek. Symbol 3/9. Frost 40 → 32.

**Belønning.** PS: Julius om kjøleskapet.

**Kontinuitet.** «Ekte og falske» øver blikket til dag 10 og dag 23 (hva Kulde egentlig er).

### Dag 10 (to) – Fargene som Forsvant · SPEKTER · frost nivå 1 · jakt

**Morgen.** Skjerm (kjøkken + gang) er grå med rimkant fra 05:30 og linjen «Fargene er hos meg nå. 71 %». Vær, timeplan og radio virker. Strek: hender, nese og halve ansiktet i fire tusjfarger, bart på post-it over bildet av mamma og pappa. Radio: «Skjermen deres er GRÅ. Jeg så det klokka fire. Jeg gjemte alle fargene jeg fant. På meg. Og litt rundt i stua. Kulde har tatt fargene fra Snøfall TV også. IQ sier dere er de eneste med farger igjen.»

**Innlogging** (etter skolen). Appen i frostmodus nivå 1: fargeløst med glimt av rødt og grønt, VHS-striper, spøkelsesbildet på alle TV-kanaler med «KROMATISK DRENERING 71 %». Videoen spiller i svart-hvitt med fargeglimt. Tema: rødt og grønt, hvorfor julens farger ble akkurat disse (kristtorn og bær, lys i mørket). I natt: Kulde tok fargene fra linjen, Snøfall TV og Skjerm på Landås. Brikke S: «Alle fargene på rekke, slik regnbuen stiller dem opp. IQ har ett ord for det. Han sier det når han er stolt.» Kulde 3 (lyd og bilde hakker, Julius gjentar setningen).

**Gåte.** H: fire fargede gjenstander (rød, grønn, blå, gul) gjemt i stua, hver med et kort der en bokstav er skrevet i blått under rødt kruseduller. Hanna ser gjennom rødt cellofan (innkjøp) og leser bokstaven (H5); Håkon finner gjenstandene (H9). Kortene gir S, P, E, K. Rekkefølgen står i `farge-koder.txt` (NisseNet, åpner dag 10 på dato): rød, grønn, blå, gul. S: regnbuens rekke, IQs ord. Kristian: SPEK + TER = SPEKTER (K12). Kode **SPEKTER**.

**Flater.** Mail: fargene borte, Skjerm grå, «Hanna er fargesjef, rødt filter ligger ved tusjene». NisseNet: `farge-koder.txt` (rekkefølge), Fargesamlerens arkiv åpner del 1 (`FARGESAMLEREN/01-fargene.txt`: hvem Fargesamleren var, ingen svar). Snøfall TV: alle kanaler grå med glimt (kode). Frost 71 → 45 ved kode. Skjerm: rimen trekker seg tilbake på tre sekunder, gyllent skjær, kortet «Fargene er tilbake» i 30 min. Nødstopp 20:00.

**Belønning.** Fargene tilbake i app og på Skjerm. PS: «Dere fikk fargene tilbake. Hele Snøfall så det.»

**Kontinuitet.** Uke 2: Kulde tar fargene. Fargesamleren introduseres (M4 dag 15). Rødfilteret kan gjenbrukes dag 17.

### Dag 11 (fr) – Antenne-Krisen · 75 + bonus · jakt

**Morgen.** Strek: pakket inn i aluminiumsfolie som bakt potet på et stekebrett. Radio (med skurr i klippet): «SKURR. Hører dere meg? Kulde jammer antennen ved tjernet. Jeg har folie på hodet. Det hjelper litt. Dere fikk fargene tilbake i går. Hele Snøfall så det. Jeg så det. Jeg gråt ikke.»

**Innlogging.** Tema: radio og signaler; hvordan Snøfall først hørte Bergen (lore: en fisker på Askøy med hjemmelaget sender). I natt: Kulde splittet senderen i tre, antennen ved tjernet er dekket av is og står skjevt. Brikke S: «Tre sendere, sa IQ. Ikke gang dem. Legg dem sammen. Så finner dere oss igjen.» Kulde 3.

**Gåte.** H: tre lapper i tre rom (stue, kjøkken, gang) med bare et tall: 15, 25, 35; Håkon løper (H9), Hanna finner den i gangen i barnehøyde og bærer alle tre til Kristian (H5). S: legg sammen, ikke gang. Kristian: 75 (K12). Kode **75**. Bekreftelse: still frekvenshjulet på K4 til 75,0 og bildet klarner (lek, ikke brikke).

**Flater.** Mail: jamming, «tre rom», bonus: bygg folieantenne (minst 20 cm) og vis en voksen. Snøfall TV: ny loop «antennen i is, skjev» til koden er inne. Bonus: foreldrekode `ANTENNE2026` → Frost −20. Frost 62 → 48 → 28. NisseNet: `tidsanomalier.txt`, `antenna-crisis.txt`, `antenne_tid_system.txt` slås sammen til én lore-fil uten tall.

**Belønning.** Antenne-loop rettes opp. PS: Julius nevner folieantennen hvis bonus er godkjent («IQ vil ha tegningen»).

**Kontinuitet.** Første bonus. Antennen ved tjernet er stedet muren bygges dag 21.

### Dag 12 (lø) – Lydbølgene som Smelter Is · MELODI + grønn sol · M3 Sukket i isen · krypto 1

**Morgen.** Strek (helg): en hel dorull som «lydbølge» fra badet til kjøkkenet, ligger utslått ved tre glass. Radio: «Jeg hørte noe sukke i isen i natt. Ikke knurre. Sukke. Julius sier jeg innbilte meg det. Nissemor sa ingenting, hun bare nynnet. Antennen deres står rett igjen, forresten.»

**Innlogging.** Tema: hvorfor vi synger i mørket (lore: det første julekoret i Snøfall var tre nisser som sang for å holde seg våkne på vakt). I natt: Nissemor nynnet uten ord ved slusen, og isen sprakk. Noe inni svarte. Brikke S: «Nissemor nynnet uten ord, og isen sprakk. Ikke en sang med tekst. Bare det som er igjen når ordene er borte.» Kulde 2.

**Gåte.** H: de tre glassene har ulik mengde vann; Håkon slår på dem med teskje og hører tre toner (H9); under det midterste glasset ligger frostlappen `M _ L _ D _` (må løftes), grønn sol-kort ved siden av (Hanna skanner, H5). S: sang uten ord. Kristian: MELODI (K12). Kode **MELODI**.

**Flater.** NisseMusikk åpner som «FROSSET» (rim over spilleren, ingen lyd) til koden er inne; så spiller den. NisseKrypto: dekryptering 1 med tre hjerter, rekkefølge rød → grønn → blå (hint i appen som i dag). `DEKRYPTERT/frosne-koder.txt` = avsløring 1: Orakelets logg fra slusen: «Grønt hjerte er håp. Rødt hjerte er varme. Blått hjerte er kulde og sorg. Det høres ikke sint ut. Det høres alene ut.» Snøfall TV: ny grotte-loop, isen sprukket, svakt blått lys. Symbol 4/9. Frost 55 → 32.

**Belønning.** Merke **Varmebærer**. Musikk. PS: «Jeg sa til Rampenissen at han innbilte seg det. Jeg tok feil.»

**Kontinuitet.** M3: første gang Kulde er noe annet enn en fiende. Nissemors nynning kommer igjen dag 24.

### Dag 13 (sø) – Luciadagens Gylne Krydder · SAFRAN · 3. advent

**Morgen.** Strek: sin egen begravelse etter 11 lussekatter; serviett, blomst, kosedyr i sørgerekke, skilt «HER HVILER RAMPEN. HAN SPISTE 11.» Radio: «Nissemor bakte 500 boller. Jeg spiste 11. Jeg er død nå. Hilsen fra den andre siden. Kulde satt og så på lysene i verkstedet i natt. Bare så. Jeg vet ikke hva jeg skal mene om det.»

**Innlogging.** Tema: Lucia, hvem hun var, lys på hodet, hvorfor 13. desember, hva som er 3. søndag i advent. I natt: Kulde stirret på Lucia-lysene gjennom linjen uten å ta noe. Brikke S: «Det gule i bollene er krydderet fra en krokus. Tre tråder per blomst, plukket for hånd. Derfor koster det mer enn gull. Nissemor låser det inn.» Kulde 1.

**Gåte.** H: frostlapp `S _ F _ A _` på gravskiltet; ved «liket» ligger en liten pose med gule tråder (ekte safran eller gul tråd) og en lussekatt. Hanna lukter og ser fargen (H5). Håkon teller kosedyrene i sørgerekken (11, bare moro) (H9). S: krokus-krydder, dyrere enn gull. Kristian: SAFRAN (K12). Kode **SAFRAN**. Ordet er vanskelig for en 9-åring; skjelettet gjør det mulig for Kristian.

**Flater.** Mail: Lucia, 500 boller, «Rampenissen er død». Snøfall TV: spøkelsesbilde dag 13 skrives om fra hån til lengsel: «Lysene deres. Jeg så dem. Jeg husker ikke når jeg så lys sist.» NisseNet: `lucia-tradisjon.txt` som lore; `lucia_lussekatt_hemmelig.txt` fjernes. Frost 44 → 36.

**Belønning.** PS: Julius om begravelsen («Nissemor sendte blomster»).

**Kontinuitet.** Kulde ser på lys = setter opp dag 21 («jeg ville bare se lyset deres»).

### Dag 14 (ma) – Hemmeligheten i Papirvingene · ORIGAMI · Brevfugler åpner

**Morgen.** Strek: alle kjøkkenserviettene brettet til skjeve fugler, selv i papirbåt i den tørre vasken. Radio: «Winter åpnet brevfuglene i natt! Og det kom én fugl ingen hadde sendt. Blå. Den satt i vinduskarmen til Julius og sa ingenting. Winter la den i en eske med et håndkle over.»

**Innlogging.** Tema: brev til nissen gjennom tidene (lore: det første brevet til Snøfall var en lapp i en flaske fra Bergen, 1887). I natt: den blå fuglen fra grotten, med et brev som er fryst fast til vingen. Brikke S: «Det japanske ordet for å brette papir til liv. Winter uttaler det feil med vilje, så Kulde ikke skal forstå.» Kulde 1 (men den blå fuglen vises kort i vinduet bak Julius).

**Gåte.** H: frostlapp `O _ I _ A _ I` i papirbåten; Håkon bretter én serviettfugl etter en trykt bretteanvisning som ligger ved (H9), Hanna velger hvilken av Rampenissens fugler som er penest og får lappen når båten løftes (H5). S: japansk ord for bretting. Kristian: ORIGAMI (K12). Kode **ORIGAMI**.

**Flater.** Brevfugler åpner: radar med én blå fugl som flyr i sirkel rundt Nordtoppen, og et kort «FRYST BREV: tiner når linjen er varm». Skriv-til-Julius kan stå; løftet om svar i NisseMail fjernes. Snøfall TV: ny kontor-loop med frossen brevfugl i vinduskarmen. NisseNet: `brevfugl-finale.txt` → `brevfugl-historie.txt` (lore). Frost 50 → 40.

**Belønning.** Brevfugler-modulen. PS: «Winter har aldri fått en fugl hun ikke har sendt. Hun sover ikke i natt.»

**Kontinuitet.** Den blå fuglen bærer brevet som tiner dag 24. Uke 3: brevene og pakkene.

### Dag 15 (ti) – Fargesamlerens Notatbok · KARAMELL + rød sol · M4 Vintervokteren

**Morgen.** Strek: begge beina i en skål sirup, klissete fotspor over benken, sleiv i hånden. Radio: «Jeg prøvde å lage varme på kjøkkenet. Det ble klissete. IQ er stille i dag. Han fant en gammel bok i arkivet i natt og har ikke sagt et ord siden. Det har aldri skjedd før.»

**Innlogging.** Tema: Fargesamleren og Snøfalls eldste arkiv (lore: Fargesamleren samlet de første iskrystallene og ba IQ bygge noe som kunne holde dem kalde for alltid). I natt: notatboken forteller at IQ bygde Vintervokteren, et program som skulle holde Krystallgrotten kald. Strømstøtet i fjor kuttet lyset der nede. Det er det som sender på 85,0. Brikke S: «Nissemor prøvde å varme opp IQ med det hun lager når sukker blir brunt og varmt i gryta. Han spiste ikke engang det.» Kulde 1, Julius er stillere enn vanlig.

**Gåte.** H: frostlapp `K _ R _ M _ L L` ved sirupskålen; Hanna smaker én fingertupp sirup og sier «søtt» (H5); Håkon følger fotsporene fra benken til der lappen ligger (H9). S: brunt, varmt sukker. Kristian: KARAMELL (K12). Kode **KARAMELL**.

**Flater.** Mail: IQ er stille, boken. NisseNet: Fargesamlerens arkiv del 2 åpner (`FARGESAMLEREN/02-notatboken.txt`): hvem Kulde var, hvem som bygde det, hvorfor forbindelsen røk. Historie, ikke svar. Snøfall TV: ny grotte-loop, et ensomt blått lys i mørket, rolig. Symbol 5/9. Frost 56 → 46.

**Belønning.** Resten av arkivet (del 2). PS: «IQ sa én setning i kveld: 'Jeg glemte å slå det av.'»

**Kontinuitet.** M4. Fra nå vet barna hva Kulde er, og Rampenissen vet det samme fra samme kveld (han sitter i stua når de leser). Fra dag 16 kaller ingen flate Kulde «fiende».

### Dag 16 (on) – Pakkesentralen i Spinn · SORTERING + bonus

**Morgen.** Strek: «ryddet»: fjernkontroller i brødboksen, brød i TV-benken, tannbørster i bestikkskuffen, selv i brødboksen med lokket på hodet. Radio: «Alt i pakkesentralen ligger i én haug. Winter gråter. Nesten. Jeg ryddet hos dere for å hjelpe. Jeg tror jeg gjorde det verre.»

**Innlogging.** Tema: hvorfor vi gir gaver (lore: Nikolaus, og Snøfalls regel om at den beste gaven er den noen trengte uten å vite det). I natt: Kulde snudde samlebåndet, ikke for å ødelegge, men fordi det er det eneste som får Winter til å se opp. Brikke S: «Winters ord for å legge alt i riktig hylle. Hun sier det med stor S. Hun har et skilt med det.» Kulde 2.

**Gåte.** H: frostlapp `S _ R T _ R _ N G` i brødboksen; før de får den må tre ting tilbake på plass (fjernkontroller, brød, tannbørster): Hanna sier hvor hver ting hører hjemme (H5), Håkon flytter (H9). S: Winters ord. Kristian: SORTERING (K12). Kode **SORTERING**.

**Flater.** NisseStats åpner. K4 Gave-Sorterer som lek. Bonus: «Sett en lykt (batterilys i syltetøyglass) i vinduet mot nord, så Kulde ser den. Frist fredag.» Foreldrekode ny (`LYKT2026`), −20 frost. Mail nevner bonusen. NisseNet: `halvveis_system.txt` fjernes (ikke lenger verktøy). Frost 63 → 50 → 30.

**Belønning.** NisseStats. PS: «Winter fant skiltet sitt igjen. Det lå under haugen.» PS-variant når bonusen er godkjent (tekst, kan komme hvilken som helst dag til og med fredag): «Orakelet ser et lys på Landås-siden som ikke var der før. Det gjør noe annet også.»

**Kontinuitet.** Lykten i vinduet er ett av lysene Kulde «ser» dag 21; Kuldes linje er skrevet slik at den er sann også uten bonus («lyset deres» = huset). Fristen fredag 18 nevnes i mail og PS, håndheves ikke i koden (avgjort). Videoene dag 17–19 nevner aldri lykten direkte (se regelen om betinget innhold).

### Dag 17 (to) – Grønt over Polarhimmelen · NORDLYS

**Morgen.** Strek: kidnappet av kosedyrene, bundet til stol med grønt gavebånd, løsepengebrev «GI OSS ALLE PEPPERKAKENE. ELLERS.» Radio: «Det var grønt over Ulriken i natt. Ikke en bil. IQ sier det var et svar. Jeg er for øvrig kidnappet. Send pepperkaker.»

**Innlogging.** Tema: nordlys slik nissene forteller det (radioen tar fysikken): himmelen som sender brev tilbake. I natt: lyktene IQ hengte rundt antennen (dag 6) brant hele natten, og grotten svarte med grønt lys over Nordtoppen. Første signal tilbake. Julius: «Orakelet sier det kom et svar på lys. Hvilket lys, vet vi ikke. Jeg ser mot nord i natt også.» Sant uansett om bonusen er gjort; lykten på Landås nevnes bare i PS (betinget). Brikke S: «Det man kan høre på himmelen, sa de gamle. Nissene sier det er himmelen som sender brev. Det har et navn med retning i seg.» Kulde 1.

**Gåte.** H: bokstavene i skjelettet `N _ R _ L _ S` er skrevet med sølvpenn langs det grønne båndet; båndet må knytes opp og strekkes ut for å leses: Hanna løsner knutene (H5), Håkon holder båndet stramt og leser (H9). S: himmelbrev med retning i seg. Kristian: NORDLYS (K12). Kode **NORDLYS**.

**Flater.** Mail: grønt lys, kidnappet. Snøfall TV: ny landsby-loop med nordlys; K1-klikk på himmelen bekrefter («SIGNAL MOTTATT FRA GROTTEN»). Frost 52 → 42.

**Belønning.** PS: «Grotten svarte. Jeg har ikke hørt fra den på et år.» PS-variant med bonus godkjent: «Grotten svarte. Orakelet mener den svarte på to lys, ett ved tjernet og ett lenger sør.»

**Kontinuitet.** Første toveiskontakt, utløst av antennelyktene fra dag 6, ikke av bonusen. Bonusen gir frost −20 og PS-varianter dag 16–19. Peker mot dag 21 (porten) og 24.

### Dag 18 (fr) – Kastevind rundt Ulriken · TURBULENS + blå sol · krypto 2

**Morgen.** Strek: spor av sjokoladerosiner fra ytterdøra til kjøleskapet, Rampenissen fast i pappas jakkelomme og peker anklagende. Radio: «Trixter testet sleden i vestlandsvær i natt. Jeg satt bakpå. Aldri igjen. Rudolf var innom. Han la igjen noe på gulvet deres. Jeg beklager på hans vegne.»

**Innlogging.** Tema: reinsdyr og slede, hvorfor akkurat reinsdyr (lore: de eneste som finner vei i snøstorm uten å se), Trixter og Rudolf. I natt: ruten over Nordtoppen ble testet; sleden ristet som aldri før i vinden rundt Ulriken. Brikke S: «Når sleden rister i vinden, har Trixter ett ord for det. Flyvertinnene bruker det samme ordet, rett før de ber dere sette dere.» Kulde 2.

**Gåte.** H: frostlapp `T _ R B _ L _ N S` i pappas jakkelomme; Håkon følger rosinsporet baklengs fra kjøleskapet til knaggen (H9), Hanna får lov å ta Rampenissen løs fra lommen og finner lappen (H5), blå sol-kort i den andre lommen. S: flyord for risting. Kristian: TURBULENS (K12). Kode **TURBULENS**.

**Flater.** NisseKrypto: dekryptering 2 med seks symboler, rekkefølge som i dag. `DEKRYPTERT/stjernetegn.txt` = avsløring 2: Trixters rutekart, og ruten går rett over Krystallgrotten. Julius har tegnet en sirkel rundt den. Snøfall TV: storm-loop over landsbyen; K4 Slede-simulator som lek. Symbol 6/9. Frost 60 → 48. Bonus 16-frist utløper i kveld.

**Belønning.** Avsløring 2. PS: «Trixter vil fly utenom grotten. Jeg sa nei.»

**Kontinuitet.** Ruten over grotten = det som skjer julenatt (dag 24).

### Dag 19 (lø) – Eksplosjon i Fôringsautomaten · GULROT · pusterom · jakt

**Morgen.** Strek (helg): ligger flat på kjøkkengulvet med maskeringsteip-omriss, plaster på pannen, gulrot merket «BEVIS». Radio: «IQ bygde en fôringsautomat. Den skjøt 40 av dem gjennom taket. Tre landet hos dere. Én landet på meg. Jeg er et åsted nå.»

**Innlogging.** Tema: julenek og dyrene ved jul; hvorfor vi gir til dyrene også. I natt: ingenting fra Kulde. Snøfall puster. Julius: «Det har vært grønt over Nordtoppen to netter nå. Orakelet teller lys på Landås-siden og sier det er flere enn i fjor.» (Sant med og uten bonus: husets vanlige julelys teller.) IQ bygde noe dumt for å slippe å tenke. Brikke S: «Det oransje drivstoffet Rudolf vil ha, og som IQ nå har 40 for lite av.» Kulde 0 (ren video, første gang siden dag 1: barna skal merke det).

**Gåte.** H: tre gulrøtter gjemt i tre rom, hver med en lapp som viser en bokstav og en plass: `G·1`, `L·3`, `T·6`; «BEVIS»-gulroten på gulvet har seks tomme ruter. Håkon jakter (H9), Hanna legger gulrøttene i riktig rute etter tallet (H5). Skjelettet blir `G _ L _ _ T`. S: Rudolfs oransje drivstoff. Kristian: GULROT (K12). Kode **GULROT**.

**Flater.** Mail: eksplosjon, «tre rom». K2 sentrifuge som lek. NisseNet: `reinsdyr_GYATT.log` → `foringsautomat.log` (IQs feilrapport, ingen bokstaver). Frost 68 → 56.

**Belønning.** PS: «Rudolf spiste bevismaterialet.»

**Kontinuitet.** Pusterommet før dag 20–21. Kulde 0 i videoen er stillheten før stormen.

### Dag 20 (sø) – Sofa-Sleden · TURBO + grønn måne · 4. advent · varselet

**Morgen.** iMac-ene grå 09:00–12:00 med melding fra Rampenissen: «Kulde er ved døra. I morgen trenger jeg dere.» Strek: fort av alle sofaputene, skilt «KUN FOR SIGMAS. 6-7.», pappas hodetelefoner, popcorn over sofaen. Radio: «Julius sa jeg skulle be dere finne fram bøker. Mange bøker. Til i morgen. Han sier bøker holder på varmen. Jeg har bygd et fort i mellomtiden, for å øve på å holde varmen. Popcornet er proviant.»

**Innlogging.** Tema: de fire adventslysene og hva hvert står for. I natt: Orakelet målte 88 %. I morgen er den mørkeste dagen; Kulde når huset, ikke for å skade, men fordi det er der lyset er. IQ vil bygge en mur av varme rundt linjen så det er varme igjen å dele; Julius har bedt om én port i den. Brikke S: «IQ ga sledemotoren det samme som biler får når de må forbi noen i bakken. Han sier det med armene.» Avslutning: «I morgen er den mørkeste dagen. Dere trenger ikke være redde. Dere trenger å være hjemme.» Kulde 2 (flimrer oftere).

**Gåte.** H: frostlapp `T _ R _ O` inne i fortet, under en pute; Hanna må inn i fortet (bare hun får plass) (H5), Håkon finner puten med lappen ved å telle putene fra skiltet (H9). S: det biler får i bakken. Kristian: TURBO (K12). Kode **TURBO**.

**Flater.** Mail: 88 %, «finn fram bøker til i morgen, bøker holder på varmen», og én linje fra Rampenissen: «Vi stenger ingen ute. Vi holder varmen inne.» Sidepanel: Frost 88 → 76, blinker. Snøfall TV: alle kanaler flimrer oftere (kode); Orakelets varsel som tekst-TV på K3 etter videoen. K2 trykkmåler som lek. Symbol 7/9.

**Belønning.** PS: «Nissemor har tent det fjerde lyset. Hun lot det stå i vinduet mot nord.»

**Kontinuitet.** Varselet. Bøkene = muren dag 21. Slang brukt (3 av 3).

### Dag 21 (ma) – Vintersolverv · BRANNMUR · M5 Muren og porten · vintersolverv · frost nivå 2

**Morgen.** Skjerm (kjøkken + gang) tett rim fra 05:30, linjen «Det er kaldt her nede. Jeg ville bare se lyset deres. 94 %». Vær, timeplan og radio virker. Strek: bak en lav mur av bøker foran skjermen med grytelokk mot trekken og en visp (han bakte, og glemte å legge den fra seg). (Nikker til historien.) Radio: «Skjermen er hvit. Alt er hvitt. Men bokmuren står, og den holder varmen inne. Jeg har stått her siden klokka fire og passet på at en bok står på gløtt, sånn Julius sa. Det er en dør i muren. Den skal være åpen. Kom hjem.»

**Innlogging** (etter skolen). Frostmodus nivå 2: rimkant over hele appen, Kuldes linje midt på, bare NisseMail, Dagbok (videoen) og KodeTerminal kan åpnes. Resten under rim. Tema: vintersolverv, gamle jól, bålene, og at lyset alltid snur, uansett. I natt: Kulde nådde huset. IQ bygde muren rundt linjen. Julius: «En mur er ikke mot noen. Den holder varmen inne så det er noe igjen å dele. Derfor ba jeg om en port.» Brikke S: «IQ bygde en vegg av varme rundt linjen. Brannfolk bygger det samme i skogen, av det motsatte.» Avslutning: «Jeg lot ham la én port stå åpen. Inn mot grotten. Med varme i.» Kulde 3 i første halvdel, 0 i siste setning (muren holder).

**Gåte.** H: post-it med bokstav på hver av åtte bokrygger i muren, halvparten iset: `B R _ N _ M _ R` lest fra venstre. Hanna leser bokstavene i rekkefølge (H5), Håkon må bære muren fra skjermen til bordet uten at rekkefølgen ryker (H9). S: vegg av varme, brannfolkenes vegg. Kristian: BRANNMUR (K12). Kode **BRANNMUR**.

**Flater.** Ved kode: kanalene tiner én etter én, Frost 94 → 32, sidepanelet tegner en åpen port med varmt lys, Skjerm tiner (3 s, gyllent skjær, «Fargene er tilbake» 30 min). Snøfall TV: ny grotte-loop med varm port. Spøkelsesbildet dag 21 er Kuldes siste linje, rolig: «Det er kaldt her nede. Jeg ville bare se lyset deres.» Så stillhet. K4 Zapper som lek etterpå (ikke før skolen, se hull 12). NisseNet: `nordpolen_hemmelighet.txt` fjernes (sier Kulde er slettet).

**Belønning.** Merke **Portvokter**. Fargene hjemme. PS: «Muren holder. Porten står åpen. Nå venter vi på om noe kommer gjennom.»

**Kontinuitet.** M5. Ikke seier, men valg. Porten er det sleden flyr gjennom dag 24.

### Dag 22 (ti) – Winters Tall · LANDÅS + rød måne · Snill-listen åpner · jakt

**Morgen.** Strek: krøpet inn i Hannas julesokk med bare føttene ut. Radio: «Julius vil vite nøyaktig hvor dere bor. Jeg sa 'ved sofaen'. Det holdt ikke. Jeg sa 'i Bergen'. Det holdt heller ikke. Jeg gjemte meg i en sokk. Det var en feil. Muren holdt i går, forresten. Alle så det.»

**Innlogging.** Tema: Snill-listen, hva «snill» betyr for Julius (ikke lydig, men å se noen), om å bli sett. I natt: ingenting kom gjennom porten ennå, men det er varmere der nede. Winter trenger landingsstedet i tall. Brikke S: «Winter skriver tall i stedet for bokstaver når noe er viktig. A er alltid først. Resten følger.» Kulde 0.

**Gåte.** H: tre julesokker i tre rom (Hannas med Rampenissen i); i hver en lapp med to tall: `12 – 1`, `14 – 4`, `29 – 19`, rød måne-kort i den siste. Hanna drar Rampenissen ut og finner lappen (H5), Håkon finner de to andre (H9). Verktøy: `alfabet.txt` fra dag 5 (bare alfabetet, uten tall). S: tall for bokstaver, A er først; det er regelen, og den står ingen steder. Kristian teller seg fram: L-A, N-D, Å-S = LANDÅS (K12). Kode **LANDÅS**. Hvilken sokk er først? Sokkene er merket 1–3 (eller barnas navn i alderens rekkefølge, yngst først).

**Flater.** Navneregistrering (NameEntryModal) etter koden. NisseNet: `alfabet.txt` (gjenbruk), `snill_slem_liste.txt` → `snill-listen.txt` (Julius' egne regler, ingen navn). Symbol 8/9. Frost 40 → 24.

**Belønning.** Navnene står på listen. PS: «Tre navn. Jeg skrev dem selv.»

**Kontinuitet.** Landås, Ulriken (dag 5) og ruten (dag 18) møtes.

### Dag 23 (on) – Nattevakt · STJERNEKLART + blå måne · sannheten · krypto 3

**Morgen.** Strek: pakket opp et hjørne av en gave, teipet igjen med altfor mye teip, sitter i treet som pynt med dårlig samvittighet. Radio: «I natt flyr de. Over Nordtoppen. Med alle lysene på. Julius sa de skal fly lavt over grotten. Jeg gråter ikke. Det er teip i øynene mine.»

**Innlogging.** Tema: lille julaften; treet, grøten, mandelen, hvorfor én natt til. I natt: Orakelet så ned i grotten for første gang. Det som er der nede har ventet på lys i ett år. I natt får det det. Brikke S: «Orakelet meldte flyværet i ett ord. Ikke en sky. Ikke en eneste. Bare stjerner, hele veien.» Kulde 0.

**Gåte.** H: frostlapp `S T J E R N E _ _ _ _ T` høyt i juletreet (Håkon løfter Hanna, eller stol med voksen) (H9), blå måne-kort hos Rampenissen i treet (Hanna, H5). S: ikke en sky, bare stjerner. Kristian: STJERNEKLART (K12). Kode **STJERNEKLART**. Skjelettet viser hele første ledd, så bare «klart» må høres.

**Flater.** NisseKrypto: dekryptering 3 med ni symboler. `DEKRYPTERT/hjertets-hemmelighet.txt` = avsløring 3, hele historien: Fargesamleren, IQ, Vintervokteren, strømstøtet, et år alene i mørket, lyset barna satte i vinduet, porten. Avslutter: «Det som fryser er ikke ondt. Det er alene. I natt flyr vi over det med alle lysene på.» NisseNet: Fargesamlerens arkiv del 3 (`03-siste-side.txt`). Snøfall TV: grotte-loop med lys som siver ned ovenfra. Symbol 9/9. Frost 30 → 10.

**Belønning.** Avsløring 3. PS: «Nå vet dere alt. Rampenissen også, han satt i treet og hørte. Men ingen av dere vet hva Trixter har i sleden til i morgen.»

**Kontinuitet.** Sannheten. Alt dag 24 er konsekvens.

### Dag 24 (to) – God Jul på Landås · JULEMAGI · M6 Tøvær

**Morgen.** Skjerm-kort hele dagen: «God jul fra Snøfall». Strek: sover inni gullkonvolutten under treet med sløyfe på hodet og en liten pappeske som koffert. Radio (Rampenissen, eventuelt Julius ringer inn): «De landet. Jeg så det. De fløy over grotten først, lavt, med alle lysene. Noe blått fløy opp og møtte dem. Jeg reiser i kveld. Takk for garnkurven.»

**Innlogging.** Tema: julaften; hvorfor vi feirer, fred i huset, hva julemagi faktisk er. I natt: sleden fløy gjennom porten med lys; grotten tiner; den blå fuglen fløy hjem med brevet; Vintervokteren sendte noe med Trixter. Brikke S: «Dere har laget noe hele desember uten å vite det. Ikke koden, den tastet dere. Ikke varmen, den kom fra ovnen. Det tredje: det Nissemor kaller det når tre søsken holder sammen i mørket, og som trollmenn bruker det samme ordet om, selv om de jukser.» Kulde 0, full farge, Julius smiler.

**Gåte.** H: frostlapp `J U L E _ _ _ _` i gullkonvolutten (Rampenissen må flyttes forsiktig; Hanna gjør det, H5), Håkon åpner konvolutten og finner avskjedsbrevet (H9). S: ordet trollmenn jukser med. Kristian: JULEMAGI (K12). Kode **JULEMAGI**. _Brikken er den svakeste i måneden; alternativ: Julius sier «Rampenissen skrev første halvdel på konvolutten. Andre halvdel er det trollmenn later som de har, og dere faktisk har.»_ Avgjørelse 3.

**Flater.** Brevfugler: brevet tiner (animasjon), teksten er fra Vintervokteren, fire linjer: «Takk for lyset. Jeg hadde glemt farger. Krystallet smelter ikke. Det er fra meg.» Snill-listen med finale (GrandFinaleModal + Julius' video). Diplom «Snøfalls venn» per barn fra `printout`. Snøfall TV: alle kanaler varme, sleden over Nordtoppen, grotten tiner (nye loops). Frost 12 → 0, sidepanelet viser «TØVÆR». Fysisk: et iskrystall (glass/akryl-pynt, innkjøp mangler) under treet.

**Belønning.** Merke **Snøfalls venn**. Diplom. Krystallet. PS (siste): «Det er ikke kaldt der nede lenger. God jul, Kristian, Håkon og Hanna.»

**Kontinuitet.** M6. Garnkurven fra dag 1, nynningen fra dag 12, lykten fra dag 16, porten fra dag 21, brevet fra dag 14: alt lukkes.

---

## 4. Hull og motsigelser

Nummerert. «Dag» er der det slår inn; «alle» betyr gjennomgående. Status: **løst i historien** (teksten i §2/§3 er fasit), **steg 1** (tas i gåtegjennomgangen), **byggeliste** (kode/innhold, se §5).

1. **Alle – Brikke S lekker i koden i dag.** `VLOG_ENTRIES` i `SnøfallTV.tsx` staver svaret («S-I-G + N-A-L»), `teletextCode` gjentar det, NisseMusikk har «DEL 2: O - D - I» hardkodet i bunnpanelet, og `hint_arkiv.txt` viser `hint`-feltet som staver koden. Fiks: slett `VLOG_ENTRIES`/teletext-fasit, fjern bunnpanelet i NisseMusikk, fjern `hint_arkiv.txt`. Transkriptene flyttes til JSON uten bokstaver. → **byggeliste** (T8, M1, N5)
2. **Alle – Sidepanelets dagsvarsler staver koden.** `daily_alerts` dag 9 («4 snøkrystaller med 6 tagger»), 11 («75 MHz»), 13 («safran»), 14 («Origami»), 18 («turbulens»), 19 («gulrot»), 20 («turbo»), 21 («BRANNMUREN»), 23 («Stjerneklart»). Fiks: skriv om alle 28 uten kodeord. → **byggeliste** (D4)
3. **Dag 7, 9, 10, 16, 22 – Verktøyfilen låses opp etter dagens kode.** `snofall_fakta.txt`, `julekuleblasing.txt`, `farge_system_dekoder.txt`, `halvveis_system.txt`, `julekode_dekoder.txt` krever et topic som først settes når samme dags kode er inne. Fiks: alle verktøyfiler bruker `afterDay`. → **byggeliste** (N1)
4. **Alle – NisseNet-filene er fasit, ikke verktøy.** `julesanger-samling.txt`, `snowflake-patterns.txt`, `om-snofall.txt` (N-A-L **og** «kodenavn: KULDE» seks dager før M2), `sikkerhet.log» («kjør BRANNMUR-protokoll på Dag 21»), `hemmelig_kode.txt`. Fiks: tre rene verktøy, Fargesamlerens arkiv i tre deler, tre DEKRYPTERT-avsløringer, resten lore eller slettet. → **byggeliste** (N1–N5)
5. **Alle – Ingen videospiller finnes.** Dagbok og Kanal 3 er tekst. Ny `JuliusVideo`-komponent, sett-flagg, autoåpning, transkript, PS. → **byggeliste** (V4–V6)
6. **Dag 10 og 21 – Frost-endepunktet finnes ikke, og fremdriften ligger i nettleseren.** `home-bridge` er POST med utgående webhooks; en GET kan ikke vite om koden er løst så lenge `StorageManager` skriver til `localStorage`. Løses av flyttingen til hjemmeserver med SQLite som lagring (fremdrift på server); GET `/api/frost` leser derfra. → **byggeliste** (H3, C1)
7. **Dag 11 og 21 – Titler lekker koden.** «Antenne-Krisen på 75 MHz» (dag 11, JSON) og «Slaget om Brannmuren» (dag 21) står i Kalender og iCal fra morgenen. Fiks: «Antenne-Krisen» og «Vintersolverv». → **løst i historien** (§3-overskrifter) + **byggeliste** (D3, D5)
8. **Dag 2, 5, 9 – Radioen sier hvor.** → **løst i historien** (radiolinjene i §3 er uten sted).
9. **Dag 21 – Innholdet sier at Kulde slettes.** `daily_alerts`, `nordpolen_hemmelighet.txt`, `dagbokinnlegg`, eventyr `morkets-trussel`. → **byggeliste** (D3, D4, N5)
10. **Dag 16 – Bonusoppdraget er et annet.** JSON: lekesortering, `SORTER2026`, merke. Historien: lykt i vinduet, `LYKT2026`, −20 % frost, frist nevnes men håndheves ikke (avgjort). → **byggeliste** (E2)
11. **Dag 11 og 16 – Bonusbelønning krever frostmodellen.** → **byggeliste** (H1)
12. **Dag 21 – «Ett bånd før skolen» kolliderer med frost nivå 2.** Zapper er lek etter koden. → **løst i historien**
13. **Dag 2 – Taleren i videoen er IQ.** Julius alle 24 dager. → **løst i historien** (V1)
14. **Alle – Spøkelsesbildene håner.** Sju nye linjer, lengsel. → **byggeliste** (T7)
15. **Alle – Ni eventyr-ID-er i data og kode.** → **byggeliste** (D1, O1, B1)
16. **Merker – To vilkår mangler i motoren, og UI-et kjenner dem ikke.** `badge-system.ts`/`BadgeManager` og `BadgeRow`-tooltips må håndtere `decryptionSolved` og `dayCompleted`; `resolveCrisis("inventory")` blir død kode når dag 16-merket forsvinner. → **byggeliste** (D2)
17. **Dag 14 og 24 – Brevfugler lover svar som ikke kommer.** Skriv-til-Julius beholdes uten svar (avgjort), løftet fjernes. → **byggeliste** (B1)
18. **Alle – Scenarioknappene er synlige for barna.** → **byggeliste** (T10)
19. **Alle – Multi-tenancy står igjen.** Passordskjerm beholdes som fiksjon med fast passord (avgjort). → **byggeliste** (C1, C2)
20. **Snøfall TV – Kanalkart.** Avgjort: K1 landsby, K2 verksted, K3 video, K4 antenne/hjul, 85,0 = grotte. → **byggeliste** (T1)
21. **Dag 1, 6, 9, 10, 23, 24 – Gåtene historiedokumentet merket som uferdige.** 9 er løst i §3 innenfor brikketaket. 1, 6, 10, 23, 24 → **steg 1** (avgjort).
22. **Hannas rolle.** Se «Hannas dager» i §2: ti dager + symbolkortene bærer kode; elleve dager → **steg 1**.
23. **Helgeradio.** Avgjort: Morgenrådet sender som vanlig, klippet i 09-sendingen og i appen. → **løst i historien**
24. **Dag 10 og 21 – Skjerm bærer morgenen alene.** Nissemor-guiden sier at ingen viser appen om morgenen. → **byggeliste** (F-tekst i guiden)
25. **Innkjøp mangler** (krystall, sølvpenn, maskeringsteip, post-it, bokstavkort). → **byggeliste** (F5)
26. **Dag 17 – «Sa samene».** → **løst i historien** («de gamle i nord»).
27. **Dag 20 – iMac-melding.** «RAMPENISSEN VIA IQ:». → **byggeliste** (H5)
28. **Dag 12 – Merket utløses av dekrypteringen, ikke koden.** → **byggeliste** (K1)
29. **Sidepanel.** Avgjort: bare Frostgraden. → **byggeliste** (H1)
30. **Dokumentasjon.** → **byggeliste** (C3)
31. **Dag 16–17 – Kausalitet.** Forhåndsinnspilt video dag 17 sa at lykten i vinduet ble sett, mens fristen er fredag 18. → **løst i historien**: nordlyset dag 17 svarer på antennelyktene fra dag 6; Julius sier «hvilket lys vet vi ikke, jeg ser mot nord i natt også»; dag 19 teller Orakelet lys på Landås-siden (sant uansett); lykten nevnes bare i betinget PS. Regel «Betinget innhold» i §2.
32. **Dag 15–23 – Tone og kunnskap.** Rampenissen rigget til krig dag 20–21 etter at barna visste at Kulde er ensom, og dag 23 sa Julius at Rampenissen ikke visste hvem Kulde var. → **løst i historien**: kunnskapstidslinje i §2 (Rampenissen vet det samme som barna fra dag 15-kvelden), dag 20–21 omskrevet til «holde varmen inne og la porten stå åpen», dag 23-PS endret.
33. **Alle orddager – Frostlappen ga 50–80 % av bokstavene**, så Kristian kunne hoppe over videoen. → **løst i historien** (brikketaket i §2) + **steg 1** for dag 3, 4, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24.
34. **Dag 6 – Bokstavprojeksjon gjennom bakepapir er fysisk upålitelig.** → **steg 1** (skyggefigur eller lykt-lest lapp).
35. **Dag 14 – Brevfugler lekker ORIGAMI.** Radaren viser «KRYPTERING: O-R-I-G-A-M-I» og «[ORIGAMI]» når modulen åpner. → **byggeliste** (B1)
36. **Dag 3 og 10 – NisseNet-toppmerket lekker.** `NisseNetUtforsker.tsx` viser «PRISME // KRYSTALL-ANALYSE» og «SPEKTER // OPTISK KALIBRERING». → **byggeliste** (N6)
37. **Dag 3 – SYMBOLSKANNER åpner aldri.** Første symbolkort kommer dag 3, NisseKrypto åpner dag 4, og `SYMBOLSKANNER` står ikke i noen `reveals.modules`. Fiks: skanneren åpen fra dag 3 (eller alltid), NisseKrypto fra dag 4 som før. → **byggeliste** (S1)
38. **Dag 24 – GrandFinaleModal er skrevet for ni eventyr og gammel tone** («GYATT Storage / Sigma Level MAX»). → **byggeliste** (G1)
39. **Snøfall TV – Omskrivingen er L, ikke M/S.** 2 955 linjer med sammenvevd CRT/SVG, fire minispill og tuner; video i K3, loops per kanal og frosteffekter er én omskriving. → **byggeliste** (T4–T6 slått sammen til T11)

---

## 5. Byggeliste

S = under en halv dag, M = 1–2 dager, L = 3+ dager. «Innhold» er tekst/medier, «kode» er repo-endring.

### Julius' video (ny)

| #   | Hva                                                                                                                                              | Størrelse      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| V1  | 24 videomanus etter §3 (lore / i natt / brikke S), låst mot koden                                                                                | M (innhold)    |
| V2  | 24 videoklipp 30–60 s, samme pult, samme mikrofon, «gammelt opptak»-preg; Kulde-nivå 0–3 lagt på i etterarbeid                                   | L (produksjon) |
| V3  | 24 transkripter + 24 «PS fra Julius» i oppdrag-JSON (`video_transkript`, `julius_ps`)                                                            | S (innhold)    |
| V4  | `JuliusVideo`-komponent: `<video>` fra `public/video/dag-NN.mp4`, sett-flagg i StorageManager, transkript etter avspilling, PS når dagen er løst | M (kode)       |
| V5  | Autoåpning ved innlogging når dagens video ikke er sett, rød prikk på Dagbok-ikonet                                                              | S (kode)       |
| V6  | Dagbok → videoarkiv (liste over sette dager), fjern `dagbokinnlegg`-visning                                                                      | S (kode)       |

### Morgenrådet-klipp (ny)

| #   | Hva                                                                | Størrelse        |
| --- | ------------------------------------------------------------------ | ---------------- |
| R1  | 24 manus à 45–60 s etter §3, sjekket mot regelen aldri brikke/hvor | S (innhold)      |
| R2  | 24 lydklipp med Rampenissens stemme, skurr-effekt dag 11           | M (produksjon)   |
| R3  | Avklaring med Morgenrådet-produksjonen: leveringsformat, helger    | – (avgjørelse 5) |

### Rampestrek og fysisk (innhold + utskrift)

| #   | Hva                                                                                                                                                                                                                                   | Størrelse |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| F1  | `rampenissen_rampestrek` og `materialer_nødvendig` skrives om for 24 dager fra §8 + §3                                                                                                                                                | S         |
| F2  | Frostlapp-PDF: 19 orddager med skjelett, tallapper dag 2/11, krystallark dag 9 (4 ekte + 3 falske), fargekort dag 10 (blå bokstav under rødt), bokstavkort dag 1, bokstavlapp dag 19, bretteanvisning dag 14, sokkelapper dag 22      | M         |
| F3  | Ni symbolkort (finnes i QR-siden)                                                                                                                                                                                                     | –         |
| F4  | Sjablong dag 6 (mal for utskjæring)                                                                                                                                                                                                   | S         |
| F5  | Handleliste oppdatert (hull 25)                                                                                                                                                                                                       | S         |
| F6  | Diplom «Snøfalls venn» i `printout`                                                                                                                                                                                                   | S         |
| F7  | **Tegnsett (meta 1):** 29 oppfunne glyffer A–Å som font eller SVG; `runetavle.pdf` (barna, i ferdskriveren dag 1) og `runer-fasit.pdf` (bare Nissemor-guiden); tegn i hjørnet av alle kort-PDF-er; kort i tegn dag 7, 17, 20, 24      | M         |
| F8  | Reviderte kort-PDF-er etter vanskelighetsrevisjonen: romertall (2, 23), speilvendt (3), blindsporkort (1, 8, 10, 11, 12, 13, 15, 16, 18), to brettelinjer (14), `dag17-baandkort.pdf`, `dag21-portkort.pdf`, `dag24-krystallkort.pdf` | S         |

### NisseMail

| #   | Hva                                                                             | Størrelse   |
| --- | ------------------------------------------------------------------------------- | ----------- |
| E1  | 24 `nissemail_tekst` på 60–100 ord uten bokstaver/filnavn/hvor                  | M (innhold) |
| E2  | Bonustekster dag 11 (uendret retning) og 16 (lykt i vinduet), nye foreldrekoder | S           |

### NisseNet

| #   | Hva                                                                                                                                                                                                                                                                                                                        | Størrelse   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| N1  | Tre verktøyfiler: `alfabet.txt` (5 og 22, uten tall), `krystallformel.txt` (9), `farge-koder.txt` (10), alle `afterDay`                                                                                                                                                                                                    | S           |
| N2  | Fargesamlerens arkiv i tre filer (10, 15, 23)                                                                                                                                                                                                                                                                              | S (innhold) |
| N3  | Tre DEKRYPTERT-avsløringer skrevet på nytt; `stjernetegn.txt` som kart med åtte varder og sirkel på 5 (meta 2); margnotat i `02-notatboken.txt` (dag 15); runelinje i `03-siste-side.txt`                                                                                                                                  | S (innhold) |
| N4  | Lore-filer: `om-snofall.txt`, `snofall_fakta.txt` (Orakelets rapport), `magisk-sekk-test.txt`, antenne-filen (slått sammen), `brevfugl-historie.txt`, `lucia-tradisjon.txt`, `foringsautomat.log`, `snill-listen.txt`                                                                                                      | S           |
| N5  | Slett: `hint_arkiv.txt`, `hemmelig_kode.txt`, `snowflake-patterns.txt`, `julekuleblasing.txt`, `farge_system_dekoder.txt`, `lucia_lussekatt_hemmelig.txt`, `halvveis_system.txt`, `julekode_dekoder.txt`, `nordpolen_hemmelighet.txt`, `personlige-brev-intro.txt`, `dagens_oppdrag.txt` (eller skriv om uten Kanal-fasit) | S           |
| N6  | NisseNet-toppmerke: fjern «PRISME // KRYSTALL-ANALYSE» og «SPEKTER // OPTISK KALIBRERING»                                                                                                                                                                                                                                  | S           |

### Snøfall TV

| #   | Hva                                                                                                                                                                                                                                                                                                                                                                                                                                          | Størrelse                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| T1  | Fast kanalkart (hull 20)                                                                                                                                                                                                                                                                                                                                                                                                                     | S (avgjørelse)              |
| T2  | Fem faste Gemini-loops: Julius' kontor, IQs verksted, antennen ved tjernet, landsby (dag/natt/storm = 3), grotte 85,0                                                                                                                                                                                                                                                                                                                        | M (produksjon, ca. 7 loops) |
| T3  | Ti hendelsesloops: antenne i is (11), grotte sprukket (12), kontor med frossen fugl (14), grotte ensomt lys (15), landsby nordlys (17), grotte varm port (21), grotte lys ovenfra (23), landsby slede (24), grotte tiner (24)                                                                                                                                                                                                                | M (produksjon)              |
| T4  | Kode: loop-bakgrunn per kanal med dag-styrt valg, krysstonet                                                                                                                                                                                                                                                                                                                                                                                 | M                           |
| T5  | Kode: Frostgrad-effekter (is fra kantene, fargetap, støy) som funksjon av prosenten                                                                                                                                                                                                                                                                                                                                                          | M                           |
| T6  | Kode: hendelser dag 1 (kanaler inn én etter én), 7 (signatur), 10 (grå), 20 (flimmer), 21 (frys/tine), 24 (varm)                                                                                                                                                                                                                                                                                                                             | M                           |
| T7  | Sju spøkelsestekster skrevet om (lengsel)                                                                                                                                                                                                                                                                                                                                                                                                    | S                           |
| T12 | Runelinje i spøkelsesbildet: nytt felt `transcript_runer` (dag 10, 13, 16, 21) tegnet med tegnsettet fra F7 under den norske linjen; samme komponent viser runelinjen i `03-siste-side.txt` dag 23                                                                                                                                                                                                                                           | S (kode, etter F7)          |
| T13 | Frostmodus 2 (dag 21) lar `DEKRYPTERT`-mappen i NisseNet være lesbar: Trixters kart er porten (meta 2)                                                                                                                                                                                                                                                                                                                                       | S                           |
| T14 | Dag 1-åpning: etter passordet erstattes «KOBLER TIL SNØFALL…» av innsøking 85,0 → 90,0 og K1/K2/K4/K3 inn én etter én med stillbilde og støy, siste linje «BÆREBØLGE 90,0: USTABIL» (12–15 s, klikk hopper over); 4 s hale i `JuliusVideo` etter klippet dag 1 (snø, HUD «LINJE 90,0 · BÆREBØLGE USTABIL», frekvens sklir til 85,0 og tilbake). Kun dag 1; fra dag 2 boot som i dag. `BootSequence.tsx`, `PasswordPrompt.tsx`, `JuliusVideo` | S                           |
| T8  | K3 = `JuliusVideo`; slett `VLOG_ENTRIES`, teletext-fasit, `codeHint`                                                                                                                                                                                                                                                                                                                                                                         | S                           |
| T9  | Minispill beholdes som lek etter koden; fjern bokstav-/tallgevinster i HUD                                                                                                                                                                                                                                                                                                                                                                   | S                           |
| T10 | Scenarioknapper ut av barnas visning                                                                                                                                                                                                                                                                                                                                                                                                         | S                           |
| T11 | Samlet omskriving av `SnøfallTV.tsx`: video i K3 under CRT-laget, loop-bakgrunn per kanal, frosteffekter, kanalkart, minispill beholdt. T4–T6 og T8–T10 inngår.                                                                                                                                                                                                                                                                              | **L**                       |

### NisseMusikk · Brevfugler · NisseKrypto · EventyrOversikt

| #   | Hva                                                                                                                                         | Størrelse |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| M1  | NisseMusikk: fjern bunnpanel med brikke; «FROSSET»-overlegg dag 12 til løst; «varmekilden»-tekst                                            | S         |
| B1  | Brevfugler: blå fugl på radar fra dag 14, fryst brev-kort, tiner dag 24 med Vintervokterens fire linjer; fjern faseliste og svar-løfte      | M         |
| B2  | Brevfugler: fjern «KRYPTERING: O-R-I-G-A-M-I» og «[ORIGAMI]» i radaren (lekkasje dag 14)                                                    | S         |
| S1  | `SYMBOLSKANNER` åpen fra dag 3 (reveals på dag 3 eller alltid på skrivebordet); NisseKrypto fra dag 4                                       | S         |
| G1  | GrandFinaleModal skrevet om for én historie og tøvær-tonen; fjern eventyr-iterasjon og slang                                                | S         |
| K1  | NisseKrypto: nye `rewardText`; merke Varmebærer ved dekryptering 1                                                                          | S         |
| K2  | Betinget PS på dekryptering: `julius_ps_krypto_mangler` dag 20 vises når `stjernetegn` ikke er løst (samme mekanisme som `julius_ps_bonus`) | S         |
| O1  | EventyrOversikt: én linje med seks milepæler (liste i `eventyr.json`), fjern kamerametadata per ID                                          | M         |

### Data (JSON)

| #   | Hva                                                                                                                                                                                           | Størrelse |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| D1  | `eventyr.json`: én ID `spokelseskoden`, milepælsliste M1–M6                                                                                                                                   | S         |
| D2  | `merker.json`: tre merker, to nye vilkårstyper                                                                                                                                                | S         |
| D2b | Badge-UI og motor: `BadgeManager` og `BadgeRow` håndterer `decryptionSolved`/`dayCompleted` med riktig tooltip; `resolveCrisis("inventory")` fjernes                                          | S         |
| D3  | `uke1–4_oppdrag.json`: nye felt `video_transkript`, `julius_ps`, `frost_morgen`, `frost_etter`; `hint` omskrevet eller fjernet; `eventyr.id` på alle dager; `reveals` ryddet; titler (dag 21) | M         |
| D3b | Lekkasjer i data: tittel dag 11 («Antenne-Krisen») og 21 («Vintersolverv»), `om-snofall.txt` uten «kodenavn: KULDE», `sikkerhet.log` uten «BRANNMUR»                                          | S         |
| D4  | `statisk_innhold.json`: 28 varsler omskrevet, filtre etter N1–N5, `systemMetrikker` (avgjørelse 6)                                                                                            | S         |
| D5  | Kalenderliste (24 titler) til iCal-eksport                                                                                                                                                    | S         |

### Frost, sidepanel og hjem

| #   | Hva                                                                                                                                                                                      | Størrelse       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| H1  | Frostgraden i sidepanelet fra dag 7 (tabell i JSON, −20 ved bonus), «TØVÆR» dag 24, åpen port dag 21                                                                                     | S               |
| H2  | Frostmodus nivå 1 (dag 10) og 2 (dag 21) i appen: CSS-overlegg + vindussperre, avledet av dato/løst/klokke; «Frost av» i Nissemor-guiden                                                 | M               |
| H3  | GET `/api/frost` med `{frost, level, until, message, solved_today}`; slett POST home-bridge og KodeTerminal-kallet                                                                       | S               |
| H3b | Fremdrift på server: SQLite erstatter `localStorage` som kilde for løste dager, bonus og video-sett (del av flyttingen til hjemmeserver). GET `/api/frost` og PS-varianter leser derfra. | M               |
| H4  | Skjerm: polling og rim-tegning (annet repo, avtalt kontrakt)                                                                                                                             | senere          |
| H5  | Varden: Orakel-kort dag 7, julehilsen dag 24, iCal, iMac-gråtone dag 20                                                                                                                  | senere (konfig) |

### Opprydding

| #   | Hva                                                                                                                                                                                                       | Størrelse |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| C1  | Slett multi-tenancy: `api/auth`, `api/family`, `api/session`, `api/cron`, `api/unsubscribe`, `api/settings`, Sanity, Resend, `session-manager`, Sanity-gren i `storage-adapter`, tilhørende tester og env | M         |
| C2  | Enkel innlogging: ett passord fra env eller ingen (avgjørelse 4)                                                                                                                                          | S         |
| C3  | AGENTS.md / IMPLEMENTATION.md / ARCHITECTURE.md oppdatert etter koden                                                                                                                                     | S         |

Sum per flate: Julius-video 6 · Radio 3 · Fysisk 8 · NisseMail 2 · NisseNet 6 · Snøfall TV 14 (én L) · Musikk/Brevfugler/Krypto/Eventyr/Finale 8 · Data 7 · Frost/hjem 6 · Opprydding 3 = **63 punkter**. T14 er dag 1-åpningen (innsøking og 85,0-hale), godkjent av Hans. F7, F8, T12, T13 og K2 kommer fra vanskelighetsrevisjonen 10. november (`gaater-2026.md`, «Meta-gåter»). Runetavla er papir på operasjonsbrettet; ingen app-komponent trengs.

---

## 6. Avgjørelser for mennesket

Gjenstår (alt annet er avgjort, se under):

1. **Kunnskapstidslinjen i §2:** godta at Rampenissen vet det samme som barna fra dag 15-kvelden (han er i rommet), slik at tonen etter dag 15 er felles.
2. **Brikketaket 40 %:** godta som hard grense for steg 1. Det gjør noen ord tyngre for Kristian og flytter vekt over på Julius' setning.
3. **Dag 17 uten lykt-avhengighet:** nordlyset svarer på antennelyktene fra dag 6; bonusen gir bare frost og PS-varianter. Godta.
4. **SQLite som fremdriftslager** i hjemmeserver-flyttingen før frost-endepunktet bygges (rekkefølge i byggingen).

### Avgjort 10. november

- **Innlogging:** passordskjerm beholdes som del av fiksjonen (fast passord barna kan, ingen reell sikkerhet).
- **Radio i helgen:** Morgenrådet som vanlig, klippet går i 09-sendingen. Klippet ligger også i appen.
- **Kanalkart:** K1 Snøfall landsby/ute, K2 IQs verksted, K3 Julius' video, K4 antennen ved tjernet med frekvenshjul (85,0 MHz = Krystallgrotten). Koden endres til å følge kartet.
- **Sidepanel:** bare Frostgraden.
- **Brevfugler:** «skriv brev til Julius» beholdes uten svar, men bygges slik at brevene kan integreres senere (for eksempel at Julius nevner et brev i videoen).
- **Bonus dag 16:** foreldrekode `LYKT2026`. Fristen fredag 18. nevnes i historien, men håndheves ikke i koden.
- **Dag 1, 6 og 24 (gåtedetaljer):** avgjøres i steg 1.

### Intensitetskurven (godkjent 10. november)

- **Dag 10–12 platå:** Kulde-nivå i Julius-videoen dag 11 senkes fra 3 til 2, og musikken høres i appen når dag 12 tiner.
- **Dag 16–18 platå:** når dag 17 løses, skyller nordlyset over hele skrivebordet i grønt, og Frostgraden tikker synlig ned.

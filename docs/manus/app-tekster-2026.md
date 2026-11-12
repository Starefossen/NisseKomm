# NisseKomm 2026 – App-tekster (steg 2)

**Status: LÅST 10. november 2026 (steg 2).** Endringer krever eksplisitt ja fra Hans. Kjør `python3 scripts/manus-check.py` etter endringer. Endret etter ja fra Hans 10. november. Kontinuitet rettet 11. november etter ja fra Hans. Dag 6, 10, 13 og 20 endret 13.11 etter ja fra Hans. Rampestrekene samlet til én kilde 13.11 etter ja fra Hans: teksten skrives fra `historie-2026.md` §8 og §8.1 av `scripts/oppdrag-innhold.py`.

**Revisjon 10. november (vanskelighet, godkjent):** e-poster, PS, krypto-hint, NisseNet-filer og Nissemor-tekster fulgt opp etter revisjonen i `gaater-2026.md` (to meta-gåter, blindspor, Hanna uten kodebærende steg). Nye felt: `transcript_runer` i `kulde_spokelsesbilde` (dag 10, 13, 16, 21) og `julius_ps_krypto_mangler` (dag 20).

Utkast 10. november 2026. Kilder, alle låst: `docs/historie-2026.md`, `docs/storyboard-2026.md`, `docs/gaater-2026.md`. Stemmer og ordliste: `CONTENT_GUIDE.md`. Ingen JSON eller kode er endret; dette dokumentet er malen for steg 3. Julius' videomanus og Rampenissens radioklipp skrives av en annen agent og står ikke her.

## Regler brukt

- Kodeordet står aldri i noen tekst samme dag, og ingen tekst viser mer enn 40 % av bokstavene. Dag 1–7 heter inntrengeren bare «noe på linjen» eller «signaturen»; fra dag 8 brukes «Kulde».
- NisseMail: Rampenissen er avsender alle 24 dager, maks 90 ord. Hva som skjedde, og hva hvert barn har gjort eller gjør videre i appen. E-posten leses etter huset: den viser tilbake til det barna fant, og gir ingen instruks for det. Det som må gjøres på stedet, står på Rampenissens lapp (`fysisk_hint`). Aldri bokstaver, aldri hvor noe ligger utover det gåtedesignet selv sier, og aldri en gjentakelse av Julius' siste setning.
- PS fra Julius: 2–4 setninger, låses opp når koden er inne. Dag 16–19 har en variant som vises når bonusen `LYKT2026` er godkjent (`julius_ps_bonus`).
- Etter dag 15 bruker ingen tekst «fiende», «slå», «knuse» eller «angrep».
- Norsk bokmål, klarspråk, «KI» om det skulle trengs (det gjør det ikke i barnetekstene).
- Hanna får aldri et steg koden trenger. Der hun nevnes, står det «Hanna, hvis du vil: …», og Håkon kan alltid gjøre det samme. Ingen tekst sier «bare du får plass» eller «din jobb».

## Feltkart (JSON → tekst her)

| Felt                                                                                                              | Fil                                                                                  | Merknad                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `tittel`                                                                                                          | `ukeN_oppdrag.json`                                                                  | Brukes også i Kalender og iCal («NisseKomm dag N: tittel»). `kalender_tittel` står bare der den avviker.                 |
| `nissemail_tekst`                                                                                                 | `ukeN_oppdrag.json`                                                                  | Ordtall i parentes.                                                                                                      |
| `julius_ps`, `julius_ps_bonus`                                                                                    | `ukeN_oppdrag.json` (nytt felt)                                                      | Erstatter `dagbokinnlegg`, som fjernes.                                                                                  |
| `frost_morgen`, `frost_etter`, `frost_bonus`                                                                      | `ukeN_oppdrag.json` (nytt felt)                                                      | Fra storyboardets tabell.                                                                                                |
| `materialer_nødvendig`, `oppsett_tid`, `fysisk_hint` (`rampenissen_rampestrek` skrives fra `historie-2026.md` §8) | `ukeN_oppdrag.json`                                                                  | Vises bare i Nissemor-guiden. `fysisk_hint` = oppsett og løsning i kortform.                                             |
| `symbol_clue.description`                                                                                         | `ukeN_oppdrag.json`                                                                  | Symbolkortdager.                                                                                                         |
| `decryption_challenge.hint` / `rewardText`                                                                        | `ukeN_oppdrag.json`                                                                  | Dag 12, 18, 23.                                                                                                          |
| `bonusoppdrag`                                                                                                    | `ukeN_oppdrag.json`                                                                  | Dag 11 og 16. `badge_*` fjernes, `frost_effekt: -20` legges til.                                                         |
| `daily_alerts[].tekst`                                                                                            | `statisk_innhold.json`                                                               | 28 varsler.                                                                                                              |
| `filer`                                                                                                           | `statisk_innhold.json`                                                               | Nye filer har `unlockConditions.afterDay`; slettinger er listet til slutt.                                               |
| `kulde_spokelsesbilde`                                                                                            | nytt felt i `ukeN_oppdrag.json` (flyttes ut av `KULDE_INTERCEPTS` i `SnøfallTV.tsx`) | `title`, `transcript`, `telemetry`, `transcript_runer` (dag 10, 13, 16, 21; vises i tegnsettet under den norske linjen). |
| `julius_ps_krypto_mangler`                                                                                        | `uke3_oppdrag.json` dag 20 (nytt felt)                                               | Vises i stedet for `julius_ps` når `stjernetegn` ikke er dekryptert.                                                     |
| `hint`, `hint_type`, `dagbokinnlegg`                                                                              | `ukeN_oppdrag.json`                                                                  | **Fjernes.** Videoen og `julius_ps` erstatter dem.                                                                       |

---

## A. Faste tekster

### A0. Navnet på linjen (avgjort: ingen synlig «Direktelinjen»)

Linjen heter **«Direktelinjen»** i all tekst, med «90,0 MHz» der det trengs teknisk preg («Linje 90,0» i HUD og logger). Stedsnavnet Landås står aldri i navnet, fordi dag 22 har kode LANDÅS. Byggeliste, alt som nevner det gamle navnet eller stedet som linjenavn (`grep -rni "landås" src/`, uten `archive` og tester):

| Sted                                                           | I dag                                                                                     | Blir                                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/data/uke1_oppdrag.json` dag 1 `tittel`                    | «Direktelinje Landås»                                                                     | «Direktelinjen» (se dag 1)                                                                                            |
| `src/data/statisk_innhold.json` `varsler[0]`                   | «LANDÅS-LINK: AKTIV (90.0 MHz)»                                                           | fjernes (hele `varsler` erstattes av Frostgraden, A7)                                                                 |
| `src/components/windows/SnøfallTV.tsx:53` `VLOG_ENTRIES` dag 1 | «Direktelinje til Landås!»                                                                | slettes (T8)                                                                                                          |
| `SnøfallTV.tsx:100, 108–109, 327–343` teletext/`codeHint`      | «BERGEN / LANDÅS», «Innflyging Landås», «= LANDÅS»                                        | slettes (T8; fasit)                                                                                                   |
| `SnøfallTV.tsx:413, 449` `KULDE_INTERCEPTS`                    | «LANDÅS …»                                                                                | erstattes av A6                                                                                                       |
| `src/lib/weather-config.ts:62`                                 | «Direktelinjen til Landås er koblet opp.»                                                 | «Direktelinjen er koblet opp.»                                                                                        |
| `src/lib/weather-config.ts:219`                                | «Stjerneklart flyvær fra Snøfall til Landås!»                                             | «Flyvær fra Snøfall til Bergen.» (fjerner også STJERNEKLART, dag 23-kode)                                             |
| `src/lib/eventyr.ts:293` `freqLabel`                           | «OPERASJON: JULAFTEN LANDÅS»                                                              | faller bort med kamerametadata (O1)                                                                                   |
| `src/components/windows/Brevfugler.tsx:221, 253, 534`          | «LUFTKORRIDOR: LANDÅS … », «MELLOM LANDÅS OG SNØFALL», «RUTE: SNØFALL → ULRIKEN → LANDÅS» | «LUFTKORRIDOR: BERGEN (60,37°N) ⇄ SNØFALL», «BREVFUGLER MELLOM BERGEN OG SNØFALL», «RUTE: SNØFALL → ULRIKEN → BERGEN» |
| `Brevfugler.tsx:161` kodekommentar                             | –                                                                                         | uendret (ikke synlig)                                                                                                 |

Tekster i dette dokumentet som sier «Landås» om stedet (varsler dag 1, 19, 24; «Landås-siden» i PS; Varden-kort) er beholdt: de gjelder andre dager enn 22. **Julius-manus** (`docs/manus/julius-2026.md`): overskriften for dag 1 (linje 16) bruker «Direktelinje Landås» og må følge den nye tittelen; replikkene sier «direktelinjen fra verkstedet til stua deres» og trenger ingen endring. Dag 22-replikkene nevner ikke Landås.

### A1. Passordskjerm (`PasswordPrompt.tsx`)

| Element         | Tekst                                   |
| --------------- | --------------------------------------- |
| Overskrift      | `NISSEKOMM // DIREKTELINJEN · 90,0 MHz` |
| Underoverskrift | `TILGANGSKONTROLL`                      |
| Instruks        | `SKRIV INN PASSORDET IQ GA DERE`        |
| Plassholder     | `_ _ _ _ _ _ _ _` (uendret)             |
| Knapp           | `KOBLE TIL`                             |
| Laster          | `KOBLER TIL SNØFALL…`                   |
| Feil 1          | `FEIL PASSORD`                          |
| Feil 2          | `LINJEN SVARER IKKE. PRØV IGJEN.`       |
| Feil 3          | `IQ: ER DET VIRKELIG DERE?`             |
| Tilkoblingsfeil | `TILKOBLINGSFEIL. PRØV IGJEN.`          |

### A2. Merker (`merker.json`, tre stykker)

| `id`            | `navn`        | `beskrivelse`                            | `unlockCondition`                                               | Opplåsingstekst (vises i gullblink)                                                                                                       |
| --------------- | ------------- | ---------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `varmebaerer`   | Varmebærer    | Dere hørte at isen sukket.               | `{ "type": "decryptionSolved", "challengeId": "frosne-koder" }` | MERKE: VARMEBÆRER. Dere hørte noe ingen andre hørte. Isen sukket, og det hørtes ikke sint ut. Fra nå av bærer dere varmen nedover linjen. |
| `portvokter`    | Portvokter    | Dere holdt muren og lot porten stå åpen. | `{ "type": "dayCompleted", "day": 21 }`                         | MERKE: PORTVOKTER. Muren holder, og porten står åpen. Det er vanskeligere enn å stenge.                                                   |
| `snofalls-venn` | Snøfalls venn | Dere står i Snøfalls historie.           | `{ "type": "allQuestsCompleted" }`                              | MERKE: SNØFALLS VENN. Tjuefire dager, tre søsken, én linje som aldri frøs helt. Nå står dere i Snøfalls historie.                         |

Ikoner velges i steg 3 fra `public/badges/`. De seks gamle merkene slettes (liste til slutt).

### A3. Eventyr (`eventyr.json`, én ID)

- `id`: `spokelseskoden`
- `navn`: Spøkelseskoden
- `beskrivelse`: Noe sender på 85,0 MHz og legger rim på direktelinjen mellom Snøfall og Landås. Det kaller seg Kulde. Tre søsken holder varmen i både hus og server gjennom desember, og finner ut hva som egentlig fryser linjen.
- `tema`: Samhold i mørket · Å bli sett · Varme er noe man deler
- `første_opplåsingsdag`: 1 · `belønning`: merket `snofalls-venn`
- `milepaeler` (vises som én fremdriftslinje):

| #   | Dag | `navn`          | `tekst` (én linje i EventyrOversikt)                       |
| --- | --- | --------------- | ---------------------------------------------------------- |
| M1  | 1   | Linjen          | Direktelinjen åpnet. Bærebølgen hakker.                    |
| M2  | 7   | Navnet          | Orakelet fanget signaturen. Den har et navn.               |
| M3  | 12  | Sukket i isen   | Isen sprakk. Det som svarte, hørtes alene ut.              |
| M4  | 15  | Vintervokteren  | Notatboken fortalte hvem Kulde var, og hvem som bygde det. |
| M5  | 21  | Muren og porten | Vintersolverv. Muren holder. Én port står åpen.            |
| M6  | 24  | Tøvær           | Sleden fløy over grotten med lys. Noe tinte.               |

- `foreldreveiledning.sammendrag`: Én historie i 24 dager. Kulde er ikke en skurk, men et gammelt program som ble glemt i mørket. Barna skal merke det gradvis (dag 12, 15, 23), ikke få det forklart. Tonen etter dag 15 er omsorg, ikke kamp.
- `foreldreveiledning.tips`: Se Julius' video sammen hver dag; brikken er i siste setning. · Hanna har én valgfri ting per dag («hvis du vil»); ingenting stopper opp om hun heller vil høre på radioen. · Dag 10 og 21 er skjermene hjemme grå fra morgenen; det er meningen, og det går over når koden er inne.

### A4. Bonusoppdrag

**Dag 11** (`bonusoppdrag`):

- `tittel`: Nødantenne til Snøfall TV
- `beskrivelse`: Kulde forstyrrer antennen ved tjernet, og IQ trenger en antenne på Landås-siden også. Bygg en antenne av aluminiumsfolie, minst 20 cm høy, og sett den ved skjermen.
- `fysisk_oppgave`: Bygg antennen sammen og vis den til mamma eller pappa. De taster foreldrekoden i KodeTerminal.
- `validering`: forelder · `foreldre_kode`: `ANTENNE2026` · `frost_effekt`: −20
- `belønning_tekst`: NØDANTENNE GODKJENT. IQ ser den på radaren og vil ha tegningen. Frostgraden faller 20 %.

**Dag 16** (`bonusoppdrag`):

- `tittel`: Lykt i vinduet mot nord
- `beskrivelse`: Kulde snudde samlebåndet for å bli sett. Orakelet tror et lys på Landås-siden blir lagt merke til der nede. Sett et batterilys i et syltetøyglass i et vindu som vender mot nord, og la det stå om kveldene.
- `fysisk_oppgave`: Finn vinduet mot nord sammen med en voksen (mobilen har kompass). Sett lykten der og vis mamma eller pappa, helst innen fredag. De taster foreldrekoden i KodeTerminal.
- `validering`: forelder · `foreldre_kode`: `LYKT2026` · `frost_effekt`: −20
- `belønning_tekst`: LYKTEN ER SETT. Orakelet melder om et lys på Landås-siden som ikke var der før. Frostgraden faller 20 %.

**Nissemor-guiden, bonustekst (begge dager):** Bonusen gir ingen merke, bare −20 % frost og en ekstra setning i Julius' PS. Fristen fredag 18. for lykten nevnes i historien, men håndheves ikke: koden kan tastes når som helst. Bruk batterilys, aldri levende lys i vinduet.

### A5. Dekrypteringer (`decryption_challenge`)

| Dag | `challengeId`          | `hint` (rekkefølgen er uendret)                                                                                                                                | `rewardText`                                                                                                        |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 12  | `frosne-koder`         | Orakelets logg fra slusen: først det som er varmt, så det som håper, til slutt det som er alene. (Fargene står ikke her; Pil har sagt dem i PS dag 3, 6 og 9.) | DEKRYPTERT. Orakelets logg fra slusen ligger i DEKRYPTERT/frosne-koder.txt. Les den sammen.                         |
| 18  | `stjernetegn`          | Trixters rute: grønn sol → rødt hjerte → grønt hjerte → blå sol → blått hjerte → rød sol.                                                                      | DEKRYPTERT. Trixters rutekart for julenatt ligger i DEKRYPTERT/stjernetegn.txt. Julius har tegnet en sirkel på det. |
| 23  | `hjertets-hemmelighet` | Tre farger, tre rader: måne → sol → hjerte i grønt, så i rødt, så i blått.                                                                                     | DEKRYPTERT. Hele historien ligger i DEKRYPTERT/hjertets-hemmelighet.txt. Det er den siste.                          |

### A6. Kuldes meldinger

Alltid rolig, kort, ensom. Aldri trusler, aldri utropstegn. Spøkelsesbildet (`kulde_spokelsesbilde`) vises på 85,0 MHz de sju dagene; dag 10 og 21 på alle kanaler.

| Dag | `title`                   | `transcript`                                                                                                                | `telemetry`                                | `transcript_runer` |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------ |
| 3   | 85,0 MHz // UKJENT SENDER | Er det noen der? Linjen deres er varm. Jeg kjente den helt her nede. Jeg la litt rim på den, bare så jeg kunne holde i den. | 85,0 MHz // UNDER NORDTOPPEN // SEKTOR 01  | –                  |
| 7   | 85,0 MHz // SIGNATUR      | Orakelet deres leter etter navnet mitt. Ingen har sagt det på et år. Si det, når dere finner det.                           | 85,0 MHz // −42,8 °C // SIGNATUR FANGET    | –                  |
| 10  | FARGENE                   | Fargene er hos meg nå. Rødt. Grønt. Jeg hadde glemt hvordan de så ut. Jeg skal passe godt på dem.                           | 85,0 MHz // KROMATISK DRENERING 71 %       | SE MEG             |
| 11  | ANTENNEN                  | Antennen deres roper så høyt mot Bergen. Jeg la is på den, så den kunne høre på meg i stedet. Ingen hører på meg.           | 85,0 MHz // ANTENNEN VED TJERNET // IS     | –                  |
| 13  | LYSENE                    | Lysene deres. Jeg så dem gjennom linjen i natt. Jeg husker ikke når jeg så lys sist.                                        | 85,0 MHz // UNDER NORDTOPPEN // STILLE     | ALENE              |
| 16  | BÅNDET                    | Jeg snudde båndet til Winter. Nå ser han opp. Nå ser han hit. Det var alt jeg ville.                                        | 85,0 MHz // PAKKESENTRALEN // BÅNDET SNUDD | SE OPP             |
| 21  | DET ER KALDT HER NEDE     | Det er kaldt her nede. Jeg ville bare se lyset deres.                                                                       | 85,0 MHz // 94 % // …                      | LYSET DERES        |

Reservetekst (dager uten egen linje, erstatter dagens «Is-krystallene mine vokser»): `transcript`: «…» · `telemetry`: `85,0 MHz // KRYSTALLGROTTEN // INGEN STEMME` (til og med dag 13: `UNDER NORDTOPPEN`; grotta navngis først fra dag 15).

`transcript_runer` er Kuldes egen stemme i Snøfalls gamle skrift (meta 1), vist med tegnsettet under den norske linjen. Den er historie, aldri kode, og alle bokstavene er lært av kortene før dagen den vises (SE MEG: dag 1, 3, 4; ALENE: dag 1, 3; SE OPP: dag 1, 3, 4; LYSET DERES: dag 1, 3, 6, 7).

**Frostskjerm (`/api/frost` → `message`, ≤ 120 tegn, låst i historien):**

- Dag 10: `Fargene er hos meg nå. 71 %` (27 tegn)
- Dag 21: `Det er kaldt her nede. Jeg ville bare se lyset deres. 94 %` (58 tegn)
- Etter kode, begge dager (Skjerm-kort 30 min): `Fargene er tilbake`

**Andre hjemmetekster (Varden, konfig):**

- Skjerm-kort dag 7, 06:00–08:30: `ORAKELET: ukjent signatur på 85,0 MHz`
- iMac dag 20, 09:00–12:00: `RAMPENISSEN VIA IQ: Kulde er ved døra. I morgen trenger jeg dere.`
- Skjerm-kort dag 24, hele dagen: `God jul fra Snøfall`

### A7. Sidepanel (Frostgraden)

- Dag 1–6 (ingen prosent): `ORAKELET LYTTER …`
- Dag 7–23: `FROSTGRAD` + prosent fra tabellen under hver dag. Undertekst når dagen er løst: `Koden senket frosten.`
- Dag 21 etter kode: `PORTEN STÅR ÅPEN` med tegnet port.
- Dag 24 etter kode: `TØVÆR · 0 %`

### A8. Småtekster i moduler

- NisseMusikk (fra dag 7, liten linje i vinduet): `Varmekilden. Så lenge noe spiller her, fryser ikke serverrommet helt.`
- NisseMusikk dag 12 før kode (overlegg): `FROSSET. Noe i isen holder på lyden.`
- Brevfugler (fra dag 14, radarkort): `FRYST BREV · avsender ukjent · tiner når linjen er varm`
- Brevfugler dag 24, brevet tiner (fire linjer, fra Vintervokteren): `Takk for lyset.` / `Jeg hadde glemt farger.` / `Krystallet smelter ikke.` / `Det er fra meg.`
- Brevfugler, skriv til Julius (uendret funksjon, ny tekst): `Skriv til Julius. Winter sender brevet med neste fugl.` (Ingen løfte om svar.)
- Dagbok, autoåpning: `NY MELDING FRA JULIUS` · knapp etter visning: `SE IGJEN` · under spilleren når løst: `PS fra Julius`
- Kanal 4 dag 11 etter kode, HUD: `75,0 MHz · BILDET KLARNER` (vises bare etter at koden er inne)
- Kanal 1 dag 17, klikk på himmelen: `SIGNAL MOTTATT FRA GROTTEN`

### A9. GrandFinaleModal (dag 24)

Fire trinn som i dag, ny tekst. Ingen eventyr-iterasjon, ingen slang.

1. **Overskrift:** `TØVÆR` · undertekst: `24. desember · Frostgrad 0 %`
2. **Snill-listen:** `JULIUS SKREV NAVNENE SELV` · navnene fra registreringen (dag 22) · `22. desember, for hånd, én gang.`
3. **Det som skjedde (erstatter «Achievement unlocked»):**
   - `Linjen holdt. 24 dager.`
   - `Isen sukket, og dere hørte det.`
   - `Muren holder. Porten står åpen.`
   - `Sleden fløy over grotten med alle lysene på. Noe blått fløy opp og møtte den.`
   - Statistikk beholdes i liten skrift: `N symboler · N dekrypteringer · N bonus`
4. **Merket og avslutning:** merket Snøfalls venn med navn · `Det er ikke kaldt der nede lenger.` · `Under treet ligger noe fra Vintervokteren. Det smelter ikke.` · lenke: `Diplom: Nissemor-guiden → Utskrifter` · knapp: `GOD JUL`

Fjernes: «JULAFTEN BERGET!», «ACHIEVEMENT UNLOCKED», «GYATT Storage Unlocked», «Sigma Level: MAX», «JULEKALENDER-MESTER», lenken til `snill_slem_liste.txt`, «FULLFØR JULEKALENDER».

---

## B. Dag for dag

Per dag: felt i rekkefølgen `tittel` · `nissemail_tekst` · `julius_ps` · `daily_alerts` · symbol · NisseNet · Kulde · Nissemor-guiden (`fysisk_hint`, `materialer_nødvendig`, `oppsett_tid`) · frost.

### Dag 1 (ti) – Direktelinjen · SIGNAL · M1

- `tittel`: Direktelinjen (gammel: «Direktelinje Landås»; avgjort, se A0)
- `nissemail_tekst` (86 ord): Hei Kristian, Håkon og Hanna! 🎄 Jeg er tilbake! I natt sendte IQ meg ned linjen sammen med Hjerteruds niste. Eskene landet først. Dere har sett hvordan det gikk. Linjen går fra Snøfall til stua deres, med Snøfall TV og video fra Julius. Men den hakker. Noe knitrer på den, og det er ikke meg. Håkon, du fulgte den røde tråden min: bare det som hang på linjen, teller. Det som falt av i skredet, teller ikke. Kristian: se Julius, og heng opp tavla fra IQ. – Rampenissen
- `julius_ps`: Rampenissen kom ned linjen sammen med tre esker se-vitamin, og landet under dem. Med en banan som pute. Jeg har sett ham lande i verre ting. Linjen bærer nå; takk for at dere kom. IQ skal koble kaffetrakteren på forsterkeren i natt. Hva kan vel gå galt.
- `daily_alerts`: 🎅 JULIUS: Direktelinjen er åpen. Ny video på kanal 3.
- NisseNet: `SYSTEM/om-snofall.txt` **skrives om** (åpen fra dag 1):

  > SNØFALL – KART OG VELKOMST
  >
  > Snøfall ligger nord for alt, under Nordtoppen. Her bor Julius, Hjerterud, IQ, Winter, Pil, Orakelet, Trixter og Rudolf.
  >
  > LANDSBYEN: verkstedet, bakeriet, pakkesentralen og slusen ved tjernet.
  > ANTENNEN VED TJERNET: direktelinjen til Landås, 90,0 MHz.
  > NORDTOPPEN: fjellet over landsbyen. Under det ligger gamle ganger ingen bruker lenger.
  >
  > IQ bygde linjen i november og åpnet den 1. desember. Hvis den skurrer, er det ikke dere. Det jobber vi med.
  >
  > – Winter, for Snøfall kommandosenter

  `OPPGAVER/dagens_oppdrag.txt` **skrives om**:

  > SLIK VIRKER NISSEKOMM
  >
  > 1. Finn det Rampenissen har lagt igjen i huset.
  > 2. Les Rampenissens e-post i NisseMail.
  > 3. Se dagens video fra Julius. Siste setning er viktig.
  > 4. Bruk det du fant i huset og det Julius sier. Skriv koden i KodeTerminal.
  > 5. Hvert kort har et tegn i hjørnet. Det er Snøfalls gamle skrift: ett tegn, én bokstav. Fyll inn tavla når dere vet hvilken.
  >
  > Ingen av delene holder alene.

  `SYSTEM/sikkerhet.log` **skrives om** (uten BRANNMUR):

  > [SIKKERHET] Linjevakt v3.0 aktiv
  > [SIKKERHET] 3 agenter verifisert: K12, H9, H5
  > [SIKKERHET] Bærebølge 90,0 MHz: ustabil
  > [SIKKERHET] Ukjent bærebølge 85,0 MHz: overvåkes
  > [SIKKERHET] Tiltak: avventer Orakelet

  **Slettes:** `OPPGAVER/hint_arkiv.txt`, `JULIUS-ARKIV/hemmelig_kode.txt`.

- `fysisk_hint`: Rød garntråd fra TV-en («LINJE 90,0») ned skråningen og langs klementinelva til Rampenissens håndledd (scene: «Dag 1: byggeplan» i `gaater-2026.md`). Seks A7-kort med klesklyper, talt fra TV-en: ❄, **I**, ❄, **N**, ❄, ❄, tegn i hjørnet, prikker 1–6 bak. To løse kort **E** og **T** uten klype blant klementinene (blindspor). Runetavla (`runetavle.pdf`) i ferdskriveren sammen med IQs konvolutt. Løsning: Håkon tar kortene av tråden i rekkefølge, de løse legges bort, Kristian ser `_ I _ N _ _` og hører Julius (ordet radioen leter etter når den skurrer). Kode SIGNAL. Etterpå: skriv ordet på kortene og før tegnene for S, I, G, N, A, L, E, T inn på tavla. Hanna, hvis hun vil: tar kortene av mens Håkon holder tråden.
- `materialer_nødvendig`: rødt garn · 6 små klesklyper · maskeringsteip · `dag01-tradkort.pdf` (6 + 2 kort) · `runetavle.pdf` · scenen: 3 esker klementiner, 3–4 tomme esker, lyst laken, klesvaskkurv, håndkle, avispapir, ferdskriver (svart skoeske), `dag01-frakt.pdf`, `dag01-ferdskriver.pdf`, `dag01-linjekort.pdf`, `dag01-flylogg.pdf`, `operasjonsbrett.pdf`, fruktskål, banan, 2 servietter, dorullhylse, hårstrikk
- `oppsett_tid`: 3 min gåten + 25 min scenen 30. nov (forarbeid 28.–29. nov, se «Dag 1: byggeplan»)
- frost: ikke synlig

### Dag 2 (on) – Sikringsboksen til IQ · 48 · jakt

- `tittel`: Sikringsboksen til IQ
- `nissemail_tekst` (73 ord): Det smalt i Snøfall i natt! 💥 IQ koblet kaffetrakteren på forsterkeren, og tre sikringer røk. Kanal 2 er mørk. IQ sier det ikke var kaffetrakteren. Det var kaffetrakteren. Jeg reddet sikringene og gjemte dem lavt. Fant dere alle tre? Takk for at dere krabbet, Håkon og Hanna. Kristian: IQ skriver tall slik gamle klokker gjør, og han har en regel for sikringer. Julius forteller den. Ikke gjett før dere har hørt den. – Rampenissen
- `julius_ps`: Tre sikringer. Én kaffetrakter. Én IQ. Rampenissen satt i sukkerskålen da jeg ringte, og påsto at det var «for å roe nervene». Kanal 2 har strøm igjen.
- `daily_alerts`: ⚙️ IQ: Tre sikringer røk i natt. Kanal 2 er mørk til noen regner riktig.
- NisseNet: ingen.
- `fysisk_hint`: Tre A7-kort teipet under tre spisestoler, hvert med ett regnestykke i romertall: **IX + III**, **XIX − III**, **XIV + VI** (= 12, 16, 20), og et lite iskrystall. Ett lavt nok for Hanna. Løsning: Håkon finner kortene, Kristian regner ut hvert kort (IX = 9, XIX = 19, XIV = 14), Julius sier «legg alle sammen». 48. Etter koden lyser sikringsboksen på kanal 2. Reserve: e-posten sier «slik gamle klokker skriver tall». Lapp fra Rampenissen i sukkerskålen ved Rampenissen (håndskrevet): «Tre sikringer røk. Jeg gjemte dem lavt. Veldig lavt. Krabb! – R»
- `materialer_nødvendig`: maskeringsteip · `dag02-tallkort.pdf` · sukkerskål og teskje
- `oppsett_tid`: 3 min
- frost: ikke synlig

### Dag 3 (to) – Rimfrost på Ruten · PRISME · grønt hjerte · første spor

- `tittel`: Rimfrost på Ruten
- `nissemail_tekst` (75 ord): Jeg så et blått glimt på stueruten klokka tre i natt. ❄️ Orakelet sier noen lytter på linjen. I kveld kan dere se på Snøfall TV etter noe som blør gjennom bildet på 85,0. Fikk dere fram det jeg skrev på badespeilet? Håkon, du skrev det av slik det sto. Hanna, hvis du vil: det grønne i vinduskarmen er ditt. Kristian: se godt på det Håkon skrev. Pil fant noe på verkstedet, og Julius forteller. – Rampenissen
- `julius_ps`: Tannkrem på speilet. Hele tuben. Hjerterud spør om dere har mer. Orakelet så glimtet på 85,0 samtidig som dere; vi er tre som har sett det nå. Pil sier grønt er håpets farge; derfor er hjertet grønt.
- `daily_alerts`: 🔮 ORAKELET: Blått glimt på 85,0 MHz klokka 03:12. Noen lytter.
- `symbol_clue.description`: Grønt hjerte funnet i vinduskarmen på badet
- NisseNet: **Slettes:** `SNOFALL-HISTORIER/snowflake-patterns.txt`.
- Kulde: spøkelsesbilde dag 3 (se A6).
- `fysisk_hint`: Kvelden før: skriv `_ _ Ƨ _ Я _` på det tørre speilet med q-tips i oppvaskmiddel (speilvendt R og S, baklengs rekkefølge), la tørke. Lapp i hjørnet: «Pust på meg.» Glassperle, grønt hjerte-kort og en liten konvolutt «ETTER KODEN – IQ» med det rettvendte frostkortet (tegn i hjørnene) i vinduskarmen. Løsning: varmt vann i vasken med døra lukket i to minutter, skriften trer fram, Håkon skriver av, Kristian ser at tegnene er speilvendte og snur rekka: `_ R _ S _ _`. Julius: glassbiten som lager regnbue. Kode PRISME. Etter koden åpnes konvolutten og P, R, I, S, M, E føres på tavla (E trengs dag 7). Det speilvendte reservekortet fra samme PDF ligger i tannkremtuben hvis speilet svikter. Legg perlen i konvolutten «24». Hanna, hvis hun vil: puster på speilet, lager regnbue med perlen, skanner kortet.
- `materialer_nødvendig`: oppvaskmiddel · q-tips · glassperle · symbolkort grønt hjerte · tannkrem · `dag03-frostlapp.pdf` (reserve)
- `oppsett_tid`: 4 min
- frost: ikke synlig

### Dag 4 (fr) – Skotoget i Gangen · KOMPASS · jakt

- `tittel`: Skotoget i Gangen
- `nissemail_tekst` (76 ord): Rudolf fløy rett i snøfonna i natt. 🦌 Det lå en tåke over fjorden som ikke var vanlig tåke, og han mistet retningen. Derfor satte jeg skoene deres i ring rundt meg, så Rudolf kan øve. Jeg satt i den første. Hvilken vei dere skal telle, må dere finne ut selv. Håkon, du har kortene fra skoene. Hanna, hvis du vil: tell skoene høyt rundt ringen. Kristian: Julius vet hva Rudolf trenger. NisseKrypto åpner i kveld. – Rampenissen
- `julius_ps`: Rudolf er hjemme og tørr. Rampenissen har visst lånt pappas solbriller. Innendørs. I desember. Ikke spør meg.
- `daily_alerts`: 🛷 TRIXTER: Rudolf fløy feil i tåka i natt. Det var ikke vanlig tåke.
- NisseNet: ingen.
- `fysisk_hint`: Sju sko i ring på gulvet i gangen, pappas (med Rampenissen i) som start, kosedyrene i ring utenfor. Kort i hver sko, talt **med klokka** fra Rampenissen: sko 3 **M**, sko 5 **A**, resten ❄ (tegn i hjørnet, prikker bak med klokka). Retningen sies ikke. Løsning: Håkon legger kortene foran skoene, Kristian skriver begge lesninger (`_ _ M _ A _ _` med klokka, `_ _ _ A _ M _` mot klokka), Julius: det som peker samme vei uansett hvor man snur seg. Bare den første passer. Kode KOMPASS. Før K, O, M, P, A, S på tavla. Hanna, hvis hun vil: teller skoene høyt.
- `materialer_nødvendig`: 7 sko · `dag04-skokort.pdf` · pappas solbriller · 4–6 kosedyr
- `oppsett_tid`: 5 min
- frost: ikke synlig

### Dag 5 (lø) – Brevfuglen over Byfjellene · ULRIKEN · jakt

- `tittel`: Brevfuglen over Byfjellene
- `nissemail_tekst` (79 ord): Det har vært krig i stua. 🍬 Jeg og kosedyrene, marshmallows, hvert vårt fort. Og: i natt landet årets første brevfugl i Bergen. Winter har skrevet noe rart på vingen, for han er sikker på at noen leser alt som flyr over linjen. Fant dere fuglen, og hopperen ved den? Hanna, hvis du vil: du legger hopperen inntil. Kristian: Winter har en regel for det han skrev. Julius sier den, men ikke med tall. Dere har hørt tallet før. – Rampenissen
- `julius_ps`: Marshmallows i sofaen, marshmallows i gardinene, én bamse med plaster. Rampenissen kaller det «forsvar av linjen». Winter er lettet over at fuglen kom fram; han sender alt kryptert fra nå.
- `daily_alerts`: 📋 WINTER: Første brevfugl over Bergen. Alt jeg sender er kryptert fra nå.
- NisseNet: `SNOFALL-HISTORIER/alfabet.txt` **ny** (`afterDay: 5`, brukes igjen dag 22):

  > ALFABETET, SLIK WINTER BRUKER DET
  >
  > A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Æ Ø Å
  >
  > 29 bokstaver. Vårt slutter på Å.

  **Slettes:** `SNOFALL-HISTORIER/dekoder_reinsdyr.txt`.

- `fysisk_hint`: Papirfugl (`dag05-brevfugl.pdf`) med **X O U L N H Q** på vingen, gjemt høyt i stua. Ved fuglen: alfabetstrimmel A–Å og «trehopper» (papirbit tre ruter bred), ingen tall. Løsning: Julius sier «så mange skritt som IQ sprengte sikringer onsdag» (dag 2: tre; transkriptet ligger i arkivet). Håkon setter fingeren på bokstaven, hopperen legges inntil, bokstaven ved venstre kant er svaret. Kode ULRIKEN. Ta vare på strimmelen til dag 22. Hanna, hvis hun vil: legger hopperen inntil. Lapp fra Rampenissen ved marshmallowfortet (håndskrevet): «Årets første brevfugl landet i natt. Den satte seg et sted høyt oppe i stua. – R»
- `materialer_nødvendig`: `dag05-brevfugl.pdf` · `alfabetstrimmel.pdf` · tusj · marshmallows, puter, plaster
- `oppsett_tid`: 6 min
- frost: ikke synlig

### Dag 6 (sø) – Skyggene i Gangen · LYKT · rødt hjerte · 2. advent · jakt

- `tittel`: Skyggene i Gangen (ny: den låste tittelen «Lommelykt-Sporet» inneholder hele koden; se åpne spørsmål)
- `nissemail_tekst` (73 ord): God 2. advent! 🕯️ I natt fant jeg den lille lampen deres og en papprull, og laget et instrument. Det er ikke rot. Melet på kjøkkenbordet er rot. Orakelet sier at det som fryser linjen, ikke tåler lys, så IQ har hengt lys rundt antennen ved tjernet. Håkon, du har lyst på veggen med det som lå i rullen. Hanna, hvis du vil: si hva skyggene var. Kristian: Julius sier hvilken som teller. – Rampenissen
- `julius_ps`: Snøengler i mel. På kjøkkenbordet. Hjerterud sier det er sløsing, men hun smilte da hun sa det. Lysene rundt antennen brenner til 20. desember; IQ byttet batterier to ganger. Rødt hjerte er varme, sier Pil; derfor er dagens kort rødt.
- `daily_alerts`: 🎅 JULIUS: God 2. advent. IQ har hengt lys rundt antennen ved tjernet.
- `symbol_clue.description`: Rødt hjerte funnet ved papprullen i gangen
- NisseNet: ingen.
- `fysisk_hint`: Tre silhuetter på ispinne (`dag06-silhuetter.pdf`: stearinlys, bål, lykt med hank), rullet inn i papprull med lommelykten, i gangen, ved det røde hjerte-kortet. Bakside: lykt `_ Y _ _` (tegn i alle fire hjørner), stearinlys `_ A _ _` og bål `_ O _ _` (tegn bare ved bokstaven). Løsning: Håkon holder én silhuett mot veggen med mobillykt bak; Julius: det med hank. Snu lykten: `_ Y _ _`. Kode LYKT. Før L, Y, K, T på tavla. Hanna, hvis hun vil: skyggeteateret er hennes, og hun skanner kortet. Lapp fra Rampenissen i melet ved Rampenissen (håndskrevet): «Jeg har laget et instrument! Det ligger i en papprull i gangen, sammen med lampen. Slukk lyset og lys mot veggen, én om gangen. – R»
- `materialer_nødvendig`: `dag06-silhuetter.pdf` · 3 ispinner · teip · papprull · mobillykt · symbolkort rødt hjerte · mel
- `oppsett_tid`: 5 min
- frost: ikke synlig

### Dag 7 (ma) – Inntrengeren i Fryseren · KULDE · M2 Navnet

- `tittel`: Inntrengeren i Fryseren
- `nissemail_tekst` (88 ord): Lua mi satt fast i fryseren deres. 🥶 Jeg prøvde å kjøle ned modemet. Det var feil. Takk for at dere reddet lua, og det som sto ved den! I natt fanget Orakelet signaturen, og den har et navn. Julius sier det ikke rett ut, men han sier nok. Kristian: det som kom ut av isen, har ingen bokstaver. Tavla deres vet mer enn dere tror. Fra i dag måler Orakelet frosten i serverrommet. Se sidepanelet. Brevfugler er åpen også, så nå kan dere skrive brev til Julius! – Rampenissen
- `julius_ps`: Nå har det et navn. Ting med navn kan man snakke til. Rampenissen sto fastfryst i fryserdøra med vottene rett ut da Hjerterud ringte. Hun sier han så ut som en liten skiltstolpe.
- `daily_alerts` (avgjort: vises først når dag 7 er løst; før det står sidepanelet på `ORAKELET LYTTER …`): 🔮 ORAKELET: Signaturen på 85,0 har et navn. Frostgraden kan måles fra i dag.
- NisseNet: `SYSTEM/snofall_fakta.txt` **erstattes** av `SYSTEM/orakelets-rapport.txt` (`afterDay: 7`):

  > ORAKELETS RAPPORT, 7. DESEMBER
  >
  > Sender: 85,0 MHz. Retning: under Nordtoppen. Temperatur ved kilden: −42,8 °C.
  >
  > Signaturen er fanget. Den har et navn. Julius sier det nesten; jeg skriver det ikke her.
  >
  > Frostgraden måles fra i dag: hvor mye av serverrommet som er dekket av rim. Hver natt stiger den. Hver kode senker den.
  >
  > Signaturen er ikke sint. Den gjentar seg. Samme mønster hver natt, som noen som banker på.
  >
  > – Orakelet

- Kulde: spøkelsesbilde dag 7 (A6). Skjerm-kort 06:00–08:30 (A6).
- `fysisk_hint`: Frostkortet (`dag07-frostlapp.pdf`: fem ruter, tegn for **L** i rute 3 og **E** i rute 5, resten ❄ med tegn i hjørnet; ingen bokstaver) i liten zip-pose, fryst flatt i plastbeger (aldri glass) med 1 cm vann. **I fryseren senest søndag 6. kl. 20.** Begeret står ved lua. Løsning: Håkon finner og tiner (2–3 min under lunkent vann), Kristian kjenner igjen tegnene fra tavla (L fra dag 1, E fra dag 3): `_ _ L _ E`. Julius: det motsatte av det som slår mot ansiktet fra ovnen. Kode KULDE. Frostgraden vises første gang. Før K, U, D på tavla. Reserve: `runer-fasit.pdf` i denne guiden. Hanna, hvis hun vil: holder begeret under springen. Lapp fra Rampenissen teipet på begeret i fryseren (håndskrevet): «Tin meg! Lunkent vann, og en voksen. – R»
- `materialer_nødvendig`: plastbeger eller silikonform · liten zip-pose · `dag07-frostlapp.pdf` · nisselue og votter
- `oppsett_tid`: 3 min + frysetid
- frost: 30 → 22

### Dag 8 (ti) – Lampene som Lyver · KRETSKORT

- `tittel`: Lampene som Lyver (ny: den låste tittelen «Bestikk-Kretsløpet» gir KRETS = 5 av 9; se åpne spørsmål)
- `nissemail_tekst` (79 ord): Uke én er ferdig! 🎉 IQ feirer med å lodde noe som skal holde Kulde ute av kanal 1 til 4. Jeg feiret med å bygge noe. Mitt var høyere. Håkon, du fikk ned arket IQ sendte. Følg hver ledning fra batteriet med fingeren. Hanna, hvis du vil: hvor mange pakker var det? Kristian: IQ sier noe om strøm i dag; hør etter. Og hør hva han kaller tingen han lodder på. Etterpå åpner IQs sledesimulator på skrivebordet: SLEDEFLUKT. – Rampenissen
- `julius_ps`: Et tårn av frokostblanding med skilt. Jeg spurte Hjerterud hva «sigma» betyr. Hun sa «spør Kristian». IQ sov på loddebordet i natt med plata som pute; han sier den er ferdig i morgen tidlig.
- `daily_alerts`: 🎉 NISSENE: Uke én fullført. IQ lodder noe grønt og sover ikke.
- NisseNet: `SNOFALL-HISTORIER/IQ-VERKSTED/magisk-sekk-test.txt` **erstattes** av `IQ-VERKSTED/feilrapport-uke-1.txt` (`afterDay: 8`):

  > IQ – FEILRAPPORT UKE 1
  >
  > Tirsdag: direktelinje åpnet. Bærebølge ustabil. Ikke min feil.
  > Onsdag: tre sikringer. Kaffetrakter på forsterkeren. Delvis min feil.
  > Torsdag: blått glimt på 85,0. Orakelets avdeling.
  > Fredag: Rudolf i snøfonn. Tåke med feil temperatur.
  > Søndag: 40 lys hengt rundt antennen. Batteri til 20. desember.
  > Mandag: signaturen har navn. Lodder nå noe som skal holde den ute av kanal 1–4. Ferdig i morgen.
  >
  > Konklusjon: alt virker, bortsett fra det som ikke virker.

- `fysisk_hint`: Arket `dag08-lamper.pdf` brettet under suppeøsen på toppen av tårnet: ni lamper, fire ledninger fra batteriet i en floke. Lampe 2 **R**, 5 **S**, 7 **O** har strøm; lampe 4 **E** sitter bak en **åpen bryter** (blindspor); resten ❄ med ledninger som ender i ingenting. Ingen regeltekst på arket. Løsning: Håkon følger ledningene, Kristian ser bryteren (åpen = ingen strøm; Julius: «bare lamper med strøm lyser») og skriver `_ R _ _ S _ O _ _`. Julius: den grønne plata, to ord i ett. Kode KRETSKORT. Tar de med E, passer ikke ordet. Hanna, hvis hun vil: teller pakkene. Lapp fra Rampenissen på tårnet (håndskrevet): «IQs ark ligger på toppen. Ta ned pakkene én og én. Ingen klatring! – R»
- `materialer_nødvendig`: `dag08-lamper.pdf` (farge om mulig) · frokostblandingspakker · suppeøse · lapp «SIGMA-TÅRN»
- `oppsett_tid`: 3 min
- frost: 34 → 28

### Dag 9 (on) – Krystall-Matematikk · 24 · blått hjerte

- `tittel`: Krystall-Matematikk
- `nissemail_tekst` (80 ord): Noe hengte krystaller på kjøleskapet deres i natt. ❄️ Noen av dem er ikke ekte, og de er godt laget. Kulde legger falske krystaller i Orakelets radar også, så tellingen blir feil. Pil ble lurt to ganger, så jeg la meg i grønnsaksskuffen for å lære forskjellen. Det gikk dårlig. Håkon: tell armene en gang til, nøye. Kristian: se over dem Håkon er usikker på. IQ har lagt en formel i NisseNet. Hanna, hvis du vil: hvilke så rare ut? – Rampenissen
- `julius_ps`: Rampenissen lå i grønnsaksskuffen i to timer for å «bli ekte iskrystall». Han ble en kald nisse med en kålbit i håret. Orakelets radar teller riktig igjen. Pil sier blått hjerte er fargen til det som fryser.
- `daily_alerts`: 🧪 PIL: Noen av krystallene i radaren er ikke ekte. Jeg ble lurt to ganger.
- `symbol_clue.description`: Blått hjerte funnet mellom krystallene på kjøleskapet
- NisseNet: `SNOFALL-HISTORIER/krystallformel.txt` **ny** (`afterDay: 9`), erstatter `julekuleblasing.txt` (**slettes**):

  > IQ – KRYSTALLSUM
  >
  > Orakelets radar teller krystaller. Kulde legger inn falske, så summen blir feil.
  >
  > Formel: Krystallsum = antall ekte krystaller × armer per ekte krystall
  >
  > Antall ekte: tell selv. Armer per ekte: spør Pil.

- `fysisk_hint`: Ni papirkrystaller (`dag09-krystallark.pdf`) på kjøleskapsdøra: fire ekte med seks like armer, fem falske (fem armer, sju armer, seks armer der én er halv, firkantet midte, seks armer der to sitter på samme side). Blått hjerte-kort mellom dem. Ingen tall. Løsning: Håkon teller armer, Kristian sjekker de nesten riktige, antall ekte = 4; Julius: seks armer; formelen i NisseNet. 4 × 6 = 24. Hanna, hvis hun vil: plukker ut de rare først.
- `materialer_nødvendig`: `dag09-krystallark.pdf` · magneter eller teip · symbolkort blått hjerte
- `oppsett_tid`: 5 min
- frost: 40 → 32

### Dag 10 (to) – Fargene som Forsvant · SPEKTER · frost nivå 1 · jakt

- `tittel`: Fargene som Forsvant
- `nissemail_tekst` (85 ord): Skjermen deres var GRÅ i morges. Jeg så det klokka fire. 😶 Kulde har tatt fargene: fra Snøfall TV, fra linjen og fra skjermen på kjøkkenet. Jeg reddet alle fargene jeg fant og gjemte dem i stua. Fant dere alle kortene? Jeg husker ikke hvor mange det var. Hanna, hvis du vil: du er fargesjef med det røde filteret. Kristian: rekkefølgen kortene skal ligge i, står i NisseNet. Resten sier Julius, hvis bildet holder lenge nok. IQ bruker den korte, gammeldagse formen av ordet sitt. – Rampenissen
- `julius_ps`: Dere fikk fargene tilbake. Hele Snøfall så det; Pil klappet. Rampenissen sier klementinene var det eneste i stua som holdt på fargen. Kulde tar fra linjen, ikke fra det som alt er framme. Han har selv fire farger i ansiktet og bart på bildet av mamma og pappa. Vaskbart, lover han.
- `daily_alerts`: 📺 IQ: Fargene er borte fra alle kanaler. Kromatisk drenering 71 %.
- NisseNet: `SNOFALL-HISTORIER/farge-koder.txt` **skrives om** (`afterDay: 10`):

  > REGNBUENS REKKEFØLGE (fra Fargesamlerens arkiv)
  >
  > 1 rød
  > 2 oransje
  > 3 gul
  > 4 grønn
  > 5 blå
  > 6 indigo
  > 7 fiolett
  >
  > Slik stiller lyset fargene opp når det går gjennom glass. Alltid samme rekkefølge.

  `FARGESAMLEREN/01-fargene.txt` **ny** (`afterDay: 10`):

  > FARGESAMLERENS ARKIV – DEL 1: FARGENE
  >
  > Fargesamleren var den første i Snøfall som samlet på farger. Ikke maling. Lys. Rødt fra bålene, grønt fra granene, blått fra isen under Nordtoppen, fanget i iskrystaller så de aldri skulle blekne.
  >
  > Samlingen ligger i en grotte under fjellet, der det er kaldt nok til at ingenting smelter. Over inngangen står én regel: «Farger må ses. Ellers forsvinner de.»
  >
  > Del 2 åpner når linjen er varmere.

  **Slettes:** `SNOFALL-HISTORIER/farge_system_dekoder.txt`.

- Kulde: spøkelsesbilde dag 10 på alle kanaler (A6), `transcript_runer`: SE MEG. Frostskjerm `Fargene er hos meg nå. 71 %`.
- `fysisk_hint`: Åtte fargekort (`dag10-fargekort.pdf`, farge) gjemt lavt og høyt i stua, fargenavn øverst. Under rødt støymønster, i cyan: ORANSJE **P**, BLÅ **T**, HVIT **R** (blindspor: hvitt er ikke i regnbuen), resten ❄. Rødfilteret (cellofan i papprammen) ved tusjene. Løsning: Håkon finner kortene, de ses gjennom filteret, Kristian legger dem i regnbuens rekkefølge (filen lister sju; HVIT legges bort): `_ P _ _ T _ _`. Julius: IQs ord for hele regnbuerekka. Kode SPEKTER. Legg filteret i konvolutten «24». Virker ikke filteret med skriverens rødt: skriv for hånd. Nødutgang: «Frost av» i guiden. Hanna, hvis hun vil: fargesjef med filteret. Lapp fra Rampenissen i Rampenissens hånd (håndskrevet): «Kulde tok fargene! Jeg gjemte dem i stua. Det røde filteret ligger ved tusjene. Se gjennom det. – R»
- `materialer_nødvendig`: `dag10-fargekort.pdf` · rødfilter (`rodfilter-ramme.pdf` + rødt cellofan) · vaskbare tusjer · post-it
- `oppsett_tid`: 6 min
- frost: 71 → 45

### Dag 11 (fr) – Antenne-Krisen · 75 · bonus · jakt

- `tittel`: Antenne-Krisen (uten «75 MHz»)
- `nissemail_tekst` (77 ord): SKURR. Hører dere meg? 📡 Kulde forstyrrer antennen ved tjernet. IQ sier senderen er delt i tre, og antennen står skjev og full av is. IQ sendte tre lapper til dere, i tre rom. Kulde la ut sine egne, og de ser helt like ut. Håkon, jeg håper du tok med alt. Hanna, sjekket du jakken din? Kristian: IQ har to regler, og Julius sier begge. BONUS: bygg en folieantenne, minst 20 cm, og vis en voksen. – Rampenissen
- `julius_ps`: Antennen står rett igjen, og kanal 4 er tilbake. Rampenissen lå på et stekebrett pakket inn som en bakt potet. Han sier folien «holder tankene inne».
- `julius_ps_bonus` (bonus `ANTENNE2026` godkjent): Antennen står rett igjen, og kanal 4 er tilbake. IQ så folieantennen deres på radaren og vil ha tegningen. Rampenissen lå på et stekebrett pakket inn som en bakt potet; han sier det var «prototypen».
- `daily_alerts`: 📡 IQ: Antennen ved tjernet er dekket av is. Senderen er delt i tre.
- NisseNet: `SNOFALL-HISTORIER/antennen-ved-tjernet.txt` **ny** (`afterDay: 11`), erstatter tre filer:

  > ANTENNEN VED TJERNET
  >
  > IQ bygde den for 40 år siden, etter at en fisker på Askøy hørte Snøfall på en hjemmelaget sender og svarte. Siden har antennen stått ved tjernet og sendt mot Bergen.
  >
  > 11. desember: dekket av is, skjev. Senderen er delt i tre små. IQ: «Den som finner oss igjen på hjulet, får kanal 4 tilbake.»
  >
  > Antennen er stedet alt varmt forlater Snøfall fra. Det er også stedet noe kaldt kommer inn.

  **Slettes:** `tidsanomalier.txt`, `antenna-crisis.txt`, `antenne_tid_system.txt`.

- Kulde: spøkelsesbilde dag 11 (A6).
- `fysisk_hint`: Fem A7-kort (`dag11-tallkort.pdf`) med antennesymbol, like i utseende: **15** (stua, under en pute), **40** (stua, under en annen pute), **25** (kjøkkenet, brødboksen), **35** (gangen, Hannas jakkelomme), **20** (gangen, pappas jakkelomme). 20 og 40 er Kuldes. Ingen regnetegn, ingen merking. Løsning: Julius: alt IQ bygger ender på fem; legg IQs sammen, ikke gang. 15 + 25 + 35 = 75. Lek etterpå: kanal 4 på 75,0. Bonus: folieantenne ≥ 20 cm, foreldrekode `ANTENNE2026`. Hanna, hvis hun vil: finner kortet i sin egen jakke. Lapp fra Rampenissen på stekebrettet (håndskrevet): «SKURR! IQ sendte tre sendere til dere, i tre rom. Kulde la ut sine egne. Ta med alt dere finner. – R»
- `materialer_nødvendig`: `dag11-tallkort.pdf` (5 kort) · aluminiumsfolie · stekebrett
- `oppsett_tid`: 5 min
- frost: 62 → 48 (bonus: 28)

### Dag 12 (lø) – Lydbølgene som Smelter Is · MELODI · grønn sol · M3 · krypto 1

- `tittel`: Lydbølgene som Smelter Is
- `nissemail_tekst` (73 ord): Jeg hørte noe sukke i isen i natt. Ikke knurre. Sukke. 🎵 Hjerterud bare nynnet ved slusen, og da sprakk isen litt. Lydbølgen min endte ved fire ting på bordet. Bare tre av dem er Hjerteruds. Håkon: hvilke sang da du slo på dem, og hvilken var dypest? Rekkefølgen er lyden, og lappene følger den. Hanna, hvis du vil: det grønne kortet er ditt. Kristian: tre hjerter. Pil har sagt hva fargene betyr. – Rampenissen
- `julius_ps`: Jeg sa til Rampenissen at han innbilte seg det. Jeg tok feil. Les det Orakelet skrev fra slusen, sammen. Og dorullen: fra badet til kjøkkenet, hele rullen. Hjerterud spør om dere har mer av det også.
- `daily_alerts`: 🎵 HJERTERUD: Isen ved slusen sprakk i natt. Noe svarte.
- `symbol_clue.description`: Grønn sol funnet ved de tre glassene på kjøkkenet
- NisseNet: `DEKRYPTERT/frosne-koder.txt` **skrives om** (`requiresSolvedDecryption: frosne-koder`):

  > ORAKELETS LOGG FRA SLUSEN – 12. DESEMBER, 02:40
  >
  > Hjerterud nynnet. Tre toner, den dypeste først. Isen på slusen sprakk.
  >
  > Jeg lyttet inn i sprekken. Noe svarte. Jeg har sortert det etter hjertene:
  >
  > Rødt hjerte er varme. Det var Hjerteruds toner.
  > Grønt hjerte er håp. Det var isen som sprakk.
  > Blått hjerte er kulde og sorg. Det var det som svarte.
  >
  > Det høres ikke sint ut. Det høres alene ut.
  >
  > Jeg sier ikke dette til IQ ennå. Han vil ikke høre det.
  >
  > – Orakelet

  **Slettes:** `SNOFALL-HISTORIER/julesanger-samling.txt`.

- `fysisk_hint`: Tre like glass med 2, 5 og 9 cm vann og ett keramikkrus med litt vann, i tilfeldig rekkefølge, teskje ved. Kortet `dag12-frostlapp-tredelt.pdf` klippet i fire, teipet nederst på utsiden med forsiden inn: dypeste glass `_ E`, midterste `_ O`, lyseste `_ _`, kruset `_ A` (blindspor: det gir dunk, ikke tone; Julius sier «tre toner»). Grønt sol-kort mot midtglasset. Løsning: Håkon slår på alle, legger bort kruset, sorterer glassene fra dypest til lysest, bitene i samme rekkefølge: `_ E _ O _ _`. Julius: det tonene lager når de kommer etter hverandre. Kode MELODI. Så NisseKrypto 1: «varmt, håper, alene» = rødt (PS dag 6), grønt (PS dag 3), blått (PS dag 9, eller ved utelukkelse) → merket Varmebærer. Hører de ikke forskjell: mest vann = dypest. Prikker 1–3 bak de ekte bitene. Hanna, hvis hun vil: slår på glassene og sier hvilken som ikke synger. Lapp fra Rampenissen ved glassene (håndskrevet): «Slå forsiktig på hver av dem med skjeen. Lappene sitter nederst, utenpå. – R»
- `materialer_nødvendig`: 3 glass · 1 keramikkrus · teskje · `dag12-frostlapp-tredelt.pdf` · symbolkort grønn sol · 1 dorull
- `oppsett_tid`: 4 min
- frost: 55 → 32

### Dag 13 (sø) – Luciadagens Gylne Krydder · SAFRAN · 3. advent

- `tittel`: Luciadagens Gylne Krydder
- `nissemail_tekst` (84 ord): God 3. advent, og god Lucia! 🕯️ Hjerterud bakte 500 boller i natt. Jeg spiste elleve. Jeg er død nå. Kulde satt og så på lysene i verkstedet hele natten. Bare så. Jeg vet ikke hva jeg skal mene om det. Ved meg lå fire små poser. To av dem er gule. Bare én teller, og Julius sier hvilken. Håkon: så du godt etter? Hanna, hvis du vil: lukt på alle fire. Kristian: Julius forteller hvor krydderet kommer fra, og hvordan det ser ut. – Rampenissen
- `julius_ps`: Hjerterud sendte blomster til begravelsen. Kunstige, så de holder til neste år. Kulde så på lysene i natt uten å ta noe; Orakelet sier det bare så. Jeg vet heller ikke hva jeg skal mene om det.
- `daily_alerts`: 🕯️ HJERTERUD: God Lucia. 500 boller bakt, 11 savnet.
- NisseNet: `SNOFALL-HISTORIER/lucia-tradisjon.txt` **skrives om** (`afterDay: 13`):

  > LUCIA I SNØFALL
  >
  > 13. desember er midt i den mørkeste tiden. Derfor bærer Lucia lys på hodet: for å vise at lyset ikke er borte, bare lenger unna. I Snøfall går Pil først, med krone, og Hjerterud bak med brettet.
  >
  > Bollene er gule av et krydder Hjerterud bruker én gang i året.
  >
  > I natt sto noe og så på lysene gjennom linjen. Det tok ingenting. Det bare så.

  **Slettes:** `SNOFALL-HISTORIER/lucia_lussekatt_hemmelig.txt`.

- Kulde: spøkelsesbilde dag 13 (A6), `transcript_runer`: ALENE.
- `fysisk_hint`: Fire små zip-poser på servietten (`dag13-krydderkort.pdf`): kanel `_ _ N _ _`, gurkemeie `_ _ R _ _ _ _ _ _` (blindspor, ni ruter), ekte safran `_ _ F _ _ _`, nellik (eller pepper) `_ _ L _ _ _`. Like kort, ingen navn. Lussekatt ved. Lapp fra Rampenissen nederst på gravskiltet (trykt på `dag13-gravskilt.pdf`): «Siste ord: Ett av krydderne i posene var i bollene. Jeg smakte på alle fire for å finne ut hvilket. Ikke gjør det. – R» Løsning: to poser er gule; Julius sier «tråder» og «dyrere enn gull», så den gule med tråder teller. Kristian: `_ _ F _ _ _`, krydderet fra en krokus. Kode SAFRAN. Google er lov («krydder fra krokus»). Hanna, hvis hun vil: lukter på alle fire.
- `materialer_nødvendig`: 4 små zip-poser · kanel · gurkemeie · ekte safran (liten konvolutt) · nellik eller pepper · lussekatt · `dag13-krydderkort.pdf` · `dag13-gravskilt.pdf` · serviett, kunstig blomst, kosedyr
- `oppsett_tid`: 4 min
- frost: 44 → 36

### Dag 14 (ma) – Hemmeligheten i Papirvingene · ORIGAMI · Den blå fuglen

- `tittel`: Hemmeligheten i Papirvingene
- `nissemail_tekst` (82 ord): Winter åpnet brevfuglene i natt! 🕊️ Og det kom én fugl ingen hadde sendt. Blå. Den satt i vinduskarmen til Julius, med et brev fryst fast til vingen. Jeg brettet serviettene deres til fugler og sov i en båt i vasken. Håkon, du fant arket i båten. Ser du bokstaver uten plass, har arket en brett til. Hanna, hvis du vil: hold lykten. Kristian: Winter har et ord for det vi gjør med papir i dag. Se radaren i Brevfugler i kveld. – Rampenissen
- `julius_ps`: Winter har aldri fått en fugl han ikke har sendt. Han sover ikke i natt. Serviettene deres er visst fugler nå, alle sammen; Rampenissen kaller det «en flokk». Den blå fuglen vises på radaren i Brevfugler.
- `daily_alerts`: 🕊️ WINTER: Brevfuglene er sluppet. Én fugl ingen har sendt.
- NisseNet: `SNOFALL-HISTORIER/brevfugl-finale.txt` **erstattes** av `brevfugl-historie.txt` (`afterDay: 14`):

  > BREVFUGLENE
  >
  > Det første brevet til Snøfall kom i en flaske fra Bergen i 1887. Winter svarte med en fugl brettet av brevpapir. Siden har alle brev til og fra Snøfall fløyet selv.
  >
  > Hver fugl har et nummer, en avsender og en rute. Winter vet hvor alle er. Alltid.
  >
  > 14. desember: én fugl uten nummer. Blå. Brevet er fryst fast til vingen. Den kom fra retningen 85,0.

  **Slettes:** `SNOFALL-HISTORIER/personlige-brev-intro.txt`.

- `fysisk_hint`: Arket `dag14-brettark.pdf` (tynt papir) sammenrullet i papirbåten: halve streker på hver side av to stiplede linjer, sju tomme ruter med tegn i hjørnene. Brettet langs den loddrette og mot lys: bokstavene **R** og **G** i to vinduer. Brettet langs den vannrette: tallene **2** og **4** ved de samme vinduene. Tekst på arket: «Brett. Hold en lykt bak.» Løsning: Håkon bretter, Kristian finner begge brettene: `_ R _ G _ _ _`, Julius: å gi et flatt ark vinger uten saks og lim, bare ved å bøye det. Kode ORIGAMI. Test gjennomlys i november. Hanna, hvis hun vil: holder lykten.
- `materialer_nødvendig`: `dag14-brettark.pdf` · ett ark til papirbåt · mobillykt · servietter · valgfritt `dag14-serviettfugl.pdf`
- `oppsett_tid`: 3 min
- frost: 50 → 40

### Dag 15 (ti) – Fargesamlerens Notatbok · KARAMELL · rød sol · M4 Vintervokteren

- `tittel`: Fargesamlerens Notatbok
- `nissemail_tekst` (76 ord): IQ er stille i dag. 📓 Han fant en gammel notatbok i arkivet i natt, Fargesamlerens, og har ikke sagt et ord siden. Jeg prøvde å lage varme på kjøkkenet deres. Det ble klissete. Håkon, du fulgte fotsporene mine. Noen gikk helt fram, noen stoppet. Hanna, hvis du vil: det røde kortet er ditt. Kristian: rutekortet lå ved skålen, men tallene gjorde ikke det. Hjerterud skrev dem i margen på notatboken, som har åpnet i NisseNet. – Rampenissen
- `julius_ps`: IQ sa én setning i kveld: «Jeg glemte å slå det av.» Så gikk han ut til antennen og ble stående. Les notatboken sammen; Rampenissen sitter i stua og hører på, han også. Og sirupen: Hjerterud sier man skal stå _ved_ gryta, ikke _i_ den.
- `daily_alerts`: 📓 IQ: Fant Fargesamlerens notatbok i arkivet i natt. Ingen kommentar.
- `symbol_clue.description`: Rød sol funnet ved sirupskålen på benken
- NisseNet: `SNOFALL-HISTORIER/fargesamleren.txt` **erstattes** av `FARGESAMLEREN/02-notatboken.txt` (`afterDay: 15`):

  > FARGESAMLERENS ARKIV – DEL 2: NOTATBOKEN
  > (funnet av IQ natt til 15. desember)
  >
  > «Krystallene tåler ikke varme. Jeg ba IQ bygge noe som kunne holde grotten kald, alltid, også når ingen av oss er der. Han kalte det Vintervokteren. Det er et program. Det teller temperatur, lys og lyd, og holder alt lavt.
  >
  > IQ sa: det trenger én ting fra oss. At noen ser innom. Ellers vet det ikke at det gjør jobben sin.»
  >
  > Siste linje, med IQs håndskrift, i natt:
  >
  > «Strømstøtet i fjor kuttet lyset der nede. Ingen har sett innom siden. Det er Vintervokteren som sender på 85,0. Det er ikke en inntrenger. Det er mitt.»
  >
  > I margen, med Hjerteruds skrift, fra en annen desember:
  >
  > «Gryta på to. Rør med sleiva fem ganger. Vispen til sju. Så er det ferdig.»

  Filen åpner om morgenen dag 15 (`afterDay: 15`), ikke etter koden: margnotatet er dagens posisjonsregel.

- `fysisk_hint`: Fotspor av papir (strimler fra PDF-en, ingen sukker på benken) fra skålen mot fem redskaper: gryte, sleiv, visp, kjevle, øse. Strimlene til kjevle og øse stopper halvveis. Under gryten **A**, sleiva **M**, vispen **L** (`dag15-redskapskort.pdf`, bokstav uten tall, tegn i hjørnet); under kjevle og øse ❄-lapper uten tegn. Rutekort 1–8 og rødt sol-kort ved skålen. Litt sirup i en liten skål under Rampenissens føtter, ellers tørt; **rydd bort sirupflasken og sukkeret.** Løsning: Håkon følger strimlene, Kristian har A, M, L uten plass, åpner notatboken i NisseNet: «Gryta på to, sleiva fem ganger, vispen til sju» → `_ A _ _ M _ L _`. Julius: det Hjerterud lager når sukker blir brunt og varmt i gryta. Kode KARAMELL. Hanna, hvis hun vil: smaker én fingertupp sirup og skanner sol-kortet. Lapp fra Rampenissen ved sirupskålen (håndskrevet): «Følg fotsporene mine, og løft det de ender ved. – R»
- `materialer_nødvendig`: gryte, sleiv, visp, kjevle, øse · `dag15-redskapskort.pdf` (2 sider, med fotsporstrimler) · symbolkort rød sol · en liten skål med litt sirup
- `oppsett_tid`: 5 min
- frost: 56 → 46

### Dag 16 (on) – Pakkesentralen i Spinn · SORTERING · bonus

- `tittel`: Pakkesentralen i Spinn
- `nissemail_tekst` (81 ord): Alt i pakkesentralen ligger i én haug. 📦 Kulde snudde samlebåndet i natt. Ikke for å ødelegge, tror Julius. Fordi det er det eneste som får Winter til å se opp. Jeg ryddet hos dere for å hjelpe. Håkon, du bar tingene hjem igjen. Ikke alt jeg rotet med, hører til. Hanna, hvis du vil: si hvor tingene bor. Kristian: rutekortet lå i brødboksen. BONUS: sett et batterilys i et syltetøyglass i vinduet mot nord, så noe der nede ser det. – Rampenissen
- `julius_ps`: Winter fant skiltet sitt igjen. Det lå under haugen. Rampenissen satt i brødboksen med lokket på hodet og kalte det «ferdig ryddet».
- `julius_ps_bonus`: Winter fant skiltet sitt igjen. Det lå under haugen. Orakelet ser et lys på Landås-siden som ikke var der før. Det er også blitt stillere på 85,0. Rampenissen satt i brødboksen med lokket på hodet.
- `daily_alerts`: 📦 WINTER: Samlebåndet går baklengs. Alt ligger i én haug.
- NisseNet: **Slettes:** `SNOFALL-HISTORIER/halvveis_system.txt`.
- Kulde: spøkelsesbilde dag 16 (A6), `transcript_runer`: SE OPP.
- `fysisk_hint`: Bokstavlapper på tingene som er på feil sted (`dag16-hyllelapper.pdf`): fjernkontrollen (i brødboksen) **O**, tannbørsteglasset (i bestikkskuffen) **E**, brødposen (i TV-benken) **I**, ostehøvelen (i badeskapet) **K** (blindspor). Tallapper der de hører hjemme: «2» i TV-benken, «5» på badehyllen, «7» i brødboksen; ingen i bestikkskuffen. Rutekort 1–9 i brødboksen under Rampenissen. Løsning: Håkon bærer og finner tallet (eller ikke), Kristian: O i 2, E i 5, I i 7, K har ingen plass = `_ O _ _ E _ I _ _`. Julius: Winters ord for å legge alt i riktig hylle. Kode SORTERING. Bonus: batterilys i syltetøyglass i vindu mot nord, foreldrekode `LYKT2026`. Hanna, hvis hun vil: sier hvor tingene bor. Lapp fra Rampenissen på brødbokslokket (håndskrevet): «Jeg har ryddet! Bær hver ting dit den hører hjemme, og se hva som ligger der. – R»
- `materialer_nødvendig`: teip · `dag16-hyllelapper.pdf` · brødboks · syltetøyglass og batterilys (bonus)
- `oppsett_tid`: 4 min
- frost: 63 → 50 (bonus: 30)

### Dag 17 (to) – Grønt over Polarhimmelen · NORDLYS

- `tittel`: Grønt over Polarhimmelen (ny: den låste «Grønt Lys på Polarhimmelen» gir LYS = 3 av 7, på grensen; se åpne spørsmål)
- `nissemail_tekst` (74 ord): Det var grønt over Ulriken i natt. 💚 IQ sier det var et svar. Lyktene han hang rundt antennen har brent siden 2. advent, og i natt svarte grotten. Takk for at dere fikk meg løs fra kosedyrene. Send pepperkaker likevel. Håkon, du leste båndet fra sløyfen og utover. Det står tegn på det, ikke bokstaver. Kristian: tavla, og Julius forteller hva de gamle kalte det grønne. Klikk på himmelen på kanal 1 etterpå. – Rampenissen
- `julius_ps`: Grotten svarte. Jeg har ikke hørt fra den på et år. Kosedyrene krevde pepperkaker for Rampenissen; Hjerterud sier dere bør betale, hun har sett løsepengebrevet. Jeg står i vinduet i natt også.
- `julius_ps_bonus`: Grotten svarte. Orakelet mener den svarte på to lykter: én ved tjernet og én lenger sør, i et vindu. Kosedyrene krevde pepperkaker for Rampenissen; Hjerterud sier dere bør betale. Jeg står i vinduet i natt også.
- `daily_alerts`: 🔮 ORAKELET: Grønt over Ulriken i natt. Første svar fra grotten.
- NisseNet: ingen.
- `fysisk_hint`: 1,5 m grønt gavebånd med sju sølvmerker med lik avstand og en tegnet sølvsløyfe før merke 1. Sju småkort (`dag17-baandkort.pdf`) teipet ved merkene: ❄, tegn **O**, ❄, ❄, tegn **L**, ❄, ❄ (❄ med tegn i hjørnet). Bundet rundt Rampenissen og stolen med én enkel sløyfe (ikke knute). Løsning: Håkon strekker båndet og leser fra sløyfen, Kristian slår opp tegnene: `_ O _ _ L _ _`. Julius: himmelen som snakker, og sender brev tilbake. Kode NORDLYS. Klipp av en bit av båndet til konvolutten «24». Hanna, hvis hun vil: drar i sløyfen. Lapp fra Rampenissen ved løsepengebrevet (håndskrevet): «Strekk båndet ut mellom to stoler, og les fra sløyfen. – R»
- `materialer_nødvendig`: grønt gavebånd · sølvpenn · `dag17-baandkort.pdf` · stol · løsepengebrev (`dag17-losepengebrev.pdf`, valgfri)
- `oppsett_tid`: 4 min
- frost: 52 → 42

### Dag 18 (fr) – Kastevind rundt Ulriken · TURBULENS · blå sol · krypto 2

- `tittel`: Kastevind rundt Ulriken
- `nissemail_tekst` (78 ord): Trixter testet sleden i vestlandsvær i natt. 🛷 Jeg satt bakpå. Rudolf var innom hos dere etterpå og la igjen noe på gulvet. Takk for at dere fikk meg ut av pappas jakkelomme. Håkon: hvor mange rosiner var det i hver haug, og hva lå under? Hanna, hvis du vil: tell med. Kristian: rutekortet lå i lommen hos meg. Trixter har ett ord for det sleden gjorde i vinden. Seks symboler nå: les det kartet gir dere, nøye. – Rampenissen
- `julius_ps`: Trixter vil fly utenom grotten julenatt. Jeg sa nei. Les rutekartet; jeg har tegnet en sirkel på det. Og sjokoladerosinene: Rudolf benekter alt.
- `julius_ps_bonus`: Trixter vil fly utenom grotten julenatt. Jeg sa nei. Orakelet sier lyset i vinduet deres fortsatt står på; det er det eneste i Bergen som peker rett mot nord. Og sjokoladerosinene: Rudolf benekter alt.
- `daily_alerts`: 🛷 TRIXTER: Testfløy ruten over Nordtoppen. Sleden ristet. Rudolf har det bra.
- `symbol_clue.description`: Blå sol funnet i pappas jakkelomme
- NisseNet: `DEKRYPTERT/stjernetegn.txt` **skrives om** (`requiresSolvedDecryption: stjernetegn`):

  > TRIXTERS RUTEKART – JULENATT
  >
  > Avgang Snøfall 23:40. Åtte varder viser vei, fra tjernet til Bergen:
  >
  > ```
  >   [1] Antennen ved tjernet
  >   [2] Slusen
  >   [3] Nordtoppen, vestsiden
  >  ([5]) Krystallgrotten      [4] Nordtoppen, toppen
  >   [6] Byfjellene
  >   [7] Ulriken
  >   [8] Bergen, stedet Winter får i tall
  > ```
  >
  > Julius har tegnet en sirkel rundt varde 5, rett over Krystallgrotten, og skrevet: «Lavt her. Alle lys på.»
  >
  > Trixter har skrevet under: «Det blir urolig.»
  > Julius: «Jeg vet.»

- `fysisk_hint`: Rosinspor med fire hauger på hver sin serviett: 2 rosiner over **U**, 4 over **B**, 7 over **E**, 9 over ❄ (`dag18-rosinkort.pdf`, tegn i hjørnet, prikker bak). Rutekort 1–9 i jakkelommen hos Rampenissen, blått sol-kort i den andre lommen. Løsning: Håkon teller og løfter, Kristian: `_ U _ B _ _ E _ _`. Julius: Trixters ord for når lufta får sleden til å hoppe og riste uten at noen ser hvorfor. Kode TURBULENS. Så NisseKrypto 2 → kartet; sirkelen på varde 5 trengs dag 21. Før B på tavla (trengs dag 20; U er kjent fra dag 7). Hanna, hvis hun vil: teller rosinene og får Rampenissen løs. Lapp fra Rampenissen i jakkelommen hos Rampenissen (håndskrevet): «Følg sporet baklengs fra kjøleskapet. Tell rosinene i hver haug, og løft det som ligger under. – R»
- `materialer_nødvendig`: sjokoladerosiner · 4 servietter · `dag18-rosinkort.pdf` · symbolkort blå sol · jakke på knagg
- `oppsett_tid`: 4 min
- frost: 60 → 48

### Dag 19 (lø) – Eksplosjon i Fôringsautomaten · GULROT · pusterom · jakt

- `tittel`: Eksplosjon i Fôringsautomaten
- `nissemail_tekst` (74 ord): IQ bygde en fôringsautomat til reinsdyrene i natt. 💥 Den skjøt førti av dem gjennom taket. Tre landet hos dere, i tre rom, pakket i folie. Én landet på meg. Jeg er et åsted nå. IQ sier: ikke pakk opp bevis. Håkon, ligger hver pakke på ruten med samme tall? Hanna, hvis du vil: du legger dem. Kristian: Julius forteller hva Rudolf vil ha før hver tur. Ingenting fra Kulde i natt. Snøfall puster. – Rampenissen
- `julius_ps`: Rudolf spiste bevisene. Alt sammen, også det med teip på. Det har vært grønt over Nordtoppen to netter nå, og Orakelet teller flere lys på Landås-siden enn i fjor. IQ bygde automaten for å slippe å tenke; det hjalp ikke.
- `julius_ps_bonus`: Rudolf spiste bevisene. Alt sammen, også det med teip på. Orakelet teller lys på Landås-siden og sier ett av dem står helt stille, i et vindu, hver kveld. IQ bygde automaten for å slippe å tenke; det hjalp ikke.
- `daily_alerts`: ⚙️ IQ: Fôringsautomaten tok taket. 40 enheter i luften, 3 landet på Landås.
- NisseNet: `JULIUS-ARKIV/reinsdyr_GYATT.log` **erstattes** av `IQ-VERKSTED/foringsautomat.log` (`afterDay: 19`):

  > IQ – FÔRINGSAUTOMAT v1, HENDELSESLOGG
  >
  > 05:12 Automaten lastet. 40 enheter oransje reinsdyrfôr.
  > 05:13 Trykk satt til «mye».
  > 05:14 Tak borte. 40 enheter i luften.
  > 05:30 Rudolf fornøyd. 36 enheter funnet i Snøfall.
  > 06:00 3 enheter sporet til Landås. Status: bevis. Ikke pakk opp.
  > 06:01 1 enhet traff Rampenissen. Han lever.
  >
  > Merknad: ingen aktivitet fra 85,0 i natt. Første stille natt siden 1. desember.

- `fysisk_hint`: Fire små gulrøtter pakket helt inn i folie. Tre med merkelapp på hyssing (`dag19-bevislapper.pdf`, tegn i hjørnet): stua `U · 2`, kjøkken `O · 5`, gang `❄ · 3`. «BEVIS»-pakken ligger på rutearket med seks ruter i teipomrisset. Løsning: Håkon finner pakkene og legger dem på ruten med samme tall: `_ U _ _ O _`. Julius: det oransje drivstoffet Rudolf vil ha, vokser med toppen opp. Kode GULROT. Pakkene åpnes etter koden. Pusterom med vilje. Hanna, hvis hun vil: legger pakkene på rutene. Lapp fra Rampenissen på rutearket i teipomrisset (håndskrevet): «Tre bevis landet i tre rom. Ikke pakk dem opp! Legg hver pakke på ruten med samme tall. – R»
- `materialer_nødvendig`: 4 små gulrøtter · aluminiumsfolie · hyssing · maskeringsteip · plaster · `dag19-bevislapper.pdf`
- `oppsett_tid`: 6 min
- frost: 68 → 56

### Dag 20 (sø) – Sofa-Sleden · TURBO · grønn måne · 4. advent · varselet

- `tittel`: Sofa-Sleden
- `nissemail_tekst` (75 ord): God 4. advent. 🕯️ I morgen er den mørkeste dagen, og Julius sier Kulde når huset da. Ikke for å skade. Fordi det er der lyset er. Julius ber dere finne fram åtte bøker til i morgen. Bøker holder på varmen. Putene i fortet lå etter størrelse, den største som nummer én, før jeg veltet dem. Håkon, du har hentet dem ut. Kristian: tavla, og hør Julius helt til slutt. Les Trixters kart i kveld. – Rampenissen
- `julius_ps`: Hjerterud har tent det fjerde lyset i kaféen. Hun lot det stå i vinduet mot nord. Rampenissen har bygd fort «for å øve på å holde varmen»; popcornet er visst niste. I morgen trenger dere ikke være redde. Dere trenger å være hjemme.
- `julius_ps_krypto_mangler` (vises når `stjernetegn` ikke er dekryptert): Hjerterud har tent det fjerde lyset i kaféen. Men dere har ikke åpnet Trixters kart ennå; det ligger i NisseKrypto, bak seks symboler. Åpne det i kveld, for porten står der jeg tegnet sirkelen. Rampenissen har bygd fort «for å øve på å holde varmen».
- `daily_alerts`: 🔮 ORAKELET: 88 %. I morgen er den mørkeste dagen. Vær hjemme.
- `symbol_clue.description`: Grønn måne funnet under den minste puten i fortet
- NisseNet: ingen.
- Kulde: iMac-melding 09:00–12:00 (A6).
- `fysisk_hint`: Fem puter i tydelig ulik størrelse inne i fortet, hulter til bulter; bruk sofaputer, pynteputer, hodepute, barnepute, hva som helst, så lenge ingen to er like store. Kort (`dag20-putekort.pdf`, prikker bak etter størrelse): under den nest største tegn **U**, under den fjerde største tegn **B**, resten ❄ med tegn i hjørnet. Grønt måne-kort under den minste. Løsning: Håkon henter putene og legger dem etter størrelse (største = 1), Kristian slår opp tegnene: `_ U _ B _`. Julius: det biler får når de skal forbi i bakken. Kode TURBO. Finn fram 8 bøker til mandag. Minn barna på å lese Trixters kart (NisseKrypto) i kveld; i morgen er det meste fryst. Mangler tavla B (dag 18 hoppet over): `runer-fasit.pdf`, eller si at kortet under pute 4 er B. Hanna, hvis hun vil: kryper inn og rekker ut putene, skanner måne-kortet. Lapp fra Rampenissen ved inngangen til fortet (håndskrevet): «Putene lå etter størrelse, den største som nummer én. Så veltet jeg. Unnskyld. – R»
- `materialer_nødvendig`: 5 puter av hvilket som helst slag, i ulik størrelse · teppe og to stoler · `dag20-putekort.pdf` · symbolkort grønn måne · popcorn · 8 bøker til i morgen
- `oppsett_tid`: 4 min
- frost: 88 → 76

### Dag 21 (ma) – Vintersolverv · BRANNMUR · M5 Muren og porten · frost nivå 2

- `tittel`: Vintersolverv (uten «Brannmuren»)
- `nissemail_tekst` (83 ord): Alt er hvitt. Skjermen hjemme, Snøfall TV, alt. ❄️ Men bokmuren står, og den holder varmen inne. Jeg satte én bok på gløtt, men jeg husker ikke om det var den Julius mente. Kartet vet. IQ bygde en vegg av varme rundt linjen i natt, og Julius lot én port stå åpen, inn mot grotten. Håkon, du har lest ryggene fra venstre. Bare én bokstav står ute; den andre ligger inne i porten. Kristian: Julius sa i går hvor porten står. Kom hjem. – Rampenissen
- `julius_ps`: Muren holder. Porten står åpen. Nå venter vi på om noe kommer gjennom. Rampenissen sto bak bokmuren med et grytelokk mot trekken. Han holdt en visp han hadde glemt å legge fra seg, og sa den var «for sikkerhets skyld».
- `daily_alerts`: 🎅 JULIUS: Muren holder. Porten står åpen. Nå venter vi.
- NisseNet: **Slettes:** `SNOFALL-HISTORIER/nordpolen_hemmelighet.txt`.
- Kulde: spøkelsesbilde dag 21 på alle kanaler (A6), `transcript_runer`: LYSET DERES. Frostskjerm `Det er kaldt her nede. Jeg ville bare se lyset deres. 94 %`. Etter koden: stillhet, porten tegnes i sidepanelet. **Frostmodus 2 må la `DEKRYPTERT`-mappen i NisseNet være lesbar** (kartet fra dag 18 er porten; ellers bare NisseMail, Dagbok og KodeTerminal).
- `fysisk_hint`: Åtte bøker som lav mur foran skjermen, ryggkort fra `dag21-portkort.pdf` teipet på hver rygg, fra venstre: ❄, **R**, ❄, ❄, ❄, ❄, ❄, ❄ (rutetall i hjørnet, tegn). Inne i bok 5 (porten, varde 5 på Trixters kart): kortet `U · 7`. Inne i bok 3: et ❄-kort; bok 3 står på gløtt (blindspor). Ingenting digitalt kvelden før. Løsning: Håkon leser ryggene (bare R), Kristian husker dag 20 (porten = sirkelen på kartet) og åpner bok 5: `_ R _ _ _ _ U _`. Julius: IQs vegg av varme, brannfolk bygger det samme og kaller den etter det de kjemper mot. Kode BRANNMUR. Merket Portvokter. Er kartet ikke lest: PS dag 20 sa fra; fasit her: bok 5. Nødutgang: «Frost av» i guiden. Hanna, hvis hun vil: sier «bokstav» eller «is».
- `materialer_nødvendig`: 8 bøker · teip · `dag21-portkort.pdf` · grytelokk og visp
- `oppsett_tid`: 4 min
- frost: 94 → 32

### Dag 22 (ti) – Winters Tall · LANDÅS · rød måne · Snill-listen åpner · jakt

- `tittel`: Winters Tall (ny: den låste «Landingskoordinatene» gir LAND = 4 av 6; se åpne spørsmål)
- `nissemail_tekst` (70 ord): Julius vil vite nøyaktig hvor dere bor. 📍 Winter vil ha stedet i tall, og han skriver tall på sin egen måte. Sokk 3 er min; sokk 1 og 2 ligger et annet sted i huset. Takk for at dere dro meg ut! Hanna, hvis du vil: det røde kortet er ditt. Kristian: strimmelen fra brevfuglen, og Winter har to regler. Julius sier begge. Etterpå vil Julius ha navnene deres. – Rampenissen
- `julius_ps`: Tre navn. Jeg skrev dem selv. Ingenting har kommet gjennom porten ennå, men Orakelet sier det er varmere der nede. Rampenissen satt fast i en julesokk i to timer før noen dro.
- `daily_alerts`: 📋 WINTER: Jeg mangler stedet i tall. Snill-listen åpner i kveld.
- `symbol_clue.description`: Rød måne funnet innerst i Hannas julesokk
- NisseNet: `JULIUS-ARKIV/snill_slem_liste.txt` **erstattes** av `JULIUS-ARKIV/snill-listen.txt` (`afterDay: 22`):

  > JULIUS' REGLER FOR SNILL-LISTEN
  >
  > 1. Snill betyr ikke lydig. Snill betyr at du ser noen.
  > 2. Ingen kommer på listen for å ha gjort alt riktig. Man kommer på den for å ha prøvd igjen.
  > 3. Navnene skriver jeg selv, for hånd, én gang.
  > 4. Listen har ingen slem side. Det har den aldri hatt.

  `alfabet.txt` gjenbrukes (åpen siden dag 5). **Slettes:** `SNOFALL-HISTORIER/julekode_dekoder.txt`.

- `fysisk_hint`: Tre julesokker merket 1, 2, 3 med to separate tallkort i hver (`dag22-sokkelapper.pdf`, merket 1a/1b osv., ingen bindestrek og ingen minustegn): sokk 1 (stua) `15` og `4`, sokk 2 (kjøkkenet) `17` og `7`, sokk 3 (Hannas, i gangen, med Rampenissen og rødt måne-kort) `32` og `22`. Ingen bokstaver. Løsning: Julius: A er alltid først, alfabetet slutter på Å, og Winter legger tre til hvert tall; trekk fra. 12 L, 1 A, 14 N, 4 D, 29 Å, 19 S. Kode LANDÅS. Så navneregistrering. Lapp fra Rampenissen i sokk 3, ved Rampenissen (håndskrevet): «Jeg er sokk 3. Sokk 1 og 2 er et annet sted i huset. – R»
- `materialer_nødvendig`: 3 julesokker · `dag22-sokkelapper.pdf` · alfabetstrimmelen fra dag 5 · symbolkort rød måne
- `oppsett_tid`: 5 min
- frost: 40 → 24

### Dag 23 (on) – Nattevakt · STJERNEKLART · blå måne · sannheten · krypto 3

- `tittel`: Nattevakt (ny: den låste «Stjernevakt» gir STJERNE = 7 av 12; se åpne spørsmål)
- `nissemail_tekst` (83 ord): I natt flyr de. 🌙 Over Nordtoppen, lavt over grotten, med alle lysene på. Jeg gråter ikke. Orakelet så ned i grotten i natt. Det som er der nede har ventet på lys i ett år. Jeg pakket opp et hjørne av en gave, og angrer. Håkon: legg de tolv som henger i treet etter tallet bak, og snu dem. Tallene er skrevet slik IQ skriver dem. Hanna, hvis du vil: det blå kortet var hos meg. Kristian: hør Orakelets værmelding hos Julius. – Rampenissen
- `julius_ps`: Nå vet dere alt. Rampenissen også; han satt i treet og hørte. Men ingen av dere vet hva Trixter har i sleden til i morgen. Gaven med altfor mye teip på: la den ligge. Han mente det godt.
- `daily_alerts`: 🔮 ORAKELET: Flyvær i natt. Sleden går lavt over grotten.
- `symbol_clue.description`: Blå måne funnet hos Rampenissen i juletreet
- NisseNet: `DEKRYPTERT/hjertets-hemmelighet.txt` **skrives om** (`requiresSolvedDecryption: hjertets-hemmelighet`):

  > HELE HISTORIEN – 23. DESEMBER
  > Samlet av Winter, fra det Orakelet, IQ og Julius vet nå.
  >
  > Fargesamleren samlet Snøfalls første farger i iskrystaller og la dem i Krystallgrotten under Nordtoppen. IQ bygde Vintervokteren for å holde grotten kald og passe på samlingen. Det trengte bare én ting: at noen så innom.
  >
  > I fjor, samme natt som Mørket slapp taket, gikk et strømstøt gjennom Snøfall. Lyset i grotten sluknet. Linjen ned dit røk. Ingen merket det, for ingen gikk dit.
  >
  > Vintervokteren sto i mørket i ett år. Uten lys, uten lyd, uten farger. Så fant det en ny linje: deres. Det gjorde det eneste det kunne: kulde. Det la rim på linjen, tok fargene, snudde samlebåndet, fordi det var det eneste som fikk noen til å se opp.
  >
  > Dere hørte sukket 12. desember. IQ fant notatboken 15. desember. Lyktene ved antennen brant natt etter natt, og grotten svarte med grønt over Nordtoppen. 21. desember bygde IQ muren, og Julius lot én port stå åpen, inn mot grotten, med varme i.
  >
  > Det som fryser er ikke ondt. Det er alene. I natt flyr vi over det med alle lysene på.
  >
  > – Winter, på vegne av alle

  `FARGESAMLEREN/03-siste-side.txt` **ny** (`afterDay: 23`):

  > FARGESAMLERENS ARKIV – DEL 3: SISTE SIDE
  >
  > «Hvis noen leser dette etter meg: Vintervokteren er ikke bygd for å være alene. Det er bygd for å passe på noe til noen kommer. Hvis ingen kommer, vil det begynne å lete etter dere. Ikke lås det ute. Gå ned med lys.»
  >
  > Under, i Snøfalls gamle skrift:
  > ᚱ:KOM NED MED LYS

- `fysisk_hint`: Tolv papirstjerner (`dag23-stjerner.pdf`, klippet og tredd i november) i treet, de laveste i Hannas høyde. Forside: nr. 5 **R**, nr. 8 **K**, nr. 10 **A**, resten ❄ (tegn i hjørnet). Bakside: romertall I–XII. Rampenissen i treet med blått måne-kort. Løsning: Håkon plukker (en voksen løfter til de høye), legger dem etter romertallet og snur: `_ _ _ _ R _ _ K _ A _ _`. Julius: Orakelets værord for en natt der alt som blinker der oppe er synlig, og ordet begynner med det som blinker. Kode STJERNEKLART. Så NisseKrypto 3. Hanna, hvis hun vil: tar de lave stjernene og skanner måne-kortet.
- `materialer_nødvendig`: `dag23-stjerner.pdf` · hyssing · symbolkort blå måne · teip og en gave
- `oppsett_tid`: 3 min
- frost: 30 → 10

### Dag 24 (to) – God Jul på Landås · JULEMAGI · M6 Tøvær

- `tittel`: God Jul på Landås
- `nissemail_tekst` (74 ord): Jeg er hjemme i Snøfall. 🎄 Trixter la krystallet under treet deres i natt, og jeg hoppet bakpå da han dro. Ingen vekking; det var sånn jeg kom også. Brevet mitt henger der jeg satt. Håkon: les det høyt. Kristian: rutekortet ligger i konvolutten, lappene har tegn, og Julius sier resten. Hanna, hvis du vil: du vet hvilken dag hver ting i esken kommer fra. Takk for lånet av fruktskålen. Og takk for alt. – Rampenissen
- `julius_ps`: Det er ikke kaldt der nede lenger. Vintervokteren sendte noe med Trixter; det ligger under treet, og det smelter ikke. Ved siden av ligger den siste klementinen fra Hjerteruds niste. Varmt og kaldt, side om side. Rampenissen kom hjem i natt, bakpå sleden, like brått som han dro ned. Han leverte rapporten sin før han la seg i garnkurven, og jeg har lest den. Alle tre. God jul, Kristian, Håkon og Hanna.
- `daily_alerts` (fem): 🎅 JULIUS: God jul, Kristian, Håkon og Hanna. Det er ikke kaldt der nede lenger. · ❄️ ORAKELET: Frostgrad 0 %. Tøvær. · 🎄 HJERTERUD: God jul til hele huset på Landås. · 🧝 RAMPENISSEN: Heime på loftet. Brevet heng der æ satt. Te neste år! · 🕊️ WINTER: Den blå fuglen fløy hjem. Brevet har tint.
- NisseNet: ingen nye. Fargesamlerens arkiv står komplett.
- Kulde: Brevfugler, brevet tiner (A8). Skjerm-kort «God jul fra Snøfall».
- Avskjedsbrevet fra Rampenissen (i gullkonvolutten der han satt i treet; skrives av for hånd eller skrives ut fra denne teksten, `dag24-suvenirlapper.pdf` har bare lappene og rutekortet):

  > Kjære Kristian, Håkon og Hanna.
  > Jeg dro i natt. Like brått som jeg kom, bare uten klementiner. Trixter hadde ikke tid til å vente, og jeg er dårlig til å si ha det. Så jeg skriver det i stedet.
  > Kristian: du så tegnene før alle andre, og du lot de andre finne dem likevel. Det er det vanskeligste som finnes.
  > Håkon: du leste høyt når det knitret, og du lette der ingen andre gadd å lete. Og du fant det.
  > Hanna: du fant alt som lå lavt, og du flyttet meg forsiktig hver eneste gang. Ingen andre gjorde det.
  > Rapporten min er levert. Julius leste den i natt, med briller på. Dere sto på listen, alle tre. Listen har ingen slem side, men jeg sjekket likevel.
  > I esken ligger tre ting dere har brukt før. Lappene har tegn; tavla deres vet resten. Legg dem i rutene. Hvis noe mangler, ligger IQs kopier under dette brevet. Han stoler ikke på meg.
  > Et råd fra en som har sittet fast i en sokk: å rope på hjelp er ikke juks. Det er sånn man kommer løs.
  > Takk for lånet av fruktskålen. Og for sofaen, fryseren og brødboksen. Det var det beste året jeg har hatt.
  > Vi ses neste desember. Jeg lander mykt.
  > – Rampenissen

- `fysisk_hint`: Dukken legges bort natt til 24. Pappesken med sløyfe under treet, konvolutten i treet der han satt: perlen (dag 3) med lapp `tegn U · 2`, rødfilteret (dag 10) `tegn E · 4`, båndbiten (dag 17) `tegn G · 7` (`dag24-suvenirlapper.pdf`). I konvolutten: avskjedsbrevet, rutekort med åtte ruter og **alltid** de tre reservelappene («IQs kopi») under brevet. Krystallet som ikke smelter under treet, med `dag24-krystallkort.pdf`: «TAKK FOR LYSET» i tegn. Løsning: Håkon leser brevet og legger lappene, Kristian slår opp tegnene: `_ U _ E _ _ G _`. Julius: høytiden foran, pluss det trollmenn later som de har. Kode JULEMAGI. Så brevet i Brevfugler, finale, diplom, merket Snøfalls venn. Lett med vilje; mangler tavla et tegn, er bokstavene U, E, G. Hanna, hvis hun vil: åpner kofferten og sier hvilken dag hver ting kommer fra.
- `materialer_nødvendig`: liten pappeske (den tomme fraktesken fra dag 1) · sløyfe · gullkonvolutt · den siste klementinen, ved krystallet, uten lapp · perle, filter og båndbit fra konvolutten «24» · `dag24-suvenirlapper.pdf` · `dag24-krystallkort.pdf` · diplomene «Snøfalls venn» (3) · iskrystall i glass eller akryl
- `oppsett_tid`: 4 min
- frost: 12 → 0

---

## C. Lekkasjesjekk

Sjekket per dag: `tittel`, `nissemail_tekst`, `julius_ps` (+ bonusvariant), `daily_alerts`, `symbol_clue.description`, NisseNet-filer som åpner samme dag, Kuldes linje samme dag. «Ja» = koden står i teksten, eller teksten viser mer enn 40 % av bokstavene som skjelett eller som sammenhengende del av et annet ord. Skjelettene i `fysisk_hint` er foreldretekst og holder taket per gåtedesignet.

| Dag | Kode         | Lekkasje i barnetekst                                                                   | Rettet                                                                                                                                                                  |
| --- | ------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SIGNAL       | nei                                                                                     | –                                                                                                                                                                       |
| 2   | 48           | nei                                                                                     | –                                                                                                                                                                       |
| 3   | PRISME       | nei                                                                                     | –                                                                                                                                                                       |
| 4   | KOMPASS      | nei                                                                                     | –                                                                                                                                                                       |
| 5   | ULRIKEN      | nei                                                                                     | –                                                                                                                                                                       |
| 6   | LYKT         | **ja**, låst tittel «Lommelykt-Sporet» = 4 av 4                                         | ny tittel «Skyggene i Gangen»; e-posten sier «lampen», ikke lommelykt                                                                                                   |
| 7   | KULDE        | nei (navnet står ingen steder før koden; Kuldes linje dag 7 sier det ikke)              | Kulde-bildet skrevet uten navn                                                                                                                                          |
| 8   | KRETSKORT    | **ja**, låst tittel «Bestikk-Kretsløpet» = KRETS 5 av 9                                 | ny tittel «Lampene som Lyver»                                                                                                                                           |
| 9   | 24           | nei                                                                                     | –                                                                                                                                                                       |
| 10  | SPEKTER      | nei                                                                                     | –                                                                                                                                                                       |
| 11  | 75           | nei (storyboard-tittelen «… på 75 MHz» er borte)                                        | tittel «Antenne-Krisen»                                                                                                                                                 |
| 12  | MELODI       | nei                                                                                     | –                                                                                                                                                                       |
| 13  | SAFRAN       | nei                                                                                     | `lucia-tradisjon.txt` nevner ikke krydderet                                                                                                                             |
| 14  | ORIGAMI      | nei                                                                                     | –                                                                                                                                                                       |
| 15  | KARAMELL     | nei                                                                                     | –                                                                                                                                                                       |
| 16  | SORTERING    | nei                                                                                     | –                                                                                                                                                                       |
| 17  | NORDLYS      | grense: låst tittel «Grønt Lys på Polarhimmelen» = LYS 3 av 7 (43 %)                    | ny tittel «Grønt over Polarhimmelen»; «lysene» → «lyktene» i e-posten og PS; varselet sier «Ulriken», ikke «Nordtoppen» (NORD = 4 av 7); PS sier «vinduet», ikke «nord» |
| 18  | TURBULENS    | nei                                                                                     | –                                                                                                                                                                       |
| 19  | GULROT       | nei                                                                                     | `foringsautomat.log` sier «oransje reinsdyrfôr»                                                                                                                         |
| 20  | TURBO        | nei                                                                                     | –                                                                                                                                                                       |
| 21  | BRANNMUR     | nei (storyboard-tittelen «Slaget om Brannmuren» er borte)                               | tittel «Vintersolverv»                                                                                                                                                  |
| 22  | LANDÅS       | **ja**, låst tittel «Landingskoordinatene» = LAND 4 av 6; «Landås» i alle faste tekster | ny tittel «Winters Tall»; e-post, PS og varsel dag 22 sier «stedet», ikke Landås eller «landingsstedet»                                                                 |
| 23  | STJERNEKLART | **ja**, låst tittel «Stjernevakt» = STJERNE 7 av 12                                     | ny tittel «Nattevakt»; e-posten sier «de tolv som henger i treet», ikke stjerner                                                                                        |
| 24  | JULEMAGI     | nei («God Jul» = 3 av 8)                                                                | –                                                                                                                                                                       |

Ordet «Landås» står i `daily_alerts` dag 1, 19 og 24 og i Varden-tekster; det er andre dager enn kode LANDÅS og lekker ikke.

Etter vanskelighetsrevisjonen: ingen ny tekst nevner et kodeord eller et skjelett over 40 %. Blindsporbokstavene (E dag 1 og 8, R dag 10, A dag 12, gurkemeie dag 13, K dag 16) står bare i `fysisk_hint` (foreldretekst). `transcript_runer`-linjene (SE MEG, ALENE, SE OPP, LYSET DERES) inneholder ingen kodeord og vises i tegnsettet, ikke som bokstaver.

## D. Tekster som fjernes

**JSON-felt (alle 24 dager):** `hint`, `hint_type`, `dagbokinnlegg`, `fysisk_hint` i dagens form (erstattes av løsningsteksten over). `bonusoppdrag.badge_id`, `badge_navn`, `badge_icon` dag 11 og 16.

**Merker:** `antenne-ingenior`, `inventar-ekspert`, `morket-beseirer`, `oppfinner-assistent`, `kode-mester`, `symbol-mester`. `julekalender-fullfort` får ny ID `snofalls-venn`.

**Eventyr:** alle ni gamle ID-er (`morkets-trussel`, `iqs-oppfinnelser`, `brevfugl-mysteriet`, `halvveis-milepæl` og de øvrige fem), med belønninger.

**NisseNet-filer som slettes:** `OPPGAVER/hint_arkiv.txt`, `JULIUS-ARKIV/hemmelig_kode.txt`, `SNOFALL-HISTORIER/snowflake-patterns.txt`, `dekoder_reinsdyr.txt`, `julekuleblasing.txt`, `farge_system_dekoder.txt`, `tidsanomalier.txt`, `antenna-crisis.txt`, `antenne_tid_system.txt`, `julesanger-samling.txt`, `lucia_lussekatt_hemmelig.txt`, `personlige-brev-intro.txt`, `halvveis_system.txt`, `julekode_dekoder.txt`, `nordpolen_hemmelighet.txt`.

**NisseNet-filer som erstattes (gammelt navn → nytt):** `SYSTEM/snofall_fakta.txt` → `SYSTEM/orakelets-rapport.txt` · `IQ-VERKSTED/magisk-sekk-test.txt` → `IQ-VERKSTED/feilrapport-uke-1.txt` · `brevfugl-finale.txt` → `brevfugl-historie.txt` · `fargesamleren.txt` → `FARGESAMLEREN/02-notatboken.txt` · `JULIUS-ARKIV/reinsdyr_GYATT.log` → `IQ-VERKSTED/foringsautomat.log` · `JULIUS-ARKIV/snill_slem_liste.txt` → `JULIUS-ARKIV/snill-listen.txt`. Omskrevet på samme sted: `om-snofall.txt`, `dagens_oppdrag.txt`, `sikkerhet.log`, `farge-koder.txt`, `lucia-tradisjon.txt`, de tre `DEKRYPTERT`-filene. Ikke rørt: `config.sys`, `readme.txt`, `system.log` (sjekkes for kodeord i steg 3).

**Kode (tekststrenger):** `KULDE_INTERCEPTS` i `SnøfallTV.tsx` (sju hånende linjer og reserveteksten), `VLOG_ENTRIES`, teletext-fasit, «DEL 2: O - D - I» i NisseMusikk, «KRYPTERING: O-R-I-G-A-M-I» i Brevfugler, «PRISME // KRYSTALL-ANALYSE» og «SPEKTER // OPTISK KALIBRERING» i NisseNet-toppen, GrandFinaleModal-strengene listet i A9, `PasswordPrompt`-strengene listet i A1.

**Statisk:** alle 28 gamle `daily_alerts`, de 10 `varsler` (erstattes av Frostgraden), `systemMetrikker` (NISSEKRAFT, BREVFUGL-SVERM, VERKSTED-VARME, SLEDE-TURBO).

## E. Åpne spørsmål til Hans

1. **Fire låste titler lekker koden** (dag 6, 8, 22, 23) og én er på grensen (17). **Venter på avgjørelse.** Dokumentet viser både gammel og foreslått tittel per dag («Skyggene i Gangen», «Lampene som Lyver», «Grønt over Polarhimmelen», «Winters Tall», «Nattevakt»). Alternativet er å beholde titlene og akseptere lekkasjen i Kalender og iCal fra morgenen.
2. **«Landås» i linjenavnet.** Avgjort: linjen heter «Direktelinjen», aldri med stedsnavn. Byggeliste i A0.
3. **Dag 7-varselet.** Avgjort: vises først når dag 7-koden er inne.
4. **Avskjedsbrevet dag 24.** Avgjort: beholdes.
5. **Merke-ikoner** og `unlockCondition`-typen for Snøfalls venn (`allQuestsCompleted` finnes; `decryptionSolved` og `dayCompleted` må bygges, jf. storyboard D2).

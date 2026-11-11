# Medieplan

All generering går gjennom én kø: `assets/bin/generer.py`. Kjør den fra hovedmappen (der `public/` og referansebildene ligger).

```sh
mise run media:plan                       # hva som lages, i rekkefølge, med anslag
mise run media:kjør -- --stopp-etter julius:5
mise run media:kjør -- --til-dag 12 --bare julius --maks-forespørsler 60
mise run media:test-klementin             # ett testklipp
```

## Rekkefølge

1. Navngitte tester (`TESTS` i `generer.py`, for eksempel `test-klementin`).
2. Julius-dager som mangler (✗) eller er utdatert (⚠), laveste dag først.
3. Rampenissen-klipp ✗/⚠ (TTS, teller ikke mot videokvoten).
4. Snøfall TV: tid på døgnet (`landsby-morgen`, `-dag`, `-natt`; skumring er `rolig`) og hendelser per tilstand.
5. Portentréer: Julius, Nissemor, IQ og Winter.
6. Det skjulte NisseMusikk-sporet `music/rampenissen-synger.mp3` (tekst i `assets/characters/rampenissen/synger.txt`).

✓ oppdatert og ? ukjent (laget før sidefiler) hoppes over.

## Kvote

- Dagsgrensen er 200 videoforespørsler. Kvoten nullstilles ved midnatt i California, ca. 09:00 norsk tid.
- Anslaget regner 1,5 forespørsler per klipp, fordi noen klipp må lages på nytt. En Julius-dag med fem innslag koster ca. 7,5.
- Hver POST til interactions-API-et telles. API-et svarer med videoen direkte, så det finnes ingen statusspørringer å telle.
- Bilder (stillbilder) og TTS telles ikke.

## Gjenoppta

Køen stopper med exit-kode 75 ved dagsgrense eller utgiftstak og skriver når du kan prøve igjen. Tilstanden ligger i `assets/out/generer-tilstand.json`: forespørsler brukt per kvotedag, siste feil og status per element. Kjør samme kommando igjen; ferdige elementer hoppes over.

## Gjennomsyn

- `mise run inventar` oppdaterer `assets/INVENTAR.md` og medieoversikten i foreldreguiden (Media-siden).
- Bruk `--stopp-etter julius:5` for å se på en dag før resten lages.
- Testklipp havner i `assets/out/<navn>.mp4`.

## Hvor filene havner

| Hva                  | Sti                                                |
| -------------------- | -------------------------------------------------- |
| Julius               | `public/video/julius/dag-NN.mp4` (+ plakat `.jpg`) |
| Rampenissen          | `public/audio/rampenissen/dag-NN.mp3`              |
| TV og port           | `public/video/tv/<navn>.mp4`                       |
| Musikk               | `public/music/rampenissen-synger.mp3`              |
| Arbeidsfiler, tester | `assets/out/`                                      |

Hver fil får en sidefil `<fil>.meta.json` som inventaret bruker.

## Beslutninger

- Julius lages fra `ref-v3.jpg`.
- Julius-innslag klippes med vekslende utsnitt (annethvert innslag 1,15x nærmere), harde kutt og sammenhengende lyd.
- Mykere klikk i opptaksfilteret (kort, dempet «tape»-dunk).
- Rampenissen: stemmen Fenrir, nordlandsk tonefall, +4 halvtoner, -16 LUFS. Teksten er bokmål.
- Ingen fargefilter på lang sikt: tid på døgnet blir egne loops. Fargefilteret på `rolig` er en mellomløsning.
- Hendelser klippes bare inn i sin egen tilstandsloop og ankres til første bilde i den loopen.
- Portentréene bruker den lukkede porten (`port-nokkelramme.jpg`) som første og siste bilde. Porten åpner og lukker seg i klippet.
- Dagsgrensen er 200 videoforespørsler.

## Bilder som bør lages på nytt (inventar 11. november)

Gamle 2025-bilder i K1, K2 og K4 er byttet ut med første bilde fra loopene (gratis, ingen hopp når videoen starter). Originalene ligger i `assets/out/original-pre-komprimering/bilder-gamle/`. Dette gjenstår, i prioritert rekkefølge:

1. **`public/logo.png`** (gammel grønn pikselpalett, brukes som logo og favicon). Referanse: dagens logo. Prompt: «Pikselgrafikk-logo for NisseKomm: ordet NISSEKOMM i kraftige pikselbokstaver i pergamentfarge med en tynn messingkant, en liten iskrystall i pikselstil som prikk over i-en, mørk blåsvart bakgrunn, isblå glød rundt bokstavene. Ingen grønt, ingen tekst utover NISSEKOMM, kvadratisk 1024×1024, tydelig også i 32×32.» Lag også en 32×32-variant til favicon.
2. **`public/village-day.jpg`** (siste reserve i tre bakgrunner, ligger i git). Bildet er offentlig, så det bør være noe vi kan dele: en enkel tegnet reserve, ikke et generert landsbybilde. Forslag: lag den som SVG i koden (mørk blå himmel, snø, et par varme vinduer) og slett jpg-en.
3. **K4 antennen ved tjernet** (valgfritt; første bilde fra `antenne-rolig.mp4` holder). Referanse: `assets/locations/antenne-tjern/ref.jpg`. Prompt: «Samme mast, tjern og lille hytte som referansen, blåtime i polarnatt, svakt grønt nordlys over fjellene, rim på stagene, fast overvåkningskamera i samme utsnitt, fotorealistisk, ingen tekst.» Mål: `feed/antenne-tarn.jpg`, og bytt filtypen i koden.
4. **K4 krystallgrotten** (valgfritt; første bilde fra `grotte-rolig.mp4` holder). Referanse: `assets/locations/krystallgrotten/ref.jpg`. Prompt: «Samme hvelvede isgrotte som referansen, krystallhyller langs veggene, en gammel radio på en steinsokkel i midten, kald blå glød med et svakt varmt lys fra radioens skala, fast kamera i samme utsnitt, fotorealistisk, ingen tekst, ingen figurer.» Mål: `feed/kulde-grotte.jpg`.
5. **Julius' kontor med Julius** (valgfritt, til nettsiden eller Skjerm). Referanse: `assets/characters/julius/ref-v3.jpg`. Bruk ref-v3 direkte; ingen ny generering trengs.

**Ugleposten (nissespill, K1–K4).** Scenebildene er stillbilder (ingen videokvote, ca. 0,13 USD per bilde, 4 bilder). Kø: `python3 assets/bin/generer.py plan` (`--bare spill`), prompter i `assets/locations/<sted>/varianter/spill.still.prompt.txt`. Kapitlene peker nå på `spill/*.jpg`; til bildene er laget viser spillet reservebildet `/village-day.jpg`.

| Bilde                                                    | Brukt i | Referanse                       | Status                                                                                 |
| -------------------------------------------------------- | ------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `spill/iq-verksted.jpg` (var `feed/iq-verksted.png`)     | K1, K2  | `iq-verksted/vidvinkel-tom.jpg` | i kø                                                                                   |
| `spill/julius-kontor.jpg` (var `feed/julius-kontor.jpg`) | K3, K4  | `julius-kontor/ref-tom.jpg`     | i kø                                                                                   |
| `spill/antenne-tarn.jpg` (var `feed/antenne-tarn.png`)   | K2      | `antenne-tjern/ref.jpg`         | i kø                                                                                   |
| `spill/kulde-grotte.jpg` (var `feed/kulde-grotte.png`)   | K3      | `krystallgrotten/ref.jpg`       | i kø                                                                                   |
| `spill/torget.jpg`, `spill/port-aapen.jpg`               | K1, K4  | –                               | nye, finnes                                                                            |
| `spill/portrett-radio.png`                               | K3      | –                               | mangler (pikselportrett, bokstav-reserve vises); lages med `portrett.sh` + `piksel.sh` |

**Slettes** etter at ingen kode peker på dem: `public/feed/snøfall-night.png` (ubrukt), og v1/v2-restene `assets/locations/snofall-landsby/{still-storm,still-dag24,nokkelramme}.jpg` og `assets/characters/julius/ref-v2*.jpg`. Sjekk først at ingen skript i `assets/bin/` bruker dem.

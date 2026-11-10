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

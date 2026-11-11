# WebKit Gjennomspillingsrapport (iPad Landscape 1180×820)

**Dato**: 2026-11-10
**Miljø**: WebKit (Safari) via Playwright
**Enhetsoppsett**:

- **Oppløsning**: 1180×820 landscape (iPad Air / iPad Pro 11-format)
- **deviceScaleFactor**: 2 (Retina)
- **hasTouch**: true (berøringsskjerm aktivert)
- **isMobile**: true
- **User-Agent**: `Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/19E241 Safari/604.1`
- **MEDIA_DIR**: `/Users/hans/go/src/github.com/starefossen/NisseKomm/public`

---

## Resultatoversikt

| Område / Dag                | Resultat | Notater                                 |
| --------------------------- | -------- | --------------------------------------- |
| Dag 01                      | ✅ OK    | Frost: - → -                            |
| Dag 07                      | ✅ OK    | Frost: 30 % → 22 %                      |
| Dag 10                      | ✅ OK    | Frost: 71 % → 45 %                      |
| Dag 14                      | ✅ OK    | Frost: 50 % → 40 %                      |
| Dag 21                      | ✅ OK    | Frost: 94 % → 32 %                      |
| Dag 24                      | ✅ OK    | Frost: 12 % → TØVÆR                     |
| Foreldreguide (TV-hendelse) | ✅ OK    | Brevfugler tegnes over K1 landsby-rolig |

**Total**: 6/6 dager OK.

---

## WebKit- og iPad-spesifikke funn

### 1. Autoplay-policy (Media Playback Policy)

- **JuliusVideo (`src/components/modules/JuliusVideo.tsx:91`)**:
  - `<video>` har attributtet `autoPlay={autoPlay && isToday && !watched}`, men har ikke `muted`.
  - **WebKit-oppførsel**: I WebKit/iPad Safari nektes udempet lyd/video å starte automatisk uten en forutgående brukergest (tap/klikk). Løftet fra `v.play()` avvises med `NotAllowedError`.
  - **Brukeropplevelse for barna**: Når Dagbok åpnes på dag 1 (eller dagens dato), begynner ikke videoen å spille av seg selv. Barna må berøre videoruten eller Play-knappen for å starte avspillingen. Kontrollene er synlige (`controls` er satt), så videoen kan startes manuelt.
- **Snøfall TV LiveCam (`src/components/windows/snofall-tv/LiveCam.tsx:142`)**:
  - Bakgrunnsvideoene for TV-kanalene har eksplisitt `video.muted = true` og `video.playsInline = true`.
  - **WebKit-oppførsel**: Muted video autospiller uten problemer og mates direkte inn i HTML5 Canvas for CRT- og frost-effekter.

### 2. Videoformater og maskinvaredekoding

- **H.264 / MP4**: Både Julius-videoene (`video/julius/dag-*.mp4`) og landsby-sløyfene (`feed/landsby-*.mp4`) dekodes med full oppløsning (f.eks. 1280×720) i WebKit på Apple Silicon uten synkroniserings- eller artefaktfeil.
- **Plakater (poster)**: `<video poster="...dag-01.jpg">` lastes og vises umiddelbart før videoen startes.

### 3. Berøring og touch-interaksjoner

- **Tre-felts innlogging (`Ord 1 av 3`, `Ord 2 av 3`, `Ord 3 av 3`)**:
  - Fungerer utmerket med tastatur og berøring. Når `snø lykt rein` skrives inn i feltene og barna trykker på `LOGG INN`, sendes koden og godkjennes.
- **Brevfugler**:
  - Knappene for valg av forfatter (Kristian, Håkon, Hanna) og knappen «SEND BREVFUGLEN» reagerer umiddelbart på berøringshendelser (`touchstart`/`touchend`).
- **Små berøringsflater (< 44×44px)**:
  Ingen elementer under 44×44px ble oppdaget på skrivebordet (alle knapper og touchflater oppfyller `min-w-11 min-h-11` / 44×44px i henhold til designsystemet).

### 4. CSS og responsiv layout (1180×820 landscape)

- **Skrivebord**: Layouten på 1180×820 passer fint i bredden og høyden. Vinduer (Dagbok, KodeTerminal, Snøfall TV, Brevfugler) har god plass og overlapper naturlig.
- **CRT-effekter**: Scanline-overlays, vingettering og fargejusteringer i CSS (Tailwind v4 variabler som `bg-(--crt-bg)`, `border-(--brass)`) fungerer konsistent i WebKit.
- **Frostgraden og VHS-striper**: Både VHS-striper (`.frost-vhs`) på dag 10 og iskant (`.frost-edge`) på dag 21 rendres med korrekt CSS-maskering og animasjon.

---

## Registrerte app-observasjoner (file:line)

_(Merk: I henhold til instruksen er disse ikke rettet, men dokumentert for videre oppfølging)_

1. **`src/components/modules/JuliusVideo.tsx:91`**:
   - `<video>` forsøker autoplay med lyd på dagens video. Safari/WebKit på iPadOS blokkerer udempet autoplay.
2. **`src/lib/sounds.tsx:63`**:
   - `this.audioContext.resume()` kalles ved initiering av lydeffekter før brukeren har interagert med siden, noe som genererer advarsler i Safari-konsollen.
3. **`src/components/ui/PasswordPrompt.tsx:154`**:
   - Høyden på tekstfeltene (`min-h-12`) er 48px, som er optimal for touch på iPad, men `autoFocus={i === 0}` kan føre til at det virtuelle tastaturet spretter opp automatisk ved sideinnlasting i ekte iOS Safari.

---

## Skjermbilder generert

Skjermbilder fra gjennomspillingen finnes i `/Users/hans/go/src/github.com/starefossen/NisseKomm-agy-webkit/test-results/webkit`:

- `innlogging-utfylt.png`
- `dag-01-julius.png`
- `dag-01-skrivebord.png`
- `brevfugler-dag7.png`
- `dag-10-skrivebord.png`
- `brevfugler-dag14.png`
- `dag-21-skrivebord.png`
- `finale-dag24.png`
- `tv-hendelse-brevfugler.png`

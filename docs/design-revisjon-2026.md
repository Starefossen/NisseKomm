# Designrevisjon 2026 – forslag

**Status: forslag, 10. november 2026.** Ingen kode er endret. Historien, gåtene, kodene og dataene i `src/data` er låst (`historie-2026.md`) og røres ikke her. Alt under er skall: farger, typografi, hierarki, bevegelse og frost.

**Grunnlag.** `DESIGN_SYSTEM.md`, `docs/historie-2026.md`, `docs/storyboard-2026.md`, `assets/stil.md`, `src/app/page.tsx`, `src/app/globals.css`, alle vinduer i `src/components/windows/` og rammene i `src/components/ui/`. Appen ble kjørt fra en midlertidig arbeidskopi av `main` og fotografert i headless Chromium på dag 3, 10, 16 og 21 i 1440×900, og på iPad-mål (1024×768 og 820×1180). Den delte dev-serveren på port 3200 hadde en gammel modulgraf (`Can't resolve 'pg'`, startet før `pg` ble installert) og må startes på nytt.

## 1. Slik ser det ut i dag

### Det som fungerer

- Ett vindu om gangen, modal over et skrivebord. Barna kjenner det fra i fjor, og det er lett å styre med fingre.
- Julius' video åpner seg selv ved innlogging, med «NY MELDING FRA JULIUS» og rød prikk. Riktig valg, riktig sted.
- Frostgraden som teller ned ett poeng om gangen når koden er inne.
- `LiveCam` tegner loopene i canvas med frost, støy og CRT-preg i kode. Det er den eneste delen av appen som allerede snakker samme språk som videoene.

### Det som er datert, rotete eller feil

**Paletten hører ikke til historien.** `#00ff00` på `#0a1a0a` er 1983 og ingen av de to temperaturene i `stil.md`. Videoene og loopene er gull, messing, tre og stearinlys mot mørkeblått vinterlys. Neongrønt er en tredje farge som ikke er varm og ikke er kald. Rundt Julius' video (Snøfall TV K3 dag 3) står en knallgrønn ramme, en gullramme og en svart stripe med rød tekst oppå et filmbilde i rav og blått. Videoen ser ut som en fange i grensesnittet. Grønt er dessuten nordlysets farge (dag 17), og mister effekten når alt er grønt fra før.

**VT323 vises ikke.** `layout.tsx` laster fonten via `next/font` som variabelen `--font-vt323`, men `globals.css` setter `body { font-family: "VT323", monospace }`. `next/font` registrerer et hashet familienavn, så det bokstavelige «VT323» treffer bare hvis fonten er installert lokalt. På skjermbildene rendres Menlo. Sjekklisten i `AGENTS.md` sier «VT323 brukes konsekvent»; den brukes ikke.

**Teksten er for liten for en 9-åring.** Kroppstekst er 20 px, men nesten alt i vinduer og sidepanel er `text-sm` (14 px), `text-xs` (12 px) og `text-[10px]`. Ikonetiketter på skrivebordet er 12 px på en 1440-skjerm. Varsellisten er 12 px med 10 px tidsstempel, avkortet med ellipse. Håkon leser dette fra en stol foran en iMac; Kristian må lene seg frem.

**Ikonene hentes fra internett ved hver lasting.** `src/lib/icons.tsx` setter `<img src="https://unpkg.com/pixelarticons@1.8.1/svg/…">` og farger med CSS-filter. `key.svg` finnes ikke i 1.8.1 (404), så Symbolskanner viser ordet «key». Uten nett er alle ikoner borte. `pixelarticons@2.4.2` ligger allerede i `node_modules` med 1 036 glyffer, også `key.svg`.

**Skrivebordet har ingen rekkefølge.** Tretten ikoner og to «LÅST» i et 4-kolonners rutenett som blir ujevnt (én ensom rad til slutt). Alt har samme vekt. Historiens viktigste flate, Julius' video, er ett av tretten ikoner med ordet «DAGBOK» under, et ord Hanna ikke kan lese og som ikke betyr video.

**Sidepanelet tar 25 % og sier lite.** Før dag 7 er det en tom boks med «ORAKELET LYTTER …». Fra dag 7 står tallet og en stolpe i øvre tredel av en ellers tom boks. Under ligger VARSLER med åtte avkortede linjer og emoji. Storyboardet avgjorde «sidepanelet viser bare Frostgraden»; VARSLER er fortsatt der.

**Alle vinduer roper like høyt.** `RetroWindow` og `SidebarWidget` har en massiv `#00ff00`-tittellinje med svart tekst. Det sterkeste elementet på skjermen er alltid tittellinjen, aldri innholdet. Lukkeknappen er `red-800` på neongrønt.

**Frosten treffer ikke riktig.**

- Dag 10 er `filter: grayscale(1)` på hele arbeidsflaten. Ideen er riktig, men grønt-på-svart blir grått-på-grått, og 12 px-teksten blir uleselig akkurat den dagen gåten krever filen `farge-koder.txt`. Julius' video blir også grå; det er greit som historie, men scanline-laget legges to ganger (CRTFrame + K3-overlegg).
- Dag 21 tegnes Kuldes linje «Det er kaldt her nede …» med `top-1/3` rett over ikonraden og kolliderer med DAGBOK-ikonet (det eneste som er åpent). Rimkanten (`frost-edge`) er knapt synlig på 1440 px. Sidepanelet står i full neongrønn mens skrivebordet skal være fryst; frosten når ikke dit.
- Dag 7–20 er frosten bare et tall. TV-en blir kaldere med prosenten (`LiveCam`), skrivebordet gjør det ikke. Historien sier «uke for uke tar Kulde noe nytt»; grensesnittet viser det ikke.

**Alt beveger seg hele tiden.** LED-er pulserer, merker blinker i gull i evig løkke, varsler glir inn, scanlinjen feier hvert sjette sekund, kriselinjer pulserer. `DESIGN_SYSTEM.md` ber om «constant motion». Historien ber om «rolig, aldri skummel». De to kan ikke begge vinne, og den andre er viktigere.

**Hanna (5) har ingenting å se på.** Hun navigerer etter bilder og ansikter. Ingenting på skrivebordet er et bilde: ikke Julius, ikke Snøfall, ikke Rampenissen. Det ene hun kjenner igjen (videoen) forsvinner bak et ord når vinduet lukkes. Merkeraden nederst er tre grå låste bokser i 24 dager minus tre.

**iPad.** Liggende (1024 px) er sidepanelet 256 px og klemmer varsellisten til ord. Stående (820 px) er sidepanelet bak en hamburger (greit), men skrivebordet er tre kolonner med 40 px-ikoner og 12 px-etiketter, mye tomrom og små mål. Trykkmål: `DesktopIcon` (≥ 64 px), kalenderluker og lukkeknapp (48 px) er fine. Varselrader er omtrent 40 px, under 44.

**Innlogging.** «TILGANGSKONTROLL / SKRIV INN DIN HEMMELIGE KODE» i grønt på svart. Passordskjermen er beholdt som fiksjon; da bør den være Snøfalls dør, ikke en minibank.

## 2. Retning

### Alternativ A: Polert terminal

Behold alt, rett feilene (font, ikoner, dag 21-kollisjon, tekststørrelser), demp grønnfargen litt. Under en dag. Lav risiko. Appen og filmene snakker fortsatt to språk.

### Alternativ B: Kontrollrommet i Snøfall (anbefalt)

Samme komponenttre, samme vinduer, samme tester. Nytt skall:

- **To temperaturer, én variabel.** Varm palett (messing, rav, pergament, mørkt tre) som grunntone. Kald palett (is, stål, natt) som frosten blander inn. Én CSS-variabel `--frost` (0–1) settes fra `GameEngine.getFrostLevel()` på rotelementet, og farger, kanter og glød regnes ut med `color-mix()`. Skrivebordet blir kaldere uke for uke uten én ekstra linje per dag. Dag 10 og 21 forsterker, dag 24 nullstiller til varmt. Grønt beholdes bare til nordlyset (dag 17), suksessblink og LED.
- **Julius er helten.** Innlogging og skrivebord åpner med videoen stor, ikke med et rutenett. På skrivebordet får Julius en dobbelt så stor flis med stillbilde fra kontoret og rød prikk, med «JULIUS» som etikett. Det er bildet Hanna kjenner igjen.
- **Færre ting på skjermen.** To rader: «I dag» (Julius, NisseMail, KodeTerminal, Snøfall TV) og «Verktøy» (resten). «LÅST»-plassholdere fjernes; moduler dukker opp om morgenen på sin dag, slik storyboardet alt har avgjort.
- **Frostgraden alltid synlig, alltid stille.** Et smalt termometer i sidepanelet, ingen boks rundt, ingen blinking. Varslene flyttes inn i NisseMail som en ticker eller kuttes til de tre siste. Før dag 7 står «LINJE 90,0 MHz · BÆREBØLGE» med én rolig LED.
- **CRT bare der det er TV.** Scanlinjer og vignett ligger på Snøfall TV og Julius' video, der de hører hjemme. Rammen rundt appen blir en mørk konsoll i tre og messing, ikke en svart kant med scanlinjer over alt.
- **Tittellinjer som tynne messingstriper**, pergamentfarget tekst på mørkt, lukkeknapp i samme stil. Innholdet, ikke rammen, skal være det lyseste.
- **Typografi.** VT323 slått på og brukt til titler, etiketter og tall ved 18 px og oppover. Kroppstekst (e-post, transkript, filer) i en lesbar mono eller sans på minst 18 px. Ingenting under 16 px.
- **Bevegelse på diett.** Bare Frostgraden tikker, bare én LED puster. Resten står stille til noe skjer.

Omfang: omtrent 3–4 dagsverk for én agent pluss en gjennomgang. Ingen test endres hvis selektorene i §3 holdes.

### Alternativ C: Filmsett

Skrivebordet er Julius' kontor-loop i fullskjerm, ikonene er gjenstander på pulten (telefonen er NisseMail, radioen er Snøfall TV, notatboken er Dagbok), vinduer åpner som nærbilder. Det er den riktige 2027-versjonen. Før 1. desember er det L med høy risiko: nye bilder per gjenstand, nye trykkmål, nye selektorer i `scripts/gjennomspilling.mjs`, og ytelse på iPad er ukjent.

**Anbefaling:** B. Ta med én bit av C som siste, valgfrie steg: en rolig loop (`verksted-tom.mp4` eller `landsby-rolig.mp4`) bak skrivebordet på 15–20 % lysstyrke, pauset når et vindu er åpent, og underlagt samme `--frost`.

### Fargeforslag (utgangspunkt, justeres mot loopene)

| Rolle                 | Varm (frost 0)           | Kald (frost 1)  |
| --------------------- | ------------------------ | --------------- |
| Bakgrunn              | `#120c08` mørkt tre      | `#0b1626` natt  |
| Flate (vindu, panel)  | `#1d140d`                | `#12203a`       |
| Kant og tittelstripe  | `#b8863b` messing        | `#5a7a99` stål  |
| Primærtekst           | `#f3e3c3` pergament      | `#dbe9f7` is    |
| Aksent og tall        | `#ffb347` rav            | `#9fd4ff` isblå |
| Suksess               | `#ffd700` gull (uendret) | –               |
| Feil                  | `#d9412a` tegl           | –               |
| Nordlys (bare dag 17) | `#00ff8a`                | –               |

Beholdes som i dag: gull for fullført, rødt for feil. Grønn som «primær UI» går ut.

## 3. Endringsliste før 1. desember

S = under en halv dag, M = 1–2 dager, L = 3+ dager. Rekkefølgen er prioritet. P0 er feil som bør rettes uansett retning.

### P0 – feil (S hver, ca. en halv dag samlet)

| #   | Endring                                                                                                                                                                                                                                                  | Filer                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Slå på VT323: `body { font-family: var(--font-vt323), monospace }`. Løft minstestørrelser: `text-xs`/`text-[10px]` → `text-base`, `text-sm` → `text-lg` i etiketter, varsler, kalenderluker og sidepanel.                                                | `src/app/globals.css`, `ui/DesktopIcon.tsx`, `ui/SidebarWidget.tsx`, `modules/VarselKonsoll.tsx`, `windows/Kalender.tsx` |
| 2   | Ikoner uten nett: les SVG-ene fra `pixelarticons` (allerede installert) i stedet for unpkg. Enkleste vei: kopier `node_modules/pixelarticons/svg` til `public/icons` i et `prebuild`-skript og pek `src` dit. `key.svg` finnes i 2.4.2.                  | `src/lib/icons.tsx`, `package.json`                                                                                      |
| 3   | Dag 21: flytt Kuldes linje ut av ikonrutenettet (et bånd under toppen av arbeidsflaten), gjør `frost-edge` synlig (sterkere innover-skygge eller en SVG-maske fra hjørnene) og la sidepanelet fryse med. Behold klassene `.frost-edge` og `.frost-thaw`. | `src/app/page.tsx`, `src/app/globals.css`                                                                                |

### P1 – skallet (M, ca. 1,5 dag)

| #   | Endring                                                                                                                                                                                                                                                                                                                                                                                                   | Filer                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 4   | Fargetokener med frostblanding. Nye variabler `--varm-*`, `--kald-*` og `--frost` i `:root`; de gamle navnene (`--neon-green`, `--cold-blue`, `--crt-bg`, `--dark-crt`) får nye verdier regnet ut med `color-mix(in oklab, var(--varm-…), var(--kald-…) calc(var(--frost) * 100%))`. Da slipper vi å røre flere hundre klassenavn nå. `page.tsx` setter `style={{ "--frost": frost / 100 }}` på rotdiven. | `src/app/globals.css`, `src/app/page.tsx`                         |
| 5   | CRTFrame: svart kant → mørk tre/messing-konsoll (gradient og innerskygge). Fjern `scanline-overlay` og `vignette` fra rammen; behold dem på `LiveCam` og `JuliusVideo`.                                                                                                                                                                                                                                   | `ui/CRTFrame.tsx`, `src/app/globals.css`                          |
| 6   | RetroWindow, RetroModal, SidebarWidget: tynn tittelstripe i messing med pergamenttekst, nøytral lukkeknapp (samme `aria-label="Lukk"`), bakteppe `bg-black/70`, kant 2 px i stedet for 4.                                                                                                                                                                                                                 | `ui/RetroWindow.tsx`, `ui/RetroModal.tsx`, `ui/SidebarWidget.tsx` |
| 7   | Innlogging som Snøfalls dør: stillbilde fra Julius' kontor (`assets/locations/julius-kontor/ref-tom.jpg` → `public/static/`) dempet bak, overskrift «SNØFALL · DIREKTELINJE 90,0 MHz», kodefelt som messingplate. Behold `placeholder="_ _ _ _ _ _ _ _"` og `form input[type=text]`.                                                                                                                      | `ui/PasswordPrompt.tsx`                                           |

### P2 – hierarki (M, ca. 1,5–2 dager)

| #   | Endring                                                                                                                                                                                                                                                                                                                                                                                     | Filer                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 8   | Skrivebord i to rader. Julius-flis 2×2 med stillbilde og rød prikk (etikett «JULIUS», åpner `dagbok`). Rad «I dag»: Julius, NisseMail, KodeTerminal, Snøfall TV. Rad «Verktøy»: resten i opplåsingsrekkefølge, uten «LÅST»-plassholdere. Etikettene «KODETERMINAL» og «DAGBOK» må finnes som tekst et sted i flisen (testen klikker på dem); legg «DAGBOK» som undertekst på Julius-flisen. | `src/app/page.tsx`, `ui/DesktopIcon.tsx`                                    |
| 9   | Sidepanel: Frostgraden som stående termometer uten boks, tallet stort, teksten «FROSTGRADEN NN %» / «TØVÆR» uendret (testen leser den). Før dag 7: «LINJE 90,0 MHz» med én LED. Varsler: vis de tre siste under termometeret, resten i NisseMail. Bredde `lg:w-1/4` → fast `lg:w-56`.                                                                                                       | `modules/SystemStatus.tsx`, `modules/VarselKonsoll.tsx`, `src/app/page.tsx` |
| 10  | Dag 10: bytt global `grayscale(1)` mot token-blanding (`--frost` låst til 1 + `saturate(0.3)`) så tekst beholder kontrast; behold glimtene av rødt og grønt og klassen `.frost-vhs`.                                                                                                                                                                                                        | `src/app/globals.css`, `src/app/page.tsx`                                   |
| 11  | Bevegelsesdiett: fjern evig `gold-flash` på merker, `pulse` på kriselinjer og `slide-down` per varsel. Behold `frost-tick` og én LED.                                                                                                                                                                                                                                                       | `ui/BadgeRow.tsx`, `modules/VarselKonsoll.tsx`                              |
| 12  | iPad: fire kolonner fra `md`, ikoner 56 px, varselrader `min-h-11`. Sjekk 1024×768 og 820×1180.                                                                                                                                                                                                                                                                                             | `src/app/page.tsx`, `ui/DesktopIcon.tsx`, `modules/VarselKonsoll.tsx`       |

### P3 – hvis tid (S–M)

| #   | Endring                                                                                                                                              | Filer                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 13  | Levende bakgrunn: én `<video muted loop playsInline>` bak skrivebordet på 15–20 % lysstyrke, pauset når et vindu er åpent. Mål ytelse på iPad først. | `src/app/page.tsx`                                    |
| 14  | Stillbilde per dag til Julius-flisen: `bin/julius.sh` lager `dag-NN.jpg` fra sekund 2 av hver video.                                                 | `bin/julius.sh`, `modules/JuliusVideo.tsx` (`poster`) |
| 15  | Oppdater fargetabellen og «Interaction Principles» i `DESIGN_SYSTEM.md` etter at koden er endret.                                                    | `DESIGN_SYSTEM.md`, `AGENTS.md`                       |

### Hopp over før 1. desember

- Alternativ C (filmsett). Egen sak for 2027.
- Ny layout inne i de tunge vinduene (NisseKrypto 778 linjer, NisseStats 701, NisseNet 463, NisseMail 599). De arver tokenene og størrelsene fra P0/P1 og blir bra nok.
- Nissemor-guiden. Foreldre tåler grønt.
- Vindusanimasjoner, lyd-redesign, lys/mørk-modus.
- Nye fonter utover å faktisk slå på VT323. Hvis kroppsteksten trenger en annen font, avgjøres det etter P0, med et skjermbilde.
- Nye merkeikoner.

### Kontrakter som må holdes

Ingen innholdsfiler endres. Disse selektorene brukes av `scripts/gjennomspilling.mjs` og skal overleve: `input[placeholder='_ _ _ _ _ _ _ _']`, `form input[type=text]`, `[aria-label=Lukk]`, teksten `FROSTGRADEN <tall> %` / `FROSTGRADEN TØVÆR`, tekstene «NY MELDING FRA JULIUS» og «PS fra Julius», klassene `.frost-vhs`, `.frost-edge`, `.frost-thaw`, og klikkbare etiketter «KODETERMINAL» og «DAGBOK». Enhetstestene (`channels.test.ts`, `Brevfugler.test.ts`, `NisseMusikk.test.ts`, `JuliusVideo.test.tsx`) tester logikk, ikke stil. Kjør `pnpm check` og `mise run test:gjennomspilling` etter hver gruppe.

### Samlet innsats

P0 ½ dag · P1 1½ dag · P2 1½–2 dager · P3 ½–1 dag. Omtrent 4 dagsverk for én agent, delt i tre PR-er (P0, P1, P2) som hver kan gå inn alene. P0 kan merges denne uken uansett hva som bestemmes om resten.

## 4. Stemningsbilder (prompter)

Til å rendre for mennesket, ikke til bruk i appen. Alle i 16:9, samme uttrykk som `stil.md`: cinematisk, lun nordisk mørketid, ikke tegnefilm.

**1. Innlogging – Snøfalls dør.**
«UI mockup, 16:9, a vintage radio-console login screen. Dark walnut and brass bezel framing a dimmed, slightly out-of-focus photograph of an old Nordic Christmas office: wooden shelves, a lit Christmas tree, a frosted window with blue winter light. Centered: a brass plate with a monospaced pixel-style input field showing «_ _ _ _ _ _ _ _», warm amber phosphor glow, the words SNØFALL · DIREKTELINJE 90,0 MHz above it in small pixel capitals, parchment colour. No neon green anywhere. Subtle scanlines only inside the photograph. Cinematic, warm indoor light against cold blue outside, film grain.»

**2. Skrivebordet dag 8 – varmt.**
«UI mockup, 16:9, a children's advent-calendar desktop styled as a Snøfall control room. Dark wood background with a faint brass vignette. Left: a narrow vertical brass thermometer labelled FROSTGRADEN 38 % in amber pixel capitals, no box around it. Right: a large hero tile showing a still of an old bearded man at a desk with a vintage microphone, with a small red dot and the word JULIUS; around it a row of four smaller tiles (NISSEMAIL, KODETERMINAL, SNØFALL TV) and a lower row of seven small tool tiles with white pixel icons on parchment labels. Everything warm amber and parchment on dark wood; only a thin ice-blue tint at the very edges hinting at frost. Calm, no glow spam, no neon green.»

**3. Skrivebordet dag 21 – fryst.**
«UI mockup, 16:9, the same Snøfall control-room desktop now frozen. Palette shifted to night blue and steel; rime ice grows in from all four corners over the brass bezel. The thermometer reads FROSTGRADEN 94 % in ice-blue. Most tiles are dimmed under a frost layer; only JULIUS (with red dot), NISSEMAIL and KODETERMINAL remain warm amber. A single quiet line of text in a band under the top edge: «Det er kaldt her nede. Jeg ville bare se lyset deres.» Lonely and still, not scary. Cinematic, film grain, cold blue with one small warm island.»

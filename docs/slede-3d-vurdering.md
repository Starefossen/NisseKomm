# Sleden i 3D: kan vi bruke prototypen?

Vurdering 11. november av Hans' sledeprototype (`julius-slede-snofall-oyr.oyvir.chatgpt.site`) mot IQs sledesimulator (`snofall-tv/SledeSimulator.tsx`, `slede.ts`). Spillere: Håkon (9) og Kristian (12), iPad Safari. Appen skal ut 1. desember; sleden åpner først 8. desember, så det er 27 dager til første spilldag.

## 1. Teknisk: hva prototypen er

- Én Next.js-side uten biblioteker: ingen three.js, ingen gl-matrix. Alt er håndskrevet WebGL1 pluss `ANGLE_instanced_arrays`. Alt innhold er prosedyralt; det finnes ingen modeller, teksturer eller lydfiler å flytte. Ca. 100 KB minifisert JavaScript.
- Rendereren er en egen klasse (oppsett, `resize`, `upload`, tegning) som bare trenger et `<canvas>`. Geometri (dal, trær, hus, slede med rigg og tre reinsdyr), shadere og værmodell ligger i frittstående funksjoner over den. React brukes bare til knapper, skiver og minikart. Det kan løftes inn som tre–fire filer under `snofall-tv/` i en `useEffect`, med `loseContext()` ved avmontering, slik vi gjør med 2D-lerretet i dag.
- Det dyre på iPad er fyllrate, ikke geometri: skyggekart på 1024² tegnes som en ekstra fullstendig pass hvert bilde (dybde pakkes i RGBA fordi WebGL1 mangler dybdetekstur), og himmel, snø og skyer kjører fbm-støy i `highp` per piksel. Prototypen tegner med 1,35–1,6 ganger CSS-oppløsningen; på en 11-tommers iPad er det rundt 2,5 Mpiksler per bilde pluss skyggepasset. Det går fint på M-iPader og er usikkert på A10–A12. Vi vet ikke hvilken iPad familien har, så dette må måles, ikke antas.
- Kvalitetstrinn hvis vi tar grafikken som den er: **lav** (DPR 1, uten skygge, to støyoktaver), **middels** (DPR 1,25, skygge 512²), **høy** (prototypen). Velg trinn automatisk etter målt bildetid de første tre sekundene.
- Måling: samme ring av `requestAnimationFrame`-tider som `/dev/slede?dag=24` viser i dag, utvidet med p95 og tegnet i HUD-en. Åpnes på iPaden over LAN (WebGL krever ikke sikker kontekst), ett trinn om gangen, 60 sekunder per trinn.

## 2. Design: åpen flukt over Snøfall

Det som gjør prototypen god er ikke friheten, men at verden kjennes ekte: meier og rein beveger seg, kamera henger etter, lyset skifter. Frihet uten mål gir en 9-åring tre minutter. Forslaget er derfor **åpen verden med oppdrag**, der det vi allerede har blir oppdragene:

- **Dalen er én sammenhengende verden** med Snøfall landsby i midten. Hver etappedag (8, 9, 12, 14, 18, 19, 20, 21, 24) tiner et nytt område av kartet; `ETAPPER` og `etapperFor(day)` står som de er, bare med et område i stedet for en løype.
- **Pipelevering** er den nye oppdragstypen: hus med piper, pakke slippes med én knapp, buen følger fart og høyde, vind forskyver den. Røyk fra pipa viser treff. Pakkene har navn fra **Brev til Julius** (`GameEngine.getSantaLetters()`): har barna skrevet brev, er det deres pakker som skal ut. Ingen brev gir «pakke fra Nissemor».
- **Dagens utfordring** (`dagensUtfordring`) beholdes med samme seks typer, oversatt: varder blir ringer over bygda, stjerner samles i lufta, tid blir leveringsrute, rekke blir piper på rad uten bom, nære på blir lave pass over hustak. Bjeller og beste poeng per område lagres som i dag via `recordSledeResultat`.
- **Hva som drar dem tilbake i 17 dager**: nytt område annenhver–tredje dag, ny utfordring hver dato, pakker med egne navn, og søskentavlen fra `todo.md` (beste per område per spiller). Det er lista fra `minispill-sesong.md`, ikke noe nytt.
- **Ingen dagskoder**: stedsnavn, husnavn, HUD-tekst og utfordringstekst legges i `slede.ts` der `komponentlekkasje.test.ts` allerede leser. Ordene lykt, kulde, turbo, nordlys (før 18.) og tallene 24 og 75 holdes unna som før.

## 3. Alternativer

|                              | Hva                                                                                                                                                                                                                        | Innsats     | Risiko for 1. des.                                | Utseende                                    | iPad                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **A** Skinn på 2D-spillet    | Prototypens farger, himmel og rein som sprites i dagens lerret                                                                                                                                                             | 2–3 dager   | Lav                                               | Litt penere, samme spill                    | Som i dag                                                      |
| **B** Hybrid                 | Prototypens WebGL-verden som den er, `slede.ts` styrer, etapper blir områder                                                                                                                                               | 8–10 dager  | Middels: iPad-ytelse ukjent, to renderere å pleie | Prototypen                                  | Usikker, trenger kvalitetstrinn                                |
| **C** Åpen verden fra bunnen | Ny simulering, nye oppdrag, ny renderer                                                                                                                                                                                    | 15–20 dager | Høy                                               | Best, hvis den blir ferdig                  | Usikker                                                        |
| **D** Retro-piksel 3D        | Prototypens scene (dal, trær, hus, rigg, kamera) tegnet til et lite rammebuffer (320×180 eller 480×270), skalert opp uten utjevning, flat skyggelegging, fast palett med dithering i ett etterpass; uten skyggekart og fbm | 5–7 dager   | Lav–middels                                       | Passer CRT-stilen, VT323-HUD på 2D-lag over | Billigst: 60–130 kpiksler per bilde, 20–40 ganger mindre enn B |

**Anbefaling: D, med B-ens struktur.** Vi tar prototypens verdensbygging, rigg og kamera, kaster skyggekart, skyer og støyshadere, og tegner til et lavoppløst rammebuffer. Det gir et ekte 3D-rom som ser ut som resten av NisseKomm, det er det eneste alternativet som er trygt på en ukjent iPad, og `slede.ts` med etapper, utfordringer, bjeller og tester blir liggende. Pipelevering kommer som oppdragstype for områdene fra dag 14; dag 8–12 flyr de ringer og samler stjerner i 3D-dalen, slik de ville gjort i dag. Blir det knapt om tid, er D uten pipelevering fortsatt et bedre spill enn dagens.

B anbefales ikke: fotorealistiske skygger og fbm-himmel bryter med appens stil, og ytelsen på iPad er det vi vet minst om. C er ute: tre uker er ikke nok ved siden av resten av sesongen. A er fallback hvis spiken feiler.

## 4. Spike, 1–2 dager

Mål: vite innen 14. november om D holder på familiens iPad.

1. Løft prototypens renderer inn under `src/components/windows/snofall-tv/slede3d/` og rens: dal, trær (instansiert), fire hus med pipe, sleden med rein, chase-kamera. Ingen skygge, ingen skyer, flat himmelgradient.
2. Tegn til rammebuffer i 320×180, 480×270 og 640×360 med valgbar palett (16 og 32 farger) og én dithering, skalert opp med `NEAREST`. Dev-side `/dev/slede-3d?res=480&pal=16`.
3. Styr med `slede.ts` sin `createSim` uendret: x og høyde fra simuleringen, kamera bak.
4. Mål på iPaden: bildetid p50/p95 per oppløsning, tid til første bilde, minnevarsel i Safari, varme etter fem minutter, og om pipene er lesbare på 480×270 i TV-ruta og i stort vindu. Grense: p95 under 18 ms på 480×270, ellers 320×180.
5. Lever: tall i denne fila og ett skjermbilde per oppløsning, så Hans velger palett og oppløsning.

## 5. Hvor spillet skal bo

|                                                                         | Fordel                                                                                                                                          | Ulempe                                                                                                                   |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| (a) Eget modul-ikon **SLEDEFLUKT**, `RetroWindow stor`, låses opp dag 8 | Synlig på skrivebordet med NY-merke, full 16:9-høyde på iPad, samme mønster som NISSESPILL (`page.tsx` modul-liste, `modules` i dagens oppdrag) | Ett ikon til; IQ-rammen må følge med                                                                                     |
| (b) Fra K4, åpner fullskjerm                                            | Plass                                                                                                                                           | Tre klikk inn før de finner den; `requestFullscreen` virker på iPad, men lukkes av sveip, og TV-vinduet må gjenopprettes |
| (c) Som i dag i K4                                                      | Ingenting å flytte                                                                                                                              | TV-ruta er rundt 60 % av bredden på iPad, for lite for 3D og piper                                                       |

**Anbefaling: (a).** IQs simulator er fortsatt IQs: tittellinjen heter «IQs sledesimulator», og K4 beholder én linje på dag 8 som peker til skrivebordet. Det er historie nok. Oppsettet er mekanisk: ny rad i modul-lista, `NISSESPILL`-mønsteret i dagens oppdrag for dag 8, `stor`-vinduet som Ugleposten bruker, og tallet 6 i `game-engine.ts` blir 7. Fullskjermknapp inne i vinduet kan komme etterpå.

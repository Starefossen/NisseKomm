# SLEDEFLUKT: status

Retro-piksel 3D-versjon av IQs sledesimulator som eget skrivebordsmodul fra 8. desember.
Plan og valg: `docs/slede-3d-vurdering.md` (alternativ D med B-ens struktur). Gren `feat/sledeflukt-3d`.

## Fase 1 (denne runden)

| Steg                 | Status | Hvor                                                                                                                                                                                                                                                           |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Renderer og verden | ferdig | `src/components/windows/sledeflukt/gl.ts` (matrise, Mesh, palett), `verden.ts` (dal, trær, hus med pipe, varder, tinder, mur, grotte, slede og rein), `renderer.ts` (WebGL1, lite rammebuffer, palett + Bayer-dither, nearest-oppskalering, instansierte trær) |
| 2 Simulering         | ferdig | `snofall-tv/slede.ts` uendret bortsett fra `Styring.gass` (holdt fart/brems); `verden.ts` oversetter sim-enheter til 3D (`tilVerden`, `SKALA`, `SPOR`, `midt`)                                                                                                 |
| 3 Modul SLEDEFLUKT   | ferdig | `page.tsx` verktøyrad, `uke2_oppdrag.json` dag 8 `modules`, `game-engine.ts` modultall, K4 peker til skrivebordet                                                                                                                                              |
| 4 Styring            | ferdig | Tastatur (piler/WASD, Shift fart, X brems, mellomrom sprang, Esc pause), én relativ stikke på touch pluss holdte FART/BREMS, pause ved blur og skjult fane, `prefers-reduced-motion`                                                                           |
| 5 Måling             | ferdig | `/dev/sledeflukt?dag=24&res=320` (lan-modus) med p50/p95 og oppløsning i hjørnet                                                                                                                                                                               |

### Målinger

Målt i Playwright Chromium (ANGLE/Metal, hodeløs) på Mac, 1180×820-vindu. Begge oppløsninger ligger
på vsync (60 Hz), så GPU-kostnaden er under budsjettet der; tallet sier ikke hvor mye luft det er.
iPad er ikke målt ennå, og det er den som avgjør.

| Oppløsning | p50     | p95     |
| ---------- | ------- | ------- |
| 480×270    | 16,7 ms | 16,8 ms |
| 320×180    | 16,7 ms | 16,7 ms |

Skjermbilder fra kjøringen (skrivebord med ikon, startskjerm, flukt, 320×180) ligger i
scratchpad `sledeflukt/` for denne økta; ingen er sjekket inn.

Automatikk: starter på 640×360 (16-bit-utseende, 64 farger, dithering i kildepiksler); faller ett trinn (480×270, så 320×180) når medianen over tre sekunder er over 18 ms (`GRENSE_MS`; p95 felte en vsync-bundet 640×360 på enkeltstøt).

### Å gjøre på iPaden (Hans)

1. Åpne `http://<mac>:3101/dev/sledeflukt?dag=24` i Safari på iPaden (lan-modus), spill ett minutt, les p50/p95 nederst til venstre.
2. Gjenta med `&res=320`. Grense: p95 under 18 ms.
3. Sjekk at pipene på husene er lesbare i 480×270, og varme etter fem minutter.

## Fase 2 (gren `feat/sledeflukt-fase2`)

| Steg                    | Status | Hvor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Visuell finpuss       | ferdig | `verden.ts`: slede med skrog, gulltrim, sekk og meier på stag; reinspann i V (`REIN`, `REIN_SKALA`); varde med glødende topp; grottens grønne kanter er stiplede islys. `renderer.ts`: `snø()`, tre lag pikselsnø i det lille bufferet, drift med vinden, av ved `prefers-reduced-motion`. Kameraet ligger høyere og litt til høyre (`Sledeflukt.tsx`)                                                                                                                                                           |
| 2 Pipelevering (dag 14) | ferdig | `slede.ts`: `Blanding.hus` gir `Ting` «hus» langs løypa på etappene fra 14. desember (`HUS_PIPE` = pipetopp per størrelse); `Styring.slipp`, `Pakke`, `fallPakke`/`forutsiPakke` (tyngde, luftmotstand, vinddrift), treff ved pipetoppen (200 × rekke), `leveringsoppdrag(day, e)` (+300 i mål), `pakkenavn(brev, n)`. `verden.ts`: `husPlass`, pakke-, røyk-, prikk- og merkemesh. `Sledeflukt.tsx`: SLIPP-knapp/Enter, røyk fra piper, stjerne på leverte hus, siktelinje og landingskryss, HUD/start/resultat |
| 3 Fri flyging           | ferdig | `SimOpts.fri`: ingen mållinje, loop fra `lengde + FRI_SLUTT` til `FRI_START` med løypa nullstilt (`Hendelse` «runde»); `landemerker(e)`/`nesteLandemerke(e, dist)` i HUD og på minikartet; knapp på start- og sluttskjerm, pause sier hvor de flyr; ingen resultat lagres                                                                                                                                                                                                                                        |

Pakkefysikk: pakken slippes med sledens fart og faller rett ned under spannet, der det høye kameraet ser den.
Et kast framover ble prøvd først, men banen lå i skyggen av sleden og reinsdyrene fra jaktkameraet.

Skjermbilder (`fase2-*.png` i scratchpad `sledeflukt/`): startskjerm med LEVERING og FRI FLYGING, sikte, pakke i fall,
hus med røyk, fri flyging med landemerke, pause.

### Å sjekke på iPaden (Hans)

1. Pipelevering på dag 14 (`/dev/sledeflukt?dag=14`): er landingskrysset lesbart i 480×270, og treffer en 9-åring med tommelen på SLIPP?
2. Snøen: for tett eller for glissen? `e.snøfall / 400` i `Sledeflukt.tsx` er knotten.
3. Bildetid med snø og røyk: p95 fortsatt under 18 ms?

## Ringer (gren `feat/sledeflukt-ringer`)

Foreldretest 11. november: vardene på bakken ble gylne ringer i lufta (`ringMesh`, oval åpning lik
simens `RING_X` × `RING_ALT`), i ulik høyde per etappe (`Blanding.høyde`: 45 på dag 8, opp til 85 på
julenatt; aldri et steg sleden ikke rekker å klatre). Like utenfor ringen: «NESTEN!». Oppløsningen er
hevet til 640×360 med 64 farger; målinger og skjermbilder (`ringer-*.png`) ligger i scratchpad.

Fase 2 på samme gren (foreldrebeslutninger 11. november):

| Steg                    | Status | Hvor                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Fri flyging på vidda  | ferdig | `VIDDA`/`VIDDA_BERGEN` og `VIDDA_STEDER` i `slede.ts` (`lagVidda`): antenna ved tjernet, Nordtoppen, Muren, Krystallgrotten, gårdene; etter løst dag 24 Nordlysporten og Bergen, «LANDÅS» bare etter løst dag 22. `antenneMesh`, `nordlysportMesh`, tette hus i `lagVerden` for Bergen |
| B Låste steder          | ferdig | `Ting.lås` → `låst` fra `SimOpts.dag`; `passer` hopper over, `Renderer.grå` + `låsMesh`, «ÅPNER DAG N» (24 = «ÅPNER JULAFTEN», fordi 24 er en kode) på kart og HUD; startskjermen viser låste etapper uten navn, julenatt skjult                                                       |
| C Mer å gjøre           | ferdig | Brevfugler (`fugl`, +75, kraft), rein som hopper (`hopp`), pipe som blåser tilbake (`sisteHus` + `puff`), Rampenissen på radio (`RADIO`, nordlandsk, høyst hvert 6. sekund)                                                                                                            |
| D Toppliste per spiller | ferdig | `SPILLERE`, `GameEngine.getSledeSpiller/setSledeSpiller`, `recordSledeResultat(..., spiller, utfordringDag)` → «Navn/etappe» i `nissekomm-slede` (samme server-merge)                                                                                                                  |

Målt i Playwright (ANGLE/Metal): 640×360 ligger på vsync med vidda, Bergen og låste steder (p95 16,8 ms).
Skjermbilder: `ringer-start-dag10.png`, `ringer-vidda-antenne.png`, `ringer-vidda-laast.png`, `ringer-bergen-port.png`, `ringer-bergen.png`.

Å sjekke på iPaden: p95 på 640×360 i Bergen (flest hus); om låste tinder leses som «ikke åpnet» for Håkon; om Rampenissens radiolinjer er for mange.

## Kjente hull

- Ingen søskentavle (todo.md).
- Pakkene har navn fra brevskriveren («PAKKE TIL HÅKON»), ikke fra ønsket i brevet.
- Horisontbildene `feed/slede-*.jpg` brukes ikke lenger; himmelen er en gradient med stjerner og nordlysbånd i shaderen.

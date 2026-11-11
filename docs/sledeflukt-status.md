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

Automatikk: starter på 480×270; faller til 320×180 når p95 over tre sekunder er over 18 ms (`GRENSE_MS`).

### Å gjøre på iPaden (Hans)

1. Åpne `http://<mac>:3101/dev/sledeflukt?dag=24` i Safari på iPaden (lan-modus), spill ett minutt, les p50/p95 nederst til venstre.
2. Gjenta med `&res=320`. Grense: p95 under 18 ms.
3. Sjekk at pipene på husene er lesbare i 480×270, og varme etter fem minutter.

## Klart for fase 2 (pipelevering fra dag 14, fri flukt mellom etapper)

- `Hus.pipe` i `verden.ts` er pipetoppen i verdenskoordinater for hvert hus; `lagVerden(etappe)` gir lista.
- `Verden` bygges per etappe og kan utvides med leveringsmål; `Ting`-løkka i `Sledeflukt.tsx` tegner alt fra `sim.s.first` og framover.
- Styringen har `gass` i `Styring`; en slipp-knapp kan gjenbruke `sprang`-låsen.
- Navn på pakker: `GameEngine.getSantaLetters()` (se vurderingen, pkt. 2).
- Mangler: røyk fra pipa (partikler), pakkebane, leveringspoeng i `slede.ts` (ny `Hendelse`), fri flukt uten `lengde`-mål (sim avslutter ved `dist >= e.lengde`).

## Kjente hull

- Ingen snøpartikler og ingen søskentavle (todo.md).
- Horisontbildene `feed/slede-*.jpg` brukes ikke lenger; himmelen er en gradient med stjerner og nordlysbånd i shaderen.

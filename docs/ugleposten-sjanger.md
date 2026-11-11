# Ugleposten mot sjangeren

Gap-analyse av Ugleposten (`src/components/windows/nissespill/`) mot det
spillere venter av et godt pek-og-klikk-eventyr. Spillere: Håkon (9) og
Kristian (12), iPad Safari og desktop. Eget design: ingen figurer, bilder
eller tekst fra andre spill.

| Konvensjon | Status før | Tiltak |
| --- | --- | --- |
| Se på gjenstander i lomma | Finnes (SE + gjenstand) | Panelet viser nå navn og ikon over teksten |
| Kombinere gjenstand + gjenstand | Finnes (`kombiner`) | Ingen |
| Navn på det du peker på | Bare hover (ikke på iPad) | Svaret får overskrift med hotspot-navnet |
| Notatbok «Hva gjør vi nå?» | Manglet | `Gaate.maal` + NOTAT-knapp med gjort/ugjort |
| Graderte tips | Finnes (3 nivåer, stopper på 3) | Ingen |
| Dialog som husker hva som er spurt | Manglet; alt så ubrukt ut | `spurt:`-flagg, spurte valg gråes ut |
| Svar på hvert verb på hver hotspot | SE alltid; BRUK/SNAKK hadde én fast linje | Roterende Rampenissen-linjer per verb, `Hotspot.prat` for å snakke til ting |
| Kart / hurtigreise | To scener per kapittel med utgangsknapper | Ikke nødvendig |
| Figurer som rører seg / reagerer | Snø, lampeflimmer, ring ved trykk | Trenger ny grafikk; utsatt |
| Nærbilde av gjenstand | Manglet | Dekket av overskrift + ikon i panelet (fullt nærbilde utsatt) |
| Kapittelslutt med oppsummering | Én avslutningsboble | Sluttkort med fjær og tips brukt; samme tall i kapittellista |
| Lagre-tilbakemelding | Autolagring uten tegn | «LAGRET» blinker når noe går framover |
| Lydsignaler | click/success/error | Scenebytte får egen lyd |

## Gjenstår

- Nærbilde av gjenstander med egen tegning (krever bilder per gjenstand).
- Figurer som rører seg i scenen (idle-animasjon, reaksjon på feil gjenstand).
- Tipsnedtelling («nytt tips om 30 s») hvis TIPS brukes for raskt.

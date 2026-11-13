# Statusmodell for segmenterte videoer (Hans 13.11.2026, godkjent)

Segmentdom: ✓ Godkjent · ◐ OK (lyter, brukbar; notatet er lærdom) · ✂ Kutt (tidskode + retning: kutt slutt fra T / kutt start til T; 0 kr, automatisk) · ✗ Lag på nytt (~17 kr).
Videostatus = verste segment, i rekkefølge:

1. noe ✗ → «Venter på nytt opptak: sN (17 kr)» (hos agent)
2. ellers noe ✂ → «Venter på kutt: sN @t» (hos agent, automatisk, 0 kr)
3. ellers noe ikke vurdert → «N av M vurdert» (venter på Hans)
4. ellers alle ✓/◐ → «Klar for hele videoen» (Hans: én helhetsdom på overganger, slutt, lydnivå)
5. sluttstatus: alle ✓ + hele ✓ = ✓; noe ◐ = ◐. Begge kan tas i bruk.
   Etter kutt: segmentet arver dommen (kutt fjerner bare), + kort sjekk: Hans hører 3 s før kuttpunktet, G/L. Maskinsjekken flagger kutt midt i ord.
   Ett panel: toppboksen forsvinner; «Hele videoen» er en chip som segmentene. Kø: bare 3, 4 og kuttsjekker hos Hans; 1–2 under «Hos agent» med pris.
   Dag 13 s3: Hans' «Lag på nytt» gjøres om til ✂ ved ≈0:31 («Kutt before the gibberish»).
   TIDSMASKIN skjules i guiden.

## Senere (Hans 13.11: «not pressing, fix the other first»): utskrift-review

Skjermbilde: dag/24/utskrifter viser hele guidesiden i iframe (faner, «1 Issue»-merket fra Next dev, TIDSMASKIN) i små vinduer; selve arket ses ikke. Bør: vis arkets forhåndsvisning (print-CSS / A4-side skalert, kun innholdet, uten guide-krom), én utskrift per element (`utskrift/<fil>`) med egen dom, side om side gammel/ny, lenke «Åpne for utskrift». Skjul Next-dev-merket og TIDSMASKIN i innebygde visninger.

## «Trenger mer» (Hans 13.11, godkjent; bygges etter rigg-r2 og gåtediagrammet)

Fjerde valg ved siden av G/O/L, tast `?`. Ikke en kvalitetsdom. Hans velger hva som mangler: skisse · forklaring · utskrift-forhåndsvisning · eksempel · gjennomspilling, + valgfritt notat. Elementet går til «Hos agent» med pris (skisse ~1,4 kr, forklaring 0 kr), teller ikke som avvist. Agenten leverer (skisse-jobb, eller forklaringsboks lagret på elementet); elementet kommer tilbake i «Venter på deg» med «Ny info: …». Lærdom teller forespørsler per type (signal til neste år). Gjelder alle typer.

## Kompakt vurderingsboks (Hans 13.11; bygges sammen med «Trenger mer»)

I dag: stor ramme, tittel, statuslinje, tre store knapper, notatfelt + «Lagre notat», to linjer tastaturhjelp. Ny: én tett blokk, sticky under navigasjonslinja: venstre tittel + én statusbrikke (samme celle som matrisen); deretter G · O · L · ? som små knapper (≥44 px trykkflate, slank) + notatfelt inline i samme rad (Enter lagrer; «Lagre notat»-knappen bort); merkene kollapset bak «Merker ▸» (eller vises når feltet har fokus); tastaturhjelp bak en «⌨»-knapp/tooltip, ikke alltid synlig. «44 av 410» og «hele dag 7» flyttes til navigasjonslinja. Mobil: knapper over, notat under.

## Historikk per element (Hans 13.11; bygges etter falsk-ny-fiksen)

«Historikk ▸» nederst i Element-visningen, kollapset, nyeste først, hver linje merket hvem: Hans / agent / maskin. Kilder: format-2 `historikk` + vurderinger (dom, notat, merker, tid, versjon); versjoner (-vN/.old-N sidecars: created, prompt-hash/kildetekst, «Ta i bruk» fra media-promoteringer.log); git log for kildeteksten (manus/gaater/§8: commit, dato, melding, diff); maskinsjekk (flagg per versjon fra segmenter.json/sjekk.json); agenthandlinger (kutt-logg, «Trenger mer» levert, gjenopprettet + grunn); kostnad (forbruk.jsonl per element: kall, kr). Også i list_vurderinger med `--historikk <id>`.

## Bildeinspeksjon (Hans 13.11; bygges etter boks-agenten)

Felles lysbord-komponent for alle bilder (Filer-kort, Gjennomgang Element-visning, rutenettet, gåtediagrammets utskrifts- og skissebilder): klikk eller `F` åpner fullskjerm; `Z`/hjul/klyping zoomer (Tilpass · 1:1 · 2× · 4×), dra for å panorere; lupe som følger musepekeren (`Shift` holdt, eller egen knapp), 3× med pikselskarp (nearest-neighbour) for pikselkunst/ikoner; `V` bytter gammel/ny i samme utsnitt (samme zoom/pan); ←/→ forrige/neste i gruppen; Esc lukker. I Gjennomgang: G/O/L/? virker også i fullskjerm (vurdering uten å lukke). Mobil: klyp-zoom og sveip. Ingen ny avhengighet.

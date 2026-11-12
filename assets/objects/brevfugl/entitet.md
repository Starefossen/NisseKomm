# brevfugl

```json
{
  "id": "brevfugl",
  "navn": ["brevfugl", "brevfugler", "brevfuglen", "brevfuglene"],
  "refs": {},
  "fra_dag": 5,
  "forhold": {
    "postkasse": "her lander de",
    "winter": "tømmer postkassen, åpner og nummererer fuglene",
    "julius": "mottaker"
  },
  "fakta": [
    {
      "fra_dag": 1,
      "tekst": "barna sender dem: et brev til Julius, skrevet i den virkelige verden (Landås), blir en brevfugl"
    },
    {
      "fra_dag": 1,
      "tekst": "retningen er Landås → Snøfall; ruten går gjennom nordlyset"
    },
    {
      "fra_dag": 1,
      "tekst": "de lander i postkassen på torget i Snøfall; Winter tømmer den og åpner brevene, Julius leser dem"
    },
    {
      "fra_dag": 7,
      "tekst": "i appen sender barna dem fra BREVFUGLER-vinduet (SEND BREVFUGLEN)"
    },
    {
      "fra_dag": 14,
      "tekst": "den blå fuglen er unntaket: ingen har sendt den, den kom fra Krystallgrotten med Vintervokterens brev fryst fast til vingen, og den flyr hjem til grotten dag 24"
    }
  ],
  "ikke": [
    "brevfugl fra Winter",
    "brevfugl fra Julius",
    "Winter sender brevfugler",
    "Julius sender brevfugler",
    "brevfugler fra Snøfall",
    "brev til og fra Snøfall"
  ]
}
```

## Kanon (Hans, 13.11.2026)

Barna sender brevfuglene. Et brev til Julius, skrevet hjemme på Landås, blir en fugl. Den flyr til Snøfall gjennom nordlyset og lander i postkassen på torget (`assets/objects/postkasse`). Winter tømmer postkassen og åpner brevene. Julius leser dem.

Ingen i Snøfall sender brevfugler. Winter og Julius tar imot dem.

Den blå fuglen (dag 14–24) bryter regelen, og det er poenget: «én fugl ingen hadde sendt». Den kom fra grotten, ikke fra et barn.

## Slik vises det

- BREVFUGLER-vinduet: barnas fugler flyr opp over Snøfall («N brev er på vei til Julius»).
- Snøfall TV K1: fuglene kommer ned fra himmelen og smetter inn i postkassen (`landsby-overlays.ts`, `prompts/tv/snofall-landsby/hendelse-brevfugler.txt`).
- SLEDEFLUKT: fuglene over vidda og i løypene er på vei til postkassen («Den hadde post te Julius»).
- Ugleposten K4: en brevfugl «kom med et brev fra Landås i natt».

## Skriveregler

- NORDLYS er kodeordet dag 17 og LANDÅS dag 22. I tekst barna ser før dagen er løst, heter ruten «nordover» og avsenderstedet «Bergen» (`kodelekkasje.test.ts`).
- Skriv «en fugl uten avsender» om den blå fuglen, ikke «en fugl Winter ikke har sendt».

## Åpent: venter på Hans

Låste linjer og innspilt materiale som går mot kanon. Ingen av dem er endret.

**Dag 5** («Brevfuglen fra Winter») lar en fugl med Winters skrift lande i stua. Julius-videoen er filmet og radioklippet spilt inn. To veier:

- A, uten nye opptak: brevfugler flyr hjem til avsenderen når brevet er levert. Rampenissen sendte årets første fra Bergen, Winter skrev svaret i hemmelig skrift på vingen, og fuglen fløy hjem. Video, radio, lapp og mail står ordrett. Bare tittelen og varselet endres: «Alt jeg sender er kryptert fra nå.» → «Alt jeg skriver er kryptert fra nå.»
- B, streng kanon: ingen fugl flyr sørover. Winters beskjed kom over linjen, og Rampenissen skrev den av på vingen til en fugl han brettet selv. Krever ny Julius-video (segment 2 og 4), nytt radioklipp, ny mail og ny lapp.

Tittel dag 5, velg én: «Skriften på vingen», «Winters hemmelige skrift», «Fuglen som kom tilbake» (bare med A).

**Dag 14**

- PS: «Winter har aldri fått en fugl han ikke har sendt.» → «Winter har aldri fått en fugl uten avsender.» (også storyboard dag 14, «Belønning»)
- Varsel (to steder): «WINTER: Brevfuglene er sluppet.» → «WINTER: Brevfuglene er åpnet.»
- `brevfugl-historie.txt`: «Winter svarte med en fugl brettet av brevpapir. Siden har alle brev til og fra Snøfall fløyet selv.» → «Siden har brevene til Snøfall fløyet selv. De lander i postkassen på torget.»
- Radio (spilt inn): «Fuglan fløy ut fra pakkesentralen som ei sky.» → strykes, eller «Postkassen va så full at lokket sto rett opp.»

**Manus uten kode:** app-tekster A8, «Skriv til Julius. Winter sender brevet med neste fugl.» → «Skriv til Julius. Brevet flyr selv.» (teksten står ikke i appen i dag)

## Utseende

Står i `beskrivelse.txt` (`{{objects/brevfugl}}`).

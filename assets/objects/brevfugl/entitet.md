# brevfugl

```json
{
  "id": "brevfugl",
  "navn": ["brevfugl", "brevfugler", "brevfuglen", "brevfuglene"],
  "refs": {},
  "fra_dag": 5,
  "forhold": {
    "postkasse": "her lander de",
    "winter": "tømmer postkassen og arkiverer brevene",
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
      "tekst": "de lander i postkassen på torget i Snøfall; Winter tømmer den og arkiverer brevene i arkivet over hva alle barn ønsker seg til jul, Julius leser dem"
    },
    {
      "fra_dag": 1,
      "tekst": "når brevet er levert, flyr fuglen hjem til avsenderen; Winter kan skrive et svar på vingen først"
    },
    {
      "fra_dag": 5,
      "tekst": "dag 5: Rampenissen sendte årets første brevfugl fra Bergen; den kom hjem med Winters hemmelige skrift på vingen"
    },
    {
      "fra_dag": 1,
      "tekst": "kremhvitt brettet papir, ikke fjær; den blå fuglen er eneste unntak i farge"
    },
    {
      "fra_dag": 7,
      "tekst": "i appen sender barna dem fra BREVFUGLER-vinduet (SEND BREVFUGLEN)"
    },
    {
      "fra_dag": 14,
      "tekst": "den blå fuglen er unntaket: ingen har sendt den, den kom fra Krystallgrotten med Vintervokterens brev fryst fast til vingen, og den flyr hjem til grotten dag 24"
    },
    {
      "fra_dag": 1,
      "tekst": "Winter setter en merkelapp av kremhvitt papir med jernmalje i foten på alle fugler som lander (ankomst og avsender); den blå fuglens lapp har tomt avsenderfelt, bare frostrunen K i rim"
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

Barna sender brevfuglene. Et brev til Julius, skrevet hjemme på Landås, blir en fugl. Den flyr til Snøfall gjennom nordlyset og lander i postkassen på torget (`assets/objects/postkasse`). Winter tømmer postkassen og arkiverer brevene. Det er hovedjobben hans: alt barna ønsker seg til jul, skal stå i arkivet. Julius leser dem.

Når brevet er arkivert, flyr fuglen hjem til avsenderen. Winter kan skrive et svar på vingen først. Slik kom fuglen dag 5 («Skriften på vingen») til stua: Rampenissen sendte årets første fra Bergen, og den fløy hjem med Winters hemmelige skrift.

Ingen i Snøfall sender egne brevfugler. Winter og Julius tar imot dem.

Den blå fuglen (dag 14–24) bryter regelen, og det er poenget: «én fugl ingen hadde sendt». Den kom fra grotten, ikke fra et barn.

Nordlyset er brevfuglenes vei. Folk går gjennom Hullet i hekken (`assets/locations/portalen`), og sleden bruker portkorridoren.

## Slik vises det

- BREVFUGLER-vinduet: barnas fugler flyr opp over Snøfall («N brev er på vei til Julius»).
- Snøfall TV K1: fuglene kommer ned fra himmelen og smetter inn i postkassen (`landsby-overlays.ts`, `prompts/tv/snofall-landsby/hendelse-brevfugler.txt`).
- SLEDEFLUKT: fuglene over vidda og i løypene er på vei til postkassen («Den hadde post te Julius»).
- Ugleposten K4: en brevfugl «kom med et brev fra Landås i natt».

## Skriveregler

- NORDLYS er kodeordet dag 17 og LANDÅS dag 22. I tekst barna ser før dagen er løst, heter ruten «nordover» og avsenderstedet «Bergen» (`kodelekkasje.test.ts`).
- Skriv «en fugl uten avsender» om den blå fuglen, ikke «en fugl Winter ikke har sendt».

## Utseende

Står i `beskrivelse.txt` (`{{objects/brevfugl}}`).

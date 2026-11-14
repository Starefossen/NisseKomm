# iPad-sjekkliste før 1. desember

Test på en ekte iPad (Safari, https-adressen barna bruker). Huk av, skriv avvik bak punktet.
Nettleserdelen er allerede testet i WebKit: `mise run test:gjennomspilling:webkit` (`ORIENT=portrait` for stående).

## Pålogging og første dag

- [ ] Innlogging med tre ord: tastaturet kommer opp, feltene skjules ikke, LOGG INN kan trykkes
- [ ] Day1Boot (1. des): spiller, kan hoppes over med et trykk
- [ ] Julius-videoen: starter ikke av seg selv (forventet), starter med trykk, lyden kommer
- [ ] Lyd: bryteren på siden er ikke på stille; MUSIKK og EFFEKTER virker

## Skjerm og tastatur

- [ ] Liggende: skrivebordet passer uten rulling
- [ ] Stående: skrivebordet er brukbart; spillene sier «Snu skjermen»
- [ ] Tastaturet dekker ikke kodefeltet i KODETERMINAL, navnefeltet (dag 22) eller brevfeltet i BREVFUGLER
- [ ] Riktig kode: PS fra Julius og «ÅPNE DAGBOK» vises

## Spill

- [ ] SLEDEFLUKT: styring med en finger, SLIPP og FART/BREMS virker, ingen krasj i WebGL
- [ ] SLEDEFLUKT: flyter jevnt (se `?res=320` om det hakker); legg merke til iPad-modell
- [ ] Gå til hjemskjerm og tilbake midt i spillet: spillet starter på nytt, ikke svart skjerm
- [ ] UGLEPOSTEN: trykk og dra gjenstander, lesbar tekst

## Varsler og kamera

- [ ] Varsler fra Rampenissen og IQ: ikke dekket av kanten, lukkes med trykk
- [ ] SYMBOLSKANNER over https: kameraet spør om tillatelse, skanner et utskrevet QR-kort
- [ ] SYMBOLSKANNER: nekt kameraet, skriv 4-tegnskoden i stedet
- [ ] Skann et kort før dagen det hører til: avvises

## Synk, batteri og søvn

- [ ] To iPader: løs en dag på den ene, den andre viser den innen et minutt
- [ ] To iPader: Brev til Julius og Sledeflukt-rekorder dukker opp på begge
- [ ] Lås skjermen i 10 minutter, åpne igjen: fortsatt innlogget, fremgangen er der
- [ ] Batteri: en halv time i Sledeflukt, noter prosent brukt og om iPaden blir varm

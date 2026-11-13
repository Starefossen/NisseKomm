# Gjennomgang: alt barna leser i appen, dag 1–24

13.11.2026. Bare lesing; ingen tekst er endret. Kristian 12, Håkon 9, Hanna 5.

**Lest:** `uke1–4_oppdrag.json` (NisseMail, PS, bonus-PS, krypto-hint, bonusoppdrag, skjerm_teaser), `statisk_innhold.json` (varsler, NisseNet-filer, NisseStats-målere og -logg), `tidbits.json`, `opplasinger.ts` (dytt og mailpuff), `eventyr.json`, `merker.json`, A-delen i `app-tekster-2026.md` (Kuldes meldinger, finale), Julius-transkriptene (som kryssjekk), `beslutninger.md`, brevfugl-entiteten.
**Kjørt:** `kodelekkasje.test.ts` og `entiteter.test.ts` (53 grønne). Ingen kodeord står bokstavelig i synlig tekst før dagen sin.
**Ikke lest:** Ugleposten-kapitlene, Sledeflukt-radio, radioklippene, `guide-innhold.json`. Dagtekstene er ikke sammenlignet linje for linje med `historie-2026.md` og `storyboard-2026.md`; jeg har slått opp i dem der noe skurret.

Hans' føring er fulgt: forslag bare der noe er galt. Hvert funn er merket **feil**. Smak er utelatt, bortsett fra det som står som spørsmål til Hans nederst.

## Funn, rangert

### Høy

1. **feil · dag 5 · NisseMail, varsel, PS · brevfugl-kanon.** Mailen sier «i natt landet årets første brevfugl i Bergen. Winter har skrevet noe rart på vingen». Det leses som at Winter sendte den. Kanon 13.11: Rampenissen sendte årets første fra Bergen, og den kom hjem med Winters skrift. PS sier «han sender alt kryptert fra nå», og «Winter sender» står på ikke-lista.
   - Mail: «Og: brevfuglen jeg sendte til Julius, årets første, kom hjem i natt. Winter har skrevet noe rart på vingen, for han er sikker på at noen leser alt som flyr over linjen.»
   - Varsel: «WINTER: Årets første brevfugl er arkivert og sendt hjem til Bergen. Svaret står på vingen. Kryptert.»
   - PS: «… han skriver alt kryptert fra nå.»

2. **feil · dag 15 · julius_ps · synlige understreker.** «man skal stå _ved_ gryta, ikke _i_ den» vises med understrekene, fordi `JuliusVideo.tsx` skriver PS som ren tekst. Forslag: «man skal stå ved gryta, ikke oppi den.»

3. **feil · dag 13 · NisseMail · motsier video, fil og Kuldes egen linje.** «Kulde satt og så på lysene i verkstedet hele natten.» Julius, `lucia-tradisjon.txt`, PS og spøkelsesbildet sier alle at Kulde så lysene *gjennom linjen*. Kulde er under Nordtoppen og kommer ikke fram før dag 21. Forslag: «Kulde så på lysene våre gjennom linjen hele natten. Bare så.»

4. **feil · dag 1 · `/SYSTEM/readme.txt` · røper dag 10.** «En mystisk digital frost prøver å låse kanaler og stjele farger» er synlig fra dag 1. Filen står som «ikke rørt» i app-tekster D og har fjorårets tone («Velkommen tilbake», «våre tre beste agenter»). Forslag: «NISSEKOMM – LES MEG. IQ har lagt en direktelinje fra Snøfall til stua deres: Snøfall TV, NisseMail og video fra Julius. Linjen er ny. Hvis noe skurrer, er det ikke dere. – IQ»

5. **feil · dag 17 · NisseStats-logg · gir bort svaret.** «ORAKELET: Grønt lys over polarhimmelen i natt» vises fra morgenen dag 17, før koden. Ordet står der ikke, så testen fanger det ikke, men en 12-åring trenger ikke Julius etter den linjen. Forslag: sett `fra_dag` til 18, eller skriv «ORAKELET: Noe lyste over antennen i natt. Første signal tilbake.»

### Middels

6. **feil · dag 19 · NisseMail · uklar henvisning.** «IQ bygde en fôringsautomat til reinsdyrene i natt. Den skjøt førti av dem gjennom taket.» «Dem» peker på reinsdyrene. Forslag: «Den skjøt førti fôrbiter gjennom taket.» Vitsen og «Jeg er et åsted nå» står urørt.

7. **feil · dag 1 · julius_ps · stavefeil.** «tre esker se-vitamin» ser ut som lydskrift fra talemanuset. Forslag: «C-vitamin».

8. **feil · dag 14 · NisseMail og varsel · «åpnet» betyr to ting.** Dag 7 sier «Brevfugler er åpen» om vinduet. Dag 14 sier «Winter åpnet brevfuglene i natt!» og «Brevfuglene er åpnet», som leses som den samme nyheten en gang til. Julius sier det samme i videoen, så meningen må beholdes. Forslag:
   - Mail: «Winter brettet ut nattens brevfugler! Og det kom én fugl ingen hadde sendt.»
   - Varsel: «WINTER: Nattens brevfugler er brettet ut. Én har ingen avsender.»

9. **feil · dag 9 · kalenderlinje · motsier premisset.** «Pil har telt alle iskrystallene i grotta.» Hele historien hviler på at ingen har vært i grotten på et år, og grotten navngis først dag 10–15. Forslag: «Snøfall-fakta: Pil har telt iskrystallene på verkstedruta. Han mistet tellingen på ti tusen. Tre ganger.»

10. **feil · alle dager · `/OPPGAVER/dagens_oppdrag.txt` · rekkefølgen stemmer ikke med appen.** Filen sier mail (steg 2) før video (steg 3). Appen åpner videoen først, og mailpuffen sier «Ferdig med Julius? Bra.» Forslag: bytt om steg 2 og 3.

11. **feil · dag 24 · julius_ps · finalens poeng er utydelig.** «…jeg har lest den. Alle tre.» Beslutning 11.11 sier at det skal sies rett ut at alle tre sto på listen. Forslag: «…og jeg har lest den. Dere står på listen, alle tre.»

12. **feil · dag 3 · NisseMail · anglisisme.** «noe som blør gjennom bildet på 85,0». Forslag: «noe som trenger gjennom bildet på 85,0». Uhyggen er den samme.

13. **feil · dag 21 · NisseMail · gjentar Julius' siste setning.** Mailen slutter med «Kom hjem.», og Julius slutter med «Kom hjem i kveld. Vi er her.» Regelen i app-tekster forbyr gjentakelsen, og den skurrer fra en som sitter i stua deres. Forslag: «Jeg holder vakt bak muren til dere er her.»

### Lav

14. **feil · dag 9 · julius_ps · krypto 1.** PS sier at blått er «fargen til det som fryser», mens hintet dag 12 spør etter «det som er alene». Forslag: «…fargen til det som fryser alene.»
15. **feil · dag 24 · NisseStats-logg.** «JULIUS: Landet på Landås. God jul.» Mail og PS sier at Trixter leverte, og Julius sitter på kontoret i videoen samme morgen. Forslag: «TRIXTER: Landet på Landås i natt. Tre esker levert. Én nisse med hjem.»
16. **feil · tidbits · rampenissens_dagbok.** «Dag 8: Navnet er ute. Kulde.» Navnet kom dag 7. Forslag: «Dag 7: Navnet er ute. Kulde. …» og «Dag 8: Bygde et tårn. Det hadde aura. …»
17. **feil · nordlandsk · puff og mailpuff.** «Æ har skrevet te dokker!» bør være «skrive», som i fjær-varselet. «mye» (puff, to steder) står mot «mykje» (tidbits, ordboka); velg én form.
18. **feil · dag 24 · NisseMail.** «Ingen vekking; det var sånn jeg kom.» er vanskelig for Håkon. Forslag: «Jeg vekket ingen. Sånn kom jeg også.»
19. **feil · dag 4 · kalenderlinje.** «solbrillene var ikke hans. Pilen var det.» Hvilken pil er uklart, og ordet forveksles med Pil. Radiomanusets skriveregel har et «en pil»-poeng dag 4, som jeg ikke har lest. Sjekk mot det før noe endres.
20. **feil · navn i mailene.** Håkon mangler dag 5, 10 og 22, og han gjør hovedjobben alle tre dagene. Hanna mangler dag 7, 17, 20 og 21, selv om nissemor-teksten gir henne noe å gjøre. Ordgrensen er 90, og dag 7 står på 89. Enkle tillegg: dag 22 «Håkon, du fant sokk 1 og 2.» og dag 17 «Hanna, hvis du vil: du drar i sløyfen.»
21. **feil · `config.sys`.** «Hjemmebro: Skjerm + Fleet aktivert» er internt navn. Forslag: «Hjemmebro: skjermen på kjøkkenet».

## Sjekket uten funn

- **Lekkasjer:** testen er grønn. Jeg har i tillegg lest for hint som gir svaret uten å inneholde ordet; funn 4 og 5 er de eneste. Beskrivelsen i `eventyr.json` nevner Kulde, men vises først når dag 7 er løst. Låste milepæler viser bare «Låst».
- **Kanon:** ingen leketøysfabrikk, ingen Frøya eller andre seriefigurer i barnetekst, ingenting om Hjerteruds utseende. «God andre/tredje/fjerde søndag i advent» er riktig dag 6, 13 og 20. Ametysten og fargen dag 24 henger sammen i mail, PS, det tinte brevet og finalen. «Mørket» i `hjertets-hemmelighet.txt` følger beslutningen om 2025.
- **Stemmer:** mailene er bokmål, slik beslutningen sier om lang skrevet tekst. Nordlandsken i puff, idle og kalender er jevn, bortsett fra funn 17.

## Skal ikke røres

- **Kuldes linjer** på 85,0 («Jeg la litt rim på den, bare så jeg kunne holde i den», «Ingen hører på meg», «Nå ser han opp. Nå ser han hit.»). Rolige og nifse uten trusler. Runeordene under (SE MEG, ALENE) det samme.
- **Vendingen dag 12–16:** Julius' «Jeg tok feil», IQs «Jeg glemte å slå det av», «Det er ikke en inntrenger. Det er mitt.», og mailen dag 16 («Ikke for å ødelegge … det eneste som får Winter til å se opp»).
- **Dag 20–21:** «Kulde når huset da. Ikke for å skade. Fordi det er der lyset er.» og «Dere trenger ikke være redde. Dere trenger å være hjemme.» Spenningen skal stå, også for Hanna.
- **Rampenissens kant:** begravelsen dag 13 («Jeg er død nå», «HAN SPISTE 11»), «Jeg er et åsted nå», bakt potet som «holder tankene inne», Rudolf som «la igjen noe på gulvet», slem-lista, snackkartet.
- **IQ:** «Delvis min feil», «Trykk satt til "mye"», «alt virker, bortsett fra det som ikke virker», ordboka med tusjrettelsene.
- **Winter:** «Nummerert. Arkivert. Nr. 4 112», autosvaret, «Han ble telt som 1,5».
- **Tråder som går opp:** kaffetrakteren (PS 1 → dag 2), tre sikringer (dag 2 → dag 5), Pils farger (PS 3, 6, 9 → krypto 12), sirkelen på kartet (18 → 20 → 21), lyktene (6 → 17 → 23), fruktskålen (1 → 24), Hjerteruds oppskrift i margen (dag 15).
- **Slang:** «sigma» dag 8 og «seks sju» dag 20, Rampenissen som bommer («ei slags vaffel», «aura er en slags lue»).

## Avgjørelser for Hans

1. **«Landås» før dag 22.** Testen tillater ordet. Det står i PS dag 16–19, varselet dag 19, `config.sys` og NisseStats, mens Sledeflukt, Ugleposten og brevfuglregelen skjuler det og sier «Bergen». **Anbefaling:** behold; barna vet hvor de bor, og dag 22 handler om Winters tall. Rett regelen i brevfugl-entiteten så de to ikke står mot hverandre.
2. **Hvem er Trixter?** CONTENT_GUIDE og beslutning 75 sier rein. I tekstene skriver han logg, tegner rutekart, har lue og hjelm, pakker sleden og legger ametystene under treet. `om-snofall.txt` lister ham uten forklaring. **Anbefaling:** behold tvetydigheten; legg til én linje i `om-snofall.txt`: «Trixter leder sleden. Rudolf følger etter, som regel.»
3. **«Julenatt».** Flyvningen over grotten skjer natt til 24. (gaven ligger der om morgenen), men PS dag 18, rutekartet og NisseStats kaller den «julenatt». **Anbefaling:** bytt til «natt til julaften» i PS 18 og kartoverskriften. Historien er låst, så dette krever ja fra deg.
4. **Slang utenfor beslutningen 13.11** (Sledeflukt, Ugleposten, NisseNet): «cooked» og «minus aura» i feilkode-svar, «rizz» i idle, «Goated» i kalenderen dag 14. **Anbefaling:** behold alt, det er i karakter. «Goated» står ikke på ordlisten din; si fra om det skal ut.
5. **Funn 5 (dag 17):** flytte logglinjen til dag 18, eller skrive den om. **Anbefaling:** flytt; teksten er god etter koden.

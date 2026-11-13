# Gjennomgang: Nissemor-guiden og småspillene (13.11.2026)

Bare lesing. Ingen kode, tekst eller medier er endret. Etter beskjed fra Hans er alt merket **feil** (lekkasje, kontinuitetsbrudd, uklart for en travel forelder, ute av karakter). «Smak» er utelatt, med ett unntak som er merket. Kilder: `docs/gaater-2026.md`, `docs/historie-2026.md` §8/§8.1, `src/data/statisk_innhold.json`, `src/data/tidbits.json`, `src/components/windows/` (sledeflukt, snofall-tv, Brevfugler, NisseStats, NisseMusikk, NisseKrypto).

Ikke lest i detalj: Historien- og Bibliotek-sidene slik de ser ut i nettleseren, Søk, og gåtekartets brikketekster for dag 4–16, 18–21 og 23. Ingenting er sjekket på telefon.

## A) Foreldrenes innhold

### Funn, rangert

**A1. Høy, feil: ukedagene i byggeplanen for dag 1 er fra 2025.**
`gaater-2026.md` linje 823–900 («Fredag 28.», «Lørdag 29.», «Søndag 30.», «Man 1. des») og utskriftene `dag01-flylogg/frakt/linjekort/ferdskriver/tradkort.tsx` («Fredag 28. november …»). I 2026 er 28.11 lørdag, 29.11 søndag, 30.11 mandag og 1.12 tirsdag. Resten av dokumentet («Dag 1 (ti)») og radioen («God lørdag!» 28.11) har riktig.
Konsekvens: «Lørdag 29.: handel, 3 esker klementiner, be om tomme esker» faller på en søndag med stengte butikker. Den store kvelden (30 min, «etter at barna sover») blir en mandag.
Forslag: Lør 28. (ferdskriver, utskrifter og handel av klementiner), Søn 29. (etiketter, tråd), Man 30. kveld (plassering). Flytt handelen til lørdag i både steg-tabellen og sjekklista, og rett «hvor»-tekstene i de fem utskriftene. `forberedelser/page.tsx` kobler sjekkliste og byggeplan på de tre første bokstavene i tittelen, så begge må endres likt.

**A2. Høy, feil: «Skriv ut» står to steder med to ulike planer.**
(c) «Innen 25. november» sier: skriv ut hele PDF-en, klipp alt og legg i 24 konvolutter. Kveldens sjekkliste starter likevel hver dag med «Skriv ut: dagNN-….pdf», og på ti dager også «Skriv ut reservesett: (samme fil)». På dag 3 inneholder fila allerede reservekortet. En forelder kl. 22 vet ikke om hun skal til skriveren eller til konvolutten.
Forslag: velg én modell (se beslutning 1). Med konvolutter: første linje blir «Hent konvolutt N (dagNN-x.pdf)», fortsatt med utskriftslenke, og reservelinjen fjernes.

**A3. Middels, feil: oransje teip eller oransje papir til ferdskriveren.**
Handlelisten sier «Oransje papir, i stedet for gaffateip». (c) og sjekklista «Før 28. nov» sier «oransje teip (1 rull)». Rekvisittlisten sier «gaffateip eller papir». Forslag: «oransje papir» alle tre steder, siden det er det som står på handlelisten.

**A4. Middels, feil: suvenirene til dag 24 står ikke i kveldslistene.**
Perlen (dag 3), rødfilteret (dag 10) og båndbiten (dag 17) skal i konvolutt «24» samme kveld. Det står bare i en løs setning under tabellen i (c), som dagvisningen ikke viser. Dag 24 forutsetter også «den tomme fraktesken fra dag 1», og den nevnes ikke i ryddelista 1. des.
Forslag: én linje i sjekklista for dag 4, 11 og 18 («Legg perlen / filteret / en bit av båndet i konvolutt 24»), og «Ta vare på én liten frakteske til dag 24» under «Man 1. des, etter koden» (blir «Tir 1. des» etter A1).

**A5. Middels, feil: klementinen til dag 24 er fire uker gammel.**
«1 klementin RESERVE» legges i ferdskriveren 28.11, og dag 24 bruker «den siste klementinen fra Hjerteruds proviant». Den er tørr eller mugnet til jul. Forslag: sjekklista dag 24 sier «en fersk klementin (den siste fra provianten)», og reserveklementinen spises i uke 1.

**A6. Lav, feil: småfeil i sjekklistene.**
- Dag 23: «Hyssing til stjernene» står etter «Heng de tolv stjernene», og hyssingen er allerede tredd i november. Fjern linjen.
- Dag 16: ostehøvelen ligger «i badeskapet», tallappen 5 «på badehyllen», og skissen sier «badehylle». Det er samme sted. Bruk ett ord.
- Dag 6: «en lampe» (sjekkliste), «lommelykt» (c), «mobillykt» (materialer). Skriv «mobillykt» alle steder.
- Dag 24: hint 1 sier «pappesken ved gullkonvolutten», men esken står under treet og konvolutten henger i treet. Listen har heller ingen handling for dukken. Legg til «Legg bort Rampenissen (han reiste i natt)».
- §8-innledningen: «fire helgestreker (5, 6, 12, 17)», men dag 17 er en torsdag. §8 dag 1 sier «to revnede fraktesker», byggeplanen sier én.
- /forberedelser: handlelisten ligger nederst, etter kortet «Innen 25. november», som begynner med «Kjøp alt under lokalt». Flytt den opp under det kortet. Safran og svart papir står i tillegg som egne kjøpepunkter.

### Hintene
Trappen holder. Trinn 1–3 peker på sted, observasjon og kobling uten å gi bokstaver. Trinn 4 gir posisjoner og en definisjon, men aldri ordet, og det er riktig nivå for et siste dytt. Ingen funn. Krypto 2 står under B5.

### Må ikke røres
- Lappene fra Rampenissen («Krabb! – R», «Så veltet jeg. Unnskyld. – R») og streker som bærer brikken.
- Den mørke humoren i §8: egen begravelse («HAN SPISTE 11.»), løsepengebrevet («GI OSS ALLE PEPPERKAKENE. ELLERS.»), teipomrisset, «reinsdyrbæsjen».
- «Hanna (hvis hun vil)» på hver dag og bakt inn i hintreplikkene.
- Byggeplanens presisjon (15 / 20 / 35 / 20 klementiner, «Det skal se ut som 30 kilo. Det er 7.»).
- Morgenrådet 24.–30. november: knitringen, garntråden, klementinen på miksebordet. Stemmer med kanon og riktige ukedager.

## B) Småspill og visninger

### Funn, rangert

**B1. Høy, feil (lekkasje): NisseStats-loggen dag 17.**
`statisk_innhold.json` linje 567, `fra_dag: 17`: «ORAKELET: Grønt lys over polarhimmelen i natt. Første signal tilbake.» Linjen vises om morgenen før koden NORDLYS. Beslutningen 13.11 for dag 17 sier «verken farge eller himmel sies før koden, så tegnene trengs». `kodelekkasje.test.ts` ser bare etter selve ordet.
Forslag: «ORAKELET: Noe svarte fra nord i natt. Første signal tilbake.» Alternativt `fra_dag: 18`.
Relatert: K1 spiller `landsby-nordlys.mp4` hele dag 17, også før koden (`channels.ts` linje 250). Historien §9 planlegger loopen, men den viser nettopp farge og himmel. Se beslutning 2.

**B2. Middels, feil (lekkasje): NisseStats-loggen dag 22.**
Linje 587, `fra_dag: 22`: «WINTER: Snill-listen er åpen. Jeg trenger stedet i tall.» Den sier før koden at svaret er et sted. Beslutningen 13.11 flyttet «hvor dere bor» til PS for å unngå akkurat det.
Forslag: «WINTER: Snill-listen er åpen. Én rubrikk mangler. Jeg godtar bare tall.» Det beholder pedanteriet uten å si «sted».

**B3. Middels, feil (kanon): «Landås» før dag 22 er løst.**
- Loggen linje 595, `fra_dag: 24`: «JULIUS: Landet på Landås. God jul.» Vises julaften uansett om dag 22 er løst.
- Introen til etappen «Julenatt over grotten» (`slede.ts`): «… så setter vi kursen mot Landås.» Styres bare av dag 24.
Fri flyging gjør det riktig («LANDÅS» bare med dag 22 løst, ellers «BERGEN»). Testen har LANDÅS på en tillatt-liste, så den fanger det ikke. Dette gjelder bare en familie som ligger etter. Forslag: «Bergen» begge steder, eller samme vilkår som i fri flyging.

**B4. Middels, feil (løfte som ikke holdes): radiolinjen `utfordring`.**
`RADIO.utfordring`: «Utfordring klart! Æ sei det på Morgenrådet i morra.» Klippene er spilt inn på forhånd, og jeg fant ingen sledefelter i `src/lib/mcp/`, så Birk og Lyng får neppe vite om utfordringen. En tolvåring vil vente på det. Koordinator bør bekrefte hva `get_kid_context` faktisk sender.
Forslag: «Utfordring klart! Æ sei det te bamsan. Dem e imponert.»

**B5. Lav, feil: småting.**
- Dialekt mot «Skrivemåte» i radiomanuset, i `RADIO`/`STEDER`: «Æ telte den» → «telt», «Fly ein annen plass» → «en anna plass», «seinar» → «seinare», «gaven» → «gava», «Husan har piper» → «pipa». Bare bøyning, ikke innhold.
- `RADIO.krasj`: «Det va bare et tre.» kommer også når sleden treffer en tind eller Muren. Forslag: «Det va bare et tre. Eller et fjell.»
- Frekvenser med punktum: «85.0 MHz» (`NisseKrypto.tsx` linje 324) og «90.0 MHz» (`NisseMusikk.tsx` linje 240). Ellers står det «85,0» og «90,0».
- Loggen linje dag 14: «WINTER: Brevfuglene er åpnet.» Brevfugler-vinduet åpner dag 7, så «åpnet» leses feil. Forslag: «WINTER: Postkassen er tømt. Én blå fugl ingen har sendt.»
- Krypto 2: hintet er hele fasiten («grønn sol → rødt hjerte → …»), mens krypto 1 er en ekte gåte. Trolig med vilje fordi kartet trengs dag 21. Ikke rør uten beslutning.

**B6. Smak, tatt med fordi det berører kanon fra i dag: «BREVFUGL FANGET +80».**
HUD-teksten og `RADIO.fugl` («Brevfugl i sekken!», «Du fanga en brevfugl. Den hadde post te Julius.»). Fuglene er barnas egne brev på vei til postkassen på Torget, så å fange dem stopper posten. Bare HUD-ordet skurrer: «BREVFUGL FULGT +80» ville holde. Replikkene er gode og bør stå. Se beslutning 3.

### Sjekket uten funn
- Ametyst og «lilla» finnes bare i dag 24-tekster og i tinebrevet (`Brevfugler.tsx`, vises etter dag 24-koden).
- Ingen leketøysfabrikk. «GAVER PAKKET … i pakkesentralen» er riktig. Hjerterud er riktig brukt overalt; ingen «Nissemor» i barnetekst.
- «Vintervokteren» i Brevfugler vises først etter tining. Kuldes navn på K-kanalen brenner inn først etter koden dag 7 (dekket av test). Måleren «KULDE PÅ 85,0» er trygg fordi NisseStats åpner dag 16.
- Låste etapper og steder viser «ÅPNER DAG N» uten navn, Julenatt er skjult, og Bergen-porten åpner med koden.
- Trixter leder sleden og Rudolf har gjesteroller, i tråd med beslutningen 11.11.

### Må ikke røres
- Slangen i `RADIO`: «Æ e cooked. Sleden e cooked. Rudolf e medium.», «Æ e locked ute, æ står på trappa.», «Chat e bamsan. Dem såg det.», «Æ prøvd å rizze låsen. Låsen va ikkje interessert.», «AURA-GJELD. Æ BETALE.» Alt er på Hans' liste over gjeldende slang, og vitsen er at Rampenissen bommer litt.
- «Æ håpe den ikkje bæsja på pakkan» og «Æ sa et ord Julius ikkje like. Inni mæ.»
- Kuldes linjer på 85,0: «Jeg snudde båndet til Winter. Nå ser han hit.», «Lysene deres. Jeg husker ikke når jeg så lys sist.» Uhyggen er dosert for en niåring og avslører ingenting.
- Winter: «Nr. 4 112», autosvaret, «Han leser alle emnefeltene. Alle.»
- IQ: «Nesten. Kanskje.», «9 004 ganger nesten ferdig», «40 gulrøtter hentet ned fra taket».
- Tidbits: slem-lista, dagboka («Aura er en slags lue, tror jeg»), «2 (begge het Bjarne)», SKIBIDI som hemmelig ord. Det er utdatert, og det er poenget.
- Tinebrevet: «Lilla smelter ikke. Det er fra meg.»
- «Lysgardina» i fri flyging: nordlyset er der fra dag 8 uten å bli nevnt ved navn.

## Beslutninger for Hans (maks 5)

1. **Utskrifter:** alt i november i 24 konvolutter, og kveldslista sier «Hent konvolutt N»? Eller utskrift kveld for kveld, og novemberpunktet strykes? (A2)
2. **Dag 17 på Snøfall TV:** skal nordlysloopen på K1 vente til koden er løst, som signaturen dag 7 gjør, eller er bildet lov før koden så lenge teksten tier? (B1)
3. **«BREVFUGL FANGET»:** behold som spillord, eller bytt HUD-ordet til «FULGT»? Replikkene står uansett. (B6)
4. **Hanna i Sledeflukt:** «HVEM FLYR?» har bare Kristian og Håkon, mens Brevfugler har alle tre. Med IQ-assistenten kan en femåring fly. Med vilje, eller skal hun ha en knapp, med eller uten rekordliste?
5. **Krypto 2:** skal hintet fortsatt være fasiten (trygt for dag 21), eller strammes til nivået i krypto 1, med den betingede PS-en dag 20 som sikkerhetsnett? (B5)

# NisseKomm 2026 – Gåter, praktikk og materialer

Steg 1 i byggerekkefølgen. Kilder: `docs/historie-2026.md` (låst), `docs/storyboard-2026.md`, `CONTENT_GUIDE.md` og kodene i `src/data/uke1–4_oppdrag.json`. Ingen kode er endret. Historiebeats er ikke rørt; det som er bestemt her, er hvordan hver dags to brikker ser ut, hva de faktisk gjør med dem, og hva en forelder må ha klart.

**Status: LÅST 10. november 2026.** De seks avgjørelsene i (d) er godtatt av Hans, og uavhengig gjennomgang (21 funn) er innarbeidet. Endringer krever eksplisitt ja. Endret etter ja fra Hans 10. november; materiallister rettet 10. november. Kontinuitet rettet 11. november etter ja fra Hans. Dag 6, 8, 10 og 13 endret 13.11 etter ja fra Hans. Feltet «Sjekkliste» lagt til per dag 12.11 etter ønske fra Hans; gåtene er ikke endret.

**Revisjon 10. november 2026 (vanskelighet).** Godkjent av Hans: gåtene er for Kristian (12) og Håkon (9); Hanna (5) har valgfrie roller som aldri blokkerer. To meta-gåter (Frostrunene, Trixters kart), blindspor med feil bokstav der Julius' setning avgjør, og hevet nivå på 21 dager. Alle koder, brikke H + S, taket på 40 % og oppsett under 5 minutter på hverdager står. Julius-videoene dag 2–4 er ferdige og uendret. Standardvalg merket «standardvalg, kan endres» i (e).

## Regler som gjelder alle dager

- **To brikker.** Brikke H finnes bare i huset. Brikke S finnes bare i Julius' video, i siste setning. Ingen av dem holder alene. Svaret står ikke skrevet noe sted.
- **Taket på 40 %.** Huset viser høyst 40 % av bokstavene (4–5 bokstaver: 1–2, 6–7: 2, 8–9: 3, 12: 4), aldri første og siste sammen, aldri to bokstaver ved siden av hverandre. Julius sier aldri ordet, et synonym eller første lyd. Verktøyfiler i NisseNet gir regel, aldri bokstaver. På talldager gir huset tallene og Julius regneregelen.
- **Frostlappen.** Standardkortet for orddager: like mange ruter som bokstaver, de fleste fylt med iskrystall, noen med bokstav. Rutene er nummerert svakt i hjørnet, så rekkefølgen aldri går tapt. Trykkes som A6-kort på tykt papir fra `/nissemor-guide/printout`.
- **Roller.** H9 = Håkon (9), K12 = Kristian (12). Gåten er deres: Håkon henter, teller, sorterer og bretter; Kristian slår opp, dekoder, regner og taster. Målet er at Håkon trenger Kristian, og at Kristian trenger 5–15 minutter ekte tenking på hverdager, lenger i helgene og på milepælsdagene 7, 12, 15, 21 og 24. **Hanna (5)** er med gjennom streken, radioen, historien og videoene. Hver dag har én linje «Hanna (hvis hun vil)»: en morsom ting hun kan gjøre, som Håkon eller Kristian alltid kan gjøre i stedet. Ingen tekst sier «bare Hanna». Symbolkortene skanner hun som ritual, ikke som steg.
- **Tegnene (meta 1).** Hvert kort huset legger igjen har et lite tegn i hjørnet, ett per bokstav A–Å, fra et oppfunnet tegnsett («Snøfalls gamle skrift», aldri ekte runer). Synlige bokstaver viser alltid sitt riktige tegn. ❄-ruter i ekte skjeletter har tegn bare når tegnet er nytt den dagen (første gang det vises i sesongen; læres når ordet er løst). Blindspor har tegn bare ved synlig bokstav. Kort med nytt tegn har et stiplet hjørne (25 mm) med tegnet stort, som barna klipper av og limer på runetavla; ett hjørne per nytt tegn per dag. Rekkefølgen står i `src/lib/runeorden.ts`. Tegnene erstatter bokstaver bare på posisjoner som uansett er åpne (taket gjelder etter dekoding). Fasit (`runer-fasit.pdf`) ligger i Nissemor-guiden og aldri på brettet. Se «Meta-gåter».
- **Blindspor.** Ett ekstra kort, én ekstra pose, to ekstra sendere. Regelen som skiller ekte fra falskt kommer fra Julius eller en fil. Et blindspor gir ❄ eller en bokstav som gir et ord Julius ikke beskriver; det gir aldri et tilfeldig riktig svar. Blindspor med feil bokstav: dag 1, 8, 10, 11, 12, 13, 16.
- **Lappen, ikke e-posten.** Barna er i huset før de åpner NisseMail. Alt de må vite for å gjøre noe på stedet, står på Rampenissens håndskrevne lapp ved brikken. E-posten viser tilbake til det de fant.
- **Hint.** Hver dag har en trapp på fire trinn som en voksen sier høyt, ett om gangen: hvor de skal lete, hva de skal legge merke til, hvordan brikkene henger sammen, og et siste dytt. Koden står aldri i et hint. Hakeparentesen etter replikken sier hvor i huset eller appen trinnet peker, og er til den voksne. Nissemor-guiden viser trinnene bak «Vis hint N».
- **Oppsett-minutter** under hver dag er gåten alene. Rampestreken (§8 i historien) kommer i tillegg; den er aldri selve gåten, men kan holde brikke H.
- **Lærdom fra 2025** som er brukt her: færre bevegelige deler, ingen gåte krever mer enn tre fysiske ting, ingen dag krever mer enn ett verktøy på skjermen, og hver dag har ett «aha» (noe som må telles, sorteres, lyses på, brettes, lyttes til eller huskes) i stedet for ren avskrift.
- **Lærdom fra 2025, runde to:** oppgavene var for lette. Posisjonen står ikke lenger ferdig på lappen; den telles, måles, slås opp (fil gir regel, aldri bokstav) eller følger av en rekkefølge som må bestemmes først. Flere dager har to steg (hente, så dekode), og nøkler hentes fra tidligere dager (dag 2 → 5, dag 3/6/9 → 12, dag 18 → 21).

## Oversikt

| Dag | Kode         | Mekanikk                                           | Hus viser                      | Vansk. | Min |
| --- | ------------ | -------------------------------------------------- | ------------------------------ | ------ | --- |
| 1   | SIGNAL       | tråd som rekkefølge, to løse kort                  | 2 av 6 + 2 løse                | 2      | 3   |
| 2   | 48           | tre regnestykker i romertall, legg sammen          | 3 tall, ingen regel            | 3      | 3   |
| 3   | PRISME       | speilvendt duggskrift                              | 2 av 6, speilvendt             | 3      | 4   |
| 4   | KOMPASS      | sko i ring, retning ukjent                         | 2 av 7, to lesninger           | 3      | 5   |
| 5   | ULRIKEN      | Cæsar, nøkkel fra dag 2                            | chiffer uten nøkkel            | 4      | 6   |
| 6   | LYKT         | skyggefigurer, velg riktig                         | 3 former + 1 av 4              | 2      | 5   |
| 7   | KULDE        | tine kort med to tegn (meta 1)                     | 2 av 5 i tegn                  | 4      | 3   |
| 8   | KRETSKORT    | følg ledningen, åpen bryter                        | 3 av 9 + 1 blindspor           | 4      | 3   |
| 9   | 24           | ni krystaller, sorter, gang                        | antall, ikke armer             | 4      | 5   |
| 10  | SPEKTER      | rødfilter, åtte kort, HVIT er falsk                | 2 av 7 + 1 blindspor           | 4      | 6   |
| 11  | 75           | fem sendere, IQs ender på fem                      | 5 tall, ingen regel            | 3      | 5   |
| 12  | MELODI       | fire beholdere, én synger ikke; krypto uten farger | 2 av 6 + 1 blindspor           | 4      | 4   |
| 13  | SAFRAN       | fire poser, to gule                                | 1 av 6 (+3 blindspor)          | 4      | 4   |
| 14  | ORIGAMI      | to bretter: bokstaver, så tall                     | 2 av 7                         | 3      | 3   |
| 15  | KARAMELL     | fem redskaper, to blindspor, tall i notatboken     | 3 av 8 uten posisjon           | 4      | 5   |
| 16  | SORTERING    | legg tilbake; én ting har ingen plass              | 3 av 9 + 1 blindspor           | 3      | 4   |
| 17  | NORDLYS      | bånd med tegn (meta 1)                             | 2 av 7 i tegn                  | 3      | 4   |
| 18  | TURBULENS    | tell fire hauger; kartet plantes (meta 2)          | 3 av 9                         | 3      | 4   |
| 19  | GULROT       | foliepakker i rutenett (pusterom)                  | 2 av 6                         | 2      | 6   |
| 20  | TURBO        | puter sortert etter størrelse, tegn                | 2 av 5 i tegn                  | 3      | 4   |
| 21  | BRANNMUR     | bokmur; porten fra kartet (meta 2)                 | 1 av 8 synlig, 2 av 8 i porten | 5      | 4   |
| 22  | LANDÅS       | A = 1, pluss tre (to tallkort per sokk)            | 6 tall, ingen regel            | 4      | 5   |
| 23  | STJERNEKLART | stjerner med romertall bak                         | 3 av 12                        | 4      | 3   |
| 24  | JULEMAGI     | tre suvenirer med tegn (lett med vilje)            | 3 av 8 i tegn                  | 3      | 4   |

Snitt oppsett for gåten: 4,3 minutter. Med rampestreken fra §8: cirka 9. Ventet tenketid for Kristian: 5–10 min hverdager, 10–20 min lørdager og milepæler (7, 12, 15, 21), dag 24 lett med vilje.

## Meta-gåter

### Meta 1: Frostrunene (dag 1 → 7, lesenøkkel resten av måneden)

Hvert kort har et tegn i hjørnet (se reglene). Runetavla (A5, 29 ruter A–Å, bokstaver som aldri læres krysset ut, med IQs linje øverst) ligger i ferdskriveren dag 1 og henger på operasjonsbrettet. Barna fyller inn tegn etter hvert som ord løses.

Lært før dag 7: dag 1 S, I, G, N, A, L (+ E, T fra de løse kortene), dag 3 P, R, M, E, dag 4 K, O, dag 6 Y, T. **Dag 7:** det fryste kortet har bare tegn for L (rute 3) og E (rute 5); `_ _ L _ E` + ovnssetningen = KULDE. Julius peker til tegnene på kortet i segment 2. **Dag 17:** O og L i tegn. **Dag 20:** U (lært dag 7) og B (lært dag 18; reserve i fasit hvis dag 18 er hoppet over). **Dag 24:** U, E, G.

Kuldes spøkelsesbilde får én linje i tegn under den norske teksten (`transcript_runer`): dag 10 «SE MEG», dag 13 «ALENE», dag 16 «SE OPP», dag 21 «LYSET DERES». Fargesamlerens siste side (dag 23) ender med «KOM NED MED LYS», og kortet ved krystallet dag 24 sier «TAKK FOR LYSET». Alt er historie, aldri kode. Alle bokstavene i disse linjene er lært før dagen de vises (Å læres aldri og brukes ikke).

Kostnad: null minutter kveld for kveld. Utskrifter: `runetavle.pdf` (barna) og `runer-fasit.pdf` (Nissemor-guiden). Kode: tegnsett (29 glyffer som font eller SVG) og visning i spøkelsesbildet (byggeliste).

### Meta 2: Trixters kart (dag 18 → 21)

`DEKRYPTERT/stjernetegn.txt` (krypto 2) er Trixters rutekart: åtte varder nummerert 1–8 fra Snøfall til Bergen, Julius' sirkel på varde 5, rett over Krystallgrotten. PS dag 18 sier «les rutekartet». **Dag 20:** Julius sier at porten står der sirkelen er. **Dag 21:** bare R er synlig på bokmuren; `U · 7` ligger inne i bok 5, et ❄-kort med teksten «Feil bok. Hvor satte Julius sirkelen?» i bok 3 (den på gløtt). Er krypto 2 ikke løst innen dag 20, får PS dag 20 en betinget variant som sier fra.

## Dag for dag

### Dag 1 (ti) – Direktelinjen · SIGNAL

- **Kode:** SIGNAL (uendret).
- **Mekanikk:** tråden er rekkefølgen, som før (storyboard avgjørelse 1). Nytt: to løse kort med bokstav ligger i klementinelva uten klype, som om de falt av i skredet. Bare det som henger på linjen, teller. Scenen (klementinskredet, ferdskriveren, IQs konvolutt) står i «Dag 1: byggeplan» nederst i dokumentet; her står bare gåten. Runetavla introduseres (se «Meta-gåter»).
- **Brikke H:** rød garntråd fra TV-en («LINJE 90,0») ned skråningen og langs elva til Rampenissens håndledd. Seks A7-kort med klesklyper, talt fra TV-en: ❄, **I**, ❄, **N**, ❄, ❄, hvert med tegn i hjørnet. Prikker 1–6 på baksiden. To løse kort, **E** og **T**, ligger blant klementinene (med riktig tegn ved bokstaven). I ferdskriveren, sammen med IQs konvolutt og operasjonsbrettet, ligger runetavla (A5, plass på operasjonsbrettet, 29 ruter A–Å) med IQs linje øverst: «Tegnene i hjørnet av kortene er Snøfalls gamle skrift. Ett tegn, én bokstav. Fyll inn når dere vet.»
- **Brikke S:** Julius, siste setning: «Når linjen bærer, roper IQ ett ord fra verkstedet. Det er det ordet radioen deres leter etter når den skurrer, rett før stemmen kommer gjennom.» Han sier ikke ordet.
- **Slik løses den:** 1) H9 følger tråden fra TV-en til luen og tar av kortene i rekkefølge; K12 legger dem på bordet. De løse kortene legges til side: de henger ikke på linjen. 2) K12 ser `_ I _ N _ _` og hører Julius: ordet radioen leter etter. SIGNAL. 3) K12 taster. 4) Etterpå: ordet skrives på kortene, og tegnene for S, I, G, N, A, L (og E, T fra de løse) føres inn på tavla.
- **Hint:** 1) «Hvor begynner den røde tråden, og hvor ender den? Følg den med fingeren helt fra TV-en.» [Stua: tråden fra TV-en til Rampenissens håndledd] 2) «Hvor mange kort henger på tråden med klype? Hvilke bokstaver ser dere? Og hvilke kort lå løst blant klementinene?» Hanna kan ta kortene av, ett om gangen, mens Håkon holder tråden stram. [NisseMail i dag: «bare det som hang på linjen, teller»] 3) «Har dere sett hele Julius-videoen? Mot slutten sier han hva slags ord IQ roper.» [Julius-videoen, segment 7. Teksten står under videoen når den er sett ferdig] 4) «Seks ruter, I som nummer to og N som nummer fire. Hva leter en radio etter når den skurrer?»
- **Hanna (hvis hun vil):** tar kortene av tråden mens H9 holder den stram.
- **Andel per flate:** hus 2 av 6 bokstaver (33 %) pluss lengde; de løse kortene er støy, ikke informasjon. Video: bruksbeskrivelse, ingen bokstaver.
- **Vanskelighet:** 2.
- **Oppsett:** 3 min for gåten; scenen tar 25 min kvelden 30. november pluss cirka 75 min forarbeid 28.–29. november (se «Dag 1: byggeplan»).
- **Sjekkliste:**
  - Bygg skredet fra TV-benken mot stuedøra: skråning, renne, haug
  - Tråden fra TV-en til Rampenissens håndledd, seks kort: ❄ I ❄ N ❄ ❄
  - De løse kortene E og T blant klementinene i elva
  - Ferdskriveren forseglet i skredet, halvveis ned skråningen
  - Rampestrek: bare lua og én vinkende arm stikker opp av klementinhaugen
- **Materialer:** rødt garn, 6 små klesklyper, maskeringsteip, kortene, runetavla. Scenen: 3 esker klementiner (2,3 kg), 3–4 tomme klementinesker, lyst laken, klesvaskkurv og badehåndkle, avispapir, skoeske kledd i svart med oransje striper (ferdskriveren), C6-konvolutt, fruktskål, banan, 2 servietter, dorullhylse, hårstrikk, binders, limstift, tapetkniv, tusj, 6 gullklistremerker.
- **Utskrifter:** `dag01-tradkort.pdf` (1 side, tykt papir, tosidig: 6 trådkort med prikker bak + 2 løse kort), `runetavle.pdf` (1 side, tykt papir), `dag01-linjekort.pdf` (1 side, tykt: linjekort med passordfelt + konvoluttpåskrift), `dag01-frakt.pdf` (4 sider, vanlig: fraktetiketter, SKJØRT-merker, stempler), `dag01-ferdskriver.pdf` (1 side, vanlig: merker og «FORSEGLET»-lapp), `dag01-flylogg.pdf` (1 side, vanlig: to loggstrimler), `operasjonsbrett.pdf` (A3, eller 2 × A4 med skjøtemerke, tykt).
- **Reserve:** Blir rekkefølgen rotet, teller de prikkene på baksiden. Tar de med de løse kortene, får de åtte bokstaver til seks ruter og må velge bort. Er videoen hoppet over, ligger transkriptet under spilleren.

### Dag 2 (on) – Sikringsboksen til IQ · 48 · jakt

- **Kode:** 48 (uendret).
- **Mekanikk:** tre tall i huset, regneregelen på skjermen. Nytt: hvert kort er et lite regnestykke i romertall med subtraktiv skrivemåte: **IX + III** (12), **XIX − III** (16), **XIV + VI** (20). Kristian må kjenne IX, XIX og XIV; Håkon kjenner romertall fra klokker og trenger hjelp. Så Julius' regel for de tre svarene. Videoen er ferdig og røres ikke.
- **Brikke H:** tre A7-kort teipet under tre spisestoler, hvert med ett regnestykke i romertall i stor skrift og et lite iskrystall. Ingen instruks om hva som skal gjøres med de tre svarene. Lapp fra Rampenissen (i sukkerskålen ved Rampenissen, håndskrevet): «Tre sikringer røk. Jeg gjemte dem lavt. Veldig lavt. Krabb! – R»
- **Brikke S:** Julius: «IQs regel er enkel: finn alle sikringene, og legg tallene sammen. Summen er koden til sikringsskapet.»
- **Slik løses den:** 1) Lappen i sukkerskålen sier at sikringene er gjemt lavt. H9 krabber og finner alle tre. 2) K12 regner ut hvert kort: 12, 16, 20. 3) Julius: legg alle sammen. 48. 4) Etter koden lyser sikringsboksen på K2.
- **Hint:** 1) «Har dere lest lappen i sukkerskålen? Rampenissen gjemte sikringene lavt. Hvor lavt går det an å komme i spisestua?» Hanna kan krabbe først. [Lappen i sukkerskålen ved Rampenissen] 2) «Hvor mange sikringer røk? Har dere like mange kort? Se på tegnene på kortene. Hvor har dere sett sånne tall før?» [NisseMail i dag: «tre sikringer røk», «slik gamle klokker gjør»] 3) «Regn ut ett kort om gangen og skriv svaret ved siden av. Hva betyr det når I står foran X, og hva når den står bak?» 4) «Nå har dere tre tall. Hva sier Julius at dere skal gjøre med tallene på sikringene?» [Julius-videoen, segment 5]
- **Hanna (hvis hun vil):** krabber under stolene sammen med H9; ett kort henger lavt nok.
- **Andel per flate:** hus tre tall uten regel (cirka 33 %), og bare for den som leser romertall med subtraktiv skrivemåte. Video: regel uten tall.
- **Vanskelighet:** 3.
- **Oppsett:** 3 min.
- **Sjekkliste:**
  - Skriv ut: `dag02-tallkort.pdf`
  - Teip ett kort under hver av tre spisestoler
  - Lapp i sukkerskålen: «Tre sikringer røk … Krabb! – R»
  - Rampestrek: Rampenissen i sukkerskålen med teskje og sukker rundt munnen
- **Materialer:** maskeringsteip, kortene.
- **Utskrifter:** `dag02-tallkort.pdf` (1 side, tykt papir, 3 kort med regnestykker i romertall).
- **Reserve:** Finner de bare to kort, står det «tre sikringer» i e-posten og radioen. Leser de IX som 11 eller XIV som 16, blir summen feil og terminalen sier fra; e-posten nevner «slik gamle klokker skriver tall». Nissemor-guiden har de tre svarene.

### Dag 3 (to) – Rimfrost på Ruten · PRISME + grønt hjerte

- **Kode:** PRISME (uendret).
- **Mekanikk:** duggskrift, som før. Nytt: skriften er speilvendt. Sett forfra står det `_ _ Ƨ _ Я _`; bokstavene er speilvendte og rekkefølgen baklengs, som om Rampenissen skrev fra innsiden av speilet. Lest riktig: `_ R _ S _ _`. Videoen er ferdig og røres ikke.
- **Brikke H:** kvelden før skriver forelderen `_ _ Ƨ _ Я _` på badespeilet med en q-tips dyppet i oppvaskmiddel (speilvendt R og S, seks streker for rutene). Tannkremtaggingen «RAMPEN VAR HER. NO CAP.» og lappen «Pust på meg.» som før. I vinduskarmen: glassperlen, det grønne hjerte-kortet og en liten konvolutt merket «ETTER KODEN – IQ» med frostkortet `_ R _ S _ _` (tegn i alle seks hjørner) i. Konvolutten gir ingenting speilet ikke gir, men sørger for at tegnene P, R, I, S, M, E alltid kommer på tavla; E trengs dag 7.
- **Brikke S:** Julius: «Pil holdt glassbiten mot lyset, og hele regnbuen falt på gulvet. Jeg sto midt i den. IQ sa navnet på en sånn glassbit tre ganger. Det er ikke et speil og ikke en lupe.»
- **Slik løses den:** 1) En voksen setter på varmt vann; speilet dugger, og `_ _ Ƨ _ Я _` trer fram. H9 skriver det av. 2) K12 ser at R og S er speilvendte og snur hele rekka: `_ R _ S _ _`. 3) Julius: glassbit som lager regnbue, seks bokstaver med R og S. PRISME. 4) Konvolutten i vinduskarmen åpnes: tegnene for P, R, I, S, M, E føres på tavla; speilet har ingen tegn.
- **Hint:** 1) «Rampenissen har vært på badet. Hva står det på lappen ved speilet?» En voksen setter på varmt vann. Hanna kan puste på speilet. [Badet: lappen «Pust på meg.»] 2) «Skriv av det som kom fram, strek for strek. Se nøye på de to bokstavene. Er det noe rart med dem?» 3) «Hvordan ser skrift ut når noen har skrevet den fra innsiden av speilet? Prøv å snu hele rekka.» [NisseMail i dag: «se godt på det Håkon skrev»] 4) «Seks ruter, R som nummer to og S som nummer fire. Hva kaller IQ glassbiten som legger regnbuen på gulvet? Det er ikke et speil og ikke en lupe.» Hanna kan lage regnbue med glassperlen fra vinduskarmen. [Julius-videoen, segment 4 og 5]
- **Hanna (hvis hun vil):** puster på det som ikke er kommet fram, lager regnbue med perlen, skanner hjerte-kortet (symbol 1/9).
- **Andel per flate:** hus 2 av 6 (33 %), og bare etter speilvending. Video: bruk, ingen bokstaver.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min. Test såpeskrift i november.
- **Sjekkliste:**
  - Skriv ut: `dag03-frostlapp.pdf`
  - Skriv ut reservesett: `dag03-frostlapp.pdf`
  - Skriv `_ _ Ƨ _ Я _` på badespeilet med q-tips og oppvaskmiddel
  - Lapp ved speilet: «Pust på meg.»
  - Vinduskarmen: glassperle, grønt hjerte-kort, konvolutt «ETTER KODEN – IQ» med frostkortet
  - Rampestrek: tannkrem på speilet: «RAMPEN VAR HER. NO CAP.»
- **Materialer:** oppvaskmiddel, q-tips, tannkrem, liten konvolutt, glassperle, hjerte-kortet.
- **Utskrifter:** symbolkort «grønt hjerte» (fra QR-siden). `dag03-frostlapp.pdf` (1 side, tykt papir: ett kort rettvendt med tegn til konvolutten, ett speilvendt som reserve).
- **Reserve:** Det speilvendte reservekortet legges i tannkremtuben hvis speilet svikter. Leser de rekka uten å snu den, passer ingen ord med S som tredje og R som femte bokstav til Julius' setning.

### Dag 4 (fr) – Skotoget i Gangen · KOMPASS · jakt

- **Kode:** KOMPASS (uendret).
- **Mekanikk:** skoene er tellerammen, som før, men de står i **ring** rundt Rampenissen (en kompassrose), ikke i tog. Pappas sko med Rampenissen er start. Hvilken vei man teller, sies ikke. Med klokka: `_ _ M _ A _ _`; mot klokka (sko 1, 7, 6, 5, 4, 3, 2): `_ _ _ A _ M _`. Bare den ene passer Julius' setning. Julius' brikke er skrevet om slik at den ikke gir ordet alene (segment 4 og 5 regenereres); tittelen «Skotoget» beholdes (toget har kjørt i ring).
- **Brikke H:** sju sko i ring på gulvet i gangen, pappas (med Rampenissen i) som start, kosedyrene i ring utenfor. I hver sko et A7-kort. Talt med klokka fra Rampenissen: sko 3 **M**, sko 5 **A**, de fem andre ❄. Alle kort har tegn i hjørnet. Prikker på baksiden gir avstand fra start (1–7 begge veier er umulig; prikkene følger klokka og er reserve, ikke løsning).
- **Brikke S:** Julius: «Rudolf trenger det samme som sjøfolk har hatt med seg: det som peker samme vei uansett hvor man snur seg. Ikke et kart, ikke en stjerne. Sjøfolk hadde den i lomma, Rudolf har den i nesa.»
- **Slik løses den:** 1) H9 tar opp kortene og legger dem foran hver sko. 2) K12 skriver begge lesninger, `_ _ M _ A _ _` og `_ _ _ A _ M _`. 3) Julius: det som peker samme vei uansett. Uten skoene kunne det vært nål, pil eller værhane; med `_ _ M _ A _ _` er det KOMPASS. 4) Tegnene for K, O, M, P, A, S føres på tavla.
- **Hint:** 1) «Hvordan står skoene i gangen i dag? Hvem sitter i den første?» Hanna kan telle skoene høyt rundt ringen. [Gangen: sju sko i ring, Rampenissen i pappas] 2) «Legg hvert kort foran skoen sin. Hvilke kort har bokstav? Hvilket nummer får de skoene når dere teller fra Rampenissen?» 3) «Rundt en ring går det an å telle to veier. Skriv opp begge rekkene.» [NisseMail i dag: «Hvilken vei dere skal telle, må dere finne ut selv.»] 4) «Sju ruter. Hva hadde sjøfolk i lomma som peker samme vei uansett hvor de snur seg? Hvilken av de to rekkene passer til det ordet?» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** teller skoene høyt rundt ringen.
- **Andel per flate:** hus 2 av 7 (29 %) pluss lengde, i to mulige rekkefølger. Video: bruk, ingen bokstaver.
- **Vanskelighet:** 3.
- **Oppsett:** 5 min (sju sko i ring, sju kort, kosedyr i ring bak).
- **Sjekkliste:**
  - Skriv ut: `dag04-skokort.pdf`
  - Skriv ut reservesett: `dag04-skokort.pdf`
  - Sett sju sko i ring i gangen, kosedyrene i ring utenfor
  - Ett kort i hver sko, etter prikkene bak, med klokka fra pappas
  - Rampestrek: Rampenissen i pappas sko med pappas solbriller
- **Materialer:** sju sko, 4–6 kosedyr, kortene.
- **Utskrifter:** `dag04-skokort.pdf` (1 side, tykt papir, 7 kort, tegn i hjørnet, prikker bak).
- **Reserve:** Blir ringen sparket i stykker, teller de prikkene på baksiden (med klokka).

### Dag 5 (lø) – Brevfuglen over Byfjellene · ULRIKEN · jakt

- **Kode:** ULRIKEN (uendret).
- **Mekanikk:** Cæsar-chiffer med tre skritt, som før. Nytt: Julius sier ikke tallet. Nøkkelen er «like mange skritt som IQ sprengte sikringer onsdag» (dag 2: tre). Første oppslag på tvers av dager; transkriptet fra dag 2 ligger i arkivet. **Standardvalg, kan endres:** alternativet er å la Julius si «tre skritt» som før.
- **Brikke H:** papirfugl gjemt høyt i stua med **X O U L N H Q** på vingen, alfabetstrimmel A–Å og «trehopper» (papirbit tre ruter bred) ved fuglen. Ingen tall og ingen piler. (Hopperen er tre ruter bred fordi svaret er tre; den gir ikke tallet bort for den som ikke har tenkt tanken, men er reserve for den som har.) Lapp fra Rampenissen (ved marshmallowfortet, håndskrevet): «Årets første brevfugl landet i natt. Den satte seg et sted høyt oppe i stua. – R»
- **Brikke S:** Julius: «Winter flyttet hver bokstav så mange skritt fram som IQ sprengte sikringer onsdag. Dere må gå så mange tilbake. Husk at vårt alfabet slutter på Å.»
- **Slik løses den:** 1) H9 finner fuglen (en voksen hjelper om den henger høyt). 2) K12 husker eller slår opp dag 2: tre sikringer. 3) H9 setter fingeren på bokstaven fra vingen, legger hopperen inntil; bokstaven ved venstre kant er svaret. 4) K12 skriver U L R I K E N. `alfabet.txt` er samme strimmel på skjermen.
- **Hint:** 1) «Har dere lest lappen ved marshmallowfortet? Brevfuglen satte seg høyt oppe i stua. Se opp!» [Stua: lappen ved fortet] 2) «Hva står på vingen? Og hva lå ved siden av fuglen?» [Alfabetstrimmelen og hopperen. Samme alfabet står i NisseNet: SNOFALL-HISTORIER/alfabet.txt] 3) «Julius sier hvor mange skritt Winter flyttet bokstavene, men ikke med tall. Hva skjedde hos IQ på onsdag?» [Julius-videoen, segment 3. Onsdag var dag 2: NisseMail og Julius-videoen i arkivet] 4) «Winter gikk fram, så dere må gå like mange skritt tilbake. Sett fingeren på bokstaven fra vingen, legg hopperen inntil og les bokstaven ved venstre kant.» Hanna kan legge hopperen inntil fingeren til Håkon. [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** legger hopperen inntil fingeren til H9.
- **Andel per flate:** hus: chiffertekst uten nøkkel. Video: nøkkel som oppslag, uten tekst. Dag 2: tallet, uten at noen vet det trengs igjen.
- **Vanskelighet:** 4.
- **Oppsett:** 6 min.
- **Sjekkliste:**
  - Skriv ut: `dag05-brevfugl.pdf`, `alfabetstrimmel.pdf`
  - Skriv ut reservesett: `alfabetstrimmel.pdf`
  - Brett fuglen og gjem den høyt i stua
  - Legg alfabetstrimmelen og trehopperen ved fuglen
  - Lapp ved marshmallowfortet: «Årets første brevfugl landet i natt … – R»
  - Rampestrek: marshmallowkrig mellom to putefort på salongbordet, én bamse med plaster
- **Materialer:** ett ark til fuglen, tusj.
- **Utskrifter:** `dag05-brevfugl.pdf` (1 side, vanlig papir) og `alfabetstrimmel.pdf` (1 side, tykt papir, med trehopper; brukes igjen dag 22).
- **Reserve:** Teller de feil vei, får de ÆRØOQKT. Husker de ikke dag 2, står det «tre sikringer» i e-posten dag 2 og i PS dag 2. Hopperen er tre ruter bred.

### Dag 6 (sø) – Skyggene i Gangen · LYKT + rødt hjerte · 2. advent · jakt

- **Kode:** LYKT (uendret).
- **Mekanikk:** skyggefigurer, velg riktig. Uendret: taket tillater bare 1 av 4 bokstaver, så valget mellom figurene er gåten. Kortene får tegn (Y læres bare her).
- **Brikke H:** tre silhuetter (stearinlys, bål, lykt med hank) i papprullen med lommelykten, ved det røde hjerte-kortet. Bakside lykt: `_ Y _ _` med tegn i alle fire hjørner. Bakside stearinlys `_ A _ _` og bål `_ O _ _`: tegn bare ved den synlige bokstaven (blindspor lærer ingen tegn for ❄). Lapp fra Rampenissen (i melet ved Rampenissen, håndskrevet): «Jeg har laget et instrument! Det ligger i en papprull i gangen, sammen med lampen. Slukk lyset og lys mot veggen, én om gangen. – R»
- **Brikke S:** Julius: «Det barna bar mellom gårdene da det var som mørkest. Ikke et bål. Ikke et stearinlys. Det med hank, som man kan henge fra seg.»
- **Slik løses den:** 1) H9 finner rullen, slukker lyset og holder én silhuett av gangen mot veggen med mobillykten bak. 2) Julius' «med hank» avgjør hvilken bakside som teller. 3) `_ Y _ _`, fire bokstaver, med hank. LYKT. 4) Tegnene for L, Y, K, T føres på tavla.
- **Hint:** 1) «Har dere funnet lappen i melet? Rampenissen har laget noe av en papprull og lampen deres.» [Kjøkkenet: lappen i melet ved Rampenissen] 2) «Slukk lyset og lys mot veggen, én figur om gangen. Hva er skyggene?» Hanna kan si hva hun ser. «Snu figurene etterpå. Hva står på baksiden?» 3) «Tre figurer, men bare én bakside teller. Hva bar barna mellom gårdene, sier Julius? Og hva var det ikke?» [Julius-videoen, segment 3 og 4] 4) «Fire ruter med Y som nummer to. Hva lyser, har hank og kan henges fra seg?»
- **Hanna (hvis hun vil):** skyggeteateret er hennes: hun sier hva skyggen er. Skanner hjerte-kortet (symbol 2/9).
- **Andel per flate:** hus 1 av 4 (25 %) i hvert av tre kort. Video: velger formen, ingen bokstaver.
- **Vanskelighet:** 2.
- **Oppsett:** 5 min kvelden før (silhuettene klippes i november).
- **Sjekkliste:**
  - Skriv ut: `dag06-silhuetter.pdf`
  - Skriv ut reservesett: `dag06-silhuetter.pdf`
  - Teip silhuettene på ispinner og legg dem i papprullen
  - Papprullen, en lampe og rødt hjerte-kort i gangen
  - Lapp i melet: «Jeg har laget et instrument! … – R»
  - Rampestrek: snøengler i 1 dl mel på et stekebrett, kjøkkenbordet
- **Materialer:** 3 ispinner, teip, papprull, mobillykt, hjerte-kortet.
- **Utskrifter:** `dag06-silhuetter.pdf` (1 side, tykt papir, tre figurer med bakside-kort).
- **Reserve:** Er skyggen utydelig, holder det å se på silhuetten. Feil valg gir et ord som ikke passer «med hank».

### Dag 7 (ma) – Inntrengeren i Fryseren · KULDE · M2 Navnet

- **Kode:** KULDE (uendret).
- **Mekanikk:** tine lappen ut av is, som før. Nytt: kortet har ingen bokstaver, bare to tegn og tre ❄. Rute 3 har tegnet for **L**, rute 5 tegnet for **E** (begge lært dag 1 og 3). Først tine, så kjenne igjen tegnene fra tavla, så Julius. Første utbetaling av meta 1.
- **Brikke H:** frostkortet (fem ruter: ❄, ❄, tegn L, ❄, tegn E; ❄-rutene har tegn i hjørnet som vanlig) i liten plastpose, fryst flatt i et **plastbeger** med 1 cm vann, ved Rampenissens lue i fryseren. Lapp fra Rampenissen (teipet på begeret i fryseren, håndskrevet): «Tin meg! Lunkent vann, og en voksen. – R»
- **Brikke S:** Julius: «Navnet er det motsatte av det Hjerterud har i ovnen akkurat nå. Ikke bollene. Tenk på ovnen. Det som slår mot ansiktet når hun åpner ovnsdøra.» Bildet fryser 1–2 sekunder der han ellers ville sagt navnet. I segment 2 sier han at Orakelet skrev navnet «med tegnene i hjørnet av kortene».
- **Slik løses den:** 1) H9 finner begeret og tiner det under lunkent vann med en voksen (2–3 min). 2) K12 ser to tegn uten bokstav, husker Julius og tavla, slår opp: L i rute 3, E i rute 5: `_ _ L _ E`. 3) Motsatt av ovnsvarme, fem bokstaver. KULDE. Frostgraden vises for første gang. 4) Tegnene for K, U, D føres på tavla.
- **Hint:** 1) «Hvor ble det av lua til Rampenissen? Se hva som står ved den, og les lappen.» En voksen hjelper med lunkent vann. Hanna kan holde begeret under springen. [Fryseren: begeret med lappen «Tin meg!»] 2) «Kortet har ingen bokstaver. Hva står i rute tre og rute fem? Hvor har dere sett sånne tegn før?» [Julius-videoen, segment 2: navnet er skrevet «med tegnene i hjørnet av kortene»] 3) «Slå opp de to tegnene på runetavla og skriv bokstavene i rutene.» [NisseMail i dag: «Tavla deres vet mer enn dere tror.»] 4) «Fem ruter, L som nummer tre og E til slutt. Hva slår mot ansiktet når Hjerterud åpner ovnsdøra? Navnet er det motsatte.» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** holder begeret under springen.
- **Andel per flate:** hus 2 av 5 (40 %), og bare for den som har holdt tavla. Video: beskrivelse, ingen bokstaver; pluss pekeren til tavla.
- **Vanskelighet:** 4.
- **Oppsett:** 3 min kvelden før, pluss frysetid. **Legg begeret i fryseren senest søndag 6. kl. 20.**
- **Sjekkliste:**
  - Skriv ut: `dag07-frostlapp.pdf`
  - Skriv ut reservesett: `dag07-frostlapp.pdf`
  - Senest kl. 20: frys kortet i zip-pose i 1 cm vann
  - Lapp teipet på begeret: «Tin meg! Lunkent vann, og en voksen. – R»
  - Rampestrek: fastfryst i fryserdøra, lua inne i fryseren, vottene rett ut
- **Materialer:** plastbeger eller silikonform, liten zip-pose, frostkortet.
- **Utskrifter:** `dag07-frostlapp.pdf` (1 side, tykt papir).
- **Reserve:** Mangler tavla tegn for L eller E, henger kortene fra dag 1 og 3 på brettet, og `runer-fasit.pdf` ligger i Nissemor-guiden (aldri på brettet). Blir det ikke fryst, legges posen i isbitskuffen.

### Dag 8 (ti) – Lampene som Lyver · KRETSKORT

- **Kode:** KRETSKORT (uendret).
- **Mekanikk:** følg ledningen i floken, som før. Nytt: arket har ikke lenger teksten «kun lamper med strøm teller»; den regelen sier Julius. En fjerde ledning går fra batteriet til lampe 4 gjennom en **åpen bryter** (tegnet som brudd med hendel). Lampe 4 har bokstaven **E**. Den som tar den med, får `_ R _ E S _ O _ _` og finner ikke ordet. Kristian har hatt strømkrets på skolen; Håkon har ikke.
- **Brikke H:** arket på toppen av Sigma-tårnet. Lampe 2 **R**, lampe 5 **S**, lampe 7 **O** med strøm; lampe 4 **E** bak åpen bryter; de fem andre ❄ med ledninger som ender i ingenting. Synlige bokstaver har tegn; ❄ på de døde lampene har tegn i hjørnet (de er ekte ruter i ordet). Lapp fra Rampenissen (på tårnet, håndskrevet): «IQs ark ligger på toppen. Ta ned pakkene én og én. Ingen klatring! – R»
- **Brikke S:** Julius: «Den lille grønne plata alle ledningene sitter fast på. IQ lodder på én, sover på én, og kaller den alltid det samme, med to ord i ett.» I segment 2: «Bare lamper med strøm lyser, sier han.»
- **Slik løses den:** 1) H9 river tårnet pakke for pakke og får arket. 2) H9 følger hver ledning fra batteriet. K12 ser bryteren på vei til lampe 4 og forklarer: åpen bryter, ingen strøm. 3) `_ R _ _ S _ O _ _`, grønn plate, to ord i ett. KRETSKORT. 4) Tegn føres på tavla.
- **Hint:** 1) «Hva ligger på toppen av tårnet? Ta ned pakkene én og én.» Hanna kan telle pakkene. [Lappen på Sigma-tårnet] 2) «Sett fingeren på batteriet og følg én ledning om gangen. Hvilke lamper kommer dere fram til, og hvilke bokstaver har de?» [NisseMail i dag: «Følg hver ledning fra batteriet med fingeren.»] 3) «Julius sier hvilke lamper som lyser. Se nøye på ledningen til lampe fire. Kommer strømmen helt fram?» [Julius-videoen, segment 2: «Bare lamper med strøm lyser»] 4) «Ni ruter, R som nummer to, S som nummer fem og O som nummer sju. Hva heter den lille grønne plata alle ledningene sitter fast på? To ord i ett. Det første ordet er det strømmen går i, rundt og rundt.» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** teller pakkene i tårnet.
- **Andel per flate:** hus 3 av 9 (33 %) pluss ett blindspor. Video: beskrivelse og regelen om strøm.
- **Vanskelighet:** 4.
- **Oppsett:** 3 min.
- **Sjekkliste:**
  - Skriv ut: `dag08-lamper.pdf`
  - Legg arket på toppen av tårnet
  - Lapp på tårnet: «IQs ark ligger på toppen … Ingen klatring! – R»
  - Rampestrek: tårn av frokostpakker, skilt «SIGMA-TÅRN», Rampenissen på toppen med suppeøse
- **Materialer:** arket.
- **Utskrifter:** `dag08-lamper.pdf` (1 side, vanlig papir, farge anbefalt).
- **Reserve:** Tar de med E, passer ikke ordet Julius beskriver, og de går tilbake til floken. Følger de en død ledning, får de ❄.

### Dag 9 (on) – Krystall-Matematikk · 24 + blått hjerte

- **Kode:** 24 (uendret).
- **Mekanikk:** sortere ekte og falske, så gange. Nytt: ni krystaller, ikke sju, og de falske er vanskeligere: fem armer, sju armer, seks armer der én er halvparten så lang, firkantet midte, og én med seks armer der to sitter på samme side. Tellingen må gjøres nøye.
- **Brikke H:** ni papirkrystaller på kjøleskapsdøra, fire ekte (seks like armer) og fem falske. Det blå hjerte-kortet mellom dem. Ingen tall noe sted.
- **Brikke S:** Julius: «Pil telte armene tre ganger. Seks hver gang på de ekte. De falske hadde feil tall, og de var lette å kjenne igjen når man først så etter.» Verktøy: `krystallformel.txt` i NisseNet: `Krystallsum = antall ekte krystaller × armer per ekte krystall`.
- **Slik løses den:** 1) H9 teller armer på hver krystall og legger de falske nederst. K12 sjekker de to som nesten er riktige. 2) Antall ekte: fire. 3) Formelen og Julius: 4 × 6 = 24.
- **Hint:** 1) «Hva henger på kjøleskapet i dag? Er alle like?» Hanna kan plukke ut dem som ser rare ut. [Kjøkkenet: ni papirkrystaller på kjøleskapsdøra] 2) «Tell armene på hver krystall. Hvor mange armer har en ekte, ifølge Pil? Se ekstra nøye på dem som nesten er riktige. Er alle armene like lange, og sitter de jevnt rundt?» [Julius-videoen, segment 3 og 4] 3) «Hvor mange ekte har dere igjen? IQ har lagt en formel i NisseNet.» [NisseNet: SNOFALL-HISTORIER/krystallformel.txt] 4) «Formelen trenger to tall: hvor mange ekte krystaller dere har, og hvor mange armer hver av dem har. Hva sier formelen at dere gjør med de to tallene?»
- **Hanna (hvis hun vil):** plukker ut dem som «ser rare ut» først.
- **Andel per flate:** hus: antall (4), ikke armer og ikke regel. Video: armer (6). Fil: regel. Ingen flate har to av tre.
- **Vanskelighet:** 4.
- **Oppsett:** 5 min (klipp ni krystaller, heng opp).
- **Sjekkliste:**
  - Skriv ut: `dag09-krystallark.pdf`
  - Klipp ut de ni krystallene og heng dem på kjøleskapsdøra
  - Blått hjerte-kort mellom krystallene
  - Rampestrek: Rampenissen i grønnsaksskuffen, bare beina stikker ut
- **Materialer:** magneter eller teip, arket, hjerte-kortet.
- **Utskrifter:** `dag09-krystallark.pdf` (1 side, tykt papir, ni krystaller til utklipp, de falske ikke merket).
- **Reserve:** Ganger de 9 × 6 = 54 eller 5 × 6 = 30, sier terminalen feil, og e-posten minner om at «noen av dem er ikke ekte».

### Dag 10 (to) – Fargene som Forsvant · SPEKTER · frost nivå 1 · jakt

- **Kode:** SPEKTER (uendret).
- **Mekanikk:** rødfilter og regnbuerekkefølge, som før. Nytt: et åttende kort, **HVIT**, med bokstaven **R** under støyen. Hvitt er ikke en regnbuefarge, og `farge-koder.txt` lister sju. Den som tar det med, har åtte kort til sju ruter.
- **Brikke H:** åtte A7-kort med fargekant og fargenavn, gjemt lavt og høyt i stua. Under rødt støymønster, i cyan: ORANSJE → **P**, BLÅ → **T**, HVIT → **R**, de fem andre → ❄. Tegn ved synlige bokstaver; ❄ på regnbuekortene har tegn, HVIT-kortet har tegn bare ved R. Rødfilteret ved tusjene. Lapp fra Rampenissen (i Rampenissens hånd, håndskrevet): «Kulde tok fargene! Jeg gjemte dem i stua. Det røde filteret ligger ved tusjene. Se gjennom det. – R»
- **Brikke S:** Julius (hakker, gjentar setningen): «Alle fargene på rekke, slik regnbuen stiller dem opp. IQ har ett ord for hele rekka. Han sier det når han er stolt.»
- **Slik løses den:** 1) H9 finner kortene. 2) K12 ser hvert kort gjennom filteret. 3) `farge-koder.txt`: regnbuens sju farger. HVIT står ikke der og legges bort. `_ P _ _ T _ _`. 4) Julius: ordet for hele regnbuerekka. SPEKTER. Fargene kommer tilbake.
- **Hint:** 1) «Har dere lest lappen Rampenissen holder? Han gjemte fargene i stua, og noe rødt ligger ved tusjene.» [Lappen i Rampenissens hånd] 2) «Se på hvert kort gjennom det røde filteret. Hva dukker opp under støyen?» Hanna kan være fargesjef og si «bokstav» eller «krystall». 3) «Hvilken rekkefølge skal kortene ligge i? Det står i NisseNet. Tell kortene, og tell fargene i fila. Er det et kort som ikke hører hjemme?» [NisseNet: SNOFALL-HISTORIER/farge-koder.txt] 4) «Sju ruter, P som nummer to og T som nummer fem. Hva kaller IQ alle regnbuens farger på rekke? Rampenissen skriver hvilken form av ordet IQ bruker.» [Julius-videoen, segment 3 og 4; NisseMail i dag: «IQ bruker den korte, gammeldagse formen av ordet sitt.»]
- **Hanna (hvis hun vil):** fargesjef: ser gjennom filteret og sier «bokstav» eller «krystall».
- **Andel per flate:** hus 2 av 7 (29 %) pluss ett blindspor, bare med filter. Fil: rekkefølge, ingen bokstaver. Video: beskrivelse.
- **Vanskelighet:** 4.
- **Oppsett:** 6 min (gjem åtte kort, legg fram filteret). Filter og testark lages i november som før.
- **Sjekkliste:**
  - Skriv ut i farge: `dag10-fargekort.pdf`
  - Gjem de åtte fargekortene lavt og høyt i stua
  - Legg rødfilteret ved tusjene
  - Lapp i Rampenissens hånd: «Kulde tok fargene! … Se gjennom det. – R»
  - Rampestrek: tusjfarger på hender og nese, bart på familiebildet (post-it)
- **Materialer:** rødt cellofan, papp til ramme, teip, kortene. Krever fargeutskrift.
- **Utskrifter:** `dag10-testark.pdf`, `dag10-fargekort.pdf` (2 sider, tykt papir, **farge**: åtte kort; side 2 blank variant for håndskrift), `rodfilter-ramme.pdf`.
- **Reserve:** Virker ikke filteret, hold kortet skrått under en lampe. Tar de med HVIT, har de ett kort for mye og går til filen.

### Dag 11 (fr) – Antenne-Krisen · 75 + bonus · jakt

- **Kode:** 75 (uendret). Bonus: foreldrekode `ANTENNE2026`, −20 % frost.
- **Mekanikk:** tall i tre rom, regneregelen på skjermen. Nytt: fem kort, ikke tre. IQs sendere er 15, 25, 35; Kuldes falske er 20 og 40. Regelen som skiller dem, sier Julius: alt IQ bygger ender på fem. Så legge sammen.
- **Brikke H:** fem A7-kort med tall og et lite antennesymbol, like i utseende: stua (under en pute: 15 og 40), kjøkkenet (brødboksen: 25), gangen (Hannas jakkelomme: 35; pappas jakkelomme: 20). Ingen regnetegn, ingen merking av de falske. Lapp fra Rampenissen (på stekebrettet, håndskrevet): «SKURR! IQ sendte tre sendere til dere, i tre rom. Kulde la ut sine egne. Ta med alt dere finner. – R»
- **Brikke S:** Julius: «Tre sendere, sa IQ, og alt han bygger ender på fem. Kulde satte ut sine egne. Ikke gang dem. Legg IQs sammen, så finner dere oss.»
- **Slik løses den:** 1) Lappen på stekebrettet sier «tre rom» og at Kulde har satt ut egne sendere. H9 løper og finner fem kort. 2) K12 hører regelen: 15, 25, 35 er IQs. 3) 15 + 25 + 35 = 75. 4) Lek etterpå: K4 på 75,0. Bonus: folieantenne.
- **Hint:** 1) «Har dere lest lappen på stekebrettet? Hvor mange rom skal dere lete i?» Hanna kan sjekke jakkelomma si. [Kjøkkenet: lappen på stekebrettet. Kortene ligger i stua, på kjøkkenet og i gangen] 2) «Hvor mange kort fant dere? Og hvor mange sendere sendte IQ? Da er ikke alle kortene hans.» [NisseMail i dag: «IQ sendte tre lapper», «Kulde la ut sine egne»] 3) «Julius sier hvordan dere kjenner igjen det IQ har bygd. Hva ender tallene hans på?» [Julius-videoen, segment 3] 4) «Nå har dere IQs tre tall. Skal dere gange dem eller legge dem sammen?» [Julius-videoen, segment 4]
- **Hanna (hvis hun vil):** finner kortet i sin egen jakkelomme.
- **Andel per flate:** hus fem tall uten regel. Video: to regler (hvilke, og pluss) uten tall.
- **Vanskelighet:** 3.
- **Oppsett:** 5 min.
- **Sjekkliste:**
  - Skriv ut: `dag11-tallkort.pdf`
  - Stua, under en pute: kortene 15 og 40
  - Kjøkkenet, i brødboksen: kortet 25
  - Gangen: 35 i Hannas jakkelomme, 20 i pappas
  - Lapp på stekebrettet: «SKURR! IQ sendte tre sendere til dere … – R»
  - Rampestrek: pakket i aluminiumsfolie som en bakt potet, på stekebrettet
- **Materialer:** kortene. Bonus: aluminiumsfolie.
- **Utskrifter:** `dag11-tallkort.pdf` (1 side, tykt papir, 5 kort).
- **Reserve:** Legger de sammen alle fem (135), sier terminalen feil; transkriptet sier «ender på fem». Mangler ett av IQs kort, står det «tre sendere» i videoen.

### Dag 12 (lø) – Lydbølgene som Smelter Is · MELODI + grønn sol · M3 · krypto 1

- **Kode:** MELODI (uendret).
- **Mekanikk:** sortere etter tonehøyde, som før. Nytt: fire beholdere, ikke tre: tre glass med vann og **ett keramikkrus** som gir dunk, ikke tone. Kruset bærer biten `_ A`. Julius sier «tre toner»; den som ikke klinger, er ikke Hjerteruds. Krypto 1 strammes også: hintet navngir ikke fargene lenger (se app-tekster A5); fargenes betydning står i PS dag 3, 6 og 9.
- **Brikke H:** tre like glass med 2, 5 og 9 cm vann og ett krus med litt vann, i tilfeldig rekkefølge i enden av dorullen. Biter teipet nederst på utsiden med forsiden inn: dypeste glass `_ E`, midterste `_ O`, lyseste `_ _`, kruset `_ A`. Tegn ved E, O og A; ❄ på de tre glassbitene har tegn, kruset ikke. Teskje ved. Grønt sol-kort mot midtglasset. Lapp fra Rampenissen (ved glassene, håndskrevet): «Slå forsiktig på hver av dem med skjeen. Lappene sitter nederst, utenpå. – R»
- **Brikke S:** Julius: «Hjerterud nynnet tre toner ved slusen, den dypeste først. Ingen ord. Hør: bare det tonene lager når de kommer etter hverandre. Isen kjente det igjen.» (Omskrevet: uten glassene kan det være sang, låt, rytme eller musikk; med `_ E _ O _ _` er det MELODI.)
- **Slik løses den:** 1) H9 slår på alle fire. Kruset synger ikke og legges bort. 2) H9 sorterer glassene fra dypest til lysest, bitene i samme rekkefølge: `_ E _ O _ _`. 3) K12: det tonene lager etter hverandre, seks bokstaver med E og O. MELODI. NisseMusikk tiner. 4) NisseKrypto 1: rekkefølgen «varmt, håper, alene» må oversettes til rødt, grønt, blått via PS dag 6, 3 og 9 (to kjente, den tredje ved utelukkelse) → `frosne-koder.txt` og merket Varmebærer.
- **Hint:** 1) «Hva står i enden av dorullen? Les lappen ved glassene.» [Lappen ved glassene. Teskjeen ligger der] 2) «Slå forsiktig på hver av de fire. Hvilke synger, og hvilken sier bare dunk?» Hanna kan slå og si hvilken som ikke synger. [NisseMail i dag: «Bare tre av dem er Hjerteruds.»] 3) «Hvilken tone nynnet Hjerterud først? Sett glassene i den rekkefølgen. Lappene sitter nederst på utsiden. Legg dem etter hverandre slik glassene står.» [Julius-videoen, segment 3: «den dypeste først»] 4) «Seks ruter, E som nummer to og O som nummer fire. Hva lager toner når de kommer etter hverandre?» [Julius-videoen, segment 4]
- **Hanna (hvis hun vil):** slår på glassene og sier hvilken som ikke synger. Skanner sol-kortet (symbol 4/9).
- **Andel per flate:** hus 2 av 6 (33 %) pluss ett blindspor; rekkefølgen bare via lyd. Video: sorteringsregel og beskrivelse. Krypto: hint uten farger; PS-tekster gir to av tre.
- **Vanskelighet:** 4.
- **Oppsett:** 4 min.
- **Sjekkliste:**
  - Skriv ut: `dag12-frostlapp-tredelt.pdf`
  - Skriv ut reservesett: `dag12-frostlapp-tredelt.pdf`
  - Tre like glass: 2, 5 og 9 cm vann. Krus, teskje
  - Biter nederst, forsiden inn: E dypest, O midterst, tom grunnest, A kruset
  - Grønt sol-kort mot det midterste glasset
  - Lapp ved glassene: «Slå forsiktig på hver av dem med skjeen … – R»
  - Rampestrek: 2 m dorull bortover kjøkkenet, Rampenissen utslått i enden ved glassene
- **Materialer:** 3 glass, 1 keramikkrus, teskje, teip, kortet, sol-kortet.
- **Utskrifter:** `dag12-frostlapp-tredelt.pdf` (1 side, tykt papir, tre biter med klippelinjer pluss én blindsporbit).
- **Reserve:** Hører de ikke forskjell, gjelder mengden vann (står i Nissemor-guiden). Tar de med `_ A`, får de åtte ruter til et ord Julius beskriver med «tre toner». Prikker 1–3 på baksiden av de ekte bitene.

### Dag 13 (sø) – Luciadagens Gylne Krydder · SAFRAN · 3. advent

- **Kode:** SAFRAN (uendret).
- **Mekanikk:** velg riktig krydder, som før. Nytt: fire poser, to av dem gule: ekte safran (tråder) og gurkemeie (pulver). Gurkemeieposens kort er `_ _ R _ _ _ _ _ _` (ni ruter; GURKEMEIE passer, og mange lussekatter er faktisk farget med det). Julius' «krokus, tre tråder per blomst, dyrere enn gull» skiller dem. **Standardvalg, kan endres:** kjøp en liten konvolutt ekte safran (40–80 kr, lokalt).
- **Brikke H:** fire små zip-poser på servietten ved Rampenissen: kanel `_ _ N _ _`, gurkemeie `_ _ R _ _ _ _ _ _`, safran `_ _ F _ _ _`, nellik `_ _ L _ _ _`. Like kort, ingen navn. Tegn ved synlige bokstaver; ❄ på safrankortet har tegn, blindsporene ikke. Lussekatten ved. Lapp fra Rampenissen (nederst på gravskiltet, trykt): «Siste ord: Ett av krydderne i posene var i bollene. Jeg smakte på alle fire for å finne ut hvilket. Ikke gjør det. – R»
- **Brikke S:** Julius: «Det gule i bollene er krydderet fra en krokus. Tre tråder per blomst, plukket for hånd. Tre tråder er lite. Derfor koster det mer enn gull, og derfor låser Hjerterud det inn.»
- **Slik løses den:** 1) H9 åpner posene; to er gule. 2) K12 hører «tråder» og ser at én gul pose har tråder, den andre pulver. Google er lov («krydder fra krokus»). 3) `_ _ F _ _ _`, seks bokstaver. SAFRAN.
- **Hint:** 1) «Har dere lest lappen på gravskiltet? Hva ligger på servietten ved Rampenissen? Åpne posene og se godt etter.» Hanna kan lukte på alle fire og si hvilke som er gule. 2) «To av posene er gule. Hva er forskjellen på det som ligger i dem?» [NisseMail i dag: «To av dem er gule. Bare én teller»] 3) «Julius sier hvor det gule krydderet kommer fra, og hvordan det ser ut. Hvilken pose passer?» [Julius-videoen, segment 3: «Tre tråder per blomst»] 4) «Kortet til posen med tråder har seks ruter og F som nummer tre. Hva heter krydderet fra krokus som koster mer enn gull? Det er lov å søke på nettet.» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** lukter på alle fire og sier hvilke som er gule.
- **Andel per flate:** hus 1 av 6 (17 %) i riktig pose, med tre blindspor som alle er krydder. Video: beskrivelse.
- **Vanskelighet:** 4.
- **Oppsett:** 4 min.
- **Sjekkliste:**
  - Skriv ut: `dag13-krydderkort.pdf`, `dag13-gravskilt.pdf`
  - Skriv ut reservesett: `dag13-krydderkort.pdf`
  - Ett kort i hver krydderpose: like mange ruter som bokstaver i krydderet
  - Posene og en lussekatt på servietten ved Rampenissen
  - Gravskiltet med lappen bak Rampenissen
  - Rampestrek: Rampenissens begravelse på servietten, blomst i hendene, kosedyr i sørgerekke
- **Materialer:** 4 små zip-poser, kanel, gurkemeie, safran, nellik (eller pepper), en lussekatt, serviett, gravskiltet.
- **Utskrifter:** `dag13-krydderkort.pdf` (1 side, tykt papir, 4 kort), `dag13-gravskilt.pdf` (1 side, tykt papir, skiltet med lappen fra Rampenissen).
- **Reserve:** Velger de gurkemeie, passer ikke «tråder» og «dyrere enn gull», og de prøver neste. Har huset ikke nellik, brukes pepper.

### Dag 14 (ma) – Hemmeligheten i Papirvingene · ORIGAMI

- **Kode:** ORIGAMI (uendret).
- **Mekanikk:** brett og hold mot lyset, som før. Nytt: to brettelinjer. Brettet langs den loddrette og holdt mot lys: bokstavene **R** og **G** i to vinduer. Brettet langs den vannrette: tallene **2** og **4** ved de samme vinduene. Arket sier «Brett. Hold en lykt bak.» uten å si hvor mange ganger.
- **Brikke H:** arket sammenrullet i papirbåten i vasken. Flatt: tilfeldige streker og sju tomme ruter (ingen tegn: ORIGAMI har ingen nye bokstaver). Bretteanvisning for serviettfugl ved (bare moro).
- **Brikke S:** Julius: «Winter har ett ord for å gi et flatt ark vinger uten saks og lim, bare ved å bøye det. Winter er lur. Han uttaler det feil med vilje, så ingen på linjen skal forstå.» (Omskrevet: verken _japansk_ eller _brette_; uten arket kan det være fly, fugl eller kunst; med `_ R _ G _ _ _` er det ORIGAMI.)
- **Slik løses den:** 1) H9 bretter langs den ene linjen og ser to bokstaver, men ikke hvor de hører hjemme. 2) K12 prøver den andre linjen: tallene. R i 2, G i 4: `_ R _ G _ _ _`. 3) Ark som får vinger ved å bøyes, sju bokstaver med R og G. ORIGAMI. Den blå fuglen vises i Brevfugler.
- **Hint:** 1) «Hvor sov Rampenissen i natt? Se hva båten hans er lastet med.» [Vasken: arket ligger sammenrullet i papirbåten] 2) «Arket sier at dere skal brette det og holde en lykt bak. Brett langs den ene streken. Hva ser dere i vinduene?» Hanna kan holde lykten. 3) «Bokstaver uten plass? Da har arket en brett til. Prøv den andre streken, og se hva som står ved de samme vinduene.» [NisseMail i dag: «Ser du bokstaver uten plass, har arket en brett til.»] 4) «Sju ruter, R som nummer to og G som nummer fire. Hva kaller Winter det å gi et flatt ark vinger bare ved å bøye det?» [Julius-videoen, segment 3]
- **Hanna (hvis hun vil):** holder lykten bak arket.
- **Andel per flate:** hus 2 av 7 (29 %), bare brettet to ganger og mot lys. Video: beskrivelse.
- **Vanskelighet:** 3.
- **Oppsett:** 3 min.
- **Sjekkliste:**
  - Skriv ut: `dag14-brettark.pdf`
  - Brett en papirbåt og sett den i den tørre vasken
  - Rull brettarket sammen og legg det i båten
  - Rampestrek: skjeve serviettfugler over hele kjøkkenet, Rampenissen i papirbåten
- **Materialer:** arket, et ark til papirbåten, mobillykt.
- **Utskrifter:** `dag14-brettark.pdf` (1 side, vanlig 80 g papir, to stiplede linjer; test gjennomlys i november) og `dag14-serviettfugl.pdf` (valgfri).
- **Reserve:** Lyser bokstavene dårlig gjennom, hold arket rett mot lykten. Finner de ikke tallene, gir ordet seg likevel av bokstavene og Julius; tallene bekrefter.

### Dag 15 (ti) – Fargesamlerens Notatbok · KARAMELL + rød sol · M4

- **Kode:** KARAMELL (uendret).
- **Mekanikk:** følg sporet til redskaper, som før. Nytt: sporet går mot fem redskaper, men to spor stopper underveis (blindspor til kjevle og øse, med ❄-kort under). Lappene under gryte, sleiv og visp har bare bokstav, ingen tall. Rutetallene står i Fargesamlerens notatbok (fil, åpner samme dag) som Hjerteruds margnotat: «Gryta på to. Rør med sleiva fem ganger. Vispen til sju.» Fil gir regel, hus gir bokstaver, Julius gir ordet.
- **Brikke H:** fem redskaper på benken: gryte, sleiv, visp, kjevle, øse. Sporene er **papirstrimler med trykte, sukkerfargede fotspor** (fra PDF-en), lagt fra skålen mot alle fem; strimlene til kjevle og øse slutter halvveis. Ikke sukker på benken: tirsdag morgen er det ingen tid til vask. Rampenissen står ved siden av en liten skål med et par skjeer sirup (streken), ellers tørt. Under gryten **A**, under sleiva **M**, under vispen **L** (med tegn); under kjevle og øse ❄-kort uten tegn. Rutekort 1–8 og rødt sol-kort ved skålen. Sirupflasken og sukkeret ryddes bort. Lapp fra Rampenissen (ved sirupskålen, håndskrevet): «Følg fotsporene mine, og løft det de ender ved. – R»
- **Brikke S:** Julius: «Hjerterud prøvde å varme opp IQ med det hun lager når sukker blir brunt og varmt i gryta. Det stivner til gull når det kjølner. Han spiste ikke engang det.» (Delt i to setninger 12. november så hvert videosegment holder 15 s; ordene står.)
- **Slik løses den:** 1) H9 følger sporene og løfter det de ender ved; to spor ender i ingenting. 2) K12 har A, M, L uten plass. Notatboken åpner i NisseNet; margnotatet gir 2, 5, 7. `_ A _ _ M _ L _`. 3) Brunt, varmt sukker, åtte bokstaver. KARAMELL. Arkivet del 2 åpner.
- **Hint:** 1) «Har dere lest lappen ved sirupskålen? Følg fotsporene på benken.» Hanna kan følge dem med fingeren. [Kjøkkenbenken: lappen ved skålen] 2) «Hvilke spor går helt fram, og hvilke stopper på veien? Løft det sporene ender ved. Hva ligger under?» [NisseMail i dag: «Noen gikk helt fram, noen stoppet.»] 3) «Tre bokstaver og åtte ruter, men ingen tall. Hjerterud har skrevet noe i margen på notatboken. Hvilke redskaper nevner hun?» [NisseNet: FARGESAMLEREN/02-notatboken.txt] 4) «Sett bokstavene i rutene Hjerterud sier. Hva lager hun når sukker blir brunt og varmt i gryta, det som stivner til gull?» [Julius-videoen, segment 4 og 5]
- **Hanna (hvis hun vil):** smaker én fingertupp sirup, skanner sol-kortet (symbol 5/9).
- **Andel per flate:** hus 3 av 8 (38 %) uten posisjon. Fil: posisjon uten bokstaver. Video: beskrivelse.
- **Vanskelighet:** 4.
- **Oppsett:** 5 min.
- **Sjekkliste:**
  - Skriv ut: `dag15-redskapskort.pdf`
  - Gryte, sleiv, visp, kjevle og øse på benken
  - Kort under: gryte A, sleiv M, visp L, kjevle og øse ❄
  - Fotsporstrimler fra skålen til alle fem; de korte mot kjevle og øse
  - Rutekort og rødt sol-kort ved sirupskålen
  - Lapp ved sirupskålen: «Følg fotsporene mine … – R»
  - Rampestrek: Rampenissen ved en liten skål sirup; rydd bort flasken og sukkeret
- **Materialer:** gryte, sleiv, visp, kjevle, øse (finnes), kortene, sol-kortet, en liten skål med litt sirup.
- **Utskrifter:** `dag15-redskapskort.pdf` (2 sider: tykt papir med tre bokstavlapper, to ❄-lapper og ett rutekort; vanlig papir med fem fotsporstrimler, to av dem korte).
- **Reserve:** Flytter noen strimlene, står redskapene på benken uansett; ❄-kortene sier hvilke som ikke teller. Leser de ikke filen, gir bokstavene og Julius ordet likevel; filen bekrefter plasseringen.

### Dag 16 (on) – Pakkesentralen i Spinn · SORTERING + bonus

- **Kode:** SORTERING (uendret). Bonus: lykt i vinduet mot nord, foreldrekode `LYKT2026`, −20 % frost.
- **Mekanikk:** legg tilbake, og tingen får plassens nummer, som før. Nytt: en fjerde feilplassert ting (ostehøvelen i badeskapet) med bokstaven **K**; på dens riktige plass ligger ingen tallapp. Uten tall, ingen rute: den hører ikke til ordet.
- **Brikke H:** bokstavlapper på fjernkontrollen (i brødboksen) **O**, tannbørsteglasset (i bestikkskuffen) **E**, brødposen (i TV-benken) **I**, ostehøvelen (i badeskapet) **K**. Tallapper på de riktige plassene: «2» i TV-benken, «5» på badehyllen, «7» i brødboksen; ingen i bestikkskuffen der ostehøvelen hører hjemme. Rutekort 1–9 i brødboksen under Rampenissen. Lapp fra Rampenissen (på brødbokslokket, håndskrevet): «Jeg har ryddet! Bær hver ting dit den hører hjemme, og se hva som ligger der. – R»
- **Brikke S:** Julius: «Winters ord for å legge alt i riktig hylle. Han sier det med stor S og har et skilt med det over døra.»
- **Slik løses den:** 1) H9 bærer hver ting dit den hører hjemme og finner tallappen der, eller ikke. 2) K12 fyller rutekortet: O i 2, E i 5, I i 7; K har ingen plass og legges bort: `_ O _ _ E _ I _ _`. 3) Winters ord for riktig hylle, ni bokstaver. SORTERING. NisseStats åpner.
- **Hint:** 1) «Har dere lest lappen på brødbokslokket? Hvilke ting ligger på helt feil sted i huset?» Hanna kan si hvor hver ting bor. [Kjøkkenet: lappen på brødboksen, rutekortet oppi] 2) «Bær én ting om gangen dit den hører hjemme. Hva står på tingen, og hva ligger på plassen der den skal stå?» 3) «Bokstaven på tingen skal i ruten med tallet fra plassen. Fant dere tall på alle plassene? Hva gjør dere med en bokstav som ikke får noe tall?» [NisseMail i dag: «Ikke alt jeg rotet med, hører til.»] 4) «Ni ruter, O som nummer to, E som nummer fem og I som nummer sju. Hva kaller Winter det å legge alt i riktig hylle? Han sier det med stor S.» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** sier hvor hver ting hører hjemme.
- **Andel per flate:** hus 3 av 9 (33 %) pluss ett blindspor, og bare etter rydding. Video: beskrivelse.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min utover streken.
- **Sjekkliste:**
  - Skriv ut: `dag16-sorteringslapper.pdf`
  - Fjernkontrollen med O i brødboksen, tannbørsteglasset med E i bestikkskuffen
  - Brødposen med I i TV-benken, ostehøvelen med K i badeskapet
  - Tallapper: 2 i TV-benken, 5 på badehyllen, 7 i brødboksen
  - Rutekortet i brødboksen under Rampenissen
  - Lapp på brødbokslokket: «Jeg har ryddet! … – R»
  - Rampestrek: Rampenissen i brødboksen med lokket på hodet
- **Materialer:** teip, lappene, fjernkontroll, tannbørsteglass, brødpose, ostehøvel, brødboks. Bonus: syltetøyglass, batterilys.
- **Utskrifter:** `dag16-sorteringslapper.pdf` (1 side, tykt papir, 4 bokstavlapper, 3 tallapper, 1 rutekort).
- **Reserve:** Setter de en ting feil, mangler tallappen der, og de prøver neste plass. Presser de K inn, blir det et ord Julius ikke beskriver.

### Dag 17 (to) – Grønt over Polarhimmelen · NORDLYS

- **Kode:** NORDLYS (uendret).
- **Mekanikk:** båndet er et målebånd, som før. Nytt: merke 2 og 5 bærer tegnene for **O** og **L**, ikke bokstavene. Meta 1 brukes igjen midt i måneden.
- **Brikke H:** 1,5 m grønt gavebånd med sju sølvmerker med lik avstand og en tegnet sløyfe før merke 1. Sju små kort fra `dag17-baandkort.pdf` teipes ved merkene: 1 ❄, 2 tegn O, 3 ❄, 4 ❄, 5 tegn L, 6 ❄, 7 ❄ (❄-kortene har tegn i hjørnet). Båndet rundt Rampenissen og stolen med én enkel sløyfe. Lapp fra Rampenissen (ved løsepengebrevet, håndskrevet): «Strekk båndet ut mellom to stoler, og les fra sløyfen. – R»
- **Brikke S:** Julius: «De gamle her oppe hadde et navn på det grønne lyset. De sa at himmelen snakket når det kom. Nissene sier det er himmelen som sender brev tilbake: grønt, bølgende, over fjellene, og bare når det er mørkt nok.»
- **Slik løses den:** 1) H9 løsner sløyfen, strekker båndet mellom to stoler og leser fra sløyfen. 2) K12 slår opp tegnene på tavla: `_ O _ _ L _ _`. 3) Grønt lys på himmelen i nord, sju bokstaver. NORDLYS. K1: klikk på himmelen bekrefter.
- **Hint:** 1) «Hvem har bundet fast Rampenissen? Les lappen ved løsepengebrevet.» Hanna kan dra i sløyfen og slippe ham fri. 2) «Strekk båndet ut mellom to stoler. Hvor mange merker har det, og hvor skal dere begynne å lese?» [Lappen: «les fra sløyfen»] 3) «På merke to og fem står det tegn, ikke bokstaver. Hvor slår dere opp sånne?» [NisseMail i dag: «Det står tegn på det, ikke bokstaver.» Runetavla] 4) «Sju ruter, O som nummer to og L som nummer fem. Hva kalte de gamle det grønne lyset som bølger over fjellene når det er mørkt nok?» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** drar i sløyfen og slipper Rampenissen fri.
- **Andel per flate:** hus 2 av 7 (29 %), bare for den som har tavla. Video: beskrivelse av fenomenet.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min (merk båndet, teip kortene, bind).
- **Sjekkliste:**
  - Skriv ut: `dag17-baandkort.pdf`, `dag17-losepengebrev.pdf`
  - Sett sju sølvmerker med lik avstand på 1,5 m grønt bånd
  - Tegn en sløyfe på båndet før merke 1
  - Teip kortene ved merkene: O på 2, L på 5, ❄ på resten
  - Bind Rampenissen til en stol med båndet, én enkel sløyfe
  - Lapp ved løsepengebrevet: «Strekk båndet ut … les fra sløyfen. – R»
  - Rampestrek: kosedyrene står vakt, løsepengebrev: «GI OSS ALLE PEPPERKAKENE. ELLERS.»
- **Materialer:** grønt gavebånd, sølvpenn, teip, kortene.
- **Utskrifter:** `dag17-baandkort.pdf` (1 side, tykt papir, 7 små kort). Valgfri: `dag17-losepengebrev.pdf`.
- **Reserve:** Blir båndet klippet, legges bitene etter hverandre med sløyfen først. Mangler tavla O eller L, henger kortene fra dag 4 og 1 på brettet.

### Dag 18 (fr) – Kastevind rundt Ulriken · TURBULENS + blå sol · krypto 2

- **Kode:** TURBULENS (uendret).
- **Mekanikk:** tell rosinhaugene, som før. Nytt: en fjerde haug med 9 rosiner over et ❄-kort (rute 9 er ❄ uansett; harmløst, men må telles). Kortene U og B har tegn: B læres her for første gang (trengs dag 20), U bekreftes (lært dag 7). Meta 2 plantes: `stjernetegn.txt` (belønningen for krypto 2) er Trixters kart med åtte varder og Julius' sirkel på varde 5.
- **Brikke H:** sjokoladerosiner i et spor; fire hauger på hver sin serviett: 2 rosiner over **U**, 4 over **B**, 7 over **E**, 9 over ❄. Rutekort 1–9 i pappas jakkelomme med Rampenissen; blått sol-kort i den andre lommen. Lapp fra Rampenissen (i jakkelommen hos Rampenissen, håndskrevet): «Følg sporet baklengs fra kjøleskapet. Tell rosinene i hver haug, og løft det som ligger under. – R»
- **Brikke S:** Julius: «Når lufta får sleden til å hoppe og riste uten at noen ser hvorfor, har Trixter ett ord for det. Han sier det med sammenbitte tenner.» (Omskrevet: uten haugene kan det være kastevind, lufthull eller uro; med `_ U _ B _ _ E _ _` er det TURBULENS.)
- **Slik løses den:** 1) H9 følger sporet baklengs og finner haugene, teller rosinene og løfter kortene. 2) K12 fyller: `_ U _ B _ _ E _ _`. 3) Trixters ord for usynlig risting i lufta, ni bokstaver. TURBULENS. 4) NisseKrypto 2 → `stjernetegn.txt`. Les kartet: sirkelen på varde 5 trengs igjen dag 21.
- **Hint:** 1) «Rudolf la igjen noe på gulvet i natt. Og hvem sitter i pappas jakkelomme? Les lappen han har med seg.» [Gangen: Rampenissen, lappen og rutekortet i jakkelomma] 2) «Følg sporet baklengs fra kjøleskapet. Tell rosinene i hver haug før noen spiser dem, og løft det som ligger under.» Hanna kan telle høyt. 3) «Antall rosiner er nummeret på ruten. Hvilken bokstav skal i hvilken rute på rutekortet?» [NisseMail i dag: «hvor mange rosiner var det i hver haug, og hva lå under?»] 4) «Ni ruter, U som nummer to, B som nummer fire og E som nummer sju. Hva kaller Trixter det når lufta får sleden til å hoppe og riste uten at noen ser hvorfor?» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** teller rosinene i haugene (2, 4, 7, 9) og får Rampenissen løs fra lommen. Skanner sol-kortet (symbol 6/9).
- **Andel per flate:** hus 3 av 9 (33 %). Video: beskrivelse.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min.
- **Sjekkliste:**
  - Skriv ut: `dag18-rosinkort.pdf`
  - Skriv ut reservesett: `dag18-rosinkort.pdf`
  - Rosinspor på gråpapir fra ytterdøra mot kjøleskapet, fire servietter med kort under
  - Rosiner på hver serviett: like mange som prikkene bak kortet
  - Rutekortet i pappas jakkelomme med Rampenissen, blått sol-kort i den andre
  - Lapp i jakkelommen: «Følg sporet baklengs fra kjøleskapet … – R»
  - Rampestrek: Rampenissen fast i jakkelommen, peker anklagende på «reinsdyrbæsjen»
- **Materialer:** én pose sjokoladerosiner, grått papir eller løper til sporet, 4 servietter, pappas jakke, kortene.
- **Utskrifter:** `dag18-rosinkort.pdf` (1 side, tykt papir, 3 bokstavkort, 1 ❄-kort og 1 rutekort).
- **Reserve:** Spiser noen av sporet før telling, står tallet som prikker på baksiden av hvert kort.

### Dag 19 (lø) – Eksplosjon i Fôringsautomaten · GULROT · pusterom · jakt

- **Kode:** GULROT (uendret).
- **Mekanikk:** legg i rutenett etter tall, som før. Dagen er pusterom med vilje (Kulde-nivå 0) og holdes lett. Lappene får tegn.
- **Brikke H:** merkelapper på hyssing rundt foliepakkene: stue `U · 2`, kjøkken `O · 5`, gang `❄ · 3`. Ruteark med seks ruter under «BEVIS»-pakken. Pakkene åpnes først etter koden. Lapp fra Rampenissen (på rutearket i teipomrisset, håndskrevet): «Tre bevis landet i tre rom. Ikke pakk dem opp! Legg hver pakke på ruten med samme tall. – R»
- **Brikke S:** Julius: «IQ bygde en automat. Den eksploderte. Drivstoffet, Håkon. Det oransje drivstoffet Rudolf vil ha før hver tur, og som IQ nå har førti for lite av. Det vokser med toppen opp og resten nede i jorda.»
- **Slik løses den:** 1) H9 jakter i tre rom. 2) Pakkene legges på rutene med samme tall: `_ U _ _ O _`. 3) Rudolfs oransje drivstoff, seks bokstaver. GULROT.
- **Hint:** 1) «Har dere lest lappen på rutearket? Tre bevis landet i tre rom. Ikke pakk dem opp!» [Rutearket i teipomrisset. Pakkene ligger i stua, på kjøkkenet og i gangen] 2) «Hva står på merkelappene som henger i hyssingen?» 3) «Legg hver pakke på ruten med samme tall.» Hanna kan legge dem. «Hvilke bokstaver står hvor?» [NisseMail i dag: «ligger hver pakke på ruten med samme tall?»] 4) «Seks ruter, U som nummer to og O som nummer fem. Hva er oransje, vokser med toppen opp og resten nede i jorda, og er det Rudolf vil ha før hver tur?» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** legger pakkene på rutene.
- **Andel per flate:** hus 2 av 6 (33 %). Video: beskrivelse.
- **Vanskelighet:** 2.
- **Oppsett:** 6 min (helg).
- **Sjekkliste:**
  - Skriv ut: `dag19-bevislapper.pdf`
  - Pakk fire gulrøtter i folie; hyssing med merkelapp rundt tre
  - Pakkene: U · 2 i stua, O · 5 på kjøkkenet, ❄ · 3 i gangen
  - Teipomriss på kjøkkengulvet, med rutearket og «BEVIS»-pakken i
  - Lapp på rutearket: «Tre bevis landet i tre rom … – R»
  - Rampestrek: Rampenissen flat i teipomrisset med plaster på pannen
- **Materialer:** 4 små gulrøtter, aluminiumsfolie, hyssing, maskeringsteip, arket.
- **Utskrifter:** `dag19-bevislapper.pdf` (1 side, tykt papir).
- **Reserve:** Pakker noen opp for tidlig, er skjelettet fortsatt bare 2 av 6.

### Dag 20 (sø) – Sofa-Sleden · TURBO + grønn måne · 4. advent · varselet

- **Kode:** TURBO (uendret).
- **Mekanikk:** puter inne i fortet, som før, men i rot. Rekkefølgen er størrelsen: Rampenissen «stablet etter størrelse, den største som nummer én» og veltet alt. Putene må sorteres etter størrelse før kortene gir rekkefølge. Kortene bærer tegn for **U** (lært dag 7) og **B** (lært dag 18). Meta 2 utløses: Julius sier hvor porten står.
- **Brikke H:** fem puter i tydelig ulik størrelse inne i fortet, hulter til bulter. Bruk hva som helst som er pute: sofaputer, pynteputer, en hodepute, en barnepute; det viktige er at ingen to er like store. Under den nest største: tegn U. Under den fjerde største: tegn B. Under de tre andre ❄ (med tegn i hjørnet). Grønt måne-kort under den minste. Skiltet «KUN FOR SIGMAS. 6-7.» ved inngangen. Lapp fra Rampenissen (ved inngangen til fortet, håndskrevet): «Putene lå etter størrelse, den største som nummer én. Så veltet jeg. Unnskyld. – R»
- **Brikke S:** Julius: «IQ ga sledemotoren det samme som biler får når de skal forbi noen i bakken. IQ elsker ordet. Han roper det hver gang motoren starter, og motoren hviner tilbake.» Deretter varselet og, i siste segment: «Jeg har bedt om én port. Den står der jeg tegnet sirkelen på Trixters kart.»
- **Slik løses den:** 1) H9 henter putene ut og legger dem etter størrelse. 2) K12 slår opp tegnene: `_ U _ B _`. 3) Det biler får i bakken, fem bokstaver. TURBO. 4) E-post og radio: finn fram bøker til i morgen. K12 noterer: porten = sirkelen på kartet fra dag 18.
- **Hint:** 1) «Har dere lest lappen ved inngangen til fortet? Hvordan lå putene før Rampenissen veltet?» Hanna kan krype inn og rekke ut putene. [Lappen ved fortet] 2) «Legg putene på rekke etter størrelse, den største som nummer én. Hva lå under hver pute?» [NisseMail i dag: «den største som nummer én»] 3) «To av kortene har tegn, ikke bokstaver. Slå dem opp på runetavla. Hvilket nummer har de to putene i rekka?» 4) «Fem ruter, U som nummer to og B som nummer fire. Hva får biler når de skal forbi noen i bakken? IQ roper det hver gang motoren starter.» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** kryper inn i fortet og rekker ut putene. Skanner måne-kortet (symbol 7/9).
- **Andel per flate:** hus 2 av 5 (40 %), bare etter sortering og med tavla. Video: beskrivelse.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min utover fortet (teppe over to stoler, popcorn i skål).
- **Sjekkliste:**
  - Skriv ut: `dag20-putekort.pdf`, `dag20-fortskilt.pdf`
  - Skriv ut reservesett: `dag20-putekort.pdf`
  - Fem puter i tydelig ulik størrelse, hulter til bulter i fortet
  - Kort under hver pute etter prikkene bak: 1 under den største
  - Grønt måne-kort under den minste puten
  - Lapp ved inngangen: «Putene lå etter størrelse … Så veltet jeg. Unnskyld. – R»
  - Rampestrek: teppefort over to stoler med skilt, hodetelefoner og popcorn
- **Materialer:** 5 puter av hvilket som helst slag i ulik størrelse, kortene, måne-kortet, 8 bøker klare til mandag.
- **Utskrifter:** `dag20-putekort.pdf` (1 side, tykt papir, 5 kort med prikker 1–5 på baksiden).
- **Reserve:** Er to puter like store, teller prikkene på baksiden. Er dag 18 hoppet over, mangler tavla B: `runer-fasit.pdf` i Nissemor-guiden, eller si at B er bokstaven under pute 4.

### Dag 21 (ma) – Vintersolverv · BRANNMUR · M5 · frost nivå 2

- **Kode:** BRANNMUR (uendret).
- **Mekanikk:** bokmur lest fra venstre, som før. Nytt: bare én bokstav står på ryggene. Den andre ligger som kort inne i én bok, porten. Hvilken bok som er porten, sa Julius dag 20: der sirkelen står på Trixters kart (varde 5). Boka Rampenissen satte på gløtt (bok 3) er feil og inneholder et ❄-kort med teksten «Feil bok. Hvor satte Julius sirkelen?». Meta 2 betaler seg. **Standardvalg, kan endres:** dagen løses etter skolen; frosten varer til koden er inne (nødstopp 20:00).
- **Brikke H:** åtte bøker som lav mur foran skjermen. Ryggkort fra venstre: 1 ❄, 2 **R**, 3 ❄, 4 ❄, 5 ❄, 6 ❄, 7 ❄, 8 ❄, alle med lite rutetall i hjørnet og tegn. Inne i bok 5: kortet `U · 7` (med tegn). Inne i bok 3 (på gløtt): et ❄-kort med teksten «Feil bok. Hvor satte Julius sirkelen?». Grytelokket og vispen står inntil. Skjerm og app er fryst fra morgenen.
- **Brikke S:** Julius: «IQ bygde en vegg av varme rundt linjen. Veggen har et navn. De som kjemper mot flammene i skogen, bygger samme slags vegg, og kaller den etter det de kjemper mot.» Så: «Jeg lot ham la én port stå åpen. Inn mot grotten. Med varme i.»
- **Slik løses den:** 1) H9 leser ryggkortene fra venstre: bare R på 2. 2) K12 husker dag 20: porten er sirkelen på Trixters kart. Åpner `stjernetegn.txt`: varde 5. Åpner bok 5: `U · 7`. (Bok 3 på gløtt gir ❄ og «Feil bok».) 3) `_ R _ _ _ _ U _`, brannfolkenes vegg, dataordet for en vegg som slipper noe gjennom. BRANNMUR. Kanalene tiner, porten tegnes i sidepanelet, merket Portvokter.
- **Hint:** 1) «Les ryggene på bokmuren fra venstre. Hvor mange bokstaver står ute?» Hanna kan lese og si «bokstav» eller «is». [Bokmuren foran skjermen] 2) «Én bokstav til ligger inne i en bok, i porten. Hva sa Julius i går om hvor porten står?» [NisseMail i dag: «Bare én bokstav står ute; den andre ligger inne i porten.» Julius-videoen dag 20, segment 5] 3) «Julius tegnet en sirkel på Trixters kart. Hvilket nummer har varden med sirkel rundt? Tell like mange bøker fra venstre.» [NisseNet: DEKRYPTERT/stjernetegn.txt] 4) «Åtte ruter, R som nummer to og U som nummer sju. De som kjemper mot flammene i skogen, bygger samme slags vegg som IQ. Hva kaller de den?» [Julius-videoen, segment 3 og 4]
- **Hanna (hvis hun vil):** leser ryggkortene og sier «bokstav» eller «is».
- **Andel per flate:** hus 1 av 8 synlig (13 %), 2 av 8 (25 %) etter at porten er funnet. Fil (dag 18): tallet, ingen bokstaver. Video: beskrivelse.
- **Vanskelighet:** 5.
- **Oppsett:** 4 min (åtte ryggkort, to kort i to bøker). Ingenting digitalt kvelden før.
- **Sjekkliste:**
  - Skriv ut: `dag21-portkort.pdf`
  - Åtte bøker som lav mur foran skjermen
  - Teip ryggkortene på bøkene etter rutetallet, fra venstre
  - Kortet U · 7 inne i bok 5
  - ❄-kortet «Feil bok» inne i bok 3, som står på gløtt
  - Rampestrek: Rampenissen bak muren med grytelokk og visp
- **Materialer:** 8 bøker, teip, kortene, grytelokk, visp.
- **Utskrifter:** `dag21-portkort.pdf` (1 side, tykt papir: 8 ryggkort, kortet `U · 7`, ett ❄-kort). Erstatter post-it og den valgfrie `dag21-bokryggkort.pdf`.
- **Reserve:** Er krypto 2 ikke løst, sier PS dag 20 fra (betinget variant), og Nissemor-guiden har fasit. Faller muren, har ryggkortene tall i hjørnet. Åpner de alle bøkene, finner de kortet likevel; det koster bare tid.

### Dag 22 (ti) – Winters Tall · LANDÅS + rød måne · Snill-listen · jakt

- **Kode:** LANDÅS (uendret).
- **Mekanikk:** A = 1, pluss tre. Uendret; dagen holder nivået.
- **Brikke H:** tre sokker merket 1, 2, 3 med **to separate tallkort** i hver, uten bindestrek eller minustegn (et tankestrek leses lett som minus): sokk 1 (stua) `15` og `4`, sokk 2 (kjøkkenet) `17` og `7`, sokk 3 (Hannas sokk i gangen, med Rampenissen i) `32` og `22` og det røde måne-kortet. Kortene har et lite a/b i hjørnet for rekkefølgen. Ingen bokstaver, ingen regnetegn. Lapp fra Rampenissen (i sokk 3, ved Rampenissen, håndskrevet): «Jeg er sokk 3. Sokk 1 og 2 er et annet sted i huset. – R»
- **Brikke S:** Julius: «Winter skriver tall i stedet for bokstaver når noe er viktig. Han har en regel. A er alltid først, og så følger resten, helt til de tre siste som bare vi i nord har. Winter er forsiktig også. Og han legger alltid tre til hvert tall, for sikkerhets skyld. Trekk dem fra.»
- **Slik løses den:** 1) H9 finner sokkene og drar Rampenissen ut av den tredje. 2) K12 hører begge reglene, trekker fra tre og teller på strimmelen: 12 = L, 1 = A, 14 = N, 4 = D, 29 = Å, 19 = S. LANDÅS. 3) Navneregistrering etter koden.
- **Hint:** 1) «Rampenissen er sokk tre. Hvor i huset er sokk én og to?» Hanna kan dra Rampenissen ut av sokken sin. [Gangen: lappen i sokk tre. De to andre er i stua og på kjøkkenet] 2) «Legg kortene på rekke: sokk én, to og tre, og a før b i hver sokk. Hva slags kort er det? Ser dere noen bokstaver?» 3) «Winter har to regler for tallene sine. Hvilket tall er A? Og hva legger han alltid til?» [Julius-videoen, segment 4 og 5] 4) «Trekk fra tre på hvert kort. Tell så like mange ruter på alfabetstrimmelen fra brevfuglen. Husk at alfabetet slutter på Å.» [NisseMail i dag: «strimmelen fra brevfuglen». NisseNet: SNOFALL-HISTORIER/alfabet.txt]
- **Hanna (hvis hun vil):** drar Rampenissen ut av sin egen sokk. Skanner måne-kortet (symbol 8/9).
- **Andel per flate:** hus 6 tall uten regler. Video: to regler uten tall.
- **Vanskelighet:** 4.
- **Oppsett:** 5 min.
- **Sjekkliste:**
  - Skriv ut: `dag22-sokkelapper.pdf`
  - Sett sokkemerkene 1, 2 og 3 på tre julesokker
  - Sokk 1 i stua (1a, 1b), sokk 2 på kjøkkenet (2a, 2b)
  - Sokk 3 (Hannas) i gangen: 3a, 3b og rødt måne-kort
  - Legg fram alfabetstrimmelen fra dag 5
  - Lapp i sokk 3: «Jeg er sokk 3 … – R»
  - Rampestrek: Rampenissen i sokk 3 med bare føttene ut
- **Materialer:** 3 julesokker, lappene, strimmelen fra dag 5, måne-kortet.
- **Utskrifter:** `dag22-sokkelapper.pdf` (1 side, tykt papir, seks tallkort merket 1a, 1b, 2a, 2b, 3a, 3b og tre sokkemerker).
- **Reserve:** Glemmer de å trekke fra, får de tull og går tilbake til transkriptet.

### Dag 23 (on) – Nattevakt · STJERNEKLART + blå måne · sannheten · krypto 3

- **Kode:** STJERNEKLART (uendret).
- **Mekanikk:** nummererte stjerner i treet, som før. Nytt: tallene på baksiden er romertall (I–XII), tilbakeblikk til dag 2. Fargesamlerens siste side (fil etter krypto 3) får en siste linje i tegn: «KOM NED MED LYS», lesbar for den som har holdt tavla (Å læres aldri; derfor ikke «gå»).
- **Brikke H:** tolv stjerner i treet, de laveste i Hannas høyde. Forside: nr. 5 **R**, nr. 8 **K**, nr. 10 **A**, resten ❄; alle med tegn. Bakside: I–XII. Rampenissen i treet med det blå måne-kortet.
- **Brikke S:** Julius: «Orakelet meldte flyværet i ett ord. Ikke en sky, ikke én. Været har et ord for en natt der alt som blinker der oppe er synlig hele veien. Ordet begynner med det som blinker.» (Delt i to setninger 12. november, samme grunn.)
- **Slik løses den:** 1) H9 plukker stjernene (en voksen løfter til de høye). 2) H9 legger dem etter romertallet og snur dem: `_ _ _ _ R _ _ K _ A _ _`. 3) K12: tolv bokstaver, værordet for en natt uten skyer. STJERNEKLART. 4) NisseKrypto 3 → `hjertets-hemmelighet.txt` og siste side.
- **Hint:** 1) «Hva henger i treet i dag som ikke hang der i går? Hvor mange er det?» Hanna kan ta de lave. En voksen løfter til de høye. [Juletreet: tolv, med Rampenissen] 2) «Snu dem. Hva står på baksiden? Hvor har dere sett sånne tall før?» [NisseMail i dag: «Tallene er skrevet slik IQ skriver dem.» Kortene fra dag 2] 3) «Legg dem på rekke etter tallet bak, og snu dem med forsiden opp. Hvilke bokstaver står hvor?» 4) «Tolv ruter, R som nummer fem, K som nummer åtte og A som nummer ti. Hva sier værmeldingen om en natt uten en eneste sky? Ordet begynner med det som blinker der oppe.» [Julius-videoen, segment 3 til 5]
- **Hanna (hvis hun vil):** tar de lave stjernene. Skanner måne-kortet (symbol 9/9).
- **Andel per flate:** hus 3 av 12 (25 %). Video: beskrivelse i to ledd.
- **Vanskelighet:** 4.
- **Oppsett:** 3 min (klipping og tråd i november).
- **Sjekkliste:**
  - Skriv ut: `dag23-stjerner.pdf`
  - Skriv ut reservesett: `dag23-stjerner.pdf`
  - Heng de tolv stjernene i treet, de laveste i Hannas høyde
  - Rampenissen i treet med blått måne-kort
  - Rampestrek: en gave under treet teipet igjen med altfor mye teip
- **Materialer:** hyssing, stjernearket, måne-kortet.
- **Utskrifter:** `dag23-stjerner.pdf` (1 side, tykt papir, tolv stjerner med romertall bak).
- **Reserve:** Mangler én stjerne, er krystallstjernene ikke nødvendige for ordet, bare for plasseringen.

### Dag 24 (to) – God Jul på Landås · JULEMAGI · M6 Tøvær

- **Kode:** JULEMAGI (uendret).
- **Mekanikk:** tre suvenirer fra desember, som før. Nytt: lappene bærer tegn (U, E, G) og rutetall, ikke bokstaver. Dekodingen er enkel for den som har tavla, og det er poenget. **Standardvalg, kan endres:** finalen er lett med vilje; den handler om følelsen, ikke om en ny prøve. Ved krystallet under treet ligger et kort med «TAKK FOR LYSET» i tegn: Vintervokterens eneste ord til dem.
- **Brikke H:** pappesken med sløyfe ved konvolutten: perlen med lapp `tegn U · 2`, filteret `tegn E · 4`, båndbiten `tegn G · 7`. I gullkonvolutten: avskjedsbrevet, rutekort med åtte ruter og alltid de tre reservelappene (samme tegn og tall, «IQs kopi»). Krystallet under treet med runekortet.
- **Brikke S:** Julius: «Dere har laget noe hele desember uten å vite det. Ikke koden, den tastet dere. Ikke varmen, den kom fra ovnen. Det trollmenn later som de har, og som dere faktisk har hatt: tre søsken som holder sammen i mørket. Og Hjerterud setter alltid navnet på høytiden foran ordet, slik hun gjør med grøten og treet.»
- **Slik løses den:** 1) Kofferten åpnes; de tre tingene kjennes igjen. 2) H9 leser avskjedsbrevet høyt og legger lappene i rutekortet; K12 slår opp tegnene: `_ U _ E _ _ G _`. 3) Høytiden foran + det trollmenn later som de har. JULE + MAGI. Brevet i Brevfugler tiner, Snill-listen med finale, diplom, merket Snøfalls venn. 4) Runekortet ved krystallet leses sammen.
- **Hint:** 1) «Hva ligger i esken med sløyfe? Kjenner dere igjen tingene?» Hanna kan si hvilken dag hver ting kommer fra. [Pappesken ved gullkonvolutten] 2) «Håkon, les brevet fra Rampenissen høyt. Hva mer ligger i konvolutten? Og hva står på lappene som henger på tingene?» [NisseMail i dag: «rutekortet ligger i konvolutten, lappene har tegn»] 3) «Slå opp tegnene på runetavla, og skriv bokstavene i rutene med samme tall.» 4) «Åtte ruter, U som nummer to, E som nummer fire og G som nummer sju. Julius sier to ting. Hva setter Hjerterud foran grøten og treet? Og hva later trollmenn som de har?» [Julius-videoen, segment 4 og 5]
- **Hanna (hvis hun vil):** åpner kofferten og sier hvilken dag hver ting kommer fra.
- **Andel per flate:** hus 3 av 8 (38 %), for den som har tavla. Video: to ledd uten å si noen av dem.
- **Vanskelighet:** 3.
- **Oppsett:** 4 min.
- **Sjekkliste:**
  - Skriv ut: `dag24-suvenirlapper.pdf`, `dag24-krystallkort.pdf`, `diplom.pdf`
  - Pappesken med sløyfe: perlen (U · 2), filteret (E · 4), båndbiten (G · 7)
  - Gullkonvolutten i treet: avskjedsbrev, rutekort, tre reservelapper
  - Krystallet med runekortet og den siste klementinen under treet
  - Rampestrek: Rampenissen er borte; pappesken står under treet som koffert
- **Materialer:** liten pappeske (den tomme fraktesken fra dag 1), sløyfe, gullkonvolutt, perlen, filteret og båndbiten, krystallet, runekortet, og den siste klementinen fra Hjerteruds proviant ved siden av krystallet (uten lapp, så den ikke forveksles med merkelappene).
- **Utskrifter:** `dag24-suvenirlapper.pdf` (1 side, tykt papir, 3 lapper med tegn, rutekort, 3 reservelapper), `dag24-krystallkort.pdf` (1 side, tykt papir) og diplomene «Snøfalls venn» (3 sider).
- **Reserve:** Reservelappene ligger i konvolutten. Mangler tavla et tegn, står de tre bokstavene i Nissemor-guiden; julaften er ikke dagen for å stå fast.

## Avvik fra storyboardet (ingen historiebeats er endret)

- Skjeletter strammet til taket på dag 3, 4, 6, 8, 10, 12–21, 23, 24. Første-og-siste-feil rettet på dag 7, 19, 20.
- Dag 1: bokstavkort på tråden, men bare to med bokstav (avgjørelse 1 lukket).
- Dag 5: Cæsar tre skritt, ikke ett. Julius' setning justert.
- Dag 6: skyggefigurer i tre rør; Julius velger figuren (avgjørelse lukket).
- Dag 10: sju fargekort i regnbuens rekkefølge; `farge-koder.txt` lister sju farger, ikke fire.
- Dag 23: Julius sier ikke «stjerner».
- Dag 24: suvenirer fra dag 3, 10 og 17 i kofferten; Julius' setning i to ledd (avgjørelse 3 lukket).
- Dag 13, 21, 23: skjelett strammet til 1, 2 og 3 bokstaver etter gjennomgangen (rekvisitten selv er et hint).
- Dag 15: sporet går til redskaper, ikke ingredienser. Dag 19: gulrøttene er pakket i folie, også «BEVIS» i §8-streken. Dag 22: Winter legger til tre.
- Dag 17: Julius beskriver fenomenet, ikke orddelene.
- Dag 20: foreslått forenkling av §8-streken (skål med popcorn, teppe over to stoler).
- Ingen kode er endret. Bonuskoden dag 16 er `LYKT2026` som avgjort.

**Revisjon vanskelighet (10. november, godkjent):**

- Tegn i hjørnet av alle kort (meta 1); runetavle på brettet fra dag 1; kort i tegn dag 7, 17, 20, 24; runelinjer i spøkelsesbildet og i to filer.
- Trixters kart med åtte varder og sirkel på varde 5 (meta 2); porten dag 21 er bok 5.
- Posisjon tatt bort fra lappen: dag 14 (to bretter), 15 (margnotat i notatboken), 20 (sortering etter størrelse).
- To steg: dag 2 (romertall), 3 (speilvendt), 4 (retning ukjent), 23 (romertall).
- Blindspor: dag 1 (løse kort), 8 (åpen bryter), 9 (fem falske), 10 (HVIT), 11 (to falske sendere), 12 (krus), 13 (gurkemeie), 15 (to døde spor), 16 (ostehøvel), 18 (fjerde haug), 21 (bok på gløtt).
- Nøkler på tvers av dager: dag 5 (sikringene dag 2), krypto 1 (fargene i PS dag 3/6/9), dag 21 (kartet dag 18).
- Hanna: ingen kodebærende steg; én valgfri linje per dag. Avgjørelse (d) 4 utgår.
- Julius: nye segmenter dag 5/4, 7/3, 7/5, 8/3, 9/4, 11/4 (+ nytt 11/5), 20/5. Dag 2–4 uendret.

## Til byggelisten (steg 3, JSON og filer)

- `uke3_oppdrag.json` dag 16: `foreldre_kode` fra `SORTER2026` til `LYKT2026` (E2).
- `uke1_oppdrag.json` dag 5: `nissemail_tekst` og `hint` nevner i dag `VMSJLFO` og ett skritt; skrives om uten chiffer (E1). Chifferet står bare på fuglen.
- `farge-koder.txt` (N1): regnbuens sju farger i rekkefølge, ingen bokstaver.
- `alfabet.txt` (N1): bare A–Å, ingen tall, ingen regel.
- NisseMail dag 19: setningen «IQ sier: ikke pakk opp bevis» (E1).
- Tegnsett: 29 glyffer (font eller SVG) brukt i alle kort-PDF-er, `runetavle.pdf`, `runer-fasit.pdf` og i spøkelsesbildet (`transcript_runer`, nytt felt i `kulde_spokelsesbilde` dag 10, 13, 16, 21).
- `uke3_oppdrag.json` dag 20: ny betinget PS `julius_ps_krypto_mangler` (vises når `stjernetegn` ikke er dekryptert).
- `DEKRYPTERT/stjernetegn.txt`: kart med åtte varder, sirkel på 5. `FARGESAMLEREN/02-notatboken.txt`: margnotat (2, 5, 7). `FARGESAMLEREN/03-siste-side.txt`: runelinje.
- `dagens_oppdrag.txt`: punkt 5 om tavla.
- JSON-lekkasjer som fortsatt ligger i `src/data` til steg 3 (bekreftet på listen, jf. app-tekster C og D): titler dag 6, 8, 11, 17, 21, 22, 23; `hint`/`fysisk_hint` med stavede koder dag 5, 7, 8, 17, 21; chifferet dag 5; `foreldre_kode` dag 16.

## (a) Handleliste

Nettbudsjett: 1 000 kr inkludert frakt. Her er bare én post satt til nett, og bare som reserve. Priser er anslag.

| Vare                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Mengde   | Dager                | Hvor                                                                                                                                                                                                 | Pris                              | Lenke                                                                     | Ord               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| **Dagligvare**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |          |                      |                                                                                                                                                                                                      |                                   |                                                                           |                   |
| Sjokoladerosiner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 1 pose   | 18                   | lokalt                                                                                                                                                                                               | 35 kr                             |                                                                           |                   |
| Marshmallows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 1 pose   | 5 (strek)            | lokalt                                                                                                                                                                                               | 30 kr                             |                                                                           |                   |
| Gulrøtter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 1 pose   | 19                   | lokalt                                                                                                                                                                                               | 20 kr                             |                                                                           | gulrot            |
| Gurkemeie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 1 boks   | 13                   | lokalt                                                                                                                                                                                               | 25 kr                             |                                                                           |                   |
| Safran, ekte (liten konvolutt, 0,5 g)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 1        | 13                   | lokalt (standardvalg, kan endres)                                                                                                                                                                    | 40–80 kr                          |                                                                           |                   |
| Lussekatter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 1        | 13                   | lokalt eller bakes                                                                                                                                                                                   | 20 kr                             |                                                                           |                   |
| Popcorn                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 1 pose   | 20 (strek)           | lokalt                                                                                                                                                                                               | 20 kr                             |                                                                           |                   |
| Zip-poser, små                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1 pakke  | 7, 13                | lokalt                                                                                                                                                                                               | 30 kr                             |                                                                           |                   |
| Aluminiumsfolie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 1 rull   | 11, 19               | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| Mel, sukker, sirup, kanel, nellik                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | litt     | 2, 6, 13, 15         | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| Banan, servietter, oppvaskmiddel, q-tips, tannkrem                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |          | 1, 3, 13, 14, 18     | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| Klementiner, 2,3 kg-esker (faste frukter; spises uke 1–2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 3 esker  | 1 (scene), 24        | lokalt, kjøp 29. nov                                                                                                                                                                                 | 210–250 kr                        |                                                                           |                   |
| Tomme klementinesker (be butikken)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 3–4      | 1                    | lokalt, gratis                                                                                                                                                                                       | 0                                 |                                                                           |                   |
| **Hobby og småting (Panduro)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |          |                      |                                                                                                                                                                                                      |                                   |                                                                           |                   |
| Tykt papir 160–200 g, A4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 50 ark   | alle kort            | lokalt                                                                                                                                                                                               | 70 kr                             | https://www.panduro.com/nb-no/search?q=kartong%20A4%20180 (søk)           |                   |
| Rødt cellofan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 1 ark A4 | 10, 24               | lokalt (Panduro/Nille); nett bare om det mangler                                                                                                                                                     | 40 kr                             | https://www.panduro.com/nb-no/search?q=cellofan (søk)                     |                   |
| Glassperle eller krystallpynt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 1        | 3, 24                | hjemme (juletrepynt) eller lokalt                                                                                                                                                                    | 25 kr                             | https://www.panduro.com/nb-no/search?q=glassperle (søk)                   | perlen            |
| Grønt gavebånd                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1 rull   | 17, 24               | lokalt                                                                                                                                                                                               | 20 kr                             | https://www.panduro.com/nb-no/search?q=gaveb%C3%A5nd%20gr%C3%B8nn (søk)   |                   |
| Sølvpenn                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 1        | 17                   | lokalt                                                                                                                                                                                               | 40 kr                             | https://www.panduro.com/nb-no/search?q=s%C3%B8lv%20tusj (søk)             |                   |
| Ispinner eller sugerør                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 3        | 6                    | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| Plastbeger eller silikonform                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 1        | 7                    | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| Batterilys (telys)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 1–2      | 16 (bonus)           | lokalt                                                                                                                                                                                               | 40 kr                             |                                                                           |                   |
| Gullkonvolutt, stor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 1        | 24                   | lokalt                                                                                                                                                                                               | 15 kr                             | https://www.panduro.com/nb-no/search?q=konvolutt%20gull (søk)             |                   |
| Post-it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 1 blokk  | 10 (strek)           | hjemme eller lokalt                                                                                                                                                                                  | 25 kr                             |                                                                           |                   |
| Maskeringsteip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1 rull   | 1, 2, 19             | hjemme eller lokalt                                                                                                                                                                                  | 30 kr                             | https://www.panduro.com/nb-no/search?q=maskeringstape (søk)               |                   |
| Svart kraftpapir 50 × 70 cm (ferdskriveren)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 2 ark    | 1                    | lokalt (Panduro/Nille/Europris)                                                                                                                                                                      | 30–40 kr                          | https://www.panduro.com/nb-no/search?q=svart%20kartong%2050x70 (søk)      | kledd i svart     |
| Oransje papir (ferdskriveren), i stedet for gaffateip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 1–2 ark  | 1                    | lokalt (Panduro)                                                                                                                                                                                     | 15 kr                             | https://www.panduro.com/nb-no/search?q=oransje%20papir (søk)              | oransje striper   |
| Grått pakkepapir eller løper, cirka 2 m (rosinsporet)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 1        | 18                   | hjemme eller lokalt (Europris, Clas Ohlson)                                                                                                                                                          | 0–30 kr                           | https://www.panduro.com/nb-no/search?q=gr%C3%A5papir (søk)                | gråpapir          |
| Runde gullklistremerker (operasjonsbrettet)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 6        | 1, 7, 12, 15, 21, 24 | hjemme eller lokalt                                                                                                                                                                                  | 0–15 kr                           | https://www.panduro.com/nb-no/search?q=gull%20klistremerker (søk)         | gullklistremerker |
| Iskrystall som ikke smelter (glass/akryl)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 1        | 24                   | Lokalt: Nille, Søstrene Grene eller Clas Ohlson (30–60 kr). Nett: Hadeland Glassverk / CG.no frostet glasstre 9,8 cm (ca. 199 kr, 3–5 dager), siste bestilling 1. desember. Velg innen 25. november. | 30–60 kr lokalt / ca. 199 kr nett | https://www.cg.no/products/hadeland-glassverk-tre-glass-frostet-hvit-98mm | krystallet        |
| Rødt garn, små klesklyper, hyssing, teip, magneter, plaster, mobillykt, 3 glass + 1 keramikkrus, syltetøyglass, pappeske, sløyfe, 3 julesokker, papprull, gryte/sleiv/visp/kjevle/øse, ostehøvel, sofaputer i ulik størrelse, teppe, 8 bøker, grytelokk, lyst laken, klesvaskkurv, badehåndkle, skoeske med lokk, C6-konvolutt, hårstrikk, avispapir, tusj, vaskbare tusjer, binders, limstift, tapetkniv, liten konvolutt, papp til rødfilteret, stekebrett, dorull, kosedyr, pappas solbriller og hodetelefoner, kunstig blomst, en innpakket gave, frokostpakker, nisselue og votter |          |                      | hjemme                                                                                                                                                                                               | 0                                 |                                                                           |                   |
| **Sum**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |          |                      | lokalt cirka 700–1 050 kr, normalt rundt 850; nett 0–250 kr                                                                                                                                          |                                   |                                                                           |                   |

## (b) Utskriftsliste

Alt ligger under `/nissemor-guide/printout` og samles i én PDF for måneden pluss symbolkortene fra QR-siden. «Tykt» = 160–200 g, «vanlig» = 80 g.

| Fil | Sider | Papir | Dag | Merknad | |
| ----------------------- | ----- | ----------------------- | ----- | ------------------------------------------------- |
| `runetavle.pdf` | 1 | tykt | 1 | A5, 29 ruter A–Å, i ferdskriveren, på brettet |
| `runer-fasit.pdf` | 1 | vanlig | alle | **bare Nissemor-guiden** |
| `dag01-tradkort.pdf` | 1 | tykt, tosidig | 1 | 6 trådkort + 2 løse, prikker bak |
| `dag01-linjekort.pdf` | 1 | tykt | 1 | linjekort med passordfelt, i IQs konvolutt |
| `dag01-frakt.pdf` | 4 | vanlig | 1 | 4 fraktetiketter A5, 4 SKJØRT A6, stempler |
| `dag01-ferdskriver.pdf` | 1 | vanlig | 1 | merker topp/side/kortside, «FORSEGLET – IQ» |
| `dag01-flylogg.pdf` | 1 | vanlig | 1 | to loggstrimler, limes til én |
| `operasjonsbrett.pdf` | 1 | tykt, A3 (eller 2 × A4) | 1 | 9 symbolruter + 6 milepælsirkler, i ferdskriveren |
| `dag02-tallkort.pdf` | 1 | tykt | 2 | romertall |
| `dag03-frostlapp.pdf` | 1 | tykt | 3 | speilvendt; reserve + tegnkilde |
| `dag04-skokort.pdf` | 1 | tykt, tosidig | 4 | |
| `dag05-brevfugl.pdf` | 1 | vanlig | 5 | |
| `alfabetstrimmel.pdf` | 1 | tykt | 5, 22 | |
| `dag06-silhuetter.pdf` | 1 | tykt, tosidig | 6 | klippes i november, på ispinne |

| `dag07-frostlapp.pdf` | 1 | tykt | 7 | i pose, i plastbeger i fryseren fra 6. des. |
| `dag08-lamper.pdf` | 1 | vanlig, farge | 8 | |
| `dag09-krystallark.pdf` | 1 | tykt | 9 | ni krystaller |
| `dag10-testark.pdf` | 1 | vanlig, farge | 10 | testes i november |
| `dag10-fargekort.pdf` | 2 | tykt, **farge** | 10 | åtte kort (HVIT er blindspor); side 2 blank variant |
| `rodfilter-ramme.pdf` | 1 | tykt | 10 | lages i november |
| `dag11-tallkort.pdf` | 1 | tykt | 11 | fem kort |
| `dag12-frostlapp-tredelt.pdf` | 1 | tykt | 12 | tre biter + én blindsporbit |
| `dag13-krydderkort.pdf` | 1 | tykt | 13 | fire kort |
| `dag14-brettark.pdf` | 1 | vanlig, tynt | 14 | to brettelinjer; test gjennomlys |
| `dag15-redskapskort.pdf` | 1 | tykt | 15 | 3 bokstavlapper uten tall + 2 ❄ |
| `dag16-sorteringslapper.pdf` | 1 | tykt | 16 | 4 bokstavlapper, 3 tallapper |
| `dag17-baandkort.pdf` | 1 | tykt | 17 | 7 småkort med tegn |
| `dag18-rosinkort.pdf` | 1 | tykt | 18 | 3 bokstavkort + 1 ❄ |
| `dag19-bevislapper.pdf` | 1 | tykt | 19 | |
| `dag20-putekort.pdf` | 1 | tykt, tosidig | 20 | |
| `dag21-portkort.pdf` | 1 | tykt | 21 | 8 ryggkort, `U · 7`, 1 ❄ |
| `dag22-sokkelapper.pdf` | 1 | tykt | 22 | |
| `dag23-stjerner.pdf` | 1 | tykt, tosidig | 23 | romertall bak; klippes og tres i november |
| `dag24-suvenirlapper.pdf` | 1 | tykt | 24 | lapper med tegn, inkl. tre reservelapper |
| `dag24-krystallkort.pdf` | 1 | tykt | 24 | «TAKK FOR LYSET» i tegn |
| Symbolkort (QR-siden) | 3 | tykt | 3, 6, 9, 12, 15, 18, 20, 22, 23 | ni kort |
| Diplom «Snøfalls venn» | 3 | tykt | 24 | ett per barn |
| Valgfritt: `dag14-serviettfugl.pdf`, `dag17-losepengebrev.pdf` | 2 | vanlig | 14, 17 | |

Sum: 44 sider obligatorisk (29 tykt, 12 vanlig, 3 symbolkort-sider) pluss 2 valgfrie. Alle kort-PDF-er har tegn i hjørnet. Dag 1-scenens utskrifter (frakt, ferdskriver, linjekort, flylogg, operasjonsbrett) er med i summen; hvordan de brukes står i «Dag 1: byggeplan».

## (c) Forberedelseskalender for foreldre

**Innen 25. november**

- Kjøp alt under «lokalt» i handlelisten. Velg iskrystallet innen 25. november: lokalt (Nille, Søstrene Grene eller Clas Ohlson, 30–60 kr) eller på nett (Hadeland Glassverk / CG.no frostet glasstre 9,8 cm, ca. 199 kr, 3–5 dager; siste bestilling 1. desember).
- Skriv ut hele PDF-en og symbolkortene. Klipp alle kort og legg dem i 24 konvolutter merket med dag. Legg `runer-fasit.pdf` i Nissemor-mappen, aldri på brettet. Dag 1-utskriftene (runetavle, linjekort, frakt, ferdskriver, flylogg, brett) legges i konvolutt «1» til 28. november.
- Kjøp svart kraftpapir (2 ark) og oransje teip til ferdskriveren; finn fram skoeske med lokk, lyst laken, klesvaskkurv. Klementinene kjøpes først 29. november.
- Lag rødfilteret (cellofan i papprammen). Test det mot `dag10-testark.pdf`; svikter det, skriv kortene for hånd (blå kulepenn under rød tusj).
- Klipp de tre silhuettene (dag 6) og teip dem på ispinner. Klipp de tolv stjernene (dag 23) og tre hyssing i dem.
- Test tre ting på én kveld: såpeskrift på speilet (dag 3, med varmt vann i vasken), gjennomlys av brettarket med mobillykt (dag 14), skyggene mot veggen (dag 6).
- Brett papirfuglen (dag 5) og skriv XOULNHQ på vingen.
- Kjøp en liten konvolutt ekte safran til dag 13.
- Legg frostkortet for dag 7 i zip-pose.

**Kveld for kveld** (gåten; streken fra §8 kommer i tillegg)

| Kveld       | Gjør                                                                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28.–30. nov | **Dag 1-scenen**, se «Dag 1: byggeplan»: fredag ferdskriver og utskrifter (50 min), lørdag klementiner, etiketter og tråd (25 min), søndag kveld plassering (25–30 min): skred, tråd med seks kort, to løse kort i elva, ferdskriver med konvolutt, logg, runetavle og brett |
| 1. des      | Tre romertallkort under stoler                                                                                                                                                                                                                                               |
| 2. des      | Speilvendt såpeskrift på speilet, perle og hjerte-kort i vinduskarmen                                                                                                                                                                                                        |
| 3. des      | Sju sko i ring, kort i hver                                                                                                                                                                                                                                                  |
| 4. des      | Gjem fuglen høyt, legg strimmelen ved                                                                                                                                                                                                                                        |
| 5. des      | Silhuettene i papprullen, lommelykt og hjerte-kort i gangen                                                                                                                                                                                                                  |
| 6. des      | **Kl. 20: plastbeger med kortet i fryseren.** Lua og vottene ved                                                                                                                                                                                                             |
| 7. des      | Kretskortarket på toppen av tårnet                                                                                                                                                                                                                                           |
| 8. des      | Ni krystaller og hjerte-kort på kjøleskapet                                                                                                                                                                                                                                  |
| 9. des      | Åtte fargekort gjemt i stua, filteret ved tusjene                                                                                                                                                                                                                            |
| 10. des     | Fem tallkort i tre rom; folie klar til bonus                                                                                                                                                                                                                                 |
| 11. des     | Tre glass med vann og ett krus, kortbiter teipet utenpå, sol-kort                                                                                                                                                                                                            |
| 12. des     | Fire krydderposer med kort, lussekatt                                                                                                                                                                                                                                        |
| 13. des     | Brettarket rullet i papirbåten                                                                                                                                                                                                                                               |
| 14. des     | Lapper under gryte, sleiv, visp (bokstav) og kjevle, øse (❄); to spor som stopper; rydd bort sukker og sirup; rutekort og sol-kort ved skålen                                                                                                                                |
| 15. des     | Fire bokstavlapper på ting, tre tallapper på plasser, rutekort i brødboksen; syltetøyglass og batterilys fram                                                                                                                                                                |
| 16. des     | Merk båndet med sølvpenn, teip de sju tegnkortene på, bind Rampenissen med én sløyfe                                                                                                                                                                                         |
| 17. des     | Rosinspor med fire hauger, rutekort og sol-kort i jakken                                                                                                                                                                                                                     |
| 18. des     | Tre foliepakker i tre rom, «BEVIS»-pakke på ruteark                                                                                                                                                                                                                          |
| 19. des     | Fem puter i ulik størrelse med kort inne i fortet, i rot; måne-kort under den minste; finn fram 8 bøker                                                                                                                                                                      |
| 20. des     | Åtte ryggkort på bøkene, `U · 7` inne i bok 5, ❄-kort inne i bok 3, bok 3 på gløtt                                                                                                                                                                                           |
| 21. des     | Tre sokker med lapper, måne-kort i Hannas                                                                                                                                                                                                                                    |
| 22. des     | Heng de tolv ferdige stjernene, Rampenissen med måne-kort                                                                                                                                                                                                                    |
| 23. des     | Koffert med perle, filter og båndbit (tegnlapper); rutekort og reservelapper i konvolutten; krystall med runekort under treet                                                                                                                                                |

Legg perlen (3. des.), filteret (10. des.) og en bit av båndet (17. des.) i konvolutten merket «24» samme kveld. Reservelappene dekker uansett.

## Dag 1: byggeplan

Klementinskredet og ferdskriveren, godkjent av Hans 10. november. Gåten står under dag 1; dette er scenen. Mål: barna kommer inn i stua og ser at noe har veltet ut av TV-en og nedover gulvet i en oransje elv, med Snøfalls fraktesker på toppen, en svart ferdskriver i åpningen og bare nisseluen som stikker opp i enden. Det skal se ut som 30 kilo. Det er 7.

### Mengde

En familie på fem spiser 6–7 klementiner om dagen i desember, cirka 45 i uka. Frukt som har ligget på gulvet bør spises innen to uker: **3 esker à 2,3 kg = cirka 90 klementiner (210–250 kr)**, kjøpt 29. november, faste frukter. Fjerde eske kjøpes etter 7. desember bare hvis de tre er spist; bløte frukter blir juice helgen 5.–6. Fordeling på scenen: revnet eske 15 · delta foran åpningen 20 · elva 35 · haugen 20.

90 klementiner tett i ett lag dekker bare 0,3 m². Skredet bygges av volum under og overflate oppå: (1) **skråning**: klesvaskkurv opp-ned eller to sofaputer inntil TV-benken under et lyst laken, 40–50 cm høyt; (2) **elv, ikke dam**: lakenet brettes til en renne 30–35 cm bred og 2,5–3 m lang mot stuedøra, 2–3 klementiner i bredden med 6–8 cm mellomrom og lakenfolder mellom; (3) **revnet eske**: øverst på skråningen, kortsiden skåret opp og bøyd ut, stappet med avispapir til 3 cm under kanten, ett lag frukt oppå som velter ut; (4) **haugen**: et sammenrullet badehåndkle under lakenet nederst i elva, 20 cm høyt, med fruktskålen oppå; (5) **last i bakgrunnen**: 3–4 tomme klementinesker fra butikken, stablet på TV-benken med etiketter.

### Rekvisitter

- **Fraktesker (4–5).** Klementineskene selv (30 × 20 × 10 cm eller kartong 32 × 22 × 12), alternativt skoesker. Én revnet (se over), 3–4 tomme stablet. Etiketter fra `dag01-frakt.pdf`, limt med limstift: fraktetikett A5 (Snøfall-logo: sirkel med snøkrystall og «SNØFALL FRAKT» rundt; «FRA: Verkstedet, Snøfall · Linje 90,0 MHz» / «TIL: Rampenissen c/o K12 · H9 · H5, Landås»; «INNHOLD: VITAMIN C, 2,3 KG»; «SENDING 1 AV 4» nummerert 1–4; falsk strekkode «90.0-SNF-0112»), SKJØRT-merke A6 i rød ramme («SKJØRT – VITAMIN C TIL LANDÅS · DENNE SIDE OPP ↑»), stempler limt skjevt: «TRYKKSKADET» (rød, på den revnede), «KONTROLLERT – IQ» (blå sirkel), «HASTER · ADVENT».
- **Ferdskriveren.** Skoeske med løst lokk (cirka 33 × 20 × 12 cm), eske og lokk kledd hver for seg i svart kraftpapir (brettet som gavepapir, limt på innsiden; alternativ svart søppelsekk; ikke maling). To oransje striper 4–5 cm brede, 6 cm fra hver ende, av oransje gaffateip eller oransje papir, over lokket og skåret rent langs lokkekanten med tapetkniv. Merker fra `dag01-ferdskriver.pdf`: topp «FERDSKRIVER · SNØFALL LUFTFART · FLIGHT RECORDER · IKKE ÅPNE UTEN K12 · H9 · H5», langside «IKKE KAST I HAVET · OM FUNNET, LEVER TIL IQ», kortside «LINJE 90,0 MHz · NEDSTIGNING 01.12 · KL. 00:04», serienummer «SNF-FDR-2026-001». Forsegling: én strimmel maskeringsteip over lokkekanten med «FORSEGLET – IQ». Innhold i rekkefølge: (1) IQs C6-konvolutt «K12 · H9 · H5 – ÅPNES FØRST» med linjekortet (`dag01-linjekort.pdf`, A6 tykt: «DIREKTELINJEN · 90,0 MHz · PASSORD TIL NISSEKOMM:» og passordet skrevet med tusj, «Skriv det inn når skjermen spør. Hvis linjen skurrer, er det ikke dere. Det jobber vi med. – IQ»); (2) flyloggen (`dag01-flylogg.pdf`), papirstrimmel 7 × 40 cm rullet med binders, teleksrull i monospace: «SNØFALL LUFTFART – LOGG LINJE 90,0 / 30.11 23:52 LINJE ÅPNET. BÆREBØLGE 90,0 OK / 30.11 23:58 LAST SLUPPET: VITAMIN C, 3 KOLLI / 01.12 00:04 NISSE SLUPPET. FALLSKJERM: SERVIETT / 01.12 00:05 LANDING. UNDERLAG: MYKT. GULT. BUET. / 01.12 00:06 BÆREBØLGE 90,0 … 90,0 … 85,0 ? … 90,0 / 01.12 00:07 ORAKELET: NOE LYTTER. OVERVÅKES. / 01.12 00:08 LOGG SLUTT»; (3) runetavla (`runetavle.pdf`) og operasjonsbrettet (`operasjonsbrett.pdf`, A3 brettet i fire: «OPERASJON DIREKTELINJEN», ni ruter med datoene 3, 6, 9, 12, 15, 18, 20, 22, 23 for symbolkortene, en linje med seks tomme sirkler 1, 7, 12, 15, 21, 24 uten navn) med et ark på seks runde gullklistremerker; (4) én klementin med lapp «RESERVE – IQ». Ingen bokstaver fra koden, ingen steder i huset.
- **Rampenissen i haugen.** Fruktskålen på håndklehaugen nederst i elva, 2,5–3 m fra TV-en, der barna ser luen først. Banan i skålen som pute, serviett som dyne. Dorullhylse inni luen så den står 10 cm over fruktene. Én arm opp som et vink (binders i ermet); den røde tråden knyttet rundt håndleddet. 15–20 klementiner over og rundt skålen til bare luen og armen er fri.
- **Serviettfallskjermen.** Én hvit serviett 33 × 33 cm, 25 cm rødt garn i hvert hjørne, samlet i en hårstrikk rundt magen hans. Draperes halvt sammensunket bak haugen, ett hjørne under en klementin.
- **Tråden og kortene (gåten).** 3,5–4 m rødt garn fra under TV-foten (lapp «LINJE 90,0», A8) ned skråningen, langs elvas høyre kant, til håndleddet. Seks A7-kort med klesklyper, første 40 cm fra TV-en, deretter cirka 55 cm mellomrom, siste 30 cm før håndleddet; én klementin under hver klype så kortet står opp. De to løse kortene E og T uten klype ligger i elva mellom fruktene. Tråden teipes til lakenet på tre punkter under klementiner. Ingen sløyfer eller kryss.
- **Lakenet.** Gammelt, lyst laken, minst 140 × 200; hvitt leser som snø. Hjørnene teipes til gulvet (laken sklir på parkett) eller legges på teppe. Samler alt søl.

Trygghet for Hanna: alt i gulvhøyde, ingenting i halshøyde, ingen frukt i trappen eller foran baderomsdøra. Søl: 2–3 frukter kan bli klemt; lakenet tar det. Steder klementinene ikke skal være senere: dag 19 (GULROT) og dag 9 (kjøleskapet).

### Byggeplan 28.–30. november

**Fredag 28. (cirka 50 min, etter leggetid)**

| Steg                                                                                                                                                                                               | Min |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Skriv ut `dag01-frakt.pdf` (4 s.), `dag01-ferdskriver.pdf`, `dag01-linjekort.pdf` (tykt), `dag01-flylogg.pdf`, `operasjonsbrett.pdf`, `dag01-tradkort.pdf` (tykt, tosidig), `runetavle.pdf` (tykt) | 10  |
| Klipp etiketter, merker, stempler, kort og loggstrimler; lim loggen til én strimmel, rull med binders                                                                                              | 10  |
| Ferdskriveren: kle eske og lokk i svart, to oransje striper, skjær stripene langs lokkekanten, lim merkene, skriv serienummer                                                                      | 20  |
| Linjekortet: skriv passordet med tusj, i konvolutt med påskrift. Legg konvolutt, logg, runetavle, brett og klistremerker i ferdskriveren; lokk på, ikke forsegl                                    | 5   |
| Fallskjermen: serviett, fire garnbiter, hårstrikk                                                                                                                                                  | 5   |

**Lørdag 29. (cirka 25 min + handel)**

| Steg                                                                                                                                                                   | Min |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Handel: 3 esker klementiner (faste), be om 3–4 tomme esker                                                                                                             | –   |
| Lim fraktetikett, SKJØRT og stempler på alle 6–7 esker; nummerer «SENDING 1 AV 4» osv.                                                                                 | 10  |
| Revnet eske: velg én tom, skjær opp kortsiden og hjørnet, bøy flaket ut, «TRYKKSKADET» skjevt over revnen, stapp med avispapir                                         | 5   |
| Tråden: klyp de seks kortene fast i riktig rekkefølge og avstand på 4 m garn, vikle rundt en pappbit merket «TV-ENDE»; de to løse kortene i en konvolutt               | 5   |
| Pose «30. nov»: ferdskriver, tråd, løse kort, fallskjerm, hårstrikk, dorullhylse, maskeringsteip, binders; tomme esker stablet. Fulle esker i boden, ikke på kjøkkenet | 5   |

**Søndag 30., etter at barna sover (cirka 30 min)**

| #   | Steg                                                                                                                                                                                                                                                                         | Min |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | Rydd en bane fra TV-benken til stuedøra (3–3,5 m). Flytt teppe eller teip lakenets hjørner                                                                                                                                                                                   | 3   |
| 2   | Skråning: klesvaskkurv opp-ned (eller to puter) inntil TV-benken, lakenet over, brettet videre til en renne 30–35 cm bred fram til døra. Håndkleet rullet under enden som haug                                                                                               | 4   |
| 3   | Stabel: 3 tomme esker på TV-benken bak og ved siden av skjermen. Den revnede esken øverst på skråningen med åpningen ned mot elva                                                                                                                                            | 2   |
| 4   | Fruktskålen på haugen, banan i, Rampenissen i skålen med serviett som dyne, dorullhylse i luen, arm opp med binders, hårstrikk med fallskjerm på, fallskjermen draperes bak                                                                                                  | 4   |
| 5   | Tråden: teip «TV-ENDE» under TV-foten med «LINJE 90,0»-lappen, legg tråden ned skråningen og langs elvas høyre kant, knyt enden rundt vinkearmen. Kortene vender opp, rett vei, uten kryss                                                                                   | 4   |
| 6   | Klementinene: 15 i den revnede esken (oppå papiret, noen halvveis ute), 20 som delta foran åpningen, 35 i elva (2–3 i bredden), 20 over og rundt skålen til bare luen og armen er fri. Én under hver klype så kortene står. De to løse kortene E og T mellom fruktene i elva | 7   |
| 7   | Ferdskriveren: forsegl med maskeringsteip «FORSEGLET – IQ», legg den på skrå halvveis ned skråningen, i deltaet, som om den gled ut sist                                                                                                                                     | 1   |
| 8   | Teip tråden til lakenet tre steder under klementiner. Gå ruten med fingeren fra TV til arm                                                                                                                                                                                   | 2   |
| 9   | Se scenen fra døra på huk i barnehøyde. Juster: luen synlig? Kortene synlige? Ferdskriveren synlig?                                                                                                                                                                          | 2   |
| 10  | Ta bilde, slukk lyset, lukk døra til stua om den finnes                                                                                                                                                                                                                      | 1   |

Morgenen 1. desember: ingenting før barna er oppe; radioen 06:00 går av seg selv. Etter koden: barna fyller de tomme eskene med frukt (det er ryddingen), eskene til kjøkkenet, én eske «SNØFALL FORRÅD» blir stående ved TV-en, lakenet ristes ute, ferdskriveren blir Rampenissens postkasse ved skjermen, runetavla og brettet henges opp.

### Sjekkliste

Guiden viser denne lista på «Før sesongen», én gruppe per dato. `x.pdf` blir lenke til utskriften.

```
Før 28. nov
[ ] Bestem passordet til appen (A1)
[ ] Kjøp svart papir (2 ark) og oransje teip (1 rull)
[ ] Finn skoeske, laken, klesvaskkurv eller puter, håndkle og fruktskål

Fre 28. nov
[ ] Skriv ut på tykt papir: `dag01-tradkort.pdf`, `dag01-linjekort.pdf`, `runetavle.pdf`, `operasjonsbrett.pdf`
[ ] Skriv ut på vanlig papir: `dag01-frakt.pdf`, `dag01-ferdskriver.pdf`, `dag01-flylogg.pdf`
[ ] Skriv ut reservesett: `dag01-tradkort.pdf`, `runetavle.pdf`
[ ] Kle ferdskriveren: svart papir, striper, merker, serienummer
[ ] Skriv passordet på linjekortet
[ ] Fyll ferdskriveren: konvolutt med linjekort, flylogg, runetavle, brett, 6 klistremerker, 1 klementin «RESERVE»
[ ] Knyt fallskjermen

Lør 29. nov
[ ] Kjøp 3 esker klementiner (faste), be om 3–4 tomme esker
[ ] Lim etiketter, SKJØRT og stempler på alle esker, «TRYKKSKADET» på den revnede
[ ] Skjær opp og stapp den revnede esken
[ ] Klyp 6 kort på tråden fra TV-enden: ❄ I ❄ N ❄ ❄, prikker bak; E og T løse
[ ] Pakk posen «30. nov», gjem de fulle eskene

Søn 30. nov, kveld
[ ] Rydd banen, teip lakenet
[ ] Bygg skråning, renne og haug
[ ] Stable eskene, den revnede øverst
[ ] Rampenissen i skålen: banan, serviett, hylse i lua, arm opp, fallskjerm
[ ] Legg tråden fra TV-en («LINJE 90,0») til armen, ingen kryss, kortene opp
[ ] Legg 15 / 20 / 35 / 20 klementiner, én under hver klype, E og T i elva
[ ] Forsegl ferdskriveren, legg den i deltaet
[ ] Sjekk fra døra på huk, ta bilde, slukk lyset

Man 1. des, etter koden
[ ] Frukt i esker, til kjøkkenet; én eske «SNØFALL FORRÅD» ved TV-en
[ ] Heng runetavle og brett på veggen, sett klistremerke 1
[ ] Sett ferdskriveren ved skjermen (postkasse)
[ ] Rist lakenet, ta teipen av gulvet
```

## (d) Avgjørelser for mennesket

**Alle seks godtatt av Hans 10. november.**

1. **Dag 5, tre skritt:** godta at Julius sier «tre skritt fram» i stedet for «ett skritt» (chifferet XOULNHQ).
2. **Dag 23, Julius' setning:** godta ordlyden uten «stjerner»; alternativet er å la ham si «stjerner» og godta at videoen gir halve ordet.
3. **Dag 10, sju kort:** godta sju fargekort og at `farge-koder.txt` lister regnbuens sju farger.
4. ~~Hannas støttedager~~ **Utgår 10. november:** Hanna har ingen kodebærende steg; se Roller.
5. **Dag 24, suvenirer:** godta at perle, filter og båndbit tas vare på underveis. Reservelapper ligger i konvolutten hvis noe forsvinner.
6. **Nettkjøp:** bare iskrystallet kan havne på nett (ca. 199 kr). Alt annet handles lokalt eller finnes hjemme.

## (e) Standardvalg fra vanskelighetsrevisjonen (kan endres)

Godkjent av Hans 10. november: begge meta-gåtene, oppfunnet tegnsett (ikke futhark), blindspor med feil bokstav der Julius' setning avgjør, og én valgfri «Hanna (hvis hun vil)»-linje per dag. Resten er standardvalg og kan endres med ett ord:

1. **Dag 5:** nøkkelen hentes fra dag 2 («like mange skritt som IQ sprengte sikringer onsdag»), ikke «tre skritt».
2. **Dag 13:** ekte safran kjøpes (40–80 kr, lokalt) i tillegg til gurkemeie.
3. **Dag 21:** løses etter skolen; frosten varer til koden er inne uansett.
4. **Dag 24:** lett med vilje; finalen handler om følelsen.
5. **Runelinjer i spøkelsesbildet:** bygges (byggeliste); meta 1 står seg uten dem.

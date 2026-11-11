# Julius' videodagbok 2026 – manus

**Status: LÅST 10. november 2026 (steg 2).** Endringer krever eksplisitt ja fra Hans. Kjør `python3 scripts/manus-check.py` etter endringer.

**Revisjon 10. november (vanskelighet, godkjent):** nye segmenter dag 5/4, 7/3, 7/5, 8/3, 9/4, 11/4 og 11/5 (nytt), 20/5. Etter uavhengig gjennomgang også 4/4, 4/5, 12/4, 12/5, 14/4, 14/5, 18/4, 18/5 (brikken ga ordet alene). Brikkene står ordrett som i `gaater-2026.md` etter revisjonen.

**Revisjon 10. november (hilsen):** de fleste dagene åpner med «Gooood morgen, Snøfall!» (vokallengden og det som følger varierer) og slutter med «Ha en riktig fin dag!» eller en nær variant. Dag 10, 15, 20 og 23 hilser rolig («God morgen, Snøfall.»); dag 21 er uendret (nesten frosset bilde, rett på sak, og «Vi er her» står). Brikkene og lore-setningene er uendret; der brikken er siste setning, kommer avskjeden etter den (dag 16 og 20 fikk et kort ekstra segment).

**Revisjon 10. november (stemme):** åpninger, «i natt»-segmenter og avskjeder er skrevet om til Julius' måte å snakke på (`assets/characters/julius/replikker.md`): stor og varm «Gooood morgen», datoen som favorittdag, noe fysisk og tullete sammen med barna, latter på egen bekostning, mikrofonen som sitter fast, en hjemmelaget morgensang som skjærer seg (dag 2, 9, 16, 24) og kort «Vi ses!». Brikkene og lore-setningene er uendret. Alle handlinger er én bevegelse med venstre hånd (mikrofonen i høyre), bare med ting som er i stillbildet. Dag 2–5 regenereres med ref-v3; dag 6–24 er ikke generert ennå.

**Revisjon 10. november (kroker, til godkjenning):** på dag 3, 4, 6, 9, 11, 16, 17, 18 og 19 er ett fyllsegment (julefakta eller lore uten krok) byttet med en krok på høyst 26 ord: et spørsmål til ett av barna, noe tullete å gjøre sammen med Julius, et erting av morgendagen uten fakta, eller en liten avsløring om folkene i Snøfall. Brikkene, «i natt»-setningene, åpningene og avskjedene er uendret; dagens ordtall er innenfor ±15 %.

**Revisjon 11. november (rapporten, til godkjenning):** på dag 5, 6, 8, 11, 12, 13, 17 og 23 leser Julius én linje fra Rampenissens rapport om nattens strek (arket tas fra brevbunken, Rampenissens linje på nordlandsk) og reagerer varmt. Ett segment per dag, høyst 26 ord, i stedet for et fyllsegment (dag 6, 11 og 17: kroken, som var eneste fyll); brikkene, «i natt»-setningene, hilsen og avskjed er uendret. Bare streken slik barna så den, aldri det den bærer; dager der streken selv bærer brikke H (3, 4, 7, 9, 14, 16, 18, 21, 22, 24) og dager uten tull (10, 15, 20) er ikke med. Dag 19 er utelatt fordi streken sier koden.

**Revisjon 11. november (flyt, godkjent):** dag 2–24 skrevet om i én omgang etter flytreglene fra dag 1-visningen, fordi hvert segment er et hardt klipp i både bilde og lyd: hvert segment åpner og lukker på en hel setning med eget subjekt (ingen fragment eller pronomen som peker til forrige klipp), én tanke per segment, siste setning er en bro og ikke en punchline, oppsett og vits i samme segment, brikken får innledning i samme segment og avskjeden står i halen (ingen segment under 12 ord), handlingen varer hele segmentet, og «i natt» kommer før julefakta. Brikkene står ordrett som i `gaater-2026.md`; der brikken er delt, åpner andre del med en kort setning med eget subjekt foran den låste ordlyden. Kontinuitet mot radio og PS: dag 9 (Pil lurt to ganger, så telte han), 12 (Julius innrømmer feilen og lover å si unnskyld), 18 (hjelmen har en grunn), 20 (bøkene), 24 (krystallet fra Vintervokteren). Dag 19 nevner ikke lenger lys på Landås-siden (betinget innhold).

**Revisjon 11. november (dag 1, godkjent):** to nye segmenter på dag 1 (3 og 6) setter opp sesongens oppdrag: NisseKomm er hovedkvarteret og linjen IQ åpnet inn i stua, Julius trenger hjelpen deres i år, rimet legger seg på linjen om natten og IQ teller det i prosent, og hver kode holder linjen varm. Det som lytter, er fortsatt uten navn (M2 dag 7); brikke S, klementinene, hilsen og avskjeden er uendret.

**Revisjon 11. november (produksjon, godkjent):** gjennomgangen før generering (`klar-julius.md`) er lagt inn på alle 24 dager. Taket er 22 ord per segment (målt tempo 1,79 ord/s); segmenter med ordrett brikke er merket «låst» på Varighet-linjen og får være lengre (`julius-dag.py lint` godtar dem). Handlinger bruker bare det som er i referansebildet (boka, trekoppen, brevbunken, sentralbordet, mikrofonen i høyre hånd): ingen lapp under mikrofonen, ingen fugl i karmen, ingen dør, ingen seks fingre, og ark fra bunken legges ned før siste setning. Mikrofonkomikken står, men mikrofonen blir i hånda (han vrikker på håndleddet). Alt Kulde gjør som må vare over klipp eller som modellen ikke klarer (farger som renner ut, frys, lydbortfall, rim, lys som slukner, flimring, nesten frosset bilde, uttoning i gull), står i Kulde-feltet med pipelinens ord og legges på i etterarbeid; prompten får bare knitring, pust og enkle lampeblaff. «Klikk» bare i siste segment, nynning står i replikken, Rampenissens sitater er høyst 7 ord, «under eskene» (dag 1, som i PS), «i kveld» om kvelden som kommer (dag 23), «jól» og «attenhundreogåttisju» er borte. Brikkene står ordrett som før.

Steg 2. Kilder (låst): `docs/historie-2026.md`, `docs/storyboard-2026.md`, `docs/gaater-2026.md`. Stemme og rom: `assets/characters/julius/*`, `assets/locations/julius-kontor/beskrivelse.txt`, `assets/stil.md`.

## Slik leses manuset

- Ett klipp per dag, 30–60 s, delt i 4–8 segmenter. Hvert segment er én generert videosnutt på høyst 22 ord og 11–15 s (målt på 69 råklipp: videomodellen snakker 1,79 ord i sekundet, begynner etter et halvt sekund og trenger 2 s stillhet på slutten; klipp over 15 s er ikke mulig). Segmenter med ordrett brikke er merket «låst» på Varighet-linjen og kan være opptil 26 ord; `python3 assets/bin/julius-dag.py lint` stopper på alt annet over 22.
- Fast form: åpning → dagens betydning eller lore → hva skjedde i natt → **brikke S** (ordrett fra `gaater-2026.md`) → kort avskjed. Brikken står alltid i nest siste eller siste segment, og avskjeden etter den er så kort at Kristian kan spole til slutten og høre brikken.
- Julius sitter ved pulten og snakker inn i mikrofonen til usynlige lyttere. Han ser aldri i kameraet. Mikrofonen er alltid i høyre hånd; hvert segment har én handling med venstre hånd, og bare med det som er i stillbildet (trekoppen, sentralbordet med ledninger, den åpne boka, brevbunken). Et ark fra bunken løftes og legges ned i samme segment; ingenting holdes over et klipp, for hvert klipp starter fra referansebildet. Mikrofonkomikk er lov: han banker på den, den «sitter fast» i hånda (han vrikker på håndleddet, fingrene holder rundt håndtaket; aldri «rister mikrofonen», det gir flytende mikrofon).
- Barna ser videoen etter at de har vært i huset om morgenen. Julius viser aldri til noe de skal gjøre i huset; det fysiske han ber om, er tull sammen med ham (strekke seg, gjespe, hoppe).
- **Kulde** er Kuldes forstyrrelse i klippet, etter ukeplanen i `julius-kontor/beskrivelse.txt`: uke 1 svak knitring; uke 2 rim på vindu og bord, synlig pust; dag 10 fargene renner ut; uke 3 mikrofonen faller ut, lampen flakker, juletrelysene slukner ett og ett; dag 21 nesten frosset bilde; dag 22–24 rent, dag 24 ekstra varmt. Nivå 0–3 som i storyboardet §2. `julius-dag.py` leser feltet og gjør det meste i etterarbeid (ffmpeg): «fargene renner ut» (grått til «fargene kommer tilbake»), «bildet fryser»/«hopp i bildet på «ord»», «lyden faller ut» (aldri i låste segmenter), «rim», «slukner», «flakker»/«blafrer»/«blinker», «nesten frosset bilde», «gull» (dag 24). Det som ikke treffer et av ordene (knitring, synlig pust, «Ingen.»), går til videomodellen. «Klikk» (mikrofonen slås av) står bare i siste segment.
- Tall sies med bokstaver i replikken der TTS ellers kan snuble («åttifem komma null»); unngå lange sammensatte tall og gamle ord med aksent.
- Varighet per segment = 0,5 s + ord delt på 1,79 + 2 s hale, rundet opp, maks 15 (`manus-check.py` regner den ut).

---

## Dag 1 (ti) – Direktelinjen · SIGNAL · M1

Kulde-nivå 1. Svak knitring i lyden hele klippet, lett snø i bildet. Rommet er ellers som på referansebildet. Åtte segmenter (åpneren er lengre, godkjent). Skrevet om 11. november etter tilbakemelding fra visning (hakkete flyt, «én nisse» uforståelig): hvert segment er hele setninger som slutter på en naturlig pause, klementinene og Rampenissen sies rett ut, og brikke S står ordrett. Segment 3 og 6 er nye (godkjent 11. november) og setter opp sesongen: NisseKomm er hovedkvarteret og linjen inn i stua, Julius trenger hjelpen deres i år, rimet legger seg om natten, og hver kode holder linjen varm. Det som lytter, har ikke navn før dag 7; prosenten IQ teller, vises i sidepanelet fra dag 7 (A7). Etter klippet legger appen på en 4 s hale (T14: snø, «LINJE 90,0 · BÆREBØLGE USTABIL», frekvensen sklir til 85,0 og tilbake); den er kode, ikke en del av videofilen.

1. **Replikk:** «Ja… hallo? Er det liv i jernvaren? Gooood morgen, Snøfall! Kristian, Håkon og Hanna! I natt åpnet IQ direktelinjen til stua deres.»
   - Varighet: 15 s (22 ord)
   - Handling: Banker to ganger på mikrofonen med venstre pekefinger, lytter, så lyser han opp.
   - Kulde: Svak knitring, et kort hopp i bildet på «stua deres».
2. **Replikk:** «Det første IQ sendte ned fra verkstedet, var Hjerteruds niste: tre esker klementiner. Rampenissen havnet under eskene. Dere så hvordan det endte.»
   - Varighet: 15 s (22 ord)
   - Handling: Holder venstre hånd opp som om han har en klementin i den, skreller den med tommelen, lukter på fingrene og smiler.
   - Kulde: Svak knitring.
3. **Replikk:** «Det dere ser, er NisseKomm, hovedkvarteret vårt. Alt som skjer i Snøfall, kommer ned linjen til dere: TV-en, brevene og meg.»
   - Varighet: 15 s (21 ord)
   - Handling: Følger en ledning på sentralbordet med venstre pekefinger, fra tavla og ut mot kanten, og legger hånden på brystet på «og meg».
   - Kulde: Svak knitring.
4. **Replikk:** «Advent betyr ankomst. Julen er på vei, og Rampenissen kom først. Derfor teller vi dagene i stedet for å hoppe til julaften.»
   - Varighet: 15 s (22 ord)
   - Handling: Blar i den store boka med venstre hånd, legger den flat på siden.
   - Kulde: Svak knitring.
5. **Replikk:** «Men linjen er ikke helt i orden ennå. Bærebølgen hakker, og Orakelet sier det ligger noe under lyden. Noe som lytter.»
   - Varighet: 15 s (21 ord)
   - Handling: Lener seg nærmere mikrofonen, senker stemmen på «noe som lytter».
   - Kulde: Knitringen blir tydeligere i to sekunder, så normal.
6. **Replikk:** «I år trenger jeg dere. Om natten legger rimet seg på linjen. IQ teller det i prosent. Hver kode holder linjen varm.»
   - Varighet: 15 s (22 ord)
   - Handling: Legger venstre hånd rundt trekoppen og holder den der, som for å varme seg, til «varm».
   - Kulde: Svak knitring, et kort hopp i bildet på «rimet».
7. **Replikk:** «Når linjen bærer, roper IQ ett ord fra verkstedet. Det er det ordet radioen deres leter etter når den skurrer, rett før stemmen kommer gjennom.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Peker mot taket der IQ holder til, så holder han venstre hånd bak øret.
   - Kulde: Svak knitring.
8. **Replikk:** «Ta vare på hverandre, og ikke spis snø. Julius over og ut… hvis mikrofonen slipper hånda mi. Ha en riktig fin dag!»
   - Varighet: 15 s (22 ord)
   - Handling: Humrer, ser ned på mikrofonen i høyre hånd og vrikker på håndleddet som om den sitter fast; fingrene holder hele tiden rundt håndtaket. Ler.
   - Kulde: Svak knitring, klikk når mikrofonen slås av.

## Dag 2 (on) – Sikringsboksen til IQ · 48

Kulde-nivå 1. Svak knitring, lett snø. Morgensangen for første gang, og den skjærer seg etter tre linjer.

1. **Replikk:** «Goooood morgen, Snøfall! Og ekstra god morgen til dere tre med sovesveis. Det har jeg også. Andre desember, favorittdagen min.»
   - Varighet: 14 s (20 ord)
   - Handling: Stryker seg over sitt eget skallete hode med venstre hånd og ler lavt.
   - Kulde: Svak knitring.
2. **Replikk:** «Jeg har laget en morgensang: God morgen, kopp. God morgen, bok. God morgen, ledninger… nei. Nå røk rimet. Vi tar den senere.»
   - Varighet: 15 s (22 ord)
   - Handling: Dirigerer med venstre pekefinger i takt, stopper midt i, slår ut med hånden og ler av seg selv.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt koblet IQ kaffetrakteren på forsterkeren. Tre sikringer røk, og Kanal to ble mørk. IQ skylder på været. Det var trakteren.»
   - Varighet: 15 s (22 ord)
   - Handling: Rister på hodet med et skjevt smil, slår ut med venstre hånd.
   - Kulde: Svak knitring, lampen blinker én gang på «forsterkeren».
4. **Replikk:** «Vi kaster ingenting her. Går noe i stykker, åpner vi det og ser hvorfor. Reparerte ting har historie. IQ har én regel.»
   - Varighet: 15 s (22 ord)
   - Handling: Legger venstre hånd på sentralbordet ved siden av seg og lar den ligge.
   - Kulde: Svak knitring.
5. **Replikk:** «IQ sier man aldri bytter bare én sikring. Man legger alle sammen, ellers går den neste i morgen. Ha en riktig fin dag!»
   - Varighet: 15 s (23 ord) · låst
   - Handling: Holder opp én finger på venstre hånd, så samler han fingrene til en knyttneve, og vinker kort.
   - Kulde: Svak knitring, klikk.

## Dag 3 (to) – Rimfrost på Ruten · PRISME · grønt hjerte

Kulde-nivå 1 med ett kort blått blaff i bildet i segment 3 (første spor av grotten). Pil (IQs lærling, «han») presenteres i segment 2 (første gang barna hører navnet).

1. **Replikk:** «Ja, hallo? Der kom lyset på. Gooood morgen, Snøfall! Lampen er sen i dag, akkurat som meg. Strekk armene i været, dere.»
   - Varighet: 15 s (22 ord)
   - Handling: Myser mot lampen, så strekker han venstre arm rett opp over hodet og stønner fornøyd.
   - Kulde: Svak knitring, lampen blafrer én gang på «lyset på».
2. **Replikk:** «Hanna, kan du tegne en stjerne i lufta? Pil, lærlingen til IQ, tegnet ti stjerner på arket i natt. Ingen er like.»
   - Varighet: 15 s (22 ord)
   - Handling: Tegner en stjerne i luften med venstre hånd, så ser han ned på brevbunken foran seg og smiler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom det rimmønster på linjen. Orakelet så et blått glimt på åttifem komma null. Et sted vi ikke sender fra.»
   - Varighet: 15 s (22 ord)
   - Handling: Legger venstre hånd flatt på den åpne boka, sitter helt stille.
   - Kulde: Svak knitring, ett blått blaff over hele bildet på «blått glimt».
4. **Replikk:** «Hør nå godt etter, dere tre. Pil holdt glassbiten mot lyset, og hele regnbuen falt på gulvet. Jeg sto midt i den.»
   - Varighet: 15 s (22 ord) · låst
   - Handling: Lener seg inn mot mikrofonen og peker med venstre hånd over skulderen mot vegglampen, holder pekefingeren der.
   - Kulde: Svak knitring.
5. **Replikk:** «IQ sa navnet på en sånn glassbit tre ganger. Det er ikke et speil og ikke en lupe. Ha en riktig fin dag, dere tre!»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Legger venstre hånd flatt på den åpne boka og lar den ligge, smiler.
   - Kulde: Svak knitring, klikk.

## Dag 4 (fr) – Skotoget i Gangen · KOMPASS

Kulde-nivå 1. Svak knitring, lett snø. Lappen fra Hjerterud er et ark fra brevbunken.

1. **Replikk:** «Goooooood morgen, Snøfall! Hvor la jeg lappen? Her, i bunken. Fjerde desember, Barbro-dagen. Hjerterud skrev den opp med rød penn.»
   - Varighet: 14 s (20 ord)
   - Handling: Roter i brevbunken med venstre hånd, trekker fram et ark og holder det langt fra øynene.
   - Kulde: Svak knitring.
2. **Replikk:** «Her står det mer med rød penn: Julius, husk votter. Julius, ikke spis snø. Håkon, hun skrev deg opp også: husk lua.»
   - Varighet: 15 s (22 ord)
   - Handling: Løfter arket fra bunken med venstre hånd og leser, snur det på «Håkon», ler, og legger det ned på siste ord.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt mistet Rudolf retningen. Tåken over fjorden var kald på feil måte. Rudolf landet i en snøfonn, med nesa først.»
   - Varighet: 15 s (21 ord)
   - Handling: Lager en liten bue med venstre hånd som ender i bordplaten, ler.
   - Kulde: Svak knitring.
4. **Replikk:** «Rudolf trenger det samme som sjøfolk har hatt med seg: det som peker samme vei uansett hvor man snur seg. Ikke et kart, ikke en stjerne.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Snur seg i stolen til begge sider mens venstre pekefinger står stille i luften, rister på hodet to ganger.
   - Kulde: Svak knitring.
5. **Replikk:** «Tingen finnes to steder. Sjøfolk hadde den i lomma, Rudolf har den i nesa. Kle dere godt, det er kaldt. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Klapper seg på brystet med venstre hånd, så på nesen, ler.
   - Kulde: Svak knitring, klikk.

## Dag 5 (lø) – Brevfuglen over Byfjellene · ULRIKEN

Kulde-nivå 1. Svak knitring.

1. **Replikk:** «Gooooood morgen, Snøfall! Allerede på jakt, hører jeg. Det regner i Bergen. Det gjør det alltid, sier Winter.»
   - Varighet: 13 s (18 ord)
   - Handling: Legger venstre hånd rundt trekoppen uten å løfte den, lytter med hodet på skrå og smiler.
   - Kulde: Svak knitring.
2. **Replikk:** «Rapport fra Rampenissen: «Snøballkrig med marshmallows. Én bamse såra.» Såret! Med plaster på. Jeg sier det er trening.»
   - Varighet: 13 s (18 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom årets første fugl over byfjellene. Winter stoler ikke på linjen lenger. Noen lytter. Nå skriver han i hemmelig skrift.»
   - Varighet: 15 s (22 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, ser på det, legger det ned.
   - Kulde: Svak knitring, kort hopp i bildet på «noen lytter».
4. **Replikk:** «Winter flyttet hver bokstav så mange skritt fram som IQ sprengte sikringer onsdag. Dere må gå så mange tilbake. Husk at vårt alfabet slutter på Å.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Går noen små skritt med to fingre på venstre hånd over bordplaten uten å telle høyt, så tilbake igjen.
   - Kulde: Svak knitring.
5. **Replikk:** «Se til at brevfuglen har det bra i natt. Ha en riktig fin lørdag, alle sammen!»
   - Varighet: 12 s (16 ord)
   - Handling: Lener seg inn som om han sier noe hemmelig, så tilbake med et smil.
   - Kulde: Svak knitring, klikk.

## Dag 6 (sø) – Skyggene i Gangen · LYKT · rødt hjerte · 2. advent

Kulde-nivå 1. Svak knitring.

1. **Replikk:** «Gooood morgen, Snøfall, og god andre advent! To lys i kransen. Hjerterud og jeg kappes om å tenne dem. Hun vant igjen.»
   - Varighet: 15 s (22 ord)
   - Handling: Holder opp to fingre på venstre hånd, så lar han hånden falle og ler av seg selv.
   - Kulde: Svak knitring.
2. **Replikk:** «Rampenissen rapporterer: «Æ laga snøengla. Det va ikkje snø.» Det var mel. Hjerterud sukket. Jeg lo så jeg måtte holde meg fast.»
   - Varighet: 15 s (22 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler høyt og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt sa Orakelet: det som fryser linjen, tåler ikke lys. IQ hengte lys rundt antennen ved tjernet. Den ligner et juletre.»
   - Varighet: 15 s (22 ord)
   - Handling: Nikker mot juletreet til venstre og holder blikket der, smiler.
   - Kulde: Svak knitring.
4. **Replikk:** «Og nå dagens ord, Håkon. Det barna bar mellom gårdene da det var som mørkest. Tenk godt etter nå.»
   - Varighet: 14 s (19 ord) · låst
   - Handling: Løfter venstre hånd som om han bærer noe i en hank, og holder den slik hele segmentet.
   - Kulde: Svak knitring.
5. **Replikk:** «Barna bar ikke hva som helst. Ikke et bål. Ikke et stearinlys. Det med hank, som man kan henge fra seg. Ha en riktig fin søndag!»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Henger det usynlige på en usynlig krok med venstre hånd, så vinker han kort.
   - Kulde: Svak knitring, klikk.

## Dag 7 (ma) – Inntrengeren i Fryseren · KULDE · M2 Navnet

Kulde-nivå 2. Første dag med rim på innsiden av vinduet og langs bordkanten, synlig pust. Bildet fryser etter «kaller seg» i segment 2 der han ellers ville sagt navnet (etterarbeid). Segment 2 peker til tegnene på kortene (meta 1); Frostgraden er i segment 5.

1. **Replikk:** «Gooood morgen, Snøfall! Brrr. Jeg fryser på kontoret. Rim på innsiden av vinduet! Hopp, dere, så dere blir varme.»
   - Varighet: 14 s (19 ord)
   - Handling: Gnir venstre hånd mot overarmen, ser over skulderen mot vinduet, så hopper han litt i stolen.
   - Kulde: Synlig pust, rim i vinduskantene.
2. **Replikk:** «I natt fanget Orakelet den som sender på åttifem. Den kaller seg… ja. Orakelet skrev navnet med tegnene i hjørnet av kortene.»
   - Varighet: 15 s (22 ord)
   - Handling: Peker med venstre pekefinger i hjørnet av det øverste arket i brevbunken uten å løfte det, stopper opp på «kaller seg».
   - Kulde: Synlig pust, svak knitring. Bildet fryser på «kaller seg», lyden faller ut.
3. **Replikk:** «Nord for polarsirkelen står ikke sola opp. Det heter mørketid. Mørket er ikke ondt. Det er et sted varmen ikke har nådd.»
   - Varighet: 15 s (22 ord)
   - Handling: Snakker rolig, legger venstre hånd flatt på boka og lar den ligge.
   - Kulde: Synlig pust, svak knitring.
4. **Replikk:** «Men hør nå. Navnet er det motsatte av det Hjerterud har i ovnen akkurat nå. Ikke bollene. Det som slår mot ansiktet når hun åpner ovnsdøra.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Vifter venstre hånd foran ansiktet som fra ovnsvarme, smiler.
   - Kulde: Synlig pust.
5. **Replikk:** «Fra i dag viser Orakelet hvor kaldt linjen er. Vi kaller det Frostgraden. Hold på hverandre. Ha en riktig fin dag!»
   - Varighet: 15 s (21 ord)
   - Handling: Legger venstre hånd rundt trekoppen, nikker rolig.
   - Kulde: Synlig pust, klikk.

## Dag 8 (ti) – Lampene som Lyver · KRETSKORT

Kulde-nivå 1. Rim på vinduet, synlig pust. Mikrofonen «sitter fast» i hånda hans i segment 1; den blir i høyre hånd.

1. **Replikk:** «Gooooood morgen, Snøfall! Uke én er unnagjort, folkens. Bra jobbet! Og mikrofonen har fryst fast i hånda mi. Den sitter.»
   - Varighet: 14 s (20 ord)
   - Handling: Ser ned på mikrofonen i høyre hånd og vrikker på håndleddet som om den sitter fast; fingrene holder hele tiden rundt håndtaket. Gir opp og ler.
   - Kulde: Rim på bordkanten, synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Æ bygde et tårn av frokostblanding. Sigma-tårn.» Sigma. Ingen av oss vet hva det betyr.»
   - Varighet: 13 s (18 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, holder det langt fra øynene, ler og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt satt IQ med loddebolten. Han bygger noe som holder det kalde ute. Bare lamper med strøm lyser, sier han.»
   - Varighet: 15 s (21 ord)
   - Handling: Peker mot taket der verkstedet er med venstre hånd, og holder pekefingeren der til siste setning, der han knipser som en bryter.
   - Kulde: Synlig pust.
4. **Replikk:** «Hør etter nå, Kristian. Dagens ord er det IQ holder i hendene hele natten: den lille grønne plata alle ledningene sitter fast på.»
   - Varighet: 15 s (23 ord) · låst
   - Handling: Lener seg inn, former et lite rektangel med tommel og pekefinger på venstre hånd og holder det.
   - Kulde: Synlig pust.
5. **Replikk:** «IQ lodder på én, sover på én, og kaller den alltid det samme, med to ord i ett. Ha en riktig fin dag!»
   - Varighet: 15 s (23 ord) · låst
   - Handling: Legger kinnet på venstre hånd som på en pute, ler.
   - Kulde: Svak knitring, klikk.

## Dag 9 (on) – Krystall-Matematikk · 24 · blått hjerte

Kulde-nivå 1. Rim, synlig pust, svak knitring. Morgensangen, andre forsøk, og denne gangen går den. Pil ble lurt to ganger i natt (som på radioen og i e-posten) før han telte på nytt.

1. **Replikk:** «Gooood morgen, Snøfall! Morgensangen, andre forsøk: God morgen, kopp. God morgen, bok. God morgen, Håkon, Hanna, Kristian. Og god morgen, Pil!»
   - Varighet: 15 s (21 ord)
   - Handling: Dirigerer med venstre pekefinger, nikker mot koppen og boka, så ut mot lytterne, fornøyd.
   - Kulde: Synlig pust.
2. **Replikk:** «I natt la Kulde falske krystaller i radaren, så Orakelet mistet tellingen. Jeg gikk på den selv. Pil satt oppe hele natten.»
   - Varighet: 15 s (22 ord)
   - Handling: Legger venstre hånd flatt på boka og blir alvorlig, så ler han kort av seg selv.
   - Kulde: Knitring, kort hopp i bildet på «falske».
3. **Replikk:** «Hvert snøkrystall har seks armer. Det kommer av hvordan vann fester seg til vann når det fryser. Nå kommer det viktigste, Håkon.»
   - Varighet: 15 s (22 ord)
   - Handling: Sprer fingrene på venstre hånd og holder dem opp mot lampelyset hele segmentet.
   - Kulde: Synlig pust, rim på vinduet.
4. **Replikk:** «Pil ble lurt to ganger i natt. Så satte han seg ned med lupen. Pil telte armene tre ganger. Seks hver gang på de ekte.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Teller på fingrene på venstre hånd, én og én, langsomt, og nikker på den siste.
   - Kulde: Synlig pust.
5. **Replikk:** «De falske hadde feil tall, og de var lette å kjenne igjen når man først så etter. Tell nøye, dere. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Banker lett på bordet med venstre hånd på «feil tall», smiler.
   - Kulde: Synlig pust, klikk.

## Dag 10 (to) – Fargene som Forsvant · SPEKTER · frost nivå 1

Kulde-nivå 3. Fargene renner ut av bildet i segment 2 og er borte resten av dagen; segment 4 hakker i bildet, og Julius gjentar brikken i segment 5. Alt dette gjøres i etterarbeid (ffmpeg) per segment; prompten ber bare om knitring.

1. **Replikk:** «Hallo? Hører dere meg? God morgen, Snøfall. Linjen er dårlig i dag. Jeg snakker langsomt og sier det viktigste to ganger.»
   - Varighet: 15 s (21 ord)
   - Handling: Holder mikrofonen tett inntil munnen, banker på den med venstre pekefinger.
   - Kulde: Kraftig knitring.
2. **Replikk:** «I natt tok Kulde fargene. Fra linjen, fra Snøfall TV, og fra skjermen hjemme hos dere. Bare juletreet holder litt igjen.»
   - Varighet: 15 s (21 ord)
   - Handling: Ser seg rundt i rommet, ser ned på sin egen venstre hånd.
   - Kulde: Kraftig knitring. Fargene renner ut av bildet mens han snakker.
3. **Replikk:** «Rødt og grønt er julens farger. Kristtornen er grønn hele vinteren, og bærene er røde. Den lyste alene i mørket.»
   - Varighet: 14 s (20 ord)
   - Handling: Nikker mot juletreet til venstre, holder opp to fingre på venstre hånd for de to fargene.
   - Kulde: Knitring.
4. **Replikk:** «Hør nå godt. Alle fargene på rekke, slik regnbuen stiller dem opp. IQ har ett ord for hele rekka. Han sier det når han er stolt.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Tegner en bue i luften med venstre hånd.
   - Kulde: Knitring. Bildet hakker gjennom segmentet.
5. **Replikk:** «Én gang til. Alle fargene på rekke, slik regnbuen stiller dem opp. Ett ord for hele rekka. Hold ut, dere. Ha en riktig fin dag, likevel.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Tegner buen en gang til, langsommere, ser bestemt ut.
   - Kulde: Svak knitring. Klikk.

## Dag 11 (fr) – Antenne-Krisen · 75 · bonus

Kulde-nivå 2 (senket fra 3, intensitetskurven). Kraftig knitring, bildet hopper, rim. Lydbortfall bare i segment 1 og aldri i brikken (etterarbeid). Fem segmenter: brikken i segment 4, «vi hører dere» og avskjed i 5.

1. **Replikk:** «Ja… hallo? Er det liv i jernvaren? Gooood morgen, Snøfall! Nei, ikke mye i dag. Men vi prøver likevel.»
   - Varighet: 14 s (19 ord)
   - Handling: Banker på mikrofonen med venstre pekefinger, ser ned på den i høyre hånd og vrikker på håndleddet; fingrene holder rundt håndtaket.
   - Kulde: Knitring, rim på vinduet. Lyden faller ut et øyeblikk.
2. **Replikk:** «Rampenissen rapporterer: «Æ e en bakt potet. I folie.» En potet! Hjerterud spurte om han var ferdigstekt. Jeg lo lenge.»
   - Varighet: 14 s (20 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler lavt og legger det ned.
   - Kulde: Knitring. Kort hopp i bildet på «potet».
3. **Replikk:** «I natt delte Kulde senderen i tre. Antennen ved tjernet er full av is. Men IQ har en regel. Hør nå, Kristian.»
   - Varighet: 15 s (22 ord)
   - Handling: Peker bak seg mot vinduet med venstre hånd og holder pekefingeren der.
   - Kulde: Knitring øker, rim på vinduet.
4. **Replikk:** «Tre sendere, sa IQ, og alt han bygger ender på fem. Kulde satte ut sine egne. Ikke gang dem. Legg IQs sammen, så finner dere oss.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Tre fingre på venstre hånd, så fem, så legger han hånden flat på bordet.
   - Kulde: Svak knitring.
5. **Replikk:** «Vi hører dere i biter, men vi hører dere. Vi er her. Ha en riktig fin dag, dere tre.»
   - Varighet: 14 s (19 ord)
   - Handling: Legger venstre hånd flatt på bordet foran seg, ser rolig fram.
   - Kulde: Knitring, klikk som nesten drukner i støy.

## Dag 12 (lø) – Lydbølgene som Smelter Is · MELODI · grønn sol · M3

Kulde-nivå 2. Rim, synlig pust, bildet fryser i segment 3 (etterarbeid). Julius innrømmer at han ikke trodde Rampenissen, og sier han skal si unnskyld i kveld; radioen samme morgen («Julius sa i går kveld at æ innbilt mæ det») og dag 13 («Julius sa unnskyld») stemmer uansett rekkefølge.

1. **Replikk:** «Goooood morgen, Snøfall! Jeg tok feil i går, og det innrømmer jeg. Det skjer ikke ofte. Spør Hjerterud. Hun har en liste.»
   - Varighet: 15 s (22 ord)
   - Handling: Sitter rolig, legger venstre hånd på bordet og lar den ligge.
   - Kulde: Synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Æ laga lydbølge av dorull. Heile kjøkkenet.» En hel rull. Jeg lo så trekoppen hoppet. Hjerterud lo ikke.»
   - Varighet: 15 s (21 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt gikk Hjerterud til slusen og nynnet. Isen sprakk, og noe svarte. Rampenissen hørte det først. Jeg trodde ham ikke.»
   - Varighet: 15 s (21 ord)
   - Handling: Ser ned og stryker seg over skjegget med venstre hånd, litt flau, hele segmentet.
   - Kulde: Synlig pust. Bildet fryser på «sprakk».
4. **Replikk:** «Håkon, hør. Hjerterud nynnet tre toner ved slusen, den dypeste først. Ingen ord. Bare det tonene lager når de kommer etter hverandre. Isen kjente det igjen.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Holder venstre hånd lavt, så litt høyere, så høyest, som tre trappetrinn.
   - Kulde: Synlig pust.
5. **Replikk:** «Jeg tok feil om Rampenissen, og i kveld sier jeg unnskyld. Syng litt, dere. Mm, mm, mmm. Ha en riktig fin helg!»
   - Varighet: 15 s (22 ord)
   - Handling: Nynner de tre tonene i replikken, lavest først, med venstre hånd som trappetrinn, ler.
   - Kulde: Synlig pust, klikk.

## Dag 13 (sø) – Luciadagens Gylne Krydder · SAFRAN · 3. advent

Kulde-nivå 1. Rim, synlig pust, svak knitring.

1. **Replikk:** «Gooood Lucia-morgen, Snøfall! Tredje lys i dag, trettende desember. Hjerterud har bakt siden klokka fire, og hele landsbyen lukter.»
   - Varighet: 14 s (19 ord)
   - Handling: Holder opp tre fingre på venstre hånd, så snuser han i luften og smiler.
   - Kulde: Synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Elleve lussekatta. Æ e død no.» Død! Av boller. Jeg har vært nær selv. Hjerterud teller mine.»
   - Varighet: 14 s (20 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler rungende og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt så Kulde på Lucia-lysene gjennom linjen. Den tok ingenting. Den bare så. Jeg vet ikke hva jeg skal tro.»
   - Varighet: 15 s (21 ord)
   - Handling: Blir stille, ser mot vinduet, snur seg sakte tilbake.
   - Kulde: Synlig pust, rim i vinduskantene.
4. **Replikk:** «Og så det Hjerterud ikke vil jeg skal si. Det gule i bollene er krydderet fra en krokus. Tre tråder per blomst, plukket for hånd.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Ser seg over skulderen mot vinduet, senker stemmen, gnir tommel mot pekefinger på venstre hånd.
   - Kulde: Synlig pust.
5. **Replikk:** «Tre tråder er lite. Derfor koster det mer enn gull, og derfor låser Hjerterud det inn. God tredje advent, dere tre. Ha en riktig fin dag!»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Later som han vrir om en nøkkel med venstre hånd, smiler.
   - Kulde: Synlig pust, klikk.

## Dag 14 (ma) – Hemmeligheten i Papirvingene · ORIGAMI

Kulde-nivå 1, uke 3: lyden er borte det første sekundet i segment 1 (etterarbeid). Den blå fuglen sitter i karmen under vinduet, utenfor bildet; Julius nikker ned mot den i segment 2.

1. **Replikk:** «Ja, hallo? Mikrofonen falt ut. Der, ja. Gooood morgen, Snøfall! Mikrofonen er eldre enn meg, og like sta. Rull med skuldrene, dere.»
   - Varighet: 15 s (22 ord)
   - Handling: Banker på mikrofonen med venstre pekefinger, så ruller han med skuldrene og stønner.
   - Kulde: Svak knitring. Lyden er borte det første sekundet.
2. **Replikk:** «I natt åpnet Winter brevfuglene. Én fugl hadde ingen sendt. Blå. Den sitter i vinduskarmen min, med et brev fryst til vingen.»
   - Varighet: 15 s (22 ord)
   - Handling: Snur seg mot vinduet og nikker ned mot karmen, utenfor bildet, og blir sittende vendt dit.
   - Kulde: Svak knitring.
3. **Replikk:** «Det første brevet til Snøfall kom i en flaske fra Bergen, for over hundre år siden. En gutt ville ha sparkstøtting.»
   - Varighet: 15 s (21 ord)
   - Handling: Løfter et gulnet ark fra bunken med venstre hånd, ser på det, legger det ned før siste setning.
   - Kulde: Svak knitring.
4. **Replikk:** «Nå kommer det, Kristian. Winter har ett ord for å gi et flatt ark vinger uten saks og lim, bare ved å bøye det.»
   - Varighet: 15 s (24 ord) · låst
   - Handling: Løfter et ark fra bunken, bøyer det én gang på midten og legger det ned igjen før siste setning.
   - Kulde: Svak knitring.
5. **Replikk:** «Winter er lur. Han uttaler det feil med vilje, så ingen på linjen skal forstå. Vær snille med fuglen. Ha en riktig fin dag!»
   - Varighet: 15 s (24 ord) · låst
   - Handling: Legger venstre hånd flatt på brevbunken, nikker mot vinduet.
   - Kulde: Svak knitring, klikk.

## Dag 15 (ti) – Fargesamlerens Notatbok · KARAMELL · rød sol · M4

Kulde-nivå 1. Lampen flakker svakt (etterarbeid). Julius er stillere og langsommere enn ellers. Bare en stille morgenhilsen, ingen tull; dagen bærer avsløringen. Fargesamleren presenteres i segment 2 før nattens funn.

1. **Replikk:** «God morgen, Snøfall. Jeg skal være kort i dag. Det har vært en lang natt her oppe. Ingen av oss har sovet.»
   - Varighet: 15 s (22 ord)
   - Handling: Sitter tyngre i stolen enn vanlig, venstre hånd hviler på den åpne boka.
   - Kulde: Svak knitring. Lampen flakker én gang på «lang natt».
2. **Replikk:** «For lenge siden bodde Fargesamleren her. Han samlet de første iskrystallene. IQ bygde noe som holder dem kalde for alltid, under Nordtoppen.»
   - Varighet: 15 s (22 ord)
   - Handling: Stryker langsomt over siden i boka med venstre hånd, blar ikke.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt fant IQ notatboken. Det IQ bygde, heter Vintervokteren og sender på åttifem. Da strømmen røk, sto det alene i mørket.»
   - Varighet: 15 s (22 ord)
   - Handling: Lar venstre hånd ligge stille på boka, ser lenge ned på den.
   - Kulde: Svak knitring. Lampen flakker på «alene».
4. **Replikk:** «Hjerterud prøvde å varme opp IQ med det hun lager når sukker blir brunt og varmt i gryta, og som stivner til gull når det kjølner.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Rører i en usynlig gryte med venstre hånd, så lar han hånden falle.
   - Kulde: Svak knitring.
5. **Replikk:** «Og IQ? Han spiste ikke engang det. Vær snille med hverandre i dag, og med IQ. Ha en fin dag, dere.»
   - Varighet: 15 s (21 ord) · låst
   - Handling: Legger venstre hånd rundt trekoppen, ser ned, så opp igjen.
   - Kulde: Svak knitring. Lampen flakker på «fin dag». Klikk.

## Dag 16 (on) – Pakkesentralen i Spinn · SORTERING · bonus

Kulde-nivå 2. Lampen flakker, lyden faller ut og bildet fryser i segment 3 (etterarbeid). Morgensangen, tredje forsøk, stoppes av lampen. Kroken fra segment 2 (vinduet) løses i segment 5 og dag 17.

1. **Replikk:** «Gooood morgen, Snøfall! Morgensangen, tredje forsøk: God morgen, kopp. God morgen, bok. God morgen, lampe… nei, flakker den. Vi tar sangen senere.»
   - Varighet: 15 s (22 ord)
   - Handling: Dirigerer med venstre pekefinger, ser over skulderen opp mot vegglampen og slår oppgitt ut med hånden.
   - Kulde: Svak knitring. Lampen flakker på «lampe».
2. **Replikk:** «Kristian, har du vært våken en hel natt? Jeg prøver i natt. Orakelet vil ha meg i vinduet, men sier ikke hvorfor.»
   - Varighet: 15 s (22 ord)
   - Handling: Nikker mot vinduet bak seg og holder blikket der, så legger han venstre pekefinger over munnen.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt snudde Vintervokteren samlebåndet. Alt ligger i én haug, men ingenting er ødelagt. Jeg tror den vil at Winter ser opp.»
   - Varighet: 15 s (22 ord)
   - Handling: Snurrer venstre hånd baklengs, stopper, ser tankefull ut.
   - Kulde: Svak knitring. Lyden faller ut et øyeblikk, bildet fryser på «haug».
4. **Replikk:** «Hør nå, Håkon. Winters ord for å legge alt i riktig hylle. Han sier det med stor S og har et skilt med det over døra.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Tegner en stor S i luften med venstre hånd, så peker han opp bak seg, der et skilt ville hengt.
   - Kulde: Svak knitring. Lampen flakker på «hylle».
5. **Replikk:** «Jeg står i vinduet i natt, slik Orakelet ba om. I morgen sier jeg hvorfor. Ha en riktig fin dag, alle sammen!»
   - Varighet: 15 s (22 ord)
   - Handling: Nikker mot vinduet igjen, smiler, vinker kort med venstre hånd.
   - Kulde: Svak knitring. Lampen flakker på «hvorfor». Klikk.

## Dag 17 (to) – Grønt over Polarhimmelen · NORDLYS

Kulde-nivå 1. Svak knitring, ett juletrelys slukner i segment 3 (etterarbeid). Ingen omtale av lykten på Landås (betinget innhold, bare i PS). Kroken fra dag 16 (vinduet) løses i segment 3. Det grønne skjæret i vinduet står i prompten som ønske, ikke som krav.

1. **Replikk:** «Goooood morgen, Snøfall… unnskyld, jeg gjesper. Jeg sto i vinduet hele natten, slik Orakelet ba om. Gjesp med meg, dere. Det hjalp.»
   - Varighet: 15 s (22 ord)
   - Handling: Gjesper stort med venstre hånd foran munnen, setter seg til rette.
   - Kulde: Svak knitring.
2. **Replikk:** «Rapport fra Rampenissen: «Kidnappa av kosedyra. Dem vil ha pepperkakan.» Et løsepengebrev! Jeg leste det to ganger. Jeg hadde gitt dem pepperkakene.»
   - Varighet: 15 s (22 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, ler gjennom gjespen og legger det ned.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom det grønt over fjellet, over lyktene ved antennen. Nå skjønner jeg hvorfor Orakelet ville ha meg der. Grotten svarte.»
   - Varighet: 15 s (22 ord)
   - Handling: Snur seg mot vinduet og blir sittende vendt dit.
   - Kulde: Svak knitring, et svakt grønt skjær i vinduet. Ett juletrelys slukner.
4. **Replikk:** «Og så det siste. De gamle her oppe hadde et navn på det grønne lyset. De sa at himmelen snakket når det kom.»
   - Varighet: 15 s (23 ord) · låst
   - Handling: Holder venstre hånd bak øret, lukker øynene et øyeblikk.
   - Kulde: Svak knitring.
5. **Replikk:** «Nissene sier det er himmelen som sender brev tilbake: grønt, bølgende, over fjellene, og bare når det er mørkt nok. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Lar venstre hånd bølge langsomt over hodet, så ned på bordet.
   - Kulde: Svak knitring, klikk.

## Dag 18 (fr) – Kastevind rundt Ulriken · TURBULENS · blå sol

Kulde-nivå 2. Lampen flakker, bildet fryser i segment 3 (etterarbeid). Hjelmen får sin grunn i segment 2 (Rampenissen holdt fast i Trixters lue; radioen forteller resten).

1. **Replikk:** «Gooood morgen, Snøfall! Fredag! Rist på dere, sånn som sleden gjorde i natt. Sånn, ja. Trixter har ikke sovet, og jeg knapt.»
   - Varighet: 15 s (22 ord)
   - Handling: Rister på skuldrene med venstre hånd i været, ler, setter seg til rette.
   - Kulde: Svak knitring. Lampen flakker på «sleden».
2. **Replikk:** «Rampenissen satt bakpå i natt og holdt i Trixters lue. Nå spiser Trixter med hjelm. Kristian, har du prøvd det? Jeg prøvde.»
   - Varighet: 15 s (22 ord)
   - Handling: Banker seg lett i hodet med venstre hånd, ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt testet Trixter ruten over Nordtoppen i uvær. Rundt Ulriken ristet sleden så pakkene hoppet. Trixter har et ord for sånt.»
   - Varighet: 15 s (22 ord)
   - Handling: Senker venstre hånd flatt over bordet som en slede og lar den hoppe, hele segmentet.
   - Kulde: Svak knitring. Bildet fryser på «ristet».
4. **Replikk:** «Når lufta får sleden til å hoppe og riste uten at noen ser hvorfor, har Trixter ett ord for det. Han sier det med sammenbitte tenner.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Biter tennene sammen med venstre hånd knyttet på bordet.
   - Kulde: Svak knitring. Lampen flakker på «tenner».
5. **Replikk:** «Rampenissen sa «aldri igjen». Det sa han i fjor også. Hold dere fast, dere tre. Ha en riktig fin fredag!»
   - Varighet: 14 s (20 ord)
   - Handling: Ler, griper tak i bordkanten med venstre hånd.
   - Kulde: Svak knitring. Lampen flakker på «fast». Klikk.

## Dag 19 (lø) – Eksplosjon i Fôringsautomaten · GULROT · pusterom

Kulde-nivå 0. Helt rent bilde og ren lyd for første gang siden dag 1 (ingen filterstøy i etterarbeid). Barna skal merke stillheten. Ingen omtale av lys på Landås-siden (betinget innhold, bare i PS).

1. **Replikk:** «Gooood morgen, Snøfall. Hysj. Hører dere det? Ingenting knitrer. Det er første gang siden første desember. Jeg har bare sittet og lyttet.»
   - Varighet: 15 s (22 ord)
   - Handling: Holder mikrofonen stille, lytter, så banker han forsiktig på den med venstre pekefinger og smiler bredt.
   - Kulde: Ingen. Lyden er ren.
2. **Replikk:** «Hanna, kan du være helt stille i tre sekunder? Én. To. Tre. Der. Stillere enn Rampenissen har vært hele desember.»
   - Varighet: 14 s (20 ord)
   - Handling: Holder opp én, to, tre fingre på venstre hånd, langsomt, så smiler han bredt.
   - Kulde: Ingen.
3. **Replikk:** «I natt var det stille under fjellet. Det grønne lyste over Nordtoppen for andre natt på rad. Men i verkstedet smalt det.»
   - Varighet: 15 s (22 ord)
   - Handling: Nikker rolig mot vinduet, så peker han opp mot taket der verkstedet er, og holder pekefingeren der.
   - Kulde: Ingen.
4. **Replikk:** «Hør nå. IQ bygde en automat. Den eksploderte. Det oransje drivstoffet Rudolf vil ha før hver tur, og som IQ nå har førti for lite av.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Slår ut med venstre hånd på «eksploderte» og ler, så holder han hånden åpen.
   - Kulde: Ingen.
5. **Replikk:** «Drivstoffet, Håkon. Det vokser med toppen opp og resten nede i jorda. I morgen trenger jeg dere uthvilt. Ha en fin dag!»
   - Varighet: 15 s (22 ord) · låst
   - Handling: Peker ned under bordet med venstre hånd, lener seg tilbake, puster synlig ut.
   - Kulde: Ingen. Klikk.

## Dag 20 (sø) – Sofa-Sleden · TURBO · grønn måne · 4. advent · varselet

Kulde-nivå 2. Bildet flimrer (lampen flakker, etterarbeid), og juletrelysene slukner i segment 6. Varselet i segment 2, brikken i segment 3–4, porten i 5, bøkene (som på radioen og i e-posten) og en rolig avskjed i 6. Ingen tull i dag; stemmen er rolig og nær.

1. **Replikk:** «God morgen, Snøfall. Fjerde lys. Håp, fred, glede, og i dag kjærlighet. Hjerterud sier man ikke kan hoppe over noen av dem.»
   - Varighet: 15 s (22 ord)
   - Handling: Teller fire lys med fingrene på venstre hånd, ett om gangen, langsomt.
   - Kulde: Svak knitring. Lampen flakker på «kjærlighet».
2. **Replikk:** «Frostgraden er åttiåtte prosent. I morgen, den mørkeste dagen, når Kulde huset deres. Ikke for å skade. Kulde vil dit lyset er.»
   - Varighet: 15 s (22 ord)
   - Handling: Lener seg nærmere mikrofonen, snakker lavt og rolig, venstre hånd stille på bordet.
   - Kulde: Svak knitring. Lampen flakker på «huset».
3. **Replikk:** «Hør nå godt etter, for her kommer dagens ord fra verkstedet. IQ ga sledemotoren det samme som biler får når de skal forbi noen i bakken.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Retter seg opp, peker mot taket der verkstedet er, med venstre hånd, og holder pekefingeren der.
   - Kulde: Svak knitring.
4. **Replikk:** «IQ elsker ordet. Han roper det hver gang motoren starter, og motoren hviner tilbake. I natt bygger IQ en mur av varme rundt linjen.»
   - Varighet: 15 s (24 ord) · låst
   - Handling: Kaster venstre hånd i været som IQ, så tegner han en firkant på bordet med fingeren.
   - Kulde: Svak knitring. Lampen flakker på «mur».
5. **Replikk:** «Jeg har bedt om én port. Den står der jeg tegnet sirkelen på Trixters kart. Kristian, se på kartet i kveld.»
   - Varighet: 15 s (21 ord) · låst
   - Handling: Tegner en liten sirkel på bordet med venstre pekefinger og lar fingeren stå der.
   - Kulde: Svak knitring.
6. **Replikk:** «I morgen må dere bare være hjemme. Finn åtte bøker med Rampenissen. Bøker holder på varmen. Ha en rolig dag, dere tre.»
   - Varighet: 15 s (22 ord)
   - Handling: Legger venstre hånd flatt på bordet, ser rolig fram.
   - Kulde: Svak knitring. Juletrelysene slukner, men lampen står. Klikk.

## Dag 21 (ma) – Vintersolverv · BRANNMUR · M5 Muren og porten · frost nivå 2

Kulde-nivå 3 i segment 1–2 (nesten frosset bilde, rim over hele vinduet, lyden hakker: etterarbeid; prompten ber om pust som røyk), renser seg i segment 3–4 og er 0 i segment 5. Muren holder. Ingen tull i dag; «i natt» kommer først, så solverv.

1. **Replikk:** «I natt nådde Kulde huset. IQ bygde muren. Den er ikke mot noen. Den holder varmen inne, så vi kan dele.»
   - Varighet: 15 s (21 ord)
   - Handling: Sitter nesten urørlig, venstre hånd rundt trekoppen som for å holde på varmen.
   - Kulde: Pusten står som røyk. Nesten frosset bilde, rim over hele vinduet, lyden hakker. Bildet fryser på «muren».
2. **Replikk:** «I dag er det vintersolverv, den eldste festen vi har. Folk tente bål den mørkeste natten, for de visste at lyset snur.»
   - Varighet: 15 s (22 ord)
   - Handling: Venstre hånd flat på bordet, stemmen er rolig.
   - Kulde: Pusten står som røyk. Nesten frosset bilde, rim, lyden hakker.
3. **Replikk:** «Hør nå godt etter, for her kommer dagens ord. IQ bygde en vegg av varme rundt linjen.»
   - Varighet: 12 s (17 ord) · låst
   - Handling: Tegner en linje over bordet med venstre håndkant og holder hånden der.
   - Kulde: Synlig pust. Rim, bildet hakker, men lyden er klar.
4. **Replikk:** «Veggen har et navn. De som kjemper mot flammene i skogen, bygger det samme, bare av det motsatte, og kaller den etter det de kjemper mot.»
   - Varighet: 15 s (26 ord) · låst
   - Handling: Peker på linjen han tegnet, holder blikket der.
   - Kulde: Svak knitring.
5. **Replikk:** «Muren har én åpning. Jeg lot ham la én port stå åpen. Inn mot grotten. Med varme i. Kom hjem i kveld. Vi er her.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Åpner en liten glipe i linjen med to fingre på venstre hånd, ser opp og smiler.
   - Kulde: Ingen. Rent bilde og ren lyd.

## Dag 22 (ti) – Winters Tall · LANDÅS · rød måne · Snill-listen

Kulde-nivå 0. Rent bilde og ren lyd. Rimen på vinduet er borte, bare dugg i hjørnene. Winters brev er et ark fra bunken; det løftes og legges ned i samme segment.

1. **Replikk:** «Gooooood morgen, Snøfall! I dag åpner Snill-listen. Den handler ikke om lydighet. Snill er å gå bort til den utenfor.»
   - Varighet: 14 s (20 ord)
   - Handling: Legger venstre hånd på den store boka, blar til en tom side og lar hånden ligge.
   - Kulde: Ingen.
2. **Replikk:** «I natt kom ingenting gjennom porten. Men Orakelet sier det er varmere der nede. Winter maser om stedet i tall, ikke ord.»
   - Varighet: 15 s (22 ord)
   - Handling: Løfter et ark fra bunken med venstre hånd, rister lett på det, legger det ned.
   - Kulde: Ingen.
3. **Replikk:** «Hør godt etter nå, Kristian. Winter skriver tall i stedet for bokstaver når noe er viktig. Og han har en regel.»
   - Varighet: 15 s (21 ord) · låst
   - Handling: Peker på det øverste arket i bunken med venstre pekefinger uten å løfte det, holder fingeren der.
   - Kulde: Ingen.
4. **Replikk:** «Her kommer regelen. A er alltid først, og så følger resten, helt til de tre siste som bare vi i nord har.»
   - Varighet: 15 s (22 ord) · låst
   - Handling: Skriver i luften med venstre hånd, teller videre med fingeren bortover bordet.
   - Kulde: Ingen.
5. **Replikk:** «Winter er forsiktig også. Og han legger alltid tre til hvert tall, for sikkerhets skyld. Trekk dem fra. Skriv navnene deres pent etterpå. Vi ses!»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Smiler, legger venstre hånd på brevbunken og vinker kort.
   - Kulde: Ingen.

## Dag 23 (on) – Nattevakt · STJERNEKLART · blå måne · sannheten

Kulde-nivå 0. Rent. Lys siver ned gjennom vinduet, mer enn vanlig. Rolig hilsen (som dag 10, 15 og 20). «I natt» er natten som var; sleden flyr «i kveld» (som på radioen).

1. **Replikk:** «God morgen, Snøfall. Lille julaften. Rampenissen rapporterer: «Æ bare kikka litt på en pakke.» Litt! Teipen var tom etterpå.»
   - Varighet: 14 s (19 ord)
   - Handling: Løfter et ark fra brevbunken med venstre hånd, leser, smiler skjevt og legger det ned.
   - Kulde: Ingen.
2. **Replikk:** «I natt så Orakelet i grotten. Noe der nede venter på lys. I kveld flyr sleden lavt over den, med lysene på.»
   - Varighet: 15 s (22 ord)
   - Handling: Senker venstre hånd flatt over bordet som en slede, langsomt, og lar den gli hele segmentet.
   - Kulde: Ingen.
3. **Replikk:** «Trixter pakker sleden, og Rudolf har spist. Hør nå godt etter. Orakelet meldte flyværet i ett ord. Ikke en sky, ikke én.»
   - Varighet: 15 s (22 ord) · låst
   - Handling: Ser opp mot taket og holder blikket der, venstre hånd rolig på bordet.
   - Kulde: Ingen.
4. **Replikk:** «Været har et ord for en natt der alt som blinker der oppe er synlig hele veien, og det ordet begynner med det som blinker.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Blunker med fingrene på venstre hånd mot taket, så legger han hånden rolig på bordet.
   - Kulde: Ingen.
5. **Replikk:** «I morgen er det jul, og da forteller jeg dere det siste. Ha en riktig fin dag, dere tre, og sov godt.»
   - Varighet: 15 s (22 ord)
   - Handling: Smiler, legger venstre hånd rundt trekoppen uten hast.
   - Kulde: Ingen. Klikk.

## Dag 24 (to) – God Jul på Landås · JULEMAGI · M6 Tøvær

Kulde-nivå 0. Alt virker. Rommet er varmere enn noen gang: alle juletrelys tent, mer gull i lyset, dampen fra trekoppen. Julius smiler hele veien. Seks segmenter: morgensangen går hele veien for første gang. Krystallet fra Vintervokteren sies rett ut (som i PS). Uttoningen i gull til slutt er etterarbeid.

1. **Replikk:** «Gooooooood morgen, Snøfall, og god jul! God morgen, kopp. God morgen, bok. God morgen, Kristian, Håkon, Hanna. God morgen, Landås. Den satt!»
   - Varighet: 15 s (22 ord)
   - Handling: Dirigerer med venstre pekefinger, nikker til koppen og boka, så mot vinduet, og ler høyt og lykkelig.
   - Kulde: Ingen. Alle lys tent.
2. **Replikk:** «I natt fløy sleden over grotten, og isen tiner. Den blå fuglen fløy hjem. Vintervokterens krystall ligger under treet deres.»
   - Varighet: 14 s (20 ord)
   - Handling: Nikker ned mot vinduskarmen bak seg, smiler, og blir vendt mot vinduet hele segmentet.
   - Kulde: Ingen.
3. **Replikk:** «Alt virker, og kontoret er varmt. Vi feirer ikke fordi alt er perfekt, men fordi huset har fred. Nå kommer det siste.»
   - Varighet: 15 s (22 ord)
   - Handling: Slår ut med venstre arm mot rommet, så legger han hånden på trekoppen.
   - Kulde: Ingen.
4. **Replikk:** «Hør nå, alle tre. Dere har laget noe hele desember uten å vite det. Ikke koden, den tastet dere. Ikke varmen, den kom fra ovnen.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Peker ut av bildet med venstre hånd, mot dem. Rister rolig på hodet to ganger.
   - Kulde: Ingen.
5. **Replikk:** «Det dere har laget, er dette. Det trollmenn later som de har, og som dere faktisk har hatt: tre søsken som holder sammen i mørket.»
   - Varighet: 15 s (25 ord) · låst
   - Handling: Holder opp tre fingre på venstre hånd og lukker dem langsomt til en knyttneve.
   - Kulde: Ingen.
6. **Replikk:** «Hør det siste også. Og Hjerterud setter alltid navnet på høytiden foran ordet, slik hun gjør med grøten og treet. God jul, dere tre!»
   - Varighet: 15 s (24 ord) · låst
   - Handling: Lener seg tilbake, lykkelig, løfter trekoppen med venstre hånd som en skål.
   - Kulde: Ingen klikk. Bildet toner ut i gull.

---

## Sjekktabell

Ord = talte ord i alle segmenter. Tale = ord / 2,0 (grovt; målt tempo er 1,79 ord/s). Klipp = sum av segmentvarigheter (0,5 s + ord/1,79 + 2 s hale, rundet opp, maks 15). Brikke S-andel = hvor mye av koden videoen gir alene. Alle brikker er kopiert ordrett fra `gaater-2026.md`; der brikken er lengre enn 26 ord, er den delt i to segmenter ved setningsgrense, uten endret ordlyd.

| Dag | Kode         | Ord | Tale s | Klipp s | Segm. | Lengste | Brikke S-andel                     | Merknad                                                               |
| --- | ------------ | --- | ------ | ------- | ----- | ------- | ---------------------------------- | --------------------------------------------------------------------- |
| 1   | SIGNAL       | 177 | 88     | 120     | 8     | 25      | 0 % (bruk, ingen bokstaver)        | Omskrevet 11. nov (flyt, åtte segm.); 85,0-hale i appen, ikke i filen |
| 2   | 48           | 109 | 54     | 74      | 5     | 23      | regel, ingen tall                  | Morgensangen første gang (skjærer seg)                                |
| 3   | PRISME       | 113 | 56     | 75      | 5     | 25      | 0 %                                | Låst brikke delt over segm. 4–5                                       |
| 4   | KOMPASS      | 114 | 57     | 74      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5), video regenereres               |
| 5   | ULRIKEN      | 100 | 50     | 68      | 5     | 26      | nøkkel som oppslag (dag 2)         | Segm. 4 ny: «like mange som sikringer onsdag»                         |
| 6   | LYKT         | 111 | 56     | 74      | 5     | 26      | 0 % (velger figur)                 |                                                                       |
| 7   | KULDE        | 110 | 55     | 74      | 5     | 26      | 0 % + peker til kortet             | Bildet fryser der navnet skulle vært sagt; segm. 3 og 5 nye           |
| 8   | KRETSKORT    | 105 | 52     | 72      | 5     | 23      | 0 % + regel om strøm               | Låst brikke delt over segm. 4–5; segm. 3 ny; mikrofonen sitter fast   |
| 9   | 24           | 115 | 58     | 75      | 5     | 25      | armer (6), ikke antall, ikke regel | Låst brikke delt over segm. 4–5; morgensangen andre gang (går)        |
| 10  | SPEKTER      | 114 | 57     | 74      | 5     | 26      | 0 %                                | Brikken gjentas i segm. 5 pga. hakking (låst)                         |
| 11  | 75           | 106 | 53     | 72      | 5     | 26      | to regler, ingen tall              | Segm. 4 ny («ender på fem»), segm. 5 nytt                             |
| 12  | MELODI       | 112 | 56     | 75      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 13  | SAFRAN       | 111 | 56     | 73      | 5     | 26      | 0 %                                | Låst brikke delt over segm. 4–5                                       |
| 14  | ORIGAMI      | 113 | 56     | 75      | 5     | 24      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 15  | KARAMELL     | 113 | 56     | 75      | 5     | 26      | 0 %                                | Låst brikke er 26 ord alene; «Han spiste ikke engang det» i segm. 5   |
| 16  | SORTERING    | 114 | 57     | 75      | 5     | 26      | 0 %                                | Brikken sier «stor S» (låst); morgensangen tredje gang (lampen)       |
| 17  | NORDLYS      | 114 | 57     | 75      | 5     | 25      | 0 %                                | Låst brikke delt over segm. 4–5; «i nord» (låst)                      |
| 18  | TURBULENS    | 112 | 56     | 74      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 19  | GULROT       | 112 | 56     | 74      | 5     | 26      | 0 %                                | Kulde 0; brikke delt over segm. 4–5                                   |
| 20  | TURBO        | 138 | 69     | 90      | 6     | 26      | 0 %                                | Brikke i segm. 3–4; segm. 5 ny: porten = sirkelen på kartet           |
| 21  | BRANNMUR     | 111 | 56     | 72      | 5     | 26      | 0 %                                | Brikke strammet 10. nov; delt over segm. 3–4                          |
| 22  | LANDÅS       | 110 | 55     | 74      | 5     | 25      | to regler, ingen tall              | Låst brikke (43 ord) delt over segm. 3–5                              |
| 23  | STJERNEKLART | 110 | 55     | 74      | 5     | 25      | 0 %                                | Låst brikke delt over segm. 3–4                                       |
| 24  | JULEMAGI     | 138 | 69     | 89      | 6     | 25      | 0 %                                | Låst brikke (50 ord) delt over segm. 4–6; morgensangen går hele veien |

Sum: 2 782 ord, snitt 116 per dag (cirka 60 s tale, 70 s med klippause). Ingen segmenter over 22 ord utenom låste brikker (høyst 26); alle klipp 11–15 s (`julius-dag.py lint` er grønn).

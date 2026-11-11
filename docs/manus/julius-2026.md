# Julius' videodagbok 2026 – manus

**Status: LÅST 10. november 2026 (steg 2).** Endringer krever eksplisitt ja fra Hans. Kjør `python3 scripts/manus-check.py` etter endringer.

**Revisjon 10. november (vanskelighet, godkjent):** nye segmenter dag 5/4, 7/3, 7/5, 8/3, 9/4, 11/4 og 11/5 (nytt), 20/5. Etter uavhengig gjennomgang også 4/4, 4/5, 12/4, 12/5, 14/4, 14/5, 18/4, 18/5 (brikken ga ordet alene). Brikkene står ordrett som i `gaater-2026.md` etter revisjonen.

**Revisjon 10. november (hilsen):** de fleste dagene åpner med «Gooood morgen, Snøfall!» (vokallengden og det som følger varierer) og slutter med «Ha en riktig fin dag!» eller en nær variant. Dag 10, 15, 20 og 23 hilser rolig («God morgen, Snøfall.»); dag 21 er uendret (nesten frosset bilde, rett på sak, og «Vi er her» står). Brikkene og lore-setningene er uendret; der brikken er siste setning, kommer avskjeden etter den (dag 16 og 20 fikk et kort ekstra segment).

**Revisjon 10. november (stemme):** åpninger, «i natt»-segmenter og avskjeder er skrevet om til Julius' måte å snakke på (`assets/characters/julius/replikker.md`): stor og varm «Gooood morgen», datoen som favorittdag, noe fysisk og tullete sammen med barna, latter på egen bekostning, mikrofonen som sitter fast, en hjemmelaget morgensang som skjærer seg (dag 2, 9, 16, 24) og kort «Vi ses!». Brikkene og lore-setningene er uendret. Alle handlinger er én bevegelse med venstre hånd (mikrofonen i høyre), bare med ting som er i stillbildet. Dag 2–5 regenereres med ref-v3; dag 6–24 er ikke generert ennå.

**Revisjon 10. november (kroker, til godkjenning):** på dag 3, 4, 6, 9, 11, 16, 17, 18 og 19 er ett fyllsegment (julefakta eller lore uten krok) byttet med en krok på høyst 26 ord: et spørsmål til ett av barna, noe tullete å gjøre sammen med Julius, et erting av morgendagen uten fakta, eller en liten avsløring om folkene i Snøfall. Brikkene, «i natt»-setningene, åpningene og avskjedene er uendret; dagens ordtall er innenfor ±15 %.

**Revisjon 11. november (rapporten, til godkjenning):** på dag 5, 6, 8, 11, 12, 13, 17 og 23 leser Julius én linje fra Rampenissens rapport om nattens strek (arket tas fra brevbunken, Rampenissens linje på nordlandsk) og reagerer varmt. Ett segment per dag, høyst 26 ord, i stedet for et fyllsegment (dag 6, 11 og 17: kroken, som var eneste fyll); brikkene, «i natt»-setningene, hilsen og avskjed er uendret. Bare streken slik barna så den, aldri det den bærer; dager der streken selv bærer brikke H (3, 4, 7, 9, 14, 16, 18, 21, 22, 24) og dager uten tull (10, 15, 20) er ikke med. Dag 19 er utelatt fordi streken sier koden.

Steg 2. Kilder (låst): `docs/historie-2026.md`, `docs/storyboard-2026.md`, `docs/gaater-2026.md`. Stemme og rom: `assets/characters/julius/*`, `assets/locations/julius-kontor/beskrivelse.txt`, `assets/stil.md`.

## Slik leses manuset

- Ett klipp per dag, 30–60 s, delt i 4–6 segmenter. Hvert segment er én generert videosnutt på høyst 26 ord og 13–15 s (målt på testklipp: videomodellen snakker cirka 2 ord i sekundet, og klipp over 15 s er ikke mulig).
- Fast form: åpning → dagens betydning eller lore → hva skjedde i natt → **brikke S** (ordrett fra `gaater-2026.md`) → kort avskjed. Brikken står alltid i nest siste eller siste segment, og avskjeden etter den er så kort at Kristian kan spole til slutten og høre brikken.
- Julius sitter ved pulten og snakker inn i mikrofonen til usynlige lyttere. Han ser aldri i kameraet. Mikrofonen er alltid i høyre hånd; hvert segment har én handling med venstre hånd, og bare med det som er i stillbildet (trekoppen, sentralbordet med ledninger, den åpne boka, brevbunken). Mikrofonkomikk er lov: han banker på den, vifter med den, den «sitter fast» i hånda.
- Barna ser videoen etter at de har vært i huset om morgenen. Julius viser aldri til noe de skal gjøre i huset; det fysiske han ber om, er tull sammen med ham (strekke seg, gjespe, hoppe).
- **Kulde** er Kuldes forstyrrelse i klippet, etter ukeplanen i `julius-kontor/beskrivelse.txt`: uke 1 svak knitring; uke 2 rim på vindu og bord, synlig pust; dag 10 fargene renner ut; uke 3 mikrofonen faller ut, lampen flakker, juletrelysene slukner ett og ett; dag 21 nesten frosset bilde; dag 22–24 rent, dag 24 ekstra varmt. Nivå 0–3 som i storyboardet §2.
- Tall sies med bokstaver i replikken der TTS ellers kan snuble («åttifem komma null»).
- Varighet per segment = ord delt på 2, rundet opp, pluss 2 sekunder pause, maks 15.

---

## Dag 1 (ti) – Direktelinjen · SIGNAL · M1

Kulde-nivå 1. Svak knitring i lyden hele klippet, lett snø i bildet. Rommet er ellers som på referansebildet. Seks segmenter (åpneren er lengre, godkjent). Skrevet om 11. november etter tilbakemelding fra visning (hakkete flyt, «én nisse» uforståelig): hvert segment er hele setninger som slutter på en naturlig pause, klementinene og Rampenissen sies rett ut, og brikke S står ordrett. Etter klippet legger appen på en 4 s hale (T14: snø, «LINJE 90,0 · BÆREBØLGE USTABIL», frekvensen sklir til 85,0 og tilbake); den er kode, ikke en del av videofilen.

1. **Replikk:** «Ja… hallo? Er det liv i jernvaren? Jo, der! Gooood morgen, Snøfall! Kristian, Håkon og Hanna, velkommen tilbake. I natt åpnet IQ direktelinjen til stua deres.»
   - Varighet: 15 s (26 ord)
   - Handling: Banker to ganger på mikrofonen med venstre pekefinger, lytter, så lyser han opp.
   - Kulde: Knitring i lyden, et kort hopp i bildet idet han sier «stua deres».
2. **Replikk:** «Det første han sendte ned fra verkstedet, var Hjerteruds niste: tre esker klementiner. Se-vitamin, kaller hun det. Rampenissen satt oppå eskene. Dere så hvordan det endte.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder venstre hånd opp som om han har en klementin i den, skreller den med tommelen, lukter på fingrene og smiler.
   - Kulde: Svak knitring.
3. **Replikk:** «Advent betyr ankomst. Julen er på vei, og Rampenissen var den første som kom. Derfor teller vi dagene i stedet for å hoppe rett til julaften.»
   - Varighet: 15 s (26 ord)
   - Handling: Blar i den store boka med venstre hånd, legger den flat på siden.
   - Kulde: Svak knitring.
4. **Replikk:** «Men linjen er ikke helt i orden ennå. Bærebølgen hakker, og Orakelet sier det ligger noe under lyden. Noe som lytter.»
   - Varighet: 13 s (21 ord)
   - Handling: Lener seg nærmere mikrofonen, senker stemmen på «noe som lytter».
   - Kulde: Knitringen blir tydeligere i to sekunder, så normal.
5. **Replikk:** «Når linjen bærer, roper IQ ett ord fra verkstedet. Det er det ordet radioen deres leter etter når den skurrer, rett før stemmen kommer gjennom.»
   - Varighet: 15 s (25 ord)
   - Handling: Peker mot taket der IQ holder til, så holder han venstre hånd bak øret.
   - Kulde: Svak knitring.
6. **Replikk:** «Ta vare på hverandre, og ikke spis for mye snø. Julius over og ut… hvis mikrofonen slipper hånda mi, da. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord)
   - Handling: Humrer, rister mikrofonen i høyre hånd som om den sitter fast, ler.
   - Kulde: Svak knitring, klikk når mikrofonen slås av.

## Dag 2 (on) – Sikringsboksen til IQ · 48

Kulde-nivå 1. Svak knitring, lett snø. Morgensangen for første gang, og den skjærer seg etter tre linjer.

1. **Replikk:** «Goooood morgen, Snøfall! Og ekstra god morgen til dere tre med sovesveis. Det har jeg også. Andre desember, favorittdagen min.»
   - Varighet: 12 s (20 ord)
   - Handling: Stryker seg over sitt eget skallete hode med venstre hånd og ler lavt.
   - Kulde: Svak knitring.
2. **Replikk:** «Jeg har laget en morgensang: God morgen, kopp. God morgen, bok. God morgen, ledninger… nei. Nå røk rimet. Vi tar den en annen dag.»
   - Varighet: 14 s (24 ord)
   - Handling: Dirigerer med venstre pekefinger i takt, stopper midt i, slår ut med hånden og ler av seg selv.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt koblet IQ kaffetrakteren på forsterkeren. Det smalt. Tre sikringer røk, og Kanal to ble mørk. IQ sier det var været. Det var trakteren.»
   - Varighet: 15 s (25 ord)
   - Handling: Rister på hodet med et skjevt smil, slår ut med venstre hånd.
   - Kulde: Lampen i bakgrunnen blinker én gang når han sier «smalt».
4. **Replikk:** «Her i verkstedet kaster vi ingenting. Går noe i stykker, åpner vi det og ser hvorfor. En reparert ting har en historie. IQ har én regel.»
   - Varighet: 15 s (26 ord)
   - Handling: Legger venstre hånd på sentralbordet ved siden av seg og plugger inn en ledning.
   - Kulde: Svak knitring.
5. **Replikk:** «IQ sier man aldri bytter bare én sikring. Man legger alle sammen, ellers går den neste i morgen. Ha en riktig fin dag!»
   - Varighet: 14 s (23 ord)
   - Handling: Holder opp én finger på venstre hånd, så samler han fingrene til en knyttneve, og vinker kort.
   - Kulde: Svak knitring, klikk.

## Dag 3 (to) – Rimfrost på Ruten · PRISME · grønt hjerte

Kulde-nivå 1 med ett kort blått blaff i bildet i segment 3 (første spor av grotten). Pil presenteres i segment 2 (første gang barna hører navnet).

1. **Replikk:** «Ja, hallo? Jo, der kom lyset på. Gooood morgen, Snøfall! Lampen er sen i dag, akkurat som meg. Strekk armene i været, alle sammen. Sånn.»
   - Varighet: 15 s (25 ord)
   - Handling: Myser mot lampen, så strekker han venstre arm rett opp over hodet og stønner fornøyd.
   - Kulde: Lampen tenner et halvt sekund forsinket.
2. **Replikk:** «Hanna, kan du tegne en stjerne i lufta? Sånn. Pil, hun som passer krystallene våre, tegnet ti på arket mitt i natt. Ingen er like.»
   - Varighet: 15 s (25 ord)
   - Handling: Tegner en stjerne i luften med venstre hånd, så ser han ned på arket foran seg og smiler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom det et sånt mønster på linjen vår. Og Orakelet så et blått glimt på åttifem komma null. Et sted vi ikke sender fra.»
   - Varighet: 15 s (26 ord)
   - Handling: Legger venstre hånd flatt på den åpne boka, sitter helt stille.
   - Kulde: Ett blått blaff over hele bildet, et halvt sekund, idet han sier «blått glimt».
4. **Replikk:** «Hør nå godt etter, dere tre. Pil holdt glassbiten mot lyset, og hele regnbuen falt på gulvet. Jeg sto midt i den.»
   - Varighet: 13 s (22 ord)
   - Handling: Lener seg inn mot mikrofonen og peker med venstre hånd mot vegglampen, holder pekefingeren der.
   - Kulde: Svak knitring.
5. **Replikk:** «IQ sa navnet på en sånn glassbit tre ganger. Det er ikke et speil og ikke en lupe. Ha en riktig fin dag, dere tre!»
   - Varighet: 15 s (25 ord)
   - Handling: Blar om en side i den åpne boka med venstre hånd og lar hånden ligge på siden, smiler.
   - Kulde: Svak knitring, klikk.

## Dag 4 (fr) – Skotoget i Gangen · KOMPASS

Kulde-nivå 1. Svak knitring, lett snø.

1. **Replikk:** «Goooooood morgen, Snøfall! Ja, nå skal vi se… hvor la jeg lappen? Under mikrofonen. Fjerde desember. Barbro-dagen. Hjerterud skrev den opp for meg med rød penn.»
   - Varighet: 15 s (26 ord)
   - Handling: Roter i brevbunken med venstre hånd, løfter så mikrofonen og finner lappen under den, holder den langt fra øynene.
   - Kulde: Svak knitring.
2. **Replikk:** «Her står det mer med rød penn: Julius, husk votter. Julius, ikke spis snø. Håkon, hun har skrevet opp deg også: husk lua.»
   - Varighet: 14 s (23 ord)
   - Handling: Holder lappen opp med venstre hånd og leser hele veien, snur den på «Håkon», ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt mistet Rudolf retningen. Det lå en tåke over fjorden som var kald på feil måte. Han landet i en snøfonn. Med nesa først.»
   - Varighet: 15 s (25 ord)
   - Handling: Lager en liten bue med venstre hånd som ender i bordplaten, ler.
   - Kulde: Lett snø i bildet øker i to sekunder.
4. **Replikk:** «Rudolf trenger det samme som sjøfolk har hatt med seg: det som peker samme vei uansett hvor man snur seg. Ikke et kart, ikke en stjerne.»
   - Varighet: 15 s (26 ord)
   - Handling: Snur seg i stolen til begge sider mens venstre pekefinger står stille i luften, rister på hodet to ganger.
   - Kulde: Svak knitring.
5. **Replikk:** «Tingen finnes to steder. Sjøfolk hadde den i lomma, Rudolf har den i nesa. Kle dere godt, det er kaldt. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord)
   - Handling: Klapper seg på brystet med venstre hånd, så på nesen, ler.
   - Kulde: Svak knitring, klikk.

## Dag 5 (lø) – Brevfuglen over Byfjellene · ULRIKEN

Kulde-nivå 1. Svak knitring.

1. **Replikk:** «Gooooood morgen, Snøfall! Allerede på jakt, hører jeg. Sett dere ned, pust ut. Jeg hører det regner i Bergen. Det gjør det alltid, sier Winter.»
   - Varighet: 15 s (25 ord)
   - Handling: Legger venstre hånd rundt trekoppen på bordet uten å løfte den, puster synlig ut.
   - Kulde: Svak knitring.
2. **Replikk:** «Rapport fra Rampenissen: «Snøballkrig i stua. Med marshmallows. Én bamse såra.» Såret! Med plaster på. Hjerterud sier det er sløsing. Jeg sier det er trening.»
   - Varighet: 15 s (25 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom årets første fugl over byfjellene. Men Winter stoler ikke på linjen lenger. Noen lytter. Så nå skriver han alt i hemmelig skrift.»
   - Varighet: 15 s (25 ord)
   - Handling: Tar opp et ark fra papirbunken med venstre hånd, ser på det, legger det ned.
   - Kulde: Kort hopp i bildet på «noen lytter».
4. **Replikk:** «Winter flyttet hver bokstav så mange skritt fram som IQ sprengte sikringer onsdag. Dere må gå så mange tilbake. Husk at vårt alfabet slutter på Å.»
   - Varighet: 15 s (26 ord)
   - Handling: Går noen små skritt med to fingre på venstre hånd over bordplaten uten å telle høyt, så tilbake igjen.
   - Kulde: Svak knitring, klikk.
5. **Replikk:** «Se til at brevfuglen har det bra i natt. Ha en riktig fin lørdag, alle sammen!»
   - Varighet: 10 s (16 ord)
   - Handling: Lener seg inn som om han sier noe hemmelig, så tilbake med et smil.
   - Kulde: Svak knitring, klikk.

## Dag 6 (sø) – Skyggene i Gangen · LYKT · rødt hjerte · 2. advent

Kulde-nivå 1. Svak knitring.

1. **Replikk:** «Gooood morgen, Snøfall, og god andre advent! To lys i kransen, den sjette desember. Hjerterud og jeg kappes om å tenne dem først. Hun vant igjen.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder opp to fingre på venstre hånd, så lar han hånden falle og ler av seg selv.
   - Kulde: Svak knitring.
2. **Replikk:** «Rampenissen rapporterer: «Æ har laga snøengla på kjøkkenet. Det va ikkje snø.» Det var mel. Hjerterud sukket. Jeg lo så jeg måtte holde meg fast.»
   - Varighet: 15 s (25 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler høyt.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt sa Orakelet noe viktig: det som fryser linjen, tåler ikke lys. IQ hengte lys rundt hele antennen ved tjernet. Nå ligner den et juletre.»
   - Varighet: 15 s (26 ord)
   - Handling: Nikker mot juletreet til venstre og holder blikket der, smiler.
   - Kulde: Juletrelysene blafrer svakt ett sekund.
4. **Replikk:** «Og nå dagens ord, Håkon. Det barna bar mellom gårdene da det var som mørkest. Tenk godt etter nå.»
   - Varighet: 12 s (19 ord)
   - Handling: Løfter venstre hånd som om han bærer noe i en hank, og holder den slik hele segmentet.
   - Kulde: Svak knitring.
5. **Replikk:** «Barna bar ikke hva som helst. Ikke et bål. Ikke et stearinlys. Det med hank, som man kan henge fra seg. Ha en riktig fin søndag!»
   - Varighet: 15 s (26 ord)
   - Handling: Henger det usynlige på en usynlig krok med venstre hånd, så vinker han kort.
   - Kulde: Svak knitring, klikk.

## Dag 7 (ma) – Inntrengeren i Fryseren · KULDE · M2 Navnet

Kulde-nivå 2. Første dag med rim på innsiden av vinduet og langs bordkanten, synlig pust. Bildet fryser 1–2 s i segment 2 der han ellers ville sagt navnet. Segment 2 peker til tegnene på kortene (meta 1); Frostgraden er i segment 5.

1. **Replikk:** «Gooood morgen, Snøfall! Brrr. Jeg fryser på kontoret. Rim på innsiden av vinduet! Det har jeg aldri sett før. Hopp, dere, så dere blir varme.»
   - Varighet: 15 s (25 ord)
   - Handling: Gnir venstre hånd mot overarmen, ser over skulderen mot vinduet, så hopper han litt i stolen.
   - Kulde: Synlig pust, rim i vinduskantene.
2. **Replikk:** «I natt fanget Orakelet den som sender på åttifem. Den har et navn. Den kaller seg… ja. Orakelet skrev navnet med tegnene i hjørnet av kortene.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder et lite kort fra brevbunken i venstre hånd hele segmentet, stopper opp på «kaller seg», og peker til slutt i hjørnet av kortet.
   - Kulde: Bildet fryser helt i 1–2 s etter «kaller seg», lyden faller bort, så kommer begge tilbake.
3. **Replikk:** «Nord for polarsirkelen står ikke sola opp nå. Det heter mørketid. Men mørket er ikke ondt. Det er bare et sted varmen ikke har nådd ennå.»
   - Varighet: 15 s (26 ord)
   - Handling: Snakker rolig, legger venstre hånd flatt på boka og lar den ligge.
   - Kulde: Synlig pust, svak knitring.
4. **Replikk:** «Men hør nå. Navnet er det motsatte av det Hjerterud har i ovnen akkurat nå. Ikke bollene. Det som slår mot ansiktet når hun åpner ovnsdøra.»
   - Varighet: 15 s (26 ord)
   - Handling: Vifter venstre hånd foran ansiktet som fra ovnsvarme, smiler.
   - Kulde: Synlig pust, klikk.
5. **Replikk:** «Fra i dag viser Orakelet hvor kaldt det er på linjen. Vi kaller det Frostgraden. Hold på hverandre. Ha en riktig fin dag!»
   - Varighet: 14 s (23 ord)
   - Handling: Legger venstre hånd rundt trekoppen, nikker rolig.
   - Kulde: Synlig pust, klikk.

## Dag 8 (ti) – Floken i Verkstedet · KRETSKORT

Kulde-nivå 1. Rim på vinduet, synlig pust. Mikrofonen «sitter fast» i hånda hans hele klippet.

1. **Replikk:** «Gooooood morgen, Snøfall! Uke én er unnagjort, folkens. Bra jobbet! Og mikrofonen har fryst fast i hånda mi. Se. Den sitter.»
   - Varighet: 13 s (21 ord)
   - Handling: Rister mikrofonen i høyre hånd som for å få den løs, gir opp og ler.
   - Kulde: Rim på bordkanten, synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Æ har bygd et tårn av frokostblanding. Det hete Sigma-tårn.» Sigma. Jeg vet ikke hva det betyr. Han vet det nok ikke heller.»
   - Varighet: 15 s (26 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, holder det langt fra øynene, ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt satt han med loddebolten til morgenen. Han lager noe som skal holde det kalde ute av kanalene. Bare lamper med strøm lyser, sier han.»
   - Varighet: 15 s (26 ord)
   - Handling: Hever et øyenbryn, så knipser han med venstre hånd i luften som en bryter som slås av.
   - Kulde: Synlig pust.
4. **Replikk:** «Hør etter nå, for dette er det viktigste jeg sier i dag. Den lille grønne plata alle ledningene sitter fast på.»
   - Varighet: 13 s (21 ord)
   - Handling: Lener seg inn, former et lite rektangel med tommel og pekefinger på venstre hånd.
   - Kulde: Synlig pust.
5. **Replikk:** «IQ lodder på én, sover på én, og kaller den alltid det samme, med to ord i ett. Ha en riktig fin dag!»
   - Varighet: 14 s (23 ord)
   - Handling: Legger kinnet på venstre hånd som på en pute, ler.
   - Kulde: Svak knitring, klikk.

## Dag 9 (on) – Krystall-Matematikk · 24 · blått hjerte

Kulde-nivå 1. Rim, synlig pust, svak knitring. Morgensangen, andre forsøk, og denne gangen går den.

1. **Replikk:** «Gooood morgen, Snøfall! Niende desember, favorittdagen min. Og morgensangen, andre forsøk: God morgen, kopp. God morgen, bok. God morgen, Håkon, Hanna, Kristian. Og god morgen, Pil!»
   - Varighet: 15 s (26 ord)
   - Handling: Dirigerer med venstre pekefinger, nikker mot koppen, boka og døren der Pil sitter, fornøyd.
   - Kulde: Synlig pust.
2. **Replikk:** «Pil har sittet oppe hele natten og telt. Hvert snøkrystall har seks armer. Det kommer av hvordan vann fester seg til vann når det fryser.»
   - Varighet: 15 s (25 ord)
   - Handling: Sprer fingrene på venstre hånd og holder dem opp mot lampelyset.
   - Kulde: Rim på vinduet glitrer når han løfter hånden.
3. **Replikk:** «Hjerterud klappet for sangen. Én gang. Men i natt la Kulde falske krystaller inn i radaren vår, så Orakelet mistet tellingen.»
   - Varighet: 13 s (21 ord)
   - Handling: Bukker lett mot døren og ler, så legger han venstre hånd flatt på boka og blir alvorlig.
   - Kulde: Knitring, kort hopp i bildet.
4. **Replikk:** «Orakelet gikk på den. Jeg også, ærlig talt. Men så det viktigste: Pil telte armene tre ganger. Seks hver gang på de ekte.»
   - Varighet: 14 s (23 ord)
   - Handling: Ler av seg selv, så holder han opp fem fingre og tommelen på venstre hånd og teller dem én og én.
   - Kulde: Synlig pust.
5. **Replikk:** «De falske hadde feil tall, og de var lette å kjenne igjen når man først så etter. Tell nøye, dere. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord)
   - Handling: Banker lett på bordet med venstre hånd på «feil tall», smiler.
   - Kulde: Synlig pust, klikk.

## Dag 10 (to) – Fargene som Forsvant · SPEKTER · frost nivå 1

Kulde-nivå 3. Fargene renner ut av bildet i segment 3; segment 4 hakker i lyd og bilde, og Julius gjentar brikken. Appen viser klippet i svart-hvitt med fargeglimt.

1. **Replikk:** «Hallo? Hører dere meg? God morgen, Snøfall. Linjen er dårlig i dag. Jeg skal snakke langsomt, og jeg skal si det viktigste to ganger, i tilfelle.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder mikrofonen tett inntil munnen, banker på den med venstre pekefinger.
   - Kulde: Kraftig knitring, VHS-striper nederst i bildet.
2. **Replikk:** «Rødt og grønt. Vet dere hvorfor julen fikk akkurat de fargene? Kristtornen holder bladene grønne hele vinteren, og bærene er røde. Det eneste som lyste.»
   - Varighet: 15 s (25 ord)
   - Handling: Holder opp et brev med rød skrift mot juletreet med venstre hånd.
   - Kulde: Fargene blafrer, rødt og grønt forsterkes et øyeblikk.
3. **Replikk:** «I natt tok Kulde fargene. Fra linjen, fra Snøfall TV, og fra skjermen hjemme hos dere. Her er alt grått nå. Bare juletreet holder litt igjen.»
   - Varighet: 15 s (26 ord)
   - Handling: Ser seg rundt i rommet, ser ned på sin egen venstre hånd.
   - Kulde: Fargene renner ut av bildet ovenfra og ned mens han snakker; bare juletreet beholder litt rødt og grønt.
4. **Replikk:** «Alle fargene på rekke, slik regnbuen stiller dem opp. IQ har ett ord for hele rekka. Han sier det når han er stolt.»
   - Varighet: 14 s (23 ord)
   - Handling: Tegner en bue i luften med venstre hånd.
   - Kulde: Lyd og bilde hakker gjennom hele segmentet; enkeltord faller bort.
5. **Replikk:** «Slik regnbuen stiller dem opp. Ett ord for hele rekka. Hold ut, dere. Fargene kommer tilbake, det lover jeg. Ha en riktig fin dag, likevel.»
   - Varighet: 15 s (25 ord)
   - Handling: Tegner buen en gang til, langsommere, ser bestemt ut.
   - Kulde: Gjentakelsen kommer gjennom klarere, med svak knitring. Klikk.

## Dag 11 (fr) – Antenne-Krisen · 75 · bonus

Kulde-nivå 2 (senket fra 3, intensitetskurven). Kraftig knitring, bildet hopper, rim. Lyden faller ut i brøkdeler av sekunder. Fem segmenter: brikken i segment 4, kort avskjed i 5.

1. **Replikk:** «Ja… hallo? Er det liv i jernvaren? Gooood morgen, Snøfall! Nei, ikke mye i dag. Men vi prøver likevel, sånn som vi alltid gjør her oppe.»
   - Varighet: 15 s (26 ord)
   - Handling: Banker på mikrofonen med venstre pekefinger, rister den lett i høyre hånd.
   - Kulde: Knitring, lyden faller ut på «ikke mye».
2. **Replikk:** «Rampenissen rapporterer: «Æ har pakka mæ inn i folie. Som en bakt potet.» En potet! Hjerterud spurte om han var ferdigstekt. Jeg lo i ti minutter.»
   - Varighet: 15 s (26 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler lavt.
   - Kulde: Bildet hopper to ganger.
3. **Replikk:** «I natt delte Kulde senderen i tre. Antennen ved tjernet er full av is og står skjevt. Vi hører dere i biter. Men vi hører dere.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder opp tre fingre på venstre hånd, så lukker han dem langsomt og legger hånden på bordet.
   - Kulde: Knitring øker, striper over bildet.
4. **Replikk:** «Tre sendere, sa IQ, og alt han bygger ender på fem. Kulde satte ut sine egne. Ikke gang dem. Legg IQs sammen, så finner dere oss.»
   - Varighet: 15 s (26 ord)
   - Handling: Tre fingre på venstre hånd, så fem, så legger han hånden flat på bordet.
   - Kulde: Knitring, enkeltord faller bort.
5. **Replikk:** «Vi er her. Ha en riktig fin dag, dere tre.»
   - Varighet: 7 s (10 ord)
   - Handling: Legger venstre hånd flatt på bordet foran seg, ser rolig fram.
   - Kulde: Knitring, klikk som nesten drukner i støy.

## Dag 12 (lø) – Lydbølgene som Smelter Is · MELODI · grønn sol · M3

Kulde-nivå 2. Rim, synlig pust, bildet fryser 1–2 s i segment 3.

1. **Replikk:** «Goooood morgen, Snøfall! Jeg skal fortelle dere noe i dag som jeg ikke trodde på i går. Det skjer ikke ofte, spør Hjerterud.»
   - Varighet: 14 s (23 ord)
   - Handling: Sitter rolig, legger venstre hånd på bordet.
   - Kulde: Synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Æ har laga ei lydbølge. Av dorull. Heile kjøkkenet.» En hel rull, folkens. Jeg lo så trekoppen hoppet. Hjerterud lo ikke.»
   - Varighet: 14 s (24 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt gikk Hjerterud ned til slusen. Hun nynnet. Isen sprakk. Noe inni svarte. Rampenissen hørte det først. Jeg trodde ham ikke. Én null til ham.»
   - Varighet: 15 s (26 ord)
   - Handling: Ser ned, stryker seg over skjegget med venstre hånd, litt flau, så ler han.
   - Kulde: Bildet fryser 1–2 s på «sprakk».
4. **Replikk:** «Nå kommer det viktigste, og det er til deg, Håkon. Hjerterud nynnet tre toner ved slusen, den dypeste først. Ingen ord.»
   - Varighet: 13 s (21 ord)
   - Handling: Holder venstre hånd lavt, så litt høyere, så høyest, som tre trappetrinn.
   - Kulde: Synlig pust.
5. **Replikk:** «Bare det tonene lager når de kommer etter hverandre. Isen kjente det igjen. Syng litt i dag. Ha en riktig fin helg, dere!»
   - Varighet: 14 s (23 ord)
   - Handling: Nynner tre toner uten ord, lavest først, ler.
   - Kulde: Synlig pust, klikk.

## Dag 13 (sø) – Luciadagens Gylne Krydder · SAFRAN · 3. advent

Kulde-nivå 1. Rim, synlig pust, svak knitring.

1. **Replikk:** «Gooood Lucia-morgen, Snøfall! Tredje lys i dag, og det trettende i måneden. To ting på én dag, favorittdagen min. Hjerterud har bakt siden fire.»
   - Varighet: 14 s (24 ord)
   - Handling: Holder opp tre fingre på venstre hånd, så snuser han i luften og smiler.
   - Kulde: Synlig pust.
2. **Replikk:** «Rapport fra Rampenissen: «Æ har spist elleve lussekatta. Æ e død no. Kosedyra sørge.» Død! Av boller. Jeg har vært nær selv. Hjerterud teller mine.»
   - Varighet: 15 s (25 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler rungende.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt sto Kulde og så på Lucia-lysene gjennom linjen. Lenge. Den tok ingenting. Den bare så. Jeg vet ikke hva jeg skal mene om det.»
   - Varighet: 15 s (26 ord)
   - Handling: Blir stille, ser mot vinduet, snur seg sakte tilbake.
   - Kulde: Rimen på vinduet vokser litt mens han snakker.
4. **Replikk:** «Og så det Hjerterud ikke vil jeg skal si. Det gule i bollene er krydderet fra en krokus. Tre tråder per blomst, plukket for hånd.»
   - Varighet: 15 s (25 ord)
   - Handling: Ser seg over skulderen mot døren, senker stemmen, gnir tommel mot pekefinger på venstre hånd.
   - Kulde: Synlig pust.
5. **Replikk:** «Derfor koster det mer enn gull, og derfor låser Hjerterud det inn. God tredje advent, dere tre. Ha en riktig fin dag!»
   - Varighet: 13 s (22 ord)
   - Handling: Later som han vrir om en nøkkel med venstre hånd, smiler.
   - Kulde: Synlig pust, klikk.

## Dag 14 (ma) – Hemmeligheten i Papirvingene · ORIGAMI

Kulde-nivå 1, uke 3: mikrofonen faller ut med et klikk i starten. Den blå fuglen sitter i vinduskarmen bak Julius i segment 3.

1. **Replikk:** «Ja, hallo? Mikrofonen falt ut. Der, ja. Gooood morgen, Snøfall! Kabelen er eldre enn meg, og like sta. Rull med skuldrene, dere. Det er mandag.»
   - Varighet: 15 s (25 ord)
   - Handling: Rykker i mikrofonkabelen med venstre hånd, så ruller han med skuldrene og stønner.
   - Kulde: Lyden er borte det første sekundet, klikk, så kommer stemmen.
2. **Replikk:** «Det første brevet til Snøfall kom i en flaske fra Bergen, i attenhundreogåttisju. En gutt ba om en sparkstøtting. Det tok tre vintre å finne ham.»
   - Varighet: 15 s (26 ord)
   - Handling: Løfter et gulnet brev fra bunken med venstre hånd og holder det mot lampen.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt åpnet Winter brevfuglene. Det kom én fugl ingen hadde sendt. Blå. Den sitter i vinduskarmen min nå, med et brev fryst fast til vingen.»
   - Varighet: 15 s (26 ord)
   - Handling: Snur seg mot vinduet, der en liten blå fugl sitter stille i karmen.
   - Kulde: Rim rundt fuglen, ett juletrelys slukner.
4. **Replikk:** «Nå kommer det, Kristian. Winter har ett ord for å gi et flatt ark vinger uten saks og lim, bare ved å bøye det.»
   - Varighet: 14 s (24 ord)
   - Handling: Bøyer et brev fra bunken to ganger med venstre hånd, holder det opp som en fugl.
   - Kulde: Svak knitring.
5. **Replikk:** «Han uttaler det feil med vilje, så ingen på linjen skal forstå. Vær snille med fuglen. Ha en riktig fin dag!»
   - Varighet: 13 s (21 ord)
   - Handling: Legger brevet forsiktig ned, nikker mot vinduet.
   - Kulde: Svak knitring, klikk.

## Dag 15 (ti) – Fargesamlerens Notatbok · KARAMELL · rød sol · M4

Kulde-nivå 1. Lampen flakker svakt, ett juletrelys slukner. Julius er stillere og langsommere enn ellers. Bare en stille morgenhilsen, ingen tull; dagen bærer avsløringen.

1. **Replikk:** «God morgen, Snøfall. Jeg skal være kort i dag. Det har vært en lang natt her oppe, og ingen av oss har sovet noe særlig.»
   - Varighet: 15 s (25 ord)
   - Handling: Sitter tyngre i stolen enn vanlig, venstre hånd hviler på den åpne boka.
   - Kulde: Lampen flakker én gang.
2. **Replikk:** «Fargesamleren samlet de første iskrystallene i Snøfall. Han ba IQ bygge noe som kunne holde dem kalde for alltid, i grotten under Nordtoppen.»
   - Varighet: 14 s (23 ord)
   - Handling: Stryker langsomt over siden i boka med venstre hånd, blar ikke.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt fant IQ notatboken. Det han bygde, heter Vintervokteren. Det sender på åttifem. Da strømmen røk i fjor, ble det stående alene i mørket.»
   - Varighet: 15 s (25 ord)
   - Handling: Lar venstre hånd ligge stille på boka, ser lenge ned på den.
   - Kulde: Ett juletrelys slukner på «alene».
4. **Replikk:** «Hjerterud prøvde å varme opp IQ med det hun lager når sukker blir brunt og varmt i gryta, og som stivner til gull når det kjølner.»
   - Varighet: 15 s (26 ord)
   - Handling: Rører i en usynlig gryte med venstre hånd, så lar han hånden falle.
   - Kulde: Lampen flakker, klikk.
5. **Replikk:** «Han spiste ikke engang det. Vær snille med hverandre i dag. Og med IQ, hvis dere tenker på ham. Ha en fin dag, dere.»
   - Varighet: 14 s (24 ord)
   - Handling: Legger venstre hånd rundt trekoppen, ser ned, så opp igjen.
   - Kulde: Lampen flakker, klikk.

## Dag 16 (on) – Pakkesentralen i Spinn · SORTERING · bonus

Kulde-nivå 2. Lampen flakker, mikrofonen faller ut et øyeblikk i segment 3, bildet fryser 1–2 s. Morgensangen, tredje forsøk, stoppes av lampen.

1. **Replikk:** «Gooood morgen, Snøfall! Morgensangen, tredje forsøk: God morgen, kopp. God morgen, bok. God morgen, lampe… nei, nå flakker den. Hold ut, lampe. Vi tar sangen senere.»
   - Varighet: 15 s (26 ord)
   - Handling: Dirigerer med venstre pekefinger, ser opp mot vegglampen, banker lett på veggen under den.
   - Kulde: Lampen flakker to ganger, akkurat på «lampe».
2. **Replikk:** «Kristian, har du vært våken en hel natt? Jeg skal prøve i natt. Orakelet vil at jeg står i vinduet. Jeg sier ikke mer.»
   - Varighet: 14 s (24 ord)
   - Handling: Nikker mot vinduet bak seg, legger venstre pekefinger over munnen.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt snudde Vintervokteren samlebåndet. Alt ligger i én haug. Ikke for å ødelegge. Det er det eneste som får Winter til å se opp.»
   - Varighet: 15 s (25 ord)
   - Handling: Snurrer venstre hånd baklengs, stopper, ser tankefull ut.
   - Kulde: Mikrofonen faller ut et halvt sekund på «haug», bildet fryser 1–2 s etterpå.
4. **Replikk:** «Winters ord for å legge alt i riktig hylle. Han sier det med stor S og har et skilt med det over døra.»
   - Varighet: 14 s (23 ord)
   - Handling: Tegner en stor S i luften med venstre hånd, peker over sin egen dør.
   - Kulde: Lampen flakker.
5. **Replikk:** «Ha en riktig fin dag, alle sammen!»
   - Varighet: 6 s (7 ord)
   - Handling: Smiler, vinker kort med venstre hånd.
   - Kulde: Lampen flakker, klikk.

## Dag 17 (to) – Grønt over Polarhimmelen · NORDLYS

Kulde-nivå 1. Ett juletrelys slukner, svak knitring. Ingen omtale av lykten på Landås (betinget innhold, bare i PS).

1. **Replikk:** «Goooood morgen, Snøfall… unnskyld, jeg gjesper. Jeg har stått i vinduet hele natten. Gjesp med meg, dere. Sånn. Jeg står der i natt også.»
   - Varighet: 14 s (24 ord)
   - Handling: Gjesper stort med venstre hånd foran munnen, setter seg til rette.
   - Kulde: Svak knitring.
2. **Replikk:** «Rapport fra Rampenissen: «Æ e kidnappa. Av kosedyra. Dem vil ha alle pepperkakan.» Et løsepengebrev! Jeg leste det tre ganger. Jeg hadde gitt dem pepperkakene.»
   - Varighet: 15 s (25 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og ler gjennom gjespen.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt kom det grønt over fjellet, rett over lyktene ved antennen. Orakelet sier det var et svar på lyktene. Men på hvilken, vet vi ikke.»
   - Varighet: 15 s (26 ord)
   - Handling: Snur seg mot vinduet; et svakt grønt skjær ligger over snøen utenfor.
   - Kulde: Ett juletrelys slukner, men vinduet lyser svakt grønt.
4. **Replikk:** «Og så det siste, det jeg vil at dere skal huske fra i dag. Det man kan høre på himmelen, sa de gamle.»
   - Varighet: 14 s (23 ord)
   - Handling: Holder venstre hånd bak øret, lukker øynene et øyeblikk.
   - Kulde: Svak knitring.
5. **Replikk:** «Nissene sier det er himmelen som sender brev tilbake: grønt, bølgende, over fjellene, og bare når det er mørkt nok. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord)
   - Handling: Lar venstre hånd bølge langsomt over hodet, så ned på bordet.
   - Kulde: Svak knitring, klikk.

## Dag 18 (fr) – Kastevind rundt Ulriken · TURBULENS · blå sol

Kulde-nivå 2. Lampen flakker, to juletrelys slukner, bildet fryser 1–2 s i segment 3.

1. **Replikk:** «Gooood morgen, Snøfall! Fredag! Rist på dere, sånn som sleden gjorde i natt. Trixter har ikke sovet. Rampenissen heller ikke, men av en annen grunn.»
   - Varighet: 15 s (25 ord)
   - Handling: Rister på hele overkroppen med venstre hånd i været, ler, ser mot døren og rister på hodet.
   - Kulde: Lampen flakker.
2. **Replikk:** «Trixter har hjelm på ved frokosten. Ikke på grunn av sleden. På grunn av Rampenissen. Kristian, spiser du frokost med hjelm? Jeg prøvde. Hjerterud lo.»
   - Varighet: 15 s (25 ord)
   - Handling: Banker seg lett i hodet med venstre hånd, ler.
   - Kulde: Svak knitring.
3. **Replikk:** «I natt testet Trixter ruten over Nordtoppen i det verste været vi har hatt. Rundt Ulriken ristet sleden så pakkene hoppet. Rampenissen satt bakpå.»
   - Varighet: 14 s (24 ord)
   - Handling: Rister venstre hånd i luften, ler.
   - Kulde: Bildet fryser 1–2 s midt i «ristet», to juletrelys slukner.
4. **Replikk:** «Når lufta får sleden til å hoppe og riste uten at noen ser hvorfor, har Trixter ett ord for det. Han sier det med sammenbitte tenner.»
   - Varighet: 15 s (26 ord)
   - Handling: Rister venstre hånd i luften, så biter han tennene sammen og knurrer ordløst.
   - Kulde: Lampen flakker.
5. **Replikk:** «Han sier aldri igjen, Rampenissen. Det sa han i fjor også. Hold dere fast, dere tre. Ha en riktig fin fredag!»
   - Varighet: 13 s (21 ord)
   - Handling: Ler, griper tak i bordkanten med venstre hånd.
   - Kulde: Lampen flakker, klikk.

## Dag 19 (lø) – Eksplosjon i Fôringsautomaten · GULROT · pusterom

Kulde-nivå 0. Helt rent bilde og ren lyd for første gang siden dag 1. Barna skal merke stillheten.

1. **Replikk:** «Gooood morgen, Snøfall. Hysj. Hører dere det? Ingenting knitrer. Det er første gang siden første desember. Jeg har sittet her og bare lyttet en stund.»
   - Varighet: 15 s (25 ord)
   - Handling: Holder mikrofonen stille, lytter, så banker han forsiktig på den med venstre pekefinger og smiler bredt.
   - Kulde: Ingen. Lyden er ren.
2. **Replikk:** «Hanna, kan du være helt stille i tre sekunder? Én. To. Tre. Der. Nå har du vært stillere enn Rampenissen har vært hele desember.»
   - Varighet: 14 s (24 ord)
   - Handling: Holder opp én, to, tre fingre på venstre hånd, langsomt, så smiler han bredt.
   - Kulde: Ingen.
3. **Replikk:** «I natt var det stille der nede under fjellet. Grønt over Nordtoppen to netter på rad. Orakelet teller lys på Landås-siden. Flere enn i fjor.»
   - Varighet: 15 s (25 ord)
   - Handling: Nikker rolig, peker ut av vinduet mot lysene i landsbyen med venstre hånd.
   - Kulde: Ingen.
4. **Replikk:** «IQ bygde en automat. Den eksploderte. Det oransje drivstoffet Rudolf vil ha før hver tur, og som IQ nå har førti for lite av.»
   - Varighet: 14 s (24 ord)
   - Handling: Slår ut med venstre hånd på «eksploderte» og ler, så peker han opp.
   - Kulde: Ingen.
5. **Replikk:** «Det vokser med toppen opp og resten nede i jorda. Pust ut, dere tre. I morgen trenger jeg dere uthvilt. Ha en riktig fin dag!»
   - Varighet: 15 s (25 ord)
   - Handling: Peker ned under bordet med venstre hånd, lener seg tilbake, puster synlig ut.
   - Kulde: Ingen. Klikk.

## Dag 20 (sø) – Sofa-Sleden · TURBO · grønn måne · 4. advent · varselet

Kulde-nivå 2. Bildet flimrer oftere enn før, juletrelysene slukner ett og ett gjennom klippet. Brikken kommer i segment 3; varselet om i morgen og en rolig avskjed er siste segment (som i gåtedokumentet). Ingen tull i dag; stemmen er rolig og nær.

1. **Replikk:** «God morgen, Snøfall. Fjerde lys. Det første er håp. Det andre fred. Det tredje glede. Det fjerde kjærlighet. Hjerterud sier man ikke kan hoppe over noen.»
   - Varighet: 15 s (26 ord)
   - Handling: Teller fire lys med fingrene på venstre hånd, ett om gangen, langsomt.
   - Kulde: Bildet flimrer, ett juletrelys slukner.
2. **Replikk:** «Orakelet målte åttiåtte prosent i natt. I morgen, den mørkeste dagen, når Kulde huset deres. Ikke for å skade. Det er bare der lyset er.»
   - Varighet: 15 s (25 ord)
   - Handling: Lener seg nærmere mikrofonen, snakker lavt og rolig.
   - Kulde: Flimring, enda et juletrelys slukner.
3. **Replikk:** «Men først dagens ord fra verkstedet. IQ ga sledemotoren det samme som biler får når de skal forbi noen i bakken.»
   - Varighet: 13 s (21 ord)
   - Handling: Retter seg opp, peker mot taket der verkstedet er, med venstre hånd.
   - Kulde: Flimring.
4. **Replikk:** «Han sier det med armene, og motoren hviner når han sier det. IQ bygger en mur av varme rundt linjen, så det er noe å dele.»
   - Varighet: 15 s (26 ord)
   - Handling: Strekker venstre arm rett fram som IQ, så tegner han en firkant på bordet med fingeren.
   - Kulde: Flimring, enda et juletrelys slukner.
5. **Replikk:** «Jeg har bedt om én port. Den står der jeg tegnet sirkelen på Trixters kart.»
   - Varighet: 10 s (15 ord)
   - Handling: Tegner en liten sirkel på bordet med venstre pekefinger.
   - Kulde: Flimring.
6. **Replikk:** «I morgen trenger dere bare å være hjemme. Ha en rolig dag, dere tre.»
   - Varighet: 9 s (14 ord)
   - Handling: Legger venstre hånd flatt på bordet, ser rolig fram.
   - Kulde: Tredje juletrelys slukner, men lampen står. Klikk.

## Dag 21 (ma) – Vintersolverv · BRANNMUR · M5 Muren og porten · frost nivå 2

Kulde-nivå 3 i segment 1–2 (nesten frosset bilde, rim over hele vinduet, lyd og bilde hakker), renser seg i segment 3 og er 0 i segment 4. Muren holder. Ingen tull i dag.

1. **Replikk:** «Vintersolverv i dag, den korteste dagen. I gamle dager het det jól. Folk tente bål den mørkeste natten, for de visste at lyset snur i morgen.»
   - Varighet: 15 s (26 ord)
   - Handling: Sitter nesten urørlig, venstre hånd flat på bordet, pusten står som røyk, stemmen er rolig.
   - Kulde: Nesten frosset bilde, rim over hele vinduet, lyden hakker i korte biter.
2. **Replikk:** «I natt nådde Kulde huset deres, og IQ bygde muren. En mur er ikke mot noen. Den holder varmen inne, så det er noe å dele.»
   - Varighet: 15 s (26 ord)
   - Handling: Legger venstre hånd rundt trekoppen som for å holde på varmen.
   - Kulde: Bildet fryser 1–2 s på «muren», så fortsetter det hakkende.
3. **Replikk:** «Derfor ba jeg om en port, og det kommer jeg tilbake til. Hør nå. IQ bygde en vegg av varme rundt linjen.»
   - Varighet: 13 s (22 ord)
   - Handling: Tegner en linje over bordet med venstre håndkant.
   - Kulde: Hakkingen avtar; bildet står nesten stille, men lyden er klar.
4. **Replikk:** «De som kjemper mot flammene i skogen, bygger det samme, bare av det motsatte, og kaller den etter det de kjemper mot.»
   - Varighet: 13 s (22 ord)
   - Handling: Peker på linjen han tegnet, holder blikket der.
   - Kulde: Bildet renser seg ord for ord; på siste ord er det helt rent.
5. **Replikk:** «Jeg lot ham la én port stå åpen. Inn mot grotten. Med varme i. Kom hjem i kveld, dere tre. Vi er her.»
   - Varighet: 14 s (23 ord)
   - Handling: Åpner en liten glipe i linjen med to fingre på venstre hånd, ser opp og smiler.
   - Kulde: Ingen. Rent bilde og ren lyd.

## Dag 22 (ti) – Winters Tall · LANDÅS · rød måne · Snill-listen

Kulde-nivå 0. Rent bilde og ren lyd. Rimen på vinduet er borte, bare dugg i hjørnene.

1. **Replikk:** «Gooooood morgen, Snøfall! Folk tror Snill-listen handler om å være lydig. Det gjør den ikke. Snill er å se noen som står utenfor, og gå bort.»
   - Varighet: 15 s (26 ord)
   - Handling: Legger venstre hånd på den store boka, blar til en tom side.
   - Kulde: Ingen.
2. **Replikk:** «I natt kom ingenting gjennom porten ennå. Men Orakelet sier det er varmere der nede. Og Winter maser: han trenger stedet i tall, ikke i ord.»
   - Varighet: 15 s (26 ord)
   - Handling: Holder opp et brev med rød skrift og tall på med venstre hånd, rister lett på det.
   - Kulde: Ingen.
3. **Replikk:** «Han stoler ikke på ord, Winter. Hør godt etter nå, Kristian. Winter skriver tall i stedet for bokstaver når noe er viktig.»
   - Varighet: 13 s (22 ord)
   - Handling: Holder brevet med tall på opp mot lampen, så peker han rett fram.
   - Kulde: Ingen.
4. **Replikk:** «Her kommer regelen. A er alltid først, og så følger resten, helt til de tre siste som bare vi i nord har.»
   - Varighet: 13 s (22 ord)
   - Handling: Skriver i luften med venstre hånd, teller videre med fingeren bortover bordet.
   - Kulde: Ingen.
5. **Replikk:** «Og han legger alltid tre til hvert tall, for sikkerhets skyld. Trekk dem fra. Skriv navnene deres pent etterpå. Ha en riktig fin dag!»
   - Varighet: 14 s (24 ord)
   - Handling: Smiler, legger fra seg brevet med venstre hånd og vinker kort.
   - Kulde: Ingen.

## Dag 23 (on) – Nattevakt · STJERNEKLART · blå måne · sannheten

Kulde-nivå 0. Rent. Lys siver ned gjennom vinduet, mer enn vanlig.

1. **Replikk:** «God morgen, Snøfall. Lille julaften. Rampenissen rapporterer: «Æ har bare kikka litt på en pakke.» Litt! Teipen var tom etterpå. Jeg kjenner meg igjen.»
   - Varighet: 14 s (24 ord)
   - Handling: Tar opp et ark fra brevbunken med venstre hånd, leser, og smiler skjevt.
   - Kulde: Ingen.
2. **Replikk:** «I natt så Orakelet ned i grotten. Det som er der nede, har ventet på lys i ett år. Nå flyr vi over det.»
   - Varighet: 14 s (24 ord)
   - Handling: Lener seg inn mot mikrofonen, rolig og bestemt.
   - Kulde: Ingen.
3. **Replikk:** «Lavt, med alle lysene på. Trixter pakker sleden mens vi snakker. Og så flyværet. Orakelet meldte flyværet i ett ord. Ikke en sky, ikke én.»
   - Varighet: 15 s (25 ord)
   - Handling: Senker venstre hånd flatt over bordet som en slede, så ser han opp mot taket.
   - Kulde: Ingen.
4. **Replikk:** «Været har et ord for en natt der alt som blinker der oppe er synlig hele veien, og det ordet begynner med det som blinker.»
   - Varighet: 15 s (25 ord)
   - Handling: Blunker med fingrene på venstre hånd mot taket, så legger han hånden rolig på bordet.
   - Kulde: Ingen.
5. **Replikk:** «I morgen er det jul, og da skal jeg fortelle dere det siste. Ha en riktig fin dag, dere tre, og sov godt.»
   - Varighet: 14 s (23 ord)
   - Handling: Smiler, legger venstre hånd rundt trekoppen uten hast.
   - Kulde: Ingen. Klikk.

## Dag 24 (to) – God Jul på Landås · JULEMAGI · M6 Tøvær

Kulde-nivå 0. Alt virker. Rommet er varmere enn noen gang: alle juletrelys tent, mer gull i lyset, dampen fra trekoppen. Julius smiler hele veien. Seks segmenter: morgensangen går hele veien for første gang.

1. **Replikk:** «Gooooooood morgen, Snøfall, og god jul! Morgensangen, hele veien: God morgen, kopp. God morgen, bok. God morgen, Kristian, Håkon, Hanna. God morgen, Landås. Den satt!»
   - Varighet: 15 s (25 ord)
   - Handling: Dirigerer med venstre pekefinger, nikker til koppen og boka, så mot vinduet, og ler høyt og lykkelig.
   - Kulde: Ingen. Alle lys tent.
2. **Replikk:** «Alt virker. Hele kontoret er varmt. Vi feirer ikke fordi alt er perfekt, men fordi det er fred i huset.»
   - Varighet: 12 s (20 ord)
   - Handling: Slår ut med venstre arm mot rommet, så legger han hånden på trekoppen.
   - Kulde: Ingen.
3. **Replikk:** «I natt fløy sleden over grotten med alle lysene på. Isen tiner. Den blå fuglen fløy hjem med brevet sitt. Og Vintervokteren sendte noe med Trixter.»
   - Varighet: 15 s (26 ord)
   - Handling: Nikker mot vinduskarmen, som nå er tom. Peker ut av bildet med venstre hånd, mot dem.
   - Kulde: Ingen.
4. **Replikk:** «Til dere. Dere har laget noe hele desember uten å vite det. Ikke koden, den tastet dere. Ikke varmen, den kom fra ovnen.»
   - Varighet: 14 s (23 ord)
   - Handling: Peker ut av bildet med venstre hånd, mot dem. Rister rolig på hodet to ganger.
   - Kulde: Ingen.
5. **Replikk:** «Hør nå godt etter, alle tre. Det trollmenn later som de har, og som dere faktisk har hatt: tre søsken som holder sammen i mørket.»
   - Varighet: 15 s (25 ord)
   - Handling: Holder opp tre fingre på venstre hånd og lukker dem langsomt til en knyttneve.
   - Kulde: Ingen.
6. **Replikk:** «Og Hjerterud setter alltid navnet på høytiden foran ordet, slik hun gjør med grøten og treet. God jul, dere tre. Ha en riktig fin julaften!»
   - Varighet: 15 s (25 ord)
   - Handling: Lener seg tilbake, lykkelig, løfter trekoppen med venstre hånd som en skål.
   - Kulde: Ingen. Ingen klikk; bildet toner ut i gull.

---

## Sjekktabell

Ord = talte ord i alle segmenter. Tale = ord / 2,0 (målt tempo for videomodellen). Klipp = sum av segmentvarigheter (ord/2 rundet opp + 2 s pause per klipp, maks 15). Brikke S-andel = hvor mye av koden videoen gir alene. Alle brikker er kopiert ordrett fra `gaater-2026.md`; der brikken er lengre enn 26 ord, er den delt i to segmenter ved setningsgrense, uten endret ordlyd.

| Dag | Kode         | Ord | Tale s | Klipp s | Segm. | Lengste | Brikke S-andel                     | Merknad                                                               |
| --- | ------------ | --- | ------ | ------- | ----- | ------- | ---------------------------------- | --------------------------------------------------------------------- |
| 1   | SIGNAL       | 149 | 74     | 88      | 6     | 26      | 0 % (bruk, ingen bokstaver)        | Omskrevet 11. nov (flyt, seks segm.); 85,0-hale i appen, ikke i filen |
| 2   | 48           | 118 | 59     | 70      | 5     | 26      | regel, ingen tall                  | Morgensangen første gang (skjærer seg)                                |
| 3   | PRISME       | 123 | 62     | 73      | 5     | 26      | 0 %                                | Låst brikke delt over segm. 4–5                                       |
| 4   | KOMPASS      | 125 | 62     | 74      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5), video regenereres               |
| 5   | ULRIKEN      | 117 | 58     | 70      | 5     | 26      | nøkkel som oppslag (dag 2)         | Segm. 4 ny: «like mange som sikringer onsdag»                         |
| 6   | LYKT         | 122 | 61     | 72      | 5     | 26      | 0 % (velger figur)                 |                                                                       |
| 7   | KULDE        | 126 | 63     | 74      | 5     | 26      | 0 % + peker til tavla              | Bildet fryser der navnet skulle vært sagt; segm. 3 og 5 nye           |
| 8   | KRETSKORT    | 117 | 58     | 70      | 5     | 26      | 0 % + regel om strøm               | Låst brikke delt over segm. 4–5; segm. 3 ny; mikrofonen sitter fast   |
| 9   | 24           | 120 | 60     | 72      | 5     | 26      | armer (6), ikke antall, ikke regel | Låst brikke delt over segm. 4–5; morgensangen andre gang (går)        |
| 10  | SPEKTER      | 125 | 62     | 74      | 5     | 26      | 0 %                                | Brikken gjentas i segm. 5 pga. hakking (låst)                         |
| 11  | 75           | 114 | 57     | 67      | 5     | 26      | to regler, ingen tall              | Segm. 4 ny («ender på fem»), segm. 5 nytt                             |
| 12  | MELODI       | 117 | 58     | 70      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 13  | SAFRAN       | 122 | 61     | 72      | 5     | 26      | 0 %                                | Låst brikke delt over segm. 4–5                                       |
| 14  | ORIGAMI      | 122 | 61     | 72      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 15  | KARAMELL     | 123 | 62     | 73      | 5     | 26      | 0 %                                | Låst brikke er 26 ord alene; «Han spiste ikke engang det» i segm. 5   |
| 16  | SORTERING    | 105 | 52     | 64      | 5     | 26      | 0 %                                | Brikken sier «stor S» (låst); morgensangen tredje gang (lampen)       |
| 17  | NORDLYS      | 123 | 62     | 73      | 5     | 26      | 0 %                                | Låst brikke delt over segm. 4–5; «i nord» (låst)                      |
| 18  | TURBULENS    | 121 | 60     | 72      | 5     | 26      | 0 %                                | Brikke omskrevet 10. nov (segm. 4–5)                                  |
| 19  | GULROT       | 123 | 62     | 73      | 5     | 25      | 0 %                                | Kulde 0; brikke delt over segm. 4–5                                   |
| 20  | TURBO        | 127 | 64     | 77      | 6     | 26      | 0 %                                | Brikke i segm. 3–4; segm. 5 ny: porten = sirkelen på kartet           |
| 21  | BRANNMUR     | 119 | 60     | 70      | 5     | 26      | 0 %                                | Brikke strammet 10. nov; delt over segm. 3–4                          |
| 22  | LANDÅS       | 120 | 60     | 70      | 5     | 26      | to regler, ingen tall              | Låst brikke (43 ord) delt over segm. 3–5                              |
| 23  | STJERNEKLART | 121 | 60     | 72      | 5     | 25      | 0 %                                | Låst brikke delt over segm. 3–4                                       |
| 24  | JULEMAGI     | 144 | 72     | 86      | 6     | 26      | 0 %                                | Låst brikke (50 ord) delt over segm. 4–6; morgensangen går hele veien |

Sum: 2 943 ord, snitt 123 per dag (cirka 60 s tale, 70 s med klippause). Ingen segmenter over 26 ord; alle klipp 13–15 s.

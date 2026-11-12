# Rampenissen på Morgenrådet 2026 – radioklipp

**Status: LÅST 10. november 2026 (steg 2).** Endringer krever eksplisitt ja fra Hans. Kjør `python3 scripts/manus-check.py` etter endringer. Klippene ble satt om til nordlandsk 10. november 2026 (etter ja fra Hans); innholdet er uendret. Endret etter ja fra Hans 10. november. Kontinuitet rettet 11. november etter ja fra Hans. Strek-linjene dag 13 og 20 endret 13.11 etter ja fra Hans. Flyt rettet 11. november (dag 6 strek/instrument, 9 kortet, 12 tidsanker, 13 «død. Nesten.», 15 skåla, 23 tempus) etter ja fra Hans. Klargjort for TTS 11. november etter ja fra Hans: lengde og bekreftelser (dag 6, 14, 15, 24), tallet i dag 8, Hanna i dag 21, apokope (7, 16, 17, 18, 22), dag 23 tempus. Dag 24 skrevet om 11. november etter ja fra Hans: sendt fra Snøfall etter hjemkomsten, hilsener fra de andre, rapporten levert (se `docs/beslutninger.md`). Utvidet 12. november etter ja fra Hans: dag 1 er sesongåpning (60–75 s), dag 24 litt lengre (50–65 s), Birk og Lyng får introduksjon og reaksjon dag 1 og 24 og én reaksjonslinje (`reaksjon_hint`) på utvalgte dager, og førsesongen 24.–30. november står nederst. Lyd for dag 1 og 24 må lages på nytt; Hans leser teksten først. `rampestrek_hint` og `utfordring_hint` for alle 24 dager lagt til 13.11 etter ja fra Hans. Rampestrekene samlet til én kilde 13.11 etter ja fra Hans: teksten skrives fra `historie-2026.md` §8 og §8.1 av `scripts/oppdrag-innhold.py`.

Steg 2. Kilder (låst): `docs/historie-2026.md` (§3.3, §4, §8), `docs/storyboard-2026.md` (§2 kunnskapstidslinje, §3 radiolinjer), `docs/gaater-2026.md`. Format: `varden-morgenradet.md`.

## Skrivemåte

Klippene («Klipp:») er skrevet på nordlandsk, Bodø/Salten-varianten, fordi stemmen (Gemini Fenrir, +4 halvtoner, nordnorsk aksent) skal høres naturlig ut. Alt annet i fila er bokmål: `Strek:`, `Lydregi:`, `intro_hint`, `reaksjon_hint`, `rampestrek_hint` og `utfordring_hint` (forslag til Varden) og sjekktabellen. Innholdet er det samme som i bokmålsversjonen: samme vitser, samme fakta, samme bekreftelser i samme rekkefølge, ingen nye hint og ingen koder. Reglene:

- Pronomen: æ, mæ, dæ, sæ, han/ho, vi/oss, dokker/dokkers (dere/deres), dem (de/dem; også «dem kalde fingran»), en (man; «da pusse en tenna»). Eiendom gjerne etterstilt: «skjermen dokkers», «pappa si jakkelomme».
- Nekting: ikkje. Spørreord: ka, kor, kem, kossen, koffer (hvorfor). Vilkår: vess (hvis).
- Småverb: e (er), va (var), ska (skal), kjem (kommer), sei (sier), veit (vet), trur (tror), såg (så), blei (ble), gjord (gjorde), ligg/sitt/står/hold (ligger/sitter/står/holder). Presens av svake verb uten -r: snakke, hjelpe, lytte, stole.
- Apokope der det er naturlig: infinitiv (å sov, å lag, å kast, å snakk, å bygg) og fortid på -te/-de blir -t/-d (prøvd, tenkt, trengt, hørt, bakt; dag 1–5 har noen former på -te, siden lyden allerede er laget). Fortid på -et blir -a (landa, rydda, dansa, pakka).
- Endinger: hunkjønn bestemt -a (stua, lua, linja, antenna, nesa, grotta); hankjønn og hunkjønn bestemt flertall -an (bamsan, fargan, lysan, føttan), intetkjønn bestemt flertall -a (kosedyra, beina, tenna); ubestemt flertall -a (sikringa, bolla, ganga); ord på -er får -ern (kaffetraktern). Gradbøying -are/-aste (høgare, viktigaste).
- Andre faste ord: no (nå), nåkka (noe), nån (noen), heile/heilt, heim/heime, meir, høgt, kvit, sjøl, sia (siden), aleina, morra (morgen, «i morra»), bestandig, spring (løper), golvet.
- Partikler, sparsomt og høyst én per klipp: «sjø», «ja, sjø», «herregud», «ka du sei». «Itte» brukes ikke; Bodø sier ikkje.
- Beholdes i fast form: navn og steder (Snøfall, Landås, Bergen, Ulriken, Nordtoppen, IQ, Pil, Winter, Trixter, Rudolf, Hjerterud, Julius, Orakelet, Kulde), «Kanal to», «KUN FOR SIGMAS», «seks sju», «sigma», «Over», «Over og ut», «bra jobba», «folkens», sitater med guillemets, og alle ord sjekktabellen under knytter til gåtene (dag 4 «en pil. Av nåkka.», dag 7 «Det som skurre, e kaldt», dag 21 «bokmuren»/«muren», dag 22 uten stedsnavn). Ingen lydskrift ut over dette; ordene skal være lesbare for Hanna (5), Håkon (9) og Kristian (12), som bor i Bergen.
- Klippene bærer ingen ledetråder (se «Slik brukes klippene»); linjene som er låst fra storyboardet, står i sjekktabellens merknadskolonne og er bare oversatt, ikke skrevet om.

## Slik brukes klippene

- Ett ferdiginnspilt klipp per dag med Rampenissens faste stemme, 30–50 s. Dag 1 er sesongåpningen og får 60–75 s; dag 24 får 50–65 s. Leveres til Morgenrådet som gjesteinnslag og spilles ordrett. Birk og Lyng introduserer og reagerer; de kjenner ikke Snøfall og sier aldri noe om koder.
- `intro_hint` er det Birk eller Lyng sier før klippet: én linje, eller dag 1 og 24 en kort replikkveksling («Birk: … Lyng: …»). `reaksjon_hint` er reaksjonen etter klippet, på dagene som har en. Begge er innholdsforslag til Varden, som eier Birk og Lyng (stemme, dialekt og framtoning); Varden skriver dem om i sin egen stil. De røper ingenting: ingen bokstaver, tall, steder eller gjenstander fra gåten. Dagens Morgenrådet-manus lages av produksjonen; disse linjene er det den skal bygge på.
- `rampestrek_hint` og `utfordring_hint` er det Birk og Lyng snakker om etter klippet: hva barna ser når de står opp, og hva slags utfordring dagen har. De oppfordrer barna til å løse den i NisseKomm, og de gjetter aldri og gir aldri hint. Linjene er nøytralt bokmål som Varden skriver om, og `get_clips` gir dem bare for dagens klipp. De inneholder aldri koden, bokstaver eller tall fra den, eller noe som snevrer inn svaret (`radio-hint.test.ts`).
- Førsesongen (24.–30. november) står nederst i fila: Birk og Lyng hinter om at noe er på vei, uten Rampenissen (han kommer natt til 1. desember). Navnet NisseKomm sies første gang 30. november.
- Hverdager går klippet i 06-sendingen, helg (5, 6, 12, 13, 19, 20) i 09-sendingen; helgeklippene er skrevet for en familie som er hjemme.
- Klippet bærer tre ting: hva som skjedde i natt (sett fra gulvet på Landås; dag 24 fra loftet i Snøfall, dit han reiste i natt), hvordan Rampenissen har det, og en bekreftelse av gårsdagen. Det bærer aldri bokstaver, tall fra koden eller hvor noe ligger. Streken omtaler han fra sin egen side, uten å innrømme alt.
- Kunnskapstidslinje (storyboard §2): han sier ikke navnet på radio dag 7, hører sukket dag 12, vet hvem Vintervokteren er fra kvelden dag 15, og bruker aldri «fiende» etter det. Dag 20–21: holde varmen inne, porten åpen. Dag 23 vet han ikke hva som ligger under treet.
- Rampenissen sier «Kulde» om det som sender fra dag 8. Slang bare dag 8 og 20 (dag 3 står på speilet, ikke i klippet).
- Lydregi står på egen linje (`Lydregi:`) og er for produksjonen. Inne i klippet står bare det som skal sies.

---

## Dag 1 (ti) – Direktelinjen

**Strek:** begravd under et skred av klementiner fra TV-benken, bare lua og én vinkende arm stikker opp, banan som pute, rød garntråd fra TV-en til håndleddet hans.

**Klipp:** «Hallo? Hallo! E denne på? Det e mæ! Rampenissen! Æ e TILBAKE! Æ har sove i en garnkurv på loftet i Snøfall heile året, og i natt sendt IQ mæ ned gjennom den nye direktelinja. Hodestups. Æ landa mykt, i nåkka gult og buet. Æ sei ikkje meir. Og garnet? Garnet va der da æ kom. Nesten. Men hør no. Julius samla heile Snøfall før æ reist. Han sa det rett ut: i år treng Snøfall hjelp. Fra dokker. Æ sa ja før han va ferdig. IQ har bygd nåkka nytt på loftet. Æ får ikkje sei ka det e. Det va mørkt, og det summa. Dokker får se det sjøl, litt om gangen, heile desember. Og én ting til: det knitre nåkka på linja. Og det e ikkje mæ. IQ sei det e været. IQ sei bestandig at det e været. Æ sitt i hylla i stua til jul. Sulten, stolt og på jobb. God morra, Landås!»

**intro_hint:** «Birk: Vi har fått et lydklipp i innboksen i natt. Ingen avsender, bare et navn: Rampenissen. Han sier han e tilbake på jobb. Lyng: Tilbake fra kor? Og kem har sendt oss det? Eg stoler ikkje på klipp uten avsender. Birk: Mottakeren min knitret hele forrige uke. Kanskje det henger sammen. Vi spiller det, så får dokker dømme selv.»

**reaksjon_hint:** «Lyng: Okei. Han sov i en garnkurv. I et helt år. Og landet i nokke gult og buet. Eg sier banan. Birk: Han sa ikkje banan. Men hørte du det bak stemmen hans? Det knitret. Det var ikkje vår linje. Lyng: Snøfall. Eg har aldri hørt om et sted som heter Snøfall. Eg skal finne det på kartet før i morgen. Birk: Han sa Snøfall trenger hjelp, og han sa det til tre barn i Bergen. Vi tar ham inn hver morgen i desember, så lenge han ringer.»

**rampestrek_hint:** «Rampenissen ligger begravd under et skred av klementiner foran TV-benken, med en banan som pute og rød garntråd viklet rundt seg.»

**utfordring_hint:** «Dagens utfordring er den første: det ligger noe å finne i stua, og Julius har en ledetråd i videoen sin. Begge deler trengs for å finne koden til NisseKomm.»

## Dag 2 (on) – Sikringsboksen til IQ

**Strek:** sitter i sukkerskålen med teskje, tatt på fersken.

**Klipp:** «God morra! Rampenissen her, direkte fra… ei skål. Hør, det SMALT i Snøfall i natt. Tre sikringa. Pang, pang, pang. IQ sei det ikkje va kaffetraktern. Det va kaffetraktern, sjø. Og æ blei så skremt at æ trengt nåkka søtt. Litt. Ei teskje. Kanskje to. Kanskje æ sovna i skåla. Det e ikkje bevist. Dokker fikk linja til å bær i går, forresten, heile verkstedet hørt det! IQ ropt så høgt at Hjerterud kom med teppe. I dag e Kanal to heilt mørk, og IQ spring rundt med ei lita lampe i munnen. Æ hjelpe til heimefra. Fra skåla. Over.»

**intro_hint:** «Han ringte inn fra en skål. Han ville ikke si hva slags skål.»

**reaksjon_hint:** «Lyng: En skål. Han sov i en skål. Eg har sovnet på bussen, men aldri i en skål.»

**rampestrek_hint:** «Rampenissen sitter i sukkerskålen med en teskje, tatt på fersken med sukker rundt munnen.»

**utfordring_hint:** «Rampenissen har gjemt noe i huset, og det må letes godt. Julius forteller i videoen hva som skal gjøres med det som blir funnet.»

## Dag 3 (to) – Rimfrost på Ruten

**Strek:** tannkrem på badespeilet, «RAMPEN VAR HER. NO CAP.», surt fjes, tom tube i vasken.

**Klipp:** «Rampenissen her. Litt lav stemme i dag, for æ sov dårlig. Klokka tre såg æ et blått glimt på stueruta. Æ sei det va en bil. Æ trur ikkje det va en bil. Orakelet oppi Snøfall sei nån lytte på linja. Nån som ikkje e oss. Så da mått æ ro mæ ned, og da pusse en tenna, ikkje sant? Og så blei det… kunst. På speilet. Æ skreiv bare sannheta. Æ VA der. Tuben va nesten tom fra før. Nesten. Det e ikkje rot, det e en signatur. Dokker fikk strøm på Kanal to i går, bra jobba! Pil klappa. Over og ut, nesten.»

**intro_hint:** «Dagens gjest har sovet dårlig og har pusset tenner. Grundig.»

**rampestrek_hint:** «På badespeilet står det «Rampen var her. No cap.» med tannkrem, og tuben i vasken er tom. Rampenissen ser sur ut.»

**utfordring_hint:** «Dagens utfordring begynner på badet, der Rampenissen har lagt igjen en lapp. Julius har den andre halvdelen i videoen.»

## Dag 4 (fr) – Skotoget i Gangen

**Strek:** pappas solbriller, sitter i pappas sko i gangen, sko og kosedyr i ring rundt.

**Klipp:** «Fredag! Rampenissen rapportere fra… et høgt sted. Et sko-høgt sted. Rudolf fløy rett i snøfonna i natt. Det låg ei tåke over fjorden som va kald på feil måte, og han sa han fant veien med nesa. Nesa! Han kom heim med snø i begge øra. Så æ tenkt: nån må vis retning her i huset. Æ har laga en pil. Av nåkka. Ikkje si ka. Kosedyra står i ring rundt mæ og vil prøv. Dem får ikkje. Solbrillan e for sikkerhets skyld, det e veldig blankt i snøen. Pappa treng dem ikkje i desember uansett, det e mørkt heile tida. Logisk, sjø. Dokker fikk regnbuen i går, heile Snøfall såg den. God helg snart!»

**intro_hint:** «En liten fyr med altfor store solbriller vil si noe om retning.»

**rampestrek_hint:** «Rampenissen sitter i pappas sko i gangen med pappas solbriller på, og rundt ham står sko og kosedyr i ring.»

**utfordring_hint:** «Dagens utfordring er en letejakt i gangen: Rampenissen har gjemt noe der, og Julius har en ledetråd i videoen. Det trengs både øyne og tålmodighet.»

## Dag 5 (lø) – Brevfuglen over Byfjellene

**Strek:** marshmallow-krig mellom Rampenissen og kosedyrene, én bamse med plaster.

**Merk:** Helg, 09-sendingen.

**Klipp:** «God lørdag, sovetryna! Klokka e ni, og dokker e sikkert våkne. Æ har vært våken sia fire. Det har vært krig i stua. Æ og bamsan. Vi vant. Begge lag vant, det va litt uklart. Én bamse blei truffa i magen og har plaster, han e tapper. Kulene va myke og kvite, og æ ska rydd. Seinere. Og hør: en brevfugl landa i natt, den første over Bergen i år! Winter oppi Snøfall stole ikkje på nån no. Han skriv alt i hemmelig skrift fordi nån lytte. Fuglen har nåkka rart på vingen. Æ skjønne det ikkje. Æ e bare agent, ikkje sekretær. Kos dokker i regnet!»

**intro_hint:** «Det skal ha vært krig i en stue på Landås i natt. Vi har et øyenvitne på linjen.»

**reaksjon_hint:** «Birk: Krig i en stue på Landås, og begge lag vant. Det e den beste nyheten vi har hatt på lenge.»

**rampestrek_hint:** «Det har vært marshmallow-krig i stua mellom Rampenissen og kosedyrene. En bamse har fått plaster.»

**utfordring_hint:** «En brevfugl har landet et sted i huset med en beskjed i hemmelig skrift. Julius forklarer i videoen hvordan den skal leses.»

## Dag 6 (sø) – Skyggene i Gangen · 2. advent

**Strek:** snøengler i 1 dl mel i et stekebrett på kjøkkenbordet, ligger midt i den største.

**Merk:** Helg, 09-sendingen.

**Klipp:** «God søndag og god andre advent! Rampenissen her, litt kvit i ansiktet. Det e mel. Ikkje spør. Jo, spør: æ skull lag snøengla, og det e ikkje snø inne, så æ brukt det nærmeste. Æ ligg i den største engelen. Melet e rot, det innrømme æ. Men! Fuglen kom fram i går, Winter pusta ut. Og i natt sa Orakelet at det som fryse linja, ikkje tåle lys. IQ hengt lys rundt heile antenna. Og æ har laga nåkka av den lille lampa dokkers og en papprull. Det ligg ikkje i melet, det e for fint til det. Det e ikkje rot. Det e et instrument. Kos dokker i dag!»

**intro_hint:** «Gjesten vår er litt hvit i ansiktet i dag. Han sier det ikke er snø.»

**rampestrek_hint:** «Rampenissen ligger midt i et stekebrett med mel på kjøkkenbordet, og rundt ham er det snøengler i melet.»

**utfordring_hint:** «Rampenissen har laget et instrument og lagt det i gangen. Dagens utfordring handler om skygger, og Julius har en ledetråd i videoen.»

## Dag 7 (ma) – Inntrengeren i Fryseren · M2

**Strek:** fastfryst med rim og istapper, ryggen mot innsiden av den åpne fryserdøra, uten lue på hodet: lua ligger på en hylle inne i fryseren, vottene har stivnet rett ut.

_Skjerm-kort fra Orakelet om morgenen._

**Klipp:** «Mandag. Rampenissen her, og æ kan ikkje rør arman. Lua mi sitt fast i fryseren dokkers, og æ sitt fast i lua. Hør, æ prøvd å kjøl ned modemet, for Orakelet sa at nåkka varmt skurra på linja. Det va feil. Det som skurre, e kaldt. Og no e æ også det. Vottan har stivna rett ut, æ ser ut som en politimann. Men her e nyheta: Orakelet fant navnet i natt. Navnet på det som sende. Æ sei det ikkje på radio, for en veit aldri kem som lytte. Julius fortelle dokker det sjøl. Dokker klart lysan i går, forresten. Heile Snøfall sa åååh. Send varme. Bokstavelig talt.»

**intro_hint:** «Vi har en melding fra en som ikke kan bevege armene. Han sier det er midlertidig.»

**reaksjon_hint:** «Birk: Det som skurrer, e kaldt, sa han. Mottakeren min på loftet skurrer òg mest når det fryser. Eg hadde ikkje tenkt på det før no.»

**rampestrek_hint:** «Rampenissen er fastfryst på innsiden av fryserdøra, med rim, istapper og votter som står rett ut.»

**utfordring_hint:** «Noe ligger innefrosset og må tines med hjelp fra en voksen. Det som kommer fram, må leses sammen med det Julius sier i videoen.»

## Dag 8 (ti) – Lampene som Lyver

**Strek:** tårn av frokostblandingspakker, skilt «SIGMA-TÅRN», sitter på toppen med suppeøse.

**Merk:** Slang 1 av 2.

**Klipp:** «Hallo fra toppen! Rampenissen, høyde: alle frokostblandingan i huset. Uke én e ferdig, folkens! Og navnet e ute, dokker veit kem æ meine, den med dem kalde fingran. IQ feire med å bygg nåkka. Han har ikkje sove. Æ feira med å bygg nåkka. Mitt e høgare, sjø. Mitt har skilt. Mitt e, og æ sei det med respekt, sigma. Det e litt frokostblanding på golvet, men det e fordi tårnet trengt støtte. Øsa e flaggstang. Ikkje dytt. Æ meine det. Hjerterud sei frokost e dagens viktigaste måltid, og no e den også dagens høgaste. Hilsen fra toppen. Ikkje dytt!»

**intro_hint:** «Noen ringer inn fra en høyde. En veldig lokal høyde.»

**rampestrek_hint:** «Rampenissen sitter på toppen av et tårn av frokostblandingspakker med en suppeøse i hånda. På skiltet står det «Sigma-tårn».»

**utfordring_hint:** «På toppen av tårnet ligger et ark fra IQ med ledninger og lamper. Pakkene skal ned én og én, uten klatring, og Julius har resten i videoen.»

## Dag 9 (on) – Krystall-Matematikk

**Strek:** krøpet inn i grønnsaksskuffen nederst i kjøleskapet, skuffen står litt åpen, bare de to beina stikker ut over skuffekanten.

**Klipp:** «Hei. Det e mæ. Det e kaldt her. Æ ligg i grønnsaksskuffen i kjøleskapet, ved sia av en agurk som ikkje sei nåkka. Koffer? Fordi Kulde har begynt å lag krystalla som ser ekte ut, men ikkje e det. Pil blei lurt to ganga i natt og e heilt flat. Så æ tenkt: ska æ kjenn igjen et ekte iskrystall, må æ bli ett. Det går dårlig. Æ e bare kald og lukte purre. Dokker va kjempeflink med kortet i går, forresten. IQ fikk det ferdig takka være dokker. Kan nån hent mæ? Æ kjem ikkje opp. Agurken hjelpe ikkje.»

**intro_hint:** «Dagens gjest ringer fra et kjølig sted og ber om å bli hentet.»

**rampestrek_hint:** «To bein stikker opp av grønnsaksskuffen i kjøleskapet. Resten av Rampenissen har krøpet nedi.»

**utfordring_hint:** «Kjøleskapsdøra er full av papirkrystaller. Dagens utfordring er en regneoppgave der det gjelder å se nøye etter, og Julius har regelen i videoen.»

## Dag 10 (to) – Fargene som Forsvant · frost nivå 1

**Strek:** hender, nese og halve ansiktet i fire tusjfarger, fire vaskbare tusjer ligger på bordet ved siden av ham, bart tegnet på en post-it som er festet på glasset over bildet av mamma og pappa (selve bildet er urørt, ingen bart på det).

_Skjerm er grå fra 05:30._

**Klipp:** «Høre dokker mæ? Skjermen dokkers e GRÅ. Æ såg det klokka fire i natt, og herregud, æ blei så redd at æ gjord nåkka. Æ gjømt alle fargan æ fant. Nån på mæ, resten gjømt i stua. Hendan, nesa, halve ansiktet. No e æ den mest fargerike tingen i huset, og det e et ansvar. Mamma og pappa fikk bart på bildet, men det e en post-it, det går av, æ sjekka. Kulde har tatt fargan fra Snøfall TV også. Alt e grått der oppe. Hjerterud bake grå bolla. IQ sei dokker e dem einaste med farga igjen. Så pass på dem. Ikkje vask mæ. Æ meine det. Over.»

**intro_hint:** «Han sier han er den mest fargerike tingen i huset i dag. Han høres bekymret ut.»

**reaksjon_hint:** «Lyng: Han har gjemt fargene. Alle. Eg vet ikkje om eg skal le eller ringe noen.»

**rampestrek_hint:** «Rampenissen har tusj på hendene, nesa og halve ansiktet, og bildet av mamma og pappa har fått bart på en gul lapp.»

**utfordring_hint:** «Rampenissen har gjemt fargene rundt i stua, og det trengs et rødt filter for å se hva som står på dem. Julius har en ledetråd i videoen.»

## Dag 11 (fr) – Antenne-Krisen · bonus

**Strek:** pakket inn i aluminiumsfolie som en bakt potet, på et stekebrett på benken.

**Lydregi:** skurr lagt på i starten, etter «midt i…» og over siste ord; klippet begynner midt i en setning og kuttes midt i den siste.

**Klipp:** «…hallo? Høre dokker mæ? Kulde forstyrre antenna ved tjernet, så det kan hend æ forsvinn midt i… Der. Æ har folie på hodet. Det hjelpe litt. Æ har også folie på resten. Det hjelpe ikkje, men no e æ varm, og æ ligg på et stekebrett, og ingen må skru på ovnen. INGEN. Viktig nyhet: dokker fikk fargan tilbake i går! Heile Snøfall såg det. IQ dansa. Pil dansa. Æ såg det på den lille skjermen min. Æ gråt ikkje. Det va folie i øyet. God fredag, og vess dokker høre skurr i dag, så e det ikkje mæ, det e…»

**intro_hint:** «Det skurrer litt på linjen i dag. Gjesten vår har tatt sine forholdsregler.»

**rampestrek_hint:** «Rampenissen ligger pakket inn i aluminiumsfolie på et stekebrett, som en bakt potet.»

**utfordring_hint:** «Det ligger sendere gjemt i flere rom, og alt som blir funnet, skal tas med. Julius forteller i videoen hva som skal gjøres med dem.»

## Dag 12 (lø) – Lydbølgene som Smelter Is · M3

**Strek:** én eneste dorull: rullen ligger ved den ene veggen, og papiret er rullet ut til en lang bølgete stripe («lydbølge») bortover kjøkkengulvet; stripen ender ved Rampenissen, som ligger utslått på ryggen, med tre drikkeglass ved siden av seg.

**Merk:** Helg, 09-sendingen.

**Klipp:** «God lørdag. Æ snakke lavt i dag. Æ hørt nåkka sukk i isen i natt. Ikkje knurr. Ikkje fres. Sukk. Sånn som når en e aleina og trur ingen høre. Julius sa i går kveld at æ innbilt mæ det. Hjerterud sa ingenting, ho bare nynna og gikk ned mot slusa med lykt. Æ veit ka æ hørt. Så æ prøvd å lag ei lydbølge, ei stor ei, for å send lyd tilbake. Det blei en dorull. Heile dorullen. Fra badet til kjøkkenet. Det e vitenskap, ikkje rot. Antenna i Snøfall står rett igjen, forresten, takka være dokker. IQ har sagt takk tolv ganga. Hør etter i dag. Hør ordentlig.»

**intro_hint:** «En som hørte noe i natt. Han vil at vi skal snakke lavt.»

**reaksjon_hint:** «Lyng: Et sukk i isen. Birk, eg trur på han. Eg vet ikkje koffor, men eg gjør det.»

**rampestrek_hint:** «En hel dorull er rullet ut i en bølgete stripe over kjøkkengulvet, og i enden ligger Rampenissen utslått på ryggen.»

**utfordring_hint:** «Dagens utfordring skal høres: ved Rampenissen står det noe som kan spilles på med en teskje. Julius forteller i videoen hva det gjelder å lytte etter.»

## Dag 13 (sø) – Luciadagens Gylne Krydder · 3. advent

**Strek:** sin egen begravelse etter elleve lussekatter: serviett, blomst, kosedyr i sørgerekke, fire små krydderposer på servietten, skilt «HER HVILER RAMPEN. HAN SPISTE 11.» med en liten lapp under.

**Merk:** Helg, 09-sendingen.

**Klipp:** «God Lucia-morra. Dette e Rampenissen, og æ e død. Nesten. Hjerterud bakt fem hundre bolla til Lucia. Æ spist elleve. Ikkje tolv. Elleve. Kosedyra hold begravelse, og dem e veldig verdige, bortsett fra én som ler. Hilsen fra den andre sida. Det e ganske koselig her, æ har blomst. Men hør: i går hørt dokker det samme som mæ. Isen sukka. Julius sa unnskyld. Det har aldri skjedd. Og i natt satt Kulde og såg på Lucia-lysan i verkstedet gjennom linja. Bare såg. Tok ingenting. Æ veit ikkje ka æ ska mein om det. Syng høgt i dag. Og ikkje spis elleve. Ti e grensa.»

**intro_hint:** «Vi har fått en hilsen fra, sitat, den andre siden. Han høres ganske opplagt ut til å være død.»

**rampestrek_hint:** «Rampenissen har holdt sin egen begravelse etter elleve lussekatter, med blomst, kosedyr i sørgerekke og et skilt der det står «Her hviler Rampen».»

**utfordring_hint:** «Ved Rampenissen ligger det små poser med krydder. Dagens utfordring er å finne ut hvilket av dem som var i lussekattene, og Julius har en ledetråd i videoen.»

## Dag 14 (ma) – Hemmeligheten i Papirvingene

**Strek:** alle kjøkkenserviettene brettet til skjeve fugler, sitter selv i en papirbåt (A3 eller avis) i den tørre vasken.

**Klipp:** «Mandag, og æ e ikkje død lenger, det gikk over. Rampenissen her, fra en båt. En papirbåt. I vasken. Den e tørr, slapp av. Hjerterud fikk krydderet sitt igjen i går, takka være dokker. Winter åpna brevfuglan i natt! Fuglan fløy ut fra pakkesentralen som ei sky. Og så kom det én fugl ingen hadde sendt. Blå. Den satte sæ i vinduskarmen til Julius og sa ingenting. Winter vil legg den i ei eske med et håndkle over, sånn en gjør med redde fugla. Den blei sittanes. Æ blei inspirert og bretta alle serviettan dokkers til fugla. Dem e litt skjeive. Dem fly ikkje. Men dem prøve, og det telle. Over.»

**intro_hint:** «Dagens gjest ringer fra en båt. En veldig liten båt.»

**rampestrek_hint:** «Alle kjøkkenserviettene er brettet til skjeve fugler, og Rampenissen sitter i en papirbåt i vasken.»

**utfordring_hint:** «Rampenissen har et ark med streker og tomme ruter som ser ut som ingenting. Dagens utfordring er å få det til å vise noe, og Julius har en ledetråd i videoen.»

## Dag 15 (ti) – Fargesamlerens Notatbok · M4

**Strek:** står ved siden av en liten skål sirup, fotspor av papir over benken, sleiva i hånden.

**Merk:** Han vet ikke om Vintervokteren før i kveld.

**Klipp:** «Rampenissen her, og æ har ikkje smakt. Nesten ikkje. Æ prøvd å lag nåkka varmt på kjøkkenet i natt, for det e kaldt på linja. Det blei ei lita skål med nåkka klissete. Æ står ved sida av ho og passe på. Sleiva va med på det. IQ e stille. IQ e aldri stille. Han fant ei gammel bok i arkivet i natt, og han har ikkje sagt et ord sia. Han bare sitt. Hjerterud satte ei skål med nåkka godt foran han, og den står der enda. Det har aldri skjedd før. Æ e litt urolig. Snakk lavt når dokker kjem heim i dag. Og ta med en klut.»

**intro_hint:** «Gjesten vår står vakt ved ei skål på benken, og han er bekymret for en venn.»

**reaksjon_hint:** «Birk: Han var stillere i dag. Når den som alltid snakker blir stille, e det noe som har skjedd.»

**rampestrek_hint:** «Rampenissen står ved en liten skål med sirup med sleiva i hånda, og bortover kjøkkenbenken går det fotspor.»

**utfordring_hint:** «Fotsporene på benken skal følges. Dagens utfordring har biter både på kjøkkenet og i NisseKomm, og Julius har en ledetråd i videoen.»

## Dag 16 (on) – Pakkesentralen i Spinn · bonus

**Strek:** «ryddet»: fjernkontroller i brødboksen, brød i TV-benken, tannbørster i bestikkskuffen, sitter i brødboksen med lokket på hodet.

**Merk:** Han vet nå hvem Kulde er.

**Klipp:** «God morra fra brødboksen. Ja, sjø, æ sitt i den. Lokket e hatt. I natt blei heile pakkesentralen snudd på hodet. Alt ligg i én haug, og Winter gråte. Nesten. Han har aldri grått. Og dokker veit jo kem det e no. Dokker lest boka i går, og æ satt i stua og hørt. Det e ikkje nåkka slemt der nede. Det e nåkka som vil bli sett. Æ trur den snudd båndet fordi det e det einaste som får Winter til å se opp. Så æ tenkt: æ hjelpe til heime! Æ rydda. Æ trur æ gjord det verre. Fjernkontrollan e trygge. En plass. Tannbørstan også. Ikkje spør. Over.»

**intro_hint:** «Noen har ryddet. Han vil gjerne forklare seg.»

**rampestrek_hint:** «Rampenissen har ryddet, og nå ligger tingene på helt feil plass, som brødet i TV-benken. Selv sitter han i brødboksen med lokket på hodet.»

**utfordring_hint:** «Dagens utfordring er å rydde opp etter ham og legge tingene tilbake der de hører hjemme. Underveis dukker det opp lapper, og Julius har en ledetråd i videoen.»

## Dag 17 (to) – Grønt over Polarhimmelen

**Strek:** kidnappet av kosedyrene, bundet til en stol med grønt gavebånd, løsepengebrev «GI OSS ALLE PEPPERKAKENE. ELLERS.»

**Klipp:** «Dette e Rampenissen, og æ e kidnappa. Av kosedyra. Dem har bunde mæ til en stol med gavebånd og skreve et kravbrev med utklipte bokstava. Dem vil ha alle pepperkakan. Ellers. Det står bare «ellers». Æ veit ikkje ka som skjer ellers. Men hør, det viktigaste: det va grønt over Ulriken i natt. Æ såg det fra stolen. Ikkje en bil. Ikkje ei lampe. Grønt over heile fjellet, ka du sei! IQ sei det va et svar. Et svar fra grotta, på lyktan ved antenna. Første gang nåkka svare. Æ fikk gåsehud under båndet. Send pepperkaka. Og nån som kan dra i ei sløyfe. Over.»

**intro_hint:** «Vi har mottatt et løsepengekrav. Og offeret ringer selv.»

**reaksjon_hint:** «Birk: Grønt over Ulriken i natt. Eg så det fra vinduet på Varden, og eg sa det til ingen, for eg trodde ingen ville tro meg.»

**rampestrek_hint:** «Kosedyrene har kidnappet Rampenissen og bundet ham til en stol med grønt gavebånd. Løsepengebrevet krever alle pepperkakene.»

**utfordring_hint:** «Dagens utfordring sitter på gavebåndet. Det skal strekkes ut og leses, og Julius har en ledetråd i videoen.»

## Dag 18 (fr) – Kastevind rundt Ulriken

**Strek:** spor av sjokoladerosiner på gråpapir fra ytterdøra mot kjøleskapet, sitter fast i pappas jakkelomme og peker anklagende.

**Klipp:** «Fredag. Rampenissen her, fra ei lomme. Pappa si jakkelomme. Æ kom ikkje opp igjen. Trixter testa sleden i vestlandsvær i natt. Æ satt bakpå. Rundt Ulriken hoppa sleden så pakkan fløy, og æ fløy, og magen min fløy for sæ sjøl. Aldri igjen. Rudolf va innom etterpå for å sjekk at æ levd. Han gikk gjennom huset. Han la igjen nåkka på golvet dokkers. Små, brune, runde. Æ sei unnskyld for han. Det e ikkje det det ser ut som. Det e sjokolade. Trur æ. Ikkje smak før en voksen har sagt ja. Dokker fikk grotta til å svar i går, forresten. Alle såg det. Over.»

**intro_hint:** «En som har vært ute og flydd i natt, og ikke vil gjøre det igjen.»

**rampestrek_hint:** «Et spor av sjokoladerosiner går fra ytterdøra mot kjøleskapet, og Rampenissen sitter fast i pappas jakkelomme og peker anklagende.»

**utfordring_hint:** «Dagens utfordring er å følge rosinsporet og telle nøye underveis. Rosinene bør ikke spises før koden er tastet, og Julius har en ledetråd i videoen.»

## Dag 19 (lø) – Eksplosjon i Fôringsautomaten · pusterom

**Strek:** ligger flat på kjøkkengulvet med teipomriss, plaster på pannen, «BEVIS»-pakke i folie ved siden av.

**Merk:** Helg, 09-sendingen.

**Klipp:** «God lørdag! Rampenissen her, fra golvet. Æ ligg inni et omriss av teip. Æ e et åsted no. Det som skjedde: IQ bygd en fôringsautomat til Rudolf, for å slepp å tenk. Den skjøt førti av dem gjennom taket på verkstedet. Førti! Tre landa hos dokker. Én landa på mæ. På panna. Æ har plaster. Beviset e pakka inn, og IQ sei ingen pakke opp bevis før saken e løst. Ellers va det stille i natt. Heilt stille. Grønt over Nordtoppen to netta på rad, og ingen rim på linja. Julius pusta ut, æ hørt det. Så i dag: pust dokker også. Men ikkje på mæ. Æ e åsted.»

**intro_hint:** «Dagens gjest beskriver seg selv som et åsted.»

**rampestrek_hint:** «Rampenissen ligger flat på kjøkkengulvet med plaster i panna og et omriss av teip rundt seg, som på et åsted. Ved siden av ligger en pakke merket «Bevis».»

**utfordring_hint:** «Det har landet bevis i flere rom, pakket i folie. Dagens utfordring er å samle dem uten å pakke dem opp, og Julius har en ledetråd i videoen.»

## Dag 20 (sø) – Sofa-Sleden · 4. advent · varselet

**Strek:** fort av teppe over to stoler, fem puter i ulik størrelse hulter til bulter inni, skilt «KUN FOR SIGMAS. 6-7.», pappas hodetelefoner, skål med popcorn.

**Merk:** iMac-ene grå 09–12. Helg, 09-sendingen. Slang 2 av 2.

**Klipp:** «God fjerde advent. Rampenissen her, fra fortet. Det e et teppe over to stola, og det står KUN FOR SIGMAS på skiltet, så dokker må si passordet. Passordet e seks sju. Ikkje spør koffer. Hør no, dette e viktig: Julius sa æ skull be dokker finn fram bøka. Mange bøka. Til i morra. Han sei bøka hold på varmen. I morra e den mørkaste dagen, og Kulde kjem heilt hit. Ikkje for å vær slem. Den vil bare dit lyset e. Så vi stenge ingen ute. Vi hold varmen inne. Æ øve i fortet. Popcornet e niste. Hodetelefonan e for konsentrasjon. Vær heime i morra. Æ treng dokker.»

**intro_hint:** «Han ringer fra et fort, og han vil at dere skal finne fram noe til i morgen.»

**reaksjon_hint:** «Birk: Han var alvorlig i dag. Ikkje noe rot, ikkje noe tull. Bare: vær hjemme i morgen.»

**rampestrek_hint:** «Rampenissen har bygd et fort av teppe, stoler og puter, med popcorn, pappas hodetelefoner og et skilt der det står «Kun for sigmas».»

**utfordring_hint:** «Dagens utfordring ligger inne i fortet, mellom putene. Rampenissen har lagt igjen en lapp, og Julius har en ledetråd i videoen.»

## Dag 21 (ma) – Vintersolverv · M5

**Strek:** bak en lav mur av bøker foran skjermen, grytelokk mot trekken, visp i hånden, én bok på gløtt.

**Merk:** Skjerm er fryst fra 05:30. Rolig tone.

**Klipp:** «God morra. Det e Rampenissen, og æ snakke rolig, for det e en rolig dag. Skjermen dokkers e kvit. Alt e kvitt. Det e den mørkaste dagen i året, og Kulde e her. Men hør: bokmuren står. Bøkan dokker fant fram hold varmen inne. Æ har stått bak den sia klokka fire med et grytelokk mot trekken. Vispen veit æ ikkje koffer æ har. Og én bok står på gløtt, sånn Julius sa. Det e ei dør i muren. Den ska vær åpen. Ingen ska stå ute i kulda og se inn. Gå på skolen. Og i barnehagen, Hanna. Det går bra. Og så kjem dokker heim. Kom heim. Vi fikse det sammen.»

**intro_hint:** «En rolig melding i dag, fra en som har stått vakt siden klokka fire.»

**reaksjon_hint:** «Lyng: En dør i muren, som skal stå åpen. Det e det fineste eg har hørt noen si om en bokhylle.»

**rampestrek_hint:** «Rampenissen står vakt bak en lav mur av bøker foran skjermen, med grytelokk som skjold og visp i hånda. Skjermen er dekket av frost.»

**utfordring_hint:** «Dagens utfordring står i bokmuren, og Julius har en ledetråd til den. Koden skal tastes inn i NisseKomm, som er frosset til den er løst.»

## Dag 22 (ti) – Winters Tall · Snill-listen

**Strek:** krøpet inn i Hannas julesokk, bare føttene ut.

**Merk:** Han sier ikke stedsnavnet deres i dag.

**Klipp:** «Rampenissen her, og det e varmt igjen! Muren holdt i går. Porten står åpen. Alle såg det, heile Snøfall, og Orakelet sei det e varmare der nede no. Æ sov godt for første gang på lenge. Men så ringt Julius klokka fem. Han vil vit nøyaktig kor dokker bor. Til julenatt. Æ sa «ved sofaen». Det holdt ikkje. Æ sa «i Bergen». Det holdt heller ikkje. Winter vil ha det i tall, han stole ikkje på ord, og æ kan ikkje tall. Så æ blei stressa og gjømt mæ i en sokk. Det va en feil. Den e liten. Føttan mine e ute. Resten e inne. Hjelp. Over.»

**intro_hint:** «Gjesten vår sitter fast i noe lite og ber om hjelp.»

**rampestrek_hint:** «Rampenissen har krøpet inn i julesokken til Hanna, og bare føttene stikker ut.»

**utfordring_hint:** «Dagens utfordring er en tallkode. Kortene ligger i julesokker rundt om i huset, og Julius forklarer i videoen hvordan tall blir til bokstaver.»

## Dag 23 (on) – Nattevakt · sannheten

**Strek:** pakket opp et hjørne av en gave, teipet igjen med altfor mye teip, sitter i treet som pynt.

**Klipp:** «Lille julaften! Rampenissen her, fra treet. Æ sitt i juletreet. Som pynt. Frivillig. Det har ingenting å gjør med at en gave fikk et lite hull i hjørnet i natt. Det e teipa. Med mye teip. Det e meir teip enn gave no, og æ har dårlig samvittighet, og derfor sitt æ her og tenke. Men hør: i natt ska dem fly. Over Nordtoppen. Med alle lysan på. Julius sa dem ska fly lavt over grotta, så den som e der nede får se. Trixter pakke sleden no. Rudolf har spist. Æ gråte ikkje. Det e teip i øya mine. Navna dokkers sto på lista i går. Æ såg dem. Over.»

**intro_hint:** «Han ringer fra et tre. Han sier han er pynt.»

**reaksjon_hint:** «Lyng: Teip i øynene. Eg har hørt mange unnskyldninger for å gråte, men den var ny.»

**rampestrek_hint:** «Rampenissen sitter i juletreet og later som han er pynt. Under treet har en gave fått altfor mye teip på det ene hjørnet.»

**utfordring_hint:** «Det henger noe nytt i juletreet i dag. Dagens utfordring er å finne alt sammen og lese det i riktig rekkefølge, og Julius har en ledetråd i videoen.»

## Dag 24 (to) – God Jul på Landås · M6

**Strek:** ingen dukke. Der han satt i treet henger gullkonvolutten med avskjedsbrevet, og under treet står pappesken med sløyfe som pakket koffert.

**Merk:** Klippet er sendt fra loftet i Snøfall etter hjemkomsten.

**Lydregi:** landsbylyd lavt bak hele klippet (bjeller, en dør, verkstedet til IQ); ingen skurr.

**Klipp:** «God morra, og god jul! Det e Rampenissen, og æ e heime. På loftet i Snøfall, i garnkurven. Trixter la krystallet under treet dokkers i natt, og æ hoppa bakpå. Ingen vekking; sånn kom æ også. Det drypp fra grotta under Nordtoppen, og ingen e redd for det lenger. Rapporten e levert. Julius las ho med brilla på, og dokker sto på lista, alle tre. Hilsena: IQ sei linja holdt, og at han aldri va bekymra. Han va bekymra. Hjerterud sei takk for at dokker spiste klementinan. Winter sei tallan stemte. Trixter sei æ va tung bakpå. Julius sei sitt sjøl i dag. Brevet mitt heng der æ satt. Hylla e tom, og det e meininga. Men vess det knitre litt på linja i kveld, så e det mæ. Takk for fruktskåla. God jul, Kristian, Håkon og Hanna. Te neste år. Over og ut.»

**intro_hint:** «Birk: Siste melding fra gjesten vår i år. Han ringer hjemmefra, sier han. Vi vet ikkje kor det e. Lyng: Eg fant det aldri på kartet. Eg leita hele desember.»

**reaksjon_hint:** «Lyng: Te neste år, sa han. Så han kommer tilbake. Birk: Studio e stille no. Og den røde tråden rundt mikrofonstativet ditt e borte i dag. Vi tok den ikkje ned. Lyng: Nei. Vi tok den ikkje ned. God jul, Kristian, Håkon og Hanna.»

**rampestrek_hint:** «Rampenissen er borte. Der han satt i juletreet, henger en gullkonvolutt, og under treet står en liten pappeske med sløyfe.»

**utfordring_hint:** «Dagens utfordring er den siste. Esken har ting fra hele desember, og sammen med det Julius sier i videoen gir de årets siste kode.»

---

## Sjekktabell

Ord = talte ord i klippet. Sek = ord × 0,44 (målt tempo på dag 1–5). «Kode/hvor» = klippet sier ingen bokstav eller tall fra koden, ikke selve kodeordet, og ikke hvor brikke H ligger. Streken beskriver han alltid fra sin egen plass; den er synlig for barna uansett.

| Dag | Kode         | Ord | Sek | Sending | Kode/hvor       | Merknad                                                                                                                        |
| --- | ------------ | --- | --- | ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | SIGNAL       | 158 | 66  | 06      | ok              | Sesongåpning, 60–75 s; Birk og Lyng før og etter                                                                               |
| 2   | 48           | 100 | 42  | 06      | ok              | «Tre sikringer» er antall, ikke tall fra koden (gåtedok. reserve)                                                              |
| 3   | PRISME       | 105 | 44  | 06      | ok              |                                                                                                                                |
| 4   | KOMPASS      | 115 | 48  | 06      | ok              | «Jeg har laget en pil. Av noe.» (låst storyboard), ingen plass                                                                 |
| 5   | ULRIKEN      | 107 | 45  | 09      | ok              | Fuglen nevnes uten sted                                                                                                        |
| 6   | LYKT         | 110 | 46  | 09      | ok              | Storyboardets «lommelykten» er byttet til «den lille lampen», som i e-posten                                                   |
| 7   | KULDE        | 109 | 45  | 06      | ok, med merknad | «Det som skurrer, er kaldt» er låst storyboardlinje; navnet sies ikke                                                          |
| 8   | KRETSKORT    | 100 | 42  | 06      | ok              | Slang 1 av 2                                                                                                                   |
| 9   | 24           | 100 | 42  | 06      | ok              | Ingen antall eller armer                                                                                                       |
| 10  | SPEKTER      | 109 | 45  | 06      | ok              | «rundt i stua» fra historiedok. er tatt ut                                                                                     |
| 11  | 75           | 101 | 42  | 06      | ok              |                                                                                                                                |
| 12  | MELODI       | 110 | 46  | 09      | ok              | Glassene nevnes ikke                                                                                                           |
| 13  | SAFRAN       | 105 | 44  | 09      | ok              |                                                                                                                                |
| 14  | ORIGAMI      | 111 | 46  | 06      | ok              |                                                                                                                                |
| 15  | KARAMELL     | 110 | 46  | 06      | ok              | Verken sukker eller sirup nevnes                                                                                               |
| 16  | SORTERING    | 110 | 46  | 06      | ok              | «ryddet», aldri «sortere»                                                                                                      |
| 17  | NORDLYS      | 105 | 44  | 06      | ok              | «grønt over Ulriken», aldri «nord» + «lys»                                                                                     |
| 18  | TURBULENS    | 106 | 44  | 06      | ok              | «hoppet», ikke «ristet»                                                                                                        |
| 19  | GULROT       | 109 | 45  | 09      | ok              | «førti av dem», aldri hva                                                                                                      |
| 20  | TURBO        | 108 | 45  | 09      | ok              | Slang 2 av 2; varme inne, ingen ute                                                                                            |
| 21  | BRANNMUR     | 113 | 47  | 06      | ok, med merknad | «bokmuren»/«muren» er låst framing; første ledd sies ikke                                                                      |
| 22  | LANDÅS       | 108 | 45  | 06      | ok              | Stedsnavnet unngås hele klippet; «landingen» byttet til «julenatt»                                                             |
| 23  | STJERNEKLART | 111 | 46  | 06      | ok              |                                                                                                                                |
| 24  | JULEMAGI     | 144 | 60  | 06      | ok              | «God jul» er høytidsnavnet Julius selv ber dem sette foran; sendt fra Snøfall, ingen strek; 50–65 s, Birk og Lyng før og etter |

Sum: 2 664 ord, snitt 111 per dag (cirka 46 s).

---

## Førsesongen: Morgenrådet 24.–30. november

Birk og Lyng, uten gjest. Rampenissen kommer ned linjen natt til 1. desember og er ikke med her. Linjene er bergensfarget bokmål, 2–4 replikker per dag, lagt der de passer i sendingen (gjerne mellom to innslag). De bygger mot 30. november, da NisseKomm sies første gang. Ingen linje peker på noe i huset; klementinen og garntråden ligger i studio. Helg (28., 29.) går i 09-sendingen.

### 24. november (ti)

**Birk:** «Eg satt på loftet i går kveld med den gamle mottakeren min. Mellom to stasjoner, der det bare skal suse, knitret det. Tørt, som rim på en rute.»
**Lyng:** «Det e november, Birk. Alt knitrer i november. Mottakeren din e eldre enn deg.»
**Birk:** «Den har aldri knitret sånn før.»

### 25. november (on)

**Lyng:** «Kem har strikket i studio? Det hang en rød garntråd rundt mikrofonstativet mitt da eg kom i dag. Ikkje lang. Akkurat lang nok til at eg så den.»
**Birk:** «Ikkje eg. Eg kan ikkje strikke.»
**Lyng:** «Eg lar den henge. Den som la den der, får hente den selv.»

### 26. november (to)

**Birk:** «Vi har fått et spørsmål i innboksen uten navn. Kor langt e det fra Bergen til Nordpolen? Svaret e omtrent tre tusen tre hundre kilometer, rett nord.»
**Lyng:** «Kem spør om Nordpolen i november? Uten navn?»
**Birk:** «Det sto ikkje noe navn. Bare en liten tegning av en lue nederst.»

### 27. november (fr)

**Birk:** «Mottakeren igjen i natt. Og denne gangen var det ikkje bare knitring. Det var en rytme i det. Som når noen prøver en linje for å se om den holder.»
**Lyng:** «Eller som når en gammel mottaker e gammel. Men okei. Eg kom innom i går kveld for å høre selv. Det var en rytme. Eg sier ikkje mer enn det.»

### 28. november (lø) · 09-sendingen

**Lyng:** «God lørdag! Det lå en klementin på miksebordet i morges. Ingen av oss hadde med klementin. Eg spiste den.»
**Birk:** «Du spiste bevis.»
**Lyng:** «Den var god. Og den røde tråden henger der fortsatt, eg sjekket.»

### 29. november (sø) · 1. advent · 09-sendingen

**Birk:** «Første søndag i advent. Mottakeren var helt stille i natt. For første gang på en uke.»
**Lyng:** «Og det bekymrer deg?»
**Birk:** «Det e som når det blir stille rett før noe skjer. Eg vet ikkje ka. Men noe.»
**Lyng:** «Eg slo opp Nordpolen i går. Det bor ingen der. Så kem var det som spurte?»

### 30. november (ma)

**Birk:** «Vi har fått en melding med avsender denne gangen. Det sto ett ord i emnefeltet: NisseKomm. Og én setning: Gjesten dokkers kommer i morgen. Han ringer selv.»
**Lyng:** «Kem e han? Kor ringer han fra? Ka e NisseKomm?»
**Birk:** «Det sto ikkje. Men mottakeren knitret igjen i natt, og eg sov ikkje.»
**Lyng:** «Og i morgen e det ikkje november lenger.»

# Ugleposten: helhetlig gjennomgang (13.11.2026)

Bare lesing. Ingen kode er endret. Grunnlag: `kapittel1–4.ts`, `motor.ts`, `minispill.ts` på main (ef200ea), `docs/historie-2026.md`, entitetene, kodelista dag 1–24 og pikselbildene i `public/spill/piksel/` (alle ti scenene, figurene og ikonene er sett på).

**Gjennomspilling:** Et skript i scratch-mappa spilte hvert kapittel gjennom motoren til sluttflagget. Alle fire lar seg fullføre: K1 17 steg, K2 18, K3 15, K4 20. Ingen blindvei i løpet jeg kjørte. Skriptet tar første mulige handling, så det beviser ikke at alle rekkefølger går. Minispillene ble løst via `losPuslespill`, ikke for hånd. Tekstmengde: K1 9 500 ord, K2–K4 5 300–6 100.

## Funn, rangert

### Høy

1. **K1, Sukkerstua, Steinovnen (SE): «Vintervokteren» nevnes dag 4.** Navnet avsløres dag 15 (M4), og `kapitler.ts` sier selv «Vintervokteren known from day 15». Linjen er Hans' egen (hjerterud-hans-2026-11-13.md), og `kodelekkasje.test.ts` fanger den ikke fordi det ikke er et kodeord. Forslag: «Sjå på den ovnen der! Den e så varm og god at til og med Winter hadde tatt av sæ skjerfet om han stakk nesa inn.»
2. **K4: to porter og to murer blandes.** Barna står ved Byporten, smører byporten, og hotspotene heter «Muren» og «Muren til høyre» (bymuren). Samtidig skal brevbunken «inn gjennom porten i Muren i natt». En niåring tror det er porten de nettopp smurte. Forslag: døp hotspotene «Bymuren» og «Bymuren til høyre». Brevbunken: «… den skal inn gjennom porten i Muren i natt, den IQ lot stå åpen oppe ved Nordtoppen.» Winter får en linje for garnet (`feil.hyssing`): «Utlån fra arkivet, stemplet av meg. Brevene skal inn gjennom porten i Muren i natt. Ikkje denne porten. Den andre. Garnet skal tilbake rundt bunken. Eg har ført det opp.» I dag gir garn på Winter bare et skuldertrekk, så portstempelet forklares aldri.
3. **K4: gjenstanden heter «Rødt garn», teksten sier «hyssing».** Det gjelder navnet «Magnet i hyssing», `fiskesnoere.se`, kombinasjonsteksten, `brevbunken.ta`, to `feil`-linjer (vedkassa, brevfuglen) og tips 2 og 3 for «fiske». Barna leter etter hyssing i lomma og finner garn. Forslag: «garn»/«garnet» overalt, og navnet «Magnet i rødt garn».

### Middels

4. **K4: gaven med garnet lukkes ikke.** Tre ting:
   - Vedkassa sier «Garnet går tilbake rundt bunken», men brevbunken sier fortsatt «ligger løs nå». Forslag, ny variant `hvis: tok_bjelle`: «Bunken er bundet igjen med det røde garnet, med portstempelet midt på. Klar til i natt. {{brev}}»
   - Bjella har sin egen «røde garntråd» og bindes til sleden med den. Da ser det ut som det lånte garnet havnet på sleden. Forslag i `bjelle.se` og sleden: «den lille garnstumpen sin».
   - Utroen nevner ikke brevene. Forslag, én setning: «Og brevan ligg bunde med garnet mitt, klar te porten i Muren. Æ sei ikkje meir om det.»
5. **K1 mot K4: nøstet er «borte», men Rampenissen gir bort «resten».** K1: «det røde nøstet er borte. Bare en ende ligger igjen». K4: «Æ ga dem resten av nøstet. Det har jo halve fra før.» Forslag K1: «… men halve det røde nøstet er borte. Tråden er røket, og enden er stiv av rim.» Rampenissen: «Men kor e resten av det røde nøstet?»
6. **Garntråden kan gå barna hus forbi i K3, og reaksjonene ligger bak SNAKK.** I K3 står tråden bare på «Den store krystallen», som ingen må trykke på. I K2 og K3 kommer Rampenissens replikk bare ved SNAKK til kabler og krystall. Forslag: flytt replikkene inn i SE-teksten, og legg en halv setning på hovedveien i K3 (`lysveien.tekst`): «Lyset når helt bort til den store krystallen. Rundt foten ligger noe rødt.»
7. **K3: skjæret i lyset.** `tesil_lanterne.se` forteller hva som skjer «nede i grotta» mens barna ennå står på kontoret. Sokkel-linjen sier «det samme skjæret igjen», som ikke gir mening hvis de ikke har lest gjenstanden. Forslag: stryk setningen på gjenstanden, og skriv på sokkelen: «I kanten av strålen ligger et skjær, verken gull eller blått. Det er borte før du rekker å kalle det noe.» Tegnet (runen K), skjæret og fargenavnet holder ellers mål: ingen sier lilla, og grottebildet er bare blått.
8. **K2 mot dag 11.** K2 åpner dag 10 og slutter med skarpt bilde og antenna rett. Dag 11 sier at antenna «står skjev og full av is». Spilt etter dag 11 passer det fint, spilt på dag 10 motsier det hovedhistorien. Forslag, tillegg i utroen: «Æ veit ikkje kor lenge det held. Det som sende rimet, e ikkje ferdig.»
9. **K2, hengelåsen 1-3-1: bildet lurer.** Skiltet sier TELL, men i pikselbildet ligger det mange flere enn tre kabler og barduner i snøen. Riktig tall står bare i SE-teksten. Forslag til skiltet: «KODE: SE PÅ LAMPA, KABLENE OG REINEN. TELL. IKKE SI DET TIL NOEN. – IQ».
10. **Landås på dag 22.** Koden dag 22 er LANDÅS, og brevfugl-entiteten sier «Bergen» før dagen er løst. K4 har «brev fra Landås i natt» og lappen «RING LANDÅS JULAFTEN». Forslag: «fra Bergen» og «RING BERGEN JULAFTEN». K1 (pakken) og K2 (hele kapittelet peiler mot Landås) er eldre og følger premisset. Se beslutning 3.
11. **Historiebærende setninger ligger sist i de lengste tekstene.** K3 skåret på sokkelen er 93 ord, K1-slutten 72. Skjæret og nøstet kommer etter jubelen og blir lett skummet. Forslag: del i to. Rampenissens siste del kan gå i køen hans (`Node.rampenissen`-mønsteret), eller teksten kortes.
12. **TIPS følger fast rekkefølge når målene går parallelt.** I K4 sier Winter «begynn kor dere vil», men TIPS snakker om brillene til de er levert, også om barna står fast på porten. Samme i K2. NOTAT viser alle målene, så det er til å leve med. Ikke rør før 1. desember.

### Lav

13. **Språkfeil (bokmål):**
    - K2 peileskiva: «en reinsdyr» → «et reinsdyr».
    - K2 IQ: «rimen fra linja» → «rimet».
    - K2 håndvarmer og benken: «Ei lita pose» → «En liten pose».
    - K1 syltetøy: «Et glass rød syltetøy» → «rødt».
    - K4 hengslet (bjelle): «Dem e enige. Dem veit det ikkje. Det e første gang.» står utenfor replikken → «De er enige. De vet det ikke. Det er første gang.»
14. **Tips som ikke stemmer:**
    - K3 tesil, tips 1: «Ho sitt rett der og skriv» (hun sitter med bollekurven) → «Ho sitt rett der med bollan».
    - K3 lysveien, tips 3: «hjørnet øverst te høyre» er hjørnet midt på høyre side → «hjørnet te høyre».
    - K4 sprekken, tips 3: «Dem to andre kubban» er bare én → «Den siste kubben e bare i veien».
15. **Winter glir i dialekt i K4.** Han sier «ka», «korfor» og «Nokon». Beslutningen 11.11 sier «eg», «ikkje», «kor», ellers bokmål, og i K1 sier han «Hva». Forslag: «hva», «hvorfor», «Noen».
16. **Rampenissen, småsprik:** «sir»/«sei», «vett»/«veit», «korsen»/«kossen», «strevar». De tre kafélinjene har bokmålsord. Forslag: «Om Lille-Pjokk velte ei sånn, kjem han te å sjå ut som en snøball», «heilt te Fauske».
17. **K1, torgbildet:** Winter står med flosshatt. Teksten i klokketårnet sier «Han har ikke hatt på seg i dag», og entiteten sier flosshatt bare ved porten og offisielt. Forslag (tekst, ikke nytt bilde): «… Winters flosshatt sett ovenfra. Tømming av postkassen er en offisiell anledning. Det meste er det, for Winter.»
18. **K1 Hjerterud:** hun «legger en bolle på disken», men sitter i lenestolen, og bildet har ingen disk → «på bordet».
19. **Lille-Pjokk** (K1 melkrukkene) finnes ikke i noen entitet. Hans' egen linje. Enten en linje i en entitet eller la stå.
20. **Ikoner:** I bruk er «Rødt garn» et rent nøste, greit. Kandidatene `hyssing-v3` (med lapp), `krystallskaar-v2` og `tesil_lanterne-v4` er ikke tatt i bruk. «Blikkboks i grytelapp» viser rød ensfarget klut, mens grytelappen er rutete. Talgstumpen ser ut som et helt lys. Ingen ikoner mangler.
21. **K3 og dag 17:** barna setter et lys i grotta dag 16, og dag 17 «svarer grotten» på lyktene fra dag 6. Barna kan tro det var Ugleposten-lyset som virket. Det kan like gjerne være en gevinst. Ingen endring foreslått.
22. **K3 arkivet:** lappene og «NR. 1» er i IQs håndskrift (står i entiteten), mens historien kaller det Fargesamlerens arkiv. En halv setning ville rydde: «IQ nummererte dem da han bygde vokteren.»
23. **Gjentatte grep i K1:** «Winter noterer» elleve ganger og «et eget … for …» fem. Morsomt de tre første gangene. Kan tynnes i hotspoter utenfor hovedveien.

## Vurdering per punkt i bestillingen

- **Historien:** Henger sammen. K1 er skjemaspøk, K2 Rudolf og varme, K3 det stille besøket, K4 avgang. Hvert kapittel slutter godt, og K3 best: ingen snakker til det, lyset blir stående. Runen K betaler seg (skåret i K3, merkelappen i K4, Winters «en begynnelse»). Garnet betaler seg halvveis, se funn 4–6. Skjæret betaler seg først julaften, utenfor spillet, og det er riktig. Portstempelet henger i lufta til Winter får si noe om det.
- **Alder:** Kristian (12) klarer alt uten tips. Håkon (9) trenger tips ved skyvespillet i K1 (ni brikker; «La Rampenissen ta den siste biten» finnes), tellelåsen i K2 og oppvarmingen i to runder. Rutespillene er lette, fire–fem brikker. Hanna (5) kan ikke lese noe av dette, men kan dra i radiorattet, skyve brikker og lete etter uglefjær. Tipsstigen er god: tre trinn, det tredje er fasit. Teksten er lang, men nesten alt er frivillig pynt.
- **Kanon:** Brevfuglene, Sukkerstua, Hjerterud (figuren stemmer med entiteten: skaut, sennepsgult forkle, kurv), klementinkassa, ingen leker, Floke (aldri «Knerten»), 90,0 og 85,0 MHz, «Jeg glemte å slå det av» mot «så glømte alle det»: alt stemmer. Brevfuglfiguren dekker brillene i kontorbildet i K4. Avvik: funn 1, 2, 17, 18, 22.
- **Lekkasjer:** Ingen dagskoder eller kodetall (48, 24, 75) i teksten. Ingen lilla, fiolett eller ametyst. Nordlyset heter «grønt lys» og «grønne slør». Avvik: funn 1 og 10.
- **Språk:** Rampenissen er gjenkjennelig og morsom hele veien. Slangen (aura, chat, glaze, locked in, yappe) står seks steder og virker som krydder, slik beslutningen sier. Ingen KI-floskler eller anglisismer å melde utover slangen.

## Det som virker godt

- Winters bue: tre runder skjerf, lappen «DUMT», to runder, tommelen.
- Hjerterud i K3: «Det er alene. Det er ikke det samme som farlig.»
- Feil gjenstand gir nesten alltid en egen, morsom linje som også peker riktig vei (syltetøyet, håndvarmeren, lupa, nøtta).
- Koblingene: brevene på pulten, rekordene bak skriveplata, runelappene, Snill-listen med navn «fra Bergen i kveld».
- Funnkortene: «Det er noe inni» og «Den er kald» får barna til å se nærmere.

## Beslutninger for Hans

1. **«Vintervokteren» i ovnslinjen på dag 4** (din egen linje). Bytte til Winter og skjerfet, eller la stå? *Anbefaling: bytt.* Navnet er avsløringen på dag 15.
2. **To porter i K4.** Døpe om bymur-hotspotene og gi Winter en replikk om portstempelet? *Anbefaling: ja.* Ellers tror barna at brevene skal ut byporten.
3. **Landås før dag 22 er løst.** Bytte K4s to steder til «Bergen», og la K1 og K2 stå? *Anbefaling: ja.* K2 kan ikke skrives om uten å miste L-en på peileskiva, og ordet er barnas egen adresse uansett.
4. **K2 og dag 11.** Én setning i utroen, eller flytte åpningen til dag 11? *Anbefaling: setningen.* Barna spiller over flere dager, og dag 10 er alt tegnet inn i opplåsingene.
5. **Garnet i K3 på hovedveien** (funn 6), eller fortsatt bare for dem som leter? *Anbefaling: en halv setning på hovedveien.* Uten den kommer K4-gaven uten forvarsel for dem som ikke trykket på NR. 1.

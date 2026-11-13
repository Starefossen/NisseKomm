# Ugleposten i takt med Spøkelseskoden

Plan, 13.11.2026. Ingen kode er endret. Lest: `kapittel1–4.ts`, `motor.ts`, `kobling.tsx`, `Nissespill.test.tsx`, `kodelekkasje.test.ts`, `docs/historie-2026.md`, brevfugl-kanon, kodene dag 1–24 og PS-tekstene dag 14–22.

## Viktigste funn

- **Retning 4 kolliderer med PS dag 22** hvis bunken har kommet *ut* gjennom Murens port: «Ingenting har kommet gjennom porten ennå.» Bunken må være på vei *inn*. Se beslutning 2.
- **«Lilla» sies første gang dag 24** (mail, radio, video). K3 åpner dag 16. Fargen kan vises, men ikke navngis. Se beslutning 1.
- K4 har allerede en byport og en bymur (300 år, ikke IQs mur). Nye tekster skriver alltid «porten i Muren» om IQs port, så de to ikke blandes.
- Alt kan gjøres som tekst pluss én ny gjenstand. Ingen gåte, flagg eller id endres.

## (a) Buen

Ugleposten forteller det hovedhistorien ikke har plass til: hva som skjer med de små tingene mens Kulde trekker til seg lys og farge, og at noe kan gis frivillig i stedet for å bli tatt.

- **K1 (dag 4, etter M1):** Rampenissen får senga tilbake, men det røde nøstet i kurven mangler, og tråden som er igjen, er stiv av rim.
- **K2 (dag 10, etter M2):** Antenna tines, og langs kabelen ligger en rød tråd frosset fast, stram, på vei mot fjellet.
- **K3 (dag 16, etter M4):** Barna setter igjen et lys i grotta. De ser hvor tråden endte, et merke inne i isen og en farge i kanten av lyset som ingen sier navnet på.
- **K4 (dag 22, etter M5):** Før avgang gir Rampenissen resten av nøstet til en brevbunke som skal inn gjennom porten i Muren. Bak vedkassa ligger merkelappen til fuglen uten avsender.

Fire tråder:

| Tråd | Så | Vokser | Betaler seg |
| --- | --- | --- | --- |
| Det røde garnet (4) | K1: nøstet mangler | K2: tråd i rimet. K3: viklet rundt krystall NR. 1 | K4: resten gis bort, rundt bunken med portstempel |
| Runen (3) | K1/K2 har alt runelapper fra IQ | K3: én svak rune inne i skåret | K4: samme rune i avsenderfeltet på merkelappen |
| Merkelappen (2) | K1: brevfuglen over bodene har en lapp i foten | K3: Winter har «aldri fått en fugl uten avsender» (PS dag 14) | K4: magneten får opp lappen |
| Fargen (1) | Dag 10: fargene forsvant | K3: skjær i kanten av lanternelyset | Dag 24: ametystene. Ugleposten sier aldri navnet |

## (b) Endringer per kapittel

Rampenissen er nordlandsk, resten bokmål. Tekstene er utkast og språkvaskes før merge.

### K1 (bare tekst, to steder)

- `puslespill.frostluke.tekst`, legg til før Rampenissens linje: «Kurven er full av ull, men det røde nøstet er borte. Bare en ende ligger igjen, stiv av rim.» Rampenissen: «BJELLA MI! Men kor e det røde nøstet? Det va det fineste æ hadde. Æ leite seinere.»
- Hotspot ved linje 1232 (brevfuglen over bodene), `se`: legg til «I foten blafrer en liten merkelapp. Winter merker alle som lander.»
- Ikke skriv «kulde» eller «lykt» her (dag 6 og 7 er ikke løst på dag 4). Ingen tall 24 eller 75.

### K2 (bare tekst, ett sted)

- Hotspot `kablene`, `se`: legg til «Langs den ene kabelen ligger en rød tråd frosset inn i rimet. Den er stram, som om noe drar i den andre enden.»
- `prat` samme sted, Rampenissen: «Det der e GARNET mitt! Nån har dratt det heilt hit og videre. Æ veit ikkje kem. Æ har en mistanke. Den har ikkje skjerf.»

### K3

- `tesil_lanterne.se`, ny siste setning: «Nede i grotta får lyset et skjær i kanten, verken gull eller blått. Det er borte før du rekker å kalle det noe.»
- `krystallskaar.navn` uendret. `se`, ny slutt: «Dypt inne i skåret sitter ett tegn av rim, tynt som et hårstrå. Det er ikke risset. Det har vokst der: ᚱ:K»
- `krystallskaar.funnet` (nytt felt, ellers havner runemarkøren på funnkortet): «Et klart skår fra hylla. Det er noe inni.»
- Sokkelen, linjen som setter `skaar_satt`: legg til «I kanten av strålen ligger det samme skjæret igjen. Krystallen var ikke klar bestandig.» Rampenissen: «Såg dokker kanten på lyset? Den fargen har æ ikkje sett på lenge. Æ sei ikkje ka den heite. Æ e ikkje sikker på at æ får lov.»
- `storekrystallen.se`, legg til: «Rundt foten er det viklet en rød tråd, mange ganger og veldig pent. Noen har hatt god tid.» `prat`, Rampenissen: «Garnet mitt. Det har pynta sæ med det. La det ligg. Æ har meir.»
- Fortsatt gjelder: ingen snakker til det, ingenting svarer. Lyset på hylla er gull som før.

### K4

- `hyssing.navn`: «Rødt garn». `se`: «Rødt garn fra kurven til Rampenissen. Det holdt sammen en brevbunke med lapp: «UTLÅN FRA ARKIVET. Leveres gjennom porten i Muren.» Winters portstempel står midt på. Garnet må tilbake før i natt.»
- `brevbunken.se` (før garnet er tatt): «Brev til Julius. Den tykkeste bunken er bundet med rødt garn og har en lapp med Winters portstempel: den skal inn gjennom porten i Muren i natt. Julius har lest dem. Nå vil han at flere skal få lese. {{brev}}»
- `brevbunken.ta.tekst`, Rampenissen legges til: «Æ ga dem resten av nøstet. Det har jo halve fra før. Da kjenne det igjen garnet. Lån det, men legg det tilbake!»
- Vedkassa, `ta.tekst` for bjella: bytt «ei nøtt som har hengt seg på» med «og en liten merkelapp som klirrer mot magneten». Legg til: «Garnet går tilbake rundt bunken.»
- **Ny gjenstand `fuglemerke`** («Merkelapp uten avsender»). `se`: «Winters merkelapp for brevfugler, kremhvitt papir med en malje av jern. Ankomst er fylt ut. Avsender står tom. I det tomme feltet har rimet tegnet noe: ᚱ:K» `funnet`: «En merkelapp fra en brevfugl. Den er kald.»
- Den hentes med `ta` på en ny liten hotspot («Merkelappen på gulvet») som vises etter `tok_bjelle`. Den er ikke med i noen gåte.
- Nye `bruker`-linjer for `fuglemerke` uten flagg: Winter: «Avsenderfeltet er tomt. Eg lot det stå tomt i arkivet også. Det er første gang. Én bokstav er ikkje en adresse. Men det er en begynnelse.» Brevfuglen: hun ser på lappen og flytter seg en tomme. Den er ikke hennes. Julius: «Den blå satt i vinduet mitt. Jeg lurte på hvor lappen ble av. Behold den, Floke.»
- Rampenissen i køen sin (`rampenissen` på Winters node): «Samme tegnet som i skåret! Dokker såg det, æ såg det. Vi sei ingenting. Vi bare veit det.»

### Ikoner (fire bilder)

| Ikon | Endring |
| --- | --- |
| `tesil_lanterne` | Svakt fiolett ytterst i lysskjæret, flammen fortsatt gul |
| `krystallskaar` | En svak rimstrek inni. Ikke en lesbar rune, den tegner RuneText |
| `hyssing` | Rødt garn med kremhvit lapp og rundt stempel |
| `fuglemerke` (ny) | Kremhvit papirlapp med jernmalje og rim i kanten |

Alle må kunne leses i 32×32. Lages som `-vN` og godkjennes i Gjennomgang.

## (c) Tidssjekk

| Element | Vises dag | Hovedhistorien da | Risiko | Tiltak |
| --- | --- | --- | --- | --- |
| Nøstet mangler (K1) | 4 | Etter M1. Navnet kommer dag 7 | «kulde», «lykt», «kompass», 24, 75 | Bare «rim» og «frost» |
| Tråd i rimet (K2) | 10 | Etter M2. Koden SPEKTER samme dag | Kodeord dag 10–24 | Navnet Kulde er lov, slik K2 alt gjør |
| Fiolett skjær (K3) | 16 | Etter M4. «Lilla» sies dag 24 | Røper gaven for tidlig | Aldri «lilla», «fiolett», «ametyst» i tekst |
| Runen K (K3) | 16 | K læres dag 4 og dag 7 | Ulært rune | RuneText viser frost av seg selv. Ikonet har ingen lesbar rune |
| Tråd rundt NR. 1 (K3) | 16 | Dag 17 er NORDLYS, dag 16 er SORTERING | Kodeord | Ikke «nordlys» eller «sortering». Bruk «lanterne», som i dag |
| Bunken og portstempelet (K4) | 22 | Etter M5. PS dag 22: ingenting har kommet ut | Motsier PS, tar takken dag 24 | Bunken skal inn. Ingen svarer, ingen takker |
| Merkelappen (K4) | 22 | Dag 23 forteller sannheten | Forklarer for mye | Ett tegn, ingen forklaring. Ikke bruk hjulordene SETT, LEST, HENGT, SMURT, TALT |
| K4 generelt | 22 | Kapittelet åpner på dato | Nevner åpen port om dag 21 er uløst | Godtas. Frostmodus dag 21 stenger alt til koden er inne |

Kodeord som ikke må stå i ny tekst, heller ikke inni andre ord: K1–K4 STJERNEKLART og JULEMAGI. K1–K3 også BRANNMUR, TURBO, GULROT, TURBULENS, NORDLYS, SORTERING. K1–K2 også KARAMELL, ORIGAMI, SAFRAN, MELODI, SPEKTER. K1 også KRETSKORT, KULDE, LYKT, ULRIKEN, KOMPASS. `kodelekkasje.test.ts` fanger dette. «Landås» er unntatt i testen, men er koden dag 22: ikke legg til flere.

## (d) Det som ikke endres

- Alle id-er: gjenstander, hotspots, flagg, gåter, puslespill, dialognoder. `fuglemerke` og én hotspot er nye. Ingen fjernes.
- Gåtelogikken: `kombinasjoner`, `bruker`, `forbruker`, vilkår, rutenett, hjul og svar. `fiskesnoere` forbrukes som før.
- `maal`-linjer og tips. Sporene er pynt, ikke oppgaver.
- `motor.ts`, `kobling.tsx`, `Nissespill.tsx`. Runemarkøren og `funnet` finnes fra før.
- Figurlista i `Nissespill.test.tsx` (ingen ny `figur`). Softlock-testen godtar `fuglemerke` fordi den har `ta`.
- K3 er fortsatt ett steg bak hovedhistorien, og Rampenissen bryter aldri inn utenom køen sin.

## (e) Innsats og rekkefølge

1. Hans svarer på beslutningene under.
2. Hent `mise run vurderinger --prefiks spill/` før noe lages.
3. K3 og K4: tekst, ny gjenstand, ny hotspot (rect med SoneEditor). Sjekk at SE på en gjenstand går gjennom `<Tekst>`, så runen tegnes.
4. K1 og K2: tre tekststeder.
5. `assets/objects/brevfugl/entitet.md`: nytt faktum om merkelappen. `mise run entiteter`, `node scripts/guide-innhold.mjs`, én linje i `docs/beslutninger.md`.
6. `pnpm check` og testene `Nissespill`, `kodelekkasje`, `entiteter`, `guide-innhold`.
7. Språkvask og nordlandsk-sjekk i én batch. Deretter ikonene.

Omfang: rundt 40 tekstlinjer i fire filer og 20 linjer ny data. Én agent, én PR. Ikoner: fire bilder à 1,40 kr, med omtak under 15 kr av budsjettet på 2000 kr.

## (f) Beslutninger for Hans

1. **Fargen i K3.** Vise et svakt fiolett skjær i ikonet og én setning uten fargenavn, eller vente til etter dag 24? *Anbefaling: vis det uten navn.* Barna kjenner igjen fargen på julaften, og gaven er fortsatt en overraskelse.
2. **Bunken og porten i Muren.** Inn eller ut? *Anbefaling: inn.* Julius sender brevene ned, og Rampenissen gir garnet. Ut motsier PS dag 22 og tar takken fra dag 24. Dette er et lite tillegg til en låst historie og trenger ja.
3. **Garnet som Kulde har dratt til seg (K1–K3).** Nytt lite faktum: frosten tok det røde nøstet langs linjen. *Anbefaling: ja.* Det er det som gjør K4 til en gave og ikke bare en lapp. Uten dette blir retning 4 stående alene.
4. **Merkelappen.** Egen gjenstand som hører til den blå fuglen, med ny kanon (Winter merker alle fugler som lander), eller bare en setning i teksten om bjella? *Anbefaling: egen gjenstand.* Funnkortet og ikonet er selve belønningen. Runen blir K, ikke et ord: Kulde skriver alt «SE MEG» og «ALENE» i runer på Snøfall TV (dag 10 og 13), og ett tegn er nok.

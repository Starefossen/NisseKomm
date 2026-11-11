# Beslutninger fra Hans

Datert logg over valg Hans har tatt. Sjekk her før du endrer noe som berøres. Nye beslutninger legges til nederst i riktig gruppe, med dato.

## Karakterer og tone (2026-11-10/11)

- Rampenissen ser ut som familiens ekte filtnisse (ca. 30 cm), også i Snøfall.
- Rampenissen snakker nordlandsk (Bodø/Salten) i tale: radio, korte replikker i appen, hvisking, varsler og dytt. Lengre skrevet tekst (mail, lapper, brev, dagbok) er bokmål.
- Winter er «han», pedantisk, skriver bokmål og snakker bergensk hvis han snakker.
- Flosshatten er et maktmiddel (porten, inspeksjon), ikke hverdagsbruk.
- Hjerterud erstatter Nissemor (kafeen og bakeriet). «Nissemor-guiden» beholder navnet.
- Pil er gutt og IQs lærling.
- Serie-Håkon brukes ikke, fordi han har samme navn som sønnen.
- Karakterene skal være tro mot arket. Ikke alt trenger å være politisk korrekt; litt kantete voksenhumor er velkommen.
- Julius skal være levende og engasjerende. Vi godtar noen feil i videoene framfor en Julius som ikke gjør noe.
- 2026-11-11: Rampenissen bor i familiens hus hele desember. IQ sendte ham ned direktelinjen fra loftet i Snøfall natt til 1. desember; han sitter i hylla i stua og rapporterer til Snøfall over radio og linjen. Han er ikke i Snøfall i egen person før han reiser. Hvorfor: barna skal kjenne ham som den som er fysisk hos dem.
- 2026-11-11: Rampenissens oppdrag er også det klassiske: han ser hva barna gjør og rapporterer til Julius (rapporten i videoene, Snill-listen dag 22–24). Dag 24 sies det rett ut at alle tre sto på listen. Hvorfor: det er nissens jobb, og det gir finalen en grunn.
- 2026-11-11: Dag 24: han reiser natt til 24. desember, like brått som han kom (bakpå Trixters slede når krystallet legges under treet). Om morgenen er dukken borte; gullkonvolutten med avskjedsbrevet henger der han satt i treet. Brevet er bokmål og personlig: hva han så hos hver av Kristian, Håkon og Hanna, at de sto på listen, og ett lite råd. Radioklippet dag 24 er sendt fra loftet i Snøfall etter hjemkomsten (landsbylyd bak): hilsener fra IQ, Hjerterud, Winter, Trixter og Julius i hans ord, så «te neste år». Hvorfor: avskjeden skal kjennes, og den siste hilsenen kommer hjemmefra.

## Julius-manus (2026-11-10/11)

- Ny flyt for dag 1–24 med åtte flytregler.
- Dag 1 forklarer oppdraget: NisseKomm, frosten, og at kodene holder linjen varm.
- Kulde navngis først dag 7.
- Rampenissen-sitater i Julius' replikker er på maks 7 ord (foreldrevedtak 2026-11-11).
- Flytregel 1: Et segment begynner og slutter på en hel setning med eget subjekt. Aldri fragment først, aldri pronomen som peker til forrige klipp.
- Flytregel 2: Første setning i hvert segment sier hva vi snakker om (IQ, Rampenissen, brikken). Én tanke per segment; «i natt»-segmentet har høyst tre setninger.
- Flytregel 3: Siste setning i hvert segment er en bro eller en pust, ikke en punchline («…og det var ikke alt.» / «Men hør nå.»).
- Flytregel 4: Ingen vits uten at oppsettet er i samme segment, og ingen referanse til noe som bare er i radioen eller PS-en.
- Flytregel 5: Brikken: innledning og brikke i ett segment, farvel i halen på samme eller neste. Ingen segmenter under 12 ord; farvelet er aldri alene.
- Flytregel 6: Handlingen følger teksten og varer hele segmentet; maks to segmenter på rad med ulike rekvisitter.
- Flytregel 7: Åpningen følger dag 1-malen: hilsen, dato og noe fysisk sammen. «I natt» kommer alltid før julefakta.
- Flytregel 8: Ordtak for 9 år: ingen «motsatt av det motsatte», «sier det med armene», «høre på himmelen». Test: kan Håkon gjenfortelle segmentet med én setning?
- Mailer skrives som lest etter husjakten (fortid).

## Spill (2026-11-10/11)

- Spillet heter Ugleposten, ikke Klementin-Ekspressen.
- Spilleren er Floke, Rampenissens garnugle (ikke Knerten), sett gjennom IQs kameraer.
- Ugleposten er i pikselkunst, så meta-spillet skilles fra den «ekte» Snøfall.
- Ugleposten følger hovedhistorien strengt.
- Spillene er for Håkon (9) og Kristian (12), ikke Hanna (5).
- Sledeflukt er egen app fra dag 8: retro 16-bit 3D, ringer i lufta, fri flyging på vidda, highscore per spiller.
- Sledeflukt ender i Bergen via nordlysporten dag 24. Landås vises aldri før dag 22 er løst.
- Låste ting vises (GTA-stil), unntatt noen overraskelser.
- Opplåsinger annonseres i appen med progressivt dytt, ikke i manus.
- Dag 8 heter «Lampene som Lyver».

## Hjemskjerm (2026-11-10/11)

- Julius-kortet er 4:3.
- Appene grupperes som I DAG, UTFORSK og SPILL OG MORO, med faste plasser.
- Låste apper vises med teaser.
- NISSESTATS er en overraskelse til dag 16.

## Media (2026-11-10/11)

- Én kanonisk kilde per karakter, sted og objekt: `assets/characters`, `assets/locations`, `assets/objects` og `assets/medier.json`.
- Medie-URL-er i appen beholdes.
- Ingen karakter-referansebilde sendes til videomodellen.
- Håndlagde bilder merkes `"generator": "hånd"` (se `assets/README.md`).
- Video koster kvote. Gå gjennom innholdet før dyre genereringer.

## Arbeidsform (2026-11-10/11)

- Koordinatoren delegerer blokkerende arbeid (fletting, sjekk, gjennomspilling, mediekjøringer) til underagenter.
- Porten for app-kode er `pnpm check` pluss sharded gjennomspilling.

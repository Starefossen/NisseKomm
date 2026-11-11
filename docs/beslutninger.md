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

## Julius-manus (2026-11-10/11)

- Ny flyt for dag 1–24 med åtte flytregler.
- Dag 1 forklarer oppdraget: NisseKomm, frosten, og at kodene holder linjen varm.
- Kulde navngis først dag 7.
- Rampenissen-sitater i Julius' replikker er på maks 7 ord.
- Mailer skrives som lest etter husjakten (fortid).

## Spill (2026-11-10/11)

- Spillet heter Ugleposten, ikke Klementin-Ekspressen. (AGENTS.md og noe kode bruker fortsatt det gamle navnet.)
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

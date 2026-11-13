# Siste gjennomgang før manuslås (13.11.2026)

Bare lesing. Ingen kode, tekst eller medier er endret, ingen betalte kall. Main d2cf873. Kristian 12, Håkon 9, Hanna 5.

**Lest i sin helhet:** `julius-2026.md`, `rampenissen-radio-2026.md`, `app-tekster-2026.md`, `historie-2026.md`, sjekklistene, (c) og byggeplanen i `gaater-2026.md`, `statisk_innhold.json` (varsler, filer, logg, målere), `tidbits.json`, mail og PS i `uke*_oppdrag.json`, Sledeflukt-radioen, entitetene for Trixter, brevfugl og Hjerterud, beslutningene fra 13.11.
**Lest målrettet (søk og rettepunktene fra runde 2):** Ugleposten K1–K4, `storyboard-2026.md`, Brevfugler, finalen.
**Kjørt:** `manus-check.py`, `julius-dag.py lint`, og 13 testsuiter (kodelekkasje, entiteter, strek, sjekkliste, radio-hint, guide-innhold, guide-sesong, gåtekart, Nissespill): 317 av 317 grønne.
**Ikke gjort:** hørt lyd eller sett video, sett guiden i nettleser, lest Ugleposten ord for ord (to runder er gjort før).

Bare feil er med. Smak er utelatt, og «må ikke røres»-listene fra de fire rapportene står.

## Valg for Hans ved gjennomlesing

Feilene (H1, M1–M4, L1–L4) er rettet 13.11. Disse fire står urørt til du avgjør:

1. **[VALG L5] Batteriene ved antennen:** PS dag 6 og feilrapporten dag 8 sier «batteri til 20. desember», men ingen tekst tar det opp 20.–21. Legge til en logglinje dag 21 («IQ: Batteriene ved antennen byttet. Tredje gang.»), eller la det stå?
2. **[VALG L6] ULRIKEN:** ingen tekst sier hvorfor Winter skrev ordet på vingen. En halv setning i PS dag 5, eller la det stå?
3. **[VALG L7] PS dag 17:** «Jeg har ikke hørt fra den på et år» mot 85,0 hele måneden og «noe svarte» dag 12. Bytte til «Det er første gang den svarer på noe vi har gjort.», eller beholde?
4. **[VALG L8] Kalenderlinjen dag 21:** «Rampenissen sov gjennom hele. Snorket i D-dur.» mot radioens vakt siden klokka fire. Bytte, fjerne eller beholde?

## 1. Rettingene fra forrige runde

Alle foreslåtte rettinger er inne og stemmer. Avvikene agentene gjorde:

| Avvik | Dom |
|---|---|
| 18-2 «holdt seg fast i geviret hans» | Holder. Radio og mail sier «Æ satt bakpå … og æ fløy», så han kan ha havnet i geviret. Hjelmen har fortsatt en grunn, og entiteten sier det samme. |
| Radio 12 «Julius sa i natt» | Holder. Sukk, Julius, Hjerterud til slusa, i den rekkefølgen, og stemmer med Julius 12-2 og 12-4. Merknaden i Julius-manus dag 12 siterer fortsatt «i går kveld» (bare merknad). |
| Sjekkliste dag 6 «mobilen med lyset på» | **Feil**, se M1. |
| Logg 24. des. «TRIXTER: Landet i Bergen i natt. Tre esker levert. Én nisse med hjem.» | Holder. «Bergen» er riktig for en familie som ikke har løst dag 22. |
| Utskrift i november, «Ta fram» | Holder i sjekklistene, (c) og byggeplanen. Ukedagene 28.–30.11 og 1.12 er riktige i gaater og de fem utskriftene. Én rad henger igjen, se L4. |
| Trixter: rein, nisse i hagen | Holder. Entiteten finnes, og ingen barnetekst motsier den. Barna får aldri regelen forklart; det går bra så lenge de kjenner serien. |
| Ugleposten runde 2 (A, B, C og skjæret i K3) | Inne. Én rest, se L2. |

## 2. Funn

### Høy (1)

**H1. Guiden: «Dagen i storyboardet» viser gåtene fra utkastet 10.11.** Dagvisningen (`dag/[n]/page.tsx`, `sammendrag(n)`) skriver ut hele «Dag N» fra `storyboard-2026.md`. Avsnittet «Gåte.» er gammelt på rundt 20 av 24 dager og motsier Gåtekartet og sjekklista rett over. Eksempler: dag 5 «ett skritt», «V M S J L F O»; dag 11 tre lapper; dag 18 frostlapp `T _ R B _ L _ N S`; dag 22 `12 – 1`; dag 24 `J U L E _ _ _ _`; dag 20 «bare hun får plass». En forelder som åpner bolken kl. 22, gir feil hint. Forslag: klipp «Gåte.»-avsnittet og Brikke S-sitatet ut av visningen (én linje i `sammendrag`), eller fjern bolken. Ingen manustekst berøres.

### Middels (4)

**M1. Sjekkliste dag 6: «Papprullen, mobilen med lyset på og rødt hjerte-kort i gangen».** Lista settes opp kvelden før, så mobilen ligger i gangen med lyset på hele natten. Lappen, mailen og radioen sier «den lille lampen». Forslag: «Papprullen, en liten lommelampe og rødt hjerte-kort i gangen» (ingen kodeord).

**M2. Julius 4-4 og 6-5 er for lange (modellteknisk).** 4-4 har 23 ord (15,3 s) og 6-5 har 24 ord (15,9 s); taket er 15 s og 22 ord. Begge ble endret 13.11 og skal lages på nytt. I 6-5 står brikkens slutt («henge det fra seg») rett før halen. Forslag, bare avskjeden: 4-4 «… Rudolf har den i nesa. Vi ses!» og 6-5 «… henge det fra seg. Vi ses!» (21 ord hver).

**M3. Mail dag 23: «i natt» betyr to netter.** «I natt flyr de. … Orakelet så ned i grotten i natt.» Julius og radioen samme dag sier «i kveld» om flyturen. Forslag: «I kveld flyr de.»

**M4. Dag 24, mail og radio: «tre lilla klynger» / «tre lilla klynga».** Ordet står alene, og en niåring vet ikke hva en klynge er. Manushodene sier at ordlyden skulle være «krystallbiter». Forslag: «tre lilla krystallklynger» / «krystallklynga». Radio 24 skal leses inn på nytt uansett.

### Lav (8)

- **L1. Mail dag 17:** «har brent siden 2. advent» bryter regelen fra 13.11. Forslag: «siden andre søndag i advent».
- **L2. Ugleposten K4, `brevbunken.ta`:** «vikler det opp. Lang. Sterk.» er en rest etter byttet til garn. Forslag: «Langt. Sterkt.»
- **L3. Radio, `utfordring_hint`:** dag 10 sier «rundt i stua» og «rødt filter», dag 6 «lagt det i gangen». Sjekktabellen sier at «rundt i stua» er tatt ut, og historie §3.3 forbyr «hvor». Forslag dag 10: «Rampenissen har gjemt fargene, og det trengs noe å se gjennom.»
- **L4. Guiden, to småsprik:** (c) «23. des» sier «krystall med runekort» (skal være tre ametystklynger og en fersk klementin). Dag 16 har «badeskapet» i §8 og `fysisk_hint`, «badehyllen» i sjekklista.
- **L5. Løs tråd: lysene ved antennen.** PS dag 6 og feilrapporten dag 8 sier «batteri til 20. desember». Ingen tekst tar det opp 20.–21., og måleren sier «Flere for hver natt». Én logglinje fra dag 21 lukker den, for eksempel «IQ: Batteriene ved antennen byttet. Tredje gang.»
- **L6. Løs tråd: ULRIKEN.** Barna dekoder Winters ord på vingen, men ingen tekst sier hvorfor han skrev det. Fjellet kommer igjen dag 18 og på kartet. En halv setning i PS dag 5 holder.
- **L7. PS dag 17:** «Jeg har ikke hørt fra den på et år» står mot en hel måned med 85,0 og «noe svarte» dag 12. Radio 17 ble rettet for det samme. Mulig: «Det er første gang den svarer på noe vi har gjort.» Hans avgjør; linjen er fin.
- **L8. Kalenderlinjen dag 21:** «Rampenissen sov gjennom hele. Snorket i D-dur.» Radioen sier at han har stått vakt siden klokka fire, og dagen er uten tull ellers.

Kjente rester som ikke er nye: Julius 8-1 «Æ bygde» (filmet, rettes ved omtak). Lint advarer om korte haler som kan falle bort; hør særlig 12-3 «Ingen ord.» (del av brikken) og 21-5 «Vi er her.».

## 3. Kanon fra 13.11

| Beslutning | Status |
|---|---|
| Brevfuglene, alternativ A | Holder i mail, PS, varsler, filer, radio, Sledeflukt og Ugleposten. Julius 5-2 og 14-2 er nøytrale. |
| Ametyst, «fargen kom tilbake» | Holder: Julius 24-2, mail, PS, tinebrevet, finalen. «Lilla» står ingen steder før dag 24. Se M4. |
| «God N søndag i advent» | Holder dag 6, 13 og 20 i alle flater. Unntak: L1. |
| Hjerterud | Holder. Bare K1 nevner forkleet, og det stemmer med portrettet. |
| Trixter | Holder. |
| Ingen leketøysfabrikk | Holder. |
| Mørket kom tilbake i 2025 | Holder: `hjertets-hemmelighet.txt` og notatboken. Mørket nevnes ellers ikke. |
| Tre veier | Ingen barnetekst motsier dem. Rampenissen kom ned linjen (årets premiss) og drar hjem med sleden. |

To ting Hans bør vite når han leser, ingen av dem er feil å rette:
- **Julius 24-2** holder de tre klyngene i hånda samme morgen som de ligger under treet på Landås. Det er Hans' eget valg fra 13.11.
- **Nordlyset** er brevfuglenes vei i entiteten, men dag 17 er det grottens første svar. Barna ser ikke regelen før dag 17, og Julius 17-4 («brev som kommer tilbake») binder dem sammen.

«Julenatt» brukes gjennomgående om natt til julaften (PS 18, kartet, radio 22). Det er konsekvent, og avgjørelsen fra forrige runde står fortsatt hos Hans.

## 4. Klart til lås og ikke

**Klart:**
- Julius dag 1–3, 5, 7–24 (replikkene)
- Radio dag 1–24 (klippene) og førsesongen
- Mail, PS, varsler, filer og logg for alle dager unntatt punktene under
- Ugleposten K1–K3
- Sledeflukt-radioen, tidbits (unntatt L8), finalen, Brevfugler
- Historie §1–§9 og entitetene

**Har feil igjen:**
- Guidens dagvisning (H1)
- Sjekkliste dag 6 (M1)
- Julius 4-4 og 6-5, bare avskjeden (M2)
- Mail dag 23 (M3) og dag 17 (L1)
- Mail og radio dag 24 (M4)
- K4, to ord (L2)
- Radio-hint dag 6 og 10 (L3)
- gaater (c) og dag 16 (L4)

L5–L8 er valg for Hans. De hindrer ikke lås.

**Rekkefølge:** rett M2 før Julius 4 og 6 genereres, og M4 før radio 24 leses inn. De koster penger å rette etterpå. Resten er ren tekst.

## Vurdering

Tretten funn: én høy, fire middels, åtte lave. Ingen lekkasjer og ingen brudd på dagens kanon. Den høye ligger i foreldreguiden, ikke i manus. Tekstene er klare for Hans' gjennomlesing nå; M1–M4 kan rettes først på en halvtime.

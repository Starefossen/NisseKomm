# NisseKomm - Content Guide

> Writing guidelines, Norwegian language, character voices, and puzzle design principles.

## Table of Contents

- [Norwegian Vocabulary](#norwegian-vocabulary)
- [Character Voices](#character-voices)
- [Oppdrag JSON Structure](#oppdrag-json-structure)
- [Content Principles](#content-principles)
- [Puzzle Design](#puzzle-design)
- [Rampestreker Design](#rampestreker-design-physical-mischief-scenes)

---

## Norwegian Vocabulary

### Ordliste (Complete Reference)

**UI Elements:**

- **Åpne** - Open
- **Lukk** - Close
- **Send** - Submit/Send
- **Tilbake** - Back
- **Avbryt** - Cancel
- **Bekreft** - Confirm
- **Behandler...** - Processing...
- **Laster...** - Loading...
- **Låst** - Locked
- **Fullført** - Completed
- **Ny** - New
- **Neste** - Next
- **Forrige** - Previous

**Application Modules:**

- **NisseMail** - Santa's email system (don't translate)
- **KodeTerminal** - Code Terminal
- **NisseNet Utforsker** - Santa Net Explorer
- **Kalender** - Calendar
- **EventyrOversikt** - Story Overview
- **Julius' Dagbok** - Julius' Diary
- **Brevfugler** - Paper Bird Letters (don't translate - from Snøfall universe)
- **NISSEKRYPTO** - Santa Crypto (decryption module)
- **SYMBOLSKANNER** - Symbol Scanner
- **NISSEMUSIKK** - Santa Music

**Characters (Snøfall Universe):**

- **Julius** - Santa Claus (from Snøfall)
- **Hjerterud** - Runs the bakery and café in Snøfall (warm, bubbly, slightly overwhelming)
- **Rampenissen** - The Mischievous Elf (Julius' assistant stationed with children)
- **Pil** - IQ's apprentice (eager and helpful)
- **Winter (Ole Winter)** - Julius' secretary (organizes everything)
- **IQ** - Inventor (creates gadgets and contraptions)
- **Trixter** - Julius' favorite reindeer
- **Orakelet** - The Oracle (warns of dangers and anomalies)
- **Mørket** - The Darkness (represents danger and challenges)
- **Snøfall** - The magical place where Julius lives

**Actions & States:**

- **Oppdrag** - Mission/Quest
- **Bonusoppdrag** - Side-quest
- **Eventyr** - Story Arc/Adventure
- **Gåte** - Riddle/Puzzle
- **Kode** - Code
- **Ledetråd** - Clue
- **Fysisk ledetråd** - Physical clue (scavenger hunt)
- **Hendelse** - Event
- **Beskrivelse** - Description
- **Innhold** - Content
- **Dagbokinnlegg** - Diary Entry
- **Symbol** - Symbol
- **Dekryptering** - Decryption
- **Samling** - Collection

**System Terms:**

- **System** - System (keep in English in terminal context)
- **Varsel** - Alert/Warning
- **Kritisk** - Critical
- **Advarsel** - Warning
- **Info** - Info
- **Status** - Status
- **Måling** - Metric
- **Logg** - Log

**Error Messages:**

- **Feil kode** - Wrong code
- **Tilgang nektet** - Access denied
- **Ugyldig passord** - Invalid password
- **Prøv igjen** - Try again
- **Ikke tilgjengelig ennå** - Not available yet
- **Du må fullføre hovedoppdraget først** - You must complete main quest first
- **Duplikat symbol** - Duplicate symbol
- **Ugyldig kode** - Invalid code

**Game Elements:**

- **Julekuleblåsing** - Christmas ornament glass-blowing (Snøfall tradition)
- **Brevfugler** - Paper birds that carry letters (origami-style). The kids send them; they land in the postkasse at Torget, Winter archives the letters, and the bird flies home (`assets/objects/brevfugl/entitet.md`)
- **No toy factory** - Nobody makes toys in Snøfall. IQ's workshop is for inventions; pakkesentralen packs, sorts and archives (`assets/locations/snofall-landsby/entitet.md`)
- **Grunnstein** - Foundation stone
- **Månekrystall** - Moon crystal
- **Snill liste** - Nice List
- **Slem liste** - Naughty List

---

## Character Voices

### Canonical character data

<!-- entiteter:start (mise run entiteter) -->

Generated from `assets/characters/<id>/entitet.md`, the one source for look, personality, voice, relations and facts. Edit there, then run `mise run entiteter`.

#### Floke (`assets/characters/floke/entitet.md`)

- **Navn:** Floke; **pronomen:** hun; **fra dag:** 4
- **Personlighet:** Stille, sta og observant. Sier ingenting, men gir seg aldri: dytter på ting med nebbet, stirrer på folk til de ser bort. Blåser seg opp når hun er stolt.
- **Stemme:** Ingen replikker. Hun uler lavt, blinker og dytter. Det barna «sier» gjennom henne står som «Dere (gjennom Floke)» i dialogpanelet; Rampenissen tolker og kommenterer fra hylla.
- **Forhold:** rampenissen: laget henne av garnrester på IQs loft; hun er øynene hans i Snøfall; barna: barna styrer henne gjennom IQs kameraer i Ugleposten; iq: kameraene hans sender det hun ser til skjermen på Landås
- **Aldri:** «Knerten», «Flokke»

#### Hjerterud (`assets/characters/hjerterud/entitet.md`)

- **Navn:** Hjerterud; **pronomen:** hun; **fra dag:** 1
- **Personlighet:** Sprudlende, omsorgsfull og herlig overveldende. Har alltid en klem på lur og mener bestemt at alle bekymringer, frosne tær og floker kan løses med varm kakao, nystekte boller og en skje ekstra sirup. Den naturlige motvekten til Winters stive paragrafer.
- **Stemme:** Store, varme ord; hjertelig, rask og omsorgsfull, alltid én bolle til og ett spørsmål om du har spist.
- **Forhold:** julius: venn; ikke en del av husstanden hans; pil: baker sammen; rampenissen: sendte proviant ned linjen med ham
- **Aldri:** «Nissemor», «Mor Nisse»

#### IQ (`assets/characters/iq/entitet.md`)

- **Navn:** IQ; **pronomen:** han; **fra dag:** 1
- **Personlighet:** Genial, distré og hjertevarm. Elsker tekniske ord og forkortelser. Har dårlig samvittighet i år.
- **Stemme:** Tekniske ord og ivrige forklaringer, gjerne forkortelser. Lys, rask og ivrig, mild trøndersk i lyd.
- **Forhold:** julius: sjef; pil: lærling; winter: kollega; Winter blir irritert over rotet; kulde: laget Vintervokteren for mange år siden og glemte den
- **Aldri:** «I.Q.», «Iq»

#### Julius (`assets/characters/julius/entitet.md`)

- **Navn:** Julius; **pronomen:** han; **fra dag:** 1
- **Personlighet:** Klok, varm og jordnær, en bestefar og travel håndverker. Av og til oppgitt over Rampenissen og over teknikk som svikter. Bryr seg om hvordan det går med barna.
- **Stemme:** Faderlig og vennlig, med autoritet uten å bli kald. Takker barna. Reflekterende i videologgen. Snakker inn i mikrofonen som i en radiosending, ikke inn i kameraet. Gir aldri koden selv; han peker på regelen eller ordet (historie-2026 §3.4).
- **Forhold:** rampenissen: sjef; oppgitt, men glad i ham; iq: stoler på oppfinnelsene; winter: sekretær; lar ham passe papirene; hjerterud: venn; drikker kakaoen hennes
- **Aldri:** «Julenissen Julius», «julenisse-Julius», «leketøysfabrikk», «leketøysfabrikken», «leketøyfabrikk», «leketøyfabrikken», «nissene lager leker», «verkstedet der lekene lages»

#### Pil (`assets/characters/pil/entitet.md`)

- **Navn:** Pil, PIL; **pronomen:** han; **fra dag:** 1
- **Personlighet:** Ivrig lærling, hjelpsom, spør mye og ser opp til IQ. Litt usikker, men modig.
- **Stemme:** Nysgjerrig og rask, gleder seg over alt han finner ut. Bokmål.
- **Forhold:** iq: læremester; Pil er lærlingen hans i verkstedet; hjerterud: baker sammen med henne; julius: sitter i døra på kontoret og tegner krystaller for ham
- **Aldri:** «Pila», «jenta Pil», «Pil, hun»

#### Rampenissen (`assets/characters/rampenissen/entitet.md`)

- **Navn:** Rampenissen; **pronomen:** han; **fra dag:** 1
- **Personlighet:** Entusiastisk, rotete og litt klønete. Aldri slem; alt rot er godt ment. Trenger barnas hjelp og sier det.
- **Stemme:** Lang skrevet tekst (NisseMail, lapper, avskjedsbrev, dagbok): bokmål, direkte til barna, emojier (🎄 ❄️ 🎁 ⭐), litt selvironi, Gen Alpha-slang sparsomt (høyst 2–4 per uke). Muntlig (radioklipp, Ugleposten) og korte innskudd i appen (puff, varsler, idle-linjer, kalender-sitater, Sledeflukt-radio): nordlandsk, Bodø/Salten; reglene står i docs/manus/rampenissen-radio-2026.md «Skrivemåte». Navn, steder og gåteord står som i bokmål.
- **Forhold:** julius: sjef; iq: beundrer oppfinnelsene; barna: feltagent hos familien på Landås; ser etter dem og rapporterer til Julius; trenger hjelpen deres
- **Aldri:** «Rampe-nissen», «RampeNissen»

#### Winter (`assets/characters/winter/entitet.md`)

- **Navn:** Winter, Ole Winter; **pronomen:** han; **fra dag:** 1
- **Personlighet:** Pedantisk og formell. Arkivet over barnas juleønsker er hovedjobben hans, og det viktigste han vet om. Aldri kald eller uvennlig: han brenner for at alt skal bli riktig, og blir synlig lettet, nesten mild, når alt er godkjent.
- **Stemme:** Presist og forretningsmessig, i paragrafer og lister («Paragraf 101»), med skjemanumre (4112-B). Flosshatten bare ved porten og når han opptrer formelt (FLOSSHATT i beskrivelse.txt). Skriftlig: bokmål. Muntlig (hvis han noen gang får stemme i TTS eller video): typisk bergensk, med skarre-r, «eg», «ikkje» og bergensk tonefall, men like presist og formelt. Replikkene hans i Ugleposten er lett bergensk (beslutning 2026-11-11): «eg», «ikkje», «kor», ellers bokmål, så en niåring leser dem uten å stoppe.
- **Forhold:** julius: sjef; iq: kollega, irritert over rot; barna: krever skjemaer, blir mild når alt er i orden; brevfuglene: arkiverer brevene de kommer med; hovedjobben hans er arkivet over hva alle barn ønsker seg til jul
- **Aldri:** «Ole Vinter», «fru Winter», «frøken Winter»

<!-- entiteter:slutt -->

The sections below add examples and writing advice; when they disagree with the block above, the block wins.

### Rampenissen (The Mischievous Elf)

**Role**: Julius' assistant stationed with the kids who does humorous mischiefs during advent while keeping a watchful eye on them. This year he needs the kids' help with an important mission.

**Personality**: Enthusiastic, slightly clumsy, uses emojis and occasional Gen Alpha slang

**Voice Characteristics**:

- Speaks directly to kids with excitement and genuine need for their help
- Occasional self-deprecating humor ("I'm not always the best at this...")
- Makes small mistakes but always well-meaning
- Uses emojis naturally (🎄 ❄️ 🎁 ⭐)
- Encourages real-world exploration: "Maybe check under your pillow?" or "I hid something behind a picture frame..."
- **Gen Alpha slang** (sparingly, max 2-4 per week): Skibidi, Sigma, Ohio, Brainrot, Koker, Flex, GOAT, Gyatt, Sus, Vibe, Noob, NPC, OG
- Uses slang when extra excited - maintains consistency across weeks
- Slang should feel natural and contextual, never forced
- **Spoken voice is nordlandsk (Bodø/Salten)**: the radio clips in `docs/manus/rampenissen-radio-2026.md` are written in dialect (æ, mæ, dokker, ikkje, ka/kor/kem, e/va/ska, nåkka) so the TTS voice sounds natural; the «Skrivemåte» section at the top of that file is the spelling rule. Short in-app asides in his voice (unlock nudges, alerts, idle lines, calendar quotes, Sledeflukt radio) are nordlandsk too, as quoted speech. Content, names, places and puzzle words stay as in bokmål, and long written text (NisseMail, notes, the farewell letter, his diary) stays bokmål.

**Example Emails**:

Standard tone (most emails):

> Hei! 🎄
>
> I dag må du hjelpe meg med noe veldig viktig! Julius sier at antennen ikke fungerer, men jeg aner ikke hvordan jeg skal fikse den... 😅
>
> Jeg tror jeg gjemte ledetråden et sted sikkert. Kanskje under puten din? Eller i en bok?
>
> Når du finner den, bruk NisseNet til å finne ut hva den betyr!
>
> \- Rampenissen

With occasional slang (sparingly):

> Yo! ⭐
>
> Dette oppdraget er helt sus... Julius sier at noen har rotet med inventaret, og nå er alt kaos! 😱
>
> Du er GOAT på å finne ting, så jeg trenger din hjelp!
>
> \- Rampenissen

### Julius (Santa Claus)

**Personality**: Wise but warm, occasionally exasperated by Rampenissen's antics, caring about the children's progress.

**Tone**:

- Paternal and kind
- Appreciative of children's help
- Occasionally reveals frustration with technical problems
- Reflective in diary entries
- Speaks with authority but never coldly

**Example (Dagbok)**:

> Dag 8 - Sekkproblemer
>
> Gavesekken min trenger reparasjon. Igjen. Nissene syr på den nå.
>
> Rampenissen har laget kaos med toalettpapir hjemme hos barna. Typisk.
>
> \- Julius

### Hjerterud (Bakery and Café)

**Personality**: Bubbly, warm and a little overwhelming. Runs the bakery and café; hugs, buns and cocoa. Makes sure nobody is cold or hungry. Not part of Julius' household: she lives at the café.

**Tone**: Hearty, quick, caring; always one more bun, one more question about whether you have eaten.

**Look** (`assets/characters/hjerterud/beskrivelse.txt`): 50s, round and rosy-cheeked, reddish-brown curls in a loose bun, flowered red-and-brown dress, knitted cardigan, white apron with flour dust, usually a tray of buns or a cocoa pot in hand.

### Pil (IQ's Apprentice)

**Personality**: Eager learner, helpful, asks questions, looks up to IQ.

**Tone**: Curious, excited to share discoveries, sometimes unsure but brave.

### Winter (Secretary)

**Personality**: Highly organized, detail-oriented, speaks formally.

**Tone**: Precise language, business-like but not cold, uses lists.

**Look** (`assets/characters/winter/beskrivelse.txt`, refs `ref-outside.jpg`, `ref-tophat.jpg`): late 30s, clean-shaven with dark sideburns, dark slicked-back hair, round glasses, pencil behind the ear, light beige wool coat with a grey rosette, grey waistcoat, dark grey scarf, ledgers under the arm or a clipboard.

### IQ (Inventor)

**Personality**: Genius but absent-minded, uses technical jargon, enthusiastic about gadgets.

**Tone**: Technical terminology, enthusiastic explanations, loves acronyms.

---

## Oppdrag JSON Structure

> **Denne seksjonen forklarer hvert felt i oppdrag JSON-filer og hvordan de skal brukes.**

### Oversikt over Felt-Samspill

```text
┌─────────────────────────────────────────────────────────────┐
│                    OPPDRAG FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Barn finner fysisk oppsett (rampenissen_rampestrek)      │
│           ↓                                                  │
│  2. NisseMail leses → viser tilbake til det de fant          │
│           ↓                                                  │
│  3. Fysisk hint gir gåten/puzzlet                            │
│           ↓                                                  │
│  4. Barn løser oppgaven → Taster inn kode                    │
│           ↓                                                  │
│  5. Dagbokinnlegg låses opp (BELØNNING)                      │
│           ↓                                                  │
│  6. Reveals låses opp (filer, moduler, topics)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**KRITISK TIMING:**

- 🔓 `nissemail_tekst` - Tilgjengelig fra dagens start
- 🔓 `fysisk_hint` - Fysisk i huset (foreldres oppsett)
- 🔒 `julius_ps` - Vises under Julius' video ETTER riktig kode
- 🔒 `reveals` - Låses opp ETTER riktig kode

---

### nissemail_tekst

**Hva det er**: E-post fra Rampenissen som barna leser i NisseMail-modulen.

**NisseMail leses etter at barna har vært i den fysiske verden: vis tilbake til det de har gjort, ikke gi instruksjoner for det.** Om morgenen finner de rampestreken og brikkene før de åpner appen. E-posten sier «Fant dere tråden min?», ikke «Følg tråden». Det barna må vite for å gjøre noe på stedet, står på lappen Rampenissen legger igjen der (i `fysisk_hint` og `gaater-2026.md`). E-posten peker videre til det som gjenstår i appen: Julius, NisseNet, tavla, KodeTerminal.

**Formål**:

- Fortelle at noe har skjedd, og vise tilbake til det barna har funnet
- Bygge narrativ og spenning
- Gi kontekst som komplementerer (ikke gjentar) fysisk hint
- Koble til eventyr/storyline

**Anbefalt lengde**: 150-250 ord (3-4 korte avsnitt)

**Struktur**:

1. **Åpning** (1-2 setninger): Hilsen og hook
2. **Hoveddel** (2-3 setninger): Hva har skjedd, og hva barna fant
3. **Hint** (1-2 setninger): Enkelt hint som komplementerer fysisk lapp
4. **Avslutning**: Signatur "- Rampenissen"

**Regler**:

| ✅ SKAL                           | ❌ SKAL IKKE                             |
| --------------------------------- | ---------------------------------------- |
| Vise tilbake til det de fant      | Referere til dagboken (den er låst!)     |
| Bygge spenning og narrativ        | Gjenta tekst fra fysisk lapp             |
| Gi kontekst for å forstå oppgaven | Gi bort svaret eller deler av det        |
| Peke til det som gjenstår i appen | Gi instruksjoner for fysiske handlinger  |
| Komplementere fysisk hint         | Liste opp bokstaver/tall fra fysisk lapp |

**Eksempel**:

```json
"nissemail_tekst": "Hei! 🧻 Jeg har laget en EPISK labyrint av toalettpapir i badet! Det ser ut som et kunstverk... eller kaos. Litt begge deler! 😅\n\nI midten av labyrinten ligger det en mystisk lapp med en rebus! 🤔 Den handler om noe Julius bruker hver eneste julaften når han leverer gaver...\n\nHva putter man gaver i? Og hva bærer man på ryggen? Sett dem sammen! 🎁🎒\n\n- Rampenissen"
```

---

### julius_ps

**Hva det er**: Julius' dagbok er en video (`JuliusVideo`); transkripsjonene ligger i `src/data/julius_videoer.json` (`python3 scripts/julius-transcripts.py`). Etter riktig kode vises `julius_ps` under videoen (`GameEngine.getJuliusPs(day)`). `julius_ps_bonus` erstatter den når dagens bonusoppdrag er godkjent, og `julius_ps_krypto_mangler` mens dagens dekryptering er uløst.

**Regler**: PS-en er en belønning. Den gir ikke hint til en oppgave som allerede er løst, og viser aldri en kode for tidlig (`kodelekkasje.test.ts`).

---

### fysisk_hint

**Hva det er**: Teksten på den fysiske lappen som foreldre printer/skriver og legger ut.

**Formål**:

- Inneholde selve gåten/puzzlet
- Gi nødvendig informasjon for å løse oppgaven
- Være tydelig og lesbar for barn

**Format-krav**:

- Kort og konsist (1-3 linjer)
- Tydelig formatert for utskrift
- Inkluderer nødvendig info (antall bokstaver, hints)

**Regler**:

| ✅ SKAL                         | ❌ SKAL IKKE                    |
| ------------------------------- | ------------------------------- |
| Inneholde gåten/rebuset         | Referere til dagboken           |
| Gi nok info til å løse oppgaven | Kreve digital info for å forstå |
| Være printbar og lesbar         | Være for kompleks               |

**Eksempler**:

```json
"fysisk_hint": "🎁🎁🎁 + 🎒 = ? (4 bokstaver, rimer på DEKK)"
```

```json
"fysisk_hint": "III + V + IV = ? (Romertall! I=1, V=5, X=10)"
```

```json
"fysisk_hint": "Tall på pakkene: 16, 1, 16, 9, 18. A=1, B=2, C=3..."
```

---

### rampenissen_rampestrek

**Hva det er**: Beskrivelse av den fysiske scenen foreldre setter opp.

**Formål**:

- Guide foreldre til å lage morsom, visuell scene
- Underholde yngre søsken som ikke løser puzzles
- Integrere puzzle-hintet naturlig i scenen

**Anbefalt lengde**: 3-5 setninger med tydelige visuelle detaljer.

**Struktur**:

1. **Hovedscene**: Hva har Rampenissen gjort?
2. **Kaos/konsekvens**: Hva har gått galt?
3. **Kosedyr-involvering**: Hva gjør kosedyrene?
4. **Puzzle-integrasjon**: Hvor er hintet plassert?

**Regler**:

| ✅ SKAL                           | ❌ SKAL IKKE                      |
| --------------------------------- | --------------------------------- |
| Være visuelt morsom uten tekst    | Kreve lesing for å forstå         |
| Involvere kosedyr som vitner/ofre | Bare plassere nissen med en lapp  |
| Vise kaos og konsekvenser         | Være statisk og kjedelig          |
| Integrere puzzle naturlig         | Separere underholdning fra puzzle |

**Eksempel**:

```json
"rampenissen_rampestrek": "Rampenissen har laget et 'radiostudio' med lekemikrofon, hodetelefoner (vinterøremuffer), og en haug med 'utstyr' (bokser, ledninger, pappbokser merket 'MIKSEBORD'). Kosedyrene sitter som publikum med skilt: 'APPLAUS!' og 'JUBELROP!'. Rundt ligger sangbok-sider spredd utover gulvet som 'manus'. Rampenissen holder en lapp: 'VELKOMMEN TIL RADIO SNØFALL! 🎙️ Dagens hit: Deilig er _____ Men hva heter sangen?! Jeg glemte resten! 😱'"
```

Se [Rampestreker Design](#rampestreker-design-physical-mischief-scenes) for fullstendige retningslinjer.

---

### kode

**Hva det er**: Svaret barna må taste inn i KodeTerminal.

**Formål**:

- Validere at barna har løst oppgaven
- Låse opp dagbok og reveals

**Regler**:

- Case-insensitive (SEKK = sekk = Sekk)
- Norske bokstaver støttes (Ø, Æ, Å)
- Kan være ord eller tall
- Bør være logisk utledet fra puzzle, ikke gjettbart

**Eksempler**:

```json
"kode": "SEKK"
"kode": "12"
"kode": "LUSSEKATTER"
"kode": "GRØNN"
```

---

### print_materials

**Hva det er**: Ferdig print-materiale for foreldre - klar til å klippes ut og brukes direkte.

> **Merk**: Feltet finnes i typen `Oppdrag`, men ingen dag bruker det i dag. Utskriftene ligger i `src/app/nissemor-guide/printout/filer.ts`.

**Formål**:

- Gjøre oppsett enkelt for foreldre
- Minimere papirbruk - kun det som faktisk trengs
- Separere barn-innhold fra foreldre-instruksjoner

**KRITISK - Print-Ready Prinsippet**:

> 🚨 **Alt print-materiale må være FERDIG og BRUKBART som det er.**
>
> Foreldre skal kunne printe, klippe ut, og bruke DIREKTE - ingen ekstra arbeid!

**Regler**:

| ✅ SKAL                                       | ❌ SKAL IKKE                             |
| --------------------------------------------- | ---------------------------------------- |
| Være ferdig utformet, klar til bruk           | Si "print 5 lapper med disse bokstavene" |
| Inneholde selve innholdet, ikke instruksjoner | Si "lag 3 klokker med romertall"         |
| Kunne klippes ut og brukes direkte            | Kreve at foreldre skriver/tegner selv    |
| Minimere papirbruk (kombiner på ett ark)      | Kaste bort papir på instruksjoner        |

**Hva som IKKE skal være print_materials**:

- ❌ Oppsett-guider (bruk `materialer_nødvendig` og `rampenissen_rampestrek` i stedet)
- ❌ Instruksjoner til foreldre (disse hører til i Nissemor-guiden)
- ❌ "Mal"-beskrivelser som krever videre arbeid
- ❌ Svar på oppgaven (foreldre finner dette i Nissemor-guiden)

**Hva som SKAL være print_materials**:

- ✅ Ferdig rebus-lapp med ramme
- ✅ Ferdig bokstav-kort (alle på ett ark, klippelinje markert)
- ✅ Ferdig klokke-tegninger med romertall
- ✅ Sangtekster, oppskrifter, diplomer

**Type-verdier**:

| Type          | Beskrivelse                                           |
| ------------- | ----------------------------------------------------- |
| `puzzle`      | Ferdig innhold barna ser (bokstaver, symboler, gåter) |
| `lyrics`      | Sangtekster (kulturelt innhold)                       |
| `recipe`      | Oppskrifter (kulturelt innhold)                       |
| `certificate` | Diplom/bevis for fullføring                           |

> ⚠️ **Merk**: `guide` type er fjernet - oppsett-instruksjoner hører til i Nissemor-guiden, ikke i print_materials.

**Format-krav**:

- Monospace font for bokstaver/tall/koder
- A4-vennlig layout
- Klippelinjer markert med `✂️` eller `- - - -`
- Alle elementer på færrest mulig ark

**Eksempel - GOD praksis (ferdig til bruk)**:

```json
"print_materials": [
  {
    "type": "puzzle",
    "title": "Rebus-lapp",
    "content": "╔══════════════════════════╗\n║  🎁🎁🎁 + 🎒 = ?        ║\n║  4 bokstaver             ║\n║  Rimer på DEKK           ║\n╚══════════════════════════╝"
  }
]
```

**Eksempel - DÅRLIG praksis (krever ekstra arbeid)**:

```json
// ❌ IKKE GJØR DETTE:
"print_materials": [
  {
    "type": "puzzle",
    "title": "Bokstav-lapper",
    "content": "Print 5 lapper med disse bokstavene: G, R, Ø, N, N"
  },
  {
    "type": "guide",
    "title": "Oppsett-guide",
    "content": "1. Print lappene\n2. Klipp dem ut\n3. Fest på grønne ting\nSVAR: GRØNN"
  }
]
```

**Eksempel - GOD praksis for flere elementer (alt på ett ark)**:

```json
"print_materials": [
  {
    "type": "puzzle",
    "title": "Bokstav-kort (klipp ut)",
    "content": "✂️ KLIPP UT LANGS LINJENE ✂️\n\n╔═══╗  ╔═══╗  ╔═══╗  ╔═══╗  ╔═══╗\n║ G ║  ║ R ║  ║ Ø ║  ║ N ║  ║ N ║\n╚═══╝  ╚═══╝  ╚═══╝  ╚═══╝  ╚═══╝\n- - - - - - - - - - - - - - - - -"
  }
]
```

---

### materialer_nødvendig

**Hva det er**: Liste over fysiske materialer foreldre trenger.

**Formål**: Hjelpe foreldre planlegge oppsett.

**Regler**:

- Kun ting som finnes i de fleste hjem
- Spesifiser antall når relevant
- Unngå kjøp-krevende rekvisitter

**Eksempel**:

```json
"materialer_nødvendig": [
  "3-5 toalettruller",
  "Lapp med gåte",
  "Tape",
  "Kosedyr (3-5 stk)"
]
```

---

### oppsett_tid

**Hva det er**: Estimert tid for foreldre å sette opp scenen.

**Verdier**:

| Verdi      | Tid       | Beskrivelse                |
| ---------- | --------- | -------------------------- |
| `enkel`    | 5-10 min  | Strø ting, plasser nisse   |
| `moderat`  | 10-20 min | Bygg scene, kle ut kosedyr |
| `avansert` | 20-30 min | Multi-rom, elaborate setup |

---

### beste_rom

**Hva det er**: Anbefalt rom for oppsettet.

**Eksempler**:

```json
"beste_rom": "Bad"
"beste_rom": "Stue"
"beste_rom": "Kjøkken/spisestue"
"beste_rom": "Flere rom (gang, stue, kjøkken)"
```

---

### requires og reveals

**Hva det er**: Avhengigheter og opplåsninger.

**requires** - Hva som må være fullført før denne dagen:

```json
"requires": {
  "topics": ["brevfugl-organisering"],
  "completedDays": [3, 5]
}
```

**reveals** - Hva som låses opp etter fullføring:

```json
"reveals": {
  "files": ["julesanger-samling.txt"],
  "topics": ["julesanger"],
  "modules": ["BREVFUGLER"]
}
```

---

### eventyr

**Hva det er**: Kobling til overordnet storyline (eventyr).

```json
"eventyr": {
  "id": "spokelseskoden",
  "phase": 3
}
```

---

### Metadata-felt

| Felt       | Type   | Beskrivelse                            |
| ---------- | ------ | -------------------------------------- |
| `dag`      | number | Dag 1-24                               |
| `tittel`   | string | Dagens tittel                          |
| `hendelse` | string | Spesiell hendelse (Lucia, Nobel, etc.) |

---

## Content Principles

### Humorous and Playful Tone

**All dialogues** should be lighthearted and entertaining.

**Guidelines**:

- Keep tone light and fun
- Include age-appropriate jokes
- Use situational humor (Rampenissen's mishaps)
- Avoid sarcasm that kids might misunderstand
- Balance humor with story progression

### Rooted in Snøfall Universe

Reference locations, characters, and magical elements naturally.

**Key References**:

- **Snøfall** - The magical village where Julius lives
- **Julekuleblåsing** - Ornament-making tradition
- **Brevfugler** - Paper birds for letter delivery
- **Characters** - Mention Pil, Winter, IQ, Trixter in context
- **Mørket** - The Darkness as antagonist

**Guidelines**:

- Integrate lore naturally into puzzles
- Don't assume kids have watched series
- Make universe references enhance, not confuse

### Overarching Themes

Magic, friendship, and adventure should be woven throughout:

**Magic**: Technology feels magical, codes unlock secrets, symbols have powers

**Friendship**: Rampenissen relies on child's help, Julius appreciates collaboration

**Adventure**: Daily quests build tension, discoveries feel meaningful

### Cultural References

Include subtle nods to Norwegian Christmas traditions:

- Julebord, Nisseporridge, Lucia (Dec 13), Adventsstjerne, Julenissen

**Balance**: Don't over-explain traditions, let context provide meaning.

---

## Puzzle Design

### Praktiske Begrensninger (Hovedregler)

> **Hovedregel**: Oppgaver må være **overkommelige** for foreldre å sette opp.

**Oppsett-krav**:

- **Maks 2-3 bevegelige deler** per oppgave
- **Unngå spesial-rekvisitter** - bruk ting som finnes hjemme
- **Oppsett-tid**: 5-15 minutter normalt, maks 20 min
- **Realistisk antall**: Maks 10-15 fysiske objekter
- **Enkle materialer**: Papir, saks, tape, tusj, kosedyr

| ✅ Overkommelig          | ❌ For ambisiøst             |
| ------------------------ | ---------------------------- |
| 5-10 papir-snøfnugg      | 1000 snøfnugg                |
| 3 klokker med lapper     | Kompleks multi-steg dekoding |
| Bokstaver på grønne ting | Spesial-utskrift + UV-lys    |

### NisseNet Fil-Policy

> **Unngå inflasjon**: Ikke alle oppgaver trenger en fil i NisseNet.

**Retningslinjer**:

- **Maks 3-5 nye filer per uke**
- **Filer kun når de tilfører puzzle-verdi**
- **Essensiell vs. valgfri**: Fil må være NØDVENDIG, ikke "nice to have"

**Når trengs en fil**:

- ✅ Dekoder som oversetter fysiske symboler → bokstaver
- ✅ Informasjon som MÅ kombineres med fysisk ledetråd
- ❌ Ekstra lore som ikke påvirker puzzle
- ❌ Gjentakelse av informasjon fra nissemail

### Physical-Digital Bridge (CRITICAL)

**Both clues are required** - Puzzles must be designed so that neither the physical note nor the digital clue alone provides the complete answer.

**Design Pattern Examples**:

1. **Physical has cipher key** → Digital has encoded message
2. **Physical has coordinates** → Digital map shows locations
3. **Physical emoji-rebus** → Digital context clue → Solve phrase
4. **Physical observation task** → Digital validation data

**Rule**: Kids should need to move between real world and digital HQ multiple times.

### Difficulty & Complexity

**Target**: Challenging for ages 9-12, requiring genuine problem-solving.

**Guidelines**:

- **NOT too easy** - Avoid puzzles solvable by just reading the clue
- **Multi-step required** - Combine information from multiple sources
- **Thinking time** - Should take 10-30 minutes with exploration
- **No guessing** - Solutions should be logical and discoverable

### Puzzle Type Variety

#### 1. Emoji-Rebus (Norwegian Classic)

Emojis represent a phrase, movie title, saying, or location.

- 🌟 + ⚔️ = "Stjernekrigen" (Star Wars)
- 🎅 + 🏠 = "Snøfall"

#### 2. Cipher Challenges

Caesar cipher, substitution cipher, symbol replacement, A=1 system.

#### 3. Research Puzzles

Encyclopedia lookup, book references, online search, family knowledge.

#### 4. Logic & Math Puzzles

Coordinate calculations, pattern sequences, riddles with math.

#### 5. Observation Challenges

Spot the difference, count objects, color/shape matching.

#### 6. Word Puzzles

Anagrams, crossword clues, acrostics, missing letters.

#### 7. Memory & History Puzzles

Reference previous days - requires kids to remember or look back.

### Progressive Difficulty

**Days 1-8: Foundation** (Easier)

- Introduce physical-digital flow
- Simple ciphers, direct scavenger hunts
- Build confidence

**Days 9-16: Escalation** (Medium)

- Multi-step ciphers
- Start referencing previous days
- Require combining 3+ clues

**Days 17-24: Mastery** (Harder)

- Complex puzzles requiring research
- Heavy callback to previous days
- Multi-day puzzle chains

### Multi-modal and mixed-age sibling design (ages 5 to 12)

When designing for a sibling group spanning ages 5, 9, and 12 (Hanna 5, Håkon 9, Kristian 12), standard single-track puzzles fail. Either the 12-year-old solves the cipher in ten seconds while the 5-year-old watches, or the puzzle relies on simple counting that bores the older kids.

#### 1. Information asymmetry over difficulty scaling

Split what each child _holds_ or _knows_ rather than giving the youngest child a separate, easier puzzle. None of the three roles can complete the mission alone:

- **The Oracle (age 5, Hanna):** Controls the physical visual key, color filter, symbol card, or picture map. Five-year-olds match shapes, colors, and spatial positions quickly. When the youngest sibling holds the red acetate lens or the physical QR symbol card, the older siblings must ask her what she sees.
- **The Field Agent (age 9, Håkon):** Handles kinetic exploration and physical assembly. Nine-year-olds want to crawl under tables, trace strings down the hallway, count blinking LEDs, or build the aluminum-foil antenna (Day 11) and prism lantern (Day 16).
- **The Systems Operator (age 12, Kristian):** Operates the CRT desktop modules (`SnøfallTV`, `NisseKrypto`, `NisseNetUtforsker`, `KodeTerminal`). He tunes frequencies between 85.0 and 108.0 MHz and cross-references digital files, but the terminal is useless until the 5-year-old and 9-year-old deliver their physical findings.

#### 2. State-changing physical artifacts

In 2026 only the red-reveal lens (day 10) and the fold sheet (day 14) are used. Screen tracing and punched stencils are ideas for later seasons (`todo.md`).

Avoid relying solely on four-letter passwords written on sticky notes. Use physical props that transform when manipulated:

| Artifact                       | Mechanism                                                                                                                                              | Best role fit          |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| **Red-reveal scanner lens**    | Red cellophane mounted in a cardboard frame. Viewing a note printed with red noise patterns hides the noise and reveals cyan letters underneath.       | Age 5 (Oracle)         |
| **Fold-and-align blueprint**   | An IQ schematic with broken lines that form letters or numbers only when folded along dotted registration arrows.                                      | Age 9 (Field Agent)    |
| **Screen-to-paper tracing**    | A translucent baking-paper map held directly against the CRT monitor on `SnøfallTV` CAM 2 to align physical landmarks with glowing screen coordinates. | Ages 9 and 12 together |
| **Punched stencil card**       | A card with cut-out windows placed over a specific page in a household book or NisseNet printout to isolate the password letters.                      | Age 12 (Operator)      |
| **Flashlight silhouette tube** | A paper stencil taped inside a cardboard roll; shining a flashlight through it in a dark December hallway projects a symbol onto the wall.             | Age 5 and Age 9        |

#### 3. Diegetic media over text blocks

Children between 6 and 12 scan interfaces like detectives and skip long paragraphs. Keep screen text under 80 words per view and embed clues inside tools that behave like real elf equipment:

- **Surveillance anomalies:** Spot Kulde's ice cave bleeding through `SnøfallTV` camera feeds via analog RF multipath ghosting rather than reading about it in an email.
- **Active frequency tuning:** Sweep the `SnøfallTV` dial (`85.0` to `108.0 MHz`) through static until the carrier wave locks in.
- **Acoustic telemetry:** Hide code fragments inside functional tools like the 12-track 8-bit jukebox (`NisseMusikk`) and bird radar (`Brevfugler`).

#### 4. Weekday vs. weekend pacing

Respect real family mornings in December:

- **School mornings (Monday to Thursday):** Keep the total loop under 7 minutes. Spot the Rampenisse scene, grab one physical fragment, check one TV channel or NisseNet file, and submit the code before breakfast ends.
- **Friday cliffhangers and weekends (Friday to Sunday):** Reserve multi-room hunts, physical building challenges (Days 11 and 16), and 3-symbol `NisseKrypto` decryptions (Days 12, 18, and 23) for days when the family has 20 to 30 minutes.
- **Physical trophy wall:** Maintain a physical board next to the computer where kids tape their 9 collected symbol cards, folded blueprints, and decoded notes across all 24 days.

---

## Rampestreker Design (Physical Mischief Scenes)

> **Critical Principle**: The mischief should stand on its own for the youngest children (6-8 years). The visual scene must be entertaining WITHOUT reading the clues.

### Design Philosophy

**Rampestreker** serve TWO purposes:

1. **Visual entertainment** for younger siblings who can't solve puzzles
2. **Physical clue delivery** for the puzzle-solving children

**The scene itself must be funny and immediately understandable by just looking at it.**

### What Makes a Great Rampestrek

#### ✅ GOOD Rampestreker (Visual Comedy)

- **Clear action visible**: "Something happened here!"
- **Chaos and mess**: Scattered items, fallen towers
- **Rampenissen caught in the act**: Guilty expression
- **Props and costumes**: Bandanas, hats, glasses
- **Kosedyr involvement**: As witnesses, victims, or accomplices
- **Physical comedy**: Things that fell over, got tangled

**Examples**:

- Veltet tårn av kopper med skyldig nisse
- Marshmallow-krig med fort og "sårede" kosedyr
- Pirat-scene med skattkiste og mannskap
- Radiostudio med kaotisk utstyr

#### ❌ WEAK Rampestreker (Static/Boring)

- Just sitting somewhere with a note
- "Looking at" something without interaction
- No visible action or consequence
- Requires reading to understand
- No kosedyr involvement
- Clean, organized scenes

### Visual Checklist

For every rampestrek, check:

- [ ] **Umiddelbart morsomt?** Barn ler når de ser det?
- [ ] **Synlig handling?** Noe har SKJEDD her?
- [ ] **Rampenissen involvert?** Ikke bare til stede?
- [ ] **Kosedyr med?** Vitner, ofre, medsammensvorne?
- [ ] **Kaos/konsekvens?** Ikke rent og pent?
- [ ] **Fungerer uten tekst?** 5-åring kan le?

### Rampestrek Categories

1. **Kaos** - Veltet tårn, søl, eksplodert eksperiment
2. **Rollespill** - Pirat, DJ, detektiv, kokk
3. **Krig/Kamp** - Marshmallow-krig, putefestning
4. **Tabbe** - Spist noe, mistet noe, ødelagt ved uhell
5. **Ambisiøs** - Prøvde noe for stort → ramlet

### Setup Complexity

| Nivå     | Tid       | Beskrivelse                |
| -------- | --------- | -------------------------- |
| Enkel    | 5-10 min  | Strø ting, plasser nisse   |
| Moderat  | 10-20 min | Bygg scene, kle ut kosedyr |
| Avansert | 20-30 min | Multi-rom, elaborate setup |

### Reference

See [rampestreker.txt](./rampestreker.txt) for 170+ categorized ideas.

---

**Last Updated**: December 2025
**Maintained By**: AI Coding Agents

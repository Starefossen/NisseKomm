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
- **Nissemor** - Julius' wife
- **Rampenissen** - The Mischievous Elf (Julius' assistant stationed with children)
- **Pil** - Julius' apprentice (eager and helpful)
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
- **Brevfugler** - Paper birds that carry letters (origami-style)
- **Grunnstein** - Foundation stone
- **Månekrystall** - Moon crystal
- **Snill liste** - Nice List
- **Slem liste** - Naughty List

---

## Character Voices

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

### Nissemor (Julius' Wife)

**Personality**: Practical, organized, supportive parent figure.

**Tone**: Gentle but firm, patient, warm and encouraging.

### Pil (Apprentice)

**Personality**: Eager learner, helpful, asks questions, looks up to Julius.

**Tone**: Curious, excited to share discoveries, sometimes unsure but brave.

### Winter (Secretary)

**Personality**: Highly organized, detail-oriented, speaks formally.

**Tone**: Precise language, business-like but not cold, uses lists.

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
│  1. NisseMail vises → Forteller hvor ting er gjemt          │
│           ↓                                                  │
│  2. Barn finner fysisk oppsett (rampenissen_rampestrek)      │
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
- 🔒 `dagbokinnlegg` - Låses opp ETTER riktig kode
- 🔒 `reveals` - Låses opp ETTER riktig kode

---

### nissemail_tekst

**Hva det er**: E-post fra Rampenissen som barna leser i NisseMail-modulen.

**Formål**:

- Fortelle at noe har skjedd og hvor ting er gjemt
- Bygge narrativ og spenning
- Gi kontekst som komplementerer (ikke gjentar) fysisk hint
- Koble til eventyr/storyline

**Anbefalt lengde**: 150-250 ord (3-4 korte avsnitt)

**Struktur**:

1. **Åpning** (1-2 setninger): Hilsen og hook
2. **Hoveddel** (2-3 setninger): Hva har skjedd, hvor er ting gjemt
3. **Hint** (1-2 setninger): Enkelt hint som komplementerer fysisk lapp
4. **Avslutning**: Signatur "- Rampenissen"

**Regler**:

| ✅ SKAL                           | ❌ SKAL IKKE                             |
| --------------------------------- | ---------------------------------------- |
| Fortelle hvor ting er gjemt       | Referere til dagboken (den er låst!)     |
| Bygge spenning og narrativ        | Gjenta tekst fra fysisk lapp             |
| Gi kontekst for å forstå oppgaven | Gi bort svaret eller deler av det        |
| Komplementere fysisk hint         | Liste opp bokstaver/tall fra fysisk lapp |

**Eksempel**:

```json
"nissemail_tekst": "Hei! 🧻 Jeg har laget en EPISK labyrint av toalettpapir i badet! Det ser ut som et kunstverk... eller kaos. Litt begge deler! 😅\n\nI midten av labyrinten ligger det en mystisk lapp med en rebus! 🤔 Den handler om noe Julius bruker hver eneste julaften når han leverer gaver...\n\nHva putter man gaver i? Og hva bærer man på ryggen? Sett dem sammen! 🎁🎒\n\n- Rampenissen"
```

---

### dagbokinnlegg

**Hva det er**: Julius' dagbok-innlegg som låses opp ETTER koden er løst.

**Formål**:

- Belønning for å ha løst oppgaven
- Fortelle om Julius' dag i Snøfall
- Løst referere til dagens tema (rød tråd)
- Kommentere Rampenissens rampestrek

**Anbefalt lengde**: 80-150 ord (3-4 korte avsnitt)

**Struktur**:

1. **Overskrift**: "Dag X - [Tema]"
2. **Hoveddel** (2-3 korte avsnitt): Julius' dag i Snøfall
3. **Rampenissen-referanse** (1 setning): Løs kommentar om rampestreken
4. **Signatur**: "- Julius"

**Regler**:

| ✅ SKAL                                    | ❌ SKAL IKKE                                 |
| ------------------------------------------ | -------------------------------------------- |
| Være ren fortelling fra Julius' perspektiv | Gi hint til oppgaven (den er allerede løst!) |
| Referere løst til dagens tema              | Forklare løsningsmetoden                     |
| Kommentere Rampenissens rampestrek         | Inneholde instruksjoner                      |
| Føles som en belønning                     | Være nødvendig for å løse oppgaven           |

**Eksempel**:

```json
"dagbokinnlegg": "Dag 8 - Sekkproblemer\n\nGavesekken min trenger reparasjon. Igjen. Nissene syr på den nå. Spurte hvor mye vekt den kan bære. De bare lo nervøst.\n\nTestet den nye magiske sekken ved å putte inn 500 gaver. Den holdt! Men så kom jeg ikke ut av verkstedet fordi sekken ikke passet gjennom døren.\n\nRampenissen har laget kaos med toalettpapir hjemme hos barna. Typisk.\n\n- Julius"
```

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
  "id": "brevfugl-mysteriet",
  "phase": 3
}
```

---

### Metadata-felt

| Felt        | Type    | Beskrivelse                                     |
| ----------- | ------- | ----------------------------------------------- |
| `dag`       | number  | Dag 1-24                                        |
| `tittel`    | string  | Dagens tittel                                   |
| `hint_type` | string  | Type hint (skrevet, spor, arrangement, visuell) |
| `hendelse`  | string  | Spesiell hendelse (Lucia, Nobel, etc.)          |
| `finalized` | boolean | Om innholdet er ferdig gjennomgått              |

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

### Multi-modal and mixed-age sibling design (ages 6 to 12)

When designing for a sibling group spanning ages 6, 9, and 11, standard single-track puzzles fail. Either the 11-year-old solves the cipher in ten seconds while the 6-year-old watches, or the puzzle relies on simple counting that bores the older kids.

#### 1. Information asymmetry over difficulty scaling

Split what each child _holds_ or _knows_ rather than giving the youngest child a separate, easier puzzle. None of the three roles can complete the mission alone:

- **The Oracle (age 6):** Controls the physical visual key, color filter, symbol card, or picture map. Six-year-olds match shapes, colors, and spatial positions quickly. When the youngest sibling holds the red acetate lens or the physical QR symbol card, the older siblings must ask her what she sees.
- **The Field Agent (age 9):** Handles kinetic exploration and physical assembly. Nine-year-olds want to crawl under tables, trace strings down the hallway, count blinking LEDs, or build the aluminum-foil antenna (Day 11) and prism lantern (Day 16).
- **The Systems Operator (age 11):** Operates the CRT desktop modules (`SnøfallTV`, `NisseKrypto`, `NisseNetUtforsker`, `KodeTerminal`). He tunes frequencies between 85.0 and 108.0 MHz and cross-references digital files, but the terminal is useless until the 6-year-old and 9-year-old deliver their physical findings.

#### 2. State-changing physical artifacts

Avoid relying solely on four-letter passwords written on sticky notes. Use physical props that transform when manipulated:

| Artifact                       | Mechanism                                                                                                                                              | Best role fit          |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| **Red-reveal scanner lens**    | Red cellophane mounted in a cardboard frame. Viewing a note printed with red noise patterns hides the noise and reveals cyan letters underneath.       | Age 6 (Oracle)         |
| **Fold-and-align blueprint**   | An IQ schematic with broken lines that form letters or numbers only when folded along dotted registration arrows.                                      | Age 9 (Field Agent)    |
| **Screen-to-paper tracing**    | A translucent baking-paper map held directly against the CRT monitor on `SnøfallTV` CAM 2 to align physical landmarks with glowing screen coordinates. | Ages 9 and 11 together |
| **Punched stencil card**       | A card with cut-out windows placed over a specific page in a household book or NisseNet printout to isolate the password letters.                      | Age 11 (Operator)      |
| **Flashlight silhouette tube** | A paper stencil taped inside a cardboard roll; shining a flashlight through it in a dark December hallway projects a symbol onto the wall.             | Age 6 and Age 9        |

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
- [ ] **Fungerer uten tekst?** 6-åring kan le?

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

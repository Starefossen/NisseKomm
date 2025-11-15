# NisseKomm - Implementation Guide

> Complete specifications for game mechanics, user flows, and component behaviors

## Game Philosophy

NisseKomm bridges the physical and digital worlds through 5 interconnected systems. Children help Rampenissen by solving challenges that require exploration in **BOTH** the real world (searching for physical clues) and the digital headquarters (investigating files in the CRT terminal).

**Core Design Principles**:

- 🏠 **Physical-first**: Success requires getting up, searching, exploring the real environment
- 💻 **Digital validation**: The HQ is where kids validate discoveries and receive rewards
- 🧩 **Cross-world puzzles**: Clues from one world unlock progress in the other
- 📚 **Building on history**: Later challenges reference earlier days, encouraging memory and review
- 👨‍👩‍👧‍👦 **Family collaboration**: Designed for siblings and parents to help search and solve together

**The Physical-Digital Flow**: Email with riddle → search house → find physical clue → decode with digital files → enter code in terminal → unlock content

## Table of Contents

- [1. Oppdrag (Daily Quests)](#1-oppdrag-daily-quests)
- [2. Bonusoppdrag (Side Quests)](#2-bonusoppdrag-side-quests)
- [3. Eventyr (Story Arcs)](#3-eventyr-story-arcs)
- [4. Nice List & Name Registration](#4-nice-list--name-registration)
- [5. Symboler & NisseKrypto](#5-symboler--nissekrypto)
- [Component Behaviors](#component-behaviors)
- [System Flows](#system-flows)

## 1. Oppdrag (Daily Quests)

### Overview

Main gameplay loop with 24 daily missions (December 1-24). Each quest requires finding clues in the **PHYSICAL WORLD** that reveal codes for the **DIGITAL HQ**.

**The Physical-Digital Bridge**:

Rampenissen sends daily emails with riddles. Kids must search their real-world environment (house, yard, etc.) for hidden clues that reveal the digital code. This creates a scavenger hunt experience where **the computer is the destination, not the entire game**.

**Key Principle**: The physical clue is essential - kids can't solve by just reading the email. They must get up, explore, and search their real environment. The digital HQ is where they validate their discoveries and receive rewards.

### Complete User Flow

1. **Boot System**
   - Child enters boot password: `NISSEKODE2025`
   - System validates and plays success beep
   - Desktop icons fade in with CRT effect

2. **Check Email (DIGITAL)**
   - Opens **NisseMail** from desktop
   - Unread badge (red dot) visible on icon
   - Reads daily mission from Rampenissen
   - Mission includes: riddle, hint about where to search physically

3. **Search House (PHYSICAL)**
   - Follow riddle hints to search real-world locations
   - Check under pillows, in books, behind pictures, in drawers
   - Parents may have hidden physical notes or objects
   - Find physical clue with hints or partial codes

4. **Connect Clues (PHYSICAL + DIGITAL)**
   - Physical clue provides essential information (cipher key, coordinates, emoji-rebus, etc.)
   - May need to cross-reference with digital files in NisseNet
   - **Both sources required** - neither physical nor digital alone provides complete answer
   - May require external research (encyclopedia, online search, asking family)
   - Some puzzles reference previous days' information (check old emails/diary)
   - Combine all sources to determine the final code
   - 📖 **Complete puzzle design guidelines** → [CONTENT_GUIDE.md#puzzle-design](./CONTENT_GUIDE.md#puzzle-design)

5. **Submit Code**
   - Opens **KodeTerminal** from desktop
   - Types code (case-insensitive)
   - Clicks "SEND" button
   - 1.5s processing animation: "SJEKKER......"

6. **Success Feedback**
   - Gold flash animation
   - Success beep sound
   - Code persisted to localStorage
   - Appears in terminal history

7. **Unlocks**
   - Julius' diary entry revealed (in Dagbok)
   - Calendar day marked with gold checkmark
   - Potential module unlocks (NISSEKRYPTO day 4, NISSEMUSIKK day 6)
   - Badge awards for special days

### Technical Implementation

**Quest Data Structure** (`src/data/uke1-4_oppdrag.json`):

```json
{
  "dag": 12,
  "tittel": "Frosne Koder",
  "kode": "HJERTE2024",
  "fysiskLedetråd": "Finn det røde hjertet i sofaen",
  "epost": {
    "fra": "Rampenissen",
    "emne": "Hjertene holder hemmeligheter!",
    "innhold": "Hei! I dag må du finne symbolene..."
  },
  "dagbokinnlegg": "I dag oppdaget jeg...",
  "reveals": {
    "modules": ["NISSEKRYPTO"],
    "files": ["hemmeligheter/hjerte_koder.txt"]
  }
}
```

**Code Validation**:

- Normalizes input (trim, uppercase)
- Case-insensitive comparison
- Persists to localStorage on success
- Timestamps submission
- Returns boolean success/failure

**Progress Tracking**:

- `GameEngine.getCompletedDays()` returns completed quest days
- `GameEngine.getUnlockedModules()` returns available modules
- Module unlocks based on quest completion
- All progress stored in localStorage via StorageManager

### Parent Controls

**Nissemor Guide** (`/nissemor-guide`):

- **"Fullfør ett oppdrag"** - Complete single specific day
- **"Fullfør alle oppdrag"** - Testing/demo mode (completes all 24 days)
- **Module unlock toggles** - Manual module enabling/disabling

## 2. Bonusoppdrag (Side Quests)

### Overview

Optional crisis resolution missions with **parent validation**. Encourages parent-child collaboration and critical thinking beyond code entry.

### Current Bonusoppdrags

**Day 11: Antenne-krise**

- **Type**: Signal/communication crisis
- **Badge**: "ANTENNE-INGENIØR"
- **Auto-resolve**: Day 13 (if not manually resolved)
- **Description**: Satellite antenna malfunction disrupts Snøfall communications

**Day 16: Inventar-kaos**

- **Type**: Inventory management crisis
- **Badge**: "INVENTAR-EKSPERT"
- **Auto-resolve**: Day 18 (if not manually resolved)
- **Description**: Workshop inventory system chaos

### Complete User Flow

1. **Prerequisites**
   - Main quest for that day MUST be completed first
   - Bonusoppdrag appears in NisseMail with crisis indicator
   - Sidebar shows active crisis status (red alert)

2. **Read Crisis Description**
   - Opens NisseMail
   - Crisis email from Julius or Orakelet
   - Describes problem requiring creative solution

3. **Child Attempts Solution**
   - Varies by quest type:
     - **Antenna**: Adjust signal parameters
     - **Inventory**: Organize items logically
   - May involve physical activity or problem-solving

4. **Parent Validation**
   - Opens **KodeTerminal**
   - Special "BONUS" indicator visible
   - **Parent validation checkbox** appears
   - Parent reviews child's solution

5. **Submit with Validation**
   - Parent checks validation box
   - Submits bonusoppdrag code
   - System validates both code AND parent checkbox

6. **Rewards**
   - Badge awarded automatically
   - Crisis resolved (sidebar alert clears)
   - Special congratulations message
   - Badge visible in profile/stats

### Technical Implementation

**Quest Structure**:

```json
{
  "dag": 11,
  "bonusoppdrag": true,
  "crisisType": "antenna",
  "kode": "SIGNAL2024",
  "epost": {
    "fra": "Orakelet",
    "emne": "⚠️ KRISE: Antennen svikter!",
    "innhold": "Noe er galt med kommunikasjonen..."
  }
}
```

**Validation Logic**:

- Requires BOTH code submission AND parent validation checkbox
- Main quest must be completed before bonus becomes accessible
- Badge awarded automatically on completion
- Crisis status updated in sidebar
- Uses GameEngine facade for all state operations

**Crisis Status Tracking**:

- `GameEngine.getCrisisStatus()` returns all crisis states
- Individual crisis resolution can be checked
- Auto-resolution happens 2 days after crisis starts (ensures progression)
  - Day 11 Antenna → Auto-resolves Day 13
  - Day 16 Inventory → Auto-resolves Day 18

### Design Principle

Bonusoppdrags balance optional challenge with guaranteed progression. Parents validate real-world problem-solving, not just code entry.

## 3. Eventyr (Story Arcs)

### Overview

Multi-phase narrative quests spanning 8-10 days with escalating challenges. Creates overarching narrative tension across weeks.

### Current Eventyr

**Eventyr 1: "Jakten på Snøfallens Grunnstein"**

- **Days**: 3-12 (9 phases)
- **Theme**: Finding the foundation stone of Snøfall
- **Badge**: "GRUNNSTEIN-VOKTER"

**Eventyr 2: "Nattens Magi og Månekrystallet"**

- **Days**: 14-24 (9 phases)
- **Theme**: Night magic and moon crystal
- **Badge**: "MÅNEKRYSTALL-MESTER"

### Phase Structure

**Phase 1-2: Setup**

- Introduction to mystery
- Initial clues and characters
- Establishes stakes

**Phase 3-6: Investigation**

- Gathering evidence
- Solving sub-puzzles
- Progressive revelations
- Rising tension

**Phase 7-8: Climax**

- Confronting main challenge
- Using accumulated knowledge
- High-stakes decisions

**Phase 9: Resolution**

- Mystery solved
- Reward ceremony
- Badge awarded
- Setup for next eventyr (if applicable)

### User Flow

1. **Automatic Unlock**
   - Eventyr phase unlocks on specific day
   - No manual activation required
   - Appears in EventyrOversikt module

2. **Progress Tracking**
   - Complete daily main quests
   - Eventyr phases advance automatically
   - Visual progress indicator in EventyrOversikt

3. **Phase Completion**
   - Each phase tied to specific quest day
   - Phase content revealed in diary
   - Narrative continuity maintained

4. **Final Reward**
   - Last phase awards completion badge
   - Special finale message from Julius
   - Badge visible in profile

### Technical Implementation

**Story Data** (`src/data/eventyr.json`):

```json
{
  "id": "eventyr1",
  "navn": "Jakten på Snøfallens Grunnstein",
  "beskrivelse": "En urgammel hemmelighet...",
  "startDag": 3,
  "sluttDag": 12,
  "faser": [
    {
      "fase": 1,
      "dag": 3,
      "tittel": "Mysteriet begynner",
      "innhold": "Julius oppdager noe rart..."
    }
  ],
  "badge": "grunnstein-vokter"
}
```

**Progress Calculation**:

- `GameEngine.getEventyrProgress(eventyrId)` tracks phase completion
- Returns: total phases, completed count, current phase, completion status
- Phases unlock automatically when corresponding quest day is completed
- Badge awarded on final phase completion

**Badge Awarding**:

- Badge automatically awarded when all eventyr phases complete
- Checked via `GameEngine.getEventyrProgress()`
- Stored via `StorageManager.addEarnedBadge()`

### UI Module

**EventyrOversikt** (`windows/EventyrOversikt.tsx`):

- Unlocks on Day 8
- Shows both eventyr with progress bars
- Phase-by-phase breakdown
- Visual timeline with checkmarks

## 4. Nice List & Name Registration

### Overview

Personal connection to Julius' official Snill & Slem liste through name registration and finale message. Creates emotional payoff for completed journey.

### Timeline

**Day 22: Name Registration**

- Modal appears after code submission
- Prompt: "REGISTRER DITT NAVN"
- Player enters name (or uses default "Et snilt barn")
- Stored in localStorage

**Day 23: Nice List Appearance**

- Names appear at top of `snill_slem_liste.txt`
- File accessible in NISSENET
- Unread indicator (🔴) appears on file
- Placeholder text: "[VIL BLI OPPDATERT]"

**Day 24: Grand Finale**

- Julius' emotional finale message added
- Trophy badge "julekalender-fullfort" awarded
- Celebration modal with badge reveal

### Complete User Flow

1. **Day 22 Code Submission**
   - Child completes Day 22 quest
   - Submits correct code
   - Success animation plays

2. **Name Entry Modal**
   - Modal appears automatically
   - Title: "REGISTRER DITT NAVN"
   - Input field with placeholder
   - "Lagre" button (or "Hopp over")

3. **Name Storage**
   - Validates non-empty input
   - Stores via `StorageManager.addPlayerName(name)`
   - Confirmation message
   - Modal closes

4. **Day 23 Nice List Update**
   - Opens NISSENET Utforsker
   - Navigates to "SNILL & SLEM LISTE"
   - File shows unread indicator
   - Opens file

5. **Dynamic Injection**
   - Player name(s) appear at top
   - Format: "✓ [Barnets Navn] - SNILL"
   - Example names below (Georg, Viljar, Marcus)
   - Placeholder: "[PLASS TIL FLERE NAVN]"

6. **Day 24 Finale**
   - Completes final quest
   - Nice List updates with finale message
   - Trophy badge awarded
   - Grand finale modal (4 stages)

### Technical Implementation

**Name Storage**:

- `StorageManager.addPlayerName(name)` adds name to list
- `StorageManager.getPlayerNames()` retrieves all names
- Multiple names supported (siblings)
- Persists across sessions

**Dynamic File Injection**:

- Nice List file (`snill_slem_liste.txt`) dynamically updated
- Player names injected at top on Day 23+
- Format: `✓ [Name] - SNILL`
- Finale message injected on Day 24 completion
- Template placeholders replaced with actual data

**Unread Tracking**:

- `StorageManager.hasUnreadNiceList()` checks if list viewed
- `StorageManager.setNiceListViewed()` marks as read
- `StorageManager.setNisseNetLastVisit()` timestamp tracking
- Red badge appears on NisseNet icon when unread

**Badge Awarding** (Day 24):

- Trophy badge "julekalender-fullfort" awarded on Day 24 completion
- Triggers 4-stage grand finale modal automatically
- Badge visible in NisseStats and profile

### Static Content Structure

**`statisk_innhold.json`**:

```json
{
  "filer": [
    {
      "navn": "snill_slem_liste.txt",
      "innhold": "=== JULIUS' OFFISIELLE LISTE ===\n\nSNILL LISTE:\n\n[PLASS TIL FLERE NAVN]\n\n✓ Georg - SNILL\n✓ Viljar - SNILL\n✓ Marcus - SNILL\n\n{{UPDATE_DATE}}\n\n{{FINALE_MESSAGE}}"
    }
  ]
}
```

### UI Components

**NameEntryModal** (`ui/NameEntryModal.tsx`):

- Retro window chrome
- VT323 font input
- Validation feedback
- Skip option

**GrandFinaleModal** (`ui/GrandFinaleModal.tsx`):

- 4-stage reveal animation
- Trophy badge display
- Julius' congratulations
- Reference to Nice List

## 5. Symboler & NisseKrypto

### Overview

Physical treasure hunt combined with digital puzzle-solving. Kids find 9 hidden symbol cards, then solve 3 progressive decryption challenges.

### 5.1 Symbol Collection System

#### The 9 Symbols

**3 Hearts** (emotions):

- `heart-green` - Growth and hope
- `heart-red` - Warmth and love
- `heart-blue` - Cold and sadness

**3 Suns** (light):

- `sun-green` - Life and energy
- `sun-red` - Fire and passion
- `sun-blue` - Ice and frost

**3 Moons** (mystery):

- `moon-green` - Dreams and wishes
- `moon-red` - Danger and warning
- `moon-blue` - Peace and calm

#### Physical Collection Flow

**1. Parent Setup**

- Visits `/nissemor-guide/symboler`
- Clicks "PRINT ALLE KORT"
- Browser print dialog opens
- Prints 9 symbol cards (3×3 grid per page)
- Cuts out cards along dotted lines
- Hides around house strategically

**QR Code Generation**:

- Library: `qr-code-styling`
- Pattern: Black/white QR code
- Center: Colored symbol icon (60% size)
- Data: Symbol code (e.g., "heart-green")
- Manual code printed below QR

**2. Child Collection**

- Opens **SYMBOLSKANNER** desktop module
- Finds physical card in house
- **Option A**: Scans QR code with device camera
- **Option B**: Enters manual code from card
- Symbol validation and feedback
- Progress: "X/9 SYMBOLER FUNNET"

**3. Parent Manual Addition** (Fallback)

- Nissemor Guide → Symboler page
- Clicks "LEGG TIL ETT SYMBOL"
- Prompt with symbol selector
- Confirms addition
- Used if card lost or QR not working

#### Technical Implementation

**Symbol Definitions**:

- 9 predefined symbols with metadata
- Each has: code, type, color, displayName, icon, colorHex
- Types: heart, sun, moon
- Colors: green, red, blue
- All symbols defined in `lib/systems/symbol-system.ts`

**Collection Method**:

- `GameEngine.collectSymbolByCode(code)` validates and stores symbol
- Returns: success, symbol object, message, isDuplicate flag
- Prevents duplicate collection
- Norwegian feedback messages
- Persists via StorageManager

**QR Scanner Component**:

- Uses Html5QrcodeScanner library
- Auto-starts camera on mount
- Proper MediaStream cleanup on unmount
- Permission error handling
- Device capability checking
- LED management for mobile devices

**Error Handling**:

- **Permission denied** → Instructions to enable camera
- **No camera found** → Fallback to manual entry
- **Scanner init failure** → Retry button
- **Invalid code** → Clear error message in Norwegian
- **Duplicate** → Friendly "already found" message

#### Parent Controls

**Nissemor Guide - Symboler Page** (`/nissemor-guide/symboler`):

- **PRINT ALLE KORT** → Browser print dialog
- **LEGG TIL ETT SYMBOL** → Manual addition prompt
- **VIS STATUS** → X/9 collection progress
- Navigation: Hovedside | Symboler | Eventyr

### 5.2 NisseKrypto Decryption Challenges

#### 3 Progressive Challenges

**Challenge 1: "Frosne Koder"** (Day 12)

- **Requirements**: 3 hearts
- **Difficulty**: Easy (3-symbol sequence)
- **Unlocks**: Secret file in NisseNet
- **Message**: Meaning of heart colors

**Challenge 2: "Stjernetegn"** (Day 18)

- **Requirements**: 6 symbols (3 hearts + 3 suns)
- **Difficulty**: Medium (6-symbol sequence)
- **Unlocks**: Julius' star navigation secrets
- **Message**: How hearts and suns guide Santa

**Challenge 3: "Hjertets Hemmelighet"** (Day 23)

- **Requirements**: All 9 symbols
- **Difficulty**: Hard (9-symbol sequence)
- **Unlocks**: Julius' deepest secrets
- **Badge**: "KODE-MESTER"
- **Message**: Mastery celebration

#### Challenge Flow

1. **Availability Check**
   - Challenge visible when required symbols collected
   - Locked challenges show symbol requirements
   - Locked icon with tooltip

2. **Challenge Selection**
   - Opens **NISSEKRYPTO** module
   - List shows 3 challenges
   - Click to select active challenge

3. **Symbol Placement**
   - **Left grid**: SYMBOLSAMLING (inventory)
   - **Right grid**: DEKRYPTERINGSGITTER (solution)
   - Drag symbols from left to right
   - Position numbers show placement order

4. **Sequence Submission**
   - Click "TEST KODE" button
   - Position-sensitive validation
   - 1.5s processing delay

5. **Feedback**
   - **Correct** → Gold animation, secret message
   - **Incorrect** → Red shake, "X/Y riktig plassert"
   - Attempt counter increments

6. **Completion**
   - Files unlock in NisseNet
   - Badge awarded (Challenge 3)
   - Congratulations message

#### UI Features

**Dual Grid System**:

- Left: Inventory (all collected symbols)
- Right: Solution grid (empty slots)
- Visual drag-drop with touch support

**Visual Feedback**:

- Gold border → Correct symbol/position
- Red border → Wrong symbol/position
- Pulsing → Ready to submit
- Gray → Locked slot

**Attempt Tracking**:

- Counter shows number of tries
- Encouragement messages after 3+ attempts
- No penalty for failures

**Contextual Hints**:

- Each challenge has thematic hint
- Hints reference Snøfall lore
- Never reveal exact answer

**Help Section**:

- Step-by-step instructions
- First-time user guidance
- Toggle open/close

#### Technical Implementation

**Challenge Data** (`uke2-4_oppdrag.json`):

```json
{
  "dag": 12,
  "decryption_challenge": {
    "id": "frosne-koder",
    "navn": "Frosne Koder",
    "requiredSymbols": ["heart-green", "heart-red", "heart-blue"],
    "correctSequence": ["heart-red", "heart-green", "heart-blue"],
    "messageWhenSolved": "Hjerter holder nøkkelen til...",
    "unlocksFiles": ["hemmeligheter/hjerte_magi.txt"]
  }
}
```

**Validation**:

- Position-sensitive sequence validation
- Returns: correct boolean, correct count, total required
- Persists solution on success
- Increments attempt counter on failure
- Provides partial feedback ("X/Y riktig plassert")

**Completion Check**:

- `GameEngine.isDecryptionSolved(challengeId)` checks specific challenge
- `GameEngine.getSolvedDecryptions()` returns all completed challenges
- Badge awarded on Challenge 3 completion

**Error Handling**:

- Graceful fallback for missing data
- Prevents incomplete submissions
- Duplicate symbol prevention
- Norwegian error messages

### Design Philosophy

**Physical-Digital Bridge**: Combines real-world treasure hunting with digital puzzle-solving. Parents hide cards strategically, siblings help search.

**Progressive Difficulty**: Each challenge requires more symbols and harder sequences. Builds mastery over time.

**Family Collaboration**: Parents manage physical setup, children solve digital puzzles. Encourages teamwork.

**Replay Value**: Parents can re-hide cards for younger siblings in future years. QR codes remain valid.

## Component Behaviors

### NisseMail (`windows/NisseMail.tsx`)

**Split View Layout**:

- 30% inbox list (left)
- 70% email content (right)
- Responsive: stacks on mobile

**Read Tracking**:

- Mark email as viewed when selected
- Persist to localStorage
- Unread indicators update in real-time

**Unread Indicators**:

- Red dot on desktop icon
- "NY" badge on inbox item
- Gold sender text for unread

**Inbox Sorting**:

- Newest first (day 24 at top)
- Reverse chronological order
- Consistent with terminal aesthetic

**Selection Priority**:

1. Calendar-selected day (if opened from calendar)
2. Current day's mission
3. First unread email
4. First mission (fallback)

**Integration**:

- "ÅPNE TERMINAL" button opens KodeTerminal
- Pre-fills day context
- Seamless navigation

### Dagbok (`windows/Dagbok.tsx`)

**Standalone Module**:

- Core desktop icon (gold book)
- Positioned after EVENTYR
- Quest-gated entries

**Continuous Scroll**:

- Single-column timeline
- Vertical layout
- Smooth scrolling

**Unread Tracking**:

- Red badge shows count
- Counts entries with day > last read
- Updates in real-time

**Auto-scroll**:

- On open, centers first unread entry
- `scrollIntoView({ block: 'center', behavior: 'smooth' })`
- Smooth animation

**Read Detection**:

- IntersectionObserver watches entries
- 3 seconds at 50%+ visibility = read
- Updates last read day

**Visual Styling**:

- Dotted separators: `border-top: 2px dotted var(--neon-green)/50`
- Unread: Full opacity + pulsing gold
- Read: 70% opacity
- Eventyr badges: Small gold text

**Empty State**:

- Placeholder when no quests completed
- Encouraging message
- CRT-style formatting

### Kalender (`windows/Kalender.tsx`)

**Day States**:

- **Locked**: Future dates
  - Gray color
  - Lock icon
  - No interaction
- **Available**: Current/past dates without codes
  - Neon green glow
  - Hover effect
  - Clickable
- **Completed**: Dates with submitted codes
  - Gold color
  - Checkmark icon
  - Golden glow
  - Clickable for review

**Interaction Flow**:

1. Click available/completed day
2. Modal appears with mission preview
3. Shows: title, excerpt, status
4. "VIS OPPDRAG" button
5. Opens NisseMail for that day

**Grid Layout**:

- 6 columns × 4 rows = 24 days
- Responsive: 3 cols mobile, 4 cols tablet, 6 cols desktop
- Equal spacing with gap

## System Flows

### Boot Sequence

**1. Boot Animation** (configurable)

- Shows "ENISSEKJERNE 3.8] LASTER..."
- Progress bar animation
- Duration: `NEXT_PUBLIC_BOOT_ANIMATION_DURATION` (default 2s)
- Set to 0 to skip

**2. Password Challenge**

- Terminal-style input
- Validates against `NEXT_PUBLIC_BOOT_PASSWORD`
- Case-insensitive matching
- Escalating error messages:
  - Attempt 1: "Feil passord. Prøv igjen."
  - Attempt 2: "Feil passord! Er du sikker?"
  - Attempt 3+: "Kontakt Nissemor for hjelp!"

**3. Success**

- Success beep sound
- Persist authentication: `StorageManager.setAuthenticated(true)`
- Play jingle if sounds enabled

**4. Desktop Launch**

- Fade in sidebar and icons
- CRT flicker effect
- Ready for interaction

### Validation Logic

**Code Submission** (`KodeTerminal.tsx`):

1. User types code in input field
2. Clicks "SEND" button
3. **Processing**:
   - Show "SJEKKER......" animation (1.5s)
   - Disable input during processing
   - Play processing sound

4. **Validation**:
   - Compare to `oppdrag[day].kode`
   - Case-insensitive match
   - Trim whitespace

5. **Success**:
   - Gold flash animation
   - Success beep
   - Persist: `StorageManager.addSubmittedCode()`
   - Add to terminal history
   - Show success message

6. **Failure**:
   - Red shake animation
   - Error beep
   - Do NOT persist
   - Show error: "FEIL KODE. PRØV IGJEN."
   - Input clears

**Important**: Only correct codes are stored. Keeps localStorage clean and progress tracking simple.

---

**Last Updated**: November 2025
**Maintained By**: AI Coding Agents

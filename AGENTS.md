# NisseKomm - Development Guide for AI Agents

> **Important**: Keep this document updated when making changes to the project. Always run `npm run check` at the end of coding sessions to verify code quality. Assume the dev server is already running at <http://localhost:3000>.
>
> **Do NOT create new markdown files** (like SUMMARY.md, CHANGES.md, etc.) to document your work unless explicitly requested by the user.

## Project Overview

**NisseKomm** is a playful Christmas calendar app for children (ages 9-12) that runs December 1-24. Kids solve daily riddles by entering codes, unlocking Julius' diary and exploring a retro CRT-style terminal interface. The aesthetic is inspired by fictional in-game computer terminals (like GTA) with a nostalgic, pixelated look.

**Core Experience**: Boot up a password-protected "command center" → receive daily emails from Rampenissen → solve riddles → enter codes in terminal → unlock content → track progress on calendar.

**Universe**: Based on the Snøfall TV series universe - Julius (Santa) lives in Snøfall with Nissemor and the elves, sending missions to children through Rampenissen.

**Key Snøfall Elements**:

- **Julekuleblåsing** - Making Christmas ornaments by glass blowing
- **Brevfugler** - Paper birds that carry letters from children (can be folded origami-style)
- **Themes**: Magic, friendship, and overcoming dangers together
- **Characters**: Pil (apprentice), Winter (secretary), IQ (inventor), Trixter (reindeer), Orakelet (oracle), Mørket (the darkness)

**Dialogue & Content Principles**:

- **Humorous and playful** - All dialogues from Rampenissen, Julius, and other characters should be lighthearted and entertaining
- **Rooted in Snøfall universe** - Reference locations, characters, and magical elements from the TV series naturally
- **Overarching themes**: Magic, friendship, and adventure should be woven throughout all narrative elements
- **Rampenissen's voice**: Enthusiastic, slightly clumsy, uses emojis, speaks directly to kids with excitement and occasional self-deprecating humor
- **Julius' voice**: Wise but warm, occasionally exasperated by Rampenissen's antics, caring about the children's progress
- **Balance**: Keep humor age-appropriate while being genuinely entertaining for both kids and parents reading along
- **Cultural references**: Include subtle nods to Norwegian Christmas traditions and Snøfall lore without overwhelming the main narrative
- **Length**: Keep emails and diary entries concise (2-4 short paragraphs) to maintain engagement

**Challenges and Puzzles**:

- **Age-appropriate**: Riddles should be challenging yet solvable by children aged 9-12, sometimes requiring creative thinking or adult collaboration
- **Varied formats**: Include word puzzles, simple ciphers, pattern recognition, and observational challenges
- **Logical progression**: Each day's riddle should build on knowledge or clues from previous days without being too repetitive
- **Progressive difficulty**: Start with easier puzzles and gradually increase complexity over the 24 days
- **Physical-Digital Bridge**: Each day includes a **scavenger hunt clue** that leads to objects/locations in either the real world or within the digital interface, which then reveal the **digital code** to enter in KodeTerminal (stored in `fysiskLedetråd` field in mission JSON)
- **Dual-layer puzzles**: The scavenger hunt (physical or digital) provides context and engagement, while the digital code validates completion and unlocks content
- **Hints system**: Provide optional hints that can be unlocked after multiple failed attempts, but hints should only guide thinking and never reveal the answer directly

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (utility-first, custom properties for colors)
- **Pixelarticons** (retro icon set) instead of emojis
- **Web Audio API** (sound effects)
- **localStorage** (persistence layer via StorageManager)

## Design Philosophy

### Visual Language

**Retro CRT Terminal** - Think 1980s computer monitor:

- Fake monitor frame with thick bezels
- Animated scanlines and CRT glow effects
- Pixelated borders and vignette overlay
- No smooth edges: `image-rendering: pixelated`

**Christmas Color System**:

- **Neon Green** `#00ff00` - Primary (UI, text, success)
- **Christmas Red** `#ff0000` - Errors and warnings
- **Gold** `#ffd700` - Achievements and completed states
- **Cold Blue** `#00ddff` - Secondary info and hints
- **Dark CRT** `#0a1a0a` - Background (deep green-black)
- **Gray** `#666666` - Disabled/locked elements

**Typography**: VT323 monospace pixel font (Google Fonts) for authentic terminal feel

### Interaction Principles

- **Playful, not realistic**: Exaggerated animations and visual feedback
- **Every action has feedback**: Clicks trigger sounds and animations
- **Fake processing delays**: 1.5s delays simulate "system thinking"
- **Blinking LEDs and scanlines**: Constant motion for retro atmosphere
- **Norwegian language**: All UI text, errors, and content

## Architecture Concepts

### Layout Pattern

```text
┌─ CRT Frame (fullscreen) ───────────────┐
│ ┌─ Sidebar (25%) ─┬─ Main (75%) ─────┐ │
│ │ System Status   │ Desktop Icons    │ │
│ │ Alert Feed      │ or Active Window │ │
│ └─────────────────┴──────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Concepts**:

- **Single window paradigm**: Only one app window open at a time (desktop icons hide when window opens)
- **Persistent sidebar**: Always shows system metrics and scrolling alerts
- **Modal windows**: Centered overlays with retro window chrome
- **Desktop grid**: 2×3 icon layout (4 core modules + 4 unlockable modules)

### Application Modules

**Core Desktop (Always Available)**:

1. **NisseMail** - Email inbox showing daily missions from Rampenissen (unread badge on icon)
2. **KodeTerminal** - Code submission interface with validation and history
3. **NisseNet Utforsker** - File browser with Julius' diary and hint files
4. **Kalender** - 24-day grid showing locked/available/completed states

**Unlockable Modules** (appear in slots as codes are completed):

1. **NisseMusikk** - Christmas music player (Snøfall Radio)
2. **Snøfall TV** - Live camera feed from workshop
3. **Brevfugler** - Personal letters from Julius (unlocks day 14)
4. **NisseStats** - Live statistics dashboard from Snøfall

### State Management Philosophy

**StorageManager Pattern** (`lib/storage.ts`):

- Centralized localStorage abstraction
- All persistence goes through StorageManager (no direct localStorage calls)
- Type-safe methods for each data type
- Easy to swap for backend API later

**Key State Types**:

- **Authentication**: Boot password verification (persistent)
- **Progress**: Completed day codes (persistent)
- **Read Status**: Viewed emails per day (persistent)
- **Preferences**: Sound/music toggles (persistent)
- **UI State**: Open window, selected day (session-only in React state)

**React State Usage** (in `page.tsx`):

- Keep minimal state in components
- Load persistent data from StorageManager on mount
- Update both StorageManager and local state together
- Use lazy initialization to avoid loading flashes

## Data Architecture

**Content Files** (in `src/data/`):

- **`uke1_oppdrag.json`** through **`uke4_oppdrag.json`** - All 24 daily missions split across 4 weeks with codes, physical clues, and diary entries
- **`statisk_innhold.json`** - File system, alerts, system metrics (non-mission content)

**Mission Structure**:

```typescript
{
  dag: number,              // Day 1-24
  tittel: string,           // Mission title
  nissemail_tekst: string,      // Riddle/puzzle description
  kode: string,             // Expected answer code
  dagbokinnlegg?: string,   // Julius' diary entry (shown when day ≤ current)
  hendelse?: string         // Optional calendar event label
}
```

**Content Principles**:

- Mission content drives diary unlocking (diary shows all entries up to current day)
- File system includes hints and flavor text in Norwegian
- Julius' diary written from Snøfall perspective (mentions Rampenissen with kids)
- All content stored in JSON for easy editing without code changes

## Game Mechanics

### 1. Oppdrag (Daily Quests)

**Overview**: Main gameplay loop with 24 daily missions (December 1-24).

**User Flow**:

1. Child boots up system with password `NISSEKODE2025`
2. Opens **NisseMail** to read daily mission from Rampenissen
3. Solves riddle/puzzle (age-appropriate, 9-12 years)
4. Finds physical clue (scavenger hunt: `fysiskLedetråd` field)
5. Physical clue reveals **digital code** (e.g., "SNØBALL2024")
6. Opens **KodeTerminal** and submits code
7. Success → Unlocks Julius' diary entry + calendar checkmark + potential modules

**Technical Implementation**:

- Quest data: `src/data/uke1-4_oppdrag.json` (source of truth)
- Code validation: `GameEngine.submitCode(code, expected, day)`
- Persistence: `StorageManager.addSubmittedCode(day, code, timestamp)`
- Unlocks: Diary entries, desktop modules (NISSEKRYPTO at day 4, NISSEMUSIKK at day 6, etc.)

**Parent Controls**:

- Nissemor Guide → "Fullfør ett oppdrag" (complete single day)
- "Fullfør alle oppdrag" (testing/demo mode)

---

### 2. Bonusoppdrag (Side Quests)

**Overview**: Optional crisis resolution missions with **parent validation**.

**Current Bonusoppdrags**:

- **Day 11: Antenne-krise** (Antenna malfunction) → Awards "ANTENNE-INGENIØR" badge
- **Day 16: Inventar-kaos** (Inventory chaos) → Awards "INVENTAR-EKSPERT" badge

**User Flow**:

1. Complete main quest first (bonusoppdrag locked until main quest done)
2. Read crisis description in NisseMail
3. Child attempts solution (varies by quest type)
4. Opens **KodeTerminal** with special validation checkbox
5. Parent reviews solution and validates with checkbox
6. Submits code → System awards badge + resolves crisis

**Technical Implementation**:

- Bonus quest flag: `oppdrag.bonusoppdrag === true`
- Crisis types: `oppdrag.crisisType` ("antenna" | "inventory")
- Badge awarding: `GameEngine.awardBadge(crisisType)`
- Parent validation: Required checkbox in KodeTerminal UI
- Crisis status: `GameEngine.getCrisisStatus()` → UI indicators in sidebar

**Design Principle**: Bonusoppdrags encourage parent-child collaboration and critical thinking beyond code entry.

---

### 3. Eventyr (Story Arcs)

**Overview**: Multi-phase narrative quests spanning 8-10 days with escalating challenges.

**Current Eventyr**:

- **Eventyr 1**: "Jakten på Snøfallens Grunnstein" (Days 3-12, 9 phases)
- **Eventyr 2**: "Nattens Magi og Månekrystallet" (Days 14-24, 9 phases)

**Phase Structure**:

- **Phase 1-2**: Introduction and mystery setup
- **Phase 3-6**: Investigation and challenge progression
- **Phase 7-8**: Climax and resolution
- **Phase 9**: Conclusion and reward

**User Flow**:

1. Eventyr unlocks automatically on specific day (phase 1)
2. Child completes daily main quests to progress eventyr
3. Eventyr phases advance as related quests complete
4. Final phase awards completion badge

**Technical Implementation**:

- Story data: `src/data/historier.json`
- Progress tracking: `GameEngine.getEventyrProgress(eventyrId)`
- Badge awarding: Automatic on final phase completion
- UI: **EventyrOversikt** module (desktop icon unlocks day 8)

**Design Philosophy**: Eventyr creates overarching narrative tension across weeks, giving context to daily puzzles and building anticipation.

---

### 4. Symboler & NisseKrypto (Symbol Collection + Decryption)

**Overview**: Physical treasure hunt combined with digital puzzle-solving. Kids find 9 hidden symbol cards, then solve 3 progressive decryption challenges.

#### 4.1 Symbol Collection System

**The 9 Symbols**:

- **3 Hearts** (green, red, blue) - `heart-green`, `heart-red`, `heart-blue`
- **3 Suns** (green, red, blue) - `sun-green`, `sun-red`, `sun-blue`
- **3 Moons** (green, red, blue) - `moon-green`, `moon-red`, `moon-blue`

**Physical Collection Flow**:

1. **Parent Setup**:
   - Visit `/nissemor-guide/symboler` (dedicated symbols management page with navigation)
   - Print all 9 symbol cards (each has QR code with embedded symbol icon in center + manual code)
   - QR codes generated using `qr-code-styling` library with colored dots matching symbol color
   - Cut out cards and hide around house (inside books, behind pictures, in drawers, etc.)

2. **Child Collection**:
   - Opens **SYMBOLSKANNER** module on desktop
   - Finds physical card in house
   - Scans QR code OR enters code manually (e.g., "heart-green")
   - Symbol added to collection (duplicates rejected)
   - Progress tracked: X/9 symbols collected

3. **Parent Manual Addition** (fallback):
   - Nissemor Guide → Symboler page → "Legg til ett symbol"
   - Select symbol from prompt
   - Manually add if child lost card or QR not working

**Technical Implementation**:

- Symbol definitions: `GameEngine.getAllSymbols()` (9 DecryptionSymbol objects with full metadata)
- Collection method: `GameEngine.collectSymbolByCode(code)` → validates, checks duplicates, returns detailed result
- Persistence: `StorageManager.addCollectedSymbol(symbol)` + `StorageManager.hasSymbol(code)` for duplicate checking
- UI Components:
  - `SymbolScanner.tsx` (303 lines) - QR scanner with auto-start, camera management, error handling
  - `nissemor-guide/symboler/page.tsx` (357 lines) - QR generation + printout + management
- QR Generation: `qr-code-styling` library with black/white QR codes and colored symbol icons (60% size) embedded
- Camera Management: Proper MediaStream cleanup on unmount, explicit track stopping, DOM clearing
- **CRITICAL**: Symbols are NOT automatically awarded on quest completion (parents must hide physical cards)

**Error Handling in SymbolScanner**:

- Permission denied → User-friendly message with instructions
- No camera found → Device capability check with helpful error
- Scanner initialization failure → Retry button with error context
- Invalid/duplicate codes → Clear feedback messages in Norwegian
- Camera LED management → Explicit video track stopping prevents LED staying on

**Parent Controls** (on `/nissemor-guide/symboler`):

- "Print alle kort" → Opens browser print dialog
- "Legg til ett symbol" → Manual addition with prompt
- "Vis status" → View collection progress (X/9 collected)
- Navigation menu at top links to Hovedside, Symboler, Eventyr

**Nissemor Guide Navigation**:

- Three main sections accessible via top navigation:
  - 📋 HOVEDSIDE: Quest management, module unlocks, admin tools
  - 🎁 SYMBOLER: Symbol cards, QR codes, collection management
  - 📖 EVENTYR: Story arc visualization and progress tracking

#### 4.2 NisseKrypto Decryption Challenges

**3 Progressive Challenges**:

1. **Challenge 1** (Day 12): "Frosne Koder" - Requires 3 hearts
   - Correct sequence unlocks secret file in NisseNet
   - Message reveals the meaning of heart colors (growth, warmth, cold)
   - Difficulty: Easy (3-symbol sequence)

2. **Challenge 2** (Day 18): "Stjernetegn" - Requires 6 symbols (3 hearts + 3 suns)
   - Unlocks Julius' star navigation secrets
   - Message explains how hearts and suns guide Santa's path
   - Difficulty: Medium (6-symbol sequence)

3. **Challenge 3** (Day 23): "Hjertets Hemmelighet" - Requires all 9 symbols
   - Final challenge unlocks Julius' deepest secrets
   - Message celebrates mastery of the complete symbol system
   - Awards "KODE-MESTER" status
   - Difficulty: Hard (9-symbol sequence)

**Challenge Flow**:

1. Challenge becomes "available" when required symbols collected
2. Opens **NISSEKRYPTO** module (unlocked Day 9)
3. Select challenge from list (shows required symbol types)
4. Drag symbols from SYMBOLSAMLING (left grid) to DEKRYPTERINGSGITTER (right grid)
5. Position numbers show placement order
6. Click "TEST KODE" to submit sequence
7. **Correct** → Gold animation + secret message + files unlocked in NisseNet
8. **Incorrect** → Red shake + "X/Y riktig plassert" feedback + attempt counter

**UI Features**:

- **Dual Grid System**: Inventory (left) and solution grid (right) side-by-side
- **Visual Feedback**: Gold border = correct, red border = wrong position
- **Attempt Tracking**: Counts tries and shows encouragement after multiple attempts
- **Contextual Hints**: Each challenge includes thematic hint from storyline
- **Symbol Preview**: Challenge list shows which symbol types are required
- **Help Section**: Step-by-step instructions for first-time users

**Technical Implementation**:

- Challenge data: `oppdrag.decryption_challenge` (requiredSymbols, correctSequence, messageWhenSolved)
- Validation: `GameEngine.isDecryptionSolved(challengeId)` - Check completion status
- Submission: `GameEngine.validateDecryptionSequence(challengeId, sequence)` - Position-sensitive validation
- Persistence: `StorageManager.addDecryptionSolution(challengeId, sequence)` - Save solutions
- Attempt tracking: `StorageManager.incrementDecryptionAttempts(challengeId)` - Count failures
- UI: `NisseKrypto.tsx` (520 lines) - Drag-drop interface with challenge selector

**Error Handling**:

- Graceful fallback if challenge data missing
- Validation prevents incomplete submissions
- Duplicate symbol prevention in same position
- Clear error messages in Norwegian for all failure cases

**Design Philosophy**:

- **Physical-Digital Bridge**: Combines real-world treasure hunting with digital puzzle-solving
- **Progressive Difficulty**: Each challenge requires more symbols and harder sequences
- **Family Collaboration**: Parents hide cards strategically; siblings can help search
- **Replay Value**: Parents can re-hide cards for younger siblings in future years

---

## Development Practices

## Coding Conventions

### TypeScript

- Use **strict mode**
- Define interfaces for all data structures
- Prefer `interface` over `type` for objects
- Use proper typing for props (no `any`)

### React

- Functional components with hooks
- Use `'use client'` directive when needed (state, effects, browser APIs)
- Keep components small and focused
- Extract reusable logic into custom hooks if needed

### Styling

- **Tailwind utility classes only** (no custom CSS in components)
- **Use Tailwind CSS v4 syntax**: `bg-(--neon-green)`, `text-(--gold)`, `border-(--christmas-red)` instead of `bg-[var(--neon-green)]`, etc.
- Use CSS custom properties from `globals.css` for colors
- Apply animations via Tailwind classes referencing keyframes
- Use `className` composition for conditional styles
- **Contrast rule**: Use `text-black` on bright backgrounds (neon green, gold) for readability

### Norwegian Language

- All UI text, labels, and messages in Norwegian
- File/folder names in Norwegian (e.g., "OPPGAVER", "LOGGER")
- Error messages in Norwegian
- Comments in English (for code clarity)
- **Use the vocabulary list below** to ensure consistency

#### Norwegian Vocabulary (Ordliste)

Consistent terms used throughout the application:

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

**Application Modules:**

- **NisseMail** - Santa's email system (don't translate)
- **KodeTerminal** - Code Terminal
- **NisseNet Utforsker** - Santa Net Explorer
- **Kalender** - Calendar
- **Brevfugler** - Paper Bird Letters (don't translate - from Snøfall universe)
- **Julius Dagbok** - Santa's Diary

**Characters:**

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
- **Gåte** - Riddle/Puzzle
- **Kode** - Code
- **Hendelse** - Event
- **Beskrivelse** - Description
- **Innhold** - Content
- **Dagbokinnlegg** - Diary Entry

**System Terms:**

- **System** - System (keep in English in terminal context)
- **Varsel** - Alert/Warning
- **Kritisk** - Critical
- **Advarsel** - Warning
- **Info** - Info
- **Status** - Status
- **Måling** - Metric

**Error Messages:**

- **Feil kode** - Wrong code
- **Tilgang nektet** - Access denied
- **Ugyldig passord** - Invalid password
- **Prøv igjen** - Try again
- **Ikke tilgjengelig ennå** - Not available yet

### File Organization

- One component per file
- Co-locate related components (windows/, modules/, ui/)
- Keep utility functions in lib/
- Centralize types in types/
- Single source of truth for content (data/uke1-4_oppdrag.json and data/statisk_innhold.json)
- **All quest loading, validation, and game logic centralized in game-engine.ts**

## Bonusoppdrag System

**Centralized in GameEngine** (`lib/game-engine.ts`):

- `GameEngine.isBonusOppdragCompleted(day)` - Check if a side-quest is completed (handles both code and parent validation)
- `GameEngine.isBonusOppdragAccessible(day)` - Check if side-quest is accessible (main quest completed first)
- `GameEngine.awardBadge(crisisType)` - Award crisis resolution badges and resolve crises
- `GameEngine.getCrisisStatus()` - Get current status of all crises (antenna, inventory)

**Current Bonusoppdrags** (derived from oppdrag JSON files - source of truth):

- **Day 11: Antenne-krise** (Signal crisis) - Parent validation, awards "ANTENNE-INGENIØR" badge
- **Day 16: Inventar-kaos** (Inventory chaos) - Parent validation, awards "INVENTAR-EKSPERT" badge
- **Day 14: TODO** - Consider adding a new side-quest here

**Important Design Principle**: ALL quest data (main and side-quests) is loaded and validated at build-time by GameEngine from the JSON files (uke1-4_oppdrag.json). The GameEngine has NO hardcoded day numbers or badge information - everything is data-driven.

## Animation System

**Available Effects** (defined in `globals.css`):

- `scanline` - Moving CRT scanline
- `pulse-led` - Blinking status lights
- `flicker-in` - Power-on screen flicker
- `scale-in` - Window opening zoom
- `glitch` - Screen distortion effect
- `blink-cursor` - Terminal text cursor
- `crt-shake` - Error screen shake
- `gold-flash` - Success feedback
- `red-shake` - Error shake
- `lock-shake` - Locked icon wiggle

**Usage Pattern**: Apply via Tailwind classes: `animate-[keyframe-name]`

## Sound Design

**Audio Strategy**:

- **Background Music**: Christmas jingle (loops, default off, 30% volume)
- **UI Effects**: Oscillator-based beeps (default on, 50% volume)
- **User Control**: Separate toggles for music and effects (top-right)

**Sound Events**:

- Boot success → success beep + start jingle
- Window open/close → UI beeps
- Code validation → success/error beep
- Icon clicks → click beep
- Locked icon → error beep

**Implementation**: `SoundManager` class in `lib/sounds.tsx` with `useSounds()` hook

## Boot Flow Sequence

1. **Boot Animation** (configurable duration)
   - Shows "ENISSEKJERNE 3.8] LASTER..." progress bar
   - Duration set in env: `NEXT_PUBLIC_BOOT_ANIMATION_DURATION` (default 2s)
   - Set to 0 to skip entirely

2. **Password Challenge**
   - Terminal-style password input
   - Validates against env: `NEXT_PUBLIC_BOOT_PASSWORD`
   - Case-insensitive matching
   - Escalating error messages (attempt 1, 2, 3+)
   - Success persisted in localStorage

3. **Desktop Launch**
   - Fade in sidebar and icon grid
   - Play jingle if sounds enabled
   - Ready for user interaction

## Validation Logic

**Code Submission Flow** (in `KodeTerminal.tsx`):

1. User types code and clicks "SEND"
2. Show 1.5s "SJEKKER......" processing animation
3. Compare input to `oppdrag[day].kode` (case-insensitive)
4. **Correct**: Gold flash + persist to localStorage + show in history
5. **Incorrect**: Red shake + error message + do NOT persist

**Important**: Only correct codes are stored. This keeps localStorage clean and progress tracking simple.

## Email System

**NisseMail Behavior** (in `NisseMail.tsx`):

- **Split view**: 30% inbox list | 70% email content
- **Read tracking**: Mark email as viewed when selected
- **Unread indicators**: Red dot + "NY" badge + gold sender text
- **Inbox sorting**: Newest first (day 24 at top)
- **Selection priority**:
  1. Calendar-selected day (if opened from calendar)
  2. Current day's mission
  3. First unread email
  4. First mission (fallback)
- **Integration**: "ÅPNE TERMINAL" button opens KodeTerminal for that day

## Calendar Behavior

**Day States** (in `Kalender.tsx`):

- **Locked**: Future dates (gray with lock icon)
- **Available**: Current/past dates without codes (green glow)
- **Completed**: Dates with submitted codes (gold with checkmark, golden glow)

**Interaction**: Click available day → modal with mission details → "VIS OPPDRAG" button → opens NisseMail for that day

## Environment Configuration

**`.env.local` Settings**:

```bash
# Development mode (bypasses date restrictions)
NEXT_PUBLIC_TEST_MODE=false

# Boot password
NEXT_PUBLIC_BOOT_PASSWORD=NISSEKODE2025

# Boot animation duration (0 = skip)
NEXT_PUBLIC_BOOT_ANIMATION_DURATION=2

# Mock day for testing (1-24)
NEXT_PUBLIC_MOCK_DAY=

# Mock month for testing (1-12)
NEXT_PUBLIC_MOCK_MONTH=
```

**Test Mode Effects**:

- All dates accessible (not limited to Dec 1-24)
- Boot animation can be skipped
- Use for rapid development and testing

**Date Mocking System**:

- **Centralized date utilities** (`src/lib/date-utils.ts`): ALL date/time operations go through this module
- **`getCurrentDate()`**: Returns current date with mock support (respects `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH`)
- **`getCurrentDay()`**: Returns current day (1-31) with mock support
- **`getCurrentMonth()`**: Returns current month (1-12) with mock support
- **`isCalendarActive()`**: Checks if current date is in December 1-24 period
- **`isDayAccessible(day)`**: Validates if a specific quest day is accessible
- **`getISOString()`**: Returns ISO formatted date string with mock support
- **Mock priority**: `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` override system date when set
- **Format helpers**: `formatDate()` and `formatDateTime()` for consistent date display
- **Debug helper**: `getDateDebugInfo()` shows current date configuration

**Usage Pattern**: ALWAYS use date utilities instead of `new Date()` directly:

```typescript
// ❌ BAD - Direct date usage
const today = new Date();
const currentDay = today.getDate();

// ✅ GOOD - Centralized date utilities
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
const currentDay = getCurrentDay();
const today = getCurrentDate();
```

**Why**: Centralized date handling ensures NEXT_PUBLIC_MOCK_DAY works consistently across the entire application for testing.

## Quality Checklist

**Before Committing**:

- [ ] Run `npm run check` (type checking + linting)
- [ ] All text in Norwegian (except code comments)
- [ ] VT323 font used consistently
- [ ] Thick pixel borders on windows
- [ ] Animations on all interactions
- [ ] Colors from CSS custom properties
- [ ] StorageManager for all persistence
- [ ] TypeScript strict mode compliance
- [ ] Update this AGENTS.md if architecture changed

**Design Consistency**:

- [ ] Green = primary UI
- [ ] Red = errors
- [ ] Gold = success/completion
- [ ] Blue = info/hints
- [ ] Gray = locked/disabled

## Development Workflow

1. **Assume dev server is running** at <http://localhost:3000>
2. Make changes to components/content
3. Browser auto-reloads on save
4. Test in browser (use `NEXT_PUBLIC_TEST_MODE=true` for testing all days)
5. Run `npm run check` before finishing session
6. Update this document if you changed architecture/patterns

## Future Enhancements

**Planned Features** (Phase 2+):

- Editable Nice/Naughty list in NISSENET (unlock via "HACKINGVERKTØY" mission)
- Backend persistence (replace localStorage with API)
- Reactive sidebar widgets (update on code submissions)
- Additional unlockable modules (replace LÅST slots)
- Full-screen glitch effects for dramatic feedback
- Multiplayer progress sharing

---

**Version**: Phase 1
**Last Updated**: November 2025
**Target Audience**: Children ages 9-12 (Norwegian-speaking)
**Maintained By**: AI Coding Agents (keep this doc in sync with code!)

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
5. **EventyrOversikt** - Story arc overview and progress tracking
6. **Julius' Dagbok** - Julius' diary entries (quest-gated, unread tracking, continuous scroll)

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

### Architecture Principles

**Separation of Concerns:**

The codebase follows a strict **Facade Pattern** with clear boundaries between UI, game logic, domain systems, and persistence layers:

1. **GameEngine** (`lib/game-engine.ts`) - **Single Entry Point**
   - Central orchestration layer for ALL game state operations
   - UI components MUST call GameEngine methods, NEVER StorageManager directly
   - Provides type-safe accessor methods for reading game state
   - Delegates to specialized domain systems for cohesive features
   - Examples: `submitCode()`, `getCompletedDays()`, `getSolvedDecryptions()`

2. **Domain Systems** (`lib/systems/`, `lib/generators/`, `lib/validators/`)
   - Specialized modules for cohesive features (symbol collection, alert generation, quest validation)
   - Self-contained logic with clear responsibilities
   - Can be imported directly by GameEngine or UI when appropriate
   - Examples: `symbol-system.ts` (getAllSymbols, collectSymbolByCode), `alert-generator.ts`, `quest-validator.ts`

3. **Data Loader** (`lib/data-loader.ts`) - **Content Abstraction**
   - Centralized loading and validation of quest data from JSON files
   - Build-time validation ensures data integrity before app runs
   - Provides clean API for accessing quest data (`getAllQuests()`, `getQuestByDay()`)
   - Separates data concerns from game logic
   - GameEngine imports from data-loader instead of directly loading JSON

4. **StorageManager** (`lib/storage.ts`) - **Internal Use Only**
   - Direct access from UI components is PROHIBITED for game state
   - Only GameEngine and domain systems should call StorageManager
   - Type-safe localStorage abstraction
   - Easy to swap for backend API in future

5. **UI Components** (`src/components/`, `src/app/`)
   - Call GameEngine methods for game state operations
   - Import domain systems directly only for pure utilities (e.g., `getAllSymbols()`)
   - May access StorageManager ONLY for pure UI state (see exceptions below)

**Acceptable StorageManager Direct Access** (UI state only):

UI components may call StorageManager directly for **non-game state** concerns:

- **Authentication**: `isAuthenticated()`, `setAuthenticated()` - Boot password verification
- **Player Names**: `getPlayerNames()`, `addPlayerName()` - Nice List personalization
- **Diary Tracking**: `getDagbokLastRead()`, `setDagbokLastRead()` - Scroll position memory
- **Visit Tracking**: `setNisseNetLastVisit()`, `hasUnreadNiceList()` - UI badge state
- **Admin Tools**: `clearAll()`, `addEarnedBadge()`, `removeEarnedBadge()` - Parent guide only

**Why This Pattern?**

- **Encapsulation**: Game logic centralized, easier to test and maintain
- **Type Safety**: GameEngine provides properly typed interfaces
- **Flexibility**: Can add caching, validation, or backend without changing UI
- **Clarity**: Clear ownership - UI asks GameEngine "what should I show?"
- **Testing**: Mock GameEngine instead of StorageManager for unit tests

**Code Examples:**

```typescript
// ❌ BAD - UI directly accessing game state
const completedDays = StorageManager.getCompletedDaysForMissions();
const codes = StorageManager.getSubmittedCodes();

// ✅ GOOD - UI calls GameEngine facade
const completedDays = GameEngine.getCompletedDays();
const codes = GameEngine.getSubmittedCodes();

// ✅ ACCEPTABLE - Pure UI state
const isLoggedIn = StorageManager.isAuthenticated();
const lastRead = StorageManager.getDagbokLastRead();
```

**Implementation Status:**

All HIGH/MEDIUM priority violations have been resolved. UI components properly use GameEngine accessor methods for game state while maintaining direct StorageManager access for pure UI concerns.

## Data Architecture

**Content Files** (in `src/data/`):

- **`uke1_oppdrag.json`** through **`uke4_oppdrag.json`** - All 24 daily missions split across 4 weeks with codes, physical clues, and diary entries
- **`statisk_innhold.json`** - File system, alerts, system metrics (non-mission content)

**Data Loading** (`lib/data-loader.ts`):

- **Purpose**: Centralized quest data loading and validation (separates data from game logic)
- **Build-time validation**: Runs comprehensive checks on all quest data during import
- **Public API**:
  - `getAllQuests()` - Returns all 24 validated quests sorted by day
  - `getQuestByDay(day)` - Returns specific quest or undefined
  - `mergeAndValidate()` - Internal function that merges weeks and runs validation
- **Validation checks**: Quest structure, file references, topic dependencies, eventyr references, progressive hints, symbol references, collection completeness
- **Usage**: GameEngine imports `getAllQuests()` and `getQuestByDay()` instead of directly loading JSON files

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
- **Programmatic resolution**: Crises auto-resolve after 2 days if not manually resolved
  - Day 11 Antenna crisis: Auto-resolves on day 13
  - Day 16 Inventory crisis: Auto-resolves on day 18
  - Day 7 Mørket warning: Auto-resolves on day 14 (story progression)

**Design Principle**: Bonusoppdrags encourage parent-child collaboration and critical thinking beyond code entry. Automatic resolution ensures progression isn't blocked if parents don't validate.

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

- Story data: `src/data/eventyr.json`
- Progress tracking: `GameEngine.getEventyrProgress(eventyrId)`
- Badge awarding: Automatic on final phase completion
- UI: **EventyrOversikt** module (desktop icon unlocks day 8)

**Design Philosophy**: Eventyr creates overarching narrative tension across weeks, giving context to daily puzzles and building anticipation.

---

### 4. Nice List & Name Registration (Days 22-24)

**Overview**: Personal connection to Julius' official Snill & Slem liste through name registration and finale message.

**Timeline**:

- **Day 22**: Name entry modal appears after code submission → Player enters their name
- **Day 23**: Names appear at top of Julius' Nice List in `snill_slem_liste.txt` (NISSENET file)
- **Day 24**: Julius' emotional finale message added to Nice List + trophy badge awarded

**User Flow**:

1. Complete Day 22 quest
2. Modal appears: "REGISTRER DITT NAVN"
3. Enter name (or use default "Et snilt barn")
4. Name saved to localStorage via `StorageManager.addPlayerName()`
5. Day 23: Open NISSENET → `snill_slem_liste.txt` shows player name at top
6. Unread indicator (🔴) appears on file until viewed
7. Day 24: Finale message appears in Nice List + trophy badge unlocks

**Technical Implementation**:

- Name storage: `StorageManager.getPlayerNames()` / `addPlayerName(name)`
- Dynamic injection: `NisseNetUtforsker.tsx` lines 162-210 (processedFiles useMemo)
- Unread tracking: `StorageManager.hasUnreadNiceList()` / `setNiceListViewed()`
- Badge awarding: Trophy badge "julekalender-fullfort" awarded after Day 24 code
- Placeholder replacement:
  - `{{UPDATE_DATE}}` → "[VIL BLI OPPDATERT]" (before final update)
  - `{{FINALE_MESSAGE}}` → Julius' emotional message (Day 24 only)
  - Player names injected at top of SNILL LISTE section

**Static Content** (`statisk_innhold.json`):

- Nice List template with example names (Georg, Viljar, Marcus, etc.)
- "[PLASS TIL FLERE NAVN]" as natural placeholder for more children
- Placeholders for dynamic content (UPDATE_DATE, FINALE_MESSAGE)
- Tip: "Julius oppdaterer listen hver natt basert på barnets fremgang"

**UI Components**:

- `NameEntryModal.tsx` - Name registration form (Day 22)
- `NisseNetUtforsker.tsx` - File explorer with dynamic Nice List injection
- `GrandFinaleModal.tsx` - Stage 4 reveals trophy badge with Nice List reference

**Design Philosophy**: Creates emotional payoff by making player part of Julius' official records, celebrating their completed journey through Snøfall's Christmas adventure.

---

### 5. Symboler & NisseKrypto (Symbol Collection + Decryption)

**Overview**: Physical treasure hunt combined with digital puzzle-solving. Kids find 9 hidden symbol cards, then solve 3 progressive decryption challenges.

#### 5.1 Symbol Collection System

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

#### 5.2 NisseKrypto Decryption Challenges

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

### Responsive Design & Touch Optimization

**Philosophy**: Desktop-first design with mobile/tablet optimization for "low hanging fruit" improvements. The app maintains its retro CRT aesthetic while ensuring usability on touch devices.

**Breakpoint Strategy** (Mobile-First Tailwind):

- **Default (< 640px)**: Mobile phones - single column layouts, reduced effects
- **sm: 640px**: Large phones (landscape) / Small tablets - increase spacing
- **md: 768px**: Tablets (portrait) - enable multi-column where appropriate
- **lg: 1024px**: Tablets (landscape) / Small laptops - **full desktop experience starts here**
- **xl: 1280px**: Desktop - optimal viewing (design target)

**Key Responsive Patterns**:

```tsx
// Sidebar collapse pattern
<div className="hidden lg:flex">Sidebar</div> // Desktop only
<HamburgerMenu className="lg:hidden" />      // Mobile only

// Grid responsiveness
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

// Text scaling
<span className="text-xs md:text-sm lg:text-base">

// Spacing
<div className="p-2 md:p-4 lg:p-6">

// Touch targets (minimum 44px, prefer 48px)
<button className="min-w-11 min-h-11 md:min-w-12 md:min-h-12">
```

**Touch Interaction Guidelines**:

1. **Touch Targets**: Minimum 44×44px (11 Tailwind units), prefer 48×48px (12 units)
2. **Active States**: Use `active:scale-95` instead of hover-only effects
3. **Drag & Drop**: Implement both mouse and touch event handlers
   - Mouse: `onDragStart`, `onDragOver`, `onDrop`
   - Touch: `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel`
   - Add `touch-none` class to prevent scroll interference
   - Track `touchIdentifier` to handle multi-touch correctly
4. **Buttons**: Add `active:bg-*` states for tactile feedback

**Component Responsive Checklist**:

- [ ] CRT borders: `border-4 md:border-8 lg:border-20`
- [ ] Windows: `w-full md:w-[90%] md:max-w-4xl`
- [ ] Close buttons: `w-12 h-12` (48×48px minimum)
- [ ] Calendar grid: `grid-cols-3 md:grid-cols-4 lg:grid-cols-6`
- [ ] Desktop icons: `grid-cols-2 md:grid-cols-3`
- [ ] Split layouts: `flex-col lg:flex-row` or `flex-col lg:grid lg:grid-cols-2`
- [ ] Desktop icons: `min-w-16 min-h-16 md:min-w-20 md:min-h-20`

**Performance Optimizations** (Mobile):

- Reduced scanline opacity (30% on mobile vs 100% desktop)
- Simplified glow effects (50% intensity reduction)
- Lighter vignette shadows
- Defined in `@media (max-width: 768px)` in `globals.css`

**Testing Strategy**:

- Chrome DevTools responsive mode (iPhone 12 Pro, iPad Pro)
- Physical device testing for touch interactions
- Test NisseKrypto drag-drop on tablet
- Verify sidebar slide-in animation on mobile

### Norwegian Language

- All UI text, labels, and messages in Norwegian
- File/folder names in Norwegian (e.g., "OPPGAVER", "LOGGER")
- Error messages in Norwegian
- **Use the vocabulary list below** to ensure consistency

### Code Comments

**Philosophy**: Comments should explain WHY, not WHAT. Code should be self-documenting through clear naming.

**Good Comments** (keep):

- Non-obvious business logic: `// Day 24 completion awards trophy badge`
- Important constraints: `// Symbols require physical collection (QR scanning or parent addition)`
- Architectural decisions: `// Compute eventyr completion inline to avoid circular dependency`
- Complex algorithms: Brief explanation of the approach

**Bad Comments** (remove):

- Obvious actions: `// Check if file exists`, `// Loop through items`
- Section dividers: `// ============ MODULE UNLOCKS ============`
- Redundant JSDoc: Repeating @param info already in TypeScript types
- Step-by-step narration: `// 1. First do X, 2. Then do Y`

**JSDoc Guidelines**:

- Module headers: Brief overview of purpose and key concepts
- Public functions: One-line summary, omit obvious @param/@returns
- Internal functions: Often no JSDoc needed if name is clear
- Complex return types: Document the structure if non-obvious

**Example**:

```typescript
// ❌ BAD
/**
 * Get all completed quest days
 * @returns Set of day numbers (1-24) that have been completed
 * @public Used by UI components to check completion status
 */
static getCompletedDays(): Set<number> {
  // Load the game state
  const state = this.loadGameState();
  // Return completed quests
  return state.completedQuests;
}

// ✅ GOOD
static getCompletedDays(): Set<number> {
  const state = this.loadGameState();
  return state.completedQuests;
}
```

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
- Keep utility functions in `lib/utils/` (pure functions, no side effects)
- Keep domain systems in `lib/systems/` (symbol collection, etc.)
- Keep generators in `lib/generators/` (alert generation, etc.)
- Keep validators in `lib/validators/` (quest validation, etc.)
- Centralize types in `types/`
- Single source of truth for content (`data/uke1-4_oppdrag.json` and `data/statisk_innhold.json`)
- **All quest loading, validation, and game logic centralized in `game-engine.ts`**
- **GameEngine delegates to domain systems for specialized features**

### Code Maintenance Principles

**No Deprecated/Legacy Code:**

- **Remove, don't comment out**: When code becomes obsolete, delete it entirely rather than commenting it out or marking as deprecated
- **Complete migrations**: If a pattern changes (e.g., hardcoded config → JSON data), remove all old code immediately
- **Git is your safety net**: Deleted code can always be recovered from git history if needed
- **No "DEPRECATED" markers**: If you see deprecated code, complete the migration and remove it
- **Refactor boldly**: When improving architecture, do complete refactorings rather than partial half-measures

**Why:**

- Deprecated code adds cognitive load when reading
- Creates confusion about which pattern to follow
- Accumulates over time into technical debt
- Git history preserves everything if needed

**Example:**

```typescript
// ❌ BAD - Leaving deprecated code
// DEPRECATED: Use quest.reveals.modules instead
const MODULE_UNLOCKS = [...]; // Old config
static getModuleUnlocks() { return []; } // Returns empty array

// ✅ GOOD - Complete removal
// Code deleted entirely, modules now configured in quest JSON
```

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

## Diary System

**Julius' Dagbok Behavior** (in `Dagbok.tsx`):

- **Standalone module**: Core desktop icon (gold book icon, positioned after EVENTYR)
- **Quest-gated entries**: Only shows `dagbokinnlegg` for completed quests (prevents spoilers)
- **Continuous scroll**: Single-column timeline view (distinct from NisseMail's split-view)
- **Unread tracking**: Red badge shows count of unread entries (entries with day > last read)
- **Auto-scroll**: On open, centers first unread entry in viewport (`scrollIntoView({ block: 'center', behavior: 'smooth' })`)
- **Read detection**: IntersectionObserver marks entries read after 3 seconds at 50%+ visibility
- **Visual styling**:
  - CRT-style dotted separators between entries (`border-top: 2px dotted var(--neon-green)/50`)
  - Unread entries: Full opacity + pulsing gold indicator
  - Read entries: 70% opacity
  - Eventyr badges: Small gold text at entry end (`📜 {eventyr.navn}`)
- **Empty state**: Placeholder message when no quests completed yet
- **Fallback access**: Original diary in NisseNet archive remains for completionists

**Storage Methods** (in `storage.ts`):

- `getDagbokLastRead()` - Returns day number of last read entry
- `setDagbokLastRead(day)` - Updates last read day (called by IntersectionObserver)
- `getUnreadDiaryCount(completedQuests)` - Counts unread entries for badge

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

- Backend persistence (replace localStorage with API)
- Reactive sidebar widgets (update on code submissions)
- Full-screen glitch effects for dramatic feedback

---

**Version**: Phase 1
**Last Updated**: November 2025
**Target Audience**: Children ages 9-12 (Norwegian-speaking)
**Maintained By**: AI Coding Agents (keep this doc in sync with code!)

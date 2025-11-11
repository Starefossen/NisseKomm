# NisseKomm - Development Guide for AI Agents

> **Important**: Keep this document updated when making changes to the project. Always run `npm run check` at the end of coding sessions to verify code quality. Assume the dev server is already running at <http://localhost:3000>.
>
> **Do NOT create new markdown files** (like SUMMARY.md, CHANGES.md, etc.) to document your work unless explicitly requested by the user.

## Project Overview

**NisseKomm** is a playful Christmas calendar app for children (ages 6-12) that runs December 1-24. Kids solve daily riddles by entering codes, unlocking Julius' diary and exploring a retro CRT-style terminal interface. The aesthetic is inspired by fictional in-game computer terminals (like GTA) with a nostalgic, pixelated look.

**Core Experience**: Boot up a password-protected "command center" → receive daily emails from Rampenissen → solve riddles → enter codes in terminal → unlock content → track progress on calendar.

**Universe**: Based on the Snøfall TV series universe - Julius (Santa) lives in Snøfall with Nissemor and the elves, sending missions to children through Rampenissen.

**Key Snøfall Elements**:

- **Julekuleblåsing** - Making Christmas ornaments by glass blowing
- **Brevfugler** - Paper birds that carry letters from children (can be folded origami-style)
- **Themes**: Magic, friendship, and overcoming dangers together
- **Characters**: Pil (apprentice), Winter (secretary), IQ (inventor), Trixter (reindeer), Orakelet (oracle), Mørket (the darkness)

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (utility-first, custom properties for colors)
- **Pixelarticons** (retro icon set)
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
  beskrivelse: string,      // Riddle/puzzle description
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
- Load and validate quest data through oppdrag.ts
- **Side-quest utilities** in sideoppdrag.ts for consistent completion tracking

## Side-Quest System

**Centralized Utilities** (`lib/sideoppdrag.ts`):

- `isSideQuestCompleted(mission)` - Check if any side-quest is completed (handles both code and parent validation)
- `getSideQuestDefinition(crisisType)` - Get badge details for Nissemor Guide integration

**Current Side-Quests** (derived from oppdrag JSON files - source of truth):

- **Day 11: Antenne-krise** (Signal crisis) - Parent validation, awards "ANTENNE-INGENIØR" badge
- **Day 16: Inventar-kaos** (Inventory chaos) - Parent validation, awards "INVENTAR-EKSPERT" badge
- **Day 14: TODO** - Consider adding a new side-quest here

**Important Design Principle**: ALL side-quest data is derived from the oppdrag JSON files. The utilities have NO hardcoded day numbers or badge information - they load data dynamically from the mission definitions.

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
2. Show 1.5s "BEHANDLER..." processing animation
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
```

**Test Mode Effects**:

- All dates accessible (not limited to Dec 1-24)
- Boot animation can be skipped
- Use for rapid development and testing

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
**Target Audience**: Children ages 6-12 (Norwegian-speaking)
**Maintained By**: AI Coding Agents (keep this doc in sync with code!)

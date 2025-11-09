# NisseKomm - Agents Development Guide

## Project Context

**NisseKomm** is a playful Christmas-themed riddle application for children, designed as a retro CRT command center interface. The application runs throughout December (1-24) with daily riddles/missions that children solve by entering codes. The aesthetic is inspired by fictional in-game computer terminals found in video games like GTA, with a nostalgic low-tech, pixelated look.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (utility-first styling)
- **Pixelarticons** (retro pixel-art icon library)

## Design Principles

### Visual Aesthetic
- **Retro CRT Terminal**: Fake monitor frame, scanline effects, pixel borders, vignette overlay
- **Christmas Color Palette**:
  - Primary: Neon Green `#00ff00` (main UI, text, success states)
  - Alerts: Christmas Red `#ff0000` (errors, warnings, critical alerts)
  - Success: Gold `#ffd700` (completed tasks, achievements)
  - Info: Cold Blue `#00ddff` (secondary information, hints)
  - Background: Dark CRT `#0a1a0a` (deep dark green-black)
  - Disabled: Gray `#666666` (locked elements)

### Typography
- **Font**: VT323 (Google Fonts) - monospace pixel font
- All text in **Norwegian language**
- Terminal-style presentation with typing animations

### UI Elements
- **Thick pixel borders** on all windows and panels
- **Blinking LED indicators** for status displays
- **Scanline overlay** for authentic CRT effect
- **Animated transitions**: flicker-in, scale-in, glitch effects
- **No anti-aliasing**: `image-rendering: pixelated` for icons

### Interaction Style
- **Playful and exaggerated**: Not realistic, styled for fun
- **Visual feedback**: Animations for every interaction (clicks, hovers, state changes)
- **Sound-implied visuals**: UI suggests noises without actual audio
- **Responsive feedback delays**: Fake processing animations (1.5s) for realism

## Architecture

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  CRT Frame (fullscreen with scanlines)     │
│  ┌────────────┬───────────────────────────┐ │
│  │  SIDEBAR   │   MAIN WORKSPACE         │ │
│  │  (25%)     │   (75%)                  │ │
│  │            │                           │ │
│  │ System     │   Desktop Icons (2×3)    │ │
│  │ Status     │   or                     │ │
│  │            │   Active Window (modal)  │ │
│  │ Varsel     │                           │ │
│  │ Konsoll    │                           │ │
│  │            │                           │ │
│  └────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Window Management
- **Single window at a time**: Only one module window can be open
- **Modal overlay**: Active window appears centered over desktop
- **Close returns to desktop**: Closing window shows icon grid again
- **Desktop icons**: 2×3 grid (4 active modules + 2 locked slots)

### Module Icons (Desktop)
1. **NisseMail** (green with unread badge) - Email inbox with daily missions from Rampenissen
2. **KodeTerminal** (blue) - Terminal for code submission
3. **NisseNet Utforsker** (green) - File explorer with hints/content
4. **Kalender** (gold) - December 1-24 calendar grid
5. **LÅST** (gray) - Locked placeholder with shake animation
6. **LÅST** (gray) - Locked placeholder with shake animation

### Sidebar Widgets (Always Visible)
1. **SystemStatus**: Christmas-themed metrics (JULESIGNAL, NISSEKRAFT, GAVEPRODUKSJON)
2. **VarselKonsoll**: Auto-scrolling alert feed

## State Management

### StorageManager (`lib/storage.ts`)
Centralized data layer for all localStorage operations. Designed for easy migration to backend persistence.

**Key Methods:**
- `isAuthenticated()` / `setAuthenticated(value: boolean)`
- `getSubmittedCodes()` / `addSubmittedCode(code: InnsendelseLog)`
- `getCompletedDays()` - Returns Set<number> of days with correct codes
- `getViewedEmails()` / `markEmailAsViewed(day: number)` / `isEmailViewed(day: number)`
- `getUnreadEmailCount(currentDay: number, totalMissions: number)` - Calculate unread emails
- `isSoundsEnabled()` / `setSoundsEnabled(enabled: boolean)`
- `isMusicEnabled()` / `setMusicEnabled(enabled: boolean)`
- `getAllData()` / `clearAll()` / `exportData()` / `importData(data: string)`

**Benefits:**
- Type-safe interface for all storage operations
- Single source of truth for data access
- Easy to swap localStorage for backend API
- Consistent error handling
- All components use StorageManager instead of direct localStorage

### LocalStorage Schema
```typescript
// Authentication
'nissekomm-authenticated': 'true' | null

// Submitted correct codes only
'nissekomm-codes': InnsendelseLog[]
// Interface: {kode: string, dato: string}[]

// Viewed emails (read status)
'nissekomm-viewed-emails': number[] // Array of day numbers

// Sound preferences
'nissekomm-sounds-enabled': 'true' | 'false'
'nissekomm-music-enabled': 'true' | 'false'

// Managed via StorageManager class in lib/storage.ts
```

### React State (in page.tsx)
```typescript
authenticated: boolean          // Password entered successfully
openWindow: string | null       // Currently active window ID ('nissemail', 'kodeterminal', 'nissenet', 'kalender')
selectedDay: number | null      // Day selected from calendar to open in NisseMail
bootComplete: boolean           // Boot sequence finished
attemptCount: number            // Failed password attempts
submittedCodes: InnsendelseLog[] // Correct codes from localStorage
unreadCount: number             // Unread email count for badge display
```

## Environment Variables

Create `.env.local` file:
```bash
# Set to 'true' to bypass date restrictions and skip boot animation
NEXT_PUBLIC_TEST_MODE=false

# Boot password (case-insensitive)
NEXT_PUBLIC_BOOT_PASSWORD=NISSEKODE2025

# Boot animation duration in seconds (0 = skip animation)
NEXT_PUBLIC_BOOT_ANIMATION_DURATION=2
```

### Test Mode Behavior
When `NEXT_PUBLIC_TEST_MODE=true`:
- All dates are accessible (not limited to December 1-24)
- Boot animation can be skipped by setting duration to 0

### Production Mode
When `NEXT_PUBLIC_TEST_MODE=false`:
- Only December 1-24 dates are accessible
- Outside this range shows: "TILGANG NEKTET - SYSTEMET ER STENGT UTENFOR JULESONEN"
- Boot animation always plays (unless duration is 0)

## Component Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with VT323 font
│   ├── globals.css         # CRT theming, animations, colors
│   └── page.tsx            # Main application with boot flow
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── CRTFrame.tsx
│   │   ├── RetroWindow.tsx
│   │   ├── RetroModal.tsx
│   │   ├── DesktopIcon.tsx    # Now supports unreadCount badge
│   │   ├── BootSequence.tsx
│   │   ├── PasswordPrompt.tsx
│   │   ├── SidebarWidget.tsx
│   │   ├── SoundToggle.tsx    # Separate MUSIKK/EFFEKTER buttons
│   │   └── TerminalText.tsx
│   ├── modules/            # Sidebar widgets
│   │   ├── SystemStatus.tsx
│   │   └── VarselKonsoll.tsx
│   └── windows/            # Main application windows
│       ├── NisseMail.tsx        # Email client (replaces DagensOppdrag)
│       ├── KodeTerminal.tsx     # Code submission terminal
│       ├── NisseNetUtforsker.tsx # File explorer
│       └── Kalender.tsx         # Calendar grid
├── lib/
│   ├── icons.tsx           # Pixelarticons wrapper
│   ├── sounds.tsx          # SoundManager class with Web Audio API
│   └── storage.ts          # StorageManager centralized data layer
├── types/
│   └── innhold.ts          # TypeScript interfaces
└── data/
    └── innhold.json        # All content (missions, alerts, files)
```

## Data Format (innhold.json)

```typescript
{
  "oppdrag": Oppdrag[],      // 24 daily missions
  "varsler": Varsel[],        // Alert feed messages
  "filer": FilNode[],         // File tree structure
  "systemMetrikker": SystemMetrikk[], // System status metrics
  "kalender": KalenderDag[]   // Calendar configuration
}
```

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
- Use CSS custom properties from `globals.css` for colors
- Apply animations via Tailwind classes referencing keyframes
- Use `className` composition for conditional styles

### Norwegian Language
- All UI text, labels, and messages in Norwegian
- File/folder names in Norwegian (e.g., "OPPGAVER", "LOGGER")
- Error messages in Norwegian
- Comments in English (for code clarity)

### File Organization
- One component per file
- Co-locate related components (windows/, modules/, ui/)
- Keep utility functions in lib/
- Centralize types in types/
- Single source of truth for content (data/innhold.json)

## Animation Keyframes

Available animations defined in `globals.css`:
- `scanline` - Moving horizontal scanline effect
- `pulse-led` - Blinking LED indicator
- `flicker-in` - CRT power-on flicker
- `scale-in` - Window opening animation
- `glitch` - Screen glitch distortion
- `blink-cursor` - Terminal cursor blink
- `crt-shake` - Screen shake on error
- `gold-flash` - Success feedback flash
- `red-shake` - Error feedback shake
- `error-pulse` - Escalating error pulse
- `lock-shake` - Locked icon shake on click

## Boot Sequence Flow

1. **BootSequence Component** (configurable duration)
   - Display "ENISSEKJERNE 3.8] LASTER..."
   - Animated progress bar 0-100%
   - Duration from `NEXT_PUBLIC_BOOT_ANIMATION_DURATION`
   - Skip entirely if duration is 0

2. **PasswordPrompt Component**
   - Terminal-style password input
   - Validate against `NEXT_PUBLIC_BOOT_PASSWORD` (case-insensitive)
   - Escalating error messages on failed attempts:
     - Attempt 1: "FEIL PASSORD"
     - Attempt 2: "TILGANG NEKTET - PRØV IGJEN"
     - Attempt 3+: "ADVARSEL: SIKKERHETSBRUDD REGISTRERT"
   - Store success in localStorage 'nissekomm-authenticated'

3. **Desktop View**
   - Fade in sidebar widgets + icon grid
   - Play Christmas jingle (if sounds enabled)
   - Ready for interaction

## Sound System

### Audio Files
- **Christmas Jingle**: `/public/music/christmas-dreams-jingle-bells-268299.mp3` (loops in background)
- **Sound Effects**: Simple beep tones generated for UI interactions

### Sound Manager (`lib/sounds.tsx`)
- **SoundManager class**: Singleton managing all audio
- **Sounds**:
  - `jingle` - Christmas background music (loops)
  - `click` - Button/icon clicks
  - `success` - Code validation success
  - `error` - Code validation error or locked icon
  - `open` - Window opening
  - `close` - Window closing
  - `type` - Keyboard typing (placeholder)
  - `boot` - Boot sequence (placeholder)

### Usage
- **useSounds() hook**: React hook for sound control
- **SoundToggle component**: Two separate buttons (top-right)
  - **MUSIKK**: Toggle Christmas jingle on/off (default: off)
  - **EFFEKTER**: Toggle sound effects on/off (default: on)
- **State persistence**: Preferences stored via StorageManager
  - `nissekomm-sounds-enabled` - Sound effects
  - `nissekomm-music-enabled` - Background music
- **Volume control**: Separate music (30%) and SFX (50%) volumes
- **Autoplay handling**: Gracefully handles browser autoplay restrictions
- **Web Audio API**: Oscillator-based beeps for UI sounds (frequency/duration/waveType configurations)

### Integration Points
- **Authentication success**: Play success sound + start jingle
- **Window open/close**: Play open/close sounds
- **Desktop icons**: Click sound or error sound (if locked)
- **Code submission**: Success or error sound based on validation
- **All buttons**: Click sounds on interaction

## Code Validation Logic

In `KodeTerminal.tsx`:
1. User enters code and clicks "SEND"
2. Show 1.5s processing animation: "BEHANDLER..."
3. Compare against expected code from `innhold.json` for current date
4. **If correct**:
   - Show gold background flash animation
   - Persist to localStorage: `{kode: string, dato: string}`
   - Add to submitted codes list display
5. **If incorrect**:
   - Show red border shake animation
   - Do NOT persist to localStorage
   - Show error message (brief)

## NisseMail Email Client

In `NisseMail.tsx`:
- **Split-view layout**: 30% inbox list | 70% email content
- **Email from Rampenissen**: All daily missions presented as emails
- **Read/Unread tracking**:
  - Emails marked as viewed when selected
  - Unread emails show: red dot indicator, bold "NY", gold sender text
  - Read emails: no indicator, normal weight
  - Badge on desktop icon shows unread count
- **Inbox sorting**: Newest emails at top (reversed chronological)
- **Mission selection priority**:
  1. If `initialDay` prop provided (from calendar), show that day
  2. Otherwise show today's mission
  3. Otherwise show first unread email
  4. Otherwise show first mission
- **State management**:
  - Uses `StorageManager.getViewedEmails()` for read status
  - Lazy initialization to load state immediately (no empty Set flash)
  - `markAsViewed()` updates both StorageManager and local state
- **Integration**: "ÅPNE TERMINAL" button opens KodeTerminal with expected code
- **Scrolling**: Inbox list scrolls independently, email content scrolls separately

## Calendar Logic

In `Kalender.tsx`:
- Display all 24 days (December 1-24) in 6×4 grid
- **Locked state**: Future dates (gray with lock icon, 12px)
- **Available state**: Current/past dates not completed (green glow)
- **Completed state**: Dates with correct codes in localStorage (gold with checkmark 16px, golden glow shadow)
- Click unlocked day → opens `RetroModal` with event details
- "VIS OPPDRAG" button → closes modal and opens `NisseMail` window with that day's mission selected
- Uses `StorageManager.getCompletedDays()` to determine status
- Scrollable content to ensure all days visible

## Future Enhancements (Phase 2+)

- **Nice/Naughty List Editing**: Interactive feature in NISSENET
  - `snill_slem_liste.txt` file in HEMMELIGHETER folder
  - Shows read-only list initially with warning: "SKRIVEBESKYTTET - ADMIN TILGANG PÅKREVD"
  - One daily mission involves finding "HACKINGVERKTØY" code
  - After solving that mission, list becomes editable
  - Kids can add their names to the "Snill" (Nice) section
  - Changes persist in localStorage
  - Visual feedback: green flash animation when name is added
- Full-screen glitch effect for code validation feedback
- Backend state persistence (replace localStorage)
- Sidebar widget reactivity to code submissions
- Additional unlockable modules (replace LÅST slots)
- More complex file tree interactions in NisseNet
- Multiplayer/shared progress features
- **Messages App**: Communications between Julenissen and Rampenissen (postponed)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Testing Recommendations

1. Test with `NEXT_PUBLIC_TEST_MODE=true` for rapid development
2. Test all 24 daily missions sequentially
3. Verify localStorage persistence across page reloads
4. Test password protection and escalating errors
5. Test date validation (access outside December 1-24)
6. Test all animations and visual feedback
7. Verify Norwegian text throughout application
8. Test locked icon interactions (shake animation)
9. Test calendar modal and day selection
10. Test code validation (correct and incorrect codes)

## Design Consistency Checklist

- [ ] All text in Norwegian
- [ ] VT323 font throughout
- [ ] Christmas color palette applied consistently
- [ ] Thick pixel borders on all windows
- [ ] Scanline overlay visible
- [ ] Icons use `image-rendering: pixelated`
- [ ] LED indicators pulse/blink
- [ ] Animations on all interactions
- [ ] Terminal-style text input with cursor
- [ ] Green as primary UI color
- [ ] Red for errors/alerts
- [ ] Gold for success/completion
- [ ] Blue for secondary info
- [ ] Gray for locked/disabled states

---

**Version**: Phase 1
**Last Updated**: November 2025
**Target Audience**: Children (December calendar riddle experience)

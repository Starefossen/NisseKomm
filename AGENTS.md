# NisseKomm - Development Guide for AI Agents

> **Important**: Keep this document updated when making changes to the project. Always run `pnpm check` at the end of coding sessions to verify code quality. Assume the dev server is already running at <http://localhost:3000>.
>
> **Do NOT create new markdown files** (like SUMMARY.md, CHANGES.md, etc.) to document your work unless explicitly requested by the user.

## Quick Navigation

**Session Starter** (you're here): Project essence, critical patterns, environment setup
**Deep Dive References**:

- 📐 [ARCHITECTURE.md](./ARCHITECTURE.md) - Layout patterns, module system, state management, date handling
- 🎮 [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Game mechanics, user flows, component behaviors
- 🎨 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Visual design, colors, animations, responsive patterns
- ✍️ [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) - Norwegian vocabulary, character voices, puzzle design

## Project Overview

**NisseKomm** is an advent calendar experience for children (ages 9-12) that bridges the physical and digital worlds. Rampenissen, the silly but friendly elf stationed with the kids, needs their help on a mission from Julius (Santa). Kids solve daily riddles by finding clues in both the real world and inside **NisseKomm** - the digital headquarters for critical Snøfall operations.

**Core Experience**: Rampenissen's daily emails → scavenge for physical clues → access digital HQ → combine hints from both worlds → solve riddles → unlock Julius' secrets.

**The Physical-Digital Bridge**: This is NOT a purely digital game. Success requires exploring BOTH worlds - searching the house for physical clues while investigating files in NisseKomm's retro CRT terminal. The two worlds intertwine throughout December 1-24.

**Universe**: Based on Snøfall TV series - Julius (Santa) in magical Snøfall with Nissemor and elves. Rampenissen does humorous mischiefs during advent while keeping a watchful eye on the kids, but this year he needs their problem-solving help.

📖 **Complete details** → [CONTENT_GUIDE.md#dialogue-principles](./CONTENT_GUIDE.md#dialogue-principles) | [IMPLEMENTATION.md#game-mechanics](./IMPLEMENTATION.md)

**Key Design Philosophy**: The app is a digital tool in service of physical exploration. Rewards come from effort in BOTH worlds - not just typing codes, but searching, thinking, connecting clues across real and digital spaces. Puzzles require combining physical notes with digital information - neither alone provides the complete answer. Story arcs and bonus challenges reference previous days and require extra problem-solving, encouraging kids to remember and build on their adventure.

📖 **Puzzle design principles** → [CONTENT_GUIDE.md#puzzle-design](./CONTENT_GUIDE.md#puzzle-design)

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (utility-first, custom properties)
- **PostgreSQL** (`DATABASE_URL`) via `/api/state`, with `localStorage` as a client cache (StorageManager abstraction)

📖 **Visual design** → [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

## Critical Architecture Patterns

### 🚨 Facade Pattern (ALWAYS FOLLOW)

**GameEngine is the ONLY entry point for game state operations.**

UI components MUST call GameEngine methods, NEVER StorageManager directly:

```typescript
// ❌ BAD - UI directly accessing game state
const completedDays = StorageManager.getCompletedDaysForMissions();
const codes = StorageManager.getSubmittedCodes();

// ✅ GOOD - UI calls GameEngine facade
const completedDays = GameEngine.getCompletedDays();
const codes = GameEngine.getSubmittedCodes();

// ✅ ACCEPTABLE - Pure UI state (non-game data)
const isLoggedIn = StorageManager.isAuthenticated();
const lastRead = StorageManager.getDagbokLastRead();
```

**Why**: Encapsulation, type safety, easy backend migration, clear ownership.

📖 **Complete pattern details** → [ARCHITECTURE.md#architecture-principles](./ARCHITECTURE.md#architecture-principles)

### 🚨 Centralized Date Handling (ALWAYS FOLLOW)

**NEVER use `new Date()` directly. ALWAYS import from date-utils.ts:**

```typescript
// ❌ BAD - Direct date usage
const today = new Date();
const currentDay = today.getDate();

// ✅ GOOD - Centralized date utilities
import { getCurrentDay, getCurrentDate } from "@/lib/date-utils";
const currentDay = getCurrentDay();
const today = getCurrentDate();
```

**Why**: Enables `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` for testing across entire app.

📖 **Complete API reference** → [ARCHITECTURE.md#date-handling-system](./ARCHITECTURE.md#date-handling-system)

## Game Mechanics Overview

**5 Core Systems**:

1. **Oppdrag** (Daily Quests): 24 missions with riddles → physical clues → codes → diary unlocks
2. **Bonusoppdrag** (Side Quests): Parent-approved tasks on day 11 (antenna) and 16 (lantern, `LYKT2026`) in the guide's Bonusoppdrag page. No badge: −20 % frost and a bonus variant of Julius' PS (`julius_ps_bonus`, day 11 and 16–19)
3. **Eventyr** (Story Arc): one story, `spokelseskoden`, on all 24 days, with milestones M1–M6 in `eventyr.json` (EventyrOversikt shows one progress line). Badges: Varmebærer (`decryptionSolved` frosne-koder), Portvokter (`dayCompleted` 21), Snøfalls venn (`allQuestsCompleted`)
4. **Nice List** (Days 22-24): Name registration → personalized finale message
5. **Symboler** (Symbol Collection): 9 physical QR cards → 3 NisseKrypto decryption challenges

**Frost (2026)**: `src/lib/frost.ts` holds the Frostgraden table and frost-mode rules (day 10 level 1, day 21 level 2). Use `GameEngine.getFrostLevel()`, `getFrostMode()`, `isFrostDay()`, `getLearnedRunes()`; runes render with `Frostrune`/`RuneText` (`components/ui/Frostrune.tsx`).

📖 **Complete specifications** → [IMPLEMENTATION.md](./IMPLEMENTATION.md)

## Coding Conventions

### TypeScript & React

- **Strict mode** TypeScript, functional components with hooks
- Use `'use client'` directive when needed (state, effects, browser APIs)
- Proper typing for all props (no `any`)

### Styling (Tailwind CSS v4)

**Critical syntax change**:

```tsx
// ✅ GOOD - Tailwind v4
bg-(--neon-green)
text-(--gold)

// ❌ BAD - Old syntax
bg-[var(--neon-green)]
```

**Key rules**:

- Utility classes only (no custom CSS in components)
- Use `text-black` on bright backgrounds (readability)
- Touch targets minimum 44×44px (`min-w-11 min-h-11`), prefer 48×48px

📖 **Complete styling guide** → [DESIGN_SYSTEM.md#styling-conventions](./DESIGN_SYSTEM.md#styling-conventions)

### Norwegian Language

All UI text in Norwegian. Use consistent vocabulary:

**Common terms**: Åpne (Open), Lukk (Close), Send (Submit), Låst (Locked), Fullført (Completed), Feil kode (Wrong code)

📖 **Complete ordliste** → [CONTENT_GUIDE.md#norwegian-vocabulary](./CONTENT_GUIDE.md#norwegian-vocabulary)

### Code Comments

Explain WHY, not WHAT. Remove obvious comments.

```typescript
// ✅ GOOD - Non-obvious logic
// Day 24 completion awards trophy badge

// ❌ BAD - Obvious action
// Loop through items
```

### File Organization

- Components: `src/components/` (windows/, modules/, ui/)
- Game logic: `lib/game-engine.ts`, `lib/systems/`, `lib/generators/`, `lib/validators/`
- Content: `src/data/*.json` (single source of truth)
- Types: `types/`

### Code Maintenance

**No deprecated code** - Delete obsolete code, don't comment out. Git is your safety net.

## Component Behaviors

**NisseMail**: Split-view inbox (30/70), unread tracking, "NY" badges
**Dagbok**: Julius' video diary (`JuliusVideo`, also Snøfall TV K3). Today's video opens on login with «NY MELDING FRA JULIUS» until played to the end (`GameEngine.markJuliusVideoWatched`); transcript after watching, `GameEngine.getJuliusPs(day)` after the code (bonus and day-20 «krypto mangler» variants). Day texts 2–24 (titles, mail, PS, alerts, NisseNet files): `python3 scripts/oppdrag-innhold.py` from `docs/manus/app-tekster-2026.md`; `kodelekkasje.test.ts` fails if a kid-visible text shows a code early. Transcripts: `python3 scripts/julius-transcripts.py` → `src/data/julius_videoer.json`
**Dag 1-åpning (T14)**: `ui/Day1Opener.tsx`: `Day1Boot` (page.tsx, first login on 1 Dec) and `Day1Tail` (after Julius day-1 video); once each via `GameEngine.isIntroSeen/markIntroSeen`, click skips. Rune lines (T12) under Kulde's ghost line: `snofall-tv/runer.ts` + `RuneText learned=`, unlearned letters as frost.
**Snøfall TV**: four channels (`snofall-tv/channels.ts`) play video loops from `MEDIA_DIR`. Village events (letter birds, tower light) are drawn on canvas in code (`landsby-overlays.ts`) and only cut into `landsby-rolig`, never into other loops. **Runes**: `GameEngine.getLearnedRunes()` = letters of solved word codes plus E and T on day 1 (day 5 and 22 give none, so U comes on day 7 and B on day 18). **Brev til Julius** are stored in `nissekomm-santa-letters` and synced, one entry per day and writer (`from`, name buttons Kristian/Håkon/Hanna; old letters have none). The guide's Brevfugler page shows name and date and prints.
**IQs sledesimulator** (K4 «TEKNISK HUD» from day 8, `snofall-tv/SledeSimulator.tsx`): pseudo-3D canvas game, pure play after the code. Stages, course and the pure simulation live in `snofall-tv/slede.ts` (`etapperFor(day)`: nine stages on days 8, 9, 12, 14, 18, 19, 20, 21, 24, data-driven via `blanding`; `dagensUtfordring(day, etappe)` is the day's challenge, +500 at the finish); sound in `slede-lyd.ts` on `SoundManager.context()`; best score and bells per stage via `GameEngine.recordSledeResultat` (`nissekomm-slede`, synced). Painted horizons `feed/slede-*.jpg` come from `assets/locations/sledeflukt` (`still.sh`), with a procedural ridge as fallback. Stage names and HUD text must never contain a code word (`komponentlekkasje`); a stage name is visible from its day, so Nordlys-strømmen cannot open before day 18 (code NORDLYS on day 17). Game-feel notes: `docs/slede-sjanger.md`.
**Brevfugler**: sky over Snøfall (`feed/landsby-rolig.jpg` from `MEDIA_DIR`, fallback `/village-day.jpg`) with pixel birds; the blue bird circles Nordtoppen from day 14; day 24's thaw plays once (`isIntroSeen("brev-tint")`).
**Kalender**: 3 day states (locked/available/completed), modal on click → opens NisseMail
**SymbolScanner**: QR camera plus a 4-character card code printed under each QR (`SHORT_CODES` in `symbol-system.ts`, never change once printed). `parseSymbolCode` accepts both; a card is refused before its `symbol_clue` day in December. No camera, denied, or http on a LAN IP (no secure context) → typed code only. `symbolskanner.test.ts` ties printout to parser; `gjennomspilling` types the code on each symbol day.
**Medieinventar**: generators write `<fil>.meta.json` (source text, reference images, prompt hash; `assets/bin/medie.py`) and skip files that are current unless `--force`. `mise run inventar` writes `assets/INVENTAR.md` and `public/media-inventar.json` (shown on the guide's media page via `/api/media/inventar`).
**Tidbits**: small surprises (secret words, wrong-code jokes, TV frequencies, SPAM folder, calendar lines, Snøfall-statistikk, hidden track, NisseNet MORO files, idle Rampenissen) all come from `src/data/tidbits.json`; schema in `docs/tidbits.md`, helpers in `lib/tidbits.ts`. Covered by `kodelekkasje.test.ts`.
**KodeTerminal**: 1.5s processing delay, case-insensitive validation, gold flash on success
**Nissespill** (Ugleposten, from day 4): point-and-click side story in `windows/nissespill/`. `motor.ts` is the engine as pure functions over `EventyrSave` (GameEngine.getEventyrSave/saveEventyr, synced key); chapters are data (`kapittel1.ts`–`kapittel4.ts`, registry in `kapitler.ts`, unlock days 4/10/16/22 via `spilldag()`; `Nissespill.test.tsx` plays every chapter through the engine). Conditions take `alle`/`en_av`; optional owl feathers (`Scene.fjaer`, `EventyrSave.fjaer`); mini-puzzles (lock, sliding tiles, radio, route) are pure logic in `minispill.ts`, UI in `Puslespill.tsx`; data format at the top of `motor.ts`. Rampenissen's lines are nordlandsk, others bokmål; no clues or codes for the daily puzzles (`kodelekkasje.test.ts` scans every chapter from its day; avoid code words such as «lykt», «kulde», «turbo» even inside other words). Stills and pixel portraits live under `spill/` in the media manifest (`assets/bin/portrett.sh`, `piksel.sh`).

📖 **Complete behaviors** → [IMPLEMENTATION.md#component-behaviors](./IMPLEMENTATION.md)

## Environment Configuration

**Key `.env.local` Settings**:

```bash
# Test Mode & Date Mocking
NEXT_PUBLIC_TEST_MODE=false              # Bypass date restrictions
NEXT_PUBLIC_BOOT_ANIMATION_DURATION=2    # 0 = skip
NEXT_PUBLIC_MOCK_DAY=                    # 1-24 for testing
NEXT_PUBLIC_MOCK_MONTH=                  # 1-12 for testing

# One family (no registration)
KID_CODE=                                # Kids' login (three words, e.g. "snø lykt rein")
PARENT_CODE=                             # Parent guide login
NISSEKOMM_MODE=lan                       # 'public' (kid app only) or 'lan' (guide, dev pages)

# Storage and media
DATABASE_URL=                            # PostgreSQL; progress is synced via /api/state
MEDIA_DIR=                               # Video/audio library (not in the repo), served at /media/*
STORAGE_BACKEND=                         # server | localStorage; unset = server when DATABASE_URL is set
```

`mise run dev` sets dev codes and lan mode. Multi-tenancy, Sanity and Resend are gone; one family logs in with `KID_CODE` (parent guide: `PARENT_CODE`). `NISSEKOMM_MODE=lan` enables the guide, `/dev`, `/mcp` and the simulation panel; `public` serves the kid app only (the default in production). Progress lives in Postgres (in-memory store without `DATABASE_URL`); a season reset (`DELETE /api/state`, parent only) clears the server too, so every screen resets. The MCP server at `/mcp` (Bearer JWT, tools in `src/lib/mcp/tools.ts`) is the home integration; `/api/home-bridge` is gone. `get_kid_context` (Varden) hides an unsolved day's pieces as «[skjult]»; the piece list is `src/data/gaatebiter.json`, tested against `docs/gaater-2026.md`. It aims for 9 KB (`KID_TARGET_BYTES`): older solved days as title, PS and a one-sentence recap, files capped at 300 characters; then logs, file text and old PS go first.

**Date Mocking**: Set `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` to test specific days across entire app. In `next dev` or with `NEXT_PUBLIC_TEST_MODE=true`, the TIDSMASKIN button (bottom right) opens a panel that sets day and time live («Gå til dag med fremgang» also solves earlier days via `sim.solveUntil`) via a localStorage override in `date-utils.ts`, and can reset progress.

📖 **Complete API** → [ARCHITECTURE.md#date-handling-system](./ARCHITECTURE.md#date-handling-system)

## Quality Checklist

**Before Committing**:

- [ ] Run `pnpm check` (type checking + linting)
- [ ] All text in Norwegian (except code comments)
- [ ] VT323 font used consistently
- [ ] Thin brass title bars on windows (2 px)
- [ ] Animations on all interactions
- [ ] Colors from CSS custom properties
- [ ] StorageManager for all persistence
- [ ] TypeScript strict mode compliance
- [ ] Update this AGENTS.md if architecture changed

**Design Consistency**:

- [ ] Parchment/ice (`--neon-green`) = primary UI; green only for northern lights, success and LEDs
- [ ] Red = errors
- [ ] Gold = success/completion
- [ ] Amber/ice blue (`--cold-blue`) = info/hints
- [ ] Gray = locked/disabled

## Development Workflow

1. **Assume dev server is running** at <http://localhost:3000>
2. Make changes to components/content
3. Browser auto-reloads on save
4. Test in browser (use `NEXT_PUBLIC_TEST_MODE=true` for testing all days)
5. Run `pnpm check` before finishing session
6. Update this document if you changed architecture/patterns

## Future Enhancements

**Planned Features** (Phase 2+):

- Reactive sidebar widgets (update on code submissions)
- Full-screen glitch effects for dramatic feedback

---

**Version**: Phase 1
**Last Updated**: November 2025
**Target Audience**: Children ages 9-12 (Norwegian-speaking)
**Maintained By**: AI Coding Agents (keep this doc in sync with code!)

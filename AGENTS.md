# NisseKomm - Development Guide for AI Agents

> **Important**: Keep this document updated when making changes to the project. Always run `pnpm run check` at the end of coding sessions to verify code quality. Assume the dev server is already running at <http://localhost:3000>.
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
- **localStorage** (via StorageManager abstraction)

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
2. **Bonusoppdrag** (Side Quests): Parent-validated crisis missions (Day 11, 16) with badge rewards
3. **Eventyr** (Story Arcs): 2 multi-day narratives spanning Days 3-12 and 14-24
4. **Nice List** (Days 22-24): Name registration → personalized finale message
5. **Symboler** (Symbol Collection): 9 physical QR cards → 3 NisseKrypto decryption challenges

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
**Dagbok**: Continuous scroll, IntersectionObserver for read tracking, auto-scroll to first unread
**Kalender**: 3 day states (locked/available/completed), modal on click → opens NisseMail
**KodeTerminal**: 1.5s processing delay, case-insensitive validation, gold flash on success

📖 **Complete behaviors** → [IMPLEMENTATION.md#component-behaviors](./IMPLEMENTATION.md)

## Environment Configuration

**Key `.env.local` Settings**:

```bash
# Test Mode & Date Mocking
NEXT_PUBLIC_TEST_MODE=false              # Bypass date restrictions
NEXT_PUBLIC_BOOT_PASSWORD=NISSEKODE2025
NEXT_PUBLIC_BOOT_ANIMATION_DURATION=2    # 0 = skip
NEXT_PUBLIC_MOCK_DAY=                    # 1-24 for testing
NEXT_PUBLIC_MOCK_MONTH=                  # 1-12 for testing

# Storage Backend (Phase 1: Sanity Integration)
NEXT_PUBLIC_STORAGE_BACKEND=localStorage  # 'localStorage' or 'sanity'

# Sanity CMS Configuration (required when STORAGE_BACKEND=sanity)
NEXT_PUBLIC_SANITY_PROJECT_ID=            # Your Sanity project ID
NEXT_PUBLIC_SANITY_DATASET=production     # 'production' or 'development'
NEXT_PUBLIC_SANITY_API_VERSION=2024-11-01 # API version
SANITY_API_TOKEN=                         # Write token (server-side only)
```

**Storage Backend Modes**:

- **localStorage** (default): Browser-only storage, no cross-device sync
- **sanity**: Cross-device persistence via Sanity CMS backend

**Multi-Tenancy Architecture**:

The boot password serves dual purpose:

1. **Authentication**: Grants access to NisseKomm interface
2. **Tenant Identifier**: Creates isolated game sessions for each family

When using Sanity backend:

- Each unique boot password creates a separate tenant/family session
- Password is hashed (SHA-256) and used as `sessionId` in Sanity
- Same password on different devices = same game progress (cross-device sync)
- Different passwords = completely isolated sessions (multi-family support)
- Cookie stores hashed password for session persistence

**Example Multi-Tenant Setup**:

```bash
# Family Hansen uses: HANSEN2024
# Family Olsen uses: OLSEN2024
# Each family sees only their own progress
# Each family can access from multiple devices
```

**Date Mocking**: Set `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` to test specific days across entire app.

📖 **Complete API** → [ARCHITECTURE.md#date-handling-system](./ARCHITECTURE.md#date-handling-system)

## Quality Checklist

**Before Committing**:

- [ ] Run `pnpm run check` (type checking + linting)
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
5. Run `pnpm run check` before finishing session
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

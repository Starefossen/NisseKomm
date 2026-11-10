# NisseKomm - System Architecture

> Technical architecture patterns, state management, and system design decisions.

## Table of Contents

- [Layout & Component Hierarchy](#layout--component-hierarchy)
- [Application Modules](#application-modules)
- [State Management](#state-management)
- [Architecture Principles (Facade Pattern)](#architecture-principles-facade-pattern)
- [Data Architecture](#data-architecture)
- [Date Handling System & Tidsmaskin](#date-handling-system--tidsmaskin)
- [Authentication (One Family)](#authentication-one-family)
- [Operational Modes (NISSEKOMM_MODE)](#operational-modes-nissekomm_mode)
- [Media Delivery](#media-delivery)
- [Notifications](#notifications)

## Layout & Component Hierarchy

### CRT Frame Structure

```text
┌─ CRT Frame (fullscreen) ───────────────┐
│ ┌─ Sidebar (w-56) ┬─ Main (rest) ────┐ │
│ │ System Status   │ Desktop Icons    │ │
│ │ Alert Feed      │ or Active Window │ │
│ └─────────────────┴──────────────────┘ │
└─────────────────────────────────────────┘
```

### Key Concepts

- **Single window paradigm**: Only one app window open at a time (desktop icons hide when window opens)
- **Persistent sidebar**: Always shows system metrics and scrolling alerts
- **Modal windows**: Centered overlays with retro window chrome
- **Desktop grid**: 2×3 icon layout (6 core modules + 4 unlockable modules)

### Component Hierarchy

```
CRTFrame (fullscreen container)
├── Sidebar (lg:w-56: Frostgraden, 3 alerts)
│   ├── SystemStatus (metrics widget)
│   └── VarselKonsoll (scrolling alerts)
└── Main (75% width)
    ├── DesktopGrid (icon layout)
    │   ├── Core Icons (6 always visible)
    │   └── Unlockable Icons (4 conditional)
    └── ActiveWindow (single window at a time)
        ├── RetroWindow (chrome wrapper)
        └── Module Component (content)
```

## Application Modules

### Core Desktop Modules (Always Available)

1. **NisseMail** (`windows/NisseMail.tsx`)
   - Email inbox showing daily missions from Rampenissen
   - Unread badge on desktop icon
   - Split-view: 30% inbox | 70% content
   - Read tracking per email

2. **KodeTerminal** (`windows/KodeTerminal.tsx`)
   - Code submission interface
   - Validation with 1.5s processing delay
   - History of submitted codes
   - Parent validation checkbox for bonusoppdrag

3. **NisseNet Utforsker** (`windows/NisseNetUtforsker.tsx`)
   - File browser with folder tree navigation
   - Hint files and flavor text
   - Dynamic Nice List injection (Days 22-24)
   - Unread file indicators

4. **Kalender** (`windows/Kalender.tsx`)
   - 24-day grid (December 1-24)
   - Day states: locked/available/completed
   - Modal with mission preview
   - Direct integration with NisseMail

5. **EventyrOversikt** (`windows/EventyrOversikt.tsx`)
   - Story arc visualization
   - Progress line for the single eventyr `spokelseskoden`
   - Phase-by-phase breakdown
   - Unlocks: Day 8

6. **Julius' Dagbok** (`windows/Dagbok.tsx`)
   - Continuous scroll timeline
   - Quest-gated entries (prevents spoilers)
   - Unread tracking with auto-scroll
   - IntersectionObserver for read detection

### Unlockable Modules (Conditional Appearance)

1. **NISSEKRYPTO** (`windows/NisseKrypto.tsx`)
   - **Unlocks**: Day 4 completion
   - Decryption challenges (3 progressive puzzles)
   - Drag-drop symbol interface
   - Attempt tracking and hints

2. **SYMBOLSKANNER** (`windows/SymbolScanner.tsx`)
   - **Unlocks**: Day 4 completion
   - QR code scanner for symbol cards
   - Manual code entry fallback
   - Camera management with proper cleanup

3. **NISSEMUSIKK** (`windows/NisseMusikk.tsx`)
   - **Unlocks**: Day 6 completion
   - Christmas music player (Snøfall Radio)
   - Background audio control

4. **BREVFUGLER** (`windows/Brevfugler.tsx`)
   - **Unlocks**: Day 14 completion
   - Letters to Julius, stored in `nissekomm-santa-letters` and synced between screens
   - Origami-style paper birds

### Module Unlock Logic

Unlocks are configured in quest JSON files (`uke1-4_oppdrag.json`):

```json
{
  "dag": 4,
  "reveals": {
    "modules": ["NISSEKRYPTO", "SYMBOLSKANNER"]
  }
}
```

GameEngine dynamically determines available modules:

```typescript
static getUnlockedModules(): string[] {
  const completedDays = this.getCompletedDays();
  const allQuests = getAllQuests();

  const modules = new Set<string>();
  allQuests.forEach(quest => {
    if (completedDays.has(quest.dag) && quest.reveals?.modules) {
      quest.reveals.modules.forEach(m => modules.add(m));
    }
  });

  return Array.from(modules);
}
```

## State Management

### Storage Architecture

Game state lives on the server (PostgreSQL via `/api/state`, selected by `STORAGE_BACKEND` or by `DATABASE_URL` being set). Each screen keeps a `localStorage` cache and syncs through `ServerSyncAdapter`. Without a server store it runs on `localStorage` alone:

- **Client Storage (`StorageManager`)**: `lib/storage.ts` provides a type-safe interface over `LocalStorageAdapter`. All UI reads and writes go through `GameEngine` or `StorageManager`.
- **Server Store (`Store`)**: `lib/db.ts` provides persistent state storage. When `DATABASE_URL` is set, it connects to PostgreSQL (with `kv`, `sessions`, and `login_failures` tables, migrated with an advisory lock). When `DATABASE_URL` is unset, an in-memory store (`createMemoryStore()`) is used (development, testing).
- **Season reset**: `DELETE /api/state` (parent session only) calls `resetState()`, which clears every synced key and the server-written keys (`frost-override`, `day-offset`), so all screens start over.
- **State Sync (`/api/state`)**: Clients sync game progress through `GET /api/state` and `PUT /api/state`. Only whitelisted keys (`STATE_KEYS`) are allowed. Keys that can be updated concurrently across multiple screens (`MERGED_KEYS`) are merged per item/day instead of overwritten. State writes trigger notifications via `notify()`.

### StorageManager Pattern

**Purpose**: Centralized localStorage abstraction with type-safe methods.

**Location**: `lib/storage.ts`

**Key Methods**:

```typescript
// Game State (via GameEngine only)
static getCompletedDaysForMissions(): Set<number>
static addSubmittedCode(day: number, code: string, timestamp: string)
static getCollectedSymbols(): DecryptionSymbol[]
static addCollectedSymbol(symbol: DecryptionSymbol)

// UI State (direct access allowed)
static isAuthenticated(): boolean
static setAuthenticated(value: boolean)
static getPlayerNames(): string[]
static addPlayerName(name: string)
static getDagbokLastRead(): number
static setDagbokLastRead(day: number)
```

### React State Patterns

**Component State Strategy** (in `page.tsx` and windows):

```typescript
// ✅ GOOD - Lazy initialization with StorageManager
const [isAuthenticated, setIsAuthenticated] = useState(() =>
  StorageManager.isAuthenticated(),
);

// ✅ GOOD - Sync both StorageManager and local state
const handleLogin = (password: string) => {
  if (validatePassword(password)) {
    StorageManager.setAuthenticated(true);
    setIsAuthenticated(true);
  }
};

// ❌ BAD - Loading state before lazy init
const [isAuthenticated, setIsAuthenticated] = useState(false);
useEffect(() => {
  setIsAuthenticated(StorageManager.isAuthenticated()); // Flash!
}, []);
```

**State Types**:

- **Persistent** (server store, cached in localStorage via StorageManager): Authentication, progress, read status, preferences
- **Session-only** (React state): Open window, selected day, UI interactions
- **Derived** (computed): Unlocked modules, available quests, eventyr progress

## Architecture Principles (Facade Pattern)

### Critical Design Pattern

The codebase follows a strict **Facade Pattern** with clear boundaries between UI, game logic, domain systems, and persistence layers.

### Layer Responsibilities

1. **GameEngine** (`lib/game-engine.ts`) - **Single Entry Point**
   - Central orchestration layer for ALL game state operations
   - UI components MUST call GameEngine methods, NEVER StorageManager directly
   - Provides type-safe accessor methods for reading game state
   - Delegates to specialized domain systems for cohesive features
   - Examples: `submitCode()`, `getCompletedDays()`, `getSolvedDecryptions()`

2. **Domain Systems** (`lib/systems/`, `lib/generators/`, `lib/validators/`)
   - Specialized modules for cohesive features
   - Self-contained logic with clear responsibilities
   - Can be imported directly by GameEngine or UI when appropriate
   - Examples:
     - `symbol-system.ts` - Symbol collection and validation
     - `alert-generator.ts` - Dynamic alert creation
     - `quest-validator.ts` - Quest data validation
     - `badge-system.ts` - Achievement tracking

3. **Data Loader** (`lib/data-loader.ts`) - **Content Abstraction**
   - Centralized loading and validation of quest data from JSON files
   - Build-time validation ensures data integrity before app runs
   - Provides clean API: `getAllQuests()`, `getQuestByDay(day)`
   - Separates data concerns from game logic
   - GameEngine imports from data-loader instead of directly loading JSON

4. **StorageManager** (`lib/storage.ts`) - **Internal Use Only**
   - Direct access from UI components is PROHIBITED for game state
   - Only GameEngine and domain systems should call StorageManager
   - Type-safe localStorage abstraction
   - Easy to swap for backend API in future

5. **UI Components** (`src/components/`, `src/app/`)
   - Call GameEngine methods for game state operations
   - Import domain systems directly only for pure utilities
   - May access StorageManager ONLY for pure UI state

### Acceptable StorageManager Direct Access

UI components may call StorageManager directly for **non-game state** concerns:

- **Authentication**: `isAuthenticated()`, `setAuthenticated(value)` - Session management
- **Player Names**: `getPlayerNames()`, `setPlayerNames()` - Day 23 finale names
- **Diary Tracking**: `getDagbokLastRead()`, `setDagbokLastRead()` - Scroll position memory
- **Visit Tracking**: `setNisseNetLastVisit()`, `hasUnreadNiceList()` - UI badge state
- **Admin Tools**: `clearAll()`, `addEarnedBadge()`, `removeEarnedBadge()` - Parent guide only

### Code Examples

```typescript
// ❌ BAD - UI directly accessing game state
const completedDays = StorageManager.getCompletedDaysForMissions();
const codes = StorageManager.getSubmittedCodes();
const symbols = StorageManager.getCollectedSymbols();

// ✅ GOOD - UI calls GameEngine facade
const completedDays = GameEngine.getCompletedDays();
const codes = GameEngine.getSubmittedCodes();
const symbols = GameEngine.getCollectedSymbols();

// ✅ ACCEPTABLE - Pure UI state
const isLoggedIn = StorageManager.isAuthenticated();
const lastRead = StorageManager.getDagbokLastRead();
const playerNames = StorageManager.getPlayerNames();
```

### Why This Pattern?

- **Encapsulation**: Game logic centralized, easier to test and maintain
- **Type Safety**: GameEngine provides properly typed interfaces
- **Flexibility**: Can add caching, validation, or backend without changing UI
- **Clarity**: Clear ownership - UI asks GameEngine "what should I show?"
- **Testing**: Mock GameEngine instead of StorageManager for unit tests

## Data Architecture

### Content Files

**Quest Data** (in `src/data/`):

- `uke1_oppdrag.json` - Days 1-6 (Week 1)
- `uke2_oppdrag.json` - Days 7-12 (Week 2)
- `uke3_oppdrag.json` - Days 13-18 (Week 3)
- `uke4_oppdrag.json` - Days 19-24 (Week 4)
- `statisk_innhold.json` - File system, alerts, NisseStats global metrics
- `eventyr.json` - The one story arc, `spokelseskoden`, with milestones
- `merker.json` - Badge/achievement definitions

### Data Loader (`lib/data-loader.ts`)

**Purpose**: Centralized quest data loading and validation (separates data from game logic).

**Build-time Validation**:

- Quest structure integrity
- File references exist
- Topic dependencies resolved
- Eventyr references valid
- Symbol references complete
- Progressive hints structure

**Public API**:

```typescript
// Get all 24 quests (sorted by day)
const allQuests = getAllQuests();

// Get specific quest (returns undefined if not found)
const quest = getQuestByDay(12);

// Internal: Merge weeks and validate
const validated = mergeAndValidate();
```

**Usage Pattern**:

```typescript
// ✅ GOOD - Use data-loader API
import { getAllQuests, getQuestByDay } from "@/lib/data-loader";
const quests = getAllQuests();

// ❌ BAD - Direct JSON import
import uke1 from "@/data/uke1_oppdrag.json";
```

### Content Principles

- **Quest-driven unlocking**: Mission content drives diary entries, modules, badges
- **Separation of concerns**: Static content separate from quest progression
- **Norwegian language**: All content in Norwegian for authentic experience
- **Easy editing**: JSON files allow content changes without code modifications
- **Build-time safety**: Validation catches errors before app runs

## Date Handling System & Tidsmaskin

### Critical: Centralized Date Utilities

**ALL date/time operations MUST go through** `src/lib/date-utils.ts`. Direct `new Date()` usage is prohibited.

### Core Functions

```typescript
// Get current date with mock support
const today = getCurrentDate();

// Get current day (1-31)
const currentDay = getCurrentDay();

// Get current month (1-12)
const currentMonth = getCurrentMonth();

// Check if calendar is active (Dec 1-24)
const isActive = isCalendarActive();

// Check if specific quest day is accessible
const canAccess = isDayAccessible(12);

// Get ISO string with mock support
const isoString = getISOString();

// Format helpers
const dateStr = formatDate(new Date());
const dateTimeStr = formatDateTime(new Date());

// Debug current configuration
const debugInfo = getDateDebugInfo();
```

### Mock Support & Tidsmaskin

Environment variables override system date:

```bash
# Mock specific day (1-31)
NEXT_PUBLIC_MOCK_DAY=12

# Mock specific month (1-12)
NEXT_PUBLIC_MOCK_MONTH=12
```

**Tidsmaskin (Time Machine)**:
Interactive time-travel tool for testing advent progression (`src/lib/date-utils.ts`):

- **Availability**: Active in development (`NODE_ENV !== "production"`) or when `NEXT_PUBLIC_TEST_MODE="true"` (`isTimeMachineEnabled()`). In production builds without test mode, `isTimeMachineEnabled()` returns `false` and overrides are ignored.
- **Storage**: Time override is persisted in `localStorage` under `nissekomm-tidsmaskin` with `{ day, month, hour, minute }`.
- **Clock Resolution Priority**:
  1. Tidsmaskin `localStorage` override (seconds continue ticking from the system clock)
  2. `NEXT_PUBLIC_MOCK_DAY` and `NEXT_PUBLIC_MOCK_MONTH` environment variables
  3. Real system time (`new Date()`)

### Usage Pattern

```typescript
// ❌ BAD - Direct date usage
const today = new Date();
const currentDay = today.getDate();
const isDecember = today.getMonth() === 11;

// ✅ GOOD - Centralized date utilities
import {
  getCurrentDay,
  getCurrentMonth,
  isDayAccessible,
} from "@/lib/date-utils";
const currentDay = getCurrentDay();
const isDecember = getCurrentMonth() === 12;
const canAccessDay = isDayAccessible(currentDay);
```

### Why Centralized Date Handling?

- **Testability**: Easy to mock dates for testing all 24 days
- **Consistency**: Single source of truth for date logic
- **Flexibility**: Can swap implementation without changing call sites
- **Debug**: Clear visibility into date configuration

## Authentication (One Family)

### Dual-Code System

NisseKomm serves one family with two pre-shared codes configured as environment variables (`src/lib/auth.ts`):

1. **Kid Code (`KID_CODE`)**:
   - Used by children to log in from the boot terminal.
   - Example: three Norwegian words separated by spaces (`snø lykt rein`).
   - Grants the `kid` role.

2. **Parent Code (`PARENT_CODE`)**:
   - Used by parents to access `/nissemor-guide`.
   - Only accessible in LAN mode (`NISSEKOMM_MODE=lan`).
   - Grants the `parent` role.

### Login & Session Handling

- **Normalization**: User input is normalized with `normalizeCode()` (lowercased, trimmed, and runs of whitespace or hyphens collapsed to single spaces).
- **Constant-Time Verification**: Plaintext codes are hashed with SHA-256 and compared using `crypto.timingSafeEqual()` against the hashed environment variables.
- **Sessions & Cookies**: On successful login via `POST /api/auth/login`, a random 32-byte token is generated. Its SHA-256 digest is stored in the server store (`Store.setSession`), and the token is issued in an HTTP-only `__Host-nissekomm` cookie (`SESSION_COOKIE`).
  - `kid` sessions expire after 45 days.
  - `parent` sessions expire after 12 hours.
- **Verification & Logout**: `GET /api/auth/verify` validates the session token from the cookie against the store. `POST /api/auth/logout` removes the session from the store and clears the cookie.
- **Brute-Force Throttling**: Failed login attempts are recorded in the store. After 20 failures in a 10-minute window, subsequent attempts are throttled at 1 request per second.

## Operational Modes (NISSEKOMM_MODE)

Controlled by `NISSEKOMM_MODE=public|lan` (`src/lib/mode.ts`). Unset defaults to `lan` in development and `public` in production (fail-closed):

- **`public`**: Serves only the kid-facing advent calendar app.
- **`lan`**: Enables the parent guide (`/nissemor-guide`), developer pages (`/dev`), `/mcp`, and test panels (`isLanOnlyPath`). Parent session validation fails on public mode instances.

## Media Delivery

Media files (MP4 video, MP3 audio, CRT feeds) are served from `MEDIA_DIR` instead of being bundled in git (`src/lib/media.ts`, `src/lib/media-server.ts`):

- **Directory Resolution**: `mediaDir()` reads `process.env.MEDIA_DIR`. If unset, it falls back to `public/` in development and `/data/media` in production.
- **Route Handler**: Served via `/media/[...path]` (`src/app/media/[...path]/route.ts`). `/api/media` reports library status and takes uploads for the parent guide (and MCP `list_assets`/`upload_asset`).
- **HTTP Range Support**: `serveMedia` supports `Range` headers, enabling video and audio seeking in players.
- **URL Generation**: `mediaUrl(path)` encodes path segments for safe URLs.
- **Manifests**: Track definitions for Snøfall Radio (chip-tune audio), Julius video diaries, ambient sounds, and camera feeds.

## MCP Server

`/mcp` (Streamable HTTP, `lan` mode only) is the home integration. `Authorization: Bearer` with a Kanidm JWT, validated with `jose` (`src/lib/mcp/auth.ts`). `read` tools (`get_state`, `get_clips`, `get_today_quest`, `get_progress`) never return codes or answers; `parent` tools (`give_hint`, `set_frost`, `skip_day`, `reset`, `list_assets`, `upload_asset`) are for the operator. Tools live in `src/lib/mcp/tools.ts`.

## Notifications

Outgoing notifications fan out from server-side state writes in `/api/state` (`src/lib/notify/`):

- **Events**: Triggered on milestones and game moments (`day_solved`, `milestone`, `bonus_approved`, `frost_on`, `frost_off`, `season_complete`).
- **Channels**: Controlled by `NOTIFY_CHANNELS` (comma-separated, empty by default):
  - `log`: Console logging.
  - `email`: Parent notifications.
  - `varden`: iMessage integration hook.
  - `skjerm`: Display card integration.
- **Resilience**: `notify()` catches errors per channel; failing channels log errors without crashing requests or affecting other channels.

---

**Last Updated**: November 2026
**Maintained By**: AI Coding Agents
